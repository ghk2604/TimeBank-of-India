'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { broadcastRequestEvent } from '@/lib/realtime';
import { 
  Search, Filter, Star, Clock, Globe, Award, Sparkles, 
  Repeat, ArrowRight, CheckCircle2, ShieldCheck, UserCheck, X
} from 'lucide-react';

function MarketplaceContent() {
  const router = useRouter();
  const { currentUser, setCurrentUser, refreshUserData } = useApp();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [skills, setSkills] = useState<any[]>([]);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [learningGoal, setLearningGoal] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [duration, setDuration] = useState('60');
  const [preferredDate, setPreferredDate] = useState('Tomorrow');
  const [preferredTime, setPreferredTime] = useState('6:00 PM - 7:00 PM');
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadMarketplace();
  }, [selectedCategory, currentUser.id]);

  const loadMarketplace = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'ALL' ? '/api/skills' : `/api/skills?category=${selectedCategory}`;
      const [skillsRes, swapsRes] = await Promise.all([
        fetch(url),
        fetch(`/api/swap?userId=${currentUser.id}`),
      ]);
      const skillsData = await skillsRes.json();
      const swapsData = await swapsRes.json();

      setSkills(skillsData.skills || []);
      setSwaps(swapsData.swaps || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openBookingModal = (teacher: any, skill: any) => {
    setSelectedTeacher(teacher);
    setSelectedSkill(skill);
    setLearningGoal(`Master core concepts and practical implementation of ${skill.name}.`);
    setExpectedOutcome(`1. Understand architecture\n2. Solve 2 practical problems\n3. Gain live code review feedback`);
    setBookingModalOpen(true);
  };

  const submitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher || !selectedSkill) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: currentUser.id,
          teacherId: selectedTeacher.id,
          skillId: selectedSkill.id,
          learningGoal,
          expectedOutcome,
          preferredDate,
          preferredTime,
          duration: Number(duration),
        }),
      });

      const data = await res.json();
      if (data.success) {
        broadcastRequestEvent('REQUEST_CREATED', {
          requestId: data.requestId,
          learnerId: currentUser.id,
          learnerName: currentUser.fullName,
          learnerAvatar: currentUser.avatar,
          teacherId: selectedTeacher.id,
          teacherName: selectedTeacher.full_name,
          skillName: selectedSkill.name,
          duration: Number(duration),
          learningGoal,
          creditCost: Number(duration) <= 30 ? 0.5 : (Number(duration) <= 60 ? 1.0 : (Number(duration) <= 90 ? 1.5 : 2.0)),
        });
        setBookingSuccess(`Request dispatched instantly! ${selectedTeacher.full_name} has received the request in real time with 0 lag.`);
        refreshUserData();
      } else {
        alert(data.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flatten instructors with skill data
  const allInstructorCards: any[] = [];
  skills.forEach(skill => {
    skill.instructors?.forEach((inst: any) => {
      // Don't show current user as their own teacher
      if (inst.id !== currentUser.id) {
        // Calculate smart match percentage
        let matchScore = 85;
        const reasons = ['✓ Verified Skill Instructor'];
        if (inst.teaching_level?.includes('Beginner')) {
          matchScore += 8;
          reasons.push('✓ Beginner Friendly');
        }
        if (inst.languages?.includes('Telugu') || inst.languages?.includes('Hindi')) {
          matchScore += 4;
          reasons.push(`✓ Speaks ${inst.languages.join(', ')}`);
        }
        if (inst.avg_rating >= 4.8) {
          matchScore += 2;
          reasons.push('✓ Top Rated Mentor');
        }

        allInstructorCards.push({
          ...inst,
          skillName: skill.name,
          skillCategory: skill.category,
          skillId: skill.id,
          matchScore: Math.min(98, matchScore),
          matchReasons: reasons,
        });
      }
    });
  });

  // Filter instructors
  const filteredCards = allInstructorCards.filter(card => {
    const matchesSearch = 
      card.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.skillName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.city?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLang = selectedLanguage === 'ALL' || card.languages?.includes(selectedLanguage);

    return matchesSearch && matchesLang;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Skill Discovery & Teacher Marketplace 🇮🇳
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Find verified Indian peers to teach you 1-on-1 using Time Credits. (1 Hour = 1 Credit).
        </p>
      </div>

      {/* UNIQUE FEATURE: SKILL SWAP RECOMMENDATIONS (Section 36) */}
      {swaps.length > 0 && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-blue-900/10 to-green-600/10 border-2 border-orange-300 dark:border-orange-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400 font-extrabold text-sm">
            <Repeat className="w-4 h-4 text-orange-600 animate-spin" />
            <span>PERFECT SKILL SWAP OPPORTUNITIES DETECTED!</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            The platform identified mutual exchange opportunities where you and another user teach each other&apos;s desired skills:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {swaps.map((swap, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <img src={swap.otherUserAvatar} alt={swap.otherUserName} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">{swap.otherUserName}</h4>
                      <span className="text-[10px] text-slate-400">({swap.city})</span>
                    </div>
                    <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-0.5">
                      {swap.description}
                    </p>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Reputation: {swap.reputation}/100</span>
                  </div>
                </div>
                <button
                  onClick={() => openBookingModal(
                    { id: swap.otherUserId, full_name: swap.otherUserName, avatar: swap.otherUserAvatar, city: swap.city },
                    { id: 'skill-swap', name: swap.theyTeach }
                  )}
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-green-600 text-white text-xs font-bold shadow hover:scale-105 transition-transform"
                >
                  Initiate Swap
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search skills (e.g. Python, UI/UX, React, Math, English, Telugu)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 dark:text-white"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['ALL', 'TECHNOLOGY', 'EDUCATION', 'CREATIVE', 'PROFESSIONAL', 'LANGUAGES'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2 shrink-0">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="ALL">All Languages</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi (हिन्दी)</option>
            <option value="Telugu">Telugu (తెలుగు)</option>
          </select>
        </div>
      </div>

      {/* Instructors & Skills Grid with Smart Match Scores */}
      {filteredCards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card, idx) => (
            <div
              key={`${card.id}-${card.skillId}-${idx}`}
              className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header with Smart Match Badge (Section 34) */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={card.avatar}
                      alt={card.full_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-orange-200 dark:border-slate-700"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{card.full_name}</span>
                        <span title="Verified Member"><ShieldCheck className="w-3.5 h-3.5 text-blue-500" /></span>
                      </h3>
                      <p className="text-[11px] text-slate-400">{card.city}, {card.state}</p>
                    </div>
                  </div>

                  {/* Smart Match Score Badge */}
                  <div className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-black text-right">
                    {card.matchScore}% Match
                  </div>
                </div>

                {/* Skill Details */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase">
                      {card.skillCategory}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Level: <strong>{card.experience_level}</strong>
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {card.skillName}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" /> {card.avg_rating}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {card.final_score ? `${card.final_score}/100 Readiness` : 'Verified'}
                    </span>
                  </div>
                </div>

                {/* Match Reason Pills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {card.matchReasons?.slice(0, 3).map((r: string, rIdx: number) => (
                    <span
                      key={rIdx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div className="text-[11px] text-slate-400">
                  Cost: <strong className="text-slate-700 dark:text-slate-200">1.0 Credit / hr</strong>
                </div>
                <button
                  onClick={() => openBookingModal(card, { id: card.skillId, name: card.skillName })}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 hover:scale-105 transition-transform"
                >
                  <span>Request Session</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-500">No instructors found matching your search and filters.</p>
        </div>
      )}

      {/* BOOKING MODAL WITH LEARNING GOAL CONTRACT (Sections 39 & 40) */}
      {bookingModalOpen && selectedTeacher && selectedSkill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                  <Clock className="w-3 h-3" /> Learning Goal Contract
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Book Session with {selectedTeacher.full_name}
                </h3>
                <p className="text-xs text-slate-500">Skill: {selectedSkill.name}</p>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                <div>
                  <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-200">Request Sent in Real-Time! ⚡</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed mt-1">{bookingSuccess}</p>
                </div>

                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingModalOpen(false);
                      setBookingSuccess(null);
                      router.push('/sessions');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 text-white font-bold text-xs shadow hover:scale-105 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View My Sessions →</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingModalOpen(false);
                      setBookingSuccess(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitBooking} className="space-y-4 text-xs">
                {/* Micro-learning Duration Picker */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1.5 block">
                    Session Duration & Credit Cost (Formula: Minutes ÷ 60)
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { m: '15', cr: '0.25' },
                      { m: '30', cr: '0.50' },
                      { m: '45', cr: '0.75' },
                      { m: '60', cr: '1.00' },
                      { m: '90', cr: '1.50' },
                    ].map((d) => (
                      <button
                        type="button"
                        key={d.m}
                        onClick={() => setDuration(d.m)}
                        className={`p-2 rounded-xl text-center border transition-all ${
                          duration === d.m
                            ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-500 text-orange-700 dark:text-orange-300 font-bold'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="text-[11px] font-bold">{d.m} min</div>
                        <div className="text-[10px] text-slate-400">{d.cr} Cr</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Specific Session Goal */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Session Learning Goal *
                  </label>
                  <input
                    type="text"
                    required
                    value={learningGoal}
                    onChange={(e) => setLearningGoal(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="e.g. Master React custom hooks and state management"
                  />
                </div>

                {/* Expected Outcomes */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                    Expected Outcomes / Deliverables
                  </label>
                  <textarea
                    rows={2}
                    value={expectedOutcome}
                    onChange={(e) => setExpectedOutcome(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Expected achievements after the session"
                  />
                </div>

                {/* Preferred Date & Time */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Preferred Date</label>
                    <input
                      type="text"
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Preferred Slot</label>
                    <input
                      type="text"
                      value={preferredTime}
                      onChange={(e) => setPreferredTime(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Assurance Callout */}
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 space-y-1">
                  <p>🛡️ <strong>Zero Credit Block Guarantee:</strong> No credits are debited right now.</p>
                  <p>⏳ Teacher has exactly <strong>24 hours</strong> to respond or the request will auto-expire.</p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending Request...' : `Send Request (${(Number(duration)/60).toFixed(2)} Cr)`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading marketplace...</div>}>
      <MarketplaceContent />
    </React.Suspense>
  );
}
