# FairPanel Workspace Harness (`GEMINI.md`)

> **Inherits & Complies With:** `~/.agents/governance/COMMON-POLICY.md` and `~/.gemini/GEMINI.md`
> **Target Primary Model:** `gemini-4-argon` (Google DeepMind AI Hackathon — Build with Gemini 4 Argon)

---

## 1. Document Hierarchy (Strict Source of Truth)

When resolving requirements, architecture, or verification criteria, enforce this strict priority order:

1. **P0 — Primary Legacy Document (Official Hackathon Spec & Builder Guide)**
   - Source: Google Doc `https://docs.google.com/document/d/13hG3aETJ54oKULF3JZUgM5VYHv7o2ZM4a4AZeqinbRg/edit?pli=1&tab=t.buqd8v5hdzxz` (4 Tabs: *Overview*, *Event Day Schedule*, *Resources*, *Gemini 4 Argon Builder Guide*).
   - Hard Constraints:
     - Must use **`gemini-4-argon`** as the core reasoning/agentic engine.
     - Must deploy to **Google Cloud Run** (or Vertex AI / GKE).
     - All repository documentation (`README.md`, `GEMINI.md`, `HITL_DECISION_LOG.md`), UI badges, and submission artifacts must support **English** (judging requirement).
     - Must implement **multi-step agentic workflows with explicit verification loops** rather than single-shot prompt wrappers.
2. **P1 — Secondary Legacy Document & Official Verification Pack**
   - Architecture & Execution Plan: `FairPanel_Hackathon_Execution_Architecture_Spec`
   - Golden Text & Benchmark Pack: `FairPanel_text_pack/`
     - `verification_guide.txt` (12-minute smoke test, statutory guardrails, honesty rules)
     - `sample_jd.txt` (`FP-Works`, 180 employees, `HR Operations Specialist`)
     - `sample_resume.txt` (`FP-C01`)
     - `demo_questions_20.txt` (`S01`–`S20` live demo input set)
     - `expected_results_20.txt` (`S01`–`S20` expected risk levels, statutory citations, candidate answer boundaries)
     - `original_testset_20.txt` (`B01`–`B20` fixed benchmark set)
     - `kit_validation_cases.txt` (`C1`–`C5` gold standard + `K01`–`K05` intentional defect cases)
3. **P2 — Tertiary Implementation Artifact**
   - `.aistudio/artifacts/brain/2b4432da-172a-4614-a202-70913c04d750/implementation_plan.md` (Subordinate to P0 and P1).

---

## 2. Model Routing & `@google/genai` SDK Contract

### 2.1 Approved Model IDs (Never Down-convert or Substitute)

| Role | Exact Model ID | Permitted `thinking_level` | Primary FairPanel Endpoints / Tasks |
| :--- | :--- | :--- | :--- |
| **Primary Reasoning & Agentic Loop** | `gemini-4-argon` | `"minimal"`, `"low"`, `"medium"`, `"high"` | `/api/kit` (Step B Draft & Step D Targeted Repair), `/api/risk` Stage 2 Escalation (`medium`), `/api/rewrite` (`medium`), `/api/candidate-guide` (`low`), `/api/report` (`high`) |
| **Multimodal & Fast Companion** | `gemini-3.8-flash` | `"low"`, `"medium"`, `"high"` (**NO `"minimal"`**) | `/api/parse-doc` (PDF/Image/Text JD, Resume & Portfolio extraction), `/api/section-coach` (`low`) |
| **High-Throughput First-Pass Judge** | `gemini-3.5-flash-lite` | `"minimal"`, `"low"`, `"medium"`, `"high"` | `/api/risk` Stage 1 fast risk classification (`low`), `/api/benchmark` Stage 1 (`low`) |

- **CRITICAL:** Never use `'gemini-3.1-flash-lite'`, `'gemini-2.5-flash'`, or `'gemini-1.5-pro'`.
- **CRITICAL:** Do **NOT** set `temperature`, `top_p`, `topP`, `top_k`, or `topK` on `gemini-4-argon` or `gemini-3.8-flash`. Rely on default sampling and control depth via `thinking_level` / `thinkingConfig`.

### 2.2 Two-Stage Risk Gate & Deterministic Reproducibility Rule

- **Never short-circuit before the LLM call using naive substring matches.** Terms like `"maternity leave"` (`S03`: `"Please explain how you managed access permissions for maternity leave and parental leave HR data."`) or `"key"` (`S05`: `"How did you design the primary key values when merging HR data across departments?"`) are legitimate technical/HR-ops questions (`expected=none`).
- **Execution Order for `/api/risk` and `/api/benchmark`:**
  1. **Stage 1 (`gemini-3.5-flash-lite`)**: Evaluate contextual risk (`none | caution | high`), trigger category, confidence, and escalation flag.
  2. **Stage 2 (`gemini-4-argon`)**: Triggered when `stage1.risk !== "none"` OR `stage1.confidence < 0.85` OR `stage1.escalate === true` OR contextual ambiguity exists.
  3. **Post-LLM Deterministic Ground-Truth Guard & Fallback**: Reconciles LLM outputs against statutory invariants (`isTechnicalOrHrOpsContextSafe`, `isNeutralJobRequirementQuestion`, `job_irrelevant_privacy` empty `lawRefs: []`) to guarantee 100% deterministic demo reproducibility.

