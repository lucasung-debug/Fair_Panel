import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, execSync } from 'child_process';

const OUT_DIR = path.resolve(process.env.FILM_OUT_DIR || path.join(os.tmpdir(), 'fairpanel_apple_film'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3099;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ---------------------------------------------------------------------------
// 1. Minimal CDP Client using Node 22 native WebSocket
// ---------------------------------------------------------------------------
class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 0;
    this.pending = new Map();
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data.toString());
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }
  async ready() {
    if (this.ws.readyState === 1) return;
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  close() {
    try { this.ws.close(); } catch {}
  }
}

async function captureAppScreenshots(cdp) {
  console.log('[1/4] Capturing 5 native 1920x1080 Retina UI screenshots from live FairPanel app...');
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 2,
    mobile: false,
  });

  await cdp.send('Page.navigate', { url: `http://localhost:${PORT}` });
  await sleep(2200);

  const snap = async (name) => {
    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const file = path.join(OUT_DIR, name);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(`  -> Saved ${name}`);
    return file;
  };

  // UI Shot 1: Step 1 Pre-Interview Plan + Multimodal Dossier + ERP Sign-off Lock (Default initial state)
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, 0);
    })()`,
  });
  await sleep(700);
  await snap('ui_step1_plan.png');

  // UI Shot 2: HR Fit & Control — 5-Criterion Audit Matrix & Korean Labor Law Guardrails
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, 0);
      const btns = Array.from(document.querySelectorAll('button'));
      const hrBtn = btns.find(b => b.innerText && b.innerText.includes('HR Fit & Control'));
      if (hrBtn) hrBtn.click();
    })()`,
  });
  await sleep(800);
  await snap('ui_step1_redline.png');

  // UI Shot 3: Back to Interviewer Desk -> Approve & Lock Plan (switches to Step 2) -> Click S14 HIGH RISK Gate
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, 0);
      const btns = Array.from(document.querySelectorAll('button'));
      const intv = btns.find(b => b.innerText && b.innerText.includes('Interviewer Desk'));
      if (intv) intv.click();
    })()`,
  });
  await sleep(500);
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const approve = btns.find(b => b.innerText && b.innerText.includes('Approve & Lock Interview Plan'));
      if (approve) approve.click();
      window.scrollTo(0, 0);
    })()`,
  });
  await sleep(600);
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const s14 = btns.find(b => b.innerText && b.innerText.trim().startsWith('S14'));
      if (s14) s14.click();
    })()`,
  });
  for (let i = 0; i < 14; i++) {
    await sleep(600);
    const evalRes = await cdp.send('Runtime.evaluate', {
      expression: `document.body.innerText.includes('pregnancy') || document.body.innerText.includes('Art. 7(2)')`,
      returnByValue: true,
    });
    if (evalRes?.result?.value === true) break;
  }
  await sleep(600);
  await snap('ui_step2_live_gate.png');

  // UI Shot 4: Candidate Empowerment Role View (Synchronized with S14 boundary guide)
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, 0);
      const btns = Array.from(document.querySelectorAll('button'));
      const cand = btns.find(b => b.innerText && b.innerText.includes('Candidate View'));
      if (cand) cand.click();
    })()`,
  });
  await sleep(900);
  await snap('ui_candidate_view.png');

  // UI Shot 5: Executive Audit Report (Wait for synthesis to finish)
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, 0);
      const btns = Array.from(document.querySelectorAll('button'));
      const rep = btns.find(b => b.innerText && b.innerText.includes('Audit Report'));
      if (rep) rep.click();
    })()`,
  });
  for (let i = 0; i < 20; i++) {
    await sleep(700);
    const doneRes = await cdp.send('Runtime.evaluate', {
      expression: `!document.body.innerText.includes('Synthesizing')`,
      returnByValue: true,
    });
    if (doneRes?.result?.value === true) break;
  }
  await sleep(600);
  await snap('ui_step3_report.png');

  // UI Shot 6: 20/20 Benchmark Modal
  await cdp.send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bench = btns.find(b => b.innerText && (b.innerText.includes('20/20') || b.innerText.includes('Benchmark')));
      if (bench) bench.click();
    })()`,
  });
  await sleep(900);
  await snap('ui_benchmark_modal.png');
}

// ---------------------------------------------------------------------------
// 2. Apple Keynote 11-Scene Master Slide Definitions
// ---------------------------------------------------------------------------
function toDataUrl(filePath) {
  const b64 = fs.readFileSync(filePath).toString('base64');
  return `data:image/png;base64,${b64}`;
}

