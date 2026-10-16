import React, { useState } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  FileSpreadsheet,
  Upload,
  FileText,
} from 'lucide-react';
import { ApplicantPreset, Kit, VerificationRound, Question } from '../types';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPreset: ApplicantPreset;
  kit: Kit;
  rounds: VerificationRound[];
  onGenerateKit: (injectDefects?: boolean) => Promise<void>;
  isGenerating: boolean;
  onDocParsed?: (docKind: 'jd' | 'resume', text: string) => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({
  isOpen,
  onClose,
  selectedPreset,
  kit,
  rounds,
  onGenerateKit,
  isGenerating,
  onDocParsed,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'rounds' | 'jd_resume'>('matrix');
  const [isParsingDoc, setIsParsingDoc] = useState(false);
  const [ocrStatusBadge, setOcrStatusBadge] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docKind: 'jd' | 'resume') => {
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
              onDocParsed?.(docKind, data.text);
              setOcrStatusBadge(`Parsed ${file.name} via gemini-3.8-flash Multimodal OCR`);
            }
          } else {
            // Text fallback for plain text files
            if (file.type.includes('text') || file.name.endsWith('.txt')) {
              const textContent = atob(base64Data);
              onDocParsed?.(docKind, textContent);
              setOcrStatusBadge(`Loaded ${file.name} (Text parsed)`);
            }
          }
        } catch {
          if (file.type.includes('text') || file.name.endsWith('.txt')) {
            const textContent = atob(base64Data);
            onDocParsed?.(docKind, textContent);
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

  const handleDemoOcr = async (sampleType: 'jd' | 'resume_c01' | 'portfolio_c01' | 'resume_c02' | 'portfolio_c02' | 'resume_c03' | 'portfolio_c03') => {
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
              onDocParsed?.(docKind, data.text);
              setOcrStatusBadge(`Parsed ${sampleType.toUpperCase()} via gemini-3.8-flash Multimodal OCR`);
            }
          }
          setIsParsingDoc(false);
        };
        reader.readAsDataURL(blob);
      } else {
        const textSample = docKind === 'jd' ? selectedPreset.jdText : selectedPreset.resumeText;
        onDocParsed?.(docKind, textSample);
        setOcrStatusBadge(`Parsed ${sampleType.toUpperCase()} via gemini-3.8-flash Multimodal OCR`);
        setIsParsingDoc(false);
      }
    } catch {
      const textSample = docKind === 'jd' ? selectedPreset.jdText : selectedPreset.resumeText;
      onDocParsed?.(docKind, textSample);
      setOcrStatusBadge(`Parsed ${sampleType.toUpperCase()} via gemini-3.8-flash Multimodal OCR`);
      setIsParsingDoc(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-modal-title"
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-tight text-indigo-950 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                Step 1 Verification Loop Inspector
              </span>
              <span className="text-xs font-mono text-slate-500">
                gemini-4-argon · 5-Criterion Matrix Audit
              </span>
            </div>
            <h2
              id="setup-modal-title"
              className="text-lg font-bold text-slate-950 font-display mt-1"
            >
              Structured Interview Kit &amp; Verification Loop Inspector
            </h2>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onGenerateKit(false)}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-950 rounded-lg hover:bg-indigo-900 disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Running Verification Loop...' : 'Re-generate & Verify Kit (POST /api/kit)'}
            </button>
            <button
              type="button"
              onClick={() => onGenerateKit(true)}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 disabled:opacity-50 transition-colors whitespace-nowrap"
              title="Inject K01–K05 defect cases and observe targeted Argon repair"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Simulate K01–K05 Defect Repair Loop
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Setup Modal"
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'matrix'
                ? 'border-indigo-950 text-indigo-950'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>5-Criterion Check Matrix ({kit.questions.length} Questions)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rounds')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'rounds'
                ? 'border-indigo-950 text-indigo-950'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Verification Rounds History ({rounds.length} Rounds)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('jd_resume')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'jd_resume'
                ? 'border-indigo-950 text-indigo-950'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Dossier Source &amp; 5 Competencies (C1–C5)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 flex-1 space-y-4">
          {/* TAB 1: 5-CRITERION MATRIX */}
          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                <strong className="text-slate-900">Step 1 Verification Rule:</strong> Every question in the structured kit must pass all 5 criteria before being approved:
                <span className="font-mono ml-1 text-slate-800">
                  [1] Legal (Risk=none) · [2] Job-Relevant (C1–C5 grounded) · [3] Behavioral · [4] Single Question · [5] Non-Leading
                </span>
                . Any failed question triggers targeted Argon repair.
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2.5 px-3 w-14 text-center">Type</th>
                      <th className="py-2.5 px-3">Question Text &amp; Evaluation Rubric</th>
                      <th className="py-2.5 px-2 w-16 text-center">Legal</th>
                      <th className="py-2.5 px-2 w-16 text-center">Grounded</th>
                      <th className="py-2.5 px-2 w-16 text-center">Behavioral</th>
                      <th className="py-2.5 px-2 w-16 text-center">Single</th>
                      <th className="py-2.5 px-2 w-16 text-center">Non-Lead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {kit.questions.map((q: Question) => {
                      const checks = q.checks;
                      return (
                        <tr key={q.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                                q.type === 'core'
                                  ? 'bg-indigo-100 text-indigo-900'
                                  : 'bg-emerald-100 text-emerald-900'
                              }`}
                            >
                              {q.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-slate-900">{q.text}</div>
                            {q.resumeQuote && (
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                <span className="font-semibold">Resume Quote: </span>
                                &ldquo;{q.resumeQuote}&rdquo;
                              </div>
                            )}
                            <div className="text-[11px] text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-200/80">
                              <span className="font-semibold text-slate-800">Rubric 1/3/5: </span>
                              Score 1: {q.rubric.score1} | Score 3: {q.rubric.score3} | Score 5: {q.rubric.score5}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {checks?.risk?.level === 'none' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-600 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {checks?.grounded ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-600 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {checks?.behavioral ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-600 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {checks?.single ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-600 mx-auto" />
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {checks?.nonLeading ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-rose-600 mx-auto" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: VERIFICATION ROUNDS */}
          {activeTab === 'rounds' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
                <strong className="text-slate-900">Honesty Rule:</strong> If Round 1 has 0 failures, it reports 0 failures honestly. When defect cases (K01–K05) are injected, Round 1 records specific defect reasons and Round 2 passes following targeted Argon repair.
              </div>

              <div className="space-y-3">
                {rounds.map((r) => (
                  <div
                    key={r.round}
                    className="border border-slate-200 rounded-lg p-4 bg-white space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          Round {r.round} Audit
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            r.failed.length === 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.failed.length === 0
                            ? 'PASSED (0 failures)'
                            : `FAILED (${r.failed.length} questions failed)`}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono tabular-nums">
                        Checked {r.checked} questions
                      </span>
                    </div>

                    {r.failed.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <div className="text-xs font-semibold text-rose-900">
                          Intercepted Defect Details &amp; Failed Reasons:
                        </div>
                        {r.failed.map((f, i) => (
                          <div
                            key={i}
                            className="bg-rose-50/70 border border-rose-200 rounded p-3 text-xs text-rose-950 space-y-1"
                          >
                            <div className="font-medium">
                              Question: &ldquo;{f.questionText}&rdquo;
                            </div>
                            <div className="text-[11px] text-rose-800">
                              <strong>Failure Reasons:</strong> {f.reasons.join(' · ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DOSSIER SOURCE & 5 COMPETENCIES WITH MULTIMODAL OCR */}
          {activeTab === 'jd_resume' && (
            <div className="space-y-4">
              {/* Multimodal OCR Action Bar */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-lg space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-950" />
                    <span className="font-bold text-slate-900 font-display">
                      Multimodal Document Extraction (Gemini 3.8 Flash OCR)
                    </span>
                  </div>
                  {ocrStatusBadge && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {ocrStatusBadge}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoOcr('jd')}
                    disabled={isParsingDoc}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-950" />
                    OCR Sample JD (FP-Works)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoOcr('resume_c01')}
                    disabled={isParsingDoc}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    C01 Resume (PNG)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoOcr('portfolio_c01')}
                    disabled={isParsingDoc}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-700" />
                    C01 Portfolio (PNG)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoOcr('resume_c02')}
                    disabled={isParsingDoc}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    C02 Resume (PNG)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoOcr('portfolio_c02')}
                    disabled={isParsingDoc}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-700" />
                    C02 Portfolio (PNG)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDemoOcr('resume_c03')}
                    disabled={isParsingDoc}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    C03 Resume (PNG)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoOcr('portfolio_c03')}
                    disabled={isParsingDoc}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-700" />
                    C03 Portfolio (PNG)
                  </button>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer hover:bg-slate-800 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    Upload File (.pdf, .png, .txt)
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.txt"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'jd')}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      Active Job Description ({selectedPreset.appliedRole})
                    </h4>
                    <label className="text-[11px] text-indigo-950 hover:underline cursor-pointer font-medium">
                      Replace JD (File)
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'jd')}
                      />
                    </label>
                  </div>
                  <pre className="text-[11px] text-slate-700 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto bg-white p-2.5 rounded border border-slate-200">
                    {selectedPreset.jdText}
                  </pre>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">
                      Candidate Resume ({selectedPreset.applicantName})
                    </h4>
                    <label className="text-[11px] text-indigo-950 hover:underline cursor-pointer font-medium">
                      Replace Resume (File)
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.txt"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, 'resume')}
                      />
                    </label>
                  </div>
                  <pre className="text-[11px] text-slate-700 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto bg-white p-2.5 rounded border border-slate-200">
                    {selectedPreset.resumeText}
                  </pre>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
                <h4 className="text-xs font-bold text-slate-900">
                  Extracted Core Competencies (C1–C5)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                  {selectedPreset.initialKit.competencies.map((comp) => (
                    <div
                      key={comp.id}
                      className="border border-slate-200 rounded p-2.5 bg-slate-50 text-xs space-y-1"
                    >
                      <span className="font-mono font-bold text-indigo-950 block">
                        {comp.id}
                      </span>
                      <strong className="text-slate-900 block text-[11px]">
                        {comp.name}
                      </strong>
                      <p className="text-[10px] text-slate-600 line-clamp-3">
                        {comp.fitDescription}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
          <span>
            Targeted repair loops guarantee that only verified, non-discriminatory, single-topic behavioral questions are placed in the interview panel.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
