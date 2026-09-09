'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { Check, X, Clock, Sparkles, UserCheck, AlertCircle, ArrowRight } from 'lucide-react';

export default function IncomingRequestBanner() {
  const { currentUser, pendingIncomingRequests, acceptSessionRequest, declineSessionRequest } = useApp();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  if (!pendingIncomingRequests || pendingIncomingRequests.length === 0) {
    return null;
  }

  // Ensure current index is within range
  const safeIndex = Math.min(currentIndex, pendingIncomingRequests.length - 1);
  const currentReq = pendingIncomingRequests[safeIndex];
  if (!currentReq) return null;

  const deadline = currentReq.response_deadline ? new Date(currentReq.response_deadline).getTime() : Date.now() + 24 * 3600 * 1000;
  const now = Date.now();
  const diff = Math.max(0, deadline - now);
  const remainingHours = Math.floor(diff / (1000 * 3600));
  const remainingMins = Math.floor((diff % (1000 * 3600)) / (1000 * 60));

  const handleAccept = async () => {
    setProcessingId(currentReq.id);
    const res = await acceptSessionRequest(currentReq.id);
    setProcessingId(null);
    if (res.success) {
      setStatusFeedback(res.message || 'Session Accepted! Live classroom created.');
      setTimeout(() => setStatusFeedback(null), 4000);
    } else {
      alert(res.error || 'Failed to accept session');
    }
  };

  const handleDecline = async () => {
    setProcessingId(currentReq.id);
    const res = await declineSessionRequest(currentReq.id);
    setProcessingId(null);
    if (res.success) {
      setStatusFeedback('Session request declined.');
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  };

  return (
    <div className="sticky top-16 z-40 w-full px-4 sm:px-6 lg:px-8 py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-emerald-600 text-white shadow-lg animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* Left: Requester & Skill Info */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img
              src={currentReq.learner_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'}
              alt={currentReq.learner_name || 'Learner'}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 text-[9px] text-emerald-950 font-black animate-ping" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 text-[9px] text-emerald-950 font-black">
              1
            </span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-white text-sm">
                ⚡ Incoming Session Request!
              </span>
              <span className="bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full font-bold text-[10px] text-amber-200">
                {currentReq.skill_name || 'Skill Exchange'}
              </span>
              {pendingIncomingRequests.length > 1 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  ({safeIndex + 1} of {pendingIncomingRequests.length})
                </span>
              )}
            </div>
            <p className="text-white/90 text-xs line-clamp-1">
              <strong>{currentReq.learner_name || 'Learner'}</strong> wants to learn from you • {currentReq.duration || 60} mins (Earns +{currentReq.credit_cost || 1} Cr) • Goal: &quot;{currentReq.learning_goal || 'Learn fundamentals'}&quot;
            </p>
          </div>
        </div>

        {/* Right: 24h Countdown & Instant Accept / Decline Options */}
        <div className="flex items-center gap-2.5 self-end md:self-auto shrink-0 flex-wrap">
          {/* 24-hr countdown */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/25 text-amber-200 font-semibold text-[11px]">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            <span>{remainingHours}h {remainingMins}m left</span>
          </div>

          {/* Action: Immediate Accept */}
          <button
            onClick={handleAccept}
            disabled={processingId === currentReq.id}
            className="px-4 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 font-black shadow-md flex items-center gap-1.5 hover:scale-105 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{processingId === currentReq.id ? 'Accepting...' : 'Accept Session Now ✓'}</span>
          </button>

          {/* Action: Decline */}
          <button
            onClick={handleDecline}
            disabled={processingId === currentReq.id}
            className="px-3 py-2 rounded-xl bg-black/20 hover:bg-black/40 text-white font-semibold transition-colors disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            <span className="sr-only">Decline</span>
          </button>

          {/* Pager if multiple */}
          {pendingIncomingRequests.length > 1 && (
            <div className="flex items-center gap-1 pl-1">
              <button
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : pendingIncomingRequests.length - 1))}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"
                title="Previous Request"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev < pendingIncomingRequests.length - 1 ? prev + 1 : 0))}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"
                title="Next Request"
              >
                →
              </button>
            </div>
          )}

          <Link
            href="/dashboard"
            className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[11px] font-semibold"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>

      {statusFeedback && (
        <div className="max-w-7xl mx-auto mt-1 p-2 rounded-lg bg-emerald-900/90 text-white text-xs font-bold text-center">
          🎉 {statusFeedback}
        </div>
      )}
    </div>
  );
}
