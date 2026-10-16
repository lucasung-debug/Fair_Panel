import React from 'react';
import { EvalRunSummary, WorkspaceRole } from '../types';

interface TopNavProps {
  activeRole: WorkspaceRole;
  onSelectRole: (role: WorkspaceRole) => void;
  evalSummary: EvalRunSummary;
  onOpenEvalModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeRole,
  onSelectRole,
  evalSummary,
  onOpenEvalModal,
}) => {
  const navItems: { id: WorkspaceRole; label: string }[] = [
    { id: 'interviewer', label: 'Interviewer Desk' },
    { id: 'admin', label: 'HR Fit & Control' },
    { id: 'interviewee', label: 'Candidate View' },
    { id: 'report', label: 'Audit Report' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onSelectRole('interviewer');
        }}
        className="text-lg font-bold tracking-tight text-slate-950 font-display whitespace-nowrap shrink-0"
      >
        FairPanel
      </a>

      {/* Zone 2: 4 concise single-line text navigation links */}
      <nav
        aria-label="Primary Workspace Navigation"
        className="flex items-center gap-6 text-sm font-medium text-slate-600 overflow-x-auto"
      >
        {navItems.map((item) => {
          const isActive = activeRole === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectRole(item.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                isActive
                  ? 'border-indigo-950 text-slate-950 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-950 hover:border-slate-300'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <a
          href="/api/download-zip"
          download="fairpanel-source.zip"
          className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
          title="Download complete project ZIP file directly (bypasses 403 Forbidden)"
        >
          <svg className="w-3.5 h-3.5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download ZIP
        </a>

        <button
          type="button"
          onClick={onOpenEvalModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-950 rounded-lg hover:bg-indigo-900 transition-colors whitespace-nowrap shrink-0 tabular-nums"
        >
          Judge Eval {evalSummary.passed}/{evalSummary.total} PASS
        </button>
      </div>
    </header>
  );
};
