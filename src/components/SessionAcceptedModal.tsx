'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { CheckCircle2, Video, ArrowRight, X, Sparkles, UserCheck } from 'lucide-react';

export default function SessionAcceptedModal() {
  const { acceptedModal, setAcceptedModal } = useApp();
  const router = useRouter();

  if (!acceptedModal || !acceptedModal.isOpen) return null;

  const handleEnterSession = () => {
    const targetSessionId = acceptedModal.sessionId;
    setAcceptedModal(null);
    if (targetSessionId) {
      router.push(`/sessions/${targetSessionId}`);
    } else {
      router.push('/sessions');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-slate-900 dark:text-white space-y-6 relative overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-blue-800 to-green-600" />

        <div className="flex items-start justify-between">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg">
            <UserCheck className="w-7 h-7" />
          </div>
          <button
            onClick={() => setAcceptedModal(null)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Session Confirmed & Ready
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Session Request Accepted! 🎉
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
            {acceptedModal.isTeacher ? (
              <>
                You have confirmed the session with <strong>{acceptedModal.learnerName}</strong> for{' '}
                <strong className="text-orange-600 dark:text-orange-400">{acceptedModal.skillName}</strong>.
              </>
            ) : (
              <>
                Instructor <strong>{acceptedModal.teacherName}</strong> has accepted your request to learn{' '}
                <strong className="text-orange-600 dark:text-orange-400">{acceptedModal.skillName}</strong>!
              </>
            )}
          </p>
        </div>

        {/* Info card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Skill / Goal:</span>
            <span className="font-bold text-slate-900 dark:text-white">{acceptedModal.skillName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">
              {acceptedModal.isTeacher ? 'Learner (Consumer):' : 'Instructor:'}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {acceptedModal.isTeacher ? acceptedModal.learnerName : acceptedModal.teacherName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Live Classroom:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Available Now
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => setAcceptedModal(null)}
            className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
          >
            Dismiss
          </button>
          <button
            onClick={handleEnterSession}
            className="w-full sm:w-auto flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-extrabold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Enter Session Classroom ▶</span>
          </button>
        </div>
      </div>
    </div>
  );
}
