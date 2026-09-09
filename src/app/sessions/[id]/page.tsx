'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Video, Mic, MicOff, VideoOff, Share2, Clock, CheckCircle2, 
  AlertTriangle, Star, Coins, ShieldAlert, ArrowLeft, Send, Sparkles, X,
  XCircle, AlertCircle, Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function LiveSessionRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const { currentUser, refreshUserData } = useApp();

  const [session, setSession] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Classroom media states
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [notes, setNotes] = useState('• Session initialized.\n• Reviewing Learning Goal Contract objectives.\n• Live code architecture walkthrough.');
  const [timerSeconds, setTimerSeconds] = useState(3600);
  const [timerActive, setTimerActive] = useState(true);

  // Goal Checklist state
  const [completedGoals, setCompletedGoals] = useState<Record<number, boolean>>({ 0: true });

  // Action modals
  const [transferResult, setTransferResult] = useState<any>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Session did not meet the agreed Learning Goal Contract');
  const [disputeDescription, setDisputeDescription] = useState('');

  // Cancellation modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('Personal Emergency');
  const [cancellationCustomReason, setCancellationCustomReason] = useState('');
  const [actualMinutesTaughtInput, setActualMinutesTaughtInput] = useState<number>(15);
  const [cancellationResult, setCancellationResult] = useState<any>(null);
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);

  const loadSession = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sessions/${sessionId}`);
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
        setReviews(data.reviews || []);
        setDispute(data.dispute);
        setTimerSeconds(data.session.duration * 60);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Live countdown timer
  useEffect(() => {
    let interval: any;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start Live Session Action
  const handleStartLiveSession = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'START_SESSION' }),
      });
      const data = await res.json();
      if (data.success) {
        setTimerActive(true);
        loadSession();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
      } else {
        alert(data.error || 'Failed to start session');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Cancel Session Early Action
  const handleCancelSession = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalReason = cancellationCustomReason.trim()
      ? `${cancellationReason}: ${cancellationCustomReason.trim()}`
      : cancellationReason;

    try {
      setIsSubmittingCancellation(true);
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CANCEL_SESSION',
          cancellingUserId: currentUser.id,
          actualMinutesTaught: actualMinutesTaughtInput,
          cancellationReason: finalReason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCancellationResult(data.cancellationResult);
        setCancelModalOpen(false);
        setTimerActive(false);
        loadSession();
        refreshUserData();
      } else {
        alert(data.error || 'Failed to cancel session');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during cancellation');
    } finally {
      setIsSubmittingCancellation(false);
    }
  };

  // Teacher Action: Mark Complete
  const handleTeacherComplete = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TEACHER_COMPLETE',
          teacherOutcome: 'SUCCESSFUL',
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.transferResult?.success) {
          setTransferResult(data.transferResult);
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }
        loadSession();
        refreshUserData();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Learner Action: Confirm Session & Atomic Credit Transfer
  const handleLearnerConfirm = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LEARNER_CONFIRM',
          outcomeStatus: 'GOAL_ACHIEVED',
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.transferResult?.success) {
          setTransferResult(data.transferResult);
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }
        loadSession();
        refreshUserData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const isTeacher = session.teacher_id === currentUser.id;
    const reviewedUserId = isTeacher ? session.learner_id : session.teacher_id;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          reviewerId: currentUser.id,
          reviewedUserId,
          rating,
          review: reviewText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewModalOpen(false);
        loadSession();
        alert('Thank you! Your verified rating and review have been recorded.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // File Dispute
  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          raisedBy: currentUser.id,
          reason: disputeReason,
          description: disputeDescription,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDisputeModalOpen(false);
        loadSession();
        alert('Dispute logged. Credit transfer paused pending administrator review.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Connecting to secure learning room...</div>;
  }

  if (!session) {
    return <div className="p-12 text-center text-xs text-rose-500">Session not found.</div>;
  }

  const isTeacher = session.teacher_id === currentUser?.id;
  const counterpartyName = isTeacher ? session.learner_name : session.teacher_name;
  const counterpartyAvatar = isTeacher ? session.learner_avatar : session.teacher_avatar;

  const goalOutcomes = typeof session.expected_outcome === 'string' && session.expected_outcome.trim().length > 0
    ? session.expected_outcome.split('\n').filter((s: string) => s.trim().length > 0)
    : ['Understand core concepts', 'Complete practical exercise', 'Review code together'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Session Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/sessions')}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 uppercase">
                {session.skill_name}
              </span>
              <span className="text-xs font-bold text-slate-400">•</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                Cost: {Number(session?.credit_amount ?? 0).toFixed(2)} Time Credit
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
              Live Classroom with {counterpartyName}
            </h1>
          </div>
        </div>

        {/* Live Timer Pill & Status */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="px-4 py-2 rounded-2xl bg-slate-900 text-white font-mono text-sm font-black flex items-center gap-2 shadow">
            <Clock className="w-4 h-4 text-orange-400 animate-pulse" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>

          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-black ${
              session.status === 'CONFIRMED'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                : session.status === 'DISPUTED'
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
            }`}
          >
            {session.status}
          </span>
        </div>
      </div>

      {/* DISPUTE PAUSED ALERT BANNER (Section 65) */}
      {session.status === 'DISPUTED' && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>
            <strong>Dispute Under Review:</strong> An active dispute was filed on this session. Time Credit transfer is paused pending administrator arbitration.
          </span>
        </div>
      )}

      {/* SESSION CANCELLED ALERT BANNER */}
      {session.status === 'CANCELLED' && (
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 shadow-md space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-200 dark:border-rose-800/60 pb-3">
            <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400 font-black text-base">
              <XCircle className="w-6 h-6 shrink-0" />
              <span>Session Cancelled Early</span>
            </div>
            <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-200 uppercase tracking-wider self-start sm:self-auto">
              Status: Cancelled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cancelled By</span>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white mt-0.5">
                {session.cancelled_by === currentUser.id ? 'You (Self-Cancelled)' : (session.canceller_name || counterpartyName)}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Time Taught Delivered</span>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ⏱️ {session.actual_duration ?? 0} mins (out of {session.duration} mins)
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Credit Deduction on Canceller</span>
              <p className="text-xs font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                🪙 -{Number(session.cancellation_deduction || 0).toFixed(2)} Time Credits
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-rose-200 dark:border-rose-900/60 text-xs">
            <strong className="font-bold text-rose-900 dark:text-rose-300">Cancellation Reason: </strong>
            <span className="italic text-slate-700 dark:text-slate-300">&quot;{session.cancellation_reason || 'Session cancelled early'}&quot;</span>
          </div>
        </div>
      )}

      {/* CANCELLATION RESULT TOAST */}
      {cancellationResult && (
        <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-2xl border-2 border-rose-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in zoom-in-95">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-black text-base text-rose-400">
              <XCircle className="w-5 h-5" />
              <span>Session Cancellation Finalized</span>
            </div>
            <p className="text-xs text-slate-300">
              Transaction ID: <strong className="font-mono text-amber-400">{cancellationResult.transactionId}</strong>
            </p>
            <p className="text-xs text-slate-300">
              Delivered: {cancellationResult.actualMinutesTaught} mins taught • Cancelled: {cancellationResult.cancelledMinutes} mins unfulfilled • Deduction: -{Number(cancellationResult.cancellationDeduction || 0).toFixed(2)} Time Credits
            </p>
          </div>
          <button
            onClick={() => setCancellationResult(null)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ATOMIC CREDIT TRANSFER CELEBRATION TOAST */}
      {transferResult && (
        <div className="p-6 rounded-3xl bg-emerald-500 text-white shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in zoom-in-95">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-black text-lg">
              <CheckCircle2 className="w-6 h-6" />
              <span>Atomic Credit Transfer Finalized! 🪙</span>
            </div>
            <p className="text-xs text-white/90">
              Transaction ID: <strong className="font-mono">{transferResult.transactionId}</strong>
            </p>
            <p className="text-xs text-white/90">
              {Number(session?.credit_amount ?? 0).toFixed(2)} Time Credits transferred cleanly with SQLite ACID rollback guarantee.
            </p>
          </div>
          <button
            onClick={() => setReviewModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 text-xs font-bold shadow hover:bg-slate-50 shrink-0"
          >
            Leave Review ⭐
          </button>
        </div>
      )}

      {/* SESSION TIMINGS & CONTROLLER CARD */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Session Timings & Status
              </span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                session.status === 'IN_PROGRESS'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 animate-pulse'
                  : session.status === 'COMPLETED' || session.status === 'CONFIRMED'
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                  : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
              }`}>
                {session.status === 'IN_PROGRESS' ? '🔴 Live Session in Progress' : session.status === 'SCHEDULED' ? 'Scheduled • Ready to Start' : session.status}
              </span>
            </div>
            <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-1">
              📅 {session.start_time || 'Scheduled Session'} • ⏱️ {session.duration || 60} Mins ({Number(session?.credit_amount ?? 0).toFixed(2)} Time Credits)
            </p>
          </div>
        </div>

        {/* Start Session / Timer Controls */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0 flex-wrap">
          {session.status === 'SCHEDULED' && (
            <button
              onClick={handleStartLiveSession}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-xs shadow-lg hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Start Session Now ▶</span>
            </button>
          )}

          {session.status === 'IN_PROGRESS' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  timerActive
                    ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {timerActive ? '⏸ Pause Timer' : '▶ Resume Timer'}
              </button>
            </div>
          )}

          {(session.status === 'SCHEDULED' || session.status === 'IN_PROGRESS') && (
            <button
              onClick={() => {
                const totalMins = Number(session.duration || 60);
                const autoMins = Math.max(0, Math.min(totalMins, Math.round(((totalMins * 60) - timerSeconds) / 60)));
                setActualMinutesTaughtInput(autoMins || 15);
                setCancelModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Cancel Session early and calculate prorated credit deduction"
            >
              <XCircle className="w-4 h-4" />
              <span>Cancel Session</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN TWO-COLUMN CLASSROOM INTERFACE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLS: VIDEO / CODE SCREEN SIMULATION */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video rounded-3xl bg-slate-950 text-white overflow-hidden shadow-2xl flex flex-col justify-between p-6 border border-slate-800">
            {/* Top Video Overlay */}
            <div className="flex items-center justify-between z-10">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Encrypted P2P Learning Session (WebRTC)</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">1080p HD</span>
            </div>

            {/* Simulated Video Feeds */}
            <div className="flex-1 flex items-center justify-center my-4 relative">
              {videoOn ? (
                <div className="text-center space-y-3">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-br from-orange-500 to-green-600 p-1 mx-auto shadow-2xl">
                    <img
                      src={counterpartyAvatar}
                      alt={counterpartyName}
                      className="w-full h-full rounded-[22px] object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-bold">{counterpartyName}</h3>
                    <p className="text-xs text-slate-400">
                      {isTeacher ? 'Learner (Active)' : 'Verified Instructor (Active)'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs">Video is paused</div>
              )}

              {/* Self view pip */}
              <div className="absolute bottom-2 right-2 w-24 h-20 rounded-2xl bg-slate-800 border-2 border-slate-700 overflow-hidden shadow-lg flex items-center justify-center">
                <img 
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'} 
                  alt={currentUser?.fullName || 'User'} 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

            {/* Bottom Controls Toolbar */}
            <div className="flex items-center justify-center gap-3 z-10 pt-2 border-t border-white/10">
              <button
                onClick={() => setMicOn(!micOn)}
                className={`p-3 rounded-2xl transition-all ${
                  micOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                }`}
                title={micOn ? 'Mute Mic' : 'Unmute Mic'}
              >
                {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setVideoOn(!videoOn)}
                className={`p-3 rounded-2xl transition-all ${
                  videoOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-rose-600 text-white'
                }`}
                title={videoOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setScreenSharing(!screenSharing)}
                className={`p-3 rounded-2xl transition-all ${
                  screenSharing ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'
                }`}
                title="Share Screen"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setDisputeModalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-rose-950 text-rose-400 text-xs font-bold flex items-center gap-1.5"
                title="Raise Dispute"
              >
                <ShieldAlert className="w-4 h-4" />
                <span className="hidden sm:inline">Dispute</span>
              </button>

              {(session.status === 'SCHEDULED' || session.status === 'IN_PROGRESS') && (
                <button
                  onClick={() => {
                    const totalMins = Number(session?.duration || 60);
                    const autoMins = Math.max(0, Math.min(totalMins, Math.round(((totalMins * 60) - timerSeconds) / 60)));
                    setActualMinutesTaughtInput(autoMins || 15);
                    setCancelModalOpen(true);
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-800 cursor-pointer"
                  title="Cancel session early with credit adjustment"
                >
                  <XCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Cancel Session</span>
                </button>
              )}
            </div>
          </div>

          {/* Shared Session Notes Editor */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Collaborative Session Notes
            </h3>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white font-mono"
            />
          </div>
        </div>

        {/* RIGHT COL: LEARNING GOAL CONTRACT & TWO-WAY COMPLETION */}
        <div className="space-y-6">
          {/* Learning Goal Contract Card (Section 39) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                <Sparkles className="w-3 h-3" /> Section 39
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Learning Goal Contract
              </h3>
              <p className="text-xs text-slate-500">
                Outcome-oriented goals defined before this session.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 text-xs text-slate-800 dark:text-slate-200 font-semibold">
              Goal: &quot;{session.learning_goal}&quot;
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Expected Outcomes Checklist
              </h4>
              <div className="space-y-2">
                {goalOutcomes.map((item: string, idx: number) => (
                  <label
                    key={idx}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={!!completedGoals[idx]}
                      onChange={() => setCompletedGoals(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span className={completedGoals[idx] ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* TWO-WAY CONFIRMATION & ATOMIC TRANSFER (Sections 18-20, 71) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Session Completion Status
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Teacher Completion ({session.teacher_name}):
                </span>
                <span className={`font-bold ${session.teacher_confirmation ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {session.teacher_confirmation ? 'Marked Completed ✓' : 'Pending'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Learner Confirmation ({session.learner_name}):
                </span>
                <span className={`font-bold ${session.learner_confirmation ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {session.learner_confirmation ? 'Confirmed ✓' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Dynamic Confirmation Actions */}
            {session.status === 'CANCELLED' ? (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-center space-y-1.5 mt-2">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center justify-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  <span>Session Cancelled Early</span>
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Teaching delivered: <strong>{session.actual_duration || 0} mins</strong>. Prorated credits adjusted with deduction on cancelling party.
                </p>
              </div>
            ) : session.status !== 'CONFIRMED' ? (
              <div className="pt-2 space-y-3">
                {isTeacher && !session.teacher_confirmation && (
                  <button
                    onClick={handleTeacherComplete}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Session Completed as Teacher</span>
                  </button>
                )}

                {!isTeacher && !session.learner_confirmation && (
                  <button
                    onClick={handleLearnerConfirm}
                    className="w-full py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                  >
                    <Coins className="w-4 h-4" />
                    <span>Confirm Outcome & Release Credits ({Number(session?.credit_amount ?? 0).toFixed(2)} Cr)</span>
                  </button>
                )}
              </div>
            ) : null}

            {session.status === 'CONFIRMED' && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-center space-y-2">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Session Completed & Credits Transferred!
                </p>
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold shadow"
                >
                  Rate & Review Counterparty ⭐
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RATING & REVIEW MODAL (Section 47) */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Rate & Review {counterpartyName}
              </h3>
              <button onClick={() => setReviewModalOpen(false)} className="p-2 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating ? 'text-amber-400 fill-current' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Written Feedback</label>
                <textarea
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience (pedagogy, communication, punctuality)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPUTE MODAL (Section 65) */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-300 dark:border-rose-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Raise Session Dispute
              </h3>
              <button onClick={() => setDisputeModalOpen(false)} className="p-2 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Filing a dispute pauses automatic credit settlement until an administrator reviews session evidence.
            </p>

            <form onSubmit={handleRaiseDispute} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Reason for Dispute</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Session did not meet the agreed Learning Goal Contract">Session did not meet Learning Goal Contract</option>
                  <option value="Teacher/Learner did not attend session">Counterparty was absent</option>
                  <option value="Severe technical or connection failure">Severe technical failure</option>
                  <option value="Inappropriate communication">Inappropriate communication</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Detailed Explanation</label>
                <textarea
                  rows={3}
                  required
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Provide facts or logs..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  File Dispute & Pause Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SESSION CANCELLATION MODAL */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-rose-400 dark:border-rose-900 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Cancel Session Early
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Prorated credit deduction for the cancelling user
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setCancelModalOpen(false)} 
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Alert */}
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Credit Decrease on Your Account</span>
              </div>
              <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-300">
                Because you are initiating this early cancellation, Time Credits will be deducted from your wallet according to the unfulfilled cancelled time. Delivered teaching time is calculated pro-rata.
              </p>
            </div>

            <form onSubmit={handleCancelSession} className="space-y-4 text-xs">
              {/* Duration & Time Taught Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    Minutes Actually Taught / Completed:
                  </span>
                  <span className="font-black text-sm px-2.5 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                    {actualMinutesTaughtInput} / {session?.duration || 60} mins
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={session?.duration || 60}
                  step={1}
                  value={actualMinutesTaughtInput}
                  onChange={(e) => setActualMinutesTaughtInput(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>0 mins (Just started)</span>
                  <span>{Math.round((session?.duration || 60) / 2)} mins</span>
                  <span>{session?.duration || 60} mins (Full)</span>
                </div>

                {/* Prorated Breakdown Cards */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold">Taught ({actualMinutesTaughtInput}m)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {(actualMinutesTaughtInput / 60).toFixed(2)} Time Cr
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      Cancelled ({Math.max(0, (session?.duration || 60) - actualMinutesTaughtInput)}m)
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                      {(Math.max(0, (session?.duration || 60) - actualMinutesTaughtInput) / 60).toFixed(2)} Time Cr
                    </span>
                  </div>
                </div>

                {/* Net Deduction for Cancelling User */}
                <div className="p-3 rounded-xl bg-rose-100/70 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 flex items-center justify-between">
                  <span className="font-bold text-rose-900 dark:text-rose-200">
                    Net Credit Decrease for You ({isTeacher ? 'Teacher' : 'Learner'}):
                  </span>
                  <span className="font-black text-rose-700 dark:text-rose-400 text-sm">
                    {isTeacher
                      ? `-${Math.max(0, ((session?.duration || 60) - actualMinutesTaughtInput) / 60 - actualMinutesTaughtInput / 60).toFixed(2)} Time Credits`
                      : `-${((actualMinutesTaughtInput + Math.max(0, (session?.duration || 60) - actualMinutesTaughtInput)) / 60).toFixed(2)} Time Credits`
                    }
                  </span>
                </div>
              </div>

              {/* Cancellation Reason Selection */}
              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 dark:text-white block">
                  Select Reason for Cancellation <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Personal Emergency',
                    'Technical / Internet Issue',
                    'Agreed to Conclude Early',
                    'Time Constraint / Conflict',
                    'Other Reason',
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setCancellationReason(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        cancellationReason === r
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  placeholder="Explain why the session is being cancelled (e.g., unexpected power cut, emergency meeting)..."
                  value={cancellationCustomReason}
                  onChange={(e) => setCancellationCustomReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                >
                  Resume Session
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCancellation}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-black text-xs shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{isSubmittingCancellation ? 'Cancelling...' : 'Confirm Cancellation & Deduct Credits'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