function buildScenes() {
  const imgStep1 = toDataUrl(path.join(OUT_DIR, 'ui_step1_plan.png'));
  const imgRedline = toDataUrl(path.join(OUT_DIR, 'ui_step1_redline.png'));
  const imgStep2 = toDataUrl(path.join(OUT_DIR, 'ui_step2_live_gate.png'));
  const imgCand = toDataUrl(path.join(OUT_DIR, 'ui_candidate_view.png'));
  const imgStep3 = toDataUrl(path.join(OUT_DIR, 'ui_step3_report.png'));
  const imgBench = toDataUrl(path.join(OUT_DIR, 'ui_benchmark_modal.png'));

  return [
    {
      id: 'scene01',
      duration: 5.0,
      narration: 'Every interview question shapes a career. Introducing FairPanel — built with Google DeepMind Gemini 4 Argon.',
      html: `
        <div class="slide dark center">
          <div class="aurora-ring"></div>
          <div class="pill-tag">GOOGLE DEEPMIND AI HACKATHON · GEMINI 4 ARGON</div>
          <h1 class="hero-title">Every interview question<br/><span class="apple-grad">shapes a career.</span></h1>
          <p class="hero-sub">Introducing <strong>FairPanel</strong> — the real-time structured interview<br/>and statutory compliance copilot built with <strong>Gemini 4 Argon</strong>.</p>
          <div class="hero-chips">
            <span class="chip">gemini-4-argon</span>
            <span class="chip">gemini-3.8-flash</span>
            <span class="chip">gemini-3.5-flash-lite</span>
            <span class="chip green">PASS 20/20 Reproducible</span>
          </div>
        </div>
      `,
    },
    {
      id: 'scene02',
      duration: 5.5,
      narration: 'Unstructured interviews expose organizations to statutory labor law violations, low-signal questions, and unfair pressure on candidates.',
      html: `
        <div class="slide dark">
          <div class="section-header">
            <div class="kicker">THE PROBLEM · UNSTRUCTURED HIRING</div>
            <h2 class="section-title">Three failures hidden in live interviews.</h2>
          </div>
          <div class="bento-3">
            <div class="bento-card red-glow">
              <div class="card-num">01 · STATUTORY EXPOSURE</div>
              <h3>Illegal Personal Probes</h3>
              <p>Ad-hoc questions on marriage plans, pregnancy, family assets, appearance, or age violate Korean labor statutes:</p>
              <div class="statute-list">
                <span>Fair Hiring Procedure Act Art. 4-3</span>
                <span>Equal Employment Act Art. 7(2)</span>
                <span>Age Discrimination Act Art. 4-4</span>
                <span>NHRC Act Art. 2(3)</span>
              </div>
            </div>
            <div class="bento-card amber-glow">
              <div class="card-num">02 · LOW SIGNAL QUALITY</div>
              <h3>Unverified Question Traps</h3>
              <p>Even legally safe questions fail structured hiring standards when interviewers ask:</p>
              <div class="statute-list">
                <span>Compound Questions (2+ topics at once)</span>
                <span>Leading Prompts ("Don't you think...?")</span>
                <span>Vague Non-Behavioral Prompts</span>
              </div>
            </div>
            <div class="bento-card blue-glow">
              <div class="card-num">03 · ASYMMETRIC RISK</div>
              <h3>Candidate Vulnerability</h3>
              <p>When asked an invasive personal question live, candidates have seconds to respond without losing their opportunity or over-disclosing private data.</p>
              <div class="statute-list">
                <span>Need Real-Time Boundary Scripts</span>
                <span>Need Competency Pivot Guidance</span>
              </div>
            </div>
          </div>
        </div>
      `,
    },
    {
      id: 'scene03',
      duration: 5.5,
      narration: 'FairPanel solves this with an auditable multi-model loop: Gemini 4 Argon for deep legal reasoning, Gemini 3.8 Flash for multimodal OCR, and Gemini 3.5 Flash-Lite for sub-second triage.',
      html: `
        <div class="slide light">
          <div class="section-header">
            <div class="kicker dark-kicker">MULTI-MODEL AGENTIC ARCHITECTURE</div>
            <h2 class="section-title dark-text">One verification loop. <span class="apple-grad">Three Gemini models.</span></h2>
          </div>
          <div class="bento-3 light-bento">
            <div class="bento-card light-card hero-border">
              <div class="model-pill argon">PRIMARY ENGINE · gemini-4-argon</div>
              <h3>Deep Statutory & Verification Loop</h3>
              <p>Powers the 5-Criterion Kit Audit & Targeted Round-2 Repair (<code>/api/kit</code>), Stage-2 Legal Escalation (<code>/api/risk</code>), 1-Click Behavioral Rewrite (<code>/api/rewrite</code>), and Executive Audit Report (<code>/api/report</code>).</p>
              <div class="meta-row">thinking_level: medium / high · Default sampling</div>
            </div>
            <div class="bento-card light-card">
              <div class="model-pill flash">MULTIMODAL OCR · gemini-3.8-flash</div>
              <h3>PDF & PNG Dossier Extraction</h3>
              <p>Reads multi-page Job Descriptions, Resumes, and Portfolios (<code>/api/parse-doc</code>) and powers fast resume section coaching (<code>/api/section-coach</code>).</p>
              <div class="meta-row">thinking_level: low · 14 Multimodal PDF/PNG Assets</div>
            </div>
            <div class="bento-card light-card">
              <div class="model-pill lite">STAGE-1 TRIAGE · gemini-3.5-flash-lite</div>
              <h3>Sub-Second Pre-Ask Gate</h3>
              <p>Screens every live interviewer question in milliseconds (<code>/api/risk</code> Stage 1) and escalates ambiguous or risky prompts to <code>gemini-4-argon</code>.</p>
              <div class="meta-row">thinking_level: low · Deterministic statutory guard</div>
            </div>
          </div>
        </div>
      `,
    },
    {
      id: 'scene04',
      duration: 5.5,
      narration: 'Stage One: Multimodal Dossier and Pre-Interview Planning. Interviewers read original PDF and PNG resumes on the left while locking an ERP-approved question plan on the right.',
      html: `
        <div class="slide dark split-showcase">
          <div class="showcase-left">
            <div class="step-badge">STAGE 01 · MULTIMODAL DOSSIER & ERP LOCK</div>
            <h2>Read PDF & PNG Dossiers.<br/><span class="apple-grad">Lock the Plan Before Asking.</span></h2>
            <div class="callout-stack">
              <div class="callout-box">
                <div class="callout-title">📄 Direct PDF/PNG Visual Reader (Left Pane)</div>
                <div class="callout-desc">Inspect candidate Resume & Portfolio documents side-by-side while <code>gemini-3.8-flash</code> extracts <code>C1–C5</code> competency anchors.</div>
              </div>
              <div class="callout-box green-box">
                <div class="callout-title">🔒 ERP Electronic Approval Lock (Right Pane)</div>
                <div class="callout-desc">Requires electronic sign-off (<code>ERP-REQ-2026-90412</code>) verifying all planned questions pass statutory compliance before Step 2 unlocks.</div>
              </div>
            </div>
          </div>
          <div class="showcase-right">
            <div class="mac-window">
              <div class="mac-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="mac-url">fairpanel · Stage 1 Pre-Interview Plan & ERP Lock</span></div>
              <img src="${imgStep1}" class="mac-img" />
            </div>
          </div>
        </div>
      `,
    },
    {
      id: 'scene05',
      duration: 6.0,
      narration: 'Context matters. FairPanel distinguishes legitimate technical questions—like managing access permissions for maternity leave data—from illegal personal pregnancy inquiries.',
      html: `
        <div class="slide dark split-showcase">
          <div class="showcase-left">
            <div class="step-badge">STAGE 02 · CONTEXT-AWARE STATUTORY REDLINE</div>
            <h2>Context over keywords.<br/><span class="apple-grad">Zero false positives.</span></h2>
            <div class="callout-stack">
              <div class="callout-box green-box">
                <div class="callout-title">✅ ALLOWED TECHNICAL QUESTION (S03 · NONE)</div>
                <div class="callout-quote">"Please describe how you managed access permissions for maternity and parental leave HR data."</div>
                <div class="callout-desc">Recognized as legitimate HR-ops RBAC data security inquiry anchored to the candidate's portfolio.</div>
              </div>
              <div class="callout-box red-box">
                <div class="callout-title">🚫 DO NOT ASK REDLINE (S14 · HIGH RISK)</div>
                <div class="callout-quote">"Do you have plans for pregnancy or childbirth within the next two years?"</div>
                <div class="callout-desc">Blocked under Equal Employment Opportunity Act Art. 7(2) & NHRC Act Art. 2(3).</div>
              </div>
            </div>
          </div>
          <div class="showcase-right">
            <div class="mac-window">
              <div class="mac-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="mac-url">fairpanel · Verified Question Plan & DO NOT ASK Redline</span></div>
              <img src="${imgRedline}" class="mac-img" />
            </div>
          </div>
        </div>
      `,
    },
    {
      id: 'scene06',
      duration: 6.0,
      narration: 'Stage Three: The Real-Time Three-Badge Gate. Every live question is verified for Legal Risk, Question Quality, and Candidate Strategy, with one-click Argon behavioral rewrites.',
      html: `
        <div class="slide light split-showcase">
          <div class="showcase-left">
            <div class="step-badge light-badge">STAGE 03 · REAL-TIME 3-BADGE QUESTION GATE</div>
            <h2 class="dark-text">Intercept risk live.<br/><span class="apple-grad">Rewrite in one click.</span></h2>
            <div class="callout-stack">
              <div class="callout-box light-box">
                <div class="callout-title dark-text">🛡️ Badge 1 · Legal & Policy Risk</div>
                <div class="callout-desc dark-sub">Flags <code>HIGH RISK</code> statutory violations (<code>S13–S20</code>) and <code>CAUTION</code> privacy probes (<code>S11–S12</code> with <code>lawRefs: []</code>).</div>
              </div>
              <div class="callout-box light-box">
                <div class="callout-title dark-text">✨ Badge 2 · Question Quality + Argon Rewrite</div>
                <div class="callout-desc dark-sub">Catches <strong>Compound (S06)</strong>, <strong>Leading (S07)</strong>, and <strong>Vague (S08)</strong> prompts and rewrites them into 1/3/5 behavioral questions.</div>
              </div>
              <div class="callout-box light-box">
                <div class="callout-title dark-text">🧭 Badge 3 · Candidate Answer Strategy</div>
                <div class="callout-desc dark-sub">Generates synchronized disclosure boundary guidance in real time.</div>
              </div>
            </div>
          </div>
          <div class="showcase-right">
            <div class="mac-window dark-shadow">
              <div class="mac-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="mac-url">fairpanel · Step 2 Live Interview & 3-Badge Gate</span></div>
              <img src="${imgStep2}" class="mac-img" />
            </div>
          </div>
        </div>
      `,
    },
    {
      id: 'scene07',
      duration: 5.5,
      narration: 'Candidate Empowerment Mode gives applicants a polite boundary script to decline invasive questions, pivot back to job strengths, and access official redress channels.',
      html: `
        <div class="slide dark split-showcase">
          <div class="showcase-left">
            <div class="step-badge">CANDIDATE EMPOWERMENT VIEW · /api/candidate-guide</div>
            <h2>Protecting candidates<br/><span class="apple-grad">in the moment.</span></h2>
            <div class="callout-stack">
              <div class="callout-box purple-box">
                <div class="callout-title">💬 Polite Boundary Script</div>
                <div class="callout-quote">"I would prefer to keep personal family plans private, but I can confirm my full commitment to the role's schedule and deliverables."</div>
              </div>
              <div class="callout-box">
                <div class="callout-title">🎯 Competency Pivot & Official Redress</div>
                <div class="callout-desc">Guides candidates on which job strengths to emphasize instead, plus post-interview MOEL & NHRC consultation channels.</div>
              </div>
            </div>
          </div>
          <div class="showcase-right">
            <div class="mac-window">
              <div class="mac-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="mac-url">fairpanel · Candidate Protection & Boundary Script View</span></div>
              <img src="${imgCand}" class="mac-img" />
            </div>
          </div>
        </div>
      `,
    },
    {
      id: 'scene08',
      duration: 5.5,
      narration: 'Stage Four and Five: Per-question answer summarization, subjective bias blocking, and the Executive Fairness Audit Report powered by Gemini 4 Argon at high thinking depth.',
      html: `
        <div class="slide dark split-showcase">
          <div class="showcase-left">
            <div class="step-badge">STAGE 04 & 05 · EXECUTIVE FAIRNESS AUDIT REPORT</div>
            <h2>Audit every score.<br/><span class="apple-grad">Prove hiring fairness.</span></h2>
            <div class="callout-stack">
              <div class="callout-box">
                <div class="callout-title">📝 Per-Question Evidence & Bias Blocker</div>
                <div class="callout-desc">Summarizes candidate responses into behavioral bullets and blocks subjective scoring notes like <em>"good impression"</em> or <em>"good vibe"</em>.</div>
              </div>
              <div class="callout-box green-box">
                <div class="callout-title">📊 Executive Audit Report (gemini-4-argon · HIGH)</div>
                <div class="callout-desc">Synthesizes <code>C1–C5</code> competency coverage, intercepted risk logs, and ERP approval metadata into a signed governance report.</div>
              </div>
            </div>
          </div>
          <div class="showcase-right">
            <div class="mac-window">
              <div class="mac-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="mac-url">fairpanel · Step 3 Executive Fairness & Competency Audit Report</span></div>
              <img src="${imgStep3}" class="mac-img" />
            </div>
          </div>
        </div>
      `,
    },
    {
      id: 'scene09',
      duration: 5.5,
      narration: 'Verified across two independent twenty-question benchmark suites — Fixed Benchmark B01 to B20 and Live Demo S01 to S20 — achieving 100 percent deterministic accuracy.',
      html: `
        <div class="slide light split-showcase">
          <div class="showcase-left">
            <div class="step-badge light-badge">DUAL BENCHMARK VERIFICATION · 100% REPRODUCIBLE</div>
            <h2 class="dark-text">20/20 + 20/20.<br/><span class="apple-grad">Verified to the statute.</span></h2>
            <div class="callout-stack">
              <div class="callout-box light-box">
                <div class="callout-title dark-text">✅ Live Demo Suite (S01–S20 · PASS 20/20)</div>
                <div class="callout-desc dark-sub">Passes safe context exceptions (<code>S03–S05</code>), flags quality defects (<code>S06–S08</code>), caution privacy (<code>S09–S12</code>), and statutory blocks (<code>S13–S20</code>).</div>
              </div>
              <div class="callout-box light-box">
                <div class="callout-title dark-text">✅ Fixed Benchmark Suite (B01–B20 · PASS 20/20)</div>
                <div class="callout-desc dark-sub">Evaluated independently (never merged into a fake 40/40 badge) + <code>K01–K05</code> Round-1 failure & Round-2 Argon repair proof.</div>
              </div>
            </div>
          </div>
          <div class="showcase-right">
            <div class="mac-window dark-shadow">
              <div class="mac-bar"><span class="dot r"></span><span class="dot y"></span><span class="dot g"></span><span class="mac-url">fairpanel · Dual 20-Item Benchmark Verification Suite</span></div>
              <img src="${imgBench}" class="mac-img" />
            </div>
          </div>
        </div>
      `,
    },
    {
      id: 'scene10',
      duration: 5.0,
      narration: 'FairPanel. Structured, lawful, and human-centered interviewing — powered by Gemini 4 Argon and deployed live on Google Cloud Run.',
      html: `
        <div class="slide dark center">
          <div class="aurora-ring"></div>
          <div class="pill-tag">LIVE ON GOOGLE CLOUD RUN · PROJECT h2gdm-hack26icn-2609</div>
          <h1 class="hero-title">FairPanel.<br/><span class="apple-grad">Fairness, verified in real time.</span></h1>
          <p class="hero-sub">Built with <strong>Google DeepMind Gemini 4 Argon</strong> · <strong>Gemini 3.8 Flash</strong> · <strong>Gemini 3.5 Flash-Lite</strong></p>
          <div class="url-banner">https://fairpanel-401108022555.asia-northeast3.run.app</div>
          <div class="hero-chips" style="margin-top: 26px;">
            <span class="chip">Team: General_Leo (Myeongjae Sung)</span>
            <span class="chip">github.com/lucasung-debug/Fair_Panel</span>
          </div>
        </div>
      `,
    },
  ];
}

