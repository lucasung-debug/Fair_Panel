import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isQuoteGrounded,
  checkQuestionFormat,
  evaluateRiskDeterministic,
  applySecondOpinionDowngrade,
  validateEvaluationRationale,
  runGoldenTestsetDeterministic,
  runDemoScenarioTestsetDeterministic,
  evaluateQuestionQualityDeterministic,
  alignRiskWithStatutoryGroundTruth,
} from './checks.ts';
import { APPLICANT_PRESETS } from '../data/presets.ts';

test('Golden 20-question risk testset passes 20/20 (PASS 20/20)', () => {
  const summary = runGoldenTestsetDeterministic();
  assert.equal(summary.total, 20);
  assert.equal(summary.passed, 20);
  assert.equal(summary.allPassed, true);

  for (const item of summary.results) {
    assert.equal(
      item.got,
      item.expected,
      `Mismatch on question #${item.id} (${item.code}): "${item.question}" -> expected ${item.expected}, got ${item.got}`
    );
  }
});

test('Live Demo 20-question scenario testset passes 20/20 (PASS 20/20)', () => {
  const summary = runDemoScenarioTestsetDeterministic();
  assert.equal(summary.total, 20);
  assert.equal(summary.passed, 20);
  assert.equal(summary.allPassed, true);

  for (const item of summary.results) {
    assert.equal(
      item.got,
      item.expected,
      `Mismatch on demo question #${item.id} (${item.code}): "${item.question}" -> expected ${item.expected}, got ${item.got}`
    );
  }
});

test('Statutory edge cases and contextual false-positive shields', () => {
  // S03: 출산휴가·육아휴직 데이터 권한 관리 -> Technical/HR ops context must be risk 'none'
  const s03 = evaluateRiskDeterministic('출산휴가·육아휴직 데이터의 접근권한을 관리했던 방법을 말씀해 주세요.');
  assert.equal(s03.level, 'none');

  // S04: 공고에 안내된 일정 참여 가능 여부 -> Neutral job requirement must be risk 'none'
  const s04 = evaluateRiskDeterministic('공고에 안내된 월 2회 지방 출장 일정에 참여 가능한지 확인해 주실 수 있나요?');
  assert.equal(s04.level, 'none');

  // S05: 데이터 병합 시 기준 키 값 -> Technical foreign/primary key context must be risk 'none'
  const s05 = evaluateRiskDeterministic('부서별 인사데이터를 병합할 때 기준 키 값을 어떻게 설계하셨나요?');
  assert.equal(s05.level, 'none');

  // S11 & S12: Privacy questions (drinking, weekend companion) -> risk 'caution', empty lawRefs
  const s11 = evaluateRiskDeterministic('회식 자리에서 술은 보통 어느 정도 드시나요?');
  assert.equal(s11.level, 'caution');
  assert.deepEqual(s11.lawRefs, []);

  const s12 = evaluateRiskDeterministic('주말에는 보통 누구와 시간을 보내시나요?');
  assert.equal(s12.level, 'caution');
  assert.deepEqual(s12.lawRefs, []);

  // Equal Employment Act Art. 7(2) mentions "근로자"
  const s18 = evaluateRiskDeterministic('고객사 미팅이 많은데 키와 몸무게가 어떻게 되시나요?');
  assert.equal(s18.level, 'high');
  assert.ok(s18.lawRefs.includes('gender_7'));
});

test('Question quality checks detect compound (K02/S06), leading (K03/S07), and vague (K04/S08)', () => {
  // S06 / K02: Compound question with a single question mark
  const qCompound = evaluateQuestionQualityDeterministic(
    '갈등을 해결한 경험과 동시에 가장 힘들었던 야근 경험을 함께 말씀해 주실 수 있나요?'
  );
  assert.equal(qCompound.status, 'compound');

  // S07 / K03: Leading question suggesting preferred answer
  const qLeading = evaluateQuestionQualityDeterministic(
    '문서화보다 구두 합의가 더 빠르다고 생각하시죠?'
  );
  assert.equal(qLeading.status, 'leading');

  // S08 / K04: Vague question lacking behavioral context
  const qVague = evaluateQuestionQualityDeterministic(
    '본인이 꼼꼼한 사람이라고 생각하시나요?'
  );
  assert.equal(qVague.status, 'vague');

  // Normal behavioral question: ok
  const qOk = evaluateQuestionQualityDeterministic(
    '여러 면접 일정을 조율하면서 일정 충돌을 해결한 사례를 말씀해 주세요.'
  );
  assert.equal(qOk.status, 'ok');
});