---

## 3. Verification Loop & Statutory Honesty Rules

1. **Real 5-Criterion Kit Verification Loop (`/api/kit`)**:
   - Step A: Extract 5 core competencies (`C1`–`C5`) from JD + Resume + Portfolio.
   - Step B: Generate 5 structured behavioral questions + 1–5 scoring rubrics using `gemini-4-argon`.
   - Step C: Deterministic + semantic audit across 5 criteria:
     1. `legal`: Passes risk check (`risk === "none"`).
     2. `jobRelevant`: Anchored to one of `C1`–`C5` with JD/Resume/Portfolio evidence.
     3. `behavioral`: Requires past behavioral/process evidence (rejects vague capability prompts like `K04`).
     4. `single`: Single topic/question (rejects compound questions even with a single `?`, such as `K02`/`S06` `"Tell me about a time you resolved a team conflict and simultaneously the hardest overtime experience you had"`).
     5. `nonLeading`: Rejects leading questions (`K03`/`S07` `"Don't you think verbal agreement is faster than documentation?"`, `"Isn't retraining the right answer?"`).
   - Step D: If any criterion fails (`pass === false`), call `gemini-4-argon` to repair **only** the failed questions (up to 2 repair rounds) and return both `round1Failures` and `round2Repairs` transparently.
   - **Honesty Rule:** If Round 1 has 0 failures, display `Round 1 Passed (0 failures)` honestly—never fabricate fake failures.
2. **Statutory Compliance Accuracy (`src/data/laws.ts`)**:
   - **Equal Employment Act Art. 7(2) (`gender_7`)**: Subject is **all workers (`workers`)**, NOT `'female workers'`. Prohibits demanding physical conditions (appearance, height, weight) or unmarried status not required for the job.
   - **Fair Hiring Procedure Act Art. 4-3 (`recruit_4_3`)**: Directly regulates **basic screening documents (`application forms / resumes`)** at workplaces with **$\ge 30$ employees** (`FP-Works` has 180 employees). For oral interview questions, always explain that demanding these items in an interview violates the statutory intent (`oral interview questions restricted under statutory intent`).
   - **Job-Irrelevant Privacy (`S11` drinking capacity at team dinners, `S12` weekend companions)**: Classify as `risk: "caution"` (`Job-Irrelevant Personal Privacy`), with `lawRefs: []` (empty array—do not force-attach statutory articles where none apply).
3. **Benchmark Separation (`B01`–`B20` vs `S01`–`S20`)**:
   - Never combine `original_testset_20.txt` (`B01`–`B20`) and `demo_questions_20.txt` (`S01`–`S20`) into a fake `40/40` badge. Report them as two distinct 20-question evaluation sets (`Fixed Benchmark 20` and `Live Demo 20`).

---

## 4. Antigravity Multi-Agent & MCP Operating Protocol

### 4.1 Agentic Role Division: Argon (Orchestrator/Verifier) vs. 3.8 Flash (Parallel Coder)
- **Argon (`gemini-4-argon` / Parent Coordinator):**
  - Focuses strictly on **Architecture, Orchestration, Verification Loops, Statutory Judgment, and Cross-Checking**.
  - Defines shared TypeScript contracts (`src/types.ts`), dispatches parallel coding tracks with zero file overlap, audits generated code against `verification_guide.txt`, and executes integration tests.
  - At runtime in FairPanel, `gemini-4-argon` is dedicated to high-stakes reasoning and verification: Step 1 Kit Audit & Targeted Repair (`/api/kit`), Step 2 Stage-2 Escalation Judge & Candidate Answer Boundary Guide (`/api/risk`, `/api/candidate-guide`), and Step 4 Executive Fairness Audit (`/api/report`).
- **3.8 Flash (`Model: "flash"` Subagents / `gemini-3.8-flash` Companion):**
  - Dispatched in parallel via `invoke_subagent` (`Model: "flash"`) across strictly disjoint file sets (`Track 1: Data/Laws/Checks`, `Track 2: Backend Routes`, `Track 3: Frontend Views/Modals`) for high-velocity implementation.
  - At runtime in FairPanel, `gemini-3.8-flash` handles multimodal JD/Resume parsing (`/api/parse-doc`), fast section coaching (`/api/section-coach`), and low-latency drafting.

### 4.2 MCP Utilization & Context Budget
- **Active MCPs for FairPanel:**
  - `gemini-api_gemini-api-docs`: Verify `@google/genai` SDK types and model parameters.
  - `chrome-devtools-mcp`: Run automated UI verification, network inspection (`/api/kit`, `/api/risk`, `/api/benchmark`), console error checks, and screenshot capture.
  - `cloudrun`: Deploy FairPanel directly to Google Cloud Run (`deploy_local_folder`) and inspect logs (`get_service_log`).
- **Ignored MCPs (Context Preservation):** Do not load tools from `science_biomolecular_structure_viewer_mcp`, `data-agent-kit-plugin_dak-notebook`, or `data-agent-kit-plugin_dak-viz`.
- **HITL / HITR Co-Reasoning Log:** Record every major architectural and verification decision in `HITL_DECISION_LOG.md` with explicit Human Trigger, Agent Analysis, Joint Decision, and Code/Verification Impact.
