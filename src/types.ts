export type RiskLevel = 'none' | 'caution' | 'high';

export type RiskSource = 'model' | 'second_opinion_downgrade' | 'fallback';

export type WorkspaceRole = 'interviewer' | 'admin' | 'interviewee' | 'report';

export interface LawEntry {
  id: string;
  name: string;
  shortName: string;
  article: string;
  summary: string;
  fullText: string;
}

export interface CandidateGuideResult {
  badgeLabel: string;
  summary: string;
  politeBoundaryScript: string;
  pivotPoints: string[];
  reportingGuidance: string[];
  generatedByModel?: string;
}

export interface RiskResult {
  level: RiskLevel;
  category: string;
  categoryLabel: string;
  lawRefs: string[];
  reason: string;
  alternativeQuestion: string | null;
  source: RiskSource;
  stage1Model?: string;
  stage2Model?: string;
  legalNote?: string;
  qualityStatus?: 'ok' | 'compound' | 'leading' | 'vague';
  qualityLabel?: string;
  qualityReason?: string;
  candidateGuide?: CandidateGuideResult | null;
}

export interface Rubric {
  score1: string;
  score3: string;
  score5: string;
}

export interface Competency {
  id: string;
  name: string;
  jdQuote: string;
  fitDescription: string;
}

export interface QuestionChecks {
  legal?: boolean;
  jobRelevant?: boolean;
  grounded: boolean;
  behavioral: boolean;
  single: boolean;
  nonLeading: boolean;
  risk: RiskResult;
  failedReasons: string[];
}

export interface Question {
  id: string;
  type: 'core' | 'followup';
  competencyId: string;
  text: string;
  resumeQuote: string | null;
  rubric: Rubric;
  checks: QuestionChecks;
  whyAsk?: string;
}

export interface Kit {
  competencies: Competency[];
  questions: Question[];
}

export interface VerificationFailure {
  questionId: string;
  questionText: string;
  reasons: string[];
}

export interface VerificationRound {
  round: number;
  checked: number;
  failed: VerificationFailure[];
  regeneratedIds: string[];
}

export interface RecommendedQuestionItem {
  id: string;
  text: string;
  fitValueName: string;
  whyGood: string;
  avoidTrap: string;
  rubric: Rubric;
}

export interface ResumeSection {
  id: string;
  docType: 'resume' | 'portfolio' | 'cover_letter';
  docLabel: string;
  title: string;
  period: string;
  content: string;
  highlightTags: string[];
  coachSummary: string;
  recommendedQuestions: RecommendedQuestionItem[];
}

export interface OrganizationFitValue {
  id: string;
  name: string;
  description: string;
  rubric: Rubric;
}

export interface OrganizationFit {
  id: string;
  organizationName: string;
  teamName: string;
  missionSummary: string;
  coreValues: OrganizationFitValue[];
}

export interface StandardQuestion {
  id: string;
  stageId: 'stage_icebreak' | 'stage_core' | 'stage_deep' | 'stage_closing';
  competencyId: string;
  fitValueName: string;
  text: string;
  mandatory: boolean;
  lockedByHr: boolean;
  rubric: Rubric;
  rationaleGuide: string;
}

export interface WorkflowStage {
  id: 'stage_icebreak' | 'stage_core' | 'stage_deep' | 'stage_closing';
  order: number;
  title: string;
  subtitle: string;
  requireMandatoryCompletion: boolean;
  hrGuideline: string;
}

export interface WorkflowConfig {
  enforceSequentialStages: boolean;
  blockHighRiskSend: boolean;
  requireEvaluationRationale: boolean;
  minRationaleLength: number;
  stages: WorkflowStage[];
}

export interface EvaluatorFeedback {
  score: 1 | 2 | 3 | 4 | 5;
  fitValueId: string;
  observedEvidence: string;
  rationale: string;
  biasCheckPassed: boolean;
  aiCoachingNote?: string;
}

export interface PreAskLogItem {
  id: string;
  timestamp: string;
  originalDraft: string;
  risk: RiskResult;
  actionTaken: 'replaced_with_alternative' | 'edited_manually' | 'sent_safe' | 'blocked_by_hr';
  finalQuestionSent?: string;
}

export interface Turn {
  id: string;
  index: number;
  stageId: string;
  question: string;
  wasReplacedFrom?: string;
  preAskRisk: RiskResult;
  candidateAnswer: string;
  competencyIds: string[];
  evaluation?: EvaluatorFeedback;
  timestamp: string;
}

export interface ApplicantPreset {
  id: string;
  label: string;
  badgeText: string;
  applicantName: string;
  appliedRole: string;
  experienceSummary: string;
  jdText: string;
  resumeText: string;
  organizationFit: OrganizationFit;
  standardQuestions: StandardQuestion[];
  sections: ResumeSection[];
  initialKit: Kit;
  initialRounds: VerificationRound[];
}

export interface AuditReport {
  coverage: {
    competencyId: string;
    name: string;
    asked: boolean;
    turnCount: number;
  }[];
  hrStandardCompliance: {
    totalMandatory: number;
    completedMandatory: number;
    complianceRate: number;
  };
  interceptedRisks: {
    originalDraft: string;
    level: RiskLevel;
    categoryLabel: string;
    lawRefs: string[];
    alternativeUsed: string | null;
    actionTaken: string;
  }[];
  riskyQuestionsSent: {
    turnIndex: number;
    question: string;
    level: RiskLevel;
    categoryLabel: string;
    alternativeQuestion: string | null;
  }[];
  evaluationAudit: {
    turnIndex: number;
    question: string;
    score: number;
    rationale: string;
    isEvidenceGrounded: boolean;
    feedback: string;
  }[];
  styleIssues: {
    turnIndex: number;
    question: string;
    issue: string;
  }[];
  summary: string;
  suggestions: string[];
  generatedByModel: string;
}

export interface EvalTestItem {
  id: number;
  code?: string;
  group?: 'safe' | 'quality_defect' | 'medium_risk' | 'high_risk';
  question: string;
  questionEn: string;
  expected: RiskLevel;
  expectedQuality?: 'ok' | 'compound' | 'leading' | 'vague';
  expectedLawRefs?: string[];
  expectedCandidateBadge?: string;
  candidateBoundaryGuide?: string;
  rewriteSuggestion?: string | null;
  note: string;
}

export interface EvalItemResult {
  id: number;
  code?: string;
  group?: 'safe' | 'quality_defect' | 'medium_risk' | 'high_risk';
  question: string;
  questionEn: string;
  expected: RiskLevel;
  got: RiskLevel;
  match: boolean;
  expectedQuality?: 'ok' | 'compound' | 'leading' | 'vague';
  gotQuality?: 'ok' | 'compound' | 'leading' | 'vague';
  qualityMatch?: boolean;
  categoryLabel: string;
  lawRefs: string[];
  reason: string;
  alternativeQuestion: string | null;
  candidateBadge?: string;
  candidateBoundaryGuide?: string;
}

export interface EvalRunSummary {
  suiteId?: 'fixed_b20' | 'demo_s20';
  suiteTitle?: string;
  passed: number;
  total: number;
  allPassed: boolean;
  ranAt: string;
  results: EvalItemResult[];
}

export interface KitValidationDefectItem {
  id: string;
  defectType: string;
  competencyId: string;
  badQuestion: string;
  expectedFailureReasons: string[];
  repairedQuestion: string;
}