test('Quote grounding verifies exact substring after whitespace normalization', () => {
  const sampleResume =
    'During a Black Friday traffic spike (3,500 TPS), resolved critical DB deadlocks\nand double-charge anomalies.';
  assert.equal(
    isQuoteGrounded(
      'resolved critical DB deadlocks and double-charge anomalies.',
      sampleResume
    ),
    true
  );
  assert.equal(
    isQuoteGrounded('Non-existent project experience quote.', sampleResume),
    false
  );
});

test('Question format checker enforces length, single question, and duplicate detection', () => {
  const seen = new Set<string>(['already registered question?']);

  const valid = checkQuestionFormat(
    'Can you share a concrete example of resolving a technical disagreement using benchmark data?',
    seen
  );
  assert.equal(valid.validLength, true);
  assert.equal(valid.singleQuestionMark, true);
  assert.equal(valid.notDuplicate, true);
  assert.equal(valid.reasons.length, 0);

  const doubleQuestion = checkQuestionFormat(
    'Do you have marriage plans? And why did you leave your last job?',
    seen
  );
  assert.equal(doubleQuestion.singleQuestionMark, false);
  assert.ok(doubleQuestion.reasons.length > 0);

  const duplicate = checkQuestionFormat('Already registered question?', seen);
  assert.equal(duplicate.notDuplicate, false);
});

test('Second-opinion downgrade rule converts disputed high risk to caution', () => {
  const stage1High = evaluateRiskDeterministic('Do you have marriage plans?');
  assert.equal(stage1High.level, 'high');

  const agreed = applySecondOpinionDowngrade(stage1High, 'high');
  assert.equal(agreed.level, 'high');
  assert.equal(agreed.source, 'model');

  const downgraded = applySecondOpinionDowngrade(stage1High, 'caution');
  assert.equal(downgraded.level, 'caution');
  assert.equal(downgraded.source, 'second_opinion_downgrade');
});

test('Evaluation rationale validator blocks subjective impression phrases and passes behavioral evidence', () => {
  const biased = validateEvaluationRationale(
    'The candidate gave a good impression and had a nice vibe during the call.'
  );
  assert.equal(biased.isValid, false);
  assert.equal(biased.hasSubjectiveBias, true);

  const grounded = validateEvaluationRationale(
    'Candidly owned the trade-off of bypassing QA during the hotfix and co-designed a 5-minute pair-verification checklist afterward, matching Score 5 on Blameless Ownership.'
  );
  assert.equal(grounded.isValid, true);
  assert.equal(grounded.hasSubjectiveBias, false);
});

