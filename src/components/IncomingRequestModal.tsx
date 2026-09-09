'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Check, X, Clock, Calendar, Coins, BookOpen, 
  Sparkles, UserCheck, ArrowRight, ShieldCheck 
} from 'lucide-react';

export default function IncomingRequestModal() {
  const { 
    incomingModalRequest, 
    setIncomingModalRequest, 
    acceptSessionRequest, 
    declineSessionRequest 
  } = useApp();

  const [isProcessing, setIsProcessing] = useState(false);

  if (!incomingModalRequest) return null;

  const deadline = incomingModalRequest.response_deadline 
    ? new Date(incomingModalRequest.response_deadline).getTime() 
    : Date.now() + 24 * 3600 * 1000;
  const now = Date.now();
  const diff = Math.max(0, deadline - now);
  const remainingHours = Math.floor(diff / (1000 * 3600));
  const remainingMins = Math.floor((diff % (1000 * 3600)) / (1000 * 60));

  const handleAccept = async () => {
    try {
      setIsProcessing(true);
      const res = await acceptSessionRequest(incomingModalRequest.id);
      if (res.success) {
        setIncomingModalRequest(null);
      } else {
        alert(res.error || 'Failed to accept session request');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsProcessing(true);
      await declineSessionRequest(incomingModalRequest.id);
      setIncomingModalRequest(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    if (incomingModalRequest?.id && typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`tbi_dismissed_req_${incomingModalRequest.id}`, 'true');
      } catch (e) {}
    }
    setIncomingModalRequest(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border-2 border-orange-500/50 dark:border-orange-500/40 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing Top Banner */}
        <div className="h-2.5 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="p-6 pb-4 flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0 animate-pulse">
              <UserCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                ⚡ New Incoming Request
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                A Learner Wants to Learn From You!
              </h2>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close / Review Later"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Learner & Skill Info Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={incomingModalRequest.learner_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'}
                alt={incomingModalRequest.learner_name || 'Learner'}
                className="w-13 h-13 rounded-2xl object-cover border-2 border-orange-400 shadow-sm shrink-0"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {incomingModalRequest.learner_name || 'Learner'}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Requested Topic: <strong className="text-orange-600 dark:text-orange-400 font-bold">{incomingModalRequest.skill_name || 'Skill Exchange'}</strong>
                </p>
              </div>
            </div>

            {/* 24-hr countdown pill */}
            <div className="text-right shrink-0">
              <div className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5 shadow-sm">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>{remainingHours}h {remainingMins}m left</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-1">24h response rule</span>
            </div>
          </div>

          {/* Session Timing & Credit Compensation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/60 space-y-1">
              <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-300 text-xs font-bold">
                <Calendar className="w-3.5 h-3.5" />
                <span>Proposed Time</span>
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                📅 {incomingModalRequest.preferred_date || 'Flexible'} • {incomingModalRequest.preferred_time || '6:00 PM - 7:00 PM'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Duration: {incomingModalRequest.duration || 60} mins
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                <Coins className="w-3.5 h-3.5" />
                <span>You Will Earn</span>
              </div>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                +{Number(incomingModalRequest.credit_cost || 1).toFixed(2)} Time Credit
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Escrow guaranteed on session completion
              </p>
            </div>
          </div>

          {/* Learning Goal Contract */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-orange-500" />
              <span>Learner&apos;s Target Goal</span>
            </label>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium italic leading-relaxed">
              &quot;{incomingModalRequest.learning_goal || 'Understand core fundamentals and hands-on implementation.'}&quot;
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleDismiss}
            disabled={isProcessing}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Review Later
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={handleDecline}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              <span>Decline</span>
            </button>

            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 hover:from-emerald-700 hover:to-green-700 text-white text-xs font-black shadow-lg hover:shadow-emerald-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isProcessing ? 'Accepting...' : 'Accept & Schedule Session Now ✓'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
