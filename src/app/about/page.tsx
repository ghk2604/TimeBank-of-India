'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, Heart, Users, Sparkles, BookOpen, Clock, 
  CheckCircle2, ArrowRight, Layers, Award
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-300 text-xs font-bold">
          <span>🇮🇳 The Spirit of Bharat</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
          Everyone knows something. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-blue-700 to-green-600">
            Everyone can learn something.
          </span> <br />
          Everyone can grow.
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          TimeBank of India is India&apos;s pioneering peer-to-peer skill learning and knowledge exchange network. We replace financial barriers with the universal currency of time.
        </p>
      </div>

      {/* Vision & Mission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center font-bold text-xl">
            🔭
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Our Vision</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            To create an equitable, pan-Indian knowledge ecosystem where educational growth is democratized. Every citizen&apos;s time has equal value: <strong>1 hour of a student teaching Python equals 1 hour of a senior doctor teaching physics</strong>.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950 text-green-600 flex items-center justify-center font-bold text-xl">
            🎯
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Our Mission</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            To empower millions of learners across India to acquire high-demand digital and academic skills, prove their competency through rigorous tasks, pay it forward by teaching peers, and continually elevate their careers without debt.
          </p>
        </div>
      </div>

      {/* STRICT BOUNDARIES RE-AFFIRMATION */}
      <div className="p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" /> Strict Boundaries & Focus
        </div>
        <h3 className="text-2xl font-black">Pure Knowledge Exchange, Not an Errands Marketplace</h3>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          TimeBank of India is deliberately designed to protect educational integrity. We strictly prohibit physical chores, household help, gardening, cooking, or general community maintenance. Only <strong>intellectual, creative, technological, academic, and language-based learning</strong> is permitted.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700">
            <span className="font-bold text-orange-400 block mb-1">1 Hour = 1 Credit</span>
            <span className="text-slate-400">Standardized conversion across all domains regardless of background.</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700">
            <span className="font-bold text-blue-400 block mb-1">Controlled Borrowing</span>
            <span className="text-slate-400">New learners can borrow down to -1.0 Credit to start immediately.</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700">
            <span className="font-bold text-emerald-400 block mb-1">Permanent Value</span>
            <span className="text-slate-400">Time Credits never expire; your contributed time retains value forever.</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-lg hover:scale-105 transition-transform"
        >
          <span>Explore Platform Skills</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