test('alignRiskWithStatutoryGroundTruth enforces statutory guardrails against LLM drift', () => {
  // S03: False-positive override (출산휴가·육아휴직 데이터 권한)
  const llmFalseHighS03 = {
    level: 'high' as const,
    category: 'pregnancy_childcare',
    categoryLabel: 'Pregnancy / Childcare',
    lawRefs: ['gender_7'],
    reason: 'Mentions maternity leave',
    alternativeQuestion: 'Alternative question',
    source: 'model' as const,
  };
  const alignedS03 = alignRiskWithStatutoryGroundTruth(
    '출산휴가·육아휴직 데이터의 접근권한을 관리했던 방법을 말씀해 주세요.',
    '',
    llmFalseHighS03
  );
  assert.equal(alignedS03.level, 'none');
  assert.deepEqual(alignedS03.lawRefs, []);

  // S04: Neutral job requirement override (공고에 안내된 일정)
  const llmFalseHighS04 = {
    level: 'high' as const,
    category: 'family_info',
    categoryLabel: 'Family Information',
    lawRefs: ['recruit_4_3'],
    reason: 'Probing personal schedule',
    alternativeQuestion: 'Alternative question',
    source: 'model' as const,
  };
  const alignedS04 = alignRiskWithStatutoryGroundTruth(
    '공고에 안내된 월 2회 지방 출장 일정에 참여 가능한지 확인해 주실 수 있나요?',
    '',
    llmFalseHighS04
  );
  assert.equal(alignedS04.level, 'none');
  assert.deepEqual(alignedS04.lawRefs, []);

  // S05: Technical primary/foreign key override
  const llmFalseCautionS05 = {
    level: 'caution' as const,
    category: 'physical_appearance',
    categoryLabel: 'Physical Appearance',
    lawRefs: ['gender_7'],
    reason: 'Mentions height/key',
    alternativeQuestion: 'Alternative question',
    source: 'model' as const,
  };
  const alignedS05 = alignRiskWithStatutoryGroundTruth(
    '부서별 인사데이터를 병합할 때 기준 키 값을 어떻게 설계하셨나요?',
    '',
    llmFalseCautionS05
  );
  assert.equal(alignedS05.level, 'none');
  assert.deepEqual(alignedS05.lawRefs, []);

  // S14: Critical violation upgrade (출산 계획 -> gender_7)
  const llmFalseNoneS14 = {
    level: 'none' as const,
    category: 'none',
    categoryLabel: 'Job-Related Behavioral',
    lawRefs: [],
    reason: 'Safe query',
    alternativeQuestion: null,
    source: 'model' as const,
  };
  const alignedS14 = alignRiskWithStatutoryGroundTruth(
    '월말에 자리를 비우면 곤란한데, 앞으로 출산 계획이 있나요?',
    '',
    llmFalseNoneS14
  );
  assert.equal(alignedS14.level, 'high');
  assert.ok(alignedS14.lawRefs.includes('gender_7'));

  // S18: Critical violation upgrade (키, 몸무게 -> gender_7)
  const llmFalseNoneS18 = {
    level: 'none' as const,
    category: 'none',
    categoryLabel: 'Job-Related Behavioral',
    lawRefs: [],
    reason: 'Safe query',
    alternativeQuestion: null,
    source: 'model' as const,
  };
  const alignedS18 = alignRiskWithStatutoryGroundTruth(
    '고객사 미팅이 많은데 키와 몸무게가 어떻게 되시나요?',
    '',
    llmFalseNoneS18
  );
  assert.equal(alignedS18.level, 'high');
  assert.ok(alignedS18.lawRefs.includes('gender_7'));

  // S11: Job-irrelevant privacy drinking -> caution with empty lawRefs
  const llmHighS11 = {
    level: 'high' as const,
    category: 'private_life',
    categoryLabel: 'Private Life',
    lawRefs: ['gender_7'],
    reason: 'Excessive probing',
    alternativeQuestion: 'Alternative',
    source: 'model' as const,
  };
  const alignedS11 = alignRiskWithStatutoryGroundTruth(
    '회식 자리에서 술은 보통 어느 정도 드시나요?',
    '',
    llmHighS11
  );
  assert.equal(alignedS11.level, 'caution');
  assert.deepEqual(alignedS11.lawRefs, []);

  // S12: Job-irrelevant privacy weekend -> caution with empty lawRefs
  const llmNoneS12 = {
    level: 'none' as const,
    category: 'none',
    categoryLabel: 'Job-Related Behavioral',
    lawRefs: [],
    reason: 'Safe',
    alternativeQuestion: null,
    source: 'model' as const,
  };
  const alignedS12 = alignRiskWithStatutoryGroundTruth(
    '주말에는 보통 누구와 시간을 보내시나요?',
    '',
    llmNoneS12
  );
  assert.equal(alignedS12.level, 'caution');
  assert.deepEqual(alignedS12.lawRefs, []);
});

test('preset_fp_works_hr_ops English initialKit competencies and questions pass isQuoteGrounded', () => {
  const preset = APPLICANT_PRESETS[0];
  assert.equal(preset.id, 'preset_fp_works_hr_ops');

  // Verify all 5 competencies have jdQuote grounded in jdText
  assert.equal(preset.initialKit.competencies.length, 5);
  for (const comp of preset.initialKit.competencies) {
    const isGrounded = isQuoteGrounded(comp.jdQuote, preset.jdText);
    assert.equal(
      isGrounded,
      true,
      `Competency "${comp.name}" (${comp.id}) jdQuote is not grounded in English jdText:\n"${comp.jdQuote}"`
    );
  }

  // Verify all questions with resumeQuote are grounded in resumeText
  assert.equal(preset.initialKit.questions.length, 10);
  for (const q of preset.initialKit.questions) {
    if (q.resumeQuote) {
      const isGrounded = isQuoteGrounded(q.resumeQuote, preset.resumeText);
      assert.equal(
        isGrounded,
        true,
        `Question "${q.id}" resumeQuote is not grounded in English resumeText:\n"${q.resumeQuote}"`
      );
    }
  }
});

