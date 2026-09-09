'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp, DEMO_USERS } from '@/context/AppContext';
import { 
  Coins, Moon, Sun, Globe, User, ShieldAlert, BookOpen, Compass, 
  Award, Wallet, GitPullRequest, Search, Zap, Layers, Menu, X, CheckCircle2, Key, Bell, Check, Eye
} from 'lucide-react';

export default function Navbar() {
  const { 
    lang, setLang, t, currentUser, setCurrentUser, isLoggedIn, logout, 
    isDarkMode, toggleDarkMode, pendingIncomingRequests, acceptSessionRequest, declineSessionRequest 
  } = useApp();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t.nav.home, icon: BookOpen },
    { href: '/dashboard', label: t.nav.dashboard, icon: User },
    { href: '/marketplace', label: t.nav.marketplace, icon: Compass },
    { href: '/passport', label: t.nav.passport, icon: Award },
    { href: '/wallet', label: t.nav.wallet, icon: Wallet },
    { href: '/gap-detector', label: t.nav.gapDetector, icon: Search },
    { href: '/learning-paths', label: t.nav.learningPaths, icon: Layers },
    { href: '/knowledge-impact', label: t.nav.impact, icon: Zap },
    ...(currentUser?.role === 'ADMIN' ? [{ href: '/admin', label: t.nav.admin, icon: ShieldAlert }] : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Patriotic Mini-Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-blue-900 to-green-600 text-white text-[11px] font-medium py-1 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <span>🇮🇳 TIMEBANK OF INDIA</span>
        <span className="opacity-70">•</span>
        <span className="hidden sm:inline">{t.tagline}</span>
        <span className="opacity-70">•</span>
        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-semibold">Strict Rule: 1 Hour = 1 Credit</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-blue-800 to-green-600 p-0.5 shadow-md group-hover:scale-105 transition-transform flex items-center justify-center text-white font-bold text-lg">
              <span className="bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 w-full h-full rounded-[10px] flex items-center justify-center text-xs font-black tracking-tighter">
                TBI 🇮🇳
              </span>
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white flex items-center gap-1.5 leading-tight">
                TimeBank <span className="text-orange-600 dark:text-orange-400">of India</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none">
                Skill & Knowledge Exchange
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Wallet Balance Pill */}
            <Link
              href="/wallet"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                Number(currentUser?.balance ?? 0) < 0
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 animate-pulse'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}
              title="Your current Time Credit wallet balance"
            >
              <Coins className="w-4 h-4" />
              <span>{Number(currentUser?.balance ?? 0) > 0 ? `+${Number(currentUser?.balance ?? 0).toFixed(2)}` : Number(currentUser?.balance ?? 0).toFixed(2)}</span>
              <span className="hidden sm:inline font-normal text-[11px] opacity-80">Credits</span>
            </Link>

            {/* Direct Login & Registration Link */}
            <Link
              href="/login"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white text-xs font-bold shadow-sm hover:scale-105 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </Link>

            {/* Instant Notification Bell & Incoming Requests Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setNotifDropdownOpen(!notifDropdownOpen);
                  setUserDropdownOpen(false);
                  setLangDropdownOpen(false);
                }}
                className={`relative p-2 rounded-full transition-colors ${
                  pendingIncomingRequests.length > 0
                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 hover:bg-amber-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Notifications & Session Requests"
              >
                <Bell className="w-4 h-4" />
                {pendingIncomingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow animate-bounce">
                    {pendingIncomingRequests.length}
                  </span>
                )}
              </button>

              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Incoming Requests</span>
                        {pendingIncomingRequests.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            {pendingIncomingRequests.length} Active
                          </span>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-400">Respond within 24 hours</p>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setNotifDropdownOpen(false)}
                      className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
                    >
                      View All
                    </Link>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                    {pendingIncomingRequests.length > 0 ? (
                      pendingIncomingRequests.map((req) => (
                        <div key={req.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors space-y-2">
                          <div className="flex items-start gap-2.5">
                            <img
                              src={req.learner_avatar}
                              alt={req.learner_name}
                              className="w-9 h-9 rounded-full object-cover shrink-0 mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {req.learner_name}
                              </p>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                                Wants to learn: <span className="text-orange-600 dark:text-orange-400 font-bold">{req.skill_name}</span>
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {req.duration} mins • Earns +{req.credit_cost} Time Credit
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <Link
                              href="/sessions"
                              onClick={() => setNotifDropdownOpen(false)}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Check & Review Details</span>
                            </Link>
                            <button
                              onClick={async () => {
                                await declineSessionRequest(req.id);
                              }}
                              className="py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-medium transition-colors"
                              title="Decline Request"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span className="sr-only">Decline</span>
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                        <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 opacity-80" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">All Caught Up!</p>
                        <p className="text-[11px]">No pending session requests at the moment.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Persona Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setUserDropdownOpen(!userDropdownOpen);
                  setLangDropdownOpen(false);
                }}
                className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
              >
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'}
                  alt={currentUser?.fullName || 'User'}
                  className="w-7 h-7 rounded-full object-cover border border-white dark:border-slate-800"
                />
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-none">
                    {(currentUser?.fullName || currentUser?.username || 'User').split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
                    {currentUser?.role || 'LEARNER'}
                  </p>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Switch User Persona
                    </p>
                    {isLoggedIn && (
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  {DEMO_USERS.filter((u) => u.role !== 'ADMIN').map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        currentUser?.id === u.id ? 'bg-orange-50/70 dark:bg-orange-950/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img src={u.avatar} alt={u.fullName} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-white">
                            {u.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {u.role} • {u.balance > 0 ? `+${u.balance}` : u.balance} Cr
                          </p>
                        </div>
                      </div>
                      {currentUser?.id === u.id && (
                        <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      )}
                    </button>
                  ))}

                  <div className="p-2 border-t border-slate-100 dark:border-slate-700 mt-1 space-y-1">
                    <Link
                      href="/login"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-left"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Sign In / Register Account</span>
                    </Link>

                    <Link
                      href="/login?tab=request-key"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>Request Access Key</span>
                    </Link>

                    {isLoggedIn && (
                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Sign Out Session</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => {
                  setLangDropdownOpen(!langDropdownOpen);
                  setUserDropdownOpen(false);
                }}
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                title="Change Language"
              >
                <Globe className="w-4 h-4" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50">
                  {[
                    { code: 'en', label: 'English' },
                    { code: 'hi', label: 'हिन्दी (Hindi)' },
                    { code: 'te', label: 'తెలుగు (Telugu)' },
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code as any);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                        lang === l.code
                          ? 'text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-950/40'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive
                      ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
