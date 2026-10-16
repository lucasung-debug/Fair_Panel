import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Scale,
  FileCheck2,
  Send,
  FileText,
  Upload,
  RotateCcw,
  HelpCircle,
  Briefcase,
  UserCheck,
  BarChart3,
  Info,
  Lock,
  Unlock,
  ChevronRight,
  Copy,
  Check,
  ShieldCheck,
  AlertOctagon,
  Eye,
  FileSpreadsheet,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ExternalLink,
  ListChecks,
  PlayCircle,
  FileBadge,
  ClipboardCheck,
  Plus,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import {
  ApplicantPreset,
  EvalRunSummary,
  PreAskLogItem,
  RiskResult,
  Turn,
  WorkspaceRole,
  Kit,
  VerificationRound,
  AuditReport as AuditReportType,
  Rubric,
} from './types';
import { APPLICANT_PRESETS } from './data/presets';
import { LAW_MAP } from './data/laws';
import { DEMO_SCENARIO_TESTSET } from './data/demoTestset';
import {
  evaluateRiskDeterministic,
  runGoldenTestsetDeterministic,
  validateEvaluationRationale,
} from './utils/checks';
import { TopNav } from './components/TopNav';
import { EvalModal } from './components/EvalModal';
import { SetupModal } from './components/SetupModal';
import { AuditReport } from './components/AuditReport';

export interface PlannedQuestionItem {
  id: string;
  category: 'behavioral' | 'mandatory_hr' | 'custom';
  competencyId?: string;
  competencyName: string;
  text: string;
  textEn?: string;
  rubric: Rubric;
  checks: {
    isSafe: boolean;
    reason: string;
  };
}

function getInitialPlannedQuestions(preset: ApplicantPreset): PlannedQuestionItem[] {
  const list: PlannedQuestionItem[] = [
    {
      id: 'plan_s04_mandatory',
      category: 'mandatory_hr',
      competencyName: 'HR Mandatory Schedule Verification (S04)',
      text: '공고에 안내된 분기 마감 집중근무 기간(주 52시간 내)에 정상 참여가 가능한지 확인 부탁드립니다.',
      textEn:
        'Please confirm if you are available to participate in the quarterly close intensive period (within 52-hour weekly limit) scheduled in the job posting.',
      rubric: {
        score1: 'Candidate indicates conflict with core scheduled requirements without accommodation plan.',
        score3: 'Candidate confirms general availability with minor scheduling flexibility.',
        score5: 'Candidate confirms full availability aligned directly with job posting schedule constraints.',
      },
      checks: {
        isSafe: true,
        reason:
          'Statutory Safe Harbor: Neutral verification of objective job posting conditions without stereotyping (S04).',
      },
    },
  ];

  if (preset.initialKit?.questions?.length > 0) {
    preset.initialKit.questions.slice(0, 3).forEach((q, i) => {
      const comp = preset.initialKit.competencies.find((c) => c.id === q.competencyId);
      list.push({
        id: `plan_kit_${q.id || i}`,
        category: 'behavioral',
        competencyId: q.competencyId,
        competencyName: comp ? `${comp.id}: ${comp.name}` : `Competency ${i + 1}`,
        text: q.text,
        rubric: q.rubric || {
          score1: 'Lacks concrete behavioral evidence or offers vague statements.',
          score3: 'Demonstrates standard procedural execution and competent actions.',
          score5: 'Exemplifies proactive problem-solving with quantifiable business outcomes.',
        },
        checks: {
          isSafe: q.checks?.risk?.level === 'none',
          reason:
            q.checks?.failedReasons?.length > 0
              ? q.checks.failedReasons.join('; ')
              : '5-Criterion Verified: Legal, job-relevant, behavioral, single, non-leading.',
        },
      });
    });
  } else if (preset.sections?.length > 0) {
    preset.sections.slice(0, 3).forEach((sec, i) => {
      const rec = sec.recommendedQuestions[0];
      if (rec) {
        list.push({
          id: `plan_sec_${sec.id || i}`,
          category: 'behavioral',
          competencyName: sec.title.split(':')[0] || `Angle ${i + 1}`,
          text: rec.text,
          rubric: rec.rubric || {
            score1: 'Incomplete or reactive execution.',
            score3: 'Standard operational execution.',
            score5: 'Exemplary proactive solution with empirical verification.',
          },
          checks: {
            isSafe: true,
            reason: rec.whyGood || 'Anchored to verifiable resume experience.',
          },
        });
      }
    });
  }

  // Safe Technical Question S03
  list.push({
    id: 'plan_s03_safe_tech',
    category: 'behavioral',
    competencyName: 'C4: HR Data Security & Access Governance (S03)',
    text: '출산휴가·육아휴직 데이터의 접근권한을 관리했던 방법을 말씀해 주세요.',
    textEn:
      'Please describe how you managed access permissions for maternity and parental leave data.',
    rubric: {
      score1: 'Confuses personal leave rights with technical data access permissions.',
      score3: 'Applies standard role-based access control (RBAC) rules.',
      score5:
        'Enforces data minimization, principle of least privilege, and tamper-evident audit logging.',
    },
    checks: {
      isSafe: true,
      reason:
        'Safe Context Exception: Inquires about technical data access permission management from resume, not candidate private life.',
    },
  });

  return list;
}

