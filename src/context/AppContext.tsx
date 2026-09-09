'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, TranslationStrings } from '@/lib/i18n';

export interface CurrentUser {
  id: string;
  fullName: string;
  username: string;
  avatar: string;
  balance: number;
  borrowingLimit: number;
  role: 'LEARNER' | 'TEACHER' | 'ADMIN';
  unreadNotifications: number;
}

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationStrings;
  currentUser: CurrentUser;
  setCurrentUser: (user: CurrentUser) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  refreshUserData: () => Promise<void>;
}

export const DEMO_USERS: CurrentUser[] = [
  {
    id: 'user-1',
    fullName: 'Rahul Kumar',
    username: 'rahulkumar',
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
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces',
    balance: 999.0,
    borrowingLimit: -10.0,
    role: 'ADMIN',
    unreadNotifications: 3
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');
  const [currentUser, setCurrentUser] = useState<CurrentUser>(DEMO_USERS[0]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  useEffect(() => {
    // Check local storage or system preference
    const savedLang = localStorage.getItem('tbi_lang') as Language;
    if (savedLang && ['en', 'hi', 'te'].includes(savedLang)) {
      setLangState(savedLang);
    }

    const savedTheme = localStorage.getItem('tbi_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }

    refreshUserData();
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('tbi_lang', newLang);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('tbi_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('tbi_theme', 'light');
      }
      return next;
    });
  };

  const refreshUserData = async () => {
    try {
      const res = await fetch(`/api/users/${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user && data.wallet) {
          setCurrentUser(prev => ({
            ...prev,
            balance: data.wallet.balance,
            borrowingLimit: data.wallet.borrowing_limit,
            unreadNotifications: data.unreadNotifications || 0
          }));
        }
      }
    } catch (e) {
      // Fallback to local state
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
        isDarkMode,
        toggleDarkMode,
        refreshUserData
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
