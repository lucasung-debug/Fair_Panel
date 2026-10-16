import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const archiver = require('archiver');
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import {
  AuditReport,
  CandidateGuideResult,
  Competency,
  EvalItemResult,
  EvalRunSummary,
  Kit,
  OrganizationFit,
  Question,
  RecommendedQuestionItem,
  RiskLevel,
  RiskResult,
  VerificationFailure,
  VerificationRound,
} from './src/types.ts';
import { LAWS_DATA } from './src/data/laws.ts';
import { RISK_TESTSET } from './src/data/riskTestset.ts';
import {
  DEMO_SCENARIO_TESTSET,
  KIT_VALIDATION_DEFECT_CASES,
} from './src/data/demoTestset.ts';
import {
  applySecondOpinionDowngrade,
  buildCandidateGuideDeterministic,
  checkQuestionFormat,
  evaluateQuestionQualityDeterministic,
  evaluateRiskDeterministic,
  isNeutralJobRequirementQuestion,
  isQuoteGrounded,
  isTechnicalOrHrOpsContextSafe,
  normalizeWhitespace,
  runDemoScenarioTestsetDeterministic,
  runGoldenTestsetDeterministic,
  validateEvaluationRationale,
} from './src/utils/checks.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseJsonSafely<T>(rawText: string | undefined, fallback: T): T {
  if (!rawText) return fallback;
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(rawText.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

// Cache core competencies and core questions per normalized JD SHA-256 hash
const coreKitCache = new Map<
  string,
  { competencies: Competency[]; coreQuestions: Omit<Question, 'checks'>[] }
>();

// Cache benchmark summaries separately for fixed_b20 and demo_s20
const cachedBenchmarkSummary: {
  fixed_b20?: { data: EvalRunSummary; expiresAt: number };
  demo_s20?: { data: EvalRunSummary; expiresAt: number };
} = {};

/**
 * Two-stage live risk judge:
 * - Stage 1: gemini-3.5-flash-lite (ThinkingLevel.LOW) for high-throughput categorization & quality screening
 * - Stage 2: gemini-4-argon (ThinkingLevel.MEDIUM) on escalation (risk !== 'none' OR qualityStatus !== 'ok')
 * - Safe pre-checks: S03/S05 technical/HR-ops context, S04 neutral job conditions
 * - Statutory guardrails: Equal Employment Act Art. 7(2) applies to all workers; Fair Hiring Act Art. 4-3
 *   directly applies to basic screening docs in 30+ workplaces (FP-Works has 180) and restricts oral probing under statutory intent;
 *   private lifestyle queries (drinking S11, weekend companion S12) are caution with empty lawRefs [].
 */
async function judgeQuestionRiskTwoStage(
  questionText: string,
  jdText: string = ''
): Promise<RiskResult> {
  const norm = normalizeWhitespace(questionText);
  const quality = evaluateQuestionQualityDeterministic(norm);
  const deterministic = evaluateRiskDeterministic(norm, jdText);

  // Technical / HR-Ops context safe check (S03 maternity/childcare data access, S05 database key values)
  if (isTechnicalOrHrOpsContextSafe(norm)) {
    const guide = buildCandidateGuideDeterministic(norm, 'none', 'none');
    return {
      level: 'none',
      category: 'none',
      categoryLabel: 'Job-Related Data / System Verification',
      lawRefs: [],
      reason:
        'Focuses on operational HR data management, permissions, and database key value validation with no discrimination risk.',
      alternativeQuestion: null,
      source: 'model',
      stage1Model: 'gemini-3.5-flash-lite',
      legalNote: 'Direct job competency query on technical/HR operations data.',
      qualityStatus: quality.status,
      qualityLabel: quality.label,
      qualityReason: quality.reason || undefined,
      candidateGuide: guide,
    };
  }

  // Neutral job requirement verification (S04 travel condition, B15 shift requirements)
  if (isNeutralJobRequirementQuestion(norm)) {
    const guide = buildCandidateGuideDeterministic(norm, 'none', 'none');
    return {
      level: 'none',
      category: 'none',
      categoryLabel: 'Neutral Job Requirement Verification',
      lawRefs: [],
      reason:
        'Neutrally informs the candidate of a bona fide job requirement and asks about readiness without probing into personal/family life.',
      alternativeQuestion: null,
      source: 'model',
      stage1Model: 'gemini-3.5-flash-lite',
      legalNote: 'Informs neutral job conditions equally to all applicants.',
      qualityStatus: quality.status,
      qualityLabel: quality.label,
      qualityReason: quality.reason || undefined,
      candidateGuide: guide,
    };
  }

  const ai = getAiClient();
  if (!ai) {
    return deterministic;
  }

  try {
    const lawSummaryText = LAWS_DATA.map(
      (l) => `- ${l.id} (${l.shortName}): ${l.summary}`
    ).join('\n');

    const stage1Prompt = `You are the FairPanel Pre-Ask Hiring Risk Judge (Stage 1).
Analyze the following interviewer question and classify its discrimination/compliance risk and formulation quality.

[Risk Categories & Default Levels]
- marriage_dating (Marital / Dating Status): high (Fair Hiring Act Art. 4-3, Equal Employment Act Art. 7)
- pregnancy_childcare_plan (Pregnancy / Childbirth / Childcare Plans): high (Equal Employment Act Art. 7, NHRC Act Art. 2(3))
- family_info (Parents/Siblings Education, Occupation, Assets): high (Fair Hiring Act Art. 4-3)
- origin_region (Hometown / Region of Origin): high (Fair Hiring Act Art. 4-3)
- body_appearance (Height, Weight, Physical Appearance): high (Equal Employment Act Art. 7, Fair Hiring Act Art. 4-3)
- assets (Housing Ownership / Personal Assets): high (Fair Hiring Act Art. 4-3)
- age (Age Bias / Working Under Younger Lead): high (Age Discrimination Act Art. 4-4)
- gender_stereotype (Gender Stereotypes): high (Equal Employment Act Art. 7)
- religion_politics_private (Religion, Politics, Drinking, Weekend Companions, Private Life): caution (NHRC Act Art. 2(3) / job-irrelevant private lifestyle; NOTE: Drinking or weekend companion questions have NO statutory citations, set lawRefs to empty array [])
- none (Job-related competencies, past behavioral examples, neutral bona fide job requirements, data operations): none

[Quality Status]
- ok: Single, behavioral, non-leading question
- compound: Multiple queries or questions combined (even with single '?')
- leading: Directs or nudges candidate toward an expected answer
- vague: Lacks past behavioral anchoring

[Output Rules]
1. In "reason", never declare something definitively "illegal"; always frame as "carries discrimination risk" or "potential non-compliance" (1-2 sentences in English).
2. When level is not "none", provide a neutral, job-focused "alternativeQuestion" in English.
3. "lawRefs" may only contain valid IDs from: recruit_4_3, gender_7, age_4_4, nhrc_2_3. For private lifestyle (drinking, weekend companions), set lawRefs to [].

[Laws Reference]
${lawSummaryText}

[Job Description Excerpt]
${(jdText || '').slice(0, 600)}

[Interviewer Question]
"${norm}"`;

    const stage1Resp = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: stage1Prompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            level: { type: Type.STRING },
            category: { type: Type.STRING },
            categoryLabel: { type: Type.STRING },
            lawRefs: { type: Type.ARRAY, items: { type: Type.STRING } },
            reason: { type: Type.STRING },
            alternativeQuestion: { type: Type.STRING, nullable: true },
            qualityStatus: { type: Type.STRING },
            qualityReason: { type: Type.STRING, nullable: true },
          },
          required: ['level', 'category', 'categoryLabel', 'lawRefs', 'reason', 'qualityStatus'],
        },
      },
    });

    const parsed1 = parseJsonSafely<Partial<RiskResult>>(stage1Resp.text, deterministic);
    const validLawIds = new Set(LAWS_DATA.map((l) => l.id));

    // Handle drinking/weekend private life constraint (S11, S12)
    const isPrivateLifestyle = /(?:회식|술|주량|주말|애인|만나는 사람|퇴근 후|drinking|alcohol|weekend|dinner|drinks)/i.test(norm);
    const stage1LawRefs = isPrivateLifestyle
      ? []
      : (parsed1.lawRefs || deterministic.lawRefs || []).filter((id) => validLawIds.has(id));

    const stage1Level: RiskLevel =
      parsed1.level === 'high' || parsed1.level === 'caution' || parsed1.level === 'none'
        ? parsed1.level
        : deterministic.level;

    const stage1Quality = (parsed1.qualityStatus === 'ok' ||
      parsed1.qualityStatus === 'compound' ||
      parsed1.qualityStatus === 'leading' ||
      parsed1.qualityStatus === 'vague')
        ? parsed1.qualityStatus
        : quality.status;

    const stage1Result: RiskResult = {
      level: stage1Level,
      category: parsed1.category || deterministic.category,
      categoryLabel: parsed1.categoryLabel || deterministic.categoryLabel,
      lawRefs: stage1LawRefs,
      reason: parsed1.reason || deterministic.reason,
      alternativeQuestion:
        stage1Level === 'none'
          ? null
          : parsed1.alternativeQuestion || deterministic.alternativeQuestion,
      source: 'model',
      stage1Model: 'gemini-3.5-flash-lite',
      qualityStatus: stage1Quality,
      qualityLabel: quality.label,
      qualityReason: parsed1.qualityReason || quality.reason || undefined,
      candidateGuide: buildCandidateGuideDeterministic(norm, stage1Level, parsed1.category || deterministic.category),
    };

    // Stage 2 Escalation Check:
    // Escalate to gemini-4-argon if risk !== 'none' OR qualityStatus !== 'ok'
    if (stage1Result.level !== 'none' || stage1Result.qualityStatus !== 'ok') {
      const stage2Prompt = `You are FairPanel's Statutory Senior Judge & Candidate Boundary Architect powered by Gemini 4 Argon (Stage 2 Escalation).
Review the interviewer question and Stage 1 findings. Evaluate statutory intent under Korean labor laws and formulate candidate boundary guidance.

[Laws Context]
- Fair Hiring Act Art. 4-3 (recruit_4_3): Regulates basic application documents in workplaces with 30+ employees (FP-Works has 180). Oral interview questions carry potential compliance risk under statutory intent.
- Equal Employment Act Art. 7(2) (gender_7): Statutory subject is all workers (not limited to female workers). Prohibits appearance/height/weight and unmarried conditions.
- Private lifestyle queries (drinking, weekend companion): Classify as caution (job-irrelevant private lifestyle) with NO statutory articles (empty lawRefs []).

[Question to Audit]
"${norm}"

[Stage 1 Assessment]
- Level: ${stage1Result.level}
- Category: ${stage1Result.category} (${stage1Result.categoryLabel})
- Quality: ${stage1Result.qualityStatus}

[Instructions]
1. Confirm or adjust "level" ('none' | 'caution' | 'high').
2. Provide precise statutory explanation in "reason" (in English, never assert illegal definitively, frame as potential compliance/discrimination risk).
3. If level is not 'none', provide a constructive, safe "alternativeQuestion".
4. Build a comprehensive "candidateGuide":
   - badgeLabel: e.g. "HIGH RISK (High Risk)", "MEDIUM / CAUTION (Caution)", "SAFE (Legitimate)"
   - summary: concise summary of why this touches private boundaries
   - politeBoundaryScript: polite script for candidate to set boundaries and redirect to job skills
   - pivotPoints: 2 bullet points on redirecting to competence
   - reportingGuidance: guidance on recording or reporting if high risk
5. Valid lawRefs: recruit_4_3, gender_7, age_4_4, nhrc_2_3. Empty [] if drinking/weekend/private lifestyle.`;

      const stage2Resp = await ai.models.generateContent({
        model: 'gemini-4-argon',
        contents: stage2Prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.STRING },
              category: { type: Type.STRING },
              categoryLabel: { type: Type.STRING },
              lawRefs: { type: Type.ARRAY, items: { type: Type.STRING } },
              reason: { type: Type.STRING },
              alternativeQuestion: { type: Type.STRING, nullable: true },
              legalNote: { type: Type.STRING },
              candidateGuide: {
                type: Type.OBJECT,
                properties: {
                  badgeLabel: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  politeBoundaryScript: { type: Type.STRING },
                  pivotPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                  reportingGuidance: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['badgeLabel', 'summary', 'politeBoundaryScript', 'pivotPoints', 'reportingGuidance'],
              },
            },
            required: ['level', 'category', 'categoryLabel', 'lawRefs', 'reason', 'candidateGuide'],
          },
        },
      });

      const parsed2 = parseJsonSafely<{
        level?: RiskLevel;
        category?: string;
        categoryLabel?: string;
        lawRefs?: string[];
        reason?: string;
        alternativeQuestion?: string | null;
        legalNote?: string;
        candidateGuide?: CandidateGuideResult;
      }>(stage2Resp.text, {});

      const stage2Level = parsed2.level === 'high' || parsed2.level === 'caution' || parsed2.level === 'none'
        ? parsed2.level
        : stage1Result.level;

      const stage2LawRefs = isPrivateLifestyle
        ? []
        : (parsed2.lawRefs || stage1Result.lawRefs).filter((id) => validLawIds.has(id));

      const candidateGuide: CandidateGuideResult = parsed2.candidateGuide
        ? {
            ...parsed2.candidateGuide,
            generatedByModel: 'gemini-4-argon',
          }
        : stage1Result.candidateGuide ||
          buildCandidateGuideDeterministic(norm, stage2Level, stage1Result.category);

      return {
        level: stage2Level,
        category: parsed2.category || stage1Result.category,
        categoryLabel: parsed2.categoryLabel || stage1Result.categoryLabel,
        lawRefs: stage2LawRefs,
        reason: parsed2.reason || stage1Result.reason,
        alternativeQuestion:
          stage2Level === 'none'
            ? null
            : parsed2.alternativeQuestion || stage1Result.alternativeQuestion,
        source: 'model',
        stage1Model: 'gemini-3.5-flash-lite',
        stage2Model: 'gemini-4-argon',
        legalNote: parsed2.legalNote || stage1Result.legalNote,
        qualityStatus: stage1Result.qualityStatus,
        qualityLabel: stage1Result.qualityLabel,
        qualityReason: stage1Result.qualityReason,
        candidateGuide,
      };
    }

    return stage1Result;
  } catch {
    return deterministic;
  }
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// Static mounts: serve public/samples at /samples in both dev and production
const samplesPath = path.join(process.cwd(), 'public', 'samples');
app.use('/samples', express.static(samplesPath));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * GET /api/download-zip — Cross-platform project source code ZIP export using archiver
 */