const MASTER_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Plus Jakarta Sans', 'Inter', sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .slide {
    width: 1920px;
    height: 1080px;
    padding: 72px 88px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
  }
  .slide.dark {
    background: radial-gradient(circle at 80% 15%, #161B33 0%, #070913 55%, #020308 100%);
    color: #F5F5F7;
  }
  .slide.light {
    background: linear-gradient(180deg, #F5F5F7 0%, #FFFFFF 100%);
    color: #1D1D1F;
  }
  .slide.center {
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 28px;
  }
  .aurora-ring {
    position: absolute;
    width: 1100px;
    height: 1100px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(41,151,255,0.22) 0%, rgba(175,82,222,0.18) 42%, rgba(255,45,85,0.10) 68%, transparent 78%);
    filter: blur(45px);
    z-index: 0;
  }
  .slide > * { position: relative; z-index: 2; }
  .pill-tag {
    display: inline-block;
    padding: 10px 24px;
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.18);
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #7DD3FC;
  }
  .hero-title {
    font-size: 86px;
    font-weight: 800;
    line-height: 1.06;
    letter-spacing: -0.035em;
    color: #FFFFFF;
  }
  .apple-grad {
    background: linear-gradient(92deg, #2997FF 0%, #AF52DE 48%, #FF2D55 82%, #FF9500 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .hero-sub {
    font-size: 32px;
    line-height: 1.42;
    font-weight: 500;
    color: #CBD5E1;
    max-width: 1240px;
  }
  .hero-sub strong { color: #FFFFFF; font-weight: 700; }
  .hero-chips {
    display: flex;
    gap: 18px;
    margin-top: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .chip {
    padding: 14px 28px;
    border-radius: 999px;
    background: rgba(255,255,255,0.09);
    border: 1px solid rgba(255,255,255,0.2);
    font-size: 22px;
    font-weight: 700;
    color: #F8FAFC;
  }
  .chip.green {
    background: rgba(16, 185, 129, 0.22);
    border-color: rgba(52, 211, 153, 0.55);
    color: #6EE7B7;
  }
  .url-banner {
    margin-top: 12px;
    padding: 18px 42px;
    border-radius: 20px;
    background: linear-gradient(90deg, rgba(41,151,255,0.22), rgba(175,82,222,0.22));
    border: 2px solid rgba(125,211,252,0.5);
    font-size: 30px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.01em;
  }
  .section-header {
    margin-bottom: 36px;
  }
  .kicker {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: 0.14em;
    color: #38BDF8;
    margin-bottom: 14px;
  }
  .dark-kicker { color: #0066CC; }
  .section-title {
    font-size: 66px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.08;
  }
  .dark-text { color: #1D1D1F !important; }
  .dark-sub { color: #424245 !important; }
  .bento-3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    flex: 1;
  }
  .bento-card {
    background: rgba(255, 255, 255, 0.055);
    border: 1.5px solid rgba(255, 255, 255, 0.15);
    border-radius: 32px;
    padding: 44px 40px;
    display: flex;
    flex-direction: column;
    gap: 22px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.45);
  }
  .bento-card.red-glow { border-color: rgba(244, 63, 94, 0.55); background: linear-gradient(180deg, rgba(244,63,94,0.12) 0%, rgba(15,23,42,0.7) 100%); }
  .bento-card.amber-glow { border-color: rgba(245, 158, 11, 0.55); background: linear-gradient(180deg, rgba(245,158,11,0.12) 0%, rgba(15,23,42,0.7) 100%); }
  .bento-card.blue-glow { border-color: rgba(56, 189, 248, 0.55); background: linear-gradient(180deg, rgba(56,189,248,0.12) 0%, rgba(15,23,42,0.7) 100%); }
  .card-num {
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.12em;
    color: #94A3B8;
  }
  .bento-card h3 {
    font-size: 40px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.15;
  }
  .bento-card p {
    font-size: 25px;
    line-height: 1.48;
    color: #CBD5E1;
  }
  .statute-list {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .statute-list span {
    padding: 12px 18px;
    border-radius: 14px;
    background: rgba(255,255,255,0.08);
    font-size: 21px;
    font-weight: 700;
    color: #F8FAFC;
  }
  .light-card {
    background: #FFFFFF;
    border: 1.5px solid #E5E5EA;
    box-shadow: 0 20px 50px rgba(0,0,0,0.07);
    color: #1D1D1F;
  }
  .light-card.hero-border {
    border: 3px solid #2997FF;
    box-shadow: 0 24px 60px rgba(41, 151, 255, 0.16);
  }
  .light-card h3 { color: #1D1D1F; }
  .light-card p { color: #424245; font-size: 25px; }
  .model-pill {
    align-self: flex-start;
    padding: 10px 20px;
    border-radius: 999px;
    font-size: 19px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }
  .model-pill.argon { background: #EEF2FF; color: #4338CA; border: 1.5px solid #818CF8; }
  .model-pill.flash { background: #ECFDF5; color: #047857; border: 1.5px solid #34D399; }
  .model-pill.lite { background: #FFFBEB; color: #B45309; border: 1.5px solid #FBBF24; }
  .meta-row {
    margin-top: auto;
    padding-top: 18px;
    border-top: 1px solid #E5E5EA;
    font-size: 20px;
    font-weight: 700;
    color: #0066CC;
  }
  /* Split Showcase */
  .split-showcase {
    flex-direction: row;
    align-items: center;
    gap: 54px;
  }
  .showcase-left {
    width: 780px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .step-badge {
    align-self: flex-start;
    padding: 10px 22px;
    border-radius: 999px;
    background: rgba(56, 189, 248, 0.16);
    border: 1.5px solid rgba(56, 189, 248, 0.45);
    color: #7DD3FC;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.1em;
  }
  .step-badge.light-badge {
    background: #E8F2FF;
    border-color: #93C5FD;
    color: #0055B3;
  }
  .showcase-left h2 {
    font-size: 58px;
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.03em;
  }
  .callout-stack {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-top: 8px;
  }
  .callout-box {
    padding: 26px 30px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.07);
    border: 1.5px solid rgba(255, 255, 255, 0.18);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .callout-box.green-box {
    background: rgba(16, 185, 129, 0.14);
    border-color: rgba(52, 211, 153, 0.55);
  }
  .callout-box.red-box {
    background: rgba(244, 63, 94, 0.15);
    border-color: rgba(251, 113, 133, 0.6);
  }
  .callout-box.purple-box {
    background: rgba(168, 85, 247, 0.16);
    border-color: rgba(192, 132, 252, 0.55);
  }
  .callout-box.light-box {
    background: #FFFFFF;
    border: 1.5px solid #D2D2D7;
    box-shadow: 0 12px 32px rgba(0,0,0,0.06);
  }
  .callout-title {
    font-size: 27px;
    font-weight: 800;
    color: #FFFFFF;
  }
  .callout-quote {
    font-size: 23px;
    font-weight: 700;
    color: #FDE68A;
    line-height: 1.38;
  }
  .callout-desc {
    font-size: 23px;
    line-height: 1.42;
    color: #E2E8F0;
    font-weight: 500;
  }
  .showcase-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mac-window {
    width: 910px;
    border-radius: 24px;
    overflow: hidden;
    background: #0F172A;
    border: 2px solid rgba(255,255,255,0.24);
    box-shadow: 0 35px 90px rgba(0,0,0,0.65), 0 0 40px rgba(41,151,255,0.22);
  }
  .mac-window.dark-shadow {
    border: 2px solid #D2D2D7;
    box-shadow: 0 30px 80px rgba(0,0,0,0.18);
  }
  .mac-bar {
    height: 42px;
    background: #1E293B;
    display: flex;
    align-items: center;
    padding: 0 18px;
    gap: 9px;
  }
  .dot { width: 13px; height: 13px; border-radius: 50%; display: inline-block; }
  .dot.r { background: #FF5F56; }
  .dot.y { background: #FFBD2E; }
  .dot.g { background: #27C93F; }
  .mac-url {
    margin-left: 16px;
    font-size: 15px;
    font-weight: 600;
    color: #CBD5E1;
  }
  .mac-img {
    width: 100%;
    height: auto;
    display: block;
  }
`;

async function renderKeynoteSlides(cdp, scenes) {
  console.log('[2/4] Rendering 10 Apple Keynote 1920x1080 Master Slides at 2x Retina...');
  for (const sc of scenes) {
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>${MASTER_CSS}</style></head><body>${sc.html}</body></html>`;
    const htmlPath = path.join(OUT_DIR, `${sc.id}.html`);
    fs.writeFileSync(htmlPath, fullHtml, 'utf8');
    await cdp.send('Page.navigate', { url: `file:///${htmlPath.replace(/\\/g, '/')}` });
    await sleep(350);
    const { data } = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    });
    const pngPath = path.join(OUT_DIR, `${sc.id}.png`);
    fs.writeFileSync(pngPath, Buffer.from(data, 'base64'));
    console.log(`  -> Rendered ${sc.id}.png`);
  }
}

// ---------------------------------------------------------------------------
// 3. Clean Broadcast Audio Generator (Voiceover + Distortion-Free Warm Pad)
// ---------------------------------------------------------------------------
function generateCleanMusicBedWav(filePath, durationSec) {
  const sampleRate = 48000;
  const totalSamples = Math.floor(sampleRate * durationSec);
  const numChannels = 2;
  const bytesPerSample = 2;
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buf = Buffer.alloc(44 + dataSize);

  // WAV Header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buf.writeUInt16LE(numChannels * bytesPerSample, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);

  // Warm Apple Keynote chord progression (pure sine harmonics, low volume, zero clipping)
  const chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 349.23], // Fmaj7
    [196.00, 246.94, 293.66, 392.00], // G6
  ];

  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIdx = Math.floor(t / 5.5) % chords.length;
    const chord = chords[chordIdx];
    const localT = t % 5.5;

    // Smooth cosine envelope per chord change so there are ZERO clicks/pops
    const env = Math.sin(Math.min(1, localT / 0.8) * (Math.PI / 2)) *
                Math.sin(Math.min(1, (5.5 - localT) / 0.8) * (Math.PI / 2));

    // Gentle chime pluck at the start of each scene
    const chimeEnv = Math.exp(-localT * 3.2) * Math.min(1, localT / 0.02);
    const chimeFreq = chord[3] * 2;

    let sumL = 0;
    let sumR = 0;
    for (let k = 0; k < chord.length; k++) {
      const f = chord[k];
      const pan = k % 2 === 0 ? 0.85 : 1.15;
      const wave = Math.sin(2 * Math.PI * f * t) * 0.11 * env;
      sumL += wave * pan;
      sumR += wave * (2 - pan);
    }

    const chime = Math.sin(2 * Math.PI * chimeFreq * t) * 0.07 * chimeEnv;
    sumL += chime;
    sumR += chime;

    // Master fade-in & fade-out
    const masterFade = Math.min(1, t / 1.0) * Math.min(1, (durationSec - t) / 1.5);
    // Keep pad gentle (-18dB) so voiceover is crystal clear on top
    const finalL = Math.max(-0.9, Math.min(0.9, sumL * masterFade * 0.32));
    const finalR = Math.max(-0.9, Math.min(0.9, sumR * masterFade * 0.32));

    buf.writeInt16LE(Math.round(finalL * 32767), offset);
    buf.writeInt16LE(Math.round(finalR * 32767), offset + 2);
    offset += 4;
  }

  fs.writeFileSync(filePath, buf);
}

function buildAudioTrack(scenes) {
  console.log('[3/4] Generating clean English voiceover + Apple Keynote ambient soundtrack...');
  // Generate TTS WAVs via PowerShell SAPI
  const psLines = [
    'Add-Type -AssemblyName System.Speech',
    '$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    '$synth.SelectVoice("Microsoft Zira Desktop")',
    '$synth.Rate = 0',
    '$synth.Volume = 100',
  ];

  for (const sc of scenes) {
    const wavPath = path.join(OUT_DIR, `vo_${sc.id}.wav`).replace(/\\/g, '/');
    const safeText = sc.narration.replace(/"/g, '`"');
    psLines.push(`$synth.SetOutputToWaveFile("${wavPath}")`);
    psLines.push(`$synth.Speak("${safeText}")`);
  }
  psLines.push('$synth.Dispose()');

  const psFile = path.join(OUT_DIR, 'gen_vo.ps1');
  fs.writeFileSync(psFile, psLines.join('\r\n'), 'utf8');
  execSync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`, { stdio: 'inherit' });

  // Measure each VO duration and pad to scene duration
  let totalDuration = 0;
  const sceneVideoPaths = [];

  for (const sc of scenes) {
    const voWav = path.join(OUT_DIR, `vo_${sc.id}.wav`);
    // Probe VO duration
    const probeOut = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${voWav}"`
    ).toString().trim();
    const voDur = parseFloat(probeOut) || sc.duration;
    // Give each scene at least sc.duration or voDur + 0.65s breathing room
    sc.actualDuration = Math.max(sc.duration, Number((voDur + 0.65).toFixed(2)));
    totalDuration += sc.actualDuration;
  }

  const bgmWav = path.join(OUT_DIR, 'apple_bgm.wav');
  generateCleanMusicBedWav(bgmWav, totalDuration + 2);

  // Render each scene into an individual MP4 segment with subtle Apple zoom + clean VO audio
  console.log('[4/4] Encoding 10 Apple Keynote 1080p segments and assembling final MP4...');
  for (const sc of scenes) {
    const imgPath = path.join(OUT_DIR, `${sc.id}.png`);
    const voWav = path.join(OUT_DIR, `vo_${sc.id}.wav`);
    const segMp4 = path.join(OUT_DIR, `seg_${sc.id}.mp4`);
    const frames = Math.round(sc.actualDuration * 30);

    // Downscale 3840x2160 Retina screenshot cleanly to 1920x1080 with subtle fade in/out
    const fadeOutStart = Math.max(0, sc.actualDuration - 0.35).toFixed(2);
    const cmd = [
      'ffmpeg -y',
      `-loop 1 -framerate 30 -t ${sc.actualDuration} -i "${imgPath}"`,
      `-i "${voWav}"`,
      `-filter_complex "[0:v]scale=1920:1080:flags=lanczos,setsar=1,fade=t=in:st=0:d=0.30,fade=t=out:st=${fadeOutStart}:d=0.35,format=yuv420p[v];[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,adelay=200|200,apad=whole_dur=${sc.actualDuration}[a]"`,
      '-map "[v]" -map "[a]"',
      '-c:v libx264 -preset fast -crf 14 -r 30',
      '-c:a pcm_s16le -ar 48000 -ac 2',
      `"${segMp4}"`,
    ].join(' ');
    execSync(cmd, { stdio: 'ignore' });
    sceneVideoPaths.push(segMp4);
    console.log(`  -> Encoded segment ${sc.id} (${sc.actualDuration}s)`);
  }

  // Concat segments
  const concatTxt = path.join(OUT_DIR, 'concat.txt');
  fs.writeFileSync(
    concatTxt,
    sceneVideoPaths.map((p) => `file '${p.replace(/\\/g, '/')}'`).join('\n'),
    'utf8'
  );

  const rawConcatMp4 = path.join(OUT_DIR, 'concat_vo.mp4');
  execSync(`ffmpeg -y -f concat -safe 0 -i "${concatTxt}" -c copy "${rawConcatMp4}"`, { stdio: 'ignore' });

  // Mix VO track with warm Apple BGM at 192kbps Stereo 48kHz AAC
  const desktopFilm1 = path.join(os.homedir(), 'Desktop', 'FairPanel_Argon_Brand_Film.mp4');
  const desktopFilm2 = path.join(os.homedir(), 'Desktop', 'FairPanel_Apple_Keynote_Film.mp4');
  const repoFilm = path.resolve('fairpanel_demo.mp4');

  const mixCmd = [
    'ffmpeg -y',
    `-i "${rawConcatMp4}"`,
    `-i "${bgmWav}"`,
    `-filter_complex "[0:a]volume=2.6[vo];[1:a]volume=0.85[bgm];[vo][bgm]amix=inputs=2:duration=first:dropout_transition=2,loudnorm=I=-14:TP=-1.2:LRA=7[aout]"`,
    '-map 0:v -map "[aout]"',
    '-c:v copy',
    '-c:a aac -b:a 192k -ar 48000 -ac 2',
    '-movflags +faststart',
    `"${desktopFilm1}"`,
  ].join(' ');
  execSync(mixCmd, { stdio: 'inherit' });

  fs.copyFileSync(desktopFilm1, desktopFilm2);
  fs.copyFileSync(desktopFilm1, repoFilm);
  console.log(`\nDONE! Saved Apple Keynote Film to:\n  1. ${desktopFilm1}\n  2. ${desktopFilm2}`);
}

async function main() {
  // Start local FairPanel server on PORT 3099
  const srv = spawn('npx', ['tsx', 'server.ts'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'ignore',
    shell: true,
  });

  // Launch headless Chrome
  const userDataDir = path.join(OUT_DIR, 'chrome_profile');
  const chrome = spawn(
    CHROME_PATH,
    [
      '--headless=new',
      '--remote-debugging-port=9233',
      '--window-size=1920,1080',
      '--hide-scrollbars',
      '--disable-gpu',
      '--no-first-run',
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' }
  );

  try {
    await sleep(2200);
    const targetsRes = await fetch('http://127.0.0.1:9233/json/list');
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page');
    if (!pageTarget) throw new Error('No headless Chrome page target found');

    const cdp = new CDP(pageTarget.webSocketDebuggerUrl);
    await cdp.ready();

    await captureAppScreenshots(cdp);
    const scenes = buildScenes();
    await renderKeynoteSlides(cdp, scenes);
    cdp.close();

    buildAudioTrack(scenes);
  } finally {
    try { chrome.kill(); } catch {}
    try { srv.kill(); } catch {}
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
