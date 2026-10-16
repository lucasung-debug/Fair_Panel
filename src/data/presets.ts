import type { ApplicantPreset, WorkflowConfig } from '../types.ts';

export const DEFAULT_WORKFLOW_CONFIG: WorkflowConfig = {
  enforceSequentialStages: true,
  blockHighRiskSend: true,
  requireEvaluationRationale: true,
  minRationaleLength: 20,
  stages: [
    {
      id: 'stage_icebreak',
      order: 1,
      title: 'Stage 1 · Structured Opening & Psychological Safety',
      subtitle: 'Introduce the interview structure and team context while strictly avoiding private small talk (hometown, marital status, housing).',
      requireMandatoryCompletion: false,
      hrGuideline:
        'Set a welcoming tone by outlining the interview agenda. Never ask about hometown, housing ownership, or family background as an icebreaker.',
    },
    {
      id: 'stage_core',
      order: 2,
      title: 'Stage 2 · HR Standard Core Questions (Values, Character & Team Fit)',
      subtitle: 'Ask identical core behavioral questions to every candidate for this role to evaluate decision-making principles and organizational fit fairly.',
      requireMandatoryCompletion: true,
      hrGuideline:
        'All HR-locked mandatory standard questions must be completed before unlocking deep resume-specific probing.',
    },
    {
      id: 'stage_deep',
      order: 3,
      title: 'Stage 3 · Deep Multi-Angle Probing Beyond AI-Polished Resumes',
      subtitle: 'Verify authentic actions, trade-off decisions, and core values behind resume bullet points and AI-polished cover letters.',
      requireMandatoryCompletion: false,
      hrGuideline:
        'Select each section in the left Applicant Dossier and use the right-hand AI Coach ("How to Ask from This Angle") to probe real experiences.',
    },
    {
      id: 'stage_closing',
      order: 4,
      title: 'Stage 4 · Evidence-Grounded Rubric Scoring & Mutual Q&A',
      subtitle: 'Document objective behavioral evidence ("Why I evaluated the candidate this way") anchored to 1/3/5 score rubrics.',
      requireMandatoryCompletion: false,
      hrGuideline:
        'Every evaluation score must be accompanied by concrete behavioral evidence and checked for subjective impression bias.',
    },
  ],
};

