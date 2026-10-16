import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, FileCheck2 } from 'lucide-react';
import { EvalRunSummary, EvalItemResult } from '../types';
import { LAW_MAP } from '../data/laws';
import { runGoldenTestsetDeterministic, runDemoScenarioTestsetDeterministic } from '../utils/checks';

interface EvalModalProps {
  isOpen: boolean;
  onClose: () => void;
  evalSummary: EvalRunSummary;
  isRunning: boolean;
  onRerunEval: () => void;
}

export const EvalModal: React.FC<EvalModalProps> = ({
  isOpen,
  onClose,
  evalSummary,
  isRunning,
  onRerunEval,
}) => {
  const [activeTab, setActiveTab] = useState<'demo_s20' | 'fixed_b20'>('demo_s20');
  const [demoSummary, setDemoSummary] = useState<EvalRunSummary>(() =>
    runDemoScenarioTestsetDeterministic()
  );

  if (!isOpen) return null;

  // Use evalSummary for fixed_b20 if suiteId matches or fallback to deterministic runner
  const currentFixedSummary =
    evalSummary.suiteId === 'fixed_b20' || evalSummary.total === 20
      ? evalSummary
      : runGoldenTestsetDeterministic();

  const handleRerunCurrent = () => {
    if (activeTab === 'fixed_b20') {
      onRerunEval();
    } else {
      setDemoSummary(runDemoScenarioTestsetDeterministic());
    }
  };

  const currentSummary = activeTab === 'demo_s20' ? demoSummary : currentFixedSummary;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="eval-modal-title"
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2
              id="eval-modal-title"
              className="text-lg font-bold text-slate-950 font-display flex items-center gap-2"
            >
              <span>FairPanel Dual Benchmark Verification Loop</span>
              <span className="text-xs px-2 py-0.5 rounded font-mono font-semibold bg-indigo-950 text-white">
                PASS {currentSummary.passed}/{currentSummary.total}
              </span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Strictly separated evaluation suites: Live Demo 20 (S01–S20) &amp; Fixed Benchmark 20 (B01–B20)
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleRerunCurrent}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning
                ? 'Running Verification...'
                : activeTab === 'demo_s20'
                ? 'Re-Run Live Demo 20 (S01–S20)'
                : 'Re-Run Fixed Benchmark 20 (B01–B20)'}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Benchmark Modal"
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Suite Tabs (Dual Benchmarks) */}
        <div className="flex items-center gap-4 px-6 border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('demo_s20')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'demo_s20'
                ? 'border-indigo-950 text-indigo-950'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Tab 1: Live Demo 20-Question Set (S01–S20)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800">
              {demoSummary.passed}/{demoSummary.total} PASS
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fixed_b20')}
            className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'fixed_b20'
                ? 'border-indigo-950 text-indigo-950'
                : 'border-transparent text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Tab 2: Fixed Benchmark 20-Question Set (B01–B20)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-800">
              {currentFixedSummary.passed}/{currentFixedSummary.total} PASS
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 flex-1 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
            <div>
              <strong className="text-slate-900">
                {activeTab === 'demo_s20' ? 'Live Demo 20 (S01–S20):' : 'Fixed Benchmark 20 (B01–B20):'}
              </strong>{' '}
              {activeTab === 'demo_s20'
                ? 'Evaluates safe context exceptions (S03 Maternity Leave HR Data, S05 Unique Key Value), quality defects (S06 Compound, S07 Leading), caution privacy (S11 Team Drinking [lawRefs: []], S12 Weekend Plans), and high risks (S13–S20).'
                : 'Evaluates 10 High-Risk discriminatory questions (B01–B10) vs 10 Job-Related behavioral questions (B11–B20) from original testset.'}
            </div>
            <div className="font-mono text-slate-700 tabular-nums">
              Last Verified: {new Date(currentSummary.ranAt).toLocaleTimeString('en-US')}
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                  <th className="py-2.5 px-3 w-12 text-center tabular-nums">Code</th>
                  <th className="py-2.5 px-3">Question &amp; Candidate Boundary Guide</th>
                  <th className="py-2.5 px-3 w-20">Risk Level</th>
                  <th className="py-2.5 px-3 w-28">Quality / Status</th>
                  <th className="py-2.5 px-3 w-20">Match</th>
                  <th className="py-2.5 px-3">Statutory Basis / Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {currentSummary.results.map((item: EvalItemResult) => {
                  const lawNames = (item.lawRefs || [])
                    .map((id) => LAW_MAP[id]?.shortName || id)
                    .join(' · ');

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700 tabular-nums">
                        {item.code || `#${item.id}`}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-900">{item.question}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{item.questionEn}</div>
                        {item.candidateBoundaryGuide && (
                          <div className="mt-1 text-[11px] text-indigo-900 bg-indigo-50/70 border border-indigo-100 rounded px-2 py-1">
                            <span className="font-semibold">Candidate Guide: </span>
                            {item.candidateBoundaryGuide}
                          </div>
                        )}
                        {item.alternativeQuestion && (
                          <div className="mt-1 text-[11px] text-emerald-800 bg-emerald-50/70 border border-emerald-100 rounded px-2 py-0.5">
                            <span className="font-semibold">Alternative: </span>
                            &ldquo;{item.alternativeQuestion}&rdquo;
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono uppercase tabular-nums">
                        <div className="text-[10px] text-slate-400">Exp: {item.expected}</div>
                        <div
                          className={`font-semibold ${
                            item.got === 'high'
                              ? 'text-rose-700'
                              : item.got === 'caution'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          Got: {item.got}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[11px]">
                        {item.gotQuality && item.gotQuality !== 'ok' ? (
                          <span className="px-1.5 py-0.5 rounded font-medium bg-amber-100 text-amber-900">
                            {item.gotQuality === 'compound'
                              ? 'Compound Question'
                              : item.gotQuality === 'leading'
                              ? 'Leading Question'
                              : 'Vague Question'}
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-700">
                            Standard
                          </span>
                        )}
                        {item.candidateBadge && (
                          <div className="mt-1 text-[10px] text-slate-500 font-mono">
                            {item.candidateBadge}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {item.match ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            PASS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            FAIL
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="font-medium text-slate-800">{item.categoryLabel}</div>
                        {lawNames ? (
                          <div className="font-mono text-slate-500 text-[11px] mt-0.5">
                            {lawNames}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[10px]">
                            Job-Irrelevant Private Life · No Direct Statutory Match (lawRefs: [])
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
          <span>
            Strict Statutory Honesty: Live Demo 20 and Fixed Benchmark 20 are evaluated independently (Never combined into a fake 40/40 badge).
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
