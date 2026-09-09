'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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

export interface AcceptedModalState {
  isOpen: boolean;
  sessionId: string;
  isTeacher: boolean;
  learnerName: string;
  teacherName: string;
  skillName: string;
}

export function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // Ignore autoplay policy restriction
  }
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
  refreshUserData: (explicitUserId?: string) => Promise<void>;

  // Real-time Requests & Instant Acceptance
  pendingIncomingRequests: any[];
  refreshRequests: (targetUserId?: string) => Promise<void>;
  acceptSessionRequest: (requestId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  declineSessionRequest: (requestId: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  acceptedModal: AcceptedModalState | null;
  setAcceptedModal: (modal: AcceptedModalState | null) => void;
  incomingModalRequest: any | null;
  setIncomingModalRequest: (req: any | null) => void;
}

export const DEMO_USERS: CurrentUser[] = [
  {
    id: 'user-1788931038705',
    fullName: 'Hari Krishna',
    username: 'harikrishna',
    email: 'harikrishna26888@gmail.com',
    phone: '+91 98765 43210',
    city: 'Hyderabad',
    state: 'Telangana',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
    balance: 5.0,
    borrowingLimit: -3.0,
    role: 'TEACHER',
    unreadNotifications: 1
  },
  {
    id: 'user-1788935861236',
    fullName: 'saicharan',
    username: 'sai',
    email: 'pullakanandamsaicharan5838@gmail.com',
    phone: '+91 98111 22334',
    city: 'Bengaluru',
    state: 'Karnataka',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
    balance: 5.0,
    borrowingLimit: -3.0,
    role: 'LEARNER',
    unreadNotifications: 1
  }
];

export const GUEST_USER: CurrentUser = {
  id: '',
  fullName: '',
  username: '',
  avatar: '',
  balance: 0,
  borrowingLimit: 0,
  role: 'LEARNER',
  unreadNotifications: 0
};

export function normalizeUser(rawUser: any): CurrentUser {
  if (!rawUser || typeof rawUser !== 'object') {
    return GUEST_USER;
  }
  const id = rawUser.id || '';
  if (!id) return GUEST_USER;
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
  const [currentUser, setCurrentUserState] = useState<CurrentUser>(GUEST_USER);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  const [pendingIncomingRequests, setPendingIncomingRequests] = useState<any[]>([]);
  const [acceptedModal, setAcceptedModal] = useState<AcceptedModalState | null>(null);
  const shownAcceptedIdsRef = useRef<Set<string>>(new Set());
  const [incomingModalRequest, setIncomingModalRequest] = useState<any | null>(null);
  const shownIncomingIdsRef = useRef<Set<string>>(new Set());

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

        // Immediate pop-up trigger: Automatically alert teacher when an unacknowledged incoming request exists
        if (incoming.length > 0) {
          const latestReq = incoming[0];
          const ackKey = `tbi_ack_incoming_${latestReq.id}`;
          let alreadyAcked = shownIncomingIdsRef.current.has(latestReq.id);
          if (!alreadyAcked && typeof window !== 'undefined') {
            alreadyAcked = Boolean(sessionStorage.getItem(ackKey));
          }
          if (!alreadyAcked) {
            shownIncomingIdsRef.current.add(latestReq.id);
            try { sessionStorage.setItem(ackKey, 'true'); } catch (e) {}
            setIncomingModalRequest(latestReq);
            playNotificationChime();
          }
        }

        // Fallback pop-up trigger: Check for newly accepted requests for learner
        const acceptedRequests = (data.requests || []).filter(
          (r: any) => r.learner_id === uid && r.status === 'ACCEPTED'
        );
        for (const req of acceptedRequests) {
          const ackKey = `tbi_ack_${req.id}`;
          let alreadyAcked = shownAcceptedIdsRef.current.has(req.id);
          if (!alreadyAcked && typeof window !== 'undefined') {
            alreadyAcked = Boolean(sessionStorage.getItem(ackKey));
          }
          if (!alreadyAcked) {
            shownAcceptedIdsRef.current.add(req.id);
            try { sessionStorage.setItem(ackKey, 'true'); } catch (e) {}

            fetch(`/api/sessions?userId=${uid}`, { cache: 'no-store' })
              .then(sRes => sRes.json())
              .then(sData => {
                const s = (sData.sessions || []).find((sItem: any) => sItem.request_id === req.id || sItem.teacher_id === req.teacher_id);
                setAcceptedModal({
                  isOpen: true,
                  sessionId: s ? s.id : '',
                  isTeacher: false,
                  learnerName: req.learner_name || currentUser?.fullName || 'Learner',
                  teacherName: req.teacher_name || 'Instructor',
                  skillName: req.skill_name || 'Skill Exchange',
                });
                try { confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } }); } catch (e) {}
              })
              .catch(() => {});
          }
        }
      }
    } catch (e) {
      // Silently catch background poll error
    }
  }, [currentUser?.id, currentUser?.fullName]);

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
          if (normalized.id) {
            setCurrentUserState(normalized);
            setIsLoggedIn(true);
            refreshUserData(normalized.id);
          } else {
            setIsLoggedIn(false);
            setCurrentUserState(GUEST_USER);
          }
        } catch (e) {
          setIsLoggedIn(false);
          setCurrentUserState(GUEST_USER);
        }
      } else {
        setIsLoggedIn(false);
        setCurrentUserState(GUEST_USER);
      }
    } catch (err) {
      console.warn('LocalStorage access warning:', err);
    }
  }, []);

  // Real-time synchronization & fast polling
  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) {
      setPendingIncomingRequests([]);
      return;
    }

    refreshRequests(currentUser.id);
    refreshUserData(currentUser.id);

    // 2.5 second live background polling for immediate request discovery
    const intervalId = setInterval(() => {
      refreshRequests(currentUser.id);
      refreshUserData(currentUser.id);
    }, 2500);

    // Instant cross-tab & local real-time event listener
    const unsubscribe = subscribeToRequestEvents((type, payload) => {
      if (!currentUser?.id) return;
      refreshRequests(currentUser.id);
      refreshUserData(currentUser.id);

      if (type === 'REQUEST_CREATED' && payload) {
        // Instant pop-up for the teacher receiving the learning request
        if (currentUser?.id === payload.teacherId) {
          playNotificationChime();
          try { confetti({ particleCount: 75, spread: 60, origin: { y: 0.3 } }); } catch (e) {}
          if (payload.requestId) {
            shownIncomingIdsRef.current.add(payload.requestId);
            try { sessionStorage.setItem(`tbi_ack_incoming_${payload.requestId}`, 'true'); } catch (e) {}
          }
          setIncomingModalRequest({
            id: payload.requestId || '',
            learner_id: payload.learnerId,
            learner_name: payload.learnerName || 'Learner',
            learner_avatar: payload.learnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
            teacher_id: payload.teacherId,
            teacher_name: payload.teacherName,
            skill_name: payload.skillName || 'Skill Exchange',
            duration: payload.duration || 60,
            credit_cost: payload.creditCost || 1,
            learning_goal: payload.learningGoal || 'Master core concepts and practical implementation.',
            preferred_date: 'Tomorrow',
            preferred_time: '6:00 PM - 7:00 PM',
            response_deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          });
        }
      }

      if (type === 'REQUEST_ACCEPTED' && payload) {
        // Pop-up for the learner who requested the session
        if (currentUser?.id === payload.learnerId) {
          if (payload.requestId) {
            shownAcceptedIdsRef.current.add(payload.requestId);
            try { sessionStorage.setItem(`tbi_ack_${payload.requestId}`, 'true'); } catch (e) {}
          }
          setAcceptedModal({
            isOpen: true,
            sessionId: payload.sessionId || '',
            isTeacher: false,
            learnerName: payload.learnerName || currentUser.fullName,
            teacherName: payload.teacherName || 'Instructor',
            skillName: payload.skillName || 'Skill Exchange',
          });
          try {
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          } catch (e) {}
        }
      }
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [isLoggedIn, currentUser?.id, currentUser?.fullName, refreshRequests]);

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
      localStorage.removeItem('tbi_active_tab');
    } catch (e) {}
    setCurrentUserState(GUEST_USER);
    setShowAuthModal(false);
    setPendingIncomingRequests([]);
    setIncomingModalRequest(null);
    shownIncomingIdsRef.current.clear();
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

  const refreshUserData = async (explicitUserId?: string) => {
    try {
      const targetId = explicitUserId || currentUser?.id;
      if (!targetId) return;
      const res = await fetch(`/api/users/${targetId}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.wallet) {
          setCurrentUserState(prev => {
            // Guard: only update if this response matches the target user
            if (prev.id !== targetId) return prev;
            return {
              ...prev,
              fullName: data.user.full_name || prev.fullName || 'User',
              username: data.user.username || prev.username,
              email: data.user.email || prev.email,
              phone: data.user.phone || prev.phone,
              city: data.user.city || prev.city,
              state: data.user.state || prev.state,
              balance: typeof data.wallet.balance === 'number' ? data.wallet.balance : (Number(data.wallet.balance) || prev.balance),
              borrowingLimit: typeof data.wallet.borrowing_limit === 'number' ? data.wallet.borrowing_limit : (Number(data.wallet.borrowing_limit) || prev.borrowingLimit),
              unreadNotifications: typeof data.unreadNotifications === 'number' ? data.unreadNotifications : prev.unreadNotifications
            };
          });
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
        setAcceptedModal({
          isOpen: true,
          sessionId: data.sessionId || '',
          isTeacher: true,
          learnerName: data.learnerName || 'Learner',
          teacherName: data.teacherName || currentUser.fullName,
          skillName: data.skillName || 'Skill Exchange',
        });
        broadcastRequestEvent('REQUEST_ACCEPTED', {
          requestId,
          sessionId: data.sessionId,
          teacherId: data.teacherId || currentUser.id,
          teacherName: data.teacherName || currentUser.fullName,
          learnerId: data.learnerId,
          learnerName: data.learnerName,
          skillName: data.skillName,
        });
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
        acceptedModal,
        setAcceptedModal,
        incomingModalRequest,
        setIncomingModalRequest,
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