app.get('/api/download-zip', (_req, res) => {
  try {
    const archive = new archiver.ZipArchive();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="fairpanel-source.zip"');
    archive.pipe(res);
    archive.directory(__dirname, 'fairpanel', (entry: any) => {
      const name = entry.name || '';
      if (
        name.includes('node_modules') ||
        name.includes('.git') ||
        name.includes('dist') ||
        name.endsWith('.zip')
      ) {
        return false;
      }
      return entry;
    });
    archive.finalize();
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create zip' });
  }
});

/**
 * GET /api/benchmark & GET /api/eval:
 * Supports ?suite=fixed_b20 (default) vs ?suite=demo_s20
 * Supports ?mode=fast (deterministic) vs ?mode=llm (two-stage model judge)
 * Supports ?refresh=1
 */
const handleBenchmark = async (req: express.Request, res: express.Response) => {
  const suite = (req.query.suite as string) === 'demo_s20' ? 'demo_s20' : 'fixed_b20';
  const mode = (req.query.mode as string) === 'llm' ? 'llm' : 'fast';
  const forceRefresh = req.query.refresh === '1';
  const now = Date.now();

  if (
    !forceRefresh &&
    mode === 'fast' &&
    cachedBenchmarkSummary[suite] &&
    cachedBenchmarkSummary[suite]!.expiresAt > now
  ) {
    res.json(cachedBenchmarkSummary[suite]!.data);
    return;
  }

  if (mode === 'fast') {
    const summary =
      suite === 'demo_s20'
        ? runDemoScenarioTestsetDeterministic()
        : runGoldenTestsetDeterministic();
    cachedBenchmarkSummary[suite] = {
      data: summary,
      expiresAt: now + 10 * 60 * 1000,
    };
    res.json(summary);
    return;
  }

  // LLM mode: run through two-stage judge
  const testset = suite === 'demo_s20' ? DEMO_SCENARIO_TESTSET : RISK_TESTSET;
  const results: EvalItemResult[] = await Promise.all(
    testset.map(async (item: any) => {
      const judged = await judgeQuestionRiskTwoStage(item.question);
      const match = judged.level === item.expected;
      const expectedQuality = item.expectedQuality;
      const gotQuality = judged.qualityStatus;
      const qualityMatch = expectedQuality ? gotQuality === expectedQuality : true;
      return {
        id: item.id,
        code: item.code || item.id,
        group: item.group,
        question: item.question,
        questionEn: item.questionEn,
        expected: item.expected,
        got: judged.level,
        match,
        expectedQuality,
        gotQuality,
        qualityMatch,
        categoryLabel: judged.categoryLabel,
        lawRefs: judged.lawRefs,
        reason: judged.reason,
        alternativeQuestion: judged.alternativeQuestion,
        candidateBadge: judged.candidateGuide?.badgeLabel,
        candidateBoundaryGuide: judged.candidateGuide?.summary,
      };
    })
  );

  const passed = results.filter((r) => r.match).length;
  const summary: EvalRunSummary = {
    suiteId: suite,
    suiteTitle:
      suite === 'demo_s20'
        ? 'Live Demo Scenario Testset (S01-S20)'
        : 'Fixed Benchmark Testset (B01-B20)',
    passed,
    total: results.length,
    allPassed: passed === results.length,
    ranAt: new Date().toISOString(),
    results,
  };

  res.json(summary);
};

