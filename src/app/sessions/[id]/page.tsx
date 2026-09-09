'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { 
  Video, Mic, MicOff, VideoOff, Share2, Clock, CheckCircle2, 
  AlertTriangle, Star, Coins, ShieldAlert, ArrowLeft, Send, Sparkles, X
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

  const isTeacher = session.teacher_id === currentUser.id;
  const counterpartyName = isTeacher ? session.learner_name : session.teacher_name;
  const counterpartyAvatar = isTeacher ? session.learner_avatar : session.teacher_avatar;

  const goalOutcomes = session.expected_outcome
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
                Cost: {session.credit_amount.toFixed(2)} Time Credit
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
              {session.credit_amount.toFixed(2)} Time Credits transferred cleanly with SQLite ACID rollback guarantee.
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
                <img src={currentUser.avatar} alt={currentUser.fullName} className="w-full h-full object-cover" />
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
            {session.status !== 'CONFIRMED' && (
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
                    <span>Confirm Outcome & Release Credits ({session.credit_amount.toFixed(2)} Cr)</span>
                  </button>
                )}
              </div>
            )}

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
    </div>
  );
}
