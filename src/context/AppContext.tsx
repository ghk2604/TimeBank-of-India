'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, translations, TranslationStrings } from '@/lib/i18n';
import { broadcastRequestEvent, subscribeToRequestEvents } from '@/lib/realtime';
import confetti from 'canvas-confetti';

export interface CurrentUser {
  id: string;
  fullName: string;
  username: string;
  avatar: string;
  balance: number;
  borrowingLimit: number;
  role: 'LEARNER' | 'TEACHER' | 'ADMIN';
  unreadNotifications: number;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  reputationScore?: number;
  trustLevel?: string;
}

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationStrings;
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;
  isLoggedIn: boolean;
  login: (user: CurrentUser) => void;
  logout: () => void;
  showAuthModal: boolean;
  setShowAuthModal: (show: boolean) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  refreshUserData: () => Promise<void>;

  // Real-time Requests & Instant Acceptance
  pendingIncomingRequests: any[];
  refreshRequests: (targetUserId?: string) => Promise<void>;
  acceptSessionRequest: (requestId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  declineSessionRequest: (requestId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export const DEMO_USERS: CurrentUser[] = [
  {
    id: 'user-1',
    fullName: 'Rahul Kumar',
    username: 'rahulkumar',
    email: 'rahul@timebankindia.in',
    phone: '+91 98765 43210',
    city: 'Hyderabad',
    state: 'Telangana',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
    balance: 3.5,
    borrowingLimit: -3.0,
    role: 'TEACHER',
    unreadNotifications: 2
  },
  {
    id: 'user-2',
    fullName: 'Priya Sharma',
    username: 'priyasharma',
    email: 'priya@timebankindia.in',
    phone: '+91 98111 22334',
    city: 'Bengaluru',
    state: 'Karnataka',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces',
    balance: 4.5,
    borrowingLimit: -3.0,
    role: 'TEACHER',
    unreadNotifications: 1
  },
  {
    id: 'user-4',
    fullName: 'Vikram Patel',
    username: 'vikrampatel',
    email: 'vikram@timebankindia.in',
    phone: '+91 98333 44556',
    city: 'Ahmedabad',
    state: 'Gujarat',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    balance: -1.0,
    borrowingLimit: -2.0,
    role: 'LEARNER',
    unreadNotifications: 1
  },
  {
    id: 'user-3',
    fullName: 'Anjali Rao',
    username: 'anjalirao',
    email: 'anjali@timebankindia.in',
    phone: '+91 98222 33445',
    city: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=faces',
    balance: 1.5,
    borrowingLimit: -2.0,
    role: 'LEARNER',
    unreadNotifications: 0
  },
  {
    id: 'admin',
    fullName: 'Platform Admin 🇮🇳',
    username: 'admin',
    email: 'admin@timebankindia.in',
    phone: '+91 98000 00000',
    city: 'New Delhi',
    state: 'Delhi',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces',
    balance: 999.0,
    borrowingLimit: -10.0,
    role: 'ADMIN',
    unreadNotifications: 3
  }
];

export function normalizeUser(rawUser: any): CurrentUser {
  if (!rawUser || typeof rawUser !== 'object') {
    return DEMO_USERS[0];
  }
  const id = rawUser.id || 'user-1';
  const fullName = rawUser.fullName || rawUser.full_name || rawUser.name || 'User';
  const username = rawUser.username || id;
  const avatar = rawUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces';
  const balance = typeof rawUser.balance === 'number' ? rawUser.balance : (Number(rawUser.balance) || 0);
  const borrowingLimit = typeof rawUser.borrowingLimit === 'number'
    ? rawUser.borrowingLimit
    : (typeof rawUser.borrowing_limit === 'number' ? rawUser.borrowing_limit : (Number(rawUser.borrowingLimit || rawUser.borrowing_limit) || -1.0));
  const role = (rawUser.role === 'TEACHER' || rawUser.role === 'ADMIN') ? rawUser.role : 'LEARNER';
  const unreadNotifications = typeof rawUser.unreadNotifications === 'number' ? rawUser.unreadNotifications : 0;

  return {
    id,
    fullName,
    username,
    avatar,
    balance,
    borrowingLimit,
    role,
    unreadNotifications,
    email: rawUser.email,
    phone: rawUser.phone,
    city: rawUser.city,
    state: rawUser.state,
    reputationScore: rawUser.reputationScore || rawUser.reputation_score || 75,
    trustLevel: rawUser.trustLevel || rawUser.trust_level || 'Active Member',
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [currentUser, setCurrentUserState] = useState<CurrentUser>(DEMO_USERS[0]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [pendingIncomingRequests, setPendingIncomingRequests] = useState<any[]>([]);

  const refreshRequests = useCallback(async (targetUserId?: string) => {
    const uid = targetUserId || currentUser?.id;
    if (!uid) return;
    try {
      const res = await fetch(`/api/requests?userId=${uid}`, {
        headers: { 'Cache-Control': 'no-cache' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const incoming = (data.requests || []).filter(
          (r: any) => r.teacher_id === uid && r.status === 'PENDING'
        );
        setPendingIncomingRequests(incoming);
      }
    } catch (e) {
      // Silently catch background poll error
    }
  }, [currentUser?.id]);

  useEffect(() => {
    try {
      // Check local storage or system preference
      const savedLang = localStorage.getItem('tbi_lang') as Language;
      if (savedLang && ['en', 'hi', 'te'].includes(savedLang)) {
        setLangState(savedLang);
      }

      const savedTheme = localStorage.getItem('tbi_theme');
      if (savedTheme === 'dark' || (!savedTheme && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      }

      // Check authentication state
      const savedAuth = localStorage.getItem('tbi_is_authenticated');
      const savedUser = localStorage.getItem('tbi_user');

      if (savedAuth === 'true' && savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          const normalized = normalizeUser(parsed);
          setCurrentUserState(normalized);
          setIsLoggedIn(true);
        } catch (e) {
          setIsLoggedIn(false);
          setCurrentUserState(DEMO_USERS[0]);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (err) {
      console.warn('LocalStorage access warning:', err);
    }

    refreshUserData();
  }, []);

  // Real-time synchronization & fast polling
  useEffect(() => {
    refreshRequests(currentUser.id);
    refreshUserData();

    // 2.5 second live background polling for immediate request discovery
    const intervalId = setInterval(() => {
      refreshRequests(currentUser.id);
      refreshUserData();
    }, 2500);

    // Instant cross-tab & local real-time event listener
    const unsubscribe = subscribeToRequestEvents(() => {
      refreshRequests(currentUser.id);
      refreshUserData();
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [currentUser?.id, refreshRequests]);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('tbi_lang', newLang);
    } catch (e) {}
  };

  const login = (user: any) => {
    const normalized = normalizeUser(user);
    setCurrentUserState(normalized);
    setIsLoggedIn(true);
    setShowAuthModal(false);
    try {
      localStorage.setItem('tbi_is_authenticated', 'true');
      localStorage.setItem('tbi_user', JSON.stringify(normalized));
    } catch (e) {}
    refreshRequests(normalized.id);
  };

  const logout = () => {
    setIsLoggedIn(false);
    try {
      localStorage.removeItem('tbi_is_authenticated');
      localStorage.removeItem('tbi_user');
    } catch (e) {}
    setCurrentUserState(DEMO_USERS[0]);
    setShowAuthModal(false);
    setPendingIncomingRequests([]);
  };

  const setCurrentUser = (user: any) => {
    const normalized = normalizeUser(user);
    setCurrentUserState(normalized);
    setIsLoggedIn(true);
    try {
      localStorage.setItem('tbi_is_authenticated', 'true');
      localStorage.setItem('tbi_user', JSON.stringify(normalized));
    } catch (e) {}
    refreshRequests(normalized.id);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        try { localStorage.setItem('tbi_theme', 'dark'); } catch (e) {}
      } else {
        document.documentElement.classList.remove('dark');
        try { localStorage.setItem('tbi_theme', 'light'); } catch (e) {}
      }
      return next;
    });
  };

  const refreshUserData = async () => {
    try {
      const targetId = currentUser?.id;
      if (!targetId) return;
      const res = await fetch(`/api/users/${targetId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.wallet) {
          setCurrentUserState(prev => ({
            ...prev,
            fullName: data.user.full_name || prev.fullName || 'User',
            balance: typeof data.wallet.balance === 'number' ? data.wallet.balance : (Number(data.wallet.balance) || prev.balance),
            borrowingLimit: typeof data.wallet.borrowing_limit === 'number' ? data.wallet.borrowing_limit : (Number(data.wallet.borrowing_limit) || prev.borrowingLimit),
            unreadNotifications: typeof data.unreadNotifications === 'number' ? data.unreadNotifications : prev.unreadNotifications
          }));
        }
      }
    } catch (e) {
      // Fallback to local state
    }
  };

  const acceptSessionRequest = async (requestId: string) => {
    // Optimistic removal from pending list
    setPendingIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'ACCEPT' }),
      });
      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
        broadcastRequestEvent('REQUEST_ACCEPTED', { requestId, teacherId: currentUser.id });
        await refreshRequests(currentUser.id);
        await refreshUserData();
        return { success: true, message: data.message || 'Session accepted and scheduled successfully!' };
      } else {
        await refreshRequests(currentUser.id);
        return { success: false, error: data.error || 'Failed to accept session' };
      }
    } catch (err: any) {
      await refreshRequests(currentUser.id);
      return { success: false, error: err.message };
    }
  };

  const declineSessionRequest = async (requestId: string) => {
    setPendingIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'REJECT' }),
      });
      const data = await res.json();
      broadcastRequestEvent('REQUEST_REJECTED', { requestId, teacherId: currentUser.id });
      await refreshRequests(currentUser.id);
      return { success: true, message: 'Session request declined.' };
    } catch (err: any) {
      await refreshRequests(currentUser.id);
      return { success: false, error: err.message };
    }
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t: translations[lang],
        currentUser,
        setCurrentUser,
        isLoggedIn,
        login,
        logout,
        showAuthModal,
        setShowAuthModal,
        isDarkMode,
        toggleDarkMode,
        refreshUserData,
        pendingIncomingRequests,
        refreshRequests,
        acceptSessionRequest,
        declineSessionRequest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