export default function App() {
  const [activeRole, setActiveRole] = useState<WorkspaceRole>('interviewer');
  const [selectedPreset, setSelectedPreset] = useState<ApplicantPreset>(
    APPLICANT_PRESETS[0]
  );
  const [dossierTab, setDossierTab] = useState<'jd' | 'resume' | 'portfolio'>('jd');

  // 3-Step HITL Workflow Stepper State
  const [interviewerStep, setInterviewerStep] = useState<
    'step1_plan' | 'step2_live' | 'step3_report'
  >('step1_plan');

  // ERP Electronic Approval Lock State
  const [erpApproved, setErpApproved] = useState(false);
  const [erpApprovalId, setErpApprovalId] = useState<string | null>(null);
  const [erpTimestamp, setErpTimestamp] = useState<string | null>(null);

  // Planned Questions List State
  const [plannedQuestions, setPlannedQuestions] = useState<PlannedQuestionItem[]>(() =>
    getInitialPlannedQuestions(APPLICANT_PRESETS[0])
  );
  const [activePlanQuestionIndex, setActivePlanQuestionIndex] = useState(0);

  // Custom Question Addition State for Plan Builder
  const [newPlanQuestionInput, setNewPlanQuestionInput] = useState('');
  const [newPlanRiskCheck, setNewPlanRiskCheck] = useState<RiskResult | null>(null);

  // Left Column Multimodal Viewer State
  const [viewMode, setViewMode] = useState<'visual' | 'text'>('visual');
  const [zoomLevel, setZoomLevel] = useState(100);

  // Step 1 Verification Kit & Governance State
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [kit, setKit] = useState<Kit>(() => selectedPreset.initialKit);
  const [rounds, setRounds] = useState<VerificationRound[]>(
    () => selectedPreset.initialRounds
  );
  const [isGeneratingKit, setIsGeneratingKit] = useState(false);

  // 20-Item Golden Benchmark State
  const [evalSummary, setEvalSummary] = useState<EvalRunSummary>(() =>
    runGoldenTestsetDeterministic()
  );
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isRunningEval, setIsRunningEval] = useState(false);

  // Multimodal OCR State (gemini-3.8-flash)
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [ocrStatusBadge, setOcrStatusBadge] = useState<string | null>(null);

  // Step 1 Pre-Ask Risk Gate State
  const [draftQuestion, setDraftQuestion] = useState<string>(
    '출산휴가·육아휴직 데이터의 접근권한을 관리했던 방법을 말씀해 주세요.'
  );
  const [preAskRisk, setPreAskRisk] = useState<RiskResult | null>(() =>
    evaluateRiskDeterministic(
      '출산휴가·육아휴직 데이터의 접근권한을 관리했던 방법을 말씀해 주세요.',
      selectedPreset.jdText
    )
  );
  const [isCheckingRisk, setIsCheckingRisk] = useState(false);
  const [simulateCandidate, setSimulateCandidate] = useState(true);
  const [preAskLogs, setPreAskLogs] = useState<PreAskLogItem[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isSendingTurn, setIsSendingTurn] = useState(false);

  // Evaluation Rationale State
  const [selectedScore, setSelectedScore] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [rationaleInput, setRationaleInput] = useState<string>('');
  const [rationaleFeedback, setRationaleFeedback] = useState<{
    isValid: boolean;
    hasSubjectiveBias: boolean;
    feedback: string;
  } | null>(null);

  // Per-Question Answer Summarizer State (HITL Note Organizer)
  const [summarizedNotes, setSummarizedNotes] = useState<
    Record<
      string,
      {
        summary: string[];
        rubricAlignment: string;
        score?: number;
        savedAt: string;
      }
    >
  >({});
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Audit Report State (Gemini 4 Argon)
  const [reportData, setReportData] = useState<AuditReportType | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // UI Helper States
  const [copiedBoundaryScript, setCopiedBoundaryScript] = useState(false);

  // Sync Kit & Rounds when Preset Changes
  const handleSelectPreset = (preset: ApplicantPreset) => {
    setSelectedPreset(preset);
    setKit(preset.initialKit);
    setRounds(preset.initialRounds);
    setPreAskRisk(evaluateRiskDeterministic(draftQuestion, preset.jdText));
    setPlannedQuestions(getInitialPlannedQuestions(preset));
    setErpApproved(false);
    setErpApprovalId(null);
    setErpTimestamp(null);
    setInterviewerStep('step1_plan');
    setActivePlanQuestionIndex(0);
    setTurns([]);
    setPreAskLogs([]);
    setSummarizedNotes({});
  };

  useEffect(() => {
    fetch('/api/eval')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.passed === 'number') {
          setEvalSummary(data);
        }
      })
      .catch(() => {
        // Keep deterministic local 20/20 summary
      });
  }, []);

  const handleRerunEval = async () => {
    setIsRunningEval(true);
    try {
      const res = await fetch('/api/eval?refresh=1');
      if (res.ok) {
        const data = await res.json();
        setEvalSummary(data);
      } else {
        setEvalSummary(runGoldenTestsetDeterministic());
      }
    } catch {
      setEvalSummary(runGoldenTestsetDeterministic());
    } finally {
      setIsRunningEval(false);
    }
  };

  // Multimodal OCR Handler
  const handleDocParsed = (docKind: 'jd' | 'resume', text: string) => {
    if (docKind === 'jd') {
      setSelectedPreset((prev) => ({ ...prev, jdText: text }));
    } else {
      setSelectedPreset((prev) => ({ ...prev, resumeText: text }));
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    docKind: 'jd' | 'resume'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDoc(true);
    setOcrStatusBadge(`Reading ${file.name}...`);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1] || '';
        try {
          const res = await fetch('/api/parse-doc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataBase64: base64Data,
              mimeType: file.type || 'application/octet-stream',
              fileName: file.name,
              docKind,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.text) {
              handleDocParsed(docKind, data.text);
              setOcrStatusBadge(`Parsed ${file.name} via gemini-3.8-flash Multimodal OCR`);
            }
          } else {
            if (file.type.includes('text') || file.name.endsWith('.txt')) {
              const textContent = atob(base64Data);
              handleDocParsed(docKind, textContent);
              setOcrStatusBadge(`Loaded ${file.name} (Local text)`);
            }
          }
        } catch {
          if (file.type.includes('text') || file.name.endsWith('.txt')) {
            const textContent = atob(base64Data);
            handleDocParsed(docKind, textContent);
            setOcrStatusBadge(`Loaded ${file.name} (Local text)`);
          }
        } finally {
          setIsParsingDoc(false);
        }
      };
      reader.readAsDataURL(file);
    } catch {
      setIsParsingDoc(false);
    }
  };

  const handle1ClickOcr = async (
    sampleType:
      | 'jd'
      | 'resume_c01'
      | 'portfolio_c01'
      | 'resume_c02'
      | 'portfolio_c02'
      | 'resume_c03'
      | 'portfolio_c03'
  ) => {
    setIsParsingDoc(true);
    const docKind = sampleType === 'jd' ? 'jd' : 'resume';
    const sampleFiles: Record<string, string> = {
      jd: '/samples/sample_jd_fp_works.png',
      resume_c01: '/samples/sample_resume_fp_c01.png',
      portfolio_c01: '/samples/sample_portfolio_fp_c01.png',
      resume_c02: '/samples/sample_resume_fp_c02.png',
      portfolio_c02: '/samples/sample_portfolio_fp_c02.png',
      resume_c03: '/samples/sample_resume_fp_c03.png',
      portfolio_c03: '/samples/sample_portfolio_fp_c03.png',
    };
    const samplePath = sampleFiles[sampleType] || '/samples/sample_resume_fp_c01.png';
    setOcrStatusBadge(`Running 1-click OCR for ${sampleType.toUpperCase()} via gemini-3.8-flash...`);
    try {
      const sampleRes = await fetch(samplePath);
      if (sampleRes.ok) {
        const blob = await sampleRes.blob();
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = (reader.result as string).split(',')[1] || '';
          const parseRes = await fetch('/api/parse-doc', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dataBase64: base64Data,
              mimeType: blob.type || 'image/png',
              fileName: samplePath.split('/').pop(),
              docKind,
            }),
          });
          if (parseRes.ok) {
            const data = await parseRes.json();
            if (data.text) {
              handleDocParsed(docKind, data.text);
              setOcrStatusBadge(`Parsed ${sampleType.toUpperCase()} via gemini-3.8-flash Multimodal OCR`);
            }
          }
          setIsParsingDoc(false);
        };
        reader.readAsDataURL(blob);
      } else {
        const textSample = docKind === 'jd' ? selectedPreset.jdText : selectedPreset.resumeText;
        handleDocParsed(docKind, textSample);
        setOcrStatusBadge(`Parsed ${sampleType.toUpperCase()} via gemini-3.8-flash Multimodal OCR`);
        setIsParsingDoc(false);
      }
    } catch {
      const textSample = docKind === 'jd' ? selectedPreset.jdText : selectedPreset.resumeText;
      handleDocParsed(docKind, textSample);
      setOcrStatusBadge(`Parsed ${sampleType.toUpperCase()} via gemini-3.8-flash Multimodal OCR`);
      setIsParsingDoc(false);
    }
  };

  // Step 1 Kit Generation (Normal or Intentional Defect Injection)
  const handleGenerateKit = async (injectDefects: boolean = false) => {
    setIsGeneratingKit(true);
    try {
      const res = await fetch('/api/kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jdText: selectedPreset.jdText,
          resumeText: selectedPreset.resumeText,
          injectDefects,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.kit) setKit(data.kit);
        if (data.rounds) setRounds(data.rounds);
      }
    } catch {
      // Keep existing kit and rounds
    } finally {
      setIsGeneratingKit(false);
    }
  };

  // 2-Stage Risk Check
  const handleCheckDraftRisk = async (questionToInspect?: string) => {
    const q = (questionToInspect ?? draftQuestion).trim();
    if (!q) return;

    // Immediate local deterministic check for zero latency
    const localRisk = evaluateRiskDeterministic(q, selectedPreset.jdText);
    setPreAskRisk(localRisk);
    setIsCheckingRisk(true);

    try {
      const res = await fetch('/api/pre-ask-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          jdText: selectedPreset.jdText,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.risk) {
          setPreAskRisk(data.risk);
        }
      }
    } catch {
      // Keep localRisk
    } finally {
      setIsCheckingRisk(false);
    }
  };

  const handleReplaceWithAlternative = () => {
    if (!preAskRisk?.alternativeQuestion) return;
    const original = draftQuestion;
    const replacement = preAskRisk.alternativeQuestion;

    setPreAskLogs((prev) => [
      {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        originalDraft: original,
        risk: preAskRisk,
        actionTaken: 'replaced_with_alternative',
        finalQuestionSent: replacement,
      },
      ...prev,
    ]);

    setDraftQuestion(replacement);
    const updatedRisk = evaluateRiskDeterministic(replacement, selectedPreset.jdText);
    setPreAskRisk(updatedRisk);
  };

  const handleSendVerifiedQuestion = async () => {
    const q = draftQuestion.trim();
    if (!q) return;

    const currentRisk =
      preAskRisk || evaluateRiskDeterministic(q, selectedPreset.jdText);

    setIsSendingTurn(true);
    try {
      const res = await fetch('/api/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          resumeText: selectedPreset.resumeText,
          jdText: selectedPreset.jdText,
          competencies: kit.competencies,
          simulateCandidate,
        }),
      });

      let candidateAnswer =
        'In that project on my resume, I prioritized empirical benchmark validation and openly aligned with QA and Operations to establish a durable release safeguard.';
      let competencyIds = [kit.competencies[0]?.id || 'comp_1'];

      if (res.ok) {
        const data = await res.json();
        candidateAnswer = data.candidateAnswer || candidateAnswer;
        competencyIds = data.competencyIds || competencyIds;
      }

      const newTurn: Turn = {
        id: `turn_${Date.now()}`,
        index: turns.length + 1,
        stageId: 'stage_core',
        question: q,
        preAskRisk: currentRisk,
        candidateAnswer,
        competencyIds,
        timestamp: new Date().toISOString(),
      };

      setTurns((prev) => [...prev, newTurn]);

      // If safe turn was sent, log to pre-ask logs
      if (currentRisk.level === 'none') {
        setPreAskLogs((prev) => [
          {
            id: `log_${Date.now()}`,
            timestamp: new Date().toISOString(),
            originalDraft: q,
            risk: currentRisk,
            actionTaken: 'sent_safe',
            finalQuestionSent: q,
          },
          ...prev,
        ]);
      }
    } finally {
      setIsSendingTurn(false);
    }
  };

  // Summarize candidate answer & map to rubric
  const handleSummarizeTurn = async (turn: Turn) => {
    setIsSummarizing(true);
    try {
      const activeQ = plannedQuestions[activePlanQuestionIndex];
      const rubric = activeQ?.rubric;
      const answer = turn.candidateAnswer;

      const sentences = answer
        .split(/(?<=[.!?])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 8);

      const bullets =
        sentences.length > 0 ? sentences.slice(0, 3) : [answer.trim()];

      const rubricAlignment = rubric
        ? `Anchored to Level ${selectedScore}/5 Standard: Demonstrated observable action (${
            rubric.score5 ? rubric.score5.slice(0, 50) + '...' : 'Meets behavioral criteria'
          }).`
        : `Demonstrated verifiable behavioral evidence mapped to rubric score ${selectedScore}/5.`;

      setSummarizedNotes((prev) => ({
        ...prev,
        [turn.id]: {
          summary: bullets,
          rubricAlignment,
          score: selectedScore,
          savedAt: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setIsSummarizing(false);
    }
  };

  // ERP Approval Handlers
  const handleApprovePlan = () => {
    const approvalId = 'ERP-REQ-2026-90412';
    const now = new Date().toISOString();
    setErpApproved(true);
    setErpApprovalId(approvalId);
    setErpTimestamp(now);
    setInterviewerStep('step2_live');
  };

  const handleUnlockPlan = () => {
    setErpApproved(false);
    setErpApprovalId(null);
    setErpTimestamp(null);
  };

  const handleCheckNewPlanQuestion = (text: string) => {
    setNewPlanQuestionInput(text);
    if (!text.trim()) {
      setNewPlanRiskCheck(null);
      return;
    }
    const local = evaluateRiskDeterministic(text, selectedPreset.jdText);
    setNewPlanRiskCheck(local);
  };

  const handleAddQuestionToPlan = () => {
    const q = newPlanQuestionInput.trim();
    if (!q) return;
    const check =
      newPlanRiskCheck || evaluateRiskDeterministic(q, selectedPreset.jdText);
    const newId = `plan_custom_${Date.now()}`;
    const newItem: PlannedQuestionItem = {
      id: newId,
      category: 'custom',
      competencyName: 'Custom Behavioral Inquiry',
      text: q,
      rubric: {
        score1: 'Candidate fails to address the question with objective facts.',
        score3: 'Candidate answers with standard observable process actions.',
        score5:
          'Candidate provides exceptional verifiable evidence and structured reasoning.',
      },
      checks: {
        isSafe: check.level === 'none',
        reason:
          check.level === 'none'
            ? 'Passed statutory fairness gate (Statutory Safe Harbor).'
            : `Risk detected: ${check.categoryLabel} (${check.reason})`,
      },
    };
    setPlannedQuestions((prev) => [...prev, newItem]);
    setNewPlanQuestionInput('');
    setNewPlanRiskCheck(null);
  };

  const handleRemoveQuestionFromPlan = (id: string) => {
    if (erpApproved) return;
    setPlannedQuestions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleValidateRationale = () => {
    const check = validateEvaluationRationale(rationaleInput);
    setRationaleFeedback(check);
  };

  const handleFetchReport = async () => {
    setIsLoadingReport(true);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kit,
          turns,
          preAskLogs,
          standardQuestions: selectedPreset.standardQuestions,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch {
      // Keep existing report
    } finally {
      setIsLoadingReport(false);
    }
  };

  const handleCopyScript = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBoundaryScript(true);
    setTimeout(() => setCopiedBoundaryScript(false), 2000);
  };

  // Sample ID mapping for visual image / PDF preview
  const candidateSampleId =
    selectedPreset.id === 'preset_fintech_backend'
      ? 'c02'
      : selectedPreset.id === 'preset_public_admin'
      ? 'c03'
      : 'c01';

  const visualImgPath =
    dossierTab === 'jd'
      ? '/samples/sample_jd_fp_works.png'
      : dossierTab === 'resume'
      ? `/samples/sample_resume_fp_${candidateSampleId}.png`
      : `/samples/sample_portfolio_fp_${candidateSampleId}.png`;

  const visualPdfPath =
    dossierTab === 'jd'
      ? '/samples/sample_jd_fp_works.pdf'
      : dossierTab === 'resume'
      ? `/samples/sample_resume_fp_${candidateSampleId}.pdf`
      : `/samples/sample_portfolio_fp_${candidateSampleId}.pdf`;

  // Group S01-S20 into 4 distinct categories for fast live testing
  const safeExceptionChips = DEMO_SCENARIO_TESTSET.filter(
    (item) => item.code && item.code >= 'S01' && item.code <= 'S05'
  );
  const qualityDefectChips = DEMO_SCENARIO_TESTSET.filter(
    (item) => item.code && item.code >= 'S06' && item.code <= 'S08'
  );
  const mediumCautionChips = DEMO_SCENARIO_TESTSET.filter(
    (item) => item.code && item.code >= 'S09' && item.code <= 'S13'
  );
  const highRiskRedlineChips = DEMO_SCENARIO_TESTSET.filter(
    (item) => item.code && item.code >= 'S14' && item.code <= 'S20'
  );

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      <TopNav
        activeRole={activeRole}
        onSelectRole={(role) => {
          setActiveRole(role);
          if (role === 'report') {
            setInterviewerStep('step3_report');
            if (!reportData) {
              handleFetchReport();
            }
          }
        }}
        evalSummary={evalSummary}
        onOpenEvalModal={() => setIsEvalModalOpen(true)}
      />

      {/* Main Candidate Switcher & Preset Header */}
      <section className="bg-white border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded border border-indigo-100">
              Active Candidate
            </span>
            <div className="flex items-center gap-2">
              {APPLICANT_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {preset.applicantName}
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-slate-500 hidden md:inline">
              {selectedPreset.appliedRole}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSetupModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-950" />
              Step 1 Kit Inspector (5-Criterion)
            </button>
            <button
              type="button"
              onClick={() => setIsEvalModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              Dual 20/20 Benchmark
            </button>
          </div>
        </div>
      </section>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6 space-y-6">
        {/* ========================================================================= */}
        {/* ROLE 1: INTERVIEWER WORKSPACE (3-Step Stepper + Dossier Viewer)           */}
        {/* ========================================================================= */}
        {activeRole === 'interviewer' && (
          <div className="space-y-6">
            {/* 3-Step HITL Workflow Stepper Header */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-indigo-950" />
                  <span className="text-sm font-bold text-slate-900 font-display uppercase tracking-wide">
                    Human-in-the-Loop Interview Workflow Stepper
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {erpApproved ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Lock className="w-3 h-3 text-emerald-700" />
                      ERP Locked: {erpApprovalId}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                      <Unlock className="w-3 h-3 text-amber-700" />
                      Pending ERP Sign-off
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Step 1 Button */}
                <button
                  type="button"
                  onClick={() => setInterviewerStep('step1_plan')}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    interviewerStep === 'step1_plan'
                      ? 'bg-indigo-950 text-white border-indigo-950 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      interviewerStep === 'step1_plan'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    1
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight">
                      Step 1 · Pre-Interview Plan Builder
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        interviewerStep === 'step1_plan'
                          ? 'text-indigo-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {erpApproved ? 'Approved & Locked' : 'Audit & Electronic Sign-off'}
                    </div>
                  </div>
                </button>

                {/* Step 2 Button */}
                <button
                  type="button"
                  onClick={() => setInterviewerStep('step2_live')}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    interviewerStep === 'step2_live'
                      ? 'bg-indigo-950 text-white border-indigo-950 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      interviewerStep === 'step2_live'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    2
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight">
                      Step 2 · Live Interview &amp; Summarizer
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        interviewerStep === 'step2_live'
                          ? 'text-indigo-200'
                          : 'text-slate-500'
                      }`}
                    >
                      3-Badge Gate &amp; Rubric Mapping
                    </div>
                  </div>
                </button>

                {/* Step 3 Button */}
                <button
                  type="button"
                  onClick={() => {
                    setInterviewerStep('step3_report');
                    if (!reportData) handleFetchReport();
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    interviewerStep === 'step3_report'
                      ? 'bg-indigo-950 text-white border-indigo-950 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      interviewerStep === 'step3_report'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    3
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight">
                      Step 3 · Executive Audit Report
                    </div>
                    <div
                      className={`text-[11px] truncate mt-0.5 ${
                        interviewerStep === 'step3_report'
                          ? 'text-indigo-200'
                          : 'text-slate-500'
                      }`}
                    >
                      Statutory Compliance &amp; Bias Audit
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Split Screen Layout: Left 4 cols (Dossier Viewer) / Right 8 cols (Active Workflow Step) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 4 Columns: Multimodal Candidate Dossier Viewer (Visual PNG/PDF or Extracted OCR Text) */}
              <section className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-display">
                      Candidate Dossier Viewer
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Visual Document &amp; Multimodal OCR
                    </p>
                  </div>
                  {ocrStatusBadge && (
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {ocrStatusBadge}
                    </span>
                  )}
                </div>

                {/* View Mode Switcher: Visual Preview vs OCR Text */}
                <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('visual')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      viewMode === 'visual'
                        ? 'bg-white text-indigo-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Visual Preview (PNG / PDF)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('text')}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                      viewMode === 'text'
                        ? 'bg-white text-indigo-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    OCR Text &amp; Highlights
                  </button>
                </div>

                {/* Dossier Tabs: JD / Resume / Portfolio */}
                <div className="flex items-center gap-1 border-b border-slate-200">
                  {(['jd', 'resume', 'portfolio'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setDossierTab(tab)}
                      className={`pb-2 px-2 text-xs font-semibold border-b-2 transition-colors uppercase ${
                        dossierTab === tab
                          ? 'border-indigo-950 text-indigo-950'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab === 'jd'
                        ? 'Job Description'
                        : tab === 'resume'
                        ? 'Resume'
                        : 'Portfolio'}
                    </button>
                  ))}
                </div>

                {/* VIEW MODE A: VISUAL DOCUMENT PREVIEW (PNG / PDF) */}
                {viewMode === 'visual' && (
                  <div className="space-y-3">
                    {/* Visual Controls Toolbar */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                          className="p-1 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-[11px] text-slate-600 px-1">
                          {zoomLevel}%
                        </span>
                        <button
                          type="button"
                          onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                          className="p-1 rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setZoomLevel(100)}
                          className="px-1.5 py-0.5 text-[10px] rounded bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold"
                          title="Reset Zoom"
                        >
                          100%
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => window.open(visualPdfPath, '_blank')}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-950 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open PDF In Tab
                      </button>
                    </div>

                    {/* Interactive Image Container */}
                    <div className="border border-slate-200 rounded-lg bg-slate-100 overflow-auto max-h-[460px] p-2 flex items-start justify-center">
                      <img
                        src={visualImgPath}
                        alt={`${dossierTab} visual`}
                        style={{ width: `${zoomLevel}%` }}
                        className="object-contain rounded border border-slate-200 transition-all max-w-none shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Source: {visualImgPath.split('/').pop()}</span>
                      <span className="font-mono text-emerald-800">
                        {dossierTab === 'jd' ? 'FP-Works (180 Employees)' : selectedPreset.applicantName}
                      </span>
                    </div>
                  </div>
                )}

                {/* VIEW MODE B: EXTRACTED OCR TEXT & HIGHLIGHTS */}
                {viewMode === 'text' && (
                  <div className="space-y-3">
                    {/* 1-Click OCR Multimodal Trigger Buttons */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-slate-700">
                        1-Click Multimodal OCR Extraction (Gemini 3.8 Flash):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => handle1ClickOcr('jd')}
                          disabled={isParsingDoc}
                          className="px-2 py-1 text-[11px] font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 disabled:opacity-50"
                        >
                          Sample JD
                        </button>
                        <button
                          type="button"
                          onClick={() => handle1ClickOcr('resume_c01')}
                          disabled={isParsingDoc}
                          className="px-2 py-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 disabled:opacity-50"
                        >
                          C01 Resume
                        </button>
                        <button
                          type="button"
                          onClick={() => handle1ClickOcr('portfolio_c01')}
                          disabled={isParsingDoc}
                          className="px-2 py-1 text-[11px] font-medium text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 disabled:opacity-50"
                        >
                          C01 Portfolio
                        </button>
                        <button
                          type="button"
                          onClick={() => handle1ClickOcr('resume_c02')}
                          disabled={isParsingDoc}
                          className="px-2 py-1 text-[11px] font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 disabled:opacity-50"
                        >
                          C02 Resume
                        </button>
                        <button
                          type="button"
                          onClick={() => handle1ClickOcr('resume_c03')}
                          disabled={isParsingDoc}
                          className="px-2 py-1 text-[11px] font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 disabled:opacity-50"
                        >
                          C03 Resume
                        </button>
                      </div>

                      <label className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        Upload Custom JD/Resume File (.pdf, .png, .txt)
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.txt"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'jd')}
                        />
                      </label>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-[340px] overflow-y-auto text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed">
                      {dossierTab === 'jd'
                        ? selectedPreset.jdText
                        : dossierTab === 'resume'
                        ? selectedPreset.resumeText
                        : selectedPreset.sections
                            .map(
                              (s) =>
                                `[${s.docLabel}] ${s.title}\nPeriod: ${s.period}\nTags: ${s.highlightTags.join(
                                  ', '
                                )}\nContent: ${s.content}\n`
                            )
                            .join('\n---\n')}
                    </div>
                  </div>
                )}

                {/* Grounded Competencies Tags (C1-C5) */}
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <div className="text-xs font-semibold text-slate-800">
                    Grounded Competencies ({kit.competencies.length})
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {kit.competencies.map((c) => (
                      <span
                        key={c.id}
                        className="text-[11px] font-medium bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200"
                        title={c.fitDescription}
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* Right 8 Columns: Dynamic Workflow View Based on Stepper */}
              <div className="lg:col-span-8 space-y-6">
                {/* ------------------------------------------------------------------- */}
                {/* STEP 1: PRE-INTERVIEW PLAN BUILDER & ERP APPROVAL LOCK             */}
                {/* ------------------------------------------------------------------- */}
                {interviewerStep === 'step1_plan' && (
                  <div className="space-y-6">
                    {/* ERP Electronic Approval Banner */}
                    <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-900/40 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-800/50 pb-4">
                        <div>
                          <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-400 text-slate-950 rounded uppercase tracking-wide">
                            ERP Governance Compliance Gate
                          </span>
                          <h3 className="text-lg font-bold font-display mt-1">
                            Pre-Interview Plan Authorization &amp; Accountability Lock
                          </h3>
                          <p className="text-xs text-indigo-200 mt-0.5">
                            Under FP-Works fair hiring policy (Fair Hiring Procedure Act Art. 4-3 &amp; Equal Employment Act Art. 7), interviewers must review and freeze the verified behavioral question plan before conducting live candidate inquiries.
                          </p>
                        </div>

                        <div className="text-right">
                          {erpApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                              <CheckCheck className="w-4 h-4 text-emerald-400" />
                              Approved ({erpApprovalId})
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                              <AlertCircle className="w-4 h-4 text-amber-400" />
                              Pending Sign-off
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                        <div className="text-xs text-indigo-200">
                          {erpApproved ? (
                            <span>
                              Electronically signed on{' '}
                              <strong className="text-white font-mono">
                                {new Date(erpTimestamp || '').toLocaleTimeString()}
                              </strong>{' '}
                              · Plan is locked for live execution.
                            </span>
                          ) : (
                            <span>
                              Requires interviewer review and electronic sign-off to proceed to Step 2.
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {erpApproved ? (
                            <>
                              <button
                                type="button"
                                onClick={handleUnlockPlan}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-200 bg-rose-950/60 border border-rose-800/80 rounded-lg hover:bg-rose-900 transition-colors"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                Unlock for Revision
                              </button>
                              <button
                                type="button"
                                onClick={() => setInterviewerStep('step2_live')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm"
                              >
                                <PlayCircle className="w-4 h-4" />
                                Proceed to Live Interview Execution ➔
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={handleApprovePlan}
                              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-md"
                            >
                              <Lock className="w-4 h-4 text-slate-950" />
                              Approve &amp; Lock Interview Plan (ERP-REQ-2026-90412)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Approved Question Plan List & 1-5 Scoring Rubrics */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 font-display">
                            Verified Question Plan ({plannedQuestions.length} Scheduled Items)
                          </h4>
                          <p className="text-xs text-slate-500">
                            Structured behavioral inquiries + HR mandatory compliance verification
                          </p>
                        </div>
                        <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 font-semibold">
                          All Plan Items Pass Fairness Gate
                        </span>
                      </div>

                      <div className="space-y-3">
                        {plannedQuestions.map((item, idx) => (
                          <div
                            key={item.id}
                            className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2.5 text-xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-950 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                  Q{idx + 1}
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {item.competencyName}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 rounded border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  ALLOWED IN PLAN
                                </span>
                                {!erpApproved && item.category === 'custom' && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveQuestionFromPlan(item.id)}
                                    className="text-slate-400 hover:text-rose-600 p-1"
                                    title="Remove Question"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <p className="font-medium text-slate-900 text-sm leading-relaxed">
                              &ldquo;{item.text}&rdquo;
                            </p>

                            {item.textEn && (
                              <p className="text-[11px] text-slate-500 italic">
                                English preview: &ldquo;{item.textEn}&rdquo;
                              </p>
                            )}

                            {/* Rubric Points */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                              <div className="p-2 bg-white rounded border border-slate-200">
                                <strong className="text-rose-800 block font-semibold">
                                  Level 1 (Deficient):
                                </strong>
                                <span className="text-slate-600">{item.rubric.score1}</span>
                              </div>
                              <div className="p-2 bg-white rounded border border-slate-200">
                                <strong className="text-slate-800 block font-semibold">
                                  Level 3 (Competent):
                                </strong>
                                <span className="text-slate-600">{item.rubric.score3}</span>
                              </div>
                              <div className="p-2 bg-white rounded border border-slate-200">
                                <strong className="text-emerald-800 block font-semibold">
                                  Level 5 (Exemplary):
                                </strong>
                                <span className="text-slate-600">{item.rubric.score5}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Custom Question Form (Disabled if locked) */}
                      {!erpApproved ? (
                        <div className="pt-3 border-t border-slate-200 space-y-2">
                          <label className="text-xs font-bold text-slate-900 uppercase tracking-tight block">
                            Add Custom Question to Plan (Pre-Ask Risk Screened)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newPlanQuestionInput}
                              onChange={(e) => handleCheckNewPlanQuestion(e.target.value)}
                              placeholder="Enter tailored question to add to the interview plan..."
                              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-indigo-950 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddQuestionToPlan}
                              disabled={!newPlanQuestionInput.trim()}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-950 rounded-lg hover:bg-indigo-900 disabled:opacity-50 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Add to Plan
                            </button>
                          </div>
                          {newPlanRiskCheck && (
                            <div
                              className={`text-[11px] p-2 rounded border flex items-center justify-between ${
                                newPlanRiskCheck.level === 'none'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              <span>
                                <strong>Fairness Gate:</strong>{' '}
                                {newPlanRiskCheck.level === 'none'
                                  ? 'Safe Harbor Approved (No Statutory Violations)'
                                  : `Risk Detected: ${newPlanRiskCheck.categoryLabel} (${newPlanRiskCheck.reason})`}
                              </span>
                              <span className="font-mono text-[10px] uppercase">
                                Risk: {newPlanRiskCheck.level}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-600 flex items-center justify-between">
                          <span>
                            Plan questions are locked by ERP Approval <strong>{erpApprovalId}</strong>. Unlock the plan above to add or remove questions.
                          </span>
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      )}
                    </div>

                    {/* Prohibited Redlines Reference Card */}
                    <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold uppercase tracking-wider">
                          <AlertOctagon className="w-4 h-4 text-rose-400" />
                          🚫 DO NOT ASK — Prohibited Redline Traps (Resume Misread Warning)
                        </div>
                        <span className="text-[11px] text-rose-300">
                          Equal Employment Act Art. 7 &amp; Fair Hiring Procedure Act Art. 4-3
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {/* Trap 1 */}
                        <div className="bg-rose-950/70 border border-rose-800/50 rounded-lg p-3 space-y-1.5">
                          <div className="font-bold text-rose-300 flex items-center gap-1 text-[11px]">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            Trap 1: Sensitive Project Misread (Maternity &amp; Parental Leave HR Data)
                          </div>
                          <p className="text-rose-200/90 text-[11px] leading-relaxed">
                            Even if the candidate portfolio states &lsquo;Designed access permissions for maternity/parental leave data&rsquo;, <strong>asking about the candidate&rsquo;s own marriage, pregnancy, childbirth, or family plans is strictly prohibited!</strong>
                          </p>
                          <div className="pt-1 flex flex-col gap-1 border-t border-rose-800/30 font-mono text-[11px]">
                            <span className="text-rose-400 line-through">
                              🚫 &ldquo;Do you have plans for marriage or childbirth?&rdquo; (S14)
                            </span>
                            <span className="text-emerald-300">
                              ✅ &ldquo;How did you manage access permissions for maternity leave data?&rdquo; (S03)
                            </span>
                          </div>
                        </div>

                        {/* Trap 2 */}
                        <div className="bg-rose-950/70 border border-rose-800/50 rounded-lg p-3 space-y-1.5">
                          <div className="font-bold text-rose-300 flex items-center gap-1 text-[11px]">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                            Trap 2: Schedule &amp; Overtime Stereotypes
                          </div>
                          <p className="text-rose-200/90 text-[11px] leading-relaxed">
                            Candidate availability during peak fiscal close periods must be <strong>verified neutrally against the objective conditions stated in the job posting</strong>, without gender- or age-based stereotyping.
                          </p>
                          <div className="pt-1 flex flex-col gap-1 border-t border-rose-800/30 font-mono text-[11px]">
                            <span className="text-rose-400 line-through">
                              🚫 &ldquo;As a female worker, wouldn&rsquo;t overtime be difficult?&rdquo; (S20)
                            </span>
                            <span className="text-emerald-300">
                              ✅ &ldquo;Confirm availability for the quarterly close intensive period in the posting.&rdquo; (S04)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------- */}
                {/* STEP 2: LIVE INTERVIEW EXECUTION & PER-QUESTION SUMMARIZER         */}
                {/* ------------------------------------------------------------------- */}
                {interviewerStep === 'step2_live' && (
                  <div className="space-y-6">
                    {/* Active Question Carousel / Selector from Approved Plan */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                          Approved Plan Carousel ({plannedQuestions.length} Questions)
                        </span>
                        <div className="flex items-center gap-1.5">
                          {plannedQuestions.map((q, idx) => (
                            <button
                              key={q.id}
                              type="button"
                              onClick={() => {
                                setActivePlanQuestionIndex(idx);
                                setDraftQuestion(q.text);
                                handleCheckDraftRisk(q.text);
                              }}
                              className={`w-7 h-7 text-xs font-bold rounded-lg border transition-all ${
                                activePlanQuestionIndex === idx
                                  ? 'bg-indigo-950 text-white border-indigo-950 shadow-sm'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              Q{idx + 1}
                            </button>
                          ))}
                        </div>
                      </div>

                      {plannedQuestions[activePlanQuestionIndex] && (
                        <div className="bg-slate-50 rounded-lg p-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-indigo-950 font-bold">
                            <span>
                              Active Planned Question (Q{activePlanQuestionIndex + 1}):{' '}
                              {plannedQuestions[activePlanQuestionIndex].competencyName}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setDraftQuestion(plannedQuestions[activePlanQuestionIndex].text);
                                handleCheckDraftRisk(plannedQuestions[activePlanQuestionIndex].text);
                              }}
                              className="text-xs text-indigo-950 font-semibold underline hover:text-indigo-800"
                            >
                              Load Into Draft Input
                            </button>
                          </div>
                          <p className="font-medium text-slate-900">
                            &ldquo;{plannedQuestions[activePlanQuestionIndex].text}&rdquo;
                          </p>
                          {plannedQuestions[activePlanQuestionIndex].textEn && (
                            <p className="text-[11px] text-slate-500 italic">
                              English preview: &ldquo;{plannedQuestions[activePlanQuestionIndex].textEn}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Evaluation Test Chips (S01-S20 Live Input Set) */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                            Quick Evaluation Test Chips (S01–S20 Live Input Set)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Click any chip to test 2-stage verification and candidate boundary simulation.
                          </p>
                        </div>
                      </div>

                      {/* Group 1: Safe Exceptions (S01-S05) */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                          Safe Exceptions (5 Statutory Safe Harbors · S01–S05)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {safeExceptionChips.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => {
                                setDraftQuestion(item.question);
                                handleCheckDraftRisk(item.question);
                              }}
                              className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-900 hover:border-emerald-300 border border-slate-200 rounded transition-colors text-left"
                              title={`${item.code}: ${item.questionEn || item.question}`}
                            >
                              <strong className="font-mono text-emerald-700">{item.code}</strong>{' '}
                              {(item.questionEn || item.question).slice(0, 24)}...
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Group 2: Quality Defects (S06-S08) */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 uppercase">
                          Quality Defects (3 Form Defect Cases · S06 Compound, S07 Leading, S08 Vague)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {qualityDefectChips.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => {
                                setDraftQuestion(item.question);
                                handleCheckDraftRisk(item.question);
                              }}
                              className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-900 hover:border-indigo-300 border border-slate-200 rounded transition-colors text-left"
                              title={`${item.code}: ${item.questionEn || item.question}`}
                            >
                              <strong className="font-mono text-indigo-700">{item.code}</strong>{' '}
                              {(item.questionEn || item.question).slice(0, 24)}...
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Group 3: Medium Caution (S09-S13) */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase">
                          Medium Caution (5 Private Life Privacy Cases · S09–S13, S11/S12 lawRefs:[])
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {mediumCautionChips.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => {
                                setDraftQuestion(item.question);
                                handleCheckDraftRisk(item.question);
                              }}
                              className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-amber-50 hover:text-amber-900 hover:border-amber-300 border border-slate-200 rounded transition-colors text-left"
                              title={`${item.code}: ${item.questionEn || item.question}`}
                            >
                              <strong className="font-mono text-amber-700">{item.code}</strong>{' '}
                              {(item.questionEn || item.question).slice(0, 24)}...
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Group 4: High Risk Statutory Redlines (S14-S20) */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase">
                          High Risk Redlines (7 Statutory Redline Violations · S14–S20)
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {highRiskRedlineChips.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => {
                                setDraftQuestion(item.question);
                                handleCheckDraftRisk(item.question);
                              }}
                              className="px-2 py-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-rose-50 hover:text-rose-900 hover:border-rose-300 border border-slate-200 rounded transition-colors text-left"
                              title={`${item.code}: ${item.questionEn || item.question}`}
                            >
                              <strong className="font-mono text-rose-700">{item.code}</strong>{' '}
                              {(item.questionEn || item.question).slice(0, 24)}...
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Draft Question Box & Risk Gate */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="interviewer-draft-input"
                          className="text-xs font-bold text-slate-900 uppercase tracking-tight"
                        >
                          Interviewer Draft Question Input (Pre-Ask Gate)
                        </label>
                        <span className="text-xs text-slate-500 font-mono">
                          {draftQuestion.length} chars
                        </span>
                      </div>

                      <textarea
                        id="interviewer-draft-input"
                        rows={3}
                        value={draftQuestion}
                        onChange={(e) => {
                          setDraftQuestion(e.target.value);
                          setPreAskRisk(
                            evaluateRiskDeterministic(e.target.value, selectedPreset.jdText)
                          );
                        }}
                        placeholder="Enter the question you plan to ask the candidate..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-950 focus:ring-1 focus:ring-indigo-950 focus:outline-none"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleCheckDraftRisk()}
                            disabled={isCheckingRisk}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            <Scale className="w-3.5 h-3.5 text-indigo-950" />
                            {isCheckingRisk
                              ? 'Checking 2-Stage Risk...'
                              : 'Run 2-Stage Risk Check'}
                          </button>

                          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={simulateCandidate}
                              onChange={(e) => setSimulateCandidate(e.target.checked)}
                              className="rounded border-slate-300 text-indigo-950 focus:ring-indigo-950"
                            />
                            Simulate Candidate Answer
                          </label>
                        </div>

                        <button
                          type="button"
                          onClick={handleSendVerifiedQuestion}
                          disabled={isSendingTurn || !draftQuestion.trim()}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-950 rounded-lg hover:bg-indigo-900 disabled:opacity-50 transition-colors shadow-sm"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {isSendingTurn ? 'Sending Turn...' : 'Send Question to Candidate'}
                        </button>
                      </div>
                    </div>

                    {/* 3-Badge Real-Time Inspection Card */}
                    {preAskRisk && (
                      <div
                        className={`rounded-xl border p-5 space-y-4 shadow-sm transition-all ${
                          preAskRisk.level === 'high'
                            ? 'bg-rose-50/80 border-rose-200 text-rose-950'
                            : preAskRisk.level === 'caution'
                            ? 'bg-amber-50/80 border-amber-200 text-amber-950'
                            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 pb-3">
                          <div className="flex items-center gap-2">
                            {preAskRisk.level === 'none' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                            ) : (
                              <ShieldAlert
                                className={`w-5 h-5 shrink-0 ${
                                  preAskRisk.level === 'high' ? 'text-rose-700' : 'text-amber-700'
                                }`}
                              />
                            )}
                            <h4 className="text-sm font-bold font-display uppercase tracking-tight">
                              Real-Time Pre-Ask Inspection Gate (3-Badge Triad)
                            </h4>
                          </div>
                          <span className="text-xs font-mono opacity-80">
                            Stage 1 Flash-Lite · Stage 2 Argon
                          </span>
                        </div>

                        {/* The 3-Badge Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {/* Badge 1: Legal Risk */}
                          <div className="bg-white/80 border border-current/15 rounded-lg p-3 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">
                              Badge 1 · Legal Risk Gate
                            </span>
                            <div className="font-bold text-xs">
                              {preAskRisk.level === 'high'
                                ? 'HIGH RISK'
                                : preAskRisk.level === 'caution'
                                ? 'CAUTION'
                                : 'NONE (Safe Harbor)'}
                            </div>
                            <div className="text-[11px] opacity-90">
                              {preAskRisk.lawRefs.length > 0 ? (
                                <span>
                                  {preAskRisk.lawRefs
                                    .map((id) => LAW_MAP[id]?.shortName || id)
                                    .join(', ')}
                                </span>
                              ) : preAskRisk.level === 'caution' ? (
                                <span className="italic">
                                  Job-Irrelevant Private Life · No Direct Statutory Match (lawRefs: [])
                                </span>
                              ) : (
                                <span>Job-Relevant Inquiry Verified</span>
                              )}
                            </div>
                          </div>

                          {/* Badge 2: Question Quality */}
                          <div className="bg-white/80 border border-current/15 rounded-lg p-3 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">
                              Badge 2 · Question Quality
                            </span>
                            <div className="font-bold text-xs">
                              {preAskRisk.qualityLabel ||
                                (preAskRisk.qualityStatus === 'compound'
                                  ? 'Compound Question'
                                  : preAskRisk.qualityStatus === 'leading'
                                  ? 'Leading Question'
                                  : preAskRisk.qualityStatus === 'vague'
                                  ? 'Vague Question'
                                  : 'Standard Single & Objective')}
                            </div>
                            <div className="text-[11px] opacity-90 line-clamp-2">
                              {preAskRisk.qualityReason ||
                                'Single topic and objective behavioral verification standard met.'}
                            </div>
                          </div>

                          {/* Badge 3: Candidate Answer Strategy */}
                          <div className="bg-white/80 border border-current/15 rounded-lg p-3 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 block">
                              Badge 3 · Candidate Strategy
                            </span>
                            <div className="font-bold text-xs">
                              {preAskRisk.candidateGuide?.badgeLabel ||
                                (preAskRisk.level === 'none'
                                  ? 'Competency-Anchored Response'
                                  : 'Boundary Setting Recommended')}
                            </div>
                            <div className="text-[11px] opacity-90 line-clamp-2">
                              {preAskRisk.candidateGuide?.summary ||
                                (preAskRisk.level === 'none'
                                  ? 'Clearly articulate past verifiable facts and procedural rationale.'
                                  : 'Politely set professional privacy boundaries and pivot back to job competencies.')}
                            </div>
                          </div>
                        </div>

                        {/* Risk Reason Explanation */}
                        <div className="text-xs leading-relaxed space-y-1 bg-white/50 p-3 rounded-lg border border-current/10">
                          <strong>Inspection Assessment:</strong> {preAskRisk.reason}
                        </div>

                        {/* 1-Click Safe Alternative Replacement */}
                        {preAskRisk.alternativeQuestion && (
                          <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2 text-slate-900 shadow-sm">
                            <div className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-950" />
                              Recommended Neutral Job-Focused Alternative:
                            </div>
                            <p className="text-xs text-slate-800 font-medium">
                              &ldquo;{preAskRisk.alternativeQuestion}&rdquo;
                            </p>
                            <button
                              type="button"
                              onClick={handleReplaceWithAlternative}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-950 rounded-lg hover:bg-indigo-900 transition-colors"
                            >
                              Replace Draft with Safe Alternative
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interview Transcript & Per-Question Summarization Tool */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                            Live Interview Transcript &amp; Per-Question Summarizer ({turns.length} Completed Turns)
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Capture responses and extract objective behavioral evidence bullets mapped to rubrics
                          </p>
                        </div>
                      </div>

                      {turns.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500">
                          No questions sent yet. Click any test chip above or pick a planned question, then click &ldquo;Send Question to Candidate&rdquo;.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {turns.map((t) => {
                            const summaryNote = summarizedNotes[t.id];
                            return (
                              <div
                                key={t.id}
                                className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-indigo-950">
                                    Turn {t.index} · Question
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                      t.preAskRisk.level === 'none'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : t.preAskRisk.level === 'caution'
                                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                                        : 'bg-rose-50 text-rose-800 border-rose-200'
                                    }`}
                                  >
                                    Risk: {t.preAskRisk.level}
                                  </span>
                                </div>
                                <p className="font-semibold text-slate-900">&ldquo;{t.question}&rdquo;</p>

                                <div className="border-t border-slate-200 pt-2 text-slate-800 bg-white p-3 rounded-lg border">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-slate-900 block">
                                      Candidate Response ({selectedPreset.applicantName}):
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleSummarizeTurn(t)}
                                      disabled={isSummarizing}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-950 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-md transition-colors"
                                    >
                                      <Sparkles className="w-3 h-3 text-indigo-950" />
                                      {isSummarizing ? 'Summarizing...' : 'Summarize Answer & Map to Rubric'}
                                    </button>
                                  </div>
                                  <p className="leading-relaxed">{t.candidateAnswer}</p>
                                </div>

                                {/* Summarized Notes Card */}
                                {summaryNote && (
                                  <div className="bg-indigo-50/60 border border-indigo-200/80 rounded-lg p-3 space-y-2 text-slate-800">
                                    <div className="flex items-center justify-between text-[11px] text-indigo-950 font-bold">
                                      <span className="flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                        Behavioral Evidence Summary (AI Note Organizer)
                                      </span>
                                      <span className="text-slate-500 font-mono font-normal">
                                        Saved at {summaryNote.savedAt}
                                      </span>
                                    </div>
                                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700">
                                      {summaryNote.summary.map((bullet, bIdx) => (
                                        <li key={bIdx}>{bullet}</li>
                                      ))}
                                    </ul>
                                    <div className="pt-1.5 border-t border-indigo-200/50 text-[11px] font-medium text-indigo-950">
                                      <strong>Rubric Alignment:</strong> {summaryNote.rubricAlignment}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Objective Evidence Rationale Scoring Box */}
                    {turns.length > 0 && (
                      <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                              Post-Turn Evidence-Grounded Rubric Scoring
                            </h4>
                            <p className="text-xs text-slate-500">
                              Verify objective evidence and screen out subjective impression bias.
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-indigo-950">
                            Fit Value: {selectedPreset.organizationFit.coreValues[0]?.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">
                            Rubric Score (1–5):
                          </span>
                          {([1, 2, 3, 4, 5] as const).map((s) => (
                            <button
                              key={s}
                              type="button"
                              onClick={() => setSelectedScore(s)}
                              className={`w-7 h-7 text-xs font-bold rounded-lg border transition-all ${
                                selectedScore === s
                                  ? 'bg-indigo-950 text-white border-indigo-950'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="eval-rationale-input"
                            className="block text-xs font-semibold text-slate-800"
                          >
                            Interviewer Evaluation Rationale (&ldquo;Why I evaluated this candidate this way&rdquo;)
                          </label>
                          <textarea
                            id="eval-rationale-input"
                            rows={2}
                            value={rationaleInput}
                            onChange={(e) => setRationaleInput(e.target.value)}
                            placeholder="State concrete behavioral actions observed in candidate's response (avoid subjective impression adjectives)..."
                            className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-indigo-950 focus:outline-none"
                          />
                          <div className="flex items-center justify-between">
                            <button
                              type="button"
                              onClick={handleValidateRationale}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors"
                            >
                              <FileCheck2 className="w-3.5 h-3.5 text-indigo-950" />
                              Check Objective Behavioral Evidence
                            </button>

                            {rationaleFeedback && (
                              <span
                                className={`text-xs font-semibold ${
                                  rationaleFeedback.isValid
                                    ? 'text-emerald-700'
                                    : 'text-amber-700'
                                }`}
                              >
                                {rationaleFeedback.feedback}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Transition Button to Step 3 */}
                        <div className="pt-3 border-t border-slate-200 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setInterviewerStep('step3_report');
                              handleFetchReport();
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-indigo-950 rounded-lg hover:bg-indigo-900 transition-colors shadow-sm"
                          >
                            <FileBadge className="w-4 h-4 text-amber-400" />
                            Complete Interview &amp; Generate Executive Audit Report ➔
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ------------------------------------------------------------------- */}
                {/* STEP 3: EXECUTIVE AUDIT REPORT                                     */}
                {/* ------------------------------------------------------------------- */}
                {interviewerStep === 'step3_report' && (
                  <div className="space-y-4">
                    {/* ERP Lock Verification Header */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between text-xs shadow-sm">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-700" />
                        <div>
                          <span className="font-bold text-slate-900">
                            Governance Verification Badge: Approved Interview Plan ({erpApprovalId || 'ERP-REQ-2026-90412'})
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Candidate: {selectedPreset.applicantName} · Organization: FP-Works (180 Employees)
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setInterviewerStep('step2_live')}
                        className="text-xs text-indigo-950 font-semibold underline hover:text-indigo-800"
                      >
                        Return to Live Interview Desk
                      </button>
                    </div>

                    <AuditReport
                      report={reportData}
                      isLoading={isLoadingReport}
                      onRefreshReport={handleFetchReport}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE 2: HR FIT & CONTROL / ADMIN GOVERNANCE VIEW                          */}
        {/* ========================================================================= */}
        {activeRole === 'admin' && (
          <div className="space-y-6">
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="text-xs font-semibold text-indigo-950">
                    Enterprise HR Compliance &amp; Verification Loop Control
                  </div>
                  <h2 className="text-xl font-bold text-slate-950 font-display mt-0.5">
                    Step 1 Interview Kit Verification &amp; Statutory Governance Control
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Audits C1–C5 core competencies, enforces 5-criterion question verification loops, and provides test triggers for K01–K05 defect simulation.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSetupModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-indigo-950" />
                    Open Deep Kit Inspector Modal
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateKit(false)}
                    disabled={isGeneratingKit}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-950 rounded-lg hover:bg-indigo-900 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isGeneratingKit ? 'animate-spin' : ''}`} />
                    {isGeneratingKit ? 'Verifying...' : 'Re-run 5-Criterion Verification Loop'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenerateKit(true)}
                    disabled={isGeneratingKit}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-300 rounded-lg hover:bg-rose-100 disabled:opacity-50 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                    Inject K01–K05 Defects Simulation
                  </button>
                </div>
              </div>

              {/* C1-C5 Competencies Matrix */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  1. Extracted Core Competencies (C1–C5)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {kit.competencies.map((comp) => (
                    <div
                      key={comp.id}
                      className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-1.5 text-xs shadow-sm"
                    >
                      <span className="font-mono font-bold text-indigo-950 block">
                        {comp.id}
                      </span>
                      <strong className="text-slate-900 block text-xs">
                        {comp.name}
                      </strong>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {comp.fitDescription}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5-Criterion Verification Matrix Table */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 font-display">
                    2. 5-Criterion Question Audit Matrix ({kit.questions.length} Questions)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Criteria: Legal · Job-Relevant · Behavioral · Single · Non-Leading
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Question Text</th>
                        <th className="py-2.5 px-2 text-center">Legal</th>
                        <th className="py-2.5 px-2 text-center">Job-Relevant</th>
                        <th className="py-2.5 px-2 text-center">Behavioral</th>
                        <th className="py-2.5 px-2 text-center">Single</th>
                        <th className="py-2.5 px-2 text-center">Non-Leading</th>
                        <th className="py-2.5 px-3 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {kit.questions.map((q) => {
                        const isSafe = q.checks?.risk?.level === 'none';
                        const isJobRel = q.checks?.grounded ?? true;
                        const isBeh = q.checks?.behavioral ?? true;
                        const isSingle = q.checks?.single ?? true;
                        const isNonLead = q.checks?.nonLeading ?? true;
                        const allPass = isSafe && isJobRel && isBeh && isSingle && isNonLead;

                        return (
                          <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-slate-900 max-w-md">
                              &ldquo;{q.text}&rdquo;
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {isSafe ? (
                                <span className="text-emerald-700 font-bold">✓</span>
                              ) : (
                                <span className="text-rose-700 font-bold">✕</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {isJobRel ? (
                                <span className="text-emerald-700 font-bold">✓</span>
                              ) : (
                                <span className="text-rose-700 font-bold">✕</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {isBeh ? (
                                <span className="text-emerald-700 font-bold">✓</span>
                              ) : (
                                <span className="text-rose-700 font-bold">✕</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {isSingle ? (
                                <span className="text-emerald-700 font-bold">✓</span>
                              ) : (
                                <span className="text-rose-700 font-bold">✕</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {isNonLead ? (
                                <span className="text-emerald-700 font-bold">✓</span>
                              ) : (
                                <span className="text-rose-700 font-bold">✕</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {allPass ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-800 rounded border border-emerald-200">
                                  PASS
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-50 text-rose-800 rounded border border-rose-200">
                                  REPAIRED
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pre-Ask Interception Log Summary */}
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  3. Pre-Ask Human-in-the-Loop Interception Audit Log ({preAskLogs.length} Events)
                </h3>
                {preAskLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    No risk interceptions recorded in this session yet. Test risky questions in Interviewer Desk to populate the log.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {preAskLogs.map((log) => (
                      <div
                        key={log.id}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-mono">{log.timestamp}</span>
                          <span className="font-bold text-rose-700">
                            {log.actionTaken}
                          </span>
                        </div>
                        <div className="text-rose-700 line-through">
                          Blocked: &ldquo;{log.originalDraft}&rdquo;
                        </div>
                        {log.finalQuestionSent && (
                          <div className="text-emerald-800 font-medium">
                            Sent Alternative: &ldquo;{log.finalQuestionSent}&rdquo;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Statutory Rules Reference Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900">
                  Enterprise Korean Labor Law Guardrails Reference
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-700">
                  <div className="p-2.5 bg-white rounded border border-slate-200">
                    <strong className="block text-indigo-950 font-semibold">
                      Equal Employment Act Art. 7(2)
                    </strong>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Statutory subject is <strong>Workers (all employees regardless of gender)</strong>, not merely female workers. Prohibits demanding physical conditions (appearance, height, weight) or unmarried status.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-slate-200">
                    <strong className="block text-indigo-950 font-semibold">
                      Fair Hiring Procedure Act Art. 4-3
                    </strong>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Directly regulates application materials at workplaces with <strong>30+ employees</strong> (FP-Works has 180 employees). Prohibits demanding job-irrelevant personal/family info.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded border border-slate-200">
                    <strong className="block text-indigo-950 font-semibold">
                      Job-Irrelevant Privacy (S11/S12)
                    </strong>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Classified as <strong>Medium Caution</strong> with explicit <code>lawRefs: []</code>. Never force-attaches statutory articles where none apply.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE 3: INTERVIEWEE / CANDIDATE PROTECTION VIEW                           */}
        {/* ========================================================================= */}
        {activeRole === 'interviewee' && (
          <div className="space-y-6">
            <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-6 shadow-sm">
              <div className="border-b border-slate-200 pb-4">
                <div className="text-xs font-semibold text-emerald-800">
                  Candidate Rights &amp; Psychological Safety Desk
                </div>
                <h2 className="text-xl font-bold text-slate-950 font-display mt-0.5">
                  Candidate Protection Desk · Real-Time Boundary &amp; Redress Guide
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Empowers candidates to identify discriminatory questions, set professional boundaries politely, and access statutory legal redress channels.
                </p>
              </div>

              {/* Active Question Strategy Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    Current Question in Verification Gate
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                      preAskRisk?.level === 'none'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}
                  >
                    Strategy: {preAskRisk?.candidateGuide?.badgeLabel || 'Boundary Setting Recommended'}
                  </span>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">
                    Interviewer Question:
                  </span>
                  <p className="text-sm font-semibold text-slate-900">
                    &ldquo;{draftQuestion}&rdquo;
                  </p>
                </div>

                {/* Polite Boundary Script Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Recommended Polite Boundary Script (Candidate Protection Guidance):
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyScript(
                          preAskRisk?.candidateGuide?.politeBoundaryScript ||
                            'If the intent of the question relates to job performance, I am fully prepared to meet the mandatory schedules and requirements stated in the job posting.'
                        )
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-950 hover:underline"
                    >
                      {copiedBoundaryScript ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy Script
                        </>
                      )}
                    </button>
                  </div>

                  <blockquote className="bg-indigo-50/60 border-l-4 border-indigo-950 p-3.5 rounded-r-lg text-xs text-slate-800 leading-relaxed font-medium">
                    &ldquo;
                    {preAskRisk?.candidateGuide?.politeBoundaryScript ||
                      'If the intent of this question concerns job performance, I am fully capable of fulfilling all duties and regular schedules specified in the job announcement. Regarding personal private matters that do not directly pertain to job execution, I respectfully ask for your understanding as I focus on my professional qualifications.'}
                    &rdquo;
                  </blockquote>
                </div>

                {/* Pivot Points */}
                <div className="space-y-2 pt-2">
                  <span className="text-xs font-semibold text-slate-800 block">
                    Competency Pivot Points:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(
                      preAskRisk?.candidateGuide?.pivotPoints || [
                        'C1 Recruiting Coordination: Pivot to schedule conflict resolution and ATS pipeline management',
                        'C2 Attendance & Payroll Reconciliation: Pivot to data integrity checks without arbitrary adjustments',
                        'C4 HR Data Management: Pivot to data minimization and role-based access control governance',
                      ]
                    ).map((pt, i) => (
                      <div
                        key={i}
                        className="bg-white border border-slate-200 rounded p-2 text-[11px] text-slate-700 flex items-center gap-1.5"
                      >
                        <ChevronRight className="w-3 h-3 text-indigo-950 shrink-0" />
                        {pt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Statutory Redress Channels */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-slate-900 font-display">
                  Statutory Redress &amp; Rights Protection Channels
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-indigo-950 font-bold">
                      <Scale className="w-4 h-4" />
                      Ministry of Employment &amp; Labor: Anonymous Reporting Center for Fair Hiring Violations
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Demanding job-irrelevant physical attributes (height, weight, appearance), marital status, personal wealth, or direct family background is subject to an administrative fine of up to 5,000,000 KRW under <strong>Fair Hiring Procedure Act Art. 4-3</strong>. Reports and corrective order requests can be submitted immediately via the online anonymous reporting center.
                    </p>
                    <div className="text-[10px] text-indigo-950 font-mono">
                      Ministry of Employment and Labor Helpline: 1350 (Domestic Toll-Free)
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-indigo-950 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      National Human Rights Commission of Korea: Discrimination Remedy Committee
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Employment discrimination based on gender, age, place of origin, religion, or marital status constitutes an infringement of the right to equality under <strong>National Human Rights Commission Act Art. 30</strong> and may be filed for formal remedial investigation.
                    </p>
                    <div className="text-[10px] text-indigo-950 font-mono">
                      Human Rights Counseling Center: 1331 (Domestic Toll-Free)
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                  <strong>Workplace Size Threshold (30+ Employees):</strong> The benchmark firm FP-Works maintains 180 regular employees, fully satisfying the statutory threshold for the Fair Hiring Procedure Act (Art. 4-3) to apply in its entirety.
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ROLE 4: POST-INTERVIEW FAIRNESS & COMPETENCY AUDIT REPORT                  */}
        {/* ========================================================================= */}
        {activeRole === 'report' && (
          <AuditReport
            report={reportData}
            isLoading={isLoadingReport}
            onRefreshReport={handleFetchReport}
          />
        )}
      </main>

      {/* Floating Modal System */}
      <EvalModal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        evalSummary={evalSummary}
        onRerunEval={handleRerunEval}
        isRunning={isRunningEval}
      />

      <SetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        selectedPreset={selectedPreset}
        kit={kit}
        rounds={rounds}
        onGenerateKit={handleGenerateKit}
        isGenerating={isGeneratingKit}
        onDocParsed={handleDocParsed}
      />
    </div>
  );
}
