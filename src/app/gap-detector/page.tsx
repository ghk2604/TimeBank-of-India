'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, CheckCircle2, XCircle, AlertCircle, ArrowRight, 
  Sparkles, Compass, UserCheck, ShieldCheck, ChevronRight
} from 'lucide-react';

export default function GapDetectorPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState('track-fullstack');
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/gap-detector')
      .then(res => res.json())
      .then(data => {
        setTracks(data.tracks || []);
        if (data.tracks?.length > 0) {
          setSelectedTrackId(data.tracks[0].id);
        }
      });
  }, []);

  const activeTrack = tracks.find(t => t.id === selectedTrackId);

  const handleToggleAnswer = (questionId: string, val: boolean) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const handleRunDiagnostic = async () => {
    if (!activeTrack) return;

    try {
      setLoading(true);
      const res = await fetch('/api/gap-detector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: selectedTrackId,
          answers,
        }),
      });

      const data = await res.json();
      setDiagnosis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-bold mb-2">
          <Search className="w-3.5 h-3.5 text-blue-600" />
          <span>Section 33: Diagnostic Readiness Tool</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Knowledge Gap Detector 🔍
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Don&apos;t waste Time Credits on advanced topics before mastering prerequisites. Detect your baseline knowledge gaps and find the ideal starting point.
        </p>
      </div>

      {/* Domain Track Selection */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {tracks.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setSelectedTrackId(t.id);
              setAnswers({});
              setDiagnosis(null);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedTrackId === t.id
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            {t.title}
          </button>
        ))}
      </div>

      {/* DIAGNOSTIC RESULTS MODAL/CARD */}
      {diagnosis && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border-2 border-orange-400 shadow-xl space-y-6 animate-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                <Sparkles className="w-4 h-4" /> Diagnostic Complete
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Your Readiness: {diagnosis.evaluatedLevel} ({diagnosis.proficiencyPercentage}%)
              </h3>
            </div>
            <button
              onClick={() => setDiagnosis(null)}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Reset Test
            </button>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {diagnosis.advice}
          </p>

          {/* Identified Gaps */}
          {diagnosis.identifiedGaps?.length > 0 ? (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 space-y-2">
              <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Detected Missing Foundations:
              </h4>
              <div className="flex flex-wrap gap-2">
                {diagnosis.identifiedGaps.map((gap: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    ⚠️ {gap}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Zero foundational gaps detected! You are fully equipped to begin {diagnosis.targetSkill}.</span>
            </div>
          )}

          {/* Recommended Starting Point & Verified Teachers */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recommended Starting Skill & Mentors
            </h4>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  Optimal Next Step
                </span>
                <h5 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                  {diagnosis.startingSkill}
                </h5>
                <p className="text-xs text-slate-500">
                  Book a 30m or 60m session to eliminate this gap before proceeding.
                </p>
              </div>

              <Link
                href={`/marketplace?search=${encodeURIComponent(diagnosis.startingSkill)}`}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow flex items-center gap-1.5 self-start sm:self-auto shrink-0"
              >
                <span>Find {diagnosis.startingSkill.split(' ')[0]} Teachers</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* QUESTIONNAIRE */}
      {activeTrack && !diagnosis && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase">
              {activeTrack.category}
            </span>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-2">
              {activeTrack.title} Diagnostic
            </h3>
            <p className="text-xs text-slate-500 mt-1">{activeTrack.description}</p>
          </div>

          <div className="space-y-4">
            {activeTrack.questions.map((q: any, idx: number) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                    {idx + 1}. {q.text}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 shrink-0">
                    Prereq: {q.skillPrereq}
                  </span>
                </div>

                {/* Yes / No Toggle Buttons */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleAnswer(q.id, true)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      answers[q.id] === true
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Yes, Confident</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleAnswer(q.id, false)}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      answers[q.id] === false
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>No / Needs Practice</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-end">
            <button
              onClick={handleRunDiagnostic}
              disabled={loading || Object.keys(answers).length < activeTrack.questions.length}
              className="px-8 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
            >
              <span>{loading ? 'Analyzing Gaps...' : 'Evaluate Knowledge Gaps'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
