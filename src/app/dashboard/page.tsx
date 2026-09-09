'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { subscribeToRequestEvents } from '@/lib/realtime';
import { 
  Coins, Clock, BookOpen, Award, CheckCircle2, XCircle, AlertTriangle, 
  Flame, PlusCircle, ArrowUpRight, ArrowDownRight, Compass, ShieldCheck, 
  Check, X, Sparkles, Video, UserCheck
} from 'lucide-react';

export default function DashboardPage() {
  const { currentUser, refreshUserData, pendingIncomingRequests, acceptSessionRequest, declineSessionRequest } = useApp();
  const [activeTab, setActiveTab] = useState<'LEARNER' | 'TEACHER'>('LEARNER');
  const [userData, setUserData] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [recovery, setRecovery] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, rRes, sRes, wRes] = await Promise.all([
        fetch(`/api/users/${currentUser.id}`, { cache: 'no-store' }),
        fetch(`/api/requests?userId=${currentUser.id}`, { cache: 'no-store' }),
        fetch(`/api/sessions?userId=${currentUser.id}`, { cache: 'no-store' }),
        fetch(`/api/wallet?userId=${currentUser.id}`, { cache: 'no-store' }),
      ]);

      const uData = await uRes.json();
      const rData = await rRes.json();
      const sData = await sRes.json();
      const wData = await wRes.json();

      setUserData(uData);
      setRequests(rData.requests || []);
      setSessions(sData.sessions || []);
      setRecovery(wData.recovery);

      // If user has pending incoming requests as teacher, prioritize Teacher Mode
      const pendingTeacherReqs = (rData.requests || []).filter(
        (r: any) => r.teacher_id === currentUser.id && r.status === 'PENDING'
      );
      if (pendingTeacherReqs.length > 0) {
        setActiveTab('TEACHER');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 2.5s live polling for instant incoming requests
    const interval = setInterval(loadData, 2500);

    // Instant cross-tab & local real-time event listener
    const unsubscribe = subscribeToRequestEvents(() => {
      loadData();
      refreshUserData();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [currentUser.id]);

  const handleRequestAction = async (requestId: string, action: 'ACCEPT' | 'REJECT') => {
    if (action === 'ACCEPT') {
      const res = await acceptSessionRequest(requestId);
      if (res.success) {
        setActionMessage(res.message || 'Session Accepted!');
        loadData();
        refreshUserData();
        setTimeout(() => setActionMessage(null), 4000);
      } else {
        alert(res.error || 'Failed to accept session');
      }
    } else {
      const res = await declineSessionRequest(requestId);
      if (res.success) {
        setActionMessage(res.message || 'Session Declined');
        loadData();
        refreshUserData();
        setTimeout(() => setActionMessage(null), 4000);
      }
    }
  };

  // Filter requests based on perspective
  const incomingTeacherRequests = requests.filter(r => r.teacher_id === currentUser.id);
  const outgoingLearnerRequests = requests.filter(r => r.learner_id === currentUser.id);
  const pendingIncomingTeacherRequests = incomingTeacherRequests.filter(r => r.status === 'PENDING');

  // Filter sessions
  const teachingSessions = sessions.filter(s => s.teacher_id === currentUser.id);
  const learningSessions = sessions.filter(s => s.learner_id === currentUser.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🇮🇳</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {userData?.user?.city ? `${userData.user.city}, ${userData.user.state}` : 'India'}
            </span>
            <span className="text-xs font-medium text-slate-400">•</span>
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-bold">
              <Flame className="w-3.5 h-3.5" />
              <span>{userData?.user?.learning_streak || 3} Day Streak</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Namaste, {currentUser.fullName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {userData?.user?.trust_level || 'Active Member'} • Reputation Score: <strong>{userData?.user?.reputation_score || 85}/100</strong>
          </p>
        </div>

        {/* Learner / Teacher Toggle (Section 22: User is both Learner + Teacher) */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('LEARNER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'LEARNER'
                ? 'bg-white dark:bg-slate-700 text-blue-900 dark:text-blue-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Learner Mode</span>
          </button>
          <button
            onClick={() => setActiveTab('TEACHER')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'TEACHER'
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Teacher Mode</span>
            {pendingIncomingTeacherRequests.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {pendingIncomingTeacherRequests.length} New
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* TOP-LEVEL INSTANT ACCEPTANCE BANNER (Visible in BOTH Learner and Teacher Mode) */}
      {pendingIncomingTeacherRequests.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-emerald-500/15 border-2 border-orange-400 dark:border-orange-600 shadow-md space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black text-sm">
              <span className="flex h-3 w-3 rounded-full bg-orange-500 animate-ping shrink-0" />
              <span>⚡ ACTION REQUIRED: You Have {pendingIncomingTeacherRequests.length} Incoming Session Request(s)!</span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Strict 24-Hour Response Rule
            </span>
          </div>

          <div className="space-y-3">
            {pendingIncomingTeacherRequests.map((req) => {
              const deadline = new Date(req.response_deadline).getTime();
              const now = Date.now();
              const remainingHours = Math.max(0, Math.floor((deadline - now) / (1000 * 3600)));
              const remainingMins = Math.max(0, Math.floor(((deadline - now) % (1000 * 3600)) / (1000 * 60)));

              return (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <img
                      src={req.learner_avatar}
                      alt={req.learner_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-orange-300 dark:border-slate-600 shrink-0 mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.learner_name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
                          {req.skill_name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          Earns +{req.credit_cost} Time Credit
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                        Goal: &quot;{req.learning_goal}&quot;
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span>📅 {req.preferred_date}</span>
                        <span>⏰ {req.preferred_time}</span>
                        <span>⏱️ {req.duration} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2.5 shrink-0">
                    <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{remainingHours}h {remainingMins}m remaining</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRequestAction(req.id, 'ACCEPT')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 hover:scale-105 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Accept Session Now ✓</span>
                      </button>
                      <button
                        onClick={() => handleRequestAction(req.id, 'REJECT')}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* UNIQUE FEATURE: Credit Recovery Banner (Section 13) */}
      {recovery?.needsRecovery && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-orange-500/10 border border-rose-300 dark:border-rose-900/60 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <span>Credit Recovery System Active (Negative Balance: {currentUser.balance.toFixed(2)} Credits)</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            You currently have a negative balance of <strong>{currentUser.balance.toFixed(2)} Credits</strong>. Don&apos;t worry! TimeBank of India helps you recover your balance by teaching skills you know.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {recovery.recommendations?.map((rec: any) => (
              <div key={rec.skillId} className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{rec.skillName}</h4>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">{rec.potentialCreditGain} for 1 hr</p>
                  <span className="text-[10px] text-slate-400">Readiness: {rec.readinessScore}/100 ({rec.readinessTier})</span>
                </div>
                <Link
                  href={`/marketplace?search=${encodeURIComponent(rec.skillName)}`}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm"
                >
                  Teach Now
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Wallet Summary Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Time Credit Balance</span>
            <Coins className="w-4 h-4 text-orange-500" />
          </div>
          <div className="my-2">
            <div className={`text-2xl font-black ${currentUser.balance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {currentUser.balance > 0 ? `+${currentUser.balance.toFixed(2)}` : currentUser.balance.toFixed(2)} <span className="text-xs font-normal text-slate-400">Credits</span>
            </div>
            <p className="text-[11px] text-slate-400">Borrowing Limit: {currentUser.borrowingLimit.toFixed(2)} Cr</p>
          </div>
          <Link href="/wallet" className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
            <span>View Time Wallet</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Active Sessions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Scheduled Sessions</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {sessions.filter(s => s.status === 'SCHEDULED').length}
            </div>
            <p className="text-[11px] text-slate-400">Next 7 days</p>
          </div>
          <Link href="/sessions" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
            <span>Manage Sessions</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Skill Passport Level */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Skill Passport</span>
            <Award className="w-4 h-4 text-green-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {userData?.teachingSkills?.length || 0} Taught
            </div>
            <p className="text-[11px] text-slate-400">{userData?.learningSkills?.length || 0} In Learning</p>
          </div>
          <Link href="/passport" className="text-xs font-bold text-green-600 dark:text-green-400 hover:underline flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
            <span>Open Passport</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Quick Discovery CTA */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-black/20 px-2 py-0.5 rounded">
              Quick Action
            </span>
            <h4 className="text-sm font-black mt-2">Find a New Skill</h4>
            <p className="text-[11px] text-white/80">Explore verified Indian peers ready to share their craft.</p>
          </div>
          <Link
            href="/marketplace"
            className="mt-3 px-3 py-2 rounded-xl bg-white text-orange-700 text-xs font-bold flex items-center justify-center gap-1 hover:bg-slate-50"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Browse Marketplace</span>
          </Link>
        </div>
      </div>

      {/* TAB CONTENT: LEARNER PERSPECTIVE */}
      {activeTab === 'LEARNER' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Skills You Are Learning
              </h2>
              <p className="text-xs text-slate-500">Track your curriculum and ongoing knowledge acquisition.</p>
            </div>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Learn Another Skill</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userData?.learningSkills?.length > 0 ? (
              userData.learningSkills.map((ls: any) => (
                <div key={ls.id} className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                      {ls.category}
                    </span>
                    <span className="text-xs text-slate-400">{ls.experience_level}</span>
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{ls.skill_name}</h3>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700 text-xs">
                    <Link href={`/gap-detector`} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                      Run Gap Detector →
                    </Link>
                    <Link href={`/marketplace?search=${encodeURIComponent(ls.skill_name)}`} className="text-orange-600 dark:text-orange-400 font-semibold hover:underline">
                      Find Teachers →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 col-span-2">
                <p className="text-xs text-slate-500">No skills added to learn yet.</p>
                <Link href="/marketplace" className="text-xs font-bold text-blue-600 hover:underline mt-1 inline-block">
                  Search skills in marketplace
                </Link>
              </div>
            )}
          </div>

          {/* Outgoing Requests (Learner awaiting teacher response) */}
          <div className="space-y-4 pt-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Learning Requests</h3>
            {outgoingLearnerRequests.length > 0 ? (
              <div className="space-y-3">
                {outgoingLearnerRequests.map((req) => (
                  <div key={req.id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={req.teacher_avatar} alt={req.teacher_name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {req.skill_name} with {req.teacher_name}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Goal: &quot;{req.learning_goal}&quot; • {req.duration} mins ({req.credit_cost} Cr)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      {req.status === 'PENDING' && (
                        <div className="text-right">
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 text-[10px] font-bold">
                            Waiting for Teacher (24h Window)
                          </span>
                        </div>
                      )}
                      {req.status === 'ACCEPTED' && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                          Accepted ✓
                        </span>
                      )}
                      {req.status === 'EXPIRED' && (
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] font-bold">
                          Expired (0 Cr Deducted)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No active learning requests.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: TEACHER PERSPECTIVE */}
      {activeTab === 'TEACHER' && (
        <div className="space-y-6">
          {/* Incoming Booking Requests with 24-HOUR RULE (Section 41) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" /> Incoming Teaching Requests
                </h2>
                <p className="text-xs text-slate-500">
                  Strict Rule: You have <strong>exactly 24 hours</strong> to accept or reject requests before they auto-expire!
                </p>
              </div>
            </div>

            {incomingTeacherRequests.filter(r => r.status === 'PENDING').length > 0 ? (
              <div className="space-y-3">
                {incomingTeacherRequests.filter(r => r.status === 'PENDING').map((req) => {
                  const deadline = new Date(req.response_deadline).getTime();
                  const now = Date.now();
                  const remainingHours = Math.max(0, Math.floor((deadline - now) / (1000 * 3600)));
                  const remainingMins = Math.max(0, Math.floor(((deadline - now) % (1000 * 3600)) / (1000 * 60)));

                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border-2 border-orange-200 dark:border-orange-900/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <img src={req.learner_avatar} alt={req.learner_name} className="w-11 h-11 rounded-full object-cover mt-1" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{req.learner_name}</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/80 text-orange-800 dark:text-orange-200">
                              {req.skill_name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-1">
                            Goal: &quot;{req.learning_goal}&quot;
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Expected Outcome: {req.expected_outcome || 'Complete foundational mastery'}
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400 mt-2">
                            <span>📅 {req.preferred_date}</span>
                            <span>⏰ {req.preferred_time}</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Duration: {req.duration} mins (+{req.credit_cost} Time Credit)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col items-end gap-2 shrink-0">
                        {/* 24-Hr Live Countdown Pill */}
                        <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-[11px] font-bold flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>{remainingHours}h {remainingMins}m remaining</span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            onClick={() => handleRequestAction(req.id, 'ACCEPT')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Session</span>
                          </button>
                          <button
                            onClick={() => handleRequestAction(req.id, 'REJECT')}
                            className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                No pending requests requiring action. You are all caught up!
              </div>
            )}
          </div>

          {/* Skills You Teach & Readiness Scores */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Skills You Teach</h3>
                <p className="text-xs text-slate-500">Verify skills to increase your Skill Readiness Score and trust tier.</p>
              </div>
              <Link
                href="/assessments"
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
              >
                <span>Take Skill Assessment</span>
                <Sparkles className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userData?.teachingSkills?.map((ts: any) => (
                <div key={ts.id} className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-400">
                      {ts.category}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {ts.final_score || 85}/100 Readiness ({ts.readiness_tier || 'Ready'})
                    </span>
                  </div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white">{ts.skill_name}</h4>
                  <p className="text-xs text-slate-500">Level: {ts.experience_level} • Target: {ts.teaching_level || 'All levels'}</p>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Earn +1.0 Credit / hr</span>
                    <Link href={`/passport`} className="text-orange-600 dark:text-orange-400 font-semibold hover:underline">
                      View in Passport →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
