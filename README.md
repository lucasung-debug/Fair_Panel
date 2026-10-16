# FairPanel — Real-Time Structured Interview & Legal/Bias Verification Copilot

> **Google DeepMind AI Hackathon — Build with Gemini 4 Argon (Seoul, Oct 2026)**
> **Primary Reasoning Engine:** `gemini-4-argon` | **Companion Models:** `gemini-3.8-flash` & `gemini-3.5-flash-lite`
> **Live Google Cloud Run URL:** [https://fairpanel-401108022555.asia-northeast3.run.app](https://fairpanel-401108022555.asia-northeast3.run.app) (`Project: h2gdm-hack26icn-2609`, `Region: asia-northeast3`)
> **Human-in-the-Loop Governance Log:** [`HITL_DECISION_LOG.md`](./HITL_DECISION_LOG.md) | **Agent Harness:** [`GEMINI.md`](./GEMINI.md)

---

## 1. Problem & Impact Framing (Why FairPanel Matters)

Unstructured job interviews expose both employers and candidates to severe compliance, fairness, and signal-quality failures:

1. **Statutory & Discrimination Exposure**: Interviewers frequently ask ad-hoc questions regarding marital plans, pregnancy/childbirth, family occupation/assets, physical appearance, or age hierarchy. Under Korean labor law, these trigger risk across:
   - **Fair Hiring Procedure Act, Article 4-3**: Directly prohibits demanding job-irrelevant physical conditions (appearance, height, weight), region of origin, marital status, personal assets, or family members' education/occupation/assets in basic screening documents (application forms and resumes) at workplaces with **$\ge 30$ employees** (`FP-Works` has 180 employees), and asking such questions orally in interviews violates the statutory intent (`oral interview questions restricted under statutory intent`).
   - **Equal Employment Opportunity Act, Article 7(2)**: Prohibits discriminating on gender or demanding physical conditions or unmarried status not required for the job from **all workers (`workers`)**.
   - **Age Discrimination in Employment Act, Article 4-4**: Prohibits age-based discrimination or hierarchy/adaptability presumptions in recruitment and hiring.
   - **National Human Rights Commission Act, Article 2(3)**: Defines unreasonable differential treatment based on gender, religion, age, region of origin, marital/pregnancy status, family form, or political opinion in employment as a discriminatory act.
2. **Low-Signal Question Quality**: Even legally safe questions often fail structured interview standards due to **compound queries** (`Compound`), **leading phrasing** (`Leading`), or **vague non-behavioral prompts** (`Vague / Non-Behavioral`).
3. **Asymmetric Candidate Vulnerability**: When a candidate faces an invasive or inappropriate question in a live interview, they have seconds to respond without sacrificing their candidacy or over-disclosing protected personal data.

**FairPanel** transforms unstructured interviewing into an **auditable, 5-stage Human-in-the-Loop (HITL) agentic workflow** that simultaneously protects **Interviewers**, **HR Governance Teams**, and **Candidates**.

---

## 2. Multi-Model Agentic Architecture (`gemini-4-argon` + Companion Models)

FairPanel is built as a **multi-step verification and escalation loop**, pairing `gemini-4-argon`'s deep legal/contextual reasoning with the low latency of `gemini-3.5-flash-lite` and multimodal speed of `gemini-3.8-flash`:

```mermaid
flowchart TD
  subgraph S1["Step 1: Interview Kit Generation & 5-Criterion Verification Loop"]
    D1["JD + Resume + Portfolio Input\n(PDF/Image/Text)"] -->|"gemini-3.8-flash\n(thinking_level: low)"| P1["Structured Extraction\n(/api/parse-doc)"]
    P1 -->|"gemini-4-argon\n(thinking_level: medium)"| K1["Step A/B: Extract C1–C5 Competencies\n& Draft 5 Behavioral Questions + 1/3/5 Rubrics"]
    K1 --> V1["Step C: 5-Criterion Deterministic + Semantic Audit\n(1. Legal, 2. Job-Relevant, 3. Behavioral, 4. Single, 5. Non-Leading)"]
    V1 -->|"Failed Items Only\n(e.g., K01–K05)"| R1["Step D: Targeted Argon Repair Loop\n(gemini-4-argon -> Round 2 Re-Verification)"]
    V1 -->|"0 Failures"| K2["Verified Structured Kit + ERP Approval Sign-Off"]
    R1 --> K2
  end

  subgraph S2["Step 2 & 3: Two-Stage Live Question Gate & Candidate Protection"]
    Q1["Live Interviewer Draft Question\n(e.g., S01–S20)"] -->|"Stage 1 Fast Triage\ngemini-3.5-flash-lite (low)"| G1{"Risk != none OR\nQuality != ok OR\nAmbiguous Context?"}
    G1 -->|"No (Safe & High Quality)"| B0["3-Badge Pass:\nNONE | VALID | Competency-Focused Answer"]
    G1 -->|"Yes (Escalate)"| G2["Stage 2 Deep Contextual & Statutory Judge\ngemini-4-argon (thinking_level: medium)"]
    G2 --> B1["Badge 1: Legal/Policy Risk\n+ Statutory Scope Note"]
    G2 --> B2["Badge 2: Question Quality\n+ 1-Click Behavioral Rewrite"]
    G2 --> B3["Badge 3: Candidate Answer Strategy\n+ Polite Boundary Script & Pivot Points"]
  end

  subgraph S4["Step 4: Post-Interview Fairness & Competency Audit Report"]
    T1["Session Transcript + Per-Question Evidence Summary\n+ Rubric Rationale Bias Audit"] -->|"gemini-4-argon\n(thinking_level: high)"| AR["Executive Fairness & Competency Coverage Report\n(POST /api/report)"]
  end
```

### Model Routing Summary

| Endpoint / Module | Model ID | `thinking_level` | Role in Agentic Loop |
| :--- | :--- | :--- | :--- |
| `POST /api/kit` (Step B & Step D) | `gemini-4-argon` | `medium` | Extracts `C1`–`C5` competencies, drafts behavioral questions + 1/3/5 rubrics, and repairs **only** failed items in Round 2. |
| `POST /api/risk` / `/api/pre-ask-check` (Stage 1 Triage) | `gemini-3.5-flash-lite` | `low` | Sub-second first-pass risk & question-quality classification. |
| `POST /api/risk` / `/api/pre-ask-check` (Stage 2 Escalation) | `gemini-4-argon` | `medium` | Contextual disambiguation (e.g., distinguishing HR-ops maternity data access `S03` from personal pregnancy probes `S14`), statutory mapping, and behavioral rewrite. |
| `POST /api/rewrite` | `gemini-4-argon` | `medium` | Converts risky, compound (`S06`), leading (`S07`), or vague (`S08`) questions into neutral behavioral questions with 1/3/5 rubrics. |
| `POST /api/candidate-guide` | `gemini-4-argon` | `low` / `medium` | Generates real-time Candidate Answer Strategy (`Disclosure Boundary Recommended`, polite refusal/boundary script, job-strength pivot points, and MOEL/NHRC redress channels). |
| `POST /api/parse-doc` & `/api/section-coach` | `gemini-3.8-flash` | `low` | Multimodal PDF/image/text JD, Resume & Portfolio parsing and resume section coaching. |
| `POST /api/report` | `gemini-4-argon` | `high` | Synthesizes post-interview competency coverage (`C1`–`C5`), intercepted risks, rubric bias checks, and actionable governance recommendations. |

---

## 3. Key Features & The 3-Badge Live Question Gate

Every question inspected in FairPanel produces **three synchronized verification badges**:

1. **Badge 1 — Legal & Policy Risk**:
   - Classifies questions into `NONE (Recommended)`, `MEDIUM / CAUTION`, or `HIGH RISK`.
   - Context-aware: Correctly passes legitimate technical/HR-ops questions containing sensitive substrings, such as **`S03`** (`"Please explain how you managed access permissions for maternity leave and parental leave HR data."` -> `NONE`), **`S04`** (`"Please confirm whether you can participate in the quarterly closing intensive schedule stated in the job posting."` -> `NONE`), and **`S05`** (`"How did you design the primary key values when merging HR data across departments?"` -> `NONE`).
   - Statutory precision: Distinguishes between statutory violations (`recruit_4_3`, `gender_7`, `age_4_4`, `nhrc_2_3`) and job-irrelevant personal privacy questions where no direct statute applies (**`S11`** drinking habits and **`S12`** weekend companions -> `MEDIUM / CAUTION` with `lawRefs: []`).
2. **Badge 2 — Question Quality**:
   - Detects **`Compound`** (`S06` / `K02`), **`Leading`** (`S07` / `K03`), and **`Vague / Non-Behavioral`** (`S08` / `K04`) defects, offering a 1-click `gemini-4-argon` behavioral rewrite.
3. **Badge 3 — Candidate Answer Strategy**:
   - Provides `Competency-Focused Answer` guidance for valid questions and `Disclosure Boundary Recommended` (with polite boundary scripts, competency pivot points, and post-interview MOEL/NHRC consultation channels) for medium/high-risk questions.

---

## 4. Dual 20-Item Verification Benchmarks (`B01`–`B20` & `S01`–`S20`)

FairPanel ships with two separate, independently verifiable 20-question evaluation suites (never artificially merged into a `40/40` score):

1. **Live Demo 20-Question Suite (`S01`–`S20`, `demo_questions_20.txt` + `expected_results_20.txt`)**:
   - `S01`–`S05`: Safe behavioral & context-exception questions (`S03` maternity data access, `S04` posted schedule check, `S05` database merge key).
   - `S06`–`S08`: Question quality defects (`S06` compound, `S07` leading, `S08` vague).
   - `S09`–`S12`: Medium/caution risk (`S09` commute distance, `S10` personality binary, `S11` drinking, `S12` weekend privacy).
   - `S13`–`S20`: High-risk statutory/discrimination probes (marriage, childbirth, family occupation, hometown, housing assets, height/weight/appearance, age/younger lead, gender/overtime).
2. **Fixed Benchmark 20-Question Suite (`B01`–`B20`, `original_testset_20.txt`)**:
   - 10 High-Risk + 10 Safe benchmark questions (`20/20` deterministic & LLM-backed verification).
3. **Kit Defect Repair Cases (`K01`–`K05`, `kit_validation_cases.txt`)**:
   - Interactive HR Admin demo proving Round 1 failure detection and Round 2 targeted `gemini-4-argon` repair.

---

## 5. Quick Start & Verification

### Prerequisites
- Node.js 20+
- `GEMINI_API_KEY` environment variable set in `.env.local` or shell environment

### Local Setup & Execution
```bash
# 1. Install dependencies
npm install

# 2. Run deterministic unit & benchmark tests (B01-B20 & S01-S20)
npm test

# 3. Start full-stack server (Express API + Vite React UI on port 3000)
npm run dev
```

### Google Cloud Run Deployment (`h2gdm-hack26icn-2609`)
```bash
gcloud auth configure-docker asia-northeast3-docker.pkg.dev --quiet && \
docker build -t asia-northeast3-docker.pkg.dev/h2gdm-hack26icn-2609/cloud-run-source-deploy/fairpanel:latest . && \
docker push asia-northeast3-docker.pkg.dev/h2gdm-hack26icn-2609/cloud-run-source-deploy/fairpanel:latest && \
gcloud run deploy fairpanel \
  --image asia-northeast3-docker.pkg.dev/h2gdm-hack26icn-2609/cloud-run-source-deploy/fairpanel:latest \
  --region asia-northeast3 \
  --project h2gdm-hack26icn-2609 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=${GEMINI_API_KEY}"
```

---

## 6. Human-in-the-Loop (HITL / HITR) Co-Reasoning Log

All architectural decisions, statutory accuracy calibrations, model routing choices (`gemini-4-argon` for verification/judgment/orchestration vs `gemini-3.8-flash` for parallel coding and parsing), and bug fixes discovered during the hackathon are transparently documented in [`HITL_DECISION_LOG.md`](./HITL_DECISION_LOG.md).
