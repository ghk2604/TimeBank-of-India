'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, ArrowRight, CheckCircle2, ChevronRight, Users, BookOpen } from 'lucide-react';

export default function LearningPathsPage() {
  const [selectedPath, setSelectedPath] = useState('fullstack');

  const paths = [
    {
      id: 'fullstack',
      title: 'Full Stack Web Software Engineer',
      targetRole: 'Full Stack Developer',
      description: 'Master modern full stack application development from client-side component architecture to server actions, APIs, and scalable databases.',
      steps: [
        { order: 1, skill: 'HTML & CSS Fundamentals', prereq: 'Basic Computer Operations', mentors: 'Priya Sharma, Vikram Patel', credits: '1.0' },
        { order: 2, skill: 'Python or JavaScript Syntax & OOP', prereq: 'Variables, loops, and basic functions', mentors: 'Rahul Kumar, Anjali Rao', credits: '1.0' },
        { order: 3, skill: 'UI/UX Design Systems & Figma', prereq: 'HTML/CSS Layouts', mentors: 'Priya Sharma', credits: '1.0' },
        { order: 4, skill: 'Web Development (React & Next.js)', prereq: 'JavaScript ES6+, DOM manipulation', mentors: 'Rahul Kumar, Vikram Patel', credits: '1.0' },
        { order: 5, skill: 'Data Structures & Algorithms', prereq: 'Arrays, Objects, Recursion', mentors: 'Rahul Kumar', credits: '1.0' },
      ]
    },
    {
      id: 'ai-ml',
      title: 'AI & Machine Learning Specialist',
      targetRole: 'Machine Learning Engineer',
      description: 'From mathematical foundations in linear algebra to production predictive modeling, neural networks, and model evaluation.',
      steps: [
        { order: 1, skill: 'Python Programming for Scientific Computing', prereq: 'None', mentors: 'Rahul Kumar', credits: '1.0' },
        { order: 2, skill: 'Mathematics (Calculus & Linear Algebra)', prereq: 'High School Algebra', mentors: 'Anjali Rao, Dr. Neha Verma', credits: '1.0' },
        { order: 3, skill: 'Machine Learning Fundamentals & Scikit-Learn', prereq: 'Python & Linear Algebra', mentors: 'Dr. Neha Verma', credits: '1.0' },
        { order: 4, skill: 'Data Structures & Algorithmic Optimization', prereq: 'Python Functions', mentors: 'Rahul Kumar', credits: '1.0' },
      ]
    },
    {
      id: 'leadership',
      title: 'Global Tech Leadership & Communication',
      targetRole: 'Engineering Manager & Tech Lead',
      description: 'Develop executive presence, crisp impromptu articulation, public speaking, and strategic technical cross-team alignment.',
      steps: [
        { order: 1, skill: 'English Communication & Voice Modulation', prereq: 'Conversational English', mentors: 'Anjali Rao', credits: '0.75' },
        { order: 2, skill: 'Executive Presentation & Speech Structuring', prereq: 'Basic Public Speaking', mentors: 'Rahul Kumar, Anjali Rao', credits: '1.0' },
        { order: 3, skill: 'Technical Architecture Defense & Reviews', prereq: 'Software Engineering Exp', mentors: 'Dr. Neha Verma', credits: '1.0' },
      ]
    }
  ];

  const currentPath = paths.find(p => p.id === selectedPath) || paths[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-300 text-xs font-bold mb-2">
          <Layers className="w-3.5 h-3.5 text-orange-600" />
          <span>Section 32: Smart Structured Learning Paths</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Structured Learning Roadmaps 🗺️
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Follow verified sequential roadmaps where each milestone connects you with specialized Indian peer teachers.
        </p>
      </div>

      {/* Path Selector Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {paths.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelectedPath(p.id)}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedPath === p.id
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Selected Roadmap Showcase */}
      <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
        <div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase">
            Goal: {currentPath.targetRole}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2">
            {currentPath.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            {currentPath.description}
          </p>
        </div>

        {/* Sequential Step Timeline */}
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
          {currentPath.steps.map((step, idx) => (
            <div key={idx} className="relative flex items-start gap-5 pl-2">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 z-10 shadow-md">
                {step.order}
              </div>

              <div className="flex-1 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                    {step.skill}
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
                    {step.credits} Time Credit
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Prerequisites: <strong className="text-slate-700 dark:text-slate-300">{step.prereq}</strong>
                </p>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    <span>Top Mentors: {step.mentors}</span>
                  </div>

                  <Link
                    href={`/marketplace?search=${encodeURIComponent(step.skill.split(' ')[0])}`}
                    className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>Book Milestone Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
