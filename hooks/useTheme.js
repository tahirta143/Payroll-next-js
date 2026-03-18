'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// ─────────────────────────────────────────────
//  Theme Context
// ─────────────────────────────────────────────

const ThemeContext = createContext(null);

// ─────────────────────────────────────────────
//  Theme Provider
// ─────────────────────────────────────────────

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [mounted, setMounted] = useState(false);

  // ── Read stored preference on mount ──
  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      const initial = stored === 'light' ? 'light' : 'dark';
      setTheme(initial);
    } catch {
      // ignore – keep default 'dark'
    } finally {
      setMounted(true);
    }
  }, []);

  // ── Apply class to <html> whenever theme changes ──
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }

    try {
      localStorage.setItem('theme', theme);
    } catch {
      // ignore
    }
  }, [theme, mounted]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────
//  useTheme Hook
// ─────────────────────────────────────────────

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