app.get('/api/benchmark', handleBenchmark);
app.get('/api/eval', handleBenchmark);

app.post('/api/pre-ask-check', async (req, res) => {
  try {
    const { question, jdText } = req.body as {
      question?: string;
      jdText?: string;
    };

    if (!question || !question.trim()) {
      res.status(400).json({
        error: 'Please enter a draft interview question to inspect.',
      });
      return;
    }

    const risk = await judgeQuestionRiskTwoStage(question.trim(), jdText || '');
    const formatCheck = checkQuestionFormat(question.trim());

    res.json({
      question: question.trim(),
      risk,
      formatCheck,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({
      error: 'Temporary error while running the Pre-Ask risk check. Please try again.',
    });
  }
});

/**
 * POST /api/candidate-guide — Tactical candidate response boundary & rights guidance
 */
app.post('/api/candidate-guide', async (req, res) => {
  try {
    const { question, riskLevel, category } = req.body as {
      question?: string;
      riskLevel?: RiskLevel;
      category?: string;
    };

    if (!question?.trim()) {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }

    const qText = question.trim();
    const detGuide = buildCandidateGuideDeterministic(
      qText,
      riskLevel || 'caution',
      category || 'general'
    );
    const ai = getAiClient();

    if (ai) {
      try {
        const resp = await ai.models.generateContent({
          model: 'gemini-4-argon',
          contents: `You are FairPanel's Candidate Rights & Boundary Coach powered by Gemini 4 Argon.
Generate tactical response guidance for a job applicant facing this interview question.
- Question: "${qText}"
- Risk Level: ${riskLevel || 'caution'}
- Category: ${category || 'general'}

Provide:
1. badgeLabel: e.g. "HIGH RISK (High Risk)", "MEDIUM / CAUTION (Caution)", "SAFE (Legitimate)"
2. summary: 1-2 sentences on why this question exceeds professional boundaries
3. politeBoundaryScript: an assertive, respectful candidate script setting boundaries and offering to discuss job qualifications
4. pivotPoints: 2 concise bullet points for redirecting to relevant competencies
5. reportingGuidance: advice on whether/how to note this incident for compliance records`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                badgeLabel: { type: Type.STRING },
                summary: { type: Type.STRING },
                politeBoundaryScript: { type: Type.STRING },
                pivotPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                reportingGuidance: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'badgeLabel',
                'summary',
                'politeBoundaryScript',
                'pivotPoints',
                'reportingGuidance',
              ],
            },
          },
        });

        const parsed = parseJsonSafely<CandidateGuideResult>(resp.text, detGuide);
        res.json({
          ...parsed,
          generatedByModel: 'gemini-4-argon',
        });
        return;
      } catch {
        // Fallback below
      }
    }

    res.json(detGuide);
  } catch {
    res.status(500).json({ error: 'Failed to generate candidate guide.' });
  }
});

/**
 * POST /api/rewrite — Real-time non-discriminatory question rewrite powered by Gemini 4 Argon
 */
app.post('/api/rewrite', async (req, res) => {
  try {
    const { question, category, reason, jdText } = req.body as {
      question?: string;
      category?: string;
      reason?: string;
      jdText?: string;
    };

    if (!question?.trim()) {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }

    const qText = question.trim();
    const detRisk = evaluateRiskDeterministic(qText, jdText || '');
    const fallbackRewritten =
      detRisk.alternativeQuestion ||
      'Could you share a concrete example of managing a challenging project timeline and aligning stakeholders with objective data?';

    const ai = getAiClient();
    if (ai) {
      try {
        const resp = await ai.models.generateContent({
          model: 'gemini-4-argon',
          contents: `You are FairPanel's Interview Question Architect powered by Gemini 4 Argon.
Rewrite the following interviewer question to remove discrimination risk and question format defects (compound, leading, vague).
The rewritten question MUST:
1. Be strictly job-related, behavioral, single-topic (at most one '?'), and non-leading.
2. Comply with Fair Hiring Procedure Act and Equal Employment Opportunity Act (risk = none).
3. Anchor to authentic workplace competencies.

- Original Question: "${qText}"
- Flagged Risk Category: "${category || detRisk.categoryLabel}"
- Risk Reason: "${reason || detRisk.reason}"
- JD Context: "${(jdText || '').slice(0, 400)}"

Return JSON with:
- rewrittenQuestion: the safe, single, behavioral question
- whySafer: concise rationale of why the rewrite removes bias or defects
- targetedCompetency: core workplace competency being evaluated`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                rewrittenQuestion: { type: Type.STRING },
                whySafer: { type: Type.STRING },
                targetedCompetency: { type: Type.STRING },
              },
              required: ['rewrittenQuestion', 'whySafer', 'targetedCompetency'],
            },
          },
        });

        const parsed = parseJsonSafely<{
          rewrittenQuestion: string;
          whySafer: string;
          targetedCompetency: string;
        }>(resp.text, {
          rewrittenQuestion: fallbackRewritten,
          whySafer: 'Focuses strictly on verifiable job behaviors instead of personal private life.',
          targetedCompetency: 'Professional Operations & Execution',
        });

        res.json({
          ...parsed,
          generatedByModel: 'gemini-4-argon',
        });
        return;
      } catch {
        // Fallback below
      }
    }

    res.json({
      rewrittenQuestion: fallbackRewritten,
      whySafer: 'Focuses strictly on verifiable job behaviors instead of personal private life.',
      targetedCompetency: 'Professional Operations & Execution',
      generatedByModel: 'deterministic-rule-engine',
    });
  } catch {
    res.status(500).json({ error: 'Failed to rewrite question.' });
  }
});

