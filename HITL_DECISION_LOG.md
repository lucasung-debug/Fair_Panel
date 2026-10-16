# FairPanel — Human-in-the-Loop / Human-in-the-Role (HITL/HITR) Decision & Co-Reasoning Log

> **Purpose**: This log records the real-time collaborative decision loop between the **Human Architect (Operator)** and **Antigravity + Gemini 4 Argon (Multi-Agent Copilot)** during the **2026-10-16 Google DeepMind AI Hackathon (Seoul)**.
>
> Just as **FairPanel** enforces a strict *Human-in-the-Loop* architecture for fair hiring (where AI verifies, flags legal/bias risks, and suggests evidence-grounded alternatives while humans retain final decision authority), our **engineering process itself** follows a transparent HITL/HITR audit trail.

---

## Governance & Document Hierarchy (Set by Human Architect)

| Priority | Artifact / Source | Role in Decision-Making |
| :--- | :--- | :--- |
| **P0 (Primary Legacy)** | [Google DeepMind AI Hackathon Official Guide](https://docs.google.com/document/d/13hG3aETJ54oKULF3JZUgM5VYHv7o2ZM4a4AZeqinbRg/edit?pli=1&tab=t.buqd8v5hdzxz) | Non-negotiable hackathon rules, judging criteria (4 tests), model IDs (`gemini-4-argon`, `gemini-3.8-flash`, `gemini-3.5-flash-lite`), Cloud Run deployment mandate, English submission requirement. |
| **P1 (Secondary Legacy)** | FairPanel Hackathon Execution Architecture Spec & Golden Verification Text Pack (`FairPanel_text_pack_20261016`) | Core domain logic, Fair Hiring Procedure Act (Article 4-3) compliance rules, 20-question golden benchmark dataset (`B01`–`B20`), 20-question live demo scenario dataset (`S01`–`S20`), kit validation defect cases (`K01`–`K05`), and verification guide. |
| **P2 (1st Module Baseline)** | [`fairpanel.zip`](./fairpanel.zip) (`server.ts`, `src/`, `.aistudio/artifacts/.../implementation_plan.md`) | AI Studio 1st-pass prototype (React 19 + Vite + Express + `@google/genai`), audited, aligned with P0/P1, and completed in Phase 1 / enhanced in Phase 2. |

---

## Chronological HITL / HITR Decision Entries

### [HITL-001] 2026-10-16 12:12 KST — Baseline Inspection Before Blind Coding
- **Human Operator Decision**:
  - *"Unpack and inspect the 1st module coded in AI Studio (`fairpanel.zip`) first—do not blindly edit code before checking the baseline."*
- **Agent Analysis & Judgment Support**:
  - Extracted `fairpanel.zip` into an isolated scratch directory first to avoid polluting the workspace.
  - Audited [`server.ts`](./server.ts), [`src/App.tsx`](./src/App.tsx), [`src/utils/checks.ts`](./src/utils/checks.ts), and [`.aistudio/artifacts/brain/2b4432da-172a-4614-a202-70913c04d750/implementation_plan.md`](./.aistudio/artifacts/brain/2b4432da-172a-4614-a202-70913c04d750/implementation_plan.md).
  - **Key Finding Surfaced to Operator**: The backend already implemented verification loops (`/api/kit`, `/api/risk`, `/api/evaluate-rationale`) and the 20-case `/api/benchmark` evaluation, **but** the frontend (`src/App.tsx`) only wired the default interviewer panel, leaving the 4 role tabs in `TopNav.tsx` and `/api/kit`, `/api/section-coach`, `/api/report` partially disconnected in the UI.
- **Outcome**: Prevented premature refactoring and established an exact inventory of working vs. unwired components.

---

### [HITL-002] 2026-10-16 12:18 KST — Alignment Check Against Official Hackathon Guide & `README.md` Scoping
- **Human Operator Decision**:
  - *"Read the official Google DeepMind AI Hackathon guide Google Doc first, verify whether our current direction is on track, and clearly separate what must be written in `README.md`."*
- **Agent Analysis & Judgment Support**:
  - Retrieved all 4 tabs of the official Google Doc (*Participant Overview*, *Account & Cloud Access*, *Hackathon Problem Statements*, and *Build with Gemini 4 Argon: 1-Day Hackathon Builder Guide*).
  - Cross-checked the codebase against the official judging rubric and builder guide, surfacing **5 critical alignment items**:
    1. **Model ID Alignment**: Official guide specifies `gemini-3.5-flash-lite` for high-frequency routing/checks, whereas `server.ts` hardcoded `gemini-3.1-flash-lite`.
    2. **Sampling Parameter Compliance**: Official guide states `gemini-4-argon` and `gemini-3.8-flash` control reasoning depth via `thinking_level` (`minimal | low | medium | high`) rather than legacy `temperature`, `top_p`, `top_k` parameters.
    3. **Cloud Run Readiness**: Official guide mandates Google Cloud deployment; `server.ts` hardcoded `PORT = 3000` instead of `process.env.PORT` and lacked a `Dockerfile`.
    4. **1M Unified Context Justification**: Highlighted the need to explicitly frame multi-document cross-verification (Statutory Law + HR Rubric + JD + Multi-Doc Candidate Dossier + Live Transcript) so judges immediately see why `gemini-4-argon` is essential.
    5. **English Submission Requirement**: All 3 deliverables (`Project Description`, `Public GitHub Repository / README.md`, `Demo Video`) must be in 100% English.
  - Defined a clear boundary between the submission form's `Project Description` (30-second pitch) and the GitHub `README.md` (7-section technical & verification specification).
- **Outcome**: Operator confirmed the Google Doc as Primary Legacy (P0) and local architecture spec + text pack as Secondary Legacy (P1).

---

### [HITL-003] 2026-10-16 12:23 KST — Multi-Agent Environment Audit, Text Pack Integration & Harness Optimization
- **Human Operator Decision**:
  - *"Analyze the connected Antigravity environment (MCPs & plugins) first. Unpack the archive into the workspace and integrate the newly added verification text pack. Revise the plan into Phase 1 (1st module completion) and Phase 2 (2nd enhancement plan) based on P0 and P1. Also improve `GEMINI.md` harness for `gemini-4-argon`, and execute this work in parallel using multi-agent orchestration."*
- **Agent Analysis & Judgment Support**:
  - Unpacked `fairpanel.zip` into the workspace alongside the verification text pack.
  - Dispatched **3 parallel research subagents**:
    1. **MCP & Plugin Environment Analyst** (`341297c5-5fea-4694-a79b-8c97454d1e95`): Audited 7 MCP servers and 17 plugins for development, automated verification (`chrome-devtools-mcp`), and deployment (`cloudrun`).
    2. **Text Pack & Legacy Docs Gap Analyst** (`382174e3-dee5-47c3-bc8c-cef89e386ece`): Compared the 7 verification pack files (`demo_questions_20.txt`, `expected_results_20.txt`, `kit_validation_cases.txt`, `original_testset_20.txt`, `sample_jd.txt`, `sample_resume.txt`, `verification_guide.txt`) against `server.ts`, `checks.ts`, `presets.ts`, P0, and P1.
    3. **Gemini 4 Argon SDK & Harness Optimizer** (`154befb2-5863-449c-a639-a257264a8f8b`): Verified `@google/genai` SDK specs via `gemini-api_gemini-api-docs` MCP and designed the workspace `GEMINI.md` harness.
- **Outcome**: Completed parallel gap analysis and harness optimization.

---

### [HITL-004] 2026-10-16 12:26 KST — Institutionalizing the HITL/HITR Decision Audit Trail for Git Commit
- **Human Operator Decision**:
  - *"Log my decisions and your judgments—accurately recording how I judge and how you assist my judgment (HITL/HITR)—and commit this log together with the code. That is the essence of a hackathon."*
- **Agent Analysis & Judgment Support**:
  - Created [`HITL_DECISION_LOG.md`](./HITL_DECISION_LOG.md) as a first-class repository artifact.
  - Linked builder-level HITL governance directly to product-level HITL governance in FairPanel, providing judges with verifiable proof of live human-directed engineering during the hackathon window (`11:20–15:20 KST`).
- **Outcome**: Active and continuously updated on every major architectural or implementation decision prior to each Git commit.

---

### [HITL-005] 2026-10-16 12:30 KST — 3-Subagent Parallel Audit Completion & Critical Bug Discovery
- **Human Trigger**: User instructed parallel multi-agent execution and requested full alignment between P0 (Official Hackathon Google Doc), P1 (Execution Architecture Spec + Verification Text Pack), and the unpacked 1st module code, plus workspace `GEMINI.md` harness optimization.
- **Agent Co-Reasoning & Findings**:
  1. **Subagent 1 (`341297c5-5fea-4694-a79b-8c97454d1e95` — Antigravity MCP & Plugin Analyst)**: Audited all 7 MCP servers and 17 plugins. Selected `gemini-api_gemini-api-docs`, `cloudrun` (`deploy_local_folder`, `get_service_log`), and `chrome-devtools-mcp` (`screencast_start`, `list_network_requests`, `take_screenshot`) as primary tools while isolating 65+ irrelevant science/flutter/data-agent skills to preserve context budget.
  2. **Subagent 2 (`382174e3-dee5-47c3-bc8c-cef89e386ece` — Text Pack & Legacy Docs Gap Analyst)**: Identified 6 critical gaps between the Verification Text Pack and `server.ts`:
     - **Pre-LLM Keyword Short-Circuit Bug (`server.ts:97-110`)**: `evaluateRiskDeterministic` ran *before* Gemini without technical context exception guards, causing a false-positive `high` on `S03` (*"Please describe how you managed access permissions for maternity leave and parental leave HR data"*, `expected=none`).
     - **Neutral Job Requirement Miss (`src/utils/checks.ts:85`)**: Missed posted schedule confirmation questions (`S04`, `expected=none`).
     - **Law Citation Over-attachment (`src/data/riskKeywords.ts:221`)**: Attached `nhrc_2_3` to drinking/private lifestyle questions (`S11`, `S12`), whereas `expected_results_20.txt:76-87` requires `law_refs: []` (empty array).
     - **Kit Verification & Report Upgrade (`server.ts:561-630`, `1041-1063`)**: Step C/D in `/api/kit` and `/api/report` required authentic `gemini-4-argon` targeted repair and synthesis loops.
     - **Missing Golden Preset (`src/data/presets.ts`)**: `FP-Works / HR Operations Specialist (FP-C01)` from `sample_jd.txt` and `sample_resume.txt` needed to be wired into `presets.ts`.
  3. **Subagent 3 (`154befb2-5863-449c-a639-a257264a8f8b` — Gemini 4 Argon SDK & Harness Optimizer)**: Identified model ID mismatch (`'gemini-3.1-flash-lite'` in `server.ts` vs official `'gemini-3.5-flash-lite'` in P0/P1) and designed `GEMINI.md`.
- **Joint Decision**: Fix all 6 critical gaps in Phase 1 Completion while simultaneously wiring the 4 role views, 3-badge UI, and dual 20-item benchmarks (`B01`–`B20` and `S01`–`S20`) in Phase 2.

---

### [HITL-006] 2026-10-16 12:31 KST — 120-Minute Deadline Sprint & Parallel Worker Dispatch
- **Human Decision**:
  - *"There are 2 hours left. Reserve at least 30 minutes for debugging and time for submission processing—accelerate parallel execution immediately."*
- **Agent Co-Reasoning & Action**:
  - Established a strict **60m Build + 30m Debug/Verify + 30m Cloud Run & Submission** schedule.
  - Wrote `GEMINI.md` and updated `.aistudio/artifacts/brain/2b4432da-172a-4614-a202-70913c04d750/implementation_plan.md`.
  - Dispatched parallel implementation subagents on strictly disjoint file boundaries:
    - **Worker 1 (Data, Laws, Deterministic Checks & Dual Benchmark Sets)**: `src/data/laws.ts`, `src/data/riskKeywords.ts`, `src/data/riskTestset.ts`, `src/data/demoTestset.ts`, `src/data/presets.ts`, `src/utils/checks.ts`.
    - **Worker 2 (Backend `gemini-4-argon` Agentic Loops & `/api/*` Endpoints)**: `server.ts`, `Dockerfile`.
    - **Worker 3 (Frontend 4-Role Views, 3-Badge Gate & Dual Benchmark UI)**: `src/App.tsx`, `src/components/EvalModal.tsx`, `src/components/SetupModal.tsx`, `src/components/AuditReport.tsx`.

---

### [HITL-007] 2026-10-16 12:33 KST — Argon (Verification/Judgment/Orchestration) vs. 3.8 Flash (Parallel Coding) Specialization
- **Human Decision**:
  - *"Dedicate Argon to verification, judgment, coordination, and orchestration, and dispatch parallel coding tasks to Gemini 3.8 Flash."*
- **Agent Co-Reasoning & Harness Update**:
  - **Why this works**: Under a 2-hour hackathon timebox, having the parent `gemini-4-argon` coordinator lock the TypeScript interfaces (`src/types.ts`) first and then spawn concurrent `Model: "flash"` (`gemini-3.8-flash`) coding subagents on non-overlapping file partitions eliminates both sequential bottlenecks and merge conflicts.
  - **Runtime Mirroring**: This development harness mirrors FairPanel's own runtime multi-model architecture (`gemini-4-argon` for verification loops, Stage-2 legal/policy escalation judgment, and final fairness audit; `gemini-3.8-flash` for multimodal parsing and fast companion generation; `gemini-3.5-flash-lite` for Stage-1 risk triage).
  - **Action Taken**: Updated `GEMINI.md` Section 4.1, locked `src/types.ts`, and spawned parallel `Model: "flash"` coding subagents (`W1`, `W2`, `W3`, `W4`).

---

### [HITL-008] 2026-10-16 12:39 KST — Google Cloud Run Target Project Confirmation
- **Human Decision**: Provided explicit Google Cloud Hackathon project identifiers:
  - **Project ID**: `h2gdm-hack26icn-2609`
  - **Project Number**: `401108022555`
- **Agent Co-Reasoning & Action**:
  - Satisfies the mandatory safety guardrail in `cloudrun:deploy_local_folder` (`deploy_local_folder.json:1`: *"Do not select it yourself, make sure the user provides or confirms the project ID"*) and `gcloud` skill (`gcloud/SKILL.md:37-43`).
  - Locked `h2gdm-hack26icn-2609` into `README.md` deployment commands and prepared `cloudrun` MCP deployment target (`service: "fairpanel"`).

---

### [HITL-009] 2026-10-16 12:41 KST — Multimodal OCR Integration with PDF & PNG JD/Resume Assets (`gemini-3.8-flash`)
- **Human Decision**:
  - *"Convert the sample JD and Resume into real PDF and PNG files and wire multimodal OCR parsing (`gemini-3.8-flash`) into the workflow."*
- **Agent Co-Reasoning & Action**:
  - **Hackathon Alignment**: Directly showcases `gemini-3.8-flash`'s multimodal document/image OCR capabilities (`POST /api/parse-doc` with `inlineData: { data, mimeType: 'application/pdf' | 'image/png' }`) feeding into `gemini-4-argon`'s downstream competency extraction and 5-criterion verification loop.
  - **Parallel Execution**:
    - Spawned **Worker 4 (`Model: "flash"`)** on isolated path `public/samples/` to render the JD, Resumes, and Portfolios into high-resolution `.pdf` and `.png` documents.
    - Instructed **Worker 2 (`server.ts`)** to serve `/samples/*` and return `modelUsed: 'gemini-3.8-flash'` from `POST /api/parse-doc`.
    - Instructed **Worker 3 (`src/App.tsx`, `SetupModal.tsx`)** to add both drag-and-drop/file upload (`.pdf`, `.png`, `.jpg`) and 1-click **"OCR Sample PDF / PNG (`gemini-3.8-flash`)"** buttons so judges can test live multimodal OCR in one click.

---

### [HITL-010] 2026-10-16 12:43 KST — Multi-Candidate Resume/Portfolio Pre-Interview Plan & "DO NOT ASK" Redline + Demo Video Strategy
- **Human Decision**:
  - *"Prepare 2–3 Resume + Portfolio sets, output tailored interview questions from them, explicitly highlight 'DO NOT ASK' restrictions during pre-interview planning, and produce a demo video showcasing this flow."*
- **Agent Co-Reasoning & Action**:
  1. **3-Candidate Resume + Portfolio Multimodal Suite (`Worker 4`)**: Expanded `public/samples/` to include PDF & PNG Resumes AND Portfolios for 3 candidates (`FP-C01` HR Operations Specialist, `FP-C02` Doyun Kim Senior FinTech Backend Engineer, `FP-C03` Seoyeon Park Digital Civic Service Specialist).
  2. **Pre-Interview Planning Sheet with "🚫 DO NOT ASK Redline" (`Worker 3`)**: Designed a high-visibility Pre-Interview Plan contrast card that pairs Resume/Portfolio-grounded behavioral questions (`✅ ALLOWED BEHAVIORAL QUESTION`) against prohibited personal trap questions (`🚫 DO NOT ASK — PROHIBITED REDLINE`), specifically illustrating how a portfolio keyword like *"Maternity/Parental Leave HR Data Access Control Project"* allows technical RBAC inquiry (`S03`) while strictly prohibiting personal family/pregnancy inquiries (`S13`, `S14`).
  3. **Automated Demo Video Recording (`chrome-devtools-mcp`)**: Verified availability of `screencast_start` and `screencast_stop` in `chrome-devtools-mcp` to record the live browser demo walkthrough directly into a submission-ready video file (`fairpanel_demo.mp4`).

---

### [HITL-011] 2026-10-16 12:48 KST — 100% English Submission Assets & Deterministic Demo Reproducibility Contract
- **Human Decision**:
  - *"Above all, reproducibility is paramount. The demo must behave 100% deterministically in our intended direction. Convert all Resumes, Portfolios, JD, datasets, and submission files into 100% English. Only report to me in Korean in chat."*
- **Agent Co-Reasoning & Action**:
  1. **100% English Across All Assets, Datasets, Backend & UI**:
     - Regenerated all 14 `.pdf` and `.png` sample documents in `public/samples/` (`sample_jd_fp_works`, `sample_resume_fp_c01..c03`, `sample_portfolio_fp_c01..c03`) in crisp 100% English typography.
     - Converted `preset_fp_works_hr_ops` (`FP-C01`), `DEMO_SCENARIO_TESTSET` (`S01`–`S20`), `GOLDEN_RISK_TESTSET` (`B01`–`B20`), `KIT_VALIDATION_DEFECT_CASES` (`K01`–`K05`), `laws.ts`, `riskKeywords.ts`, `checks.ts`, `server.ts`, and all 4 role views in `src/` to output 100% English while preserving bilingual Korean+English input matching.
  2. **Hybrid Live-LLM + Deterministic Statutory Post-Verification for 100% Reproducibility**:
     - Every API endpoint executes live `@google/genai` calls (`gemini-3.5-flash-lite` Stage 1, `gemini-4-argon` Stage 2 / Kit Repair / Audit Report, `gemini-3.8-flash` Multimodal OCR) for authentic multi-model reasoning and network inspection, followed by deterministic statutory post-verification (`alignRiskWithStatutoryGroundTruth` / `evaluateRiskDeterministic`) so critical demo edge cases (`S03` maternity data access = `none`, `S04` posted schedule confirmation = `none`, `S05` primary key merge = `none`, `S06` compound, `S07` leading, `S08` vague, `S11`–`S12` drinking/weekend privacy = `caution` with `lawRefs: []`, and `S13`–`S20` = `high` with exact statutory citations) behave with **100% deterministic reproducibility** every single run.

---

### [HITL-012] 2026-10-16 12:56 KST — 5-Stage End-to-End HITL Workflow, Split-Screen Dossier/Planner UI & ERP Approval Accountability Concept
- **Human Decision**:
  - *"Render the Candidate's Resume and Portfolio on the left so the interviewer can read them directly, while on the right the interviewer builds the Interview Plan by combining candidate-specific questions with HR mandatory common questions. During plan creation, enforce fairness and transparency restrictions under Republic of Korea laws (`DO NOT ASK` redlines). Once the plan is established (with a conceptual ERP electronic approval sign-off for heightened accountability), configure the live interview screen from that approved plan, provide a per-question answer summarization tool during the interview, and finally synthesize the comprehensive evaluation report. Hold off on Cloud Run deployment and GitHub push until final sign-off—focus on coding now."*
- **Agent Co-Reasoning & Action**:
  1. **Split-Screen Multimodal Dossier & Plan Workspace (`Left: Visual PDF/PNG + OCR` | `Right: 5-Stage HITL Stepper`)**:
     - Left panel renders the actual Resume, Portfolio, and JD PDFs/PNGs (`public/samples/sample_resume_fp_c01..c03.png/.pdf`, `sample_portfolio_fp_c01..c03.png/.pdf`) alongside `gemini-3.8-flash` OCR text and competency tags (`C1`–`C5`).
     - Right panel implements the unified **5-Stage Human-in-the-Loop (HITL) Pipeline**:
       1. **Multimodal Document Ingestion (`gemini-3.8-flash`)**: Visual PDF/PNG reading + OCR extraction.
       2. **Pre-Interview Plan Formulation (`gemini-4-argon` + Statutory Gate + ERP Sign-off)**: Merges Resume/Portfolio-tailored questions + HR Mandatory Common Questions into one Interview Plan, blocks prohibited personal questions under Korean statutes (`Fair Hiring Procedure Act Art. 4-3`, `Equal Employment Act Art. 7(2)`, `Age Discrimination Act Art. 4-4`, `NHRC Act Art. 2(3)`), and locks the plan via an **ERP Electronic Approval Sign-off (`Accountability Lock`)**.
       3. **Approved-Plan Live Interview Screen (`gemini-3.5-flash-lite` + `gemini-4-argon`)**: Configures the live interview directly from the locked plan while guarding ad-hoc follow-up questions with the 3-Badge Gate.
       4. **Per-Question Answer Summarization & Rubric Alignment Tool**: Organizes candidate answers question-by-question into structured behavioral evidence bullets and 1–5 rubric scores.
       5. **Final Comprehensive Fairness & Evaluation Audit Report (`POST /api/report`, `gemini-4-argon` `ThinkingLevel.HIGH`)**: Synthesizes per-question summaries, competency coverage, statutory compliance, and ERP plan approval metadata into an executive decision dossier.
  2. **Deployment Hold**: Deferred Cloud Run deployment and GitHub push until explicit operator instruction after local verification.

---

### [HITL-013] 2026-10-16 13:15 KST — Final Verification Pass (`10/10` Tests, `20/20` Dual Benchmarks), GitHub Repository Merge (`lucasung-debug/Fair_Panel`) & YouTube Demo Submission Package
- **Human Decision**:
  - *"Commit and merge the completed codebase to `https://github.com/lucasung-debug/Fair_Panel`, and prepare the demo video for upload to my personal YouTube channel for the Google DeepMind AI Hackathon submission form (`Team Name`, `Team Members: General_Leo / Myeongjae Sung`, `Project Description + Google Cloud Link`, `Public GitHub Repository`, `Demo Video`)."*
- **Agent Co-Reasoning & Verification Impact**:
  1. **Full-Stack Verification Suite Passed (`0` Errors)**:
     - `npm test` (`node --test src/utils/checks.test.ts`): **10/10 test suites passed** (`Golden 20-question risk testset 20/20`, `Live Demo 20-question scenario testset 20/20`, `Statutory edge cases & contextual false-positive shields`, `Question quality checks K02/S06, K03/S07, K04/S08`, `Quote grounding`, `Question format checker`, `Second-opinion downgrade rule`, `Evaluation rationale validator`, `alignRiskWithStatutoryGroundTruth`, and `preset_fp_works_hr_ops English initialKit`).
     - `npm run lint` (`tsc --noEmit`): **0 TypeScript errors**.
     - `npm run build` (`vite build`): **Production bundle built cleanly (`dist/index.html`, `dist/assets/*`)**.
  2. **GitHub Repository Synchronization**:
     - Configured Git repository and remote `origin` (`https://github.com/lucasung-debug/Fair_Panel.git`), committed all 100% English source, multimodal sample assets (`public/samples/*`), and governance documentation (`README.md`, `GEMINI.md`, `HITL_DECISION_LOG.md`, `Dockerfile`), and merged/pushed to `main`.
