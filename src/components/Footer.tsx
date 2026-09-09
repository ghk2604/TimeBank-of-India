'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { ShieldCheck, Heart, Sparkles, BookOpen, Layers, Award } from 'lucide-react';

export default function Footer() {
  const { t } = useApp();

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Strict Scope Alert Banner */}
      <div className="border-b border-slate-800 bg-slate-950/60 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-amber-400">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-semibold">Pure Skill & Knowledge Network:</span>
            <span className="text-slate-300">
              Strictly skill-based learning. No household chores, gardening, repairs, or non-educational services permitted.
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <span>Formula:</span>
            <code className="bg-slate-800 px-2 py-0.5 rounded text-orange-400 font-mono">1 Hour = 1 Credit</code>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Brand & Philosophy */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-blue-700 to-green-600 p-0.5 flex items-center justify-center font-bold text-white shadow-md">
                <span className="bg-slate-900 w-full h-full rounded-[10px] flex items-center justify-center text-xs font-black text-blue-400">
                  TBI
                </span>
              </div>
              <div>
                <h3 className="text-white font-bold text-base">TimeBank of India 🇮🇳</h3>
                <p className="text-xs text-orange-400 font-medium">Your Time. Your Knowledge. Your Growth.</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              India&apos;s pioneering peer-to-peer knowledge and skill exchange ecosystem where every citizen&apos;s time has equal value, enabling self-directed growth from Kashmir to Kanyakumari.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Supports:</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">English</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">हिन्दी</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">తెలుగు</span>
            </div>
          </div>

          {/* Column 2: Innovation Features */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-400" /> Platform Innovations
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/passport" className="hover:text-white transition-colors">
                  Digital Skill Passport
                </Link>
              </li>
              <li>
                <Link href="/gap-detector" className="hover:text-white transition-colors">
                  Knowledge Gap Detector
                </Link>
              </li>
              <li>
                <Link href="/learning-paths" className="hover:text-white transition-colors">
                  Smart Learning Paths
                </Link>
              </li>
              <li>
                <Link href="/knowledge-impact" className="hover:text-white transition-colors">
                  Knowledge Exchange Chain
                </Link>
              </li>
              <li>
                <Link href="/assessments" className="hover:text-white transition-colors">
                  Skill Proof & Readiness Engine
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Skill Economy */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-green-400" /> Skill Economy
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/wallet" className="hover:text-white transition-colors">
                  Time Credit Wallet
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-white transition-colors">
                  Credit Recovery Suggestions
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="hover:text-white transition-colors">
                  Skill Swap Matching
                </Link>
              </li>
              <li>
                <Link href="/sessions" className="hover:text-white transition-colors">
                  Learning Goal Contracts
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  24-Hour Expiry Rule
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: National Vision */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-400" /> Core Cycle
            </h4>
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-1 text-xs">
              <div className="font-semibold text-orange-400">LEARN → PROVE → TEACH → EARN → GROW</div>
              <p className="text-[11px] text-slate-400">
                A perpetual educational flywheel where learners evolve into recognized mentors, accelerating national talent.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
              100% Non-monetary • Non-expiring Credits • Multi-tier Trust
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} TimeBank of India. Dedicated to the learners & educators of Bharat.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/about" className="hover:text-white">About Us</Link>
            <Link href="/admin" className="hover:text-white">Admin Governance</Link>
            <span className="text-slate-600">|</span>
            <span className="text-orange-400 font-medium">Made with pride for India 🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