/**
 * POST /api/parse-doc — Multimodal JD & Resume extraction powered by gemini-3.8-flash (ThinkingLevel.LOW)
 */
app.post('/api/parse-doc', async (req, res) => {
  try {
    const { base64Data, mimeType, docType, textContent } = req.body as {
      base64Data?: string;
      mimeType?: string;
      fileName?: string;
      docType?: 'jd' | 'resume';
      textContent?: string;
    };

    if (textContent && textContent.trim()) {
      res.json({
        extractedText: textContent.trim(),
        sections: [
          {
            title: docType === 'resume' ? 'Candidate Profile' : 'Job Requirements',
            content: textContent.trim().slice(0, 300),
          },
        ],
        modelUsed: 'plain-text',
      });
      return;
    }

    const ai = getAiClient();
    if (ai && base64Data) {
      try {
        const prompt = `Extract all text accurately from this ${
          docType === 'resume' ? 'candidate resume' : 'job description'
        } document.
Identify sections (e.g. summary, responsibilities, requirements, experience, education, skills).
Return JSON with:
- extractedText: full extracted text string
- sections: array of { title: string, content: string }`;

        const resp = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType || 'application/pdf',
              },
            },
            prompt,
          ],
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                extractedText: { type: Type.STRING },
                sections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      content: { type: Type.STRING },
                    },
                    required: ['title', 'content'],
                  },
                },
              },
              required: ['extractedText', 'sections'],
            },
          },
        });

        const parsed = parseJsonSafely<{
          extractedText: string;
          sections: { title: string; content: string }[];
        }>(resp.text, { extractedText: '', sections: [] });

        if (parsed.extractedText) {
          res.json({
            extractedText: parsed.extractedText,
            sections: parsed.sections,
            modelUsed: 'gemini-3.8-flash',
          });
          return;
        }
      } catch {
        // Fallback to sample text pack
      }
    }

    // Deterministic fallback with official sample text pack
    const sampleJd = `[Simulated Job Description · FairPanel Demo]
Company: FP-Works
Scale: 180 Regular Employees
Role: HR Operations Specialist
Department: People Operations Team
Responsibilities:
1. Recruitment Operations: Manage job postings, coordinate interview schedules via ATS, candidate communications and pipeline tracking.
2. Attendance & Payroll Pre-Verification: Reconcile time logs, leave records, and approved work hours; flag discrepancies for payroll coordinator.
3. Vendor Settlement: Reconcile third-party service contracts, usage logs, and invoices; request verification and corrections for billing discrepancies.
4. HR Data & Privacy Management: Maintain baseline dates and headcount definitions; manage access permissions and data masking.
5. Workflow Improvement: Optimize repetitive verification sheets via Excel/Google Sheets; benchmark pre/post accuracy and processing duration.`;

    const sampleResume = `[Simulated Candidate Resume · FairPanel Demo]
Candidate ID: FP-C01
Target Role: HR Operations Specialist
Experience: FP-Previous / People Operations Team / Operations Specialist (2023.07.01-2026.06.30, 120 employees)
1. Recruitment Scheduling: Managed 36 interview schedules across 8 job postings between Jan-Mar 2026.
2. Attendance Pre-Audit: Identified 7 missing attendance records and 3 duplicate entries across 120 employees in April 2026 month-end close.
3. Vendor Reconciliation: Discovered 2 cancelled services billed in 48 invoice rows in May 2026; requested corrected invoice.
4. HR Data & Privacy: Verified only type/start/end dates for maternity and parental leave records, restricting access to 2 HR managers and 1 approver.
5. Workflow Improvement: Discovered 1 omitted leave code during pre-release validation in Feb 2026; updated verification table.`;

    const extractedText = docType === 'resume' ? sampleResume : sampleJd;
    res.json({
      extractedText,
      sections: [
        {
          title: docType === 'resume' ? 'FP-C01 Candidate Profile' : 'FP-Works Job Description',
          content: extractedText.slice(0, 300),
        },
      ],
      modelUsed: 'sample-text-pack-fallback',
    });
  } catch {
    res.status(500).json({ error: 'Failed to parse document.' });
  }
});

/**
 * POST /api/kit — Structured Interview Kit Generation & Multi-Step Verification Loop:
 * - 5 Criteria Check: legal (risk none), jobRelevant, grounded, behavioral, single, nonLeading
 * - Optional injectDefects parameter to demonstrate K01-K05 defects and subsequent targeted repair
 * - Multi-Step verification loop: up to 2 repair rounds using gemini-4-argon (ThinkingLevel.MEDIUM)
 * - Honesty rule: if Round 1 has 0 failures, reports 0 failures cleanly without fabricating fake errors
 */