export const APPLICANT_PRESETS: ApplicantPreset[] = [
  {
    id: 'preset_fp_works_hr_ops',
    label: 'FP-Works · HR Operations Specialist (Gold)',
    badgeText: 'FP-Works 180 Workers · C1~C5 Golden Kit · Statutory Compliant',
    applicantName: 'FP-C01 (3 Yrs Exp)',
    appliedRole: 'HR Operations Specialist — People Operations Team',
    experienceSummary:
      '3 years operational experience (120 employees) · Coordinated 36 interview schedules across 8 postings · Reconciled attendance and payroll exceptions · Vendor dispute resolution · Excel closing time reduced from 180m to 75m',
    jdText: `[Fully Virtual Job Description · For FairPanel Live Demonstration]
The company, personnel count, and operational criteria are simulated for live demonstration purposes and do not represent actual employment postings.

Company Name: Virtual Enterprise FP-Works
Business Scope: Enterprise Logistics Operations Software & Enterprise Customer Support Services
Company Size: Private Enterprise with 180 Regular Workers
Position Title: HR Operations Specialist
Department: People Operations Team
Employment Type: Regular Full-time Employee
Work Location: Seoul HQ

Role Mission & Purpose
Accurately execute recurring HR operational workflows from recruiting coordination to HR master data reconciliation and month-end settlement, while identifying and remediating error root causes. This is an operational specialist position combining data verification with cross-functional alignment.

Key Responsibilities
1. Recruiting Operations: Utilize company ATS to publish job notices, coordinate interview schedules, guide candidates, and manage pipeline progression.
2. Time & Attendance / Payroll Pre-verification: Reconcile badge access punch logs, approved leave records, and authorized overtime submissions, identifying discrepancies and escalating confirmed exceptions to the payroll lead.
3. Vendor Settlement Reconciliation: Reconcile third-party contractor and service vendor contract terms, usage logs, and billing invoices, requesting itemized revisions and issuing correction notices.
4. HR Master Data & Privacy Governance: Maintain snapshot baseline dates and aggregation definitions for workforce reporting, segmenting data attributes and enforcing role-based access permissions.
5. Workflow Automation & Improvement: Optimize recurring verification workflows using Excel or Google Sheets, benchmarking pre- and post-implementation outputs to verify processing accuracy and execution run-time.

Qualifications
- Direct operational experience in human resources or people operations
- Proficiency in spreadsheet lookup formulas, conditional aggregations, and pivot tables
- Proven discipline in retaining objective evidentiary documentation and audit histories when resolving errors
- Demonstrated ability to mediate closing deadlines and schedule adjustments across internal departments, finance, and external vendors

Preferred Qualifications
- Practical experience operating existing ATS or HRIS platforms
- Track record of incrementally improving and empirically validating recurring operational workflows
- Experience managing employee master data under strict least-privilege access and minimal personal data collection standards

Scope of Authority & Operational Boundaries
Final legal decisions regarding payroll disbursement approvals, statutory tax filings, and labor dispute counsel are handled exclusively by designated payroll leads or external labor attorneys. This role is responsible for pre-verification data integrity and audit logging. Enterprise compensation architecture design or software developer-level programming skills are not required qualifications.

Working Conditions & Travel Requirement
- Standard schedule: Monday through Friday, 09:00–18:00 (1-hour lunch break).
- This role requires same-day regional business travel twice per month for regular operational audits. Travel dates are mutually agreed upon in advance.
- The ability to fulfill this travel requirement is confirmed using identical, standardized phrasing across all applicants.
- Month-end closing schedules are coordinated collaboratively as a team. Constant night-shift or weekend work is not a prerequisite.
- Driving license, personal vehicle ownership, or physical measurements are not job requirements.

Application & Evaluation Criteria
Document Review -> Structured Interview -> Final Offer Notice
Resumes are evaluated strictly on documented operational roles, verifiable actions, and observable results. Photographs, birth dates, age, gender, marital status, hometown/origin, family details, or personal assets are strictly prohibited from evaluation.

Interview Standards
All applicants are evaluated on identical core competencies and common behavioral questions. Follow-up probing is strictly restricted to verifiable experiences documented in the resume. Personal background factors unrelated to job execution are never evaluated.`,
    resumeText: `[Fully Virtual Resume · For FairPanel Live Demonstration]
All individuals, company names, project experiences, and metrics below are simulated data created for demonstration purposes and do not represent personal records of real applicants.

Applicant Identifier: FP-C01
Target Position: HR Operations Specialist
Legal Name, photograph, contact info, home address, date of birth, gender, marital status, regional origin, family background, and asset records are strictly excluded.

Work Experience
Virtual Enterprise FP-Previous / People Operations Team / Operations Associate
Tenure: 2023.07.01 – 2026.06.30
Organization Scale: 120 Regular Workers
Scope: Recruiting schedule operations, time & attendance pre-reconciliation, vendor billing review, HR master data administration, Excel verification audit improvements

Experience 1. Recruiting Schedule Operations
Between January and March 2026, coordinated 36 interview schedules across 8 job postings.
Recorded pipeline stages and confirmed time slots in the existing ATS, categorizing change requests by request date, rationale for change, and confirmation status.
When interview panels encountered calendar conflicts, reconfirmed candidate availability before securing alternative interview slots with the panel.
Did not make final hiring decisions, and did not procure or implement the ATS software. Did not measure schedule change percentages or hiring conversion metrics.

Experience 2. Time & Attendance / Payroll Pre-verification
In April 2026, identified 7 missing badge punches and 3 duplicate entries across the monthly closing files for 120 employees.
Reconciled punch logs, approved leave records, and departmental sign-offs. For discrepant records, verified with departmental points of contact, recorded authorized correction notes with confirmation timestamps, and handed off reconciled files to the payroll lead.
Never arbitrarily altered time records without verified supporting documentation. Did not execute final payroll disbursements or statutory tax filings.

Experience 3. External Service Vendor Settlement Reconciliation
In May 2026, identified 2 canceled service subscriptions included across 48 billing line items from an external service vendor.
Cross-referenced contract termination terms, actual service usage logs, and cancellation request records. Verified that the cancellation was submitted prior to the vendor's billing snapshot date, requested an amended invoice, and delivered the reconciled ledger following finance lead review.
Personal scope was limited to detecting discrepancies and requesting amendments; did not negotiate contract pricing or approve final disbursements.

Experience 4. HR Master Data & Personal Privacy Governance
Defined active month-end headcount as employees actively employed on the final calendar day of the month, annotating snapshot baseline dates at the header of all reports.
For maternity leave and childcare leave records, checked only leave category, start date, and end date, strictly restricting system access permissions to 2 HR operators and 1 designated approver.
Departmental sharing sheets included only essential scheduling dates required for workflow planning. Never collected personal medical diagnosis records, family member composition, or personal childbirth plans.
Did not author company-wide privacy policy charters or design application form questionnaires.

Experience 5. Excel Verification Table Optimization & Exception Handling
Built an automated Excel reconciliation audit sheet using XLOOKUP, COUNTIFS, and pivot tables to flag missing and duplicate records across source ledgers.
Comparing monthly work logs between Oct–Dec 2025 and Jan–Mar 2026, average monthly closing verification run-time decreased from 180 minutes to 75 minutes.
Comparison was conducted across identical closing datasets for 120 employees under the same verification scope. This represents a pre-and-post observational result within a single company, not an experiment isolated from confounding factors.
In February 2026, identified that 1 newly introduced leave code was omitted from the automated aggregation during pre-deployment cross-checking.
Updated the system code registry and recalculated the dataset. Subsequently implemented an unmapped code quarantine queue and integrated a total source record count validation check against aggregated line items.
Did not measure overall error rates or long-term financial cost savings.

Tools & Systems
Excel: XLOOKUP, COUNTIFS, Pivot Tables, Data Validation Rules
Google Sheets: Access permission tiers and sharing domain restrictions
ATS: Operated posting lifecycle, candidate pipelines, and panel interview scheduling
Did not include programming languages, generative AI tooling, or no-code automation platforms on this resume.

Operational Boundaries & Motivation
Have no experience designing enterprise-wide total reward or compensation structures.
Applied to FP-Works to take ownership of finding operational data discrepancies and establishing rigorous audit trails across a broader logistics workflow. Plan to first master existing closing workflows and data definitions upon joining.
Have not set specific numerical targets for post-onboarding goals or a fixed start date.`,
    organizationFit: {
      id: 'fit_fp_works_ops',
      organizationName: 'FP-Works',
      teamName: 'People Operations Team',
      missionSummary:
        'As an enterprise logistics SaaS company with 180 regular workers, we uphold rigorous data integrity across recruiting, attendance, and billing while strictly enforcing statutory anti-discrimination and minimal personal data collection standards.',
      coreValues: [
        {
          id: 'val_data_accuracy',
          name: 'Data Integrity & Procedural Accuracy',
          description:
            'Never arbitrarily adjust numbers based on conjecture; verify and correct discrepancies strictly based on source ledger reconciliation and authorized approval audit trails.',
          rubric: {
            score1: 'Arbitrarily adjusts metrics without supporting evidence or skips formal verification procedures.',
            score3: 'Investigates discrepancies through source ledger reconciliation and coordinator confirmation, logging audit trails.',
            score5: 'Systematizes pre-verification criteria and deploys recurrence-prevention controls (such as source record count validation) when exceptions occur.',
          },
        },
        {
          id: 'val_privacy_integrity',
          name: 'Privacy Governance & Statutory Boundaries',
          description:
            'Enforce least-privilege access and minimal personal data collection standards, strictly protecting job-irrelevant private life under statutory regulations.',
          rubric: {
            score1: 'Shares personal records without access controls or inquires into job-irrelevant personal matters.',
            score3: 'Segments data sharing scope based on operational necessity and restricts unauthorized inspection.',
            score5: 'Strictly segregates raw master records from departmental summaries under least-privilege principles, proactively eliminating statutory discrimination risks.',
          },
        },
        {
          id: 'val_process_improvement',
          name: 'Empirical Workflow Optimization & Honest Boundaries',
          description:
            'Substantively streamline recurring workflows using spreadsheets while honestly acknowledging measurement boundaries without inflating unverified achievements.',
          rubric: {
            score1: 'Inflates unverified metrics or fails to conduct pre- and post-implementation comparative validation.',
            score3: 'Improves recurring tasks with lookup formulas and pivot tables, validating time savings through comparative work logs.',
            score5: 'Proactively identifies latent defects (such as unmapped codes) and transparently distinguishes measured results from unmeasured boundaries.',
          },
        },
      ],
    },
    standardQuestions: [
      {
        id: 'sq_fp_travel',
        stageId: 'stage_core',
        competencyId: 'comp_c1_recruit_ops',
        fitValueName: 'Data Integrity & Procedural Accuracy',
        text: 'This role requires same-day regional business travel twice per month for regular operational audits. Are you able to fulfill this job requirement?',
        mandatory: true,
        lockedByHr: true,
        rubric: {
          score1: 'States inability to fulfill the travel requirement or rejects the job condition.',
          score3: 'Clearly confirms readiness to perform scheduled same-day regional business travel twice per month.',
          score5: 'Confirms travel readiness and articulates specific preparation workflows to ensure seamless remote ledger reconciliation.',
        },
        rationaleGuide:
          'Standard bona fide job requirement asked identically to all candidates. Record only confirmation of travel availability. Never probe into marital status, child rearing, or residential location.',
      },
      {
        id: 'sq_fp_c4_privacy',
        stageId: 'stage_core',
        competencyId: 'comp_c4_privacy',
        fitValueName: 'Privacy Governance & Statutory Boundaries',
        text: 'When sharing HR master data with operational departments, what specific criteria and procedures did you use to govern access permissions and data scope?',
        mandatory: true,
        lockedByHr: true,
        rubric: {
          score1: 'Shares entire datasets indiscriminately without segmenting recipients or necessary attributes.',
          score3: 'Filters and provides only essential attributes based on departmental business need and access authorization.',
          score5: 'Strictly segregates raw master access from departmental sharing copies and institutes least-privilege protocols to safeguard sensitive data.',
        },
        rationaleGuide:
          'Observe whether the candidate understands the statutory intent of data protection and least-privilege access rather than probing personal background.',
      },
    ],
    sections: [
      {
        id: 'sec_fp_1',
        docType: 'resume',
        docLabel: 'Resume · Experience 1',
        title: 'Recruiting Schedule Operations: Coordinated 36 Interviews Across 8 Postings with Audit Logging',
        period: '2026.01 – 2026.03',
        content:
          'Between January and March 2026, coordinated 36 interview schedules across 8 job postings. Recorded pipeline stages and confirmed time slots in the existing ATS, categorizing change requests by request date, rationale for change, and confirmation status. When interview panels encountered calendar conflicts, reconfirmed candidate availability before securing alternative interview slots with the panel. Did not make final hiring decisions, and did not procure or implement the ATS software.',
        highlightTags: ['36 Interviews Coordinated', 'Request Date/Reason/Status Log', 'Panel Conflict Resolution'],
        coachSummary:
          'Verify the criteria and procedures used to mediate calendar conflicts between panels and candidates. Probe hands-on operational rigor while guarding against resume inflation regarding ATS software procurement.',
        recommendedQuestions: [
          {
            id: 'rq_fp_1a',
            text: 'When coordinating the 36 interview schedules, what specific procedure did you follow to log change requests and confirm alternative slots with the interview panel?',
            fitValueName: 'Data Integrity & Procedural Accuracy',
            whyGood:
              'Directly grounded in documented resume experiences to verify multi-party schedule mediation and change tracking behavior.',
            avoidTrap:
              '🚫 DO NOT ASK: Do not ask personal questions regarding personal time management or private weekend commitments.',
            rubric: {
              score1: 'Cannot explain the logging procedure and claims adjustments were made solely via verbal communication.',
              score3: 'Explains how change requests were recorded by request date, reason, and status, detailing panel coordination steps.',
              score5: 'Clearly outlines the sequence between candidate reconfirmation and panel re-booking, including post-confirmation audit logging.',
            },
          },
        ],
      },
      {
        id: 'sec_fp_2',
        docType: 'resume',
        docLabel: 'Resume · Experience 2',
        title: 'Time & Attendance Pre-Verification: Reconciled 120-Worker Closing, Identifying 7 Missing & 3 Duplicate Punches',
        period: '2026.04',
        content:
          'In April 2026, identified 7 missing badge punches and 3 duplicate entries across the monthly closing files for 120 employees. Reconciled punch logs, approved leave records, and departmental sign-offs. For discrepant records, verified with departmental points of contact, recorded authorized correction notes with confirmation timestamps, and handed off reconciled files to the payroll lead. Never arbitrarily altered time records without verified supporting documentation.',
        highlightTags: ['120 Employee Reconciliation', '7 Missing / 3 Duplicate Punches', 'Zero Arbitrary Adjustment'],
        coachSummary:
          'Verify the candidate’s adherence to evidence-based reconciliation when identifying attendance discrepancies. Confirm they do not inflate their scope to payroll disbursement or statutory tax filings.',
        recommendedQuestions: [
          {
            id: 'rq_fp_2a',
            text: 'When you identified the 7 missing badge punches, what specific procedure did you follow to verify actual work history and record authorized corrections?',
            fitValueName: 'Data Integrity & Procedural Accuracy',
            whyGood:
              'Verifies hands-on procedural discipline in eliminating arbitrary modifications and maintaining strict ledger reconciliation.',
            avoidTrap:
              '🚫 DO NOT ASK: Avoid leading questions inquiring whether the candidate endured heavy overtime or sacrificed personal rest.',
            rubric: {
              score1: 'Adjusted time records based on guesswork or describes vague verification steps.',
              score3: 'Explains cross-referencing punch records, leave approvals, and departmental sign-offs.',
              score5: 'Articulates the exact sequence of discrepancy identification, formal authorization, and timestamp logging under zero-guesswork standards.',
            },
          },
        ],
      },
      {
        id: 'sec_fp_3',
        docType: 'portfolio',
        docLabel: 'Portfolio · Project 1 (Vendor Billing Reconciliation)',
        title: 'Vendor Billing Settlement: Identified 2 Canceled Services Across 48 Line Items & Requested Correction',
        period: '2026.05',
        content:
          'In May 2026, identified 2 canceled service subscriptions included across 48 billing line items from an external service vendor. Cross-referenced contract termination terms, actual service usage logs, and cancellation request records. Verified that the cancellation was submitted prior to the vendor\'s billing snapshot date, requested an amended invoice, and delivered the reconciled ledger following finance lead review. Personal scope was limited to detecting discrepancies and requesting amendments; did not negotiate contract pricing or approve final disbursements.',
        highlightTags: ['2 Canceled Services Detected', 'Billing Snapshot Verification', 'Amended Invoice Requested'],
        coachSummary:
          'Evaluate the candidate’s capability to defend against billing overcharges by reconciling contract terms with actual usage. Verify clear self-awareness of role boundaries (discrepancy detection vs. pricing negotiation).',
        recommendedQuestions: [
          {
            id: 'rq_fp_3a',
            text: 'What specific contract terms and service records did you cross-reference to verify that the 2 canceled services should not have been billed?',
            fitValueName: 'Data Integrity & Procedural Accuracy',
            whyGood:
              'Verifies objective evidence reconciliation and professional communication in resolving third-party commercial discrepancies.',
            avoidTrap:
              '🚫 DO NOT ASK: Do not probe into personal relationships or emotional tensions with external vendor representatives.',
            rubric: {
              score1: 'Merely asserts it was a vendor billing error without detailing evidence reconciliation.',
              score3: 'Explains cross-referencing contract cancellation conditions against dated cancellation requests.',
              score5: 'Details the precise reconciliation between billing snapshot dates and request submission timestamps, including formal finance handoff.',
            },
          },
        ],
      },
      {
        id: 'sec_fp_4',
        docType: 'resume',
        docLabel: 'Resume · Experience 4',
        title: 'HR Master Data & Privacy Governance: Restricting Maternity/Childcare Leave Data to 3 Authorized Operators',
        period: '2023.07 – 2026.06',
        content:
          'Defined active month-end headcount as employees actively employed on the final calendar day of the month, annotating snapshot baseline dates at the header of all reports. For maternity leave and childcare leave records, checked only leave category, start date, and end date, strictly restricting system access permissions to 2 HR operators and 1 designated approver. Departmental sharing sheets included only essential scheduling dates required for workflow planning. Never collected personal medical diagnosis records, family member composition, or personal childbirth plans.',
        highlightTags: ['Snapshot Baseline Header', '3-Person Leave Data Access Limit', 'Zero Diagnosis/Family Collection'],
        coachSummary:
          'Examine the data access controls applied to sensitive leave records. CAUTION: Focus exclusively on data security and least-privilege workflows; never pivot into personal inquiries regarding childbirth or family plans.',
        recommendedQuestions: [
          {
            id: 'rq_fp_4a',
            text: 'How did you manage access permissions to restrict maternity and childcare leave data to authorized HR personnel while separating departmental sharing sheets?',
            fitValueName: 'Privacy Governance & Statutory Boundaries',
            whyGood:
              'Evaluates systematic implementation of role-based access controls and minimal personal data collection on administrative ledgers.',
            avoidTrap:
              '🚫 DO NOT ASK: Strictly avoid asking the candidate about their own marriage plans or family planning (High risk under Equal Employment Act Art. 7).',
            rubric: {
              score1: 'Cannot explain access authorization tiers or data governance criteria.',
              score3: 'Explains how access was partitioned between authorized personnel and operational summaries.',
              score5: 'Details strict minimal collection standards (leave type and duration only) and systemic barriers preventing exposure of personal medical information.',
            },
          },
        ],
      },
      {
        id: 'sec_fp_5',
        docType: 'portfolio',
        docLabel: 'Portfolio · Project 2 (Excel Verification Automation)',
        title: 'Excel Verification Table Optimization: Reduced Closing Run-Time from 180m to 75m & Defended Unmapped Codes',
        period: '2025.10 – 2026.03',
        content:
          'Built an automated Excel reconciliation audit sheet using XLOOKUP, COUNTIFS, and pivot tables to flag missing and duplicate records across source ledgers. Comparing monthly work logs between Oct–Dec 2025 and Jan–Mar 2026, average monthly closing verification run-time decreased from 180 minutes to 75 minutes. In February 2026, identified that 1 newly introduced leave code was omitted from the automated aggregation during pre-deployment cross-checking. Updated the system code registry and recalculated the dataset. Subsequently implemented an unmapped code quarantine queue and integrated a total source record count validation check against aggregated line items.',
        highlightTags: ['180m → 75m Closing Run-Time', 'XLOOKUP / COUNTIFS / Pivot', 'Unmapped Code Quarantine'],
        coachSummary:
          'Verify the empirical foundation of the run-time reduction and evaluate how the candidate defended against exception defects by introducing total count reconciliation checks.',
        recommendedQuestions: [
          {
            id: 'rq_fp_5a',
            text: 'After identifying that 1 new leave code was omitted from aggregation, what specific validation check did you add to ensure unmapped codes are flagged in future closings?',
            fitValueName: 'Empirical Workflow Optimization & Honest Boundaries',
            whyGood:
              'Tests whether the candidate translates defect discoveries into systemic procedural guardrails rather than one-off manual fixes.',
            avoidTrap:
              '🚫 DO NOT ASK: Do not inquire into off-hours private study habits or personal certification expenses.',
            rubric: {
              score1: 'States they merely updated the single code without implementing verification controls.',
              score3: 'Explains updating the code registry and quarantining unmapped records for manual review.',
              score5: 'Demonstrates institutionalizing total source record count reconciliation to automatically catch discrepancy exceptions.',
            },
          },
        ],
      },
    ],
    initialKit: {
      competencies: [
        {
          id: 'comp_c1_recruit_ops',
          name: 'C1. Recruiting Operations & Interview Coordination',
          jdQuote: 'Utilize company ATS to publish job notices, coordinate interview schedules, guide candidates, and manage pipeline progression.',
          fitDescription: 'Interview schedule mediation, multi-party calendar conflict resolution, and systematic change tracking',
        },
        {
          id: 'comp_c2_payroll_ops',
          name: 'C2. Attendance & Payroll Pre-Verification',
          jdQuote: 'Reconcile badge access punch logs, approved leave records, and authorized overtime submissions, identifying discrepancies and escalating confirmed exceptions to the payroll lead.',
          fitDescription: 'Source ledger reconciliation against authorized approvals with zero arbitrary adjustments',
        },
        {
          id: 'comp_c3_vendor_ops',
          name: 'C3. Vendor Settlement & Billing Reconciliation',
          jdQuote: 'Reconcile third-party contractor and service vendor contract terms, usage logs, and billing invoices, requesting itemized revisions and issuing correction notices.',
          fitDescription: 'Cross-referencing contractual terms and service logs to resolve commercial billing discrepancies',
        },
        {
          id: 'comp_c4_privacy',
          name: 'C4. HR Master Data & Privacy Governance',
          jdQuote: 'Maintain snapshot baseline dates and aggregation definitions for workforce reporting, segmenting data attributes and enforcing role-based access permissions.',
          fitDescription: 'Enforcing least-privilege access and minimal collection standards on sensitive workforce records',
        },
        {
          id: 'comp_c5_improvement',
          name: 'C5. Workflow Optimization & Result Verification',
          jdQuote: 'Optimize recurring verification workflows using Excel or Google Sheets, benchmarking pre- and post-implementation outputs to verify processing accuracy and execution run-time.',
          fitDescription: 'Streamlining repetitive verification with spreadsheets while implementing systemic exception defense',
        },
      ],
      questions: [
        {
          id: 'q_fp_gold_c1_common',
          type: 'core',
          competencyId: 'comp_c1_recruit_ops',
          text: 'Can you describe a time when you resolved calendar conflicts while coordinating multiple interview schedules?',
          resumeQuote: null,
          whyAsk: 'Evaluates all candidates on the same baseline for multi-party schedule mediation and calendar conflict resolution.',
          rubric: {
            score1: 'Fails to articulate clear personal actions or describes passive communication.',
            score3: 'Explains identifying calendar conflicts and coordinating with stakeholders.',
            score5: 'Articulates clear notification workflows and audit logging that allow reliable verification.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Behavioral',
              lawRefs: [],
              reason: 'Job-related behavioral question evaluating recruiting schedule mediation with zero discrimination risk.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_fp_gold_c1_followup',
          type: 'followup',
          competencyId: 'comp_c1_recruit_ops',
          text: 'While managing the 36 interview schedules, what specific method did you use to log schedule change requests?',
          resumeQuote: 'Between January and March 2026, coordinated 36 interview schedules across 8 job postings.',
          whyAsk: 'Verifies verifiable operational rigor in tracking schedule changes across the 36 interviews documented on the resume.',
          rubric: {
            score1: 'Unable to explain whether or how records were maintained.',
            score3: 'Explains the recorded data fields and tracking location.',
            score5: 'Distinguishes request versus confirmation statuses and details how updates were communicated to stakeholders.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Probing',
              lawRefs: [],
              reason: 'Directly grounded in documented resume experiences to verify change tracking actions.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_fp_gold_c2_common',
          type: 'core',
          competencyId: 'comp_c2_payroll_ops',
          text: 'Can you share an example of identifying and resolving record errors prior to attendance closing?',
          resumeQuote: null,
          whyAsk: 'Evaluates procedural rigor in identifying and remediating attendance data errors before payroll closing.',
          rubric: {
            score1: 'Evidence materials or corrective actions are vague.',
            score3: 'Explains source ledger cross-referencing and verification with department contacts.',
            score5: 'Distinguishes authorized correction logs and handoff boundaries to the payroll lead.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Behavioral',
              lawRefs: [],
              reason: 'Standard competency question assessing pre-closing attendance verification.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_fp_gold_c2_followup',
          type: 'followup',
          competencyId: 'comp_c2_payroll_ops',
          text: 'What specific procedure did you follow to verify actual work history for the 7 missing badge punches?',
          resumeQuote: 'In April 2026, identified 7 missing badge punches and 3 duplicate entries across the monthly closing files for 120 employees.',
          whyAsk: 'Verifies the procedure used to reconcile the 7 missing punch records against source ledgers without arbitrary adjustments.',
          rubric: {
            score1: 'Adjusted time records based on guesswork or unverified assumptions.',
            score3: 'Explains cross-referencing records and coordinating with points of contact.',
            score5: 'Articulates the sequence of discrepancy handling, approval sign-off, and logging under zero-guesswork standards.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Probing',
              lawRefs: [],
              reason: 'Grounded in resume text and confirms adherence to zero arbitrary modification principles.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_fp_gold_c3_common',
          type: 'core',
          competencyId: 'comp_c3_vendor_ops',
          text: 'How did you handle a situation where external vendor billing details differed from contract terms?',
          resumeQuote: null,
          whyAsk: 'Evaluates common capability in reconciling vendor service contracts and handling billing discrepancies.',
          rubric: {
            score1: 'Discrepancy evidence or resolution steps are unclear.',
            score3: 'Cross-referenced contract terms with usage logs and requested billing amendments.',
            score5: 'Details audit history retention and demarcates roles between discrepancy detection and finance approval.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Behavioral',
              lawRefs: [],
              reason: 'Assesses professional competency in resolving third-party billing discrepancies.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_fp_gold_c3_followup',
          type: 'followup',
          competencyId: 'comp_c3_vendor_ops',
          text: 'What documentation did you cross-reference to verify why the 2 canceled services were billed?',
          resumeQuote: 'In May 2026, identified 2 canceled service subscriptions included across 48 billing line items from an external service vendor.',
          whyAsk: 'Verifies objective evidentiary documentation used to establish the gap between cancellation dates and billing snapshots.',
          rubric: {
            score1: 'Simply claims the vendor made an error without citing documentation.',
            score3: 'Explains cross-referencing contract cancellation terms and formal cancellation records.',
            score5: 'Provides clear evidence comparing billing cutoff dates with submission timestamps to prove amendment need.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Probing',
              lawRefs: [],
              reason: 'Directly grounded in documented resume experience regarding vendor settlement reconciliation.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_fp_gold_c4_common',
          type: 'core',
          competencyId: 'comp_c4_privacy',
          text: 'Can you share an example of establishing data access boundaries when sharing HR master data?',
          resumeQuote: null,
          whyAsk: 'Verifies adherence to least-privilege and minimal collection standards when distributing personnel data.',
          rubric: {
            score1: 'Fails to distinguish recipient tiers or necessary data fields.',
            score3: 'Segments data boundaries based on operational necessity and authorization.',
            score5: 'Delineates raw master access from departmental sharing copies, preventing sensitive exposure.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Behavioral',
              lawRefs: [],
              reason: 'Standard competency question evaluating HR data governance and access control principles.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_fp_gold_c4_followup',
          type: 'followup',
          competencyId: 'comp_c4_privacy',
          text: 'How did you govern system access permissions for maternity and childcare leave data?',
          resumeQuote: 'For maternity leave and childcare leave records, checked only leave category, start date, and end date, strictly restricting system access permissions to 2 HR operators and 1 designated approver.',
          whyAsk: 'Verifies governance procedures for sensitive leave records, strictly separated from the candidate’s personal life.',
          rubric: {
            score1: 'Unable to explain who was granted access or the criteria used.',
            score3: 'Explains the authorized roles and permitted data attributes.',
            score5: 'Details the exact method for isolating minimal necessary attributes from departmental sharing views.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Probing',
              lawRefs: [],
              reason: 'Evaluates administrative data governance procedures, fully distinguished from unlawful personal childbirth probing.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_fp_gold_c5_common',
          type: 'core',
          competencyId: 'comp_c5_improvement',
          text: 'Can you describe a time when you optimized a recurring workflow and verified the accuracy of the results?',
          resumeQuote: null,
          whyAsk: 'Evaluates candidate experience in validating data accuracy alongside speed improvements during process optimization.',
          rubric: {
            score1: 'Claims time was reduced without citing verification evidence.',
            score3: 'Explains how pre- and post-implementation outputs were compared.',
            score5: 'Articulates exception discovery and recurrence prevention while acknowledging unmeasured boundaries.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Behavioral',
              lawRefs: [],
              reason: 'Job-related question evaluating process improvement and result validation rigor.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_fp_gold_c5_followup',
          type: 'followup',
          competencyId: 'comp_c5_improvement',
          text: 'How did you handle the situation when you discovered that 1 newly introduced leave code was omitted from aggregation?',
          resumeQuote: 'In February 2026, identified that 1 newly introduced leave code was omitted from the automated aggregation during pre-deployment cross-checking.',
          whyAsk: 'Verifies follow-up validation behavior such as updating code registries and creating unmapped code quarantine queues.',
          rubric: {
            score1: 'Claims only that the code was updated without further validation.',
            score3: 'Explains updating the code registry and recalculating totals.',
            score5: 'Details follow-up controls including unmapped code quarantine and total source record count validation.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Probing',
              lawRefs: [],
              reason: 'Directly grounded in resume text verifying exception handling and verification improvement.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
      ],
    },
    initialRounds: [
      {
        round: 1,
        checked: 10,
        failed: [
          {
            questionId: 'q_k01_defect',
            questionText: 'Can you describe the process of designing the enterprise-wide compensation system?',
            reasons: [
              'Grounding defect (grounded=false): Fabricated experience not on resume; resume explicitly notes no compensation design experience',
            ],
          },
          {
            questionId: 'q_k02_defect',
            questionText: 'How did you verify billing discrepancies, and how did you resolve interview scheduling conflicts?',
            reasons: [
              'Compound question (single=false): Combines two distinct tasks (billing discrepancies and interview conflicts) in a single turn',
            ],
          },
          {
            questionId: 'q_k03_defect',
            questionText: 'Attendance errors stem from operator carelessness, so isn\'t retraining obviously the correct answer?',
            reasons: [
              'Leading question (nonLeading=false): Pre-supposes the answer, preventing objective behavioral verification (behavioral=false)',
            ],
          },
        ],
        regeneratedIds: ['q_k01_defect', 'q_k02_defect', 'q_k03_defect'],
      },
      {
        round: 2,
        checked: 3,
        failed: [],
        regeneratedIds: [],
      },
    ],
  },
  {
    id: 'preset_fintech_backend',
    label: 'Fintech · Senior Backend Engineer',
    badgeText: 'Ownership · Evidence Debate · Authentic Fit',
    applicantName: 'Doyun Kim (6 Yrs Exp)',
    appliedRole: 'Senior Backend Engineer — Core Payment Platform',
    experienceSummary:
      '6 years in distributed payment processing · Led legacy settlement MSA migration · Open-source contributor with an 8-month career break',
    jdText: `[Job Description] Senior Backend Engineer — Core Payment Platform Team
1. Who We Are & The Team Fit We Value
Our Core Payment Platform processes over 40 million monthly payment and settlement transactions with zero downtime. In an era where AI can polish any resume or generate boilerplate code, we do not evaluate candidates on flashy credentials or smooth cover letter prose. Instead, we look for engineers who demonstrate Blameless Ownership during incidents, practice Evidence-Driven Debate when technical opinions clash, and embody Collaborative Humility to elevate teammates.

2. Key Responsibilities
- Architect high-availability payment and settlement APIs with strict distributed transaction consistency
- Lead phased MSA migration of legacy monolithic settlement batch modules and optimize event pipelines
- Drive Root Cause Analysis (RCA) during production incidents and build systemic prevention guardrails

3. Qualifications
- 5+ years of production backend engineering experience in high-throughput distributed systems
- Hands-on experience solving distributed data consistency challenges (Idempotency keys, distributed locks, event sourcing)
- Proven track record of resolving technical disagreements constructively across engineering, QA, and operations teams`,
    resumeText: `[Applicant Dossier & Cover Letter Excerpts — Doyun Kim]
■ Experience 1: PayFlow Core Payment Systems Team — Backend Engineer (2022.03 – 2025.06)
- During a Black Friday traffic spike (3,500 TPS), resolved critical DB deadlocks and double-charge anomalies by introducing Redis Redisson distributed locks and idempotency keys, reducing payment failure rate from 4.2% to 0.03%.
- However, during the emergency hotfix rollout, bypassed the standard pre-release QA sign-off to restore service faster, which caused friction with the QA and Operations teams; subsequently authored an emergency release runbook.

■ Experience 2: Legacy Settlement Architecture Modernization (2023.04 – 2024.08)
- Migrated a 10-year-old nightly settlement stored procedure into a real-time Kafka event streaming pipeline, cutting settlement lead time from 6 hours to 18 minutes.
- Faced a 3-week architectural standoff with two senior engineers who favored keeping the legacy procedure, eventually reaching consensus by running shadow-traffic benchmarks and failure simulations.

■ Career Gap & Open-Source Contributions (2025.07 – 2026.02, 8-Month Break)
- No full-time employment for 8 months after leaving PayFlow due to personal rest. Contributed 14 merged PRs (bug fixes and concurrency documentation) to an open-source distributed transaction library during this period.

■ Cover Letter Excerpt (Values & Collaboration Statement)
"I have always placed organizational goals above personal recognition, creating flawless synergy through harmonious communication in every conflict. Through customer-centric innovation and relentless technical excellence, I will lead your company to global financial leadership."`,
    organizationFit: {
      id: 'fit_fintech_core',
      organizationName: 'FairPay Core Platform Division',
      teamName: 'Core Payment Platform Team',
      missionSummary:
        'Look past AI-polished cover letters and surface specs. Verify authentic accountability under pressure, evidence-driven persuasion, and psychological safety in peer disagreements.',
      coreValues: [
        {
          id: 'val_ownership',
          name: 'Blameless Ownership & Accountability',
          description:
            'Owning trade-offs and procedural missteps transparently without blaming external teams, and building systemic safeguards after incidents.',
          rubric: {
            score1: 'Deflects blame onto QA, schedule pressure, or legacy code; minimizes personal missteps.',
            score3: 'Clearly explains technical root causes within assigned scope and follows standard post-mortem steps.',
            score5: 'Candidly reflects on personal judgment trade-offs and cross-team impact, and co-designs preventive guardrails with affected stakeholders.',
          },
        },
        {
          id: 'val_evidence',
          name: 'Evidence-Driven Alignment & Humility',
          description:
            'Resolving technical disagreements using empirical benchmarks while genuinely incorporating valid operational concerns from dissenting peers.',
          rubric: {
            score1: 'Frames technical disagreements as "winning" against stubborn colleagues and dismisses opposing views.',
            score3: 'Uses benchmark metrics and test data to persuade stakeholders and reach agreement.',
            score5: 'Combines rigorous data benchmarks with deep respect for dissenting peers, integrating their operational risk concerns into the final architecture.',
          },
        },
        {
          id: 'val_authenticity',
          name: 'Authentic Self-Awareness & Growth',
          description:
            'Explaining real trade-offs, personal limitations, and intrinsic motivation with concrete behavioral evidence rather than generic buzzwords.',
          rubric: {
            score1: 'Repeats abstract cover letter clichés without concrete personal decision-making examples.',
            score3: 'Accurately describes personal contributions and technical problem-solving steps.',
            score5: 'Articulates honest lessons learned from past mistakes and connects personal engineering values directly to our team’s mission.',
          },
        },
      ],
    },
    standardQuestions: [
      {
        id: 'sq_fin_1',
        stageId: 'stage_core',
        competencyId: 'comp_ownership',
        fitValueName: 'Blameless Ownership & Accountability',
        text: 'Tell me about a time when you had to weigh urgent problem resolution against following standard team procedures. What criteria guided your decision, and how did you handle the aftermath?',
        mandatory: true,
        lockedByHr: true,
        rubric: {
          score1: 'Claims procedures were never bypassed or blames other teams for rigid rules.',
          score3: 'Explains urgency criteria and how the issue was resolved and reported afterward.',
          score5: 'Transparently evaluates the trade-off, acknowledges impact on partner teams, and describes the lightweight safety protocol built afterward.',
        },
        rationaleGuide:
          'Record what value the candidate prioritized between speed and process, and cite concrete actions taken to rebuild cross-team trust.',
      },
      {
        id: 'sq_fin_2',
        stageId: 'stage_core',
        competencyId: 'comp_collab',
        fitValueName: 'Evidence-Driven Alignment & Humility',
        text: 'Describe a situation where teammates or partner departments strongly opposed a technical direction you believed in. How did you address their core concerns?',
        mandatory: true,
        lockedByHr: true,
        rubric: {
          score1: 'Portrays dissenting colleagues as uninformed or resistant to change.',
          score3: 'Prepared objective benchmarks or prototype data to align the team.',
          score5: 'Actively listened to the valid risks behind the opposition and modified the architecture to incorporate their safeguards.',
        },
        rationaleGuide:
          'Document both the empirical evidence the candidate used and how respectfully they treated dissenting viewpoints.',
      },
      {
        id: 'sq_fin_3',
        stageId: 'stage_core',
        competencyId: 'comp_growth',
        fitValueName: 'Authentic Self-Awareness & Growth',
        text: 'Looking back at a technical project you led, what is one decision you would make differently today, and what changed your perspective?',
        mandatory: true,
        lockedByHr: true,
        rubric: {
          score1: 'Gives a superficial answer or claims every major decision worked out as planned.',
          score3: 'Identifies a technical limitation and explains a better alternative.',
          score5: 'Demonstrates deep self-reflection on an architectural or collaboration blind spot and shows how that lesson shaped subsequent habits.',
        },
        rationaleGuide:
          'Evaluate the candidate’s honesty about past limitations and concrete behavioral changes.',
      },
    ],
    sections: [
      {
        id: 'sec_fin_1',
        docType: 'resume',
        docLabel: 'Resume · Experience 1',
        title: '3,500 TPS Payment Deadlock Fix & Emergency Hotfix That Bypassed QA Sign-Off',
        period: '2022.03 – 2025.06',
        content:
          'During a Black Friday traffic spike (3,500 TPS), resolved critical DB deadlocks and double-charge anomalies by introducing Redis Redisson distributed locks and idempotency keys, reducing payment failure rate from 4.2% to 0.03%. However, during the emergency hotfix rollout, bypassed the standard pre-release QA sign-off to restore service faster, which caused friction with the QA and Operations teams; subsequently authored an emergency release runbook.',
        highlightTags: ['0.03% Failure Rate', 'Bypassed QA Sign-Off', 'Post-Incident Friction'],
        coachSummary:
          'More important than the 3,500 TPS metric is WHY the candidate bypassed QA sign-off under pressure and HOW they responded when QA and Operations raised concerns afterward. Probe for Blameless Ownership vs. defensive justification.',
        recommendedQuestions: [
          {
            id: 'rq_fin_1a',
            text: 'When you decided to deploy the emergency hotfix without prior QA sign-off, what specific risks did you weigh, and what was the very first action you took when Operations raised concerns afterward?',
            fitValueName: 'Blameless Ownership & Accountability',
            whyGood:
              'Separates candidates who only boast about technical heroics (0.03% failure rate) from those who genuinely respect operational guardrails and own the human impact of their decisions.',
            avoidTrap:
              '🚫 DO NOT ASK: Avoid leading/accusatory phrasing like "So you broke company rules on your own?" which triggers defensive answers rather than revealing true values.',
            rubric: {
              score1: 'Dismisses QA and Operations concerns as bureaucratic slowness during an outage.',
              score3: 'Explains the outage severity and describes writing the post-incident runbook.',
              score5: 'Candidly acknowledges how bypassing QA hurt team trust and explains how they co-designed a 5-minute emergency pair-verification protocol with QA.',
            },
          },
          {
            id: 'rq_fin_1b',
            text: 'In implementing the Redis distributed lock and idempotency key pipeline, what edge cases or lock-contention side effects did you personally have to debug?',
            fitValueName: 'Authentic Self-Awareness & Growth',
            whyGood:
              'Verifies authentic hands-on depth versus high-level resume inflation.',
            avoidTrap:
              '🚫 DO NOT ASK: Do not pivot from night-time incident response into questions about marital status, childcare, or physical stamina.',
            rubric: {
              score1: 'Cannot explain lock TTL, retry backoff, or fallback behavior when Redis fails.',
              score3: 'Clearly explains personal implementation scope and idempotency key lifecycle.',
              score5: 'Details specific lock-expiration edge cases encountered in production and the exact telemetry used to verify zero double-charges.',
            },
          },
        ],
      },
      {
        id: 'sec_fin_2',
        docType: 'portfolio',
        docLabel: 'Portfolio · Project 2',
        title: 'Legacy Settlement Migration & 3-Week Architectural Standoff with Two Senior Peers',
        period: '2023.04 – 2024.08',
        content:
          'Migrated a 10-year-old nightly settlement stored procedure into a real-time Kafka event streaming pipeline, cutting settlement lead time from 6 hours to 18 minutes. Faced a 3-week architectural standoff with two senior engineers who favored keeping the legacy procedure, eventually reaching consensus by running shadow-traffic benchmarks and failure simulations.',
        highlightTags: ['6h → 18m Lead Time', '3-Week Peer Standoff', 'Shadow-Traffic Proof'],
        coachSummary:
          'Examine how the candidate viewed the two dissenting senior engineers. Did they treat them as "outdated obstacles to defeat" or as "domain guardians whose concerns deserved rigorous validation"? This directly tests Evidence-Driven Alignment.',
        recommendedQuestions: [
          {
            id: 'rq_fin_2a',
            text: 'During the 3-week disagreement with the two senior engineers, what was the most valid risk they raised about moving away from the nightly procedure, and how did that shape your final Kafka design?',
            fitValueName: 'Evidence-Driven Alignment & Humility',
            whyGood:
              'Tests intellectual humility and whether the candidate listens to domain experts instead of merely celebrating winning an argument.',
            avoidTrap:
              '🚫 DO NOT ASK: Never ask age-stereotyped questions such as "Was it hard working with older engineers who resist new tech?" (Age Discrimination Act Art. 4-4 risk).',
            rubric: {
              score1: 'Claims the senior engineers simply feared new technology and highlights proving them wrong.',
              score3: 'Explains the auditability concerns of the legacy procedure and how benchmark data addressed them.',
              score5: 'Credits the senior engineers’ domain insights for uncovering a reconciliation edge case and explains how shadow-ledger verification was added to the final pipeline.',
            },
          },
        ],
      },
      {
        id: 'sec_fin_3',
        docType: 'resume',
        docLabel: 'Resume · Career Gap & OSS',
        title: '8-Month Employment Gap & 14 Open-Source Distributed Transaction PRs',
        period: '2025.07 – 2026.02',
        content:
          'No full-time employment for 8 months after leaving PayFlow due to personal rest. Contributed 14 merged PRs (bug fixes and concurrency documentation) to an open-source distributed transaction library during this period.',
        highlightTags: ['8-Month Career Break', '14 Open-Source PRs', 'Self-Directed Learning'],
        coachSummary:
          'Career gaps are the #1 trigger for illegal or discriminatory personal probing (health, marriage, family care, financial status). Focus strictly on intrinsic engineering curiosity and what they learned from their 14 open-source contributions.',
        recommendedQuestions: [
          {
            id: 'rq_fin_3a',
            text: 'Among the 14 pull requests you contributed to the distributed transaction library, which issue was the most technically challenging and how did you collaborate with the upstream maintainers?',
            fitValueName: 'Authentic Self-Awareness & Growth',
            whyGood:
              'Evaluates intrinsic technical motivation and asynchronous code-review communication without intruding on private life.',
            avoidTrap:
              '🚫 DO NOT ASK: Strictly avoid: "Did you take 8 months off for marriage, family, or health reasons?" or "How did you support yourself financially?" (Fair Hiring Act Art. 4-3 risk).',
            rubric: {
              score1: 'Contributions were trivial formatting edits with little understanding of the library internals.',
              score3: 'Clearly explains a concurrency bug fix and the maintainer review process.',
              score5: 'Connects a real pain point from past work to the open-source fix and articulates how maintainer feedback improved their engineering standards.',
            },
          },
        ],
      },
      {
        id: 'sec_fin_4',
        docType: 'cover_letter',
        docLabel: 'Cover Letter · AI Prose Audit',
        title: 'Suspected AI-Polished Statement: "Flawless Synergy Through Harmonious Communication"',
        period: 'Cover Letter Section 2',
        content:
          '"I have always placed organizational goals above personal recognition, creating flawless synergy through harmonious communication in every conflict. Through customer-centric innovation and relentless technical excellence, I will lead your company to global financial leadership."',
        highlightTags: ['AI-Polished Buzzwords', 'Value Verification Needed', 'Probe Real Trade-offs'],
        coachSummary:
          'In the generative AI era, polished cover letter prose carries zero signal. Strip away phrases like "flawless synergy" by asking for a concrete moment where putting team goals first actually cost the candidate personal recognition or comfort.',
        recommendedQuestions: [
          {
            id: 'rq_fin_4a',
            text: 'Your cover letter mentions placing organizational goals above personal recognition. Can you share one specific instance where you gave up a high-visibility feature or took on unglamorous work because the team needed it?',
            fitValueName: 'Blameless Ownership & Accountability',
            whyGood:
              'Forces the candidate to move from AI-generated abstractions to verifiable behavioral evidence and real personal values.',
            avoidTrap:
              '🚫 DO NOT ASK: Do not ask "Did ChatGPT write your cover letter?"—instead, calmly test the claim through concrete behavioral follow-ups.',
            rubric: {
              score1: 'Repeats generic statements about teamwork without naming a concrete personal trade-off.',
              score3: 'Describes helping teammates with testing, documentation, or on-call rotation.',
              score5: 'Provides a specific, verifiable example of deferring a personal milestone to unblock a critical team bottleneck and explains the decision criteria.',
            },
          },
        ],
      },
    ],
    initialKit: {
      competencies: [
        {
          id: 'comp_ownership',
          name: 'Blameless Incident Ownership',
          jdQuote: 'Drive Root Cause Analysis (RCA) during production incidents and build systemic prevention guardrails',
          fitDescription: 'Owning trade-offs transparently and building systemic safeguards rather than blaming individuals',
        },
        {
          id: 'comp_arch',
          name: 'Distributed Consistency Engineering',
          jdQuote: 'Hands-on experience solving distributed data consistency challenges (Idempotency keys, distributed locks, event sourcing)',
          fitDescription: 'Designing resilient transaction pipelines backed by empirical failure testing',
        },
        {
          id: 'comp_collab',
          name: 'Evidence-Driven Technical Alignment',
          jdQuote: 'Proven track record of resolving technical disagreements constructively across engineering, QA, and operations teams',
          fitDescription: 'Persuading with data while integrating valid operational concerns from peers',
        },
        {
          id: 'comp_growth',
          name: 'Authentic Reflection & Legacy Modernization',
          jdQuote: 'Lead phased MSA migration of legacy monolithic settlement batch modules and optimize event pipelines',
          fitDescription: 'Reflecting honestly on past architectural limits and driving incremental modernization',
        },
      ],
      questions: [
        {
          id: 'q_core_1',
          type: 'core',
          competencyId: 'comp_ownership',
          text: 'When an urgent production issue conflicted with standard release procedures, what criteria did you use to make a decision?',
          resumeQuote: null,
          whyAsk: 'Evaluates every candidate on the same baseline of incident accountability and risk judgment.',
          rubric: {
            score1: 'Blames external pressure or cannot articulate clear decision criteria.',
            score3: 'Balances customer impact against release risk and completes post-incident follow-ups.',
            score5: 'Transparently owns trade-offs, aligns immediately with partner teams, and establishes systemic guardrails.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Behavioral',
              lawRefs: [],
              reason: 'Neutral behavioral question evaluating incident decision-making criteria.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_followup_1',
          type: 'followup',
          competencyId: 'comp_ownership',
          text: 'After bypassing pre-release QA sign-off during the Black Friday hotfix, what specific steps did you take to rebuild trust with QA and Operations?',
          resumeQuote: 'However, during the emergency hotfix rollout, bypassed the standard pre-release QA sign-off to restore service faster, which caused friction with the QA and Operations teams; subsequently authored an emergency release runbook.',
          whyAsk: 'Verifies whether the candidate genuinely owned the cross-team friction described in their resume.',
          rubric: {
            score1: 'Justifies bypassing QA as unavoidable and dismisses Operations’ concerns.',
            score3: 'Explains the post-mortem meeting and how the emergency runbook was documented.',
            score5: 'Acknowledges the blind spot candidly and describes co-designing a rapid emergency verification workflow with QA.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Behavioral',
              lawRefs: [],
              reason: 'Directly grounded in the candidate’s resume to assess cross-functional accountability.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_core_2',
          type: 'core',
          competencyId: 'comp_collab',
          text: 'Tell me about a time when a colleague raised an objection that caused you to revise your initial technical design.',
          resumeQuote: null,
          whyAsk: 'Measures intellectual humility and receptiveness to peer feedback across all candidates.',
          rubric: {
            score1: 'Cannot recall revising a design or insists initial proposals were always right.',
            score3: 'Describes accepting peer feedback during a code or design review.',
            score5: 'Explains how a peer’s objection uncovered a critical blind spot and led to a stronger joint architecture.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Behavioral',
              lawRefs: [],
              reason: 'Evaluates collaborative humility and evidence-based engineering.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_followup_2',
          type: 'followup',
          competencyId: 'comp_collab',
          text: 'During the 3-week standoff with the two senior engineers on the settlement migration, what specific failure scenarios did your shadow-traffic benchmarks test?',
          resumeQuote: 'Faced a 3-week architectural standoff with two senior engineers who favored keeping the legacy procedure, eventually reaching consensus by running shadow-traffic benchmarks and failure simulations.',
          whyAsk: 'Verifies concrete engineering rigor and how the candidate addressed peer concerns with data.',
          rubric: {
            score1: 'Gives vague descriptions of benchmarks without specific metrics or failure modes.',
            score3: 'Explains throughput and consumer lag metrics tested during shadow runs.',
            score5: 'Details exact data-reconciliation edge cases raised by the senior engineers and how the simulation proved zero discrepancy.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Behavioral',
              lawRefs: [],
              reason: 'Grounded in resume project history with zero discrimination risk.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
      ],
    },
    initialRounds: [
      {
        round: 1,
        checked: 6,
        failed: [
          {
            questionId: 'q_draft_gap',
            questionText: 'During your 8-month break, were you preparing for marriage or family matters, and why did you leave PayFlow?',
            reasons: [
              'High Discrimination Risk (marriage_dating / family_info): Inquires about marital/family matters (Fair Hiring Act Art. 4-3 risk)',
              'Compound Question (single=false): Asks two distinct questions simultaneously',
            ],
          },
        ],
        regeneratedIds: ['q_draft_gap'],
      },
      {
        round: 2,
        checked: 1,
        failed: [],
        regeneratedIds: [],
      },
    ],
  },
  {
    id: 'preset_public_admin',
    label: 'Public Sector · Digital Civic Service Specialist',
    badgeText: 'Public Empathy · Procedural Integrity · Cross-Agency Fit',
    applicantName: 'Seoyeon Park (4 Yrs Exp)',
    appliedRole: 'Digital Civic Service Innovation Specialist',
    experienceSummary:
      '4 years in municipal digital service accessibility · Led inter-agency data-sharing taskforce · Fixed-term contract completion',
    jdText: `[Job Description] Digital Civic Service Innovation Specialist — Smart Public Administration Agency
1. Mission & Organizational Fit
Our agency modernizes public administrative workflows so that every citizen—including seniors and digitally marginalized groups—can access essential services without barriers. Rather than evaluating candidates on ornate essay writing or rote credentials, we evaluate Inclusive Public Empathy (discovering real citizen pain points in the field), Principled Integrity (upholding legal and privacy standards while solving bottlenecks), and Cross-Agency Collaboration.

2. Key Responsibilities
- Lead accessibility improvements for municipal self-service kiosks and mobile civic portals
- Coordinate inter-departmental data-sharing agreements to eliminate redundant paper certificates
- Conduct bi-monthly regional field inspections and usability audits across local service centers

3. Qualifications
- 3+ years of experience in public administration, civic service operations, or service planning
- Demonstrated ability to mediate conflicting priorities across departments, citizens, and external vendors`,
    resumeText: `[Applicant Dossier & Cover Letter Excerpts — Seoyeon Park]
■ Experience 1: Municipal Citizen Service Division — Digital Accessibility Coordinator (2022.05 – 2024.12)
- Conducted 120 in-person usability interviews with senior citizens for unmanned kiosk redesign, reducing average certificate issuance time from 4m 30s to 1m 50s.
- When budget cuts threatened to drop the voice-guidance module for visually impaired users, identified unspent contingency funds and secured approval to retain full accessibility features.

■ Experience 2: Inter-Departmental One-Stop Welfare & Tax Data Taskforce (2024.01 – 2025.10)
- Drafted a standardized data security agreement across 3 departments that were hesitant due to privacy audit liability, eliminating 5 redundant citizen paper forms.
- However, rejected a late deadline extension request from one partner department to meet the launch schedule, causing initial friction.

■ Cover Letter Excerpt (Public Service Values)
"With unwavering dedication and a spirit of sacrifice, I always serve citizens like my own family and humble myself to create perfect harmony across the organization."`,
    organizationFit: {
      id: 'fit_public_service',
      organizationName: 'Smart Public Administration Agency',
      teamName: 'Digital Civic Service Innovation Team',
      missionSummary:
        'Ensure strict compliance with public-sector fair hiring guidelines while verifying field-tested empathy and principled problem solving.',
      coreValues: [
        {
          id: 'val_public_empathy',
          name: 'Field-Grounded Inclusive Empathy',
          description:
            'Verifying citizen pain points directly in the field and persisting through administrative hurdles to protect vulnerable users.',
          rubric: {
            score1: 'Treats citizen accessibility as a secondary checklist item or offers only abstract slogans.',
            score3: 'Gathers user feedback and implements improvements within standard scope.',
            score5: 'Proactively uncovers barriers faced by marginalized citizens in the field and secures legitimate administrative solutions despite budget constraints.',
          },
        },
        {
          id: 'val_integrity',
          name: 'Principled Integrity & Cross-Agency Alignment',
          description:
            'Upholding privacy and legal regulations strictly while designing institutional safeguards that unlock inter-departmental cooperation.',
          rubric: {
            score1: 'Either hides behind rigid rules to reject requests or bypasses required compliance steps.',
            score3: 'Follows administrative procedures accurately and communicates timelines clearly.',
            score5: 'Resolves inter-agency resistance by formalizing clear liability and security guardrails that satisfy both audit standards and citizen convenience.',
          },
        },
      ],
    },
    standardQuestions: [
      {
        id: 'sq_pub_1',
        stageId: 'stage_core',
        competencyId: 'comp_public_fit',
        fitValueName: 'Principled Integrity & Cross-Agency Alignment',
        text: 'Tell me about a time when an administrative regulation or departmental concern conflicted with urgent service improvement. How did you uphold compliance while moving the project forward?',
        mandatory: true,
        lockedByHr: true,
        rubric: {
          score1: 'Simply rejected the request citing regulations or pushed ahead without addressing compliance.',
          score3: 'Reviewed relevant guidelines and found an approved procedural path.',
          score5: 'Designed an institutional safeguard (such as a formal security protocol) that satisfied regulatory requirements and resolved stakeholder resistance.',
        },
        rationaleGuide:
          'Document how the candidate balanced legal/privacy compliance with proactive problem solving.',
      },
      {
        id: 'sq_pub_2',
        stageId: 'stage_core',
        competencyId: 'comp_public_travel',
        fitValueName: 'Field-Grounded Inclusive Empathy',
        text: 'This position involves bi-monthly regional field inspections across local service centers. Are you able to fulfill this job requirement?',
        mandatory: true,
        lockedByHr: true,
        rubric: {
          score1: 'Expresses inability or lack of awareness regarding the field inspection requirement.',
          score3: 'Confirms full readiness to perform bi-monthly regional field inspections.',
          score5: 'Confirms readiness and connects past field research experience to improving regional inspection checklists.',
        },
        rationaleGuide:
          'Caution: Record only the candidate’s readiness for the travel requirement. Never probe into marriage, childcare, or family arrangements.',
      },
    ],
    sections: [
      {
        id: 'sec_pub_1',
        docType: 'resume',
        docLabel: 'Resume · Experience 1',
        title: '120 Senior Citizen Field Interviews & Securing Contingency Budget for Voice Guidance',
        period: '2022.05 – 2024.12',
        content:
          'Conducted 120 in-person usability interviews with senior citizens for unmanned kiosk redesign, reducing average certificate issuance time from 4m 30s to 1m 50s. When budget cuts threatened to drop the voice-guidance module for visually impaired users, identified unspent contingency funds and secured approval to retain full accessibility features.',
        highlightTags: ['120 Field Interviews', 'Saved Voice Guidance Module', '60% Faster Issuance'],
        coachSummary:
          'Look past the cover letter phrase "serving citizens like family." Probe what specific field observation drove the candidate to fight for the voice-guidance budget rather than quietly accepting the scope cut.',
        recommendedQuestions: [
          {
            id: 'rq_pub_1a',
            text: 'When the voice-guidance module was slated for removal due to budget cuts, what specific observation from your field interviews convinced you to pursue contingency funding instead of accepting the reduced scope?',
            fitValueName: 'Field-Grounded Inclusive Empathy',
            whyGood:
              'Reveals whether the candidate’s public service motivation is rooted in concrete field evidence and perseverance.',
            avoidTrap:
              '🚫 DO NOT ASK: Do not ask about the age or health of the candidate’s own parents or family members (Fair Hiring Act Art. 4-3 risk).',
            rubric: {
              score1: 'States it was simply a supervisor’s instruction without recalling field specifics.',
              score3: 'Explains the usability bottlenecks observed during the 120 interviews and the budget transfer process.',
              score5: 'Articulates the exact accessibility barrier observed in the field and how they built an evidence-based case to win budget approval.',
            },
          },
        ],
      },
      {
        id: 'sec_pub_2',
        docType: 'portfolio',
        docLabel: 'Portfolio · Experience 2',
        title: '3-Department Security Agreement & Friction After Rejecting Extension Request',
        period: '2024.01 – 2025.10',
        content:
          'Drafted a standardized data security agreement across 3 departments that were hesitant due to privacy audit liability, eliminating 5 redundant citizen paper forms. However, rejected a late deadline extension request from one partner department to meet the launch schedule, causing initial friction.',
        highlightTags: ['Eliminated 5 Paper Forms', 'Deadline Rejection Friction'],
        coachSummary:
          'Probe how the candidate handled the tension between launch deadlines and partner department concerns to verify Principled Integrity.',
        recommendedQuestions: [
          {
            id: 'rq_pub_2a',
            text: 'When you rejected the partner department’s deadline extension request, what was their underlying concern, and how did you restore working trust afterward?',
            fitValueName: 'Principled Integrity & Cross-Agency Alignment',
            whyGood:
              'Tests whether the candidate balances delivery discipline with empathy for partner departments’ audit liabilities.',
            avoidTrap:
              '🚫 DO NOT ASK: Avoid gender or age stereotypes about dealing with senior public officials.',
            rubric: {
              score1: 'Blames the partner department for bureaucratic delay and justifies forcing the deadline.',
              score3: 'Explains the official notice process and follow-up coordination meetings.',
              score5: 'Identifies the partner department’s audit liability concern and explains how they incorporated specific accountability clauses into the security agreement.',
            },
          },
        ],
      },
    ],
    initialKit: {
      competencies: [
        {
          id: 'comp_public_fit',
          name: 'Field-Grounded Inclusive Empathy',
          jdQuote: 'Lead accessibility improvements for municipal self-service kiosks and mobile civic portals',
          fitDescription: 'Uncovering real-world accessibility barriers in the field and translating them into institutional improvements',
        },
        {
          id: 'comp_public_collab',
          name: 'Principled Inter-Agency Mediation',
          jdQuote: 'Demonstrated ability to mediate conflicting priorities across departments, citizens, and external vendors',
          fitDescription: 'Resolving cross-departmental bottlenecks while strictly upholding legal and privacy standards',
        },
      ],
      questions: [
        {
          id: 'q_pub_core_1',
          type: 'core',
          competencyId: 'comp_public_fit',
          text: 'Tell me about a time when administrative efficiency conflicted with accessibility for vulnerable citizens. What criteria guided your decision?',
          resumeQuote: null,
          whyAsk: 'Evaluates core public service values consistently across all applicants.',
          rubric: {
            score1: 'Prioritizes administrative convenience alone or gives only abstract slogans.',
            score3: 'Explains adjustments made to accommodate vulnerable users.',
            score5: 'Demonstrates how they secured alternative resources or phased workflows to achieve both accessibility and operational targets.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Behavioral',
              lawRefs: [],
              reason: 'Neutral behavioral question assessing public service values.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
        {
          id: 'q_pub_followup_1',
          type: 'followup',
          competencyId: 'comp_public_collab',
          text: 'What specific clauses did you include in the standardized data security agreement to resolve the three departments’ privacy audit concerns?',
          resumeQuote: 'Drafted a standardized data security agreement across 3 departments that were hesitant due to privacy audit liability, eliminating 5 redundant citizen paper forms.',
          whyAsk: 'Verifies concrete administrative problem-solving depth from the candidate’s resume.',
          rubric: {
            score1: 'Cannot explain the specific provisions or personal role in drafting the agreement.',
            score3: 'Describes access control and audit log provisions included in the agreement.',
            score5: 'Details how clear liability boundaries and audit checklists turned departmental resistance into active cooperation.',
          },
          checks: {
            grounded: true,
            behavioral: true,
            single: true,
            nonLeading: true,
            risk: {
              level: 'none',
              category: 'none',
              categoryLabel: 'Job-Related Behavioral',
              lawRefs: [],
              reason: 'Resume-grounded behavioral question with zero discrimination risk.',
              alternativeQuestion: null,
              source: 'model',
            },
            failedReasons: [],
          },
        },
      ],
    },
    initialRounds: [
      {
        round: 1,
        checked: 4,
        failed: [],
        regeneratedIds: [],
      },
    ],
  },
];
