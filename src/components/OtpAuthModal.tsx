'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useApp, DEMO_USERS, CurrentUser } from '@/context/AppContext';
import { 
  Phone, Mail, Key, ShieldCheck, Sparkles, ArrowRight, 
  CheckCircle2, AlertCircle, RefreshCw, X, User, MapPin, 
  BookOpen, Clock, HeartHandshake, Check, Copy, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OtpAuthModalProps {
  isPageMode?: boolean; // When rendered directly inside /login page
  onSuccess?: (user: CurrentUser) => void;
}

export default function OtpAuthModal({ isPageMode = false, onSuccess }: OtpAuthModalProps) {
  const { showAuthModal, setShowAuthModal, login, setCurrentUser } = useApp();

  // Mode: 'PHONE' | 'EMAIL'
  const [channel, setChannel] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  
  // Step: 1 = Enter Identifier, 2 = Enter OTP, 3 = Complete Profile (New User)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  
  // OTP input state (6 digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Feedback & Loading
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isExistingUser, setIsExistingUser] = useState<boolean>(false);
  const [existingUserName, setExistingUserName] = useState<string | null>(null);
  const [realDeliverySuccess, setRealDeliverySuccess] = useState<boolean>(false);
  const [realDeliveryProvider, setRealDeliveryProvider] = useState<string>('SIMULATED');
  const [realDeliveryError, setRealDeliveryError] = useState<string | null>(null);
  const [showGatewayInfo, setShowGatewayInfo] = useState<boolean>(false);

  // Countdown timer for OTP expiry
  const [timerSeconds, setTimerSeconds] = useState(600); // 10 minutes

  // Step 3: New User Onboarding Data
  const [newFullName, setNewFullName] = useState('');
  const [newCity, setNewCity] = useState('Hyderabad');
  const [newState, setNewState] = useState('Telangana');
  const [newSkillTeach, setNewSkillTeach] = useState('skill-1');
  const [newSkillLearn, setNewSkillLearn] = useState('skill-2');
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);

  // Fetch available skills for onboarding dropdown
  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => {
        if (data.skills && data.skills.length > 0) {
          setAvailableSkills(data.skills);
          setNewSkillTeach(data.skills[0]?.id || 'skill-1');
          setNewSkillLearn(data.skills[1]?.id || 'skill-2');
        }
      })
      .catch(() => {});
  }, []);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (step === 2 && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timerSeconds]);

  // Compute current identifier
  const currentIdentifier = channel === 'PHONE' 
    ? (phoneNumber.startsWith('+91') ? phoneNumber : `+91 ${phoneNumber.trim()}`)
    : emailAddress.trim();

  // Handle Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (channel === 'PHONE') {
      const digitsOnly = phoneNumber.replace(/\D/g, '');
      if (digitsOnly.length < 10) {
        setErrorMsg('Please enter a valid 10-digit Indian mobile number (+91)');
        return;
      }
    } else {
      if (!emailAddress.includes('@') || !emailAddress.includes('.')) {
        setErrorMsg('Please enter a valid email address');
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SEND_OTP',
          identifier: currentIdentifier,
          channel,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDevOtp(data.devOtp || null);
        setRealDeliverySuccess(!!data.realDeliverySuccess);
        setRealDeliveryProvider(data.realDeliveryProvider || 'SIMULATED');
        setRealDeliveryError(data.realDeliveryError || null);
        setIsExistingUser(data.isExistingUser);
        setExistingUserName(data.existingUserName || null);
        setSuccessMsg(data.message);
        setTimerSeconds(600);
        setStep(2);
        
        // Auto-fill code into inputs immediately so the user can verify in 1 click!
        if (data.devOtp) {
          setOtpDigits(data.devOtp.split(''));
        } else {
          setOtpDigits(['', '', '', '', '', '']);
        }

        setTimeout(() => {
          otpRefs.current[5]?.focus();
        }, 150);
      } else {
        setErrorMsg(data.error || 'Failed to send OTP. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index: number, value: string) => {
    // If pasted full string
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pastedDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pastedDigits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Auto-fill dev OTP for instant 1-click testing
  const handleAutoFillOtp = () => {
    if (!devOtp) return;
    const digits = devOtp.split('');
    setOtpDigits(digits);
    otpRefs.current[5]?.focus();
  };

  // Verify OTP
  const handleVerifyOtp = async (overrideUserData?: any) => {
    setErrorMsg(null);
    const fullOtp = otpDigits.join('').trim();
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the OTP code');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'VERIFY_OTP',
          identifier: currentIdentifier,
          otpCode: fullOtp,
          newUserData: overrideUserData || (step === 3 ? {
            fullName: newFullName,
            city: newCity,
            state: newState,
            skillToTeachId: newSkillTeach,
            skillToLearnId: newSkillLearn,
          } : undefined),
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.isNewUser && !overrideUserData) {
          // New user needs to complete profile details
          setStep(3);
          setSuccessMsg('OTP verified successfully! Please enter your name to complete onboarding.');
        } else if (data.user) {
          // Success! Log the user in
          login(data.user);
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          if (onSuccess) onSuccess(data.user);
          setShowAuthModal(false);
        }
      } else {
        setErrorMsg(data.error || 'Verification failed. Please check the OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error verifying OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Submit
  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    handleVerifyOtp({
      fullName: newFullName.trim(),
      city: newCity,
      state: newState,
      skillToTeachId: newSkillTeach,
      skillToLearnId: newSkillLearn,
    });
  };

  // Close modal and allow guest exploration
  const handleCloseOrGuest = () => {
    sessionStorage.setItem('tbi_guest_browse', 'true');
    setShowAuthModal(false);
  };

  // If this is a modal and showAuthModal is false, don't render
  if (!isPageMode && !showAuthModal) {
    return null;
  }

  const modalContainerClasses = isPageMode
    ? 'w-full max-w-xl mx-auto'
    : 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto';

  return (
    <div className={modalContainerClasses}>
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden relative my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Tiranga Gradient Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-white to-green-600" />

        {/* Dismiss Button (for modal mode) */}
        {!isPageMode && (
          <button
            onClick={handleCloseOrGuest}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
            title="Close / Browse as Guest"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 max-w-md mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-300 text-xs font-bold">
              <span>🇮🇳</span>
              <span>TimeBank of India • Secure OTP Access</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {step === 1 && 'Sign In or Register with OTP'}
              {step === 2 && 'Verify 6-Digit OTP'}
              {step === 3 && 'Complete Your Profile 🇮🇳'}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {step === 1 && 'Enter your Mobile Number (+91) or Email to receive an instant verification code.'}
              {step === 2 && `Enter the 6-digit OTP code sent to ${currentIdentifier}.`}
              {step === 3 && 'Tell us your name and skills to claim your 1.0 Starter Time Credit!'}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success / Info Message */}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: ENTER PHONE OR EMAIL */}
          {step === 1 && (
            <div className="space-y-5">
              {/* Channel Selector: Phone vs Email */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => { setChannel('PHONE'); setErrorMsg(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    channel === 'PHONE'
                      ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Mobile Number (+91)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setChannel('EMAIL'); setErrorMsg(null); }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    channel === 'EMAIL'
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Address</span>
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                {channel === 'PHONE' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Enter Mobile Number (India)
                    </label>
                    <div className="flex rounded-2xl border border-slate-300 dark:border-slate-700 overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 bg-slate-50 dark:bg-slate-800/60">
                      <div className="px-3.5 py-3 bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="98765 43210"
                        maxLength={15}
                        className="w-full px-3.5 py-3 bg-transparent text-slate-900 dark:text-white font-medium text-sm focus:outline-none placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      New users receive <strong>+1.0 Starter Time Credit</strong> upon verification.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Enter Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="rahul@timebankindia.in or yourname@gmail.com"
                        className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-slate-400"
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      We will send a 6-digit one-time password to verify your account.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Get 6-Digit OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Persona 1-Click Demo Shortcut */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                  <span>Quick 1-Click Demo Testing</span>
                  <span className="text-orange-500">Evaluator Shortcut</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {DEMO_USERS.slice(0, 3).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        login(u);
                        confetti({ particleCount: 50, spread: 50 });
                        if (onSuccess) onSuccess(u);
                        setShowAuthModal(false);
                      }}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-orange-50 dark:hover:bg-orange-950/40 border border-slate-200 dark:border-slate-700 text-left transition-colors flex items-center gap-2 group"
                    >
                      <img src={u.avatar} alt={u.fullName} className="w-6 h-6 rounded-full object-cover shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate text-[11px]">
                          {u.fullName.split(' ')[0]}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">{u.role}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Guest Explore Option */}
              {!isPageMode && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleCloseOrGuest}
                    className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium underline underline-offset-4"
                  >
                    Skip & Explore Platform as Guest →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: ENTER 6-DIGIT OTP */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Sent to badge */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Sent code to: </span>
                  <span className="font-bold text-slate-800 dark:text-white">{currentIdentifier}</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setStep(1); setErrorMsg(null); }}
                  className="text-orange-600 dark:text-orange-400 font-bold hover:underline"
                >
                  Change
                </button>
              </div>

              {/* REALISTIC IN-APP SMS / NOTIFICATION DELIVERY CARD */}
              {devOtp && (
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-xl border-2 border-orange-500/60 space-y-3.5 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      <span className="text-[11px] font-mono uppercase tracking-wider font-extrabold text-emerald-400">
                        {realDeliverySuccess ? `📲 SMS SENT VIA ${realDeliveryProvider}` : '📲 IN-APP SMS DELIVERY'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Delivered Just Now</span>
                  </div>

                  {/* SMS Body Bubble */}
                  <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2 font-sans">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Sender: <strong className="text-slate-200">TBI-VERIFY (TimeBank of India)</strong></span>
                      <span>To: <strong className="text-slate-200">{currentIdentifier}</strong></span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100 font-medium">
                      &quot;Your TimeBank of India verification code is <strong className="text-amber-400 font-mono text-base tracking-widest bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/40">{devOtp}</strong>. Valid for 10 minutes. Do not share with anyone.&quot;
                    </p>
                  </div>

                  {/* 1-Click Fill & Copy Buttons */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutoFillOtp}
                      className="w-full sm:flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-transform"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Fill Code ({devOtp})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(devOtp);
                        setSuccessMsg(`Copied OTP ${devOtp} to clipboard!`);
                        setTimeout(() => setSuccessMsg(null), 3000);
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>

                  {/* Handset notice */}
                  {!realDeliverySuccess && (
                    <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 space-y-1">
                      <div className="flex items-start gap-1.5 text-amber-300 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                        <span>Why did your physical mobile handset not receive an SMS?</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed pl-5">
                        Sending SMS to physical cell towers requires an external Indian telecom API key (e.g. <strong>Fast2SMS</strong> or <strong>Twilio</strong>). In this environment, the OTP has been delivered via in-app simulation above and has been auto-filled into the 6 boxes below so you can verify immediately!
                      </p>
                      
                      <button
                        type="button"
                        onClick={() => setShowGatewayInfo(!showGatewayInfo)}
                        className="text-[10px] text-orange-400 font-bold hover:underline pl-5 flex items-center gap-1 pt-0.5"
                      >
                        <span>{showGatewayInfo ? 'Hide setup instructions' : 'How to enable real SMS to your phone?'}</span>
                        {showGatewayInfo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {showGatewayInfo && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-slate-300 space-y-1 font-mono">
                          <p className="font-sans font-bold text-white">To send real SMS to Indian phones:</p>
                          <p>1. Get a free Fast2SMS API key from <a href="https://www.fast2sms.com" target="_blank" rel="noreferrer" className="text-orange-400 underline">fast2sms.com</a></p>
                          <p>2. Create a <code>.env.local</code> file in the project folder with:</p>
                          <pre className="p-1.5 bg-black/60 rounded text-emerald-400">FAST2SMS_API_KEY=your_api_key_here</pre>
                          <p className="text-slate-400 font-sans">Or configure <code>TWILIO_ACCOUNT_SID</code> and <code>TWILIO_AUTH_TOKEN</code>.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 6 OTP Input Boxes */}
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black rounded-2xl border-2 border-slate-300 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none transition-all"
                  />
                ))}
              </div>

              {/* Expiry & Resend */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Expires in: {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={loading || timerSeconds > 540}
                  className="font-bold text-orange-600 dark:text-orange-400 hover:underline disabled:opacity-40"
                >
                  Resend OTP
                </button>
              </div>

              {/* Verify Button */}
              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={loading || otpDigits.join('').length !== 6}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify & Continue</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 3: COMPLETE PROFILE (FOR NEW USERS) */}
          {step === 3 && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4 text-xs">
              {/* Starter Credit Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-green-600 text-white shadow-md space-y-1 text-center">
                <div className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>Welcome Gift Included</span>
                </div>
                <div className="text-lg font-black">
                  +1.0 Free Time Credit Granted!
                </div>
                <p className="text-[11px] text-white/90">
                  Strict Time Credit Rule: 1 Hour = 1 Credit • Borrow limit: -1.0 Credit
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Harikrishna Reddy"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">City</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="Hyderabad / Bengaluru"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">State</label>
                  <input
                    type="text"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    placeholder="Telangana / AP / Karnataka"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Skill to Teach</label>
                  <select
                    value={newSkillTeach}
                    onChange={(e) => setNewSkillTeach(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    {availableSkills.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 mb-1 block">Skill to Learn</label>
                  <select
                    value={newSkillLearn}
                    onChange={(e) => setNewSkillLearn(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    {availableSkills.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newFullName.trim()}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration & Claim Credit</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