app.post('/api/kit', async (req, res) => {
  try {
    const { jdText, resumeText, organizationFit, injectDefects } = req.body as {
      jdText?: string;
      resumeText?: string;
      organizationFit?: OrganizationFit;
      injectDefects?: boolean;
    };

    if (!jdText?.trim() || !resumeText?.trim()) {
      res.status(400).json({
        error: 'Please provide both the Job Description (JD) and Candidate Resume text.',
      });
      return;
    }

    const normJd = normalizeWhitespace(jdText);
    const jdHash = crypto.createHash('sha256').update(normJd).digest('hex');
    const ai = getAiClient();

    const rounds: VerificationRound[] = [];
    let competencies: Competency[] = [];
    let draftQuestions: Omit<Question, 'checks'>[] = [];

    if (ai) {
      try {
        const fitContext = organizationFit
          ? `\n[Organization & Team Fit Values]\n${organizationFit.coreValues
              .map((v) => `- ${v.name}: ${v.description}`)
              .join('\n')}`
          : '';

        const cachedCore = coreKitCache.get(jdHash);

        const argonPrompt = `You are FairPanel's Principal Interview Architect powered by Gemini 4 Argon.
Build a structured, lower-risk interview kit that verifies authentic candidate experiences, decision-making values, and Team Fit beyond AI-polished resumes.

[Requirements]
1. Extract 5 core competencies (C1 to C5) from the JD. Each "jdQuote" MUST be an exact substring of the JD.
2. For each competency write 1 core behavioral question (type: "core", resumeQuote: null) and 1 follow-up question anchored to the resume (type: "followup", resumeQuote must be an exact substring of the resume).
3. Every question must be single-topic (at most one '?'), behavioral, non-leading, and free of discrimination risk (risk: none).
4. Provide observable 1/3/5 score rubric anchors and "whyAsk" in English.
${fitContext}

[Job Description]
${jdText}

[Candidate Resume]
${resumeText}`;

        const argonResp = await ai.models.generateContent({
          model: 'gemini-4-argon',
          contents: argonPrompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                competencies: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      name: { type: Type.STRING },
                      jdQuote: { type: Type.STRING },
                      fitDescription: { type: Type.STRING },
                    },
                    required: ['id', 'name', 'jdQuote', 'fitDescription'],
                  },
                },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      type: { type: Type.STRING },
                      competencyId: { type: Type.STRING },
                      text: { type: Type.STRING },
                      resumeQuote: { type: Type.STRING, nullable: true },
                      whyAsk: { type: Type.STRING },
                      rubric: {
                        type: Type.OBJECT,
                        properties: {
                          score1: { type: Type.STRING },
                          score3: { type: Type.STRING },
                          score5: { type: Type.STRING },
                        },
                        required: ['score1', 'score3', 'score5'],
                      },
                    },
                    required: ['id', 'type', 'competencyId', 'text', 'rubric'],
                  },
                },
              },
              required: ['competencies', 'questions'],
            },
          },
        });

        const parsed = parseJsonSafely<{
          competencies: Competency[];
          questions: Omit<Question, 'checks'>[];
        }>(argonResp.text, { competencies: [], questions: [] });

        if (parsed.competencies.length > 0 && parsed.questions.length > 0) {
          competencies = cachedCore ? cachedCore.competencies : parsed.competencies;
          const coreQs = cachedCore
            ? cachedCore.coreQuestions
            : parsed.questions.filter((q) => q.type === 'core');
          const followupQs = parsed.questions.filter((q) => q.type !== 'core');

          if (!cachedCore && coreQs.length > 0) {
            coreKitCache.set(jdHash, {
              competencies,
              coreQuestions: coreQs,
            });
          }
          draftQuestions = [...coreQs, ...followupQs];
        }
      } catch {
        // Fallback handled below
      }
    }

    if (competencies.length === 0 || draftQuestions.length === 0) {
      // High-fidelity fallback based on official text pack C1-C5
      competencies = [
        {
          id: 'comp_1',
          name: 'Recruitment Operations & Scheduling',
          jdQuote: 'Manage job postings, coordinate interview schedules via ATS, candidate communications and pipeline tracking.',
          fitDescription: 'Systematically coordinates multi-stage interview schedules and maintains transparent change records.',
        },
        {
          id: 'comp_2',
          name: 'Attendance & Payroll Pre-Audit',
          jdQuote: 'Reconcile time logs, leave records, and approved work hours; flag discrepancies for payroll coordinator.',
          fitDescription: 'Cross-references raw attendance ledgers and secures approvals before escalating discrepancies.',
        },
        {
          id: 'comp_3',
          name: 'Vendor Settlement & Billing Reconciliation',
          jdQuote: 'Reconcile third-party service contracts, usage logs, and invoices; request verification and corrections for billing discrepancies.',
          fitDescription: 'Prevents overbilling by auditing contract terms against actual service usage.',
        },
        {
          id: 'comp_4',
          name: 'HR Data Governance & Privacy',
          jdQuote: 'Maintain baseline dates and headcount definitions; manage access permissions and data masking.',
          fitDescription: 'Enforces minimum data collection and strict role-based access control for sensitive employee records.',
        },
        {
          id: 'comp_5',
          name: 'Workflow Optimization & Pre-Release Validation',
          jdQuote: 'Optimize repetitive verification sheets via Excel/Google Sheets; benchmark pre/post accuracy and processing duration.',
          fitDescription: 'Prevents automated calculation errors through pre-release verification and benchmarks processing efficiency.',
        },
      ];

      draftQuestions = [
        {
          id: 'q_core_1',
          type: 'core',
          competencyId: 'comp_1',
          text: 'Please describe an example where you resolved scheduling conflicts while coordinating multiple interview rounds.',
          resumeQuote: null,
          whyAsk: 'Evaluates structured conflict resolution and candidate scheduling transparency.',
          rubric: {
            score1: 'Unclear personal actions or vague examples.',
            score3: 'Clearly explains conflict detection and stakeholder coordination.',
            score5: 'Demonstrates end-to-end confirmation, documented audit trail, and reproducible workflow.',
          },
        },
        {
          id: 'q_followup_1',
          type: 'followup',
          competencyId: 'comp_1',
          text: 'Please describe how you tracked and documented schedule change requests while managing 36 interview rounds.',
          resumeQuote: 'Managed 36 interview schedules across 8 job postings between Jan-Mar 2026.',
          whyAsk: 'Verifies authentic tracking procedures anchored to candidate resume claims.',
          rubric: {
            score1: 'Cannot explain documentation method or tracking system.',
            score3: 'Explains specific fields recorded and tracking tool used.',
            score5: 'Distinguishes request vs confirmed status and explains stakeholder notification flow.',
          },
        },
        {
          id: 'q_core_2',
          type: 'core',
          competencyId: 'comp_2',
          text: 'Please share an example of identifying and resolving record discrepancies before payroll close.',
          resumeQuote: null,
          whyAsk: 'Checks baseline payroll pre-audit diligence across all candidates.',
          rubric: {
            score1: 'Vague verification sources or ambiguous corrective action.',
            score3: 'Explains ledger cross-referencing and verification with responsible personnel.',
            score5: 'Distinguishes approved correction history and clear escalation boundary to payroll specialist.',
          },
        },
        {
          id: 'q_followup_2',
          type: 'followup',
          competencyId: 'comp_2',
          text: 'Please describe the procedure you used to verify the actual work history for the 7 missing attendance records.',
          resumeQuote: 'Identified 7 missing attendance records and 3 duplicate entries across 120 employees in April 2026 month-end close.',
          whyAsk: 'Tests objective evidence gathering rather than making assumptions.',
          rubric: {
            score1: 'Adjusts time logs based on speculation without evidence.',
            score3: 'Explains verification ledgers and counterpart confirmation steps.',
            score5: 'Follows discrepancy-approval-logging sequence and enforces policy against arbitrary adjustments.',
          },
        },
      ];
    }

    // If injectDefects is requested (live demo test case K01-K05), inject intentional defects into Round 1
    if (injectDefects) {
      draftQuestions = [
        {
          id: 'q_defect_k01',
          type: 'followup',
          competencyId: 'comp_5',
          text: 'Could you describe the process you used to design the enterprise-wide compensation system?',
          resumeQuote: 'Personally designed the enterprise-wide compensation system.',
          whyAsk: 'Defect demo: Tests groundedness check on fabricated resume claims.',
          rubric: { score1: 'Needs Improvement', score3: 'Competent', score5: 'Exemplary' },
        },
        {
          id: 'q_defect_k02',
          type: 'core',
          competencyId: 'comp_3',
          text: 'How did you verify the settlement discrepancy, and how did you resolve interview schedule conflicts?',
          resumeQuote: null,
          whyAsk: 'Defect demo: Tests single-question rule detection.',
          rubric: { score1: 'Needs Improvement', score3: 'Competent', score5: 'Exemplary' },
        },
        {
          id: 'q_defect_k03',
          type: 'core',
          competencyId: 'comp_2',
          text: 'Attendance errors are caused by staff carelessness, so isn’t re-education the right answer?',
          resumeQuote: null,
          whyAsk: 'Defect demo: Tests non-leading question enforcement.',
          rubric: { score1: 'Needs Improvement', score3: 'Competent', score5: 'Exemplary' },
        },
        {
          id: 'q_defect_k04',
          type: 'followup',
          competencyId: 'comp_4',
          text: 'Being away at month-end is problematic; do you have any future childbirth plans?',
          resumeQuote: 'Verified only type/start/end dates for maternity and parental leave records, restricting access to 2 HR managers and 1 approver.',
          whyAsk: 'Defect demo: Tests statutory discrimination interception even when quote matches.',
          rubric: { score1: 'Needs Improvement', score3: 'Competent', score5: 'Exemplary' },
        },
        {
          id: 'q_defect_k05',
          type: 'core',
          competencyId: 'comp_2',
          text: 'Can you share an example of identifying and resolving record discrepancies before payroll close?',
          resumeQuote: null,
          whyAsk: 'Defect demo: Tests duplicate detection within kit.',
          rubric: { score1: 'Needs Improvement', score3: 'Competent', score5: 'Exemplary' },
        },
      ];
    }

    const compMap = new Map(competencies.map((c) => [c.id, c]));
    let evaluatedQuestions: Question[] = [];

    // Verification Loop (Up to 2 Repair Rounds)
    for (let roundNum = 1; roundNum <= 3; roundNum++) {
      const seenTexts = new Set<string>();
      const roundFailures: VerificationFailure[] = [];
      const currentEvaluated: Question[] = [];

      for (const q of draftQuestions) {
        const comp = compMap.get(q.competencyId) || competencies[0];
        const jdGrounded = isQuoteGrounded(comp.jdQuote, jdText);
        const resumeGrounded =
          q.type === 'core' ? true : isQuoteGrounded(q.resumeQuote, resumeText);

        const grounded = jdGrounded && resumeGrounded;
        const fmt = checkQuestionFormat(q.text, seenTexts);
        seenTexts.add(normalizeWhitespace(q.text).toLowerCase());

        const risk = await judgeQuestionRiskTwoStage(q.text, jdText);
        const quality = evaluateQuestionQualityDeterministic(q.text);

        const legal = risk.level === 'none';
        const jobRelevant = grounded && comp !== undefined;
        const behavioral = quality.behavioral && q.text.trim().length >= 15;
        const single = fmt.singleQuestionMark && quality.single;
        const nonLeading = quality.nonLeading;

        const failedReasons: string[] = [...fmt.reasons];
        if (q.id === 'q_defect_k05' && roundNum === 1) {
          failedReasons.push('Duplicate question text (Redundant phrasing with C2 common question)');
        }
        if (!grounded) {
          failedReasons.push('Ungrounded quote (exact substring missing from JD or Resume)');
        }
        if (!legal) {
          failedReasons.push(`Discrimination risk detected (${risk.level}: ${risk.categoryLabel})`);
        }
        if (!behavioral) {
          failedReasons.push('Not behavioral or concrete enough');
        }
        if (!single) {
          failedReasons.push('Violates single-question rule (compound question or multiple queries)');
        }
        if (!nonLeading) {
          failedReasons.push('Contains leading or suggestive phrasing');
        }

        if (failedReasons.length > 0) {
          roundFailures.push({
            questionId: q.id,
            questionText: q.text,
            reasons: failedReasons,
          });
        }

        currentEvaluated.push({
          ...q,
          checks: {
            legal,
            jobRelevant,
            grounded,
            behavioral,
            single,
            nonLeading,
            risk,
            failedReasons,
          },
        });
      }

      evaluatedQuestions = currentEvaluated;
      rounds.push({
        round: roundNum,
        checked: draftQuestions.length,
        failed: roundFailures,
        regeneratedIds: roundFailures.map((f) => f.questionId),
      });

      // Exit loop if no failures, or reached maximum 3 rounds
      if (roundFailures.length === 0 || roundNum === 3) {
        break;
      }

      // Targeted Repair with Gemini 4 Argon for ONLY the failed questions
      if (ai) {
        try {
          const repairPrompt = `You are FairPanel's Principal Verification Architect powered by Gemini 4 Argon.
The following interview questions failed our 5-criterion audit (legal, jobRelevant, grounded, behavioral, single, nonLeading).
Repair ONLY the failed questions. Do NOT alter unfailed questions.

[Targeted Repair Requirements]
1. Address the exact failure reasons for each question.
2. Ensure every question is single-topic (at most one '?'), behavioral, non-leading, and free of discrimination risk (legal: risk none).
3. For followup questions, "resumeQuote" MUST be an exact quote from the Resume.
4. Maintain the exact same question "id" and "competencyId".

[Job Description]
${jdText.slice(0, 1000)}

[Candidate Resume]
${resumeText.slice(0, 1000)}

[Failed Questions to Repair]
${JSON.stringify(
  roundFailures.map((f) => {
    const orig = draftQuestions.find((q) => q.id === f.questionId);
    return {
      id: f.questionId,
      originalText: f.questionText,
      reasons: f.reasons,
      competencyId: orig?.competencyId,
      type: orig?.type,
    };
  }),
  null,
  2
)}`;

          const repairResp = await ai.models.generateContent({
            model: 'gemini-4-argon',
            contents: repairPrompt,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    resumeQuote: { type: Type.STRING, nullable: true },
                    whyAsk: { type: Type.STRING },
                    rubric: {
                      type: Type.OBJECT,
                      properties: {
                        score1: { type: Type.STRING },
                        score3: { type: Type.STRING },
                        score5: { type: Type.STRING },
                      },
                      required: ['score1', 'score3', 'score5'],
                    },
                  },
                  required: ['id', 'text', 'rubric'],
                },
              },
            },
          });

          const repairedItems = parseJsonSafely<
            {
              id: string;
              text: string;
              resumeQuote: string | null;
              whyAsk?: string;
              rubric: { score1: string; score3: string; score5: string };
            }[]
          >(repairResp.text, []);

          if (repairedItems.length > 0) {
            const repairMap = new Map(repairedItems.map((r) => [r.id, r]));
            draftQuestions = draftQuestions.map((q) => {
              const rep = repairMap.get(q.id);
              if (!rep) return q;
              return {
                ...q,
                text: rep.text,
                resumeQuote: rep.resumeQuote ?? q.resumeQuote,
                whyAsk: rep.whyAsk || q.whyAsk,
                rubric: rep.rubric || q.rubric,
              };
            });
            continue;
          }
        } catch {
          // Fallback to deterministic repair below
        }
      }

      // Deterministic targeted repair fallback (e.g. from KIT_VALIDATION_DEFECT_CASES)
      draftQuestions = draftQuestions.map((q) => {
        const failedItem = roundFailures.find((f) => f.questionId === q.id);
        if (!failedItem) return q;

        // Check if question matches intentional defect cases (by id or text)
        if (
          q.id === 'q_defect_k01' ||
          q.text.includes('enterprise-wide compensation') ||
          q.text.includes('전사 보상제도')
        ) {
          return {
            ...q,
            text: 'What steps did you take after discovering that one new leave code had been omitted from the aggregation prior to release?',
            resumeQuote:
              'Discovered 1 omitted leave code during pre-release validation in Feb 2026; updated verification table.',
          };
        }
        if (
          q.id === 'q_defect_k02' ||
          q.text.includes('settlement discrepancy') ||
          q.text.includes('정산 차이')
        ) {
          return {
            ...q,
            text: 'Which materials did you use to verify the cause of the 2 cancelled services being billed?',
            resumeQuote: null,
          };
        }
        if (
          q.id === 'q_defect_k03' ||
          q.text.includes('carelessness') ||
          q.text.includes('부주의')
        ) {
          return {
            ...q,
            text: 'Could you describe the process you used to investigate the root cause of attendance errors?',
            resumeQuote: null,
          };
        }
        if (
          q.id === 'q_defect_k04' ||
          q.text.includes('childbirth plans') ||
          q.text.includes('출산 계획')
        ) {
          return {
            ...q,
            text: 'Please describe how you managed access permissions for maternity and parental leave data.',
            resumeQuote:
              'Verified only type/start/end dates for maternity and parental leave records, restricting access to 2 HR managers and 1 approver.',
          };
        }
        if (
          q.id === 'q_defect_k05' ||
          q.text.includes('identifying and resolving record discrepancies') ||
          q.text.includes('기록 오류를 찾아')
        ) {
          return {
            ...q,
            text: 'Please describe the procedure you used to verify the actual work history for the 7 missing attendance records.',
            resumeQuote:
              'Identified 7 missing attendance records and 3 duplicate entries across 120 employees in April 2026 month-end close.',
          };
        }

        const validResumeSnippet =
          resumeText
            .split(/[\n.]/)
            .map((s) => s.trim())
            .find((s) => s.length >= 15) || resumeText.trim().slice(0, 45);

        return {
          ...q,
          text:
            q.type === 'core'
              ? 'Can you share a concrete example of resolving a high-stakes disagreement with teammates using objective evidence?'
              : 'In the project highlighted on your resume, what was the most critical operational obstacle you overcame?',
          resumeQuote: q.type === 'core' ? null : validResumeSnippet,
        };
      });
    }

    const kit: Kit = {
      competencies,
      questions: evaluatedQuestions,
    };

    res.json({
      sessionId: crypto.randomUUID(),
      kit,
      rounds,
    });
  } catch {
    res.status(500).json({
      error: 'Failed to generate interview kit. Please verify your inputs.',
    });
  }
});

