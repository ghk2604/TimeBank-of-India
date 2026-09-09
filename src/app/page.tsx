'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { 
  ArrowRight, Sparkles, CheckCircle2, Clock, ShieldCheck, 
  Award, TrendingUp, Users, Brain, Repeat, Zap, Compass, Star, ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const { t, currentUser, isLoggedIn, setShowAuthModal } = useApp();
  const [skills, setSkills] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => setSkills(data.skills?.slice(0, 6) || []))
      .catch(() => {});

    fetch('/api/admin')
      .then(res => res.json())
      .then(data => setStats(data.stats))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden tricolor-gradient pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-slate-200 dark:border-slate-800">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* New User Verification Banner */}
            {!isLoggedIn && (
              <div 
                onClick={() => setShowAuthModal(true)}
                className="cursor-pointer inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500/15 via-white/80 to-green-500/15 dark:from-orange-950/60 dark:via-slate-800 dark:to-green-950/60 border-2 border-orange-400/60 shadow-md hover:scale-105 transition-all text-xs font-bold text-slate-800 dark:text-slate-100 animate-in fade-in"
              >
                <span className="flex h-2.5 w-2.5 rounded-full bg-orange-500 animate-ping" />
                <span>📱 First time visitor? Verify with Mobile (+91) or Email OTP to claim <strong>+1.0 Free Starter Credit</strong>!</span>
                <span className="text-orange-600 dark:text-orange-400 underline">Verify Now →</span>
              </div>
            )}

            {/* Tagline */}
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
              Your Time. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-blue-700 to-green-600 dark:from-orange-400 dark:via-blue-400 dark:to-green-400">
                Your Knowledge.
              </span> <br className="hidden sm:inline" />
              Your Growth.
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
              {t.subTagline}
            </p>

            {/* Strict Rule Pill */}
            <div className="inline-flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-4 py-2 rounded-xl text-xs font-medium">
              <Clock className="w-4 h-4 text-orange-500 shrink-0" />
              <span>
                <strong>1 Hour of Teaching = 1 Time Credit</strong> • Micro-learning supported (15m = 0.25 Cr, 30m = 0.50 Cr)
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {!isLoggedIn ? (
                <>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                  >
                    <span>Sign In or Register with OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <Link
                    href="/marketplace"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm sm:text-base border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>{t.hero.ctaExplore}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/marketplace"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                  >
                    <span>{t.hero.ctaExplore}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm sm:text-base border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Go to Dashboard</span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </>
              )}
            </div>

            {/* Controlled Borrowing Assurance */}
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ✨ New to platform? Borrow up to <strong>-1.0 Credit</strong> to begin your first session immediately!
            </p>
          </div>
        </div>
      </section>

      {/* CORE MODEL: LEARN → PROVE → TEACH → EARN → GROW */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-widest mb-2">
            <Repeat className="w-3.5 h-3.5" /> Perpetual Knowledge Flywheel
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
            LEARN → PROVE → TEACH → EARN → GROW
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Every citizen has knowledge to share and something new to learn. Here is how our skill ecosystem works:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 sm:gap-6 relative">
          {/* Step 1: Learn */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:border-orange-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-lg mb-4">
              01
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">{t.cycle.learn}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.cycle.learnDesc}</p>
          </div>

          {/* Step 2: Prove */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:border-blue-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-lg mb-4">
              02
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">{t.cycle.prove}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.cycle.proveDesc}</p>
          </div>

          {/* Step 3: Teach */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:border-green-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-950/60 text-green-600 dark:text-green-400 flex items-center justify-center font-black text-lg mb-4">
              03
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">{t.cycle.teach}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.cycle.teachDesc}</p>
          </div>

          {/* Step 4: Earn */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:border-amber-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg mb-4">
              04
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">{t.cycle.earn}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.cycle.earnDesc}</p>
          </div>

          {/* Step 5: Grow */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm relative group hover:border-purple-400 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black text-lg mb-4">
              05
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">{t.cycle.grow}</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t.cycle.growDesc}</p>
          </div>
        </div>
      </section>

      {/* STRICT SCOPE GUARD SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 text-xs font-semibold mb-4 border border-rose-500/30">
                <ShieldCheck className="w-3.5 h-3.5" /> High Standards & Focus
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-4">
                Not a General Service Marketplace
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                TimeBank of India is dedicated solely to <strong>intellectual skill sharing, academic tutoring, technology education, professional craft, and languages</strong>.
              </p>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-400 font-bold">✓ ALLOWED:</span>
                  <span>Python, Next.js, UI/UX, IIT-JEE Physics, Spoken English, Telugu, Linear Algebra</span>
                </div>
                <div className="flex items-center gap-2.5 text-rose-400">
                  <span className="font-bold">❌ STRICTLY FORBIDDEN:</span>
                  <span>Gardening, cooking, physical repairs, housekeeping, volunteering, or chores</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                <Clock className="w-6 h-6 text-orange-400 mb-2" />
                <h4 className="font-bold text-sm text-white">24h Response Rule</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Teachers must accept or decline within 24 hours, or the request auto-expires with zero credit deduction.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                <Award className="w-6 h-6 text-blue-400 mb-2" />
                <h4 className="font-bold text-sm text-white">Digital Skill Passport</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Official verified record of your completed learning hours, teaching contributions, and validated badges.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                <Brain className="w-6 h-6 text-green-400 mb-2" />
                <h4 className="font-bold text-sm text-white">Skill Readiness Score</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Transparent 0-100 score reflecting assessment proficiency, practical portfolio, and learner reviews.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                <Repeat className="w-6 h-6 text-amber-400 mb-2" />
                <h4 className="font-bold text-sm text-white">Credit Recovery</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Negative balance? Get matched with learners eager to learn your skills so you can teach and recover!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR SKILLS & TEACHERS DISCOVERY */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Explore Featured Skills
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Connect 1-on-1 with verified mentors from Hyderabad, Bengaluru, Visakhapatnam, Delhi, and beyond.
            </p>
          </div>
          <Link
            href="/marketplace"
            className="text-xs sm:text-sm font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
          >
            <span>View all skills & teachers</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                    {skill.category}
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {skill.teacher_count} Mentors
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {skill.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {skill.description}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex -space-x-2 overflow-hidden">
                  {skill.instructors?.slice(0, 3).map((inst: any) => (
                    <img
                      key={inst.id}
                      src={inst.avatar}
                      alt={inst.full_name}
                      title={`${inst.full_name} (${inst.city})`}
                      className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-800 object-cover"
                    />
                  ))}
                </div>
                <Link
                  href={`/marketplace?search=${encodeURIComponent(skill.name)}`}
                  className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                >
                  <span>Book Session</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PLATFORM METRICS */}
      <section className="bg-slate-100 dark:bg-slate-800/50 py-12 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-orange-600 dark:text-orange-400 mb-1">
                {stats?.total_credits_circulated ? `${stats.total_credits_circulated} Cr` : '24.5 Cr'}
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Time Credits Exchanged
              </div>
            </div>

            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-blue-600 dark:text-blue-400 mb-1">
                100%
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Peer Knowledge Based
              </div>
            </div>

            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-green-600 dark:text-green-400 mb-1">
                {stats?.completed_sessions || '18'}
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Completed Sessions
              </div>
            </div>

            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-purple-600 dark:text-purple-400 mb-1">
                ∞ Never
              </div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Credit Expiration Date
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-orange-500 via-blue-900 to-green-600 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-4 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Share What You Know and Learn What You Need?
            </h3>
            <p className="text-sm text-white/90 leading-relaxed font-normal">
              Join thousands of Indian students, engineers, educators, and creators in a cooperative credit economy where knowledge has true dignity.
            </p>
            <div className="pt-3">
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-slate-900 font-extrabold text-sm hover:bg-slate-100 shadow-lg hover:scale-105 transition-transform"
              >
                <span>Find Your First Mentor</span>
                <ArrowRight className="w-4 h-4 text-orange-600" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
