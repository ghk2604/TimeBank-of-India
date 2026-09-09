'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { 
  Clock, Video, CheckCircle2, AlertTriangle, Star, 
  ArrowRight, ShieldAlert, Coins, ChevronRight, UserCheck, BookOpen
} from 'lucide-react';

export default function SessionsListPage() {
  const { currentUser } = useApp();
  const [sessions, setSessions] = useState<any[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'SCHEDULED' | 'CONFIRMED' | 'DISPUTED'>('ALL');
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sessions?userId=${currentUser.id}`);
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
  }, [currentUser.id]);

  const filteredSessions = sessions.filter(s => {
    if (filter === 'ALL') return true;
    return s.status === filter;
  });

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