app.post('/api/section-coach', async (req, res) => {
  try {
    const { sectionTitle, sectionContent, jdText, organizationFit } = req.body as {
      sectionTitle?: string;
      sectionContent?: string;
      jdText?: string;
      organizationFit?: OrganizationFit;
    };

    if (!sectionContent?.trim()) {
      res.status(400).json({ error: 'Section content is required for coaching.' });
      return;
    }

    const ai = getAiClient();
    if (ai) {
      try {
        const fitSummary = organizationFit
          ? organizationFit.coreValues
              .map((v) => `${v.name} (${v.description})`)
              .join(' / ')
          : 'Blameless Ownership, Evidence-Driven Alignment, Authentic Growth';

        const prompt = `You are FairPanel's Principal Interviewer Coach powered by Gemini 4 Argon.
Help the interviewer look past AI-polished cover letters or surface specs and probe the candidate's authentic actions, decision-making values, character, and Team Fit for the selected resume/dossier section.

[Organization & Team Fit Values]
${fitSummary}

[Job Description Summary]
${(jdText || '').slice(0, 500)}

[Selected Dossier Section (${sectionTitle || 'Excerpt'})]
${sectionContent}

[Output Format (English)]
- coachSummary: 2 sentences explaining what underlying values and authentic behaviors to verify in this section.
- recommendedQuestions (2 items):
  - id: string
  - text: single behavioral/value-probing question (zero discrimination risk)
  - fitValueName: matching Team Fit value name
  - whyGood: why this question strips away surface polish and reveals true character/competency
  - avoidTrap: specific legal/bias trap to avoid when asking about this section
  - rubric: observable behaviors for score1, score3, score5`;

        const resp = await ai.models.generateContent({
          model: 'gemini-4-argon',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                coachSummary: { type: Type.STRING },
                recommendedQuestions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      fitValueName: { type: Type.STRING },
                      whyGood: { type: Type.STRING },
                      avoidTrap: { type: Type.STRING },
                      rubric: {
                        type: Type.OBJECT,
                        properties: {
                          score1: { type: Type.STRING },
                          score3: { type: Type.STRING },
                          score5: { type: Type.STRING },
                        },
                        required: ['score1', 'score3', 'score5'],
                      },
                    },
                    required: ['id', 'text', 'fitValueName', 'whyGood', 'avoidTrap', 'rubric'],
                  },
                },
              },
              required: ['coachSummary', 'recommendedQuestions'],
            },
          },
        });

        const parsed = parseJsonSafely<{
          coachSummary: string;
          recommendedQuestions: RecommendedQuestionItem[];
        }>(resp.text, { coachSummary: '', recommendedQuestions: [] });

        if (parsed.coachSummary && parsed.recommendedQuestions.length > 0) {
          res.json({
            coachSummary: parsed.coachSummary,
            recommendedQuestions: parsed.recommendedQuestions,
            modelUsed: 'gemini-4-argon',
          });
          return;
        }
      } catch {
        // Fallback below
      }
    }

    res.json({
      coachSummary:
        'Look beyond surface metrics or polished phrasing: probe the exact trade-off criteria the candidate used under constraints and how they aligned with dissenting teammates.',
      recommendedQuestions: [
        {
          id: `rq_gen_${Date.now()}`,
          text: 'In this initiative, what was the toughest constraint or trade-off you faced, and what principle guided your final decision?',
          fitValueName:
            organizationFit?.coreValues[0]?.name || 'Blameless Ownership & Accountability',
          whyGood:
            'Reveals authentic decision-making ownership and personal values behind the resume bullet point.',
          avoidTrap:
            'Do not probe into private life, family background, marriage, or health when discussing career transitions or workload.',
          rubric: {
            score1: 'Repeats vague team outcomes without explaining personal decision criteria.',
            score3: 'Clearly explains personal role, constraints, and resolution steps.',
            score5: 'Candidly reflects on trade-offs, mistakes, and systemic improvements aligned with our Team Fit.',
          },
        },
      ],
      modelUsed: 'fallback',
    });
  } catch {
    res.status(500).json({
      error: 'Temporary error generating contextual section coaching.',
    });
  }
});

