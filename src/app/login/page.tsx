'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApp, DEMO_USERS } from '@/context/AppContext';
import { 
  Key, ShieldCheck, User, Lock, Mail, Phone, MapPin, 
  Sparkles, CheckCircle2, ArrowRight, Copy, Check, BookOpen, UserCheck, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'request-key' ? 'REQUEST_KEY' : searchParams.get('tab') === 'register' ? 'REGISTER' : 'LOGIN';

  const { currentUser, setCurrentUser, refreshUserData } = useApp();
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER' | 'REQUEST_KEY'>(initialTab);

  // Login Form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register Form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+91 ');
  const [regCity, setRegCity] = useState('Hyderabad');
  const [regState, setRegState] = useState('Telangana');
  const [regSkillTeach, setRegSkillTeach] = useState('skill-1');
  const [regSkillLearn, setRegSkillLearn] = useState('skill-2');
  const [regAccessKey, setRegAccessKey] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  // Request Key Form state
  const [keyName, setKeyName] = useState('');
  const [keyEmail, setKeyEmail] = useState('');
  const [keyInstitution, setKeyInstitution] = useState('');
  const [keyPurpose, setKeyPurpose] = useState('STUDENT_BETA');
  const [generatedKey, setGeneratedKey] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);

  // Available Skills
  const [skills, setSkills] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => setSkills(data.skills || []))
      .catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: loginIdentifier,
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        refreshUserData();
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        router.push('/dashboard');
      } else {
        setLoginError(data.error || 'Failed to login');
      }
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regPassword || regPassword.trim().length < 6) {
      setRegError('Password is mandatory and must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    setRegLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName,
          username: regUsername,
          email: regEmail,
          phone: regPhone,
          password: regPassword.trim(),
          city: regCity,
          state: regState,
          skillToTeachId: regSkillTeach,
          skillToLearnId: regSkillLearn,
          accessKey: regAccessKey,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
        refreshUserData();
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        router.push('/dashboard');
      } else {
        setRegError(data.error || 'Registration failed');
      }
    } catch (err: any) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const handleRequestKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyLoading(true);

    try {
      const res = await fetch('/api/auth/request-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: keyName,
          email: keyEmail,
          institution: keyInstitution,
          purpose: keyPurpose,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedKey(data);
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      } else {
        alert(data.error || 'Key generation failed');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setKeyLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-300 text-xs font-bold">
          <Key className="w-3.5 h-3.5 text-orange-600" />
          <span>India&apos;s Peer-to-Peer Learning Network</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Access TimeBank of India 🇮🇳
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Sign in to your Time Wallet, create a new account with 1.0 free credit, or request an institutional key.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center">
        <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-center gap-1.5">
          <button
            onClick={() => { setActiveTab('LOGIN'); setLoginError(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'LOGIN'
                ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setActiveTab('REGISTER'); setRegError(null); }}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'REGISTER'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Register Account</span>
          </button>
          <button
            onClick={() => setActiveTab('REQUEST_KEY')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'REQUEST_KEY'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Request Access Key</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SIGN IN */}
      {activeTab === 'LOGIN' && (
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Sign In to Your Account</h2>
            <p className="text-xs text-slate-500">Enter your email or username to access your Time Wallet and sessions.</p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Email or Username</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="rahul@timebankindia.in or rahulkumar"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Password *</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                🔑 Demo Persona Accounts Password: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-orange-600 font-bold">India@123</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              <span>{loginLoading ? 'Signing In...' : 'Sign In with Password'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Personas */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Quick 1-Click Persona Sign In (Password Verified)
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    setLoginIdentifier(u.email || u.username);
                    setLoginPassword('India@123');
                    setCurrentUser(u);
                    refreshUserData();
                    router.push('/dashboard');
                  }}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900 hover:bg-orange-50 dark:hover:bg-orange-950/40 border border-slate-200 dark:border-slate-700 text-left flex items-center gap-2 transition-colors"
                >
                  <img src={u.avatar} alt={u.fullName} className="w-6 h-6 rounded-full object-cover" />
                  <div className="truncate">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{u.fullName.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-400">{u.role}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTER */}
      {activeTab === 'REGISTER' && (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Register New TimeBank Account</h2>
            <p className="text-xs text-slate-500">
              Join India&apos;s knowledge exchange economy. Start with <strong>1.0 Free Time Credit</strong> and controlled borrowing!
            </p>
          </div>

          {regError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{regError}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Harikrishna Reddy"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Username *</label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="harikrishna"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Email Address *</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="hari@example.com"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Mobile Number (India)</label>
                <input
                  type="text"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">City</label>
                <input
                  type="text"
                  value={regCity}
                  onChange={(e) => setRegCity(e.target.value)}
                  placeholder="Hyderabad / Bengaluru"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">State</label>
                <input
                  type="text"
                  value={regState}
                  onChange={(e) => setRegState(e.target.value)}
                  placeholder="Telangana / Karnataka / Andhra Pradesh"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* MANDATORY PASSWORD CREATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                  Create Password * <span className="font-normal text-slate-400 text-[10px]">(Min 6 characters)</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Create password"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Confirm Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPasswordReg"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-slate-300 text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="showPasswordReg" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                Show password characters
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Skill You Can Teach</label>
                <select
                  value={regSkillTeach}
                  onChange={(e) => setRegSkillTeach(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Skill You Want to Learn</label>
                <select
                  value={regSkillLearn}
                  onChange={(e) => setRegSkillLearn(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Access Key / Invitation Code */}
            <div className="p-3.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900">
              <label className="font-bold text-orange-900 dark:text-orange-300 mb-1 block flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-orange-600" />
                <span>TimeBank Access / Invitation Key (Optional)</span>
              </label>
              <input
                type="text"
                value={regAccessKey}
                onChange={(e) => setRegAccessKey(e.target.value.toUpperCase())}
                placeholder="e.g. TBI-KEY-2026-XXXX"
                className="w-full p-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Have a key? Enter it to receive <strong>+1.5 bonus Time Credits</strong> and an upgraded borrowing limit!
              </p>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-green-600 text-white font-bold shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              <span>{regLoading ? 'Activating Account...' : 'Complete Registration & Start Learning'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: REQUEST ACCESS KEY */}
      {activeTab === 'REQUEST_KEY' && (
        <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-800 border-2 border-orange-400/80 shadow-lg space-y-6">
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 uppercase tracking-wider">
              <Sparkles className="w-3 h-3" /> Early Access & Verified Partners
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
              Request a TimeBank Access Key 🔑
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Generate an official invitation key for student beta access, verified mentor onboarding, or educational institutional partnerships.
            </p>
          </div>

          {generatedKey ? (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 text-white shadow-xl space-y-4 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center mx-auto shadow-md">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase">
                  VERIFIED INVITATION KEY
                </span>
                <div className="text-2xl font-mono font-black tracking-wider text-white mt-1">
                  {generatedKey.keyCode}
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Granted: <strong>+{generatedKey.starterCredits} Starter Credits</strong> • Upgraded Trust Tier
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatedKey.keyCode)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Key'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegAccessKey(generatedKey.keyCode);
                    setActiveTab('REGISTER');
                  }}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <span>Register with this Key</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRequestKey} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Full Name *</label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Ananya Sen"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Email Address *</label>
                <input
                  type="email"
                  required
                  value={keyEmail}
                  onChange={(e) => setKeyEmail(e.target.value)}
                  placeholder="ananya@college.edu or ananya@gmail.com"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">College, University, or Company</label>
                <input
                  type="text"
                  value={keyInstitution}
                  onChange={(e) => setKeyInstitution(e.target.value)}
                  placeholder="e.g. IIT Hyderabad / BITS Pilani / Self-learner"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Key Purpose</label>
                <select
                  value={keyPurpose}
                  onChange={(e) => setKeyPurpose(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="STUDENT_BETA">Student Beta Access (+1.5 Starter Credits)</option>
                  <option value="MENTOR_EARLY_ACCESS">Verified Mentor Enrollment (+2.0 Starter Credits)</option>
                  <option value="INSTITUTION_PARTNER">College / Institution Learning Circle</option>
                  <option value="PASSPORT_VERIFIER_API">Skill Passport Verifier / Developer API</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={keyLoading}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                <span>{keyLoading ? 'Generating Key...' : 'Request & Generate Key Instantly'}</span>
                <Key className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">Loading account portal...</div>}>
      <LoginContent />
    </React.Suspense>
  );
}
