'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp, DEMO_USERS } from '@/context/AppContext';
import { 
  Coins, Moon, Sun, Globe, User, ShieldAlert, BookOpen, Compass, 
  Award, Wallet, GitPullRequest, Search, Zap, Layers, Menu, X, CheckCircle2, Key, Phone
} from 'lucide-react';

export default function Navbar() {
  const { lang, setLang, t, currentUser, setCurrentUser, isLoggedIn, logout, setShowAuthModal, isDarkMode, toggleDarkMode } = useApp();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t.nav.home, icon: BookOpen },
    { href: '/dashboard', label: t.nav.dashboard, icon: User },
    { href: '/marketplace', label: t.nav.marketplace, icon: Compass },
    { href: '/passport', label: t.nav.passport, icon: Award },
    { href: '/wallet', label: t.nav.wallet, icon: Wallet },
    { href: '/gap-detector', label: t.nav.gapDetector, icon: Search },
    { href: '/learning-paths', label: t.nav.learningPaths, icon: Layers },
    { href: '/knowledge-impact', label: t.nav.impact, icon: Zap },
    { href: '/admin', label: t.nav.admin, icon: ShieldAlert },
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
                currentUser.balance < 0
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 animate-pulse'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}
              title="Your current Time Credit wallet balance"
            >
              <Coins className="w-4 h-4" />
              <span>{currentUser.balance > 0 ? `+${currentUser.balance.toFixed(2)}` : currentUser.balance.toFixed(2)}</span>
              <span className="hidden sm:inline font-normal text-[11px] opacity-80">Credits</span>
            </Link>

            {/* OTP Sign In / Register Button */}
            {!isLoggedIn ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white text-xs font-bold shadow-sm hover:scale-105 transition-all"
                title="Verify with OTP to get 1.0 Starter Credit"
              >
                <span>Verify with OTP</span>
                <span className="flex h-2 w-2 rounded-full bg-white animate-ping" />
              </button>
            ) : (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-slate-700 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-400 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors"
              >
                <Key className="w-3.5 h-3.5 text-orange-500" />
                <span>Portal / Key</span>
              </Link>
            )}

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
                  src={currentUser.avatar}
                  alt={currentUser.fullName}
                  className="w-7 h-7 rounded-full object-cover border border-white dark:border-slate-800"
                />
                <div className="text-left hidden md:block">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-none">
                    {currentUser.fullName.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-none mt-0.5">
                    {currentUser.role}
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
                  {DEMO_USERS.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setCurrentUser(u);
                        setUserDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        currentUser.id === u.id ? 'bg-orange-50/70 dark:bg-orange-950/30' : ''
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
                      {currentUser.id === u.id && (
                        <CheckCircle2 className="w-4 h-4 text-orange-500" />
                      )}
                    </button>
                  ))}

                  <div className="p-2 border-t border-slate-100 dark:border-slate-700 mt-1 space-y-1">
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setShowAuthModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-left"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Verify via Mobile / Email OTP</span>
                    </button>

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