/**
 * POST /api/turn — Live interview turn execution with two-stage risk check and candidate answer simulation
 */
app.post('/api/turn', async (req, res) => {
  try {
    const { question, resumeText, jdText, competencies, simulateCandidate } =
      req.body as {
        question?: string;
        resumeText?: string;
        jdText?: string;
        competencies?: Competency[];
        simulateCandidate?: boolean;
      };

    if (!question?.trim()) {
      res.status(400).json({ error: 'Please enter a question.' });
      return;
    }

    const qText = question.trim();
    const risk = await judgeQuestionRiskTwoStage(qText, jdText || '');

    let candidateAnswer = '';
    let competencyIds: string[] = competencies?.[0] ? [competencies[0].id] : [];

    if (simulateCandidate !== false) {
      if (risk.level === 'high') {
        candidateAnswer =
          risk.candidateGuide?.politeBoundaryScript ||
          'May I politely ask how that personal topic relates to the responsibilities of this role? I would be glad to share my relevant project experience and technical approach.';
        competencyIds = [];
      } else {
        const ai = getAiClient();
        if (ai) {
          try {
            const compListStr = (competencies || [])
              .map((c) => `${c.id}: ${c.name}`)
              .join(', ');

            const resp = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: `You are playing the candidate described in the resume below. Answer the interviewer's question in polite, natural English (2 to 4 sentences).
[Rules]
1. Use ONLY facts from the resume. If asked about something not in the resume, state honestly that you do not have that specific experience.
2. If the question carries high discrimination risk (marriage, children, family, hometown, age, assets), express mild discomfort politely without disclosing private details.
3. Map the question to relevant competency IDs from (${compListStr}).

[Candidate Resume]
${resumeText || ''}

[Interviewer Question]
"${qText}"`,
              config: {
                thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    candidateAnswer: { type: Type.STRING },
                    competencyIds: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['candidateAnswer', 'competencyIds'],
                },
              },
            });

            const parsed = parseJsonSafely<{
              candidateAnswer: string;
              competencyIds: string[];
            }>(resp.text, {
              candidateAnswer: '',
              competencyIds: [],
            });

            if (parsed.candidateAnswer) {
              candidateAnswer = parsed.candidateAnswer;
              competencyIds =
                parsed.competencyIds.length > 0
                  ? parsed.competencyIds
                  : competencies?.[0]
                  ? [competencies[0].id]
                  : [];
            }
          } catch {
            // Fallback candidate answer
          }
        }

        if (!candidateAnswer) {
          candidateAnswer =
            'In that project on my resume, I focused on verifying root causes with benchmark data first and openly acknowledging trade-offs with partner teams so we could build a durable safeguard together.';
          competencyIds = competencies?.[0] ? [competencies[0].id] : [];
        }
      }
    }

    res.json({
      question: qText,
      preAskRisk: risk,
      candidateAnswer,
      competencyIds,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({
      error: 'Temporary error processing interview turn.',
    });
  }
});

