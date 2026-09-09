'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Zap, Users, ArrowRight, Share2, Award, Sparkles, GitFork, BookOpen } from 'lucide-react';

export default function KnowledgeImpactPage() {
  const { currentUser } = useApp();
  const [impactData, setImpactData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/impact?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(data => setImpactData(data.impact))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUser.id]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-300 text-xs font-bold mb-2">
          <Zap className="w-3.5 h-3.5 text-orange-600" />
          <span>Section 37 & 59: Pedagogical Lineage & Multi-Tier Reach</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Your Knowledge Impact & Exchange Chain 🌳
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Track how the skills you share ripple across India. When your students go on to teach others, your educational lineage expands.
        </p>
      </div>

      {/* AGGREGATE IMPACT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Direct Learners
          </span>
          <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-2">
            {impactData?.directLearnersCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Taught by you</span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Downstream Reach
          </span>
          <div className="text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {impactData?.extendedReachCount || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Via your students</span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Reach
          </span>
          <div className="text-3xl font-black text-green-600 dark:text-green-400 mt-2">
            {impactData?.totalKnowledgeReach || 0}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">
            Minds Empowered
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Students → Teachers
          </span>
          <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {impactData?.learnersWhoBecameTeachers || 0}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Now mentoring</span>
        </div>
      </div>

      {/* VISUAL KNOWLEDGE LINEAGE TREE */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <GitFork className="w-5 h-5 text-orange-500" /> Pedagogical Tree Lineage
          </h2>
          <p className="text-xs text-slate-500">
            Visualizing the ripple effect: You taught your learners, who then paid it forward.
          </p>
        </div>

        {/* Tree Root: Current User */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-3 p-3.5 rounded-2xl bg-orange-50 dark:bg-orange-950/60 border-2 border-orange-400 shadow-sm">
            <img src={currentUser.avatar} alt={currentUser.fullName} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block">Origin Mentor</span>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{currentUser.fullName}</h3>
            </div>
          </div>

          {/* Direct Branches */}
          <div className="space-y-6 pl-6 sm:pl-10 border-l-2 border-dashed border-orange-300 dark:border-slate-700">
            {impactData?.chain?.length > 0 ? (
              impactData.chain.map((branch: any, bIdx: number) => (
                <div key={bIdx} className="space-y-3 relative">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <img src={branch.learnerAvatar} alt={branch.learnerName} className="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {branch.learnerName}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                            Learned {branch.skill}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Session Date: {new Date(branch.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {branch.secondaryLearners?.length > 0 ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 self-start sm:self-auto">
                        Became a Mentor ({branch.secondaryLearners.length} Students)
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 self-start sm:self-auto">
                        Preparing for Skill Assessment
                      </span>
                    )}
                  </div>

                  {/* Secondary Leaves if any */}
                  {branch.secondaryLearners?.length > 0 && (
                    <div className="pl-6 sm:pl-10 border-l-2 border-dashed border-purple-300 dark:border-purple-900 space-y-2">
                      {branch.secondaryLearners.map((sub: any, sIdx: number) => (
                        <div key={sIdx} className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img src={sub.subAvatar} alt={sub.subLearnerName} className="w-7 h-7 rounded-full object-cover" />
                            <div>
                              <h5 className="text-xs font-bold text-slate-900 dark:text-white">{sub.subLearnerName}</h5>
                              <p className="text-[10px] text-slate-400">Learned: {sub.skill}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-semibold text-purple-700 dark:text-purple-300">
                            2nd Generation Reach ✨
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-xs text-slate-400">
                Teach your first session to initiate your personal Knowledge Lineage tree!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
