'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Award, ShieldCheck, CheckCircle2, Clock, Star, 
  Sparkles, BookOpen, UserCheck, Flame, Download, Share2, Layers
} from 'lucide-react';

export default function SkillPassportPage() {
  const { currentUser } = useApp();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${currentUser.id}`)
      .then(res => res.json())
      .then(data => setUserData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser.id]);

  const badges = [
    { id: 'b1', name: 'First Lesson', icon: '🌱', desc: 'Completed first 1-on-1 learning session', unlocked: true },
    { id: 'b2', name: 'Knowledge Sharer', icon: '💡', desc: 'Conducted a verified teaching session', unlocked: (userData?.teachingSkills?.length || 0) > 0 },
    { id: 'b3', name: 'Active Learner', icon: '🎓', desc: 'Completed 5+ learning hours on the platform', unlocked: true },
    { id: 'b4', name: 'Highly Rated', icon: '⭐', desc: 'Maintained an average rating of 4.8+', unlocked: (userData?.user?.reputation_score || 0) >= 80 },
    { id: 'b5', name: 'Skill Expert', icon: '🏆', desc: 'Demonstrated readiness score of 85+ in a core domain', unlocked: (userData?.teachingSkills?.some((s: any) => s.final_score >= 85)) },
    { id: 'b6', name: 'National Contributor', icon: '🇮🇳', desc: 'Taught learners across multiple Indian states', unlocked: true },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span>Official Digital Credential • TimeBank of India</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Digital Skill Passport 🛂
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Your verified lifelong record of peer learning, teaching mastery, and competency proofs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Skill Passport verification link copied to clipboard! (timebankindia.in/verify/' + currentUser.id + ')')}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Passport</span>
          </button>
        </div>
      </div>

      {/* OFFICIAL PASSPORT STAMP CARD */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-10 shadow-2xl border-2 border-amber-500/40 relative overflow-hidden">
        {/* Ashoka Chakra Watermark background */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full border-[12px] border-amber-500/10 pointer-events-none flex items-center justify-center">
          <div className="w-64 h-64 rounded-full border-4 border-dashed border-amber-500/10" />
        </div>

        <div className="relative z-10 space-y-6">
          {/* Header Seal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
            <div className="flex items-center gap-4">
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white">{currentUser.fullName}</h2>
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-xs text-amber-300/80 font-mono">
                  PASSPORT ID: IND-TBI-{currentUser.id.toUpperCase()}-2026
                </p>
                <p className="text-xs text-slate-300 mt-0.5">
                  {userData?.user?.city}, {userData?.user?.state} • {userData?.user?.languages?.join(', ')}
                </p>
              </div>
            </div>

            {/* Verification Stamp */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="w-20 h-20 rounded-full border-2 border-amber-400/80 flex flex-col items-center justify-center text-center rotate-[-6deg] bg-amber-500/10 p-1">
                <span className="text-[8px] font-mono tracking-widest text-amber-300 uppercase">TIMEBANK</span>
                <span className="text-[10px] font-black text-amber-400 leading-tight">VERIFIED</span>
                <span className="text-[7px] text-amber-300/80">BHARAT 🇮🇳</span>
              </div>
              <div className="text-right text-xs space-y-0.5">
                <div className="text-amber-400 font-bold">Trust Score</div>
                <div className="text-xl font-black">{userData?.user?.reputation_score || 85}/100</div>
                <div className="text-[10px] text-slate-400">{userData?.user?.trust_level || 'Trusted Member'}</div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Learning Hours</span>
              <span className="text-xl font-black text-blue-400">14.5 Hrs</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Teaching Hours</span>
              <span className="text-xl font-black text-green-400">
                {userData?.wallet ? (userData.wallet.total_earned).toFixed(1) : '12.0'} Hrs
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Time Credits</span>
              <span className="text-xl font-black text-amber-400">
                {currentUser.balance > 0 ? `+${currentUser.balance.toFixed(2)}` : currentUser.balance.toFixed(2)}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Learner Rating</span>
              <span className="text-xl font-black text-amber-300 flex items-center gap-1">
                <Star className="w-4 h-4 fill-current" /> 4.9
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1 & 2: LEARNING & TEACHING JOURNEYS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Teaching Journey */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-orange-500" /> Teaching Journey (What You Share)
            </h3>
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
              {userData?.teachingSkills?.length || 0} Verified Skills
            </span>
          </div>

          <div className="space-y-3">
            {userData?.teachingSkills?.map((skill: any) => (
              <div
                key={skill.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{skill.skill_name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                    {skill.final_score ? `${skill.final_score}/100 Readiness` : 'Verified'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Tier: <strong>{skill.readiness_tier || 'Ready'}</strong> • Level: {skill.experience_level}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                  <span>✓ Assessment Passed</span>
                  <span>✓ Practical Project Verified</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Journey */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Learning Journey (What You Learn)
            </h3>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
              {userData?.learningSkills?.length || 0} Tracks
            </span>
          </div>

          <div className="space-y-3">
            {userData?.learningSkills?.map((skill: any) => (
              <div
                key={skill.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{skill.skill_name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                    In Progress
                  </span>
                </div>
                <p className="text-xs text-slate-500">Current Level: {skill.experience_level}</p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: BADGES & NATIONAL MILESTONES (Section 60) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Competency Badges & Achievements
          </h3>
          <p className="text-xs text-slate-500">
            Earned through continuous teaching integrity, assessment mastery, and community impact.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border text-center transition-all ${
                badge.unlocked
                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-40'
              }`}
            >
              <div className="text-3xl mb-2">{badge.icon}</div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{badge.name}</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-tight">{badge.desc}</p>
              {badge.unlocked && (
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-2 inline-block">
                  Unlocked ✓
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
