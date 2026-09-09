'use client';

import React from 'react';
import { 
  X, Check, Clock, Calendar, Coins, BookOpen, 
  ShieldCheck, AlertCircle, Sparkles, UserCheck 
} from 'lucide-react';

interface RequestReviewModalProps {
  request: any | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (requestId: string) => Promise<void> | void;
  onDecline: (requestId: string) => Promise<void> | void;
  isProcessing?: boolean;
}

export default function RequestReviewModal({
  request,
  isOpen,
  onClose,
  onAccept,
  onDecline,
  isProcessing = false,
}: RequestReviewModalProps) {
  if (!isOpen || !request) return null;

  const deadline = request.response_deadline ? new Date(request.response_deadline).getTime() : 0;
  const now = Date.now();
  const remainingHours = Math.max(0, Math.floor((deadline - now) / (1000 * 3600)));
  const remainingMins = Math.max(0, Math.floor(((deadline - now) % (1000 * 3600)) / (1000 * 60)));

  const outcomes = request.expected_outcome
    ? request.expected_outcome.split('\n').filter((s: string) => s.trim().length > 0)
    : [
        'Master foundational concepts and practical implementation.',
        'Complete interactive hands-on exercises together.',
        'Resolve questions and clarify doubt points in live code or workflow.',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Review Session Request & Goal Contract
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect learner goals and session timings before accepting or declining
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Learner Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={request.learner_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt={request.learner_name}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-orange-400 shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {request.learner_name}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Verified Learner
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Requesting 1-on-1 mentorship for <strong className="text-orange-600 dark:text-orange-400">{request.skill_name}</strong>
                </p>
              </div>
            </div>

            {/* 24h Deadline pill */}
            <div className="text-right shrink-0">
              <div className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{remainingHours}h {remainingMins}m left</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">24h auto-expiry rule</span>
            </div>
          </div>

          {/* Session Timings & Credit Economics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/60 space-y-1">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 text-xs font-bold">
                <Calendar className="w-4 h-4" />
                <span>Proposed Session Timings</span>
              </div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                📅 {request.preferred_date || 'Flexible Date'}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                ⏰ Slot: {request.preferred_time || '6:00 PM - 7:00 PM'} ({request.duration} mins)
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <Coins className="w-4 h-4" />
                <span>Compensation & Time Credits</span>
              </div>
              <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                +{Number(request.credit_cost || 1).toFixed(2)} Time Credit
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Held in escrow; credited automatically to your wallet on completion.
              </p>
            </div>
          </div>

          {/* Learning Goal Contract */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-orange-500" />
                <span>Learning Goal Contract</span>
              </label>
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                Agreed Objective
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium leading-relaxed italic">
              &quot;{request.learning_goal}&quot;
            </div>
          </div>

          {/* Expected Outcomes Checklist */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Expected Deliverables & Outcomes</span>
            </label>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700/60">
              {outcomes.map((item: string, idx: number) => (
                <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification / Security note */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-2.5 text-[11px] text-blue-800 dark:text-blue-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              By accepting this request, a live session room will be scheduled for your mutual calendar. You can enter the live classroom and start the session at any time.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel / Close
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={() => onDecline(request.id)}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Decline Request</span>
            </button>

            <button
              onClick={() => onAccept(request.id)}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-black shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isProcessing ? 'Scheduling...' : 'Accept & Schedule Session ✓'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
