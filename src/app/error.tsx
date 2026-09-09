'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, Trash2 } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to client console for diagnostics
    console.error('TimeBank of India - Client Exception caught:', error);
  }, [error]);

  const handleClearCacheAndReset = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tbi_user');
        localStorage.removeItem('tbi_is_authenticated');
        localStorage.removeItem('tbi_request_sync');
      }
    } catch (e) {}
    window.location.href = '/';
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Workspace State Restored
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            A temporary client cache mismatch was caught and safeguarded. You can reload the current view or reset local session state safely.
          </p>
          {error?.message && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 text-[11px] font-mono text-slate-600 dark:text-slate-300 text-left overflow-x-auto border border-slate-200 dark:border-slate-800">
              {error.message}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow flex items-center justify-center gap-2 transition-all hover:scale-105"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <button
            onClick={handleClearCacheAndReset}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Reset Cache & Go Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
