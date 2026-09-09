'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Award, CheckCircle2, XCircle, Sparkles, Brain, ArrowRight, 
  HelpCircle, Code, ShieldCheck, Coins, RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AssessmentsPage() {
  const { currentUser, refreshUserData } = useApp();
  const [selectedSkillId, setSelectedSkillId] = useState('skill-1');
  const [quizData, setQuizData] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [practicalUrl, setPracticalUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/assessments?skillId=${selectedSkillId}`)
      .then(res => res.json())
      .then(data => {
        setQuizData(data.quiz);
        setAnswers({});
        setResult(null);
      });
  }, [selectedSkillId]);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizData) return;

    // Verify all questions answered
    const unanswered = quizData.questions.some((q: any) => answers[q.id] === undefined);
    if (unanswered) {
      alert('Please answer all assessment questions before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          skillId: selectedSkillId,
          answers,
          practicalUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        refreshUserData();
        if (data.passed) {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Section 28-30: Learn → Prove → Teach Competency Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Skill Proof & Readiness Assessment 🧠
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Validate your knowledge to unlock your official <strong>Skill Readiness Score</strong> and earn <strong>+0.25 Time Credits</strong> (Method B Verified Reward).
        </p>
      </div>

      {/* Skill Selector Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {[
          { id: 'skill-1', name: 'Python Programming' },
          { id: 'skill-2', name: 'UI/UX Design' },
          { id: 'skill-3', name: 'Web Dev (React & Next.js)' },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSkillId(s.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedSkillId === s.id
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Results Card after completion */}
      {result && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border-2 border-emerald-400 shadow-xl space-y-6 animate-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>Assessment Completed!</span>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {quizData.skillName} Competency Verified
              </h3>
            </div>
            {result.creditBonus > 0 && (
              <div className="px-4 py-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <Coins className="w-4 h-4" />
                <span>+{result.creditBonus} Time Credit Earned</span>
              </div>
            )}
          </div>

          {/* Skill Readiness Score Breakdown (Section 30) */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Skill Readiness Score Breakdown (0-100)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block">Assessment (30%)</span>
                <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {result.assessmentScore}%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block">Practical Task (25%)</span>
                <span className="text-xl font-black text-green-600 dark:text-green-400">
                  88%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block">Learning Exp (20%)</span>
                <span className="text-xl font-black text-purple-600 dark:text-purple-400">
                  80%
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 text-center">
                <span className="text-[10px] text-slate-400 block">Teaching Reviews (25%)</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                  85%
                </span>
              </div>
            </div>

            {/* Total Score Bar */}
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Final Readiness Tier:</span>
                <span className="ml-2 text-sm font-black text-emerald-700 dark:text-emerald-400">
                  {result.readinessTier} ({result.finalReadinessScore}/100)
                </span>
              </div>
              <button
                onClick={() => setResult(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-semibold hover:bg-slate-300"
              >
                Retake
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ QUESTIONS FORM */}
      {quizData && !result && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Part 1: Knowledge Assessment ({quizData.skillName})
              </h3>
              <p className="text-xs text-slate-500">
                Minimum score to qualify for verified competency is <strong>70%</strong>.
              </p>
            </div>

            <div className="space-y-6">
              {quizData.questions?.map((q: any, qIdx: number) => (
                <div key={q.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    {qIdx + 1}. {q.question}
                  </div>
                  <div className="space-y-2">
                    {q.options.map((opt: string, optIdx: number) => (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                          answers[q.id] === optIdx
                            ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-900 dark:text-orange-200 font-semibold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === optIdx}
                          onChange={() => handleSelectOption(q.id, optIdx)}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Part 2: Practical Task Submission (Section 29) */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-500" /> Part 2: Practical Task / Portfolio Proof
              </h3>
              <p className="text-xs text-slate-500">
                Provide a URL to a real project (GitHub repository, Figma file, article, or slide deck) demonstrating your real-world craft.
              </p>
              <input
                type="url"
                value={practicalUrl}
                onChange={(e) => setPracticalUrl(e.target.value)}
                placeholder="https://github.com/username/project or https://figma.com/@file"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Evaluating Submission...' : 'Submit Assessment & Calculate Readiness'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
