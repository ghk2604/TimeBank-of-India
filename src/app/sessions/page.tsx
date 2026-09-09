'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { subscribeToRequestEvents } from '@/lib/realtime';
import { 
  Clock, Video, CheckCircle2, AlertTriangle, Star, 
  ArrowRight, ShieldAlert, Coins, ChevronRight, UserCheck, BookOpen, Check, X
} from 'lucide-react';

export default function SessionsListPage() {
  const { currentUser, pendingIncomingRequests, acceptSessionRequest, declineSessionRequest } = useApp();
  const [sessions, setSessions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'SCHEDULED' | 'CONFIRMED' | 'DISPUTED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [sessionToast, setSessionToast] = useState<string | null>(null);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sessions?userId=${currentUser.id}`, { cache: 'no-store' });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();

    const interval = setInterval(loadSessions, 3000);
    const unsubscribe = subscribeToRequestEvents(() => {
      loadSessions();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [currentUser.id]);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'ALL') return true;
    return s.status === filter;
  });

  const handleAcceptRequest = async (requestId: string) => {
    const res = await acceptSessionRequest(requestId);
    if (res.success) {
      setSessionToast(res.message || 'Session Accepted! New classroom scheduled below.');
      setTimeout(() => setSessionToast(null), 4000);
      loadSessions();
    } else {
      alert(res.error || 'Failed to accept session');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            My Learning & Teaching Sessions 🗓️
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your booked 1-on-1 sessions, enter live classrooms, and verify Learning Goal Contracts.
          </p>
        </div>

        <Link
          href="/marketplace"
          className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Book New Session</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {sessionToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{sessionToast}</span>
        </div>
      )}

      {/* PENDING INCOMING REQUESTS WAITING FOR TEACHER ACCEPTANCE */}
      {pendingIncomingRequests && pendingIncomingRequests.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-emerald-500/15 border-2 border-orange-400 dark:border-orange-600 shadow-md space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black text-sm">
              <span className="flex h-3 w-3 rounded-full bg-orange-500 animate-ping" />
              <span>⚡ Incoming Session Requests Awaiting Your Acceptance ({pendingIncomingRequests.length})</span>
            </div>
            <span className="text-[11px] font-bold text-slate-500 bg-white/80 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
              Strict 24-Hour Response Rule
            </span>
          </div>

          <div className="space-y-3">
            {pendingIncomingRequests.map((req) => {
              const deadline = new Date(req.response_deadline).getTime();
              const now = Date.now();
              const remainingHours = Math.max(0, Math.floor((deadline - now) / (1000 * 3600)));
              const remainingMins = Math.max(0, Math.floor(((deadline - now) % (1000 * 3600)) / (1000 * 60)));

              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={req.learner_avatar}
                      alt={req.learner_name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-orange-300 shrink-0 mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{req.learner_name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300">
                          {req.skill_name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                          +{req.credit_cost} Time Credit
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Goal: &quot;{req.learning_goal}&quot;
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                        <span>📅 {req.preferred_date}</span>
                        <span>⏰ {req.preferred_time}</span>
                        <span>⏱️ {req.duration} mins</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    <div className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" />
                      <span>{remainingHours}h {remainingMins}m left</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-all hover:scale-105"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Session ✓</span>
                      </button>
                      <button
                        onClick={async () => {
                          await declineSessionRequest(req.id);
                          loadSessions();
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        {['ALL', 'SCHEDULED', 'CONFIRMED', 'DISPUTED'].map((tab: any) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Sessions Grid */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const isTeacher = session.teacher_id === currentUser.id;
            const counterpartyName = isTeacher ? session.learner_name : session.teacher_name;
            const counterpartyAvatar = isTeacher ? session.learner_avatar : session.teacher_avatar;

            return (
              <div
                key={session.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-orange-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={counterpartyAvatar}
                    alt={counterpartyName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-orange-200 dark:border-slate-700 mt-1"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                        {isTeacher ? 'Teaching' : 'Learning'}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
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
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {session.skill_name} with {counterpartyName}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      Goal Contract: &quot;{session.learning_goal}&quot;
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>⏰ {session.duration} mins</span>
                      <span>•</span>
                      <span className="font-bold text-orange-600 dark:text-orange-400">
                        {session.credit_amount.toFixed(2)} Time Credit
                      </span>
                      <span>•</span>
                      <span>📅 {new Date(session.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <Link
                    href={`/sessions/${session.id}`}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow flex items-center gap-2 hover:scale-105 transition-transform"
                  >
                    <Video className="w-4 h-4" />
                    <span>Enter Live Room</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          No sessions found under this filter.
        </div>
      )}
    </div>
  );
}