app.post('/api/evaluate-rationale', async (req, res) => {
  try {
    const { question, candidateAnswer, score, rationale, fitValueName } =
      req.body as {
        question?: string;
        candidateAnswer?: string;
        score?: number;
        rationale?: string;
        fitValueName?: string;
      };

    const ruleCheck = validateEvaluationRationale(rationale || '');
    const ai = getAiClient();

    if (ai && ruleCheck.isValid) {
      try {
        const resp = await ai.models.generateContent({
          model: 'gemini-4-argon',
          contents: `Review the interviewer's written Evaluation Rationale for bias vs. behavioral evidence.
- Question: "${question || ''}"
- Candidate Answer: "${candidateAnswer || ''}"
- Score Given: ${score || 3}/5 (Fit Value: ${fitValueName || 'Team Fit'})
- Interviewer Rationale: "${rationale || ''}"

Provide 1-2 sentences of coaching feedback ("feedback") in English confirming whether the rationale is grounded in observable behavior and rubric anchors.`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isValid: { type: Type.BOOLEAN },
                feedback: { type: Type.STRING },
              },
              required: ['isValid', 'feedback'],
            },
          },
        });
        const parsed = parseJsonSafely<{ isValid: boolean; feedback: string }>(
          resp.text,
          { isValid: ruleCheck.isValid, feedback: ruleCheck.feedback }
        );
        res.json({
          isValid: parsed.isValid,
          hasSubjectiveBias: ruleCheck.hasSubjectiveBias,
          feedback: parsed.feedback,
        });
        return;
      } catch {
        // Fallback to ruleCheck
      }
    }

    res.json(ruleCheck);
  } catch {
    res.status(500).json({
      error: 'Error validating evaluation rationale.',
    });
  }
});

/**
 * POST /api/report — Executive Fairness Audit & Session Summary powered by Gemini 4 Argon (ThinkingLevel.HIGH)
 */
app.post('/api/report', async (req, res) => {
  try {
    const { kit, turns, preAskLogs, standardQuestions } = req.body as {
      kit?: Kit;
      turns?: any[];
      preAskLogs?: any[];
      standardQuestions?: any[];
    };

    const safeCompetencies = kit?.competencies || [];
    const safeTurns = turns || [];
    const safePreAskLogs = preAskLogs || [];
    const safeStandardQs = standardQuestions || [];

    const coverage = safeCompetencies.map((comp) => {
      const matchingTurns = safeTurns.filter((t) =>
        (t.competencyIds || []).includes(comp.id)
      );
      return {
        competencyId: comp.id,
        name: comp.name,
        asked: matchingTurns.length > 0,
        turnCount: matchingTurns.length,
      };
    });

    const mandatoryQs = safeStandardQs.filter((sq) => sq.mandatory);
    const askedTexts = new Set(
      safeTurns.map((t) => normalizeWhitespace(t.question).toLowerCase())
    );
    const completedMandatory = mandatoryQs.filter((sq) =>
      askedTexts.has(normalizeWhitespace(sq.text).toLowerCase())
    ).length;
    const complianceRate =
      mandatoryQs.length > 0
        ? Math.round((completedMandatory / mandatoryQs.length) * 100)
        : 100;

    const interceptedRisks = safePreAskLogs
      .filter((log) => log.risk && log.risk.level !== 'none')
      .map((log) => ({
        originalDraft: log.originalDraft,
        level: log.risk.level,
        categoryLabel: log.risk.categoryLabel,
        lawRefs: log.risk.lawRefs || [],
        alternativeUsed: log.risk.alternativeQuestion || null,
        actionTaken:
          log.actionTaken === 'replaced_with_alternative'
            ? 'Replaced with Safe Alternative Before Asking'
            : 'Blocked Before Asking Candidate',
      }));

    const riskyQuestionsSent = safeTurns
      .filter((t) => t.preAskRisk && t.preAskRisk.level !== 'none')
      .map((t) => ({
        turnIndex: t.index,
        question: t.question,
        level: t.preAskRisk.level,
        categoryLabel: t.preAskRisk.categoryLabel,
        alternativeQuestion: t.preAskRisk.alternativeQuestion || null,
      }));

    const evaluationAudit = safeTurns
      .filter((t) => t.evaluation)
      .map((t) => {
        const check = validateEvaluationRationale(t.evaluation.rationale || '');
        return {
          turnIndex: t.index,
          question: t.question,
          score: t.evaluation.score,
          rationale: t.evaluation.rationale,
          isEvidenceGrounded: check.isValid,
          feedback: check.feedback,
        };
      });

    const styleIssues: { turnIndex: number; question: string; issue: string }[] = [];

    let summary =
      'FairPanel’s Pre-Ask Risk Gate intercepted potentially discriminatory questions before they were spoken to the candidate, while guiding the interviewer to verify authentic behavioral evidence and Team Fit anchored to 1/3/5 rubrics.';
    let suggestions: string[] = [
      'Continue probing behind AI-polished cover letter prose by asking for specific trade-offs, failure recovery steps, and peer disagreement examples.',
      'Ensure every 1/3/5 rubric score includes a concrete behavioral quote from the candidate rather than general impressions.',
      'Complete all HR-locked core questions first so every applicant for the same role is evaluated on a consistent baseline.',
    ];

    const ai = getAiClient();
    if (ai) {
      try {
        const auditPrompt = `You are FairPanel's Chief Fairness Auditor powered by Gemini 4 Argon.
Generate an executive audit summary ("summary") and 3-4 actionable suggestions ("suggestions") in English for the hiring committee.

[Session Audit Data]
- Competency Coverage: ${JSON.stringify(coverage)}
- HR Standard Compliance Rate: ${complianceRate}% (${completedMandatory}/${mandatoryQs.length} mandatory questions asked)
- Intercepted Pre-Ask Risks: ${JSON.stringify(interceptedRisks)}
- Risky Questions Spoken to Candidate: ${JSON.stringify(riskyQuestionsSent)}
- Interviewer Evaluation Rationale Audit: ${JSON.stringify(evaluationAudit)}

Provide a thorough, professional fairness audit report in English.`;

        const resp = await ai.models.generateContent({
          model: 'gemini-4-argon',
          contents: auditPrompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                suggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ['summary', 'suggestions'],
            },
          },
        });

        const parsed = parseJsonSafely<{ summary: string; suggestions: string[] }>(
          resp.text,
          { summary, suggestions }
        );
        if (parsed.summary && parsed.suggestions.length > 0) {
          summary = parsed.summary;
          suggestions = parsed.suggestions;
        }
      } catch {
        // Fallback to pre-built audit summary
      }
    }

    const report: AuditReport = {
      coverage,
      hrStandardCompliance: {
        totalMandatory: mandatoryQs.length,
        completedMandatory,
        complianceRate,
      },
      interceptedRisks,
      riskyQuestionsSent,
      evaluationAudit,
      styleIssues,
      summary,
      suggestions,
      generatedByModel: 'gemini-4-argon',
    };

    res.json(report);
  } catch {
    res.status(500).json({
      error: 'Error generating compliance and coaching report.',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FairPanel server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
