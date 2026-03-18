'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, setAuth, clearAuth, getStoredUser } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

// ─────────────────────────────────────────────
//  Auth Context
// ─────────────────────────────────────────────

const AuthContext = createContext(null);

// ─────────────────────────────────────────────
//  Auth Provider
// ─────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // ── Initialise from localStorage on mount ──
  useEffect(() => {
    const init = async () => {
      try {
        const storedUser = getStoredUser();
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

        if (storedUser && token) {
          // Optimistically set user from storage
          setUser(storedUser);

          // Then verify token is still valid by calling /auth/me
          try {
            const res = await authAPI.getMe();
            const freshUser = res.data.data.user;
            setUser(freshUser);
            // Update stored user with fresh data
            localStorage.setItem('user', JSON.stringify(freshUser));
          } catch {
            // Token is invalid — clear everything
            clearAuth();
            setUser(null);
          }
        }
      } catch {
        clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    init();
  }, []);

  // ── Login ──
  const login = useCallback(async (email, password) => {
    try {
      const res = await authAPI.login({ email, password });
      const { accessToken, refreshToken, user: loggedInUser } = res.data.data;

      setAuth(accessToken, refreshToken, loggedInUser);
      setUser(loggedInUser);

      return { success: true, user: loggedInUser };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Login failed. Please check your credentials.'),
      };
    }
  }, []);

  // ── Register ──
  const register = useCallback(async (data) => {
    try {
      const res = await authAPI.register(data);
      const { accessToken, refreshToken, user: newUser } = res.data.data;

      setAuth(accessToken, refreshToken, newUser);
      setUser(newUser);

      return { success: true, user: newUser };
    } catch (error) {
      return {
        success: false,
        message: getErrorMessage(error, 'Registration failed. Please try again.'),
      };
    }
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore logout API errors — clear locally regardless
    } finally {
      clearAuth();
      setUser(null);
    }
  }, []);

  // ── Update user in context (e.g. after profile edit) ──
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  // ── Refresh user from server ──
  const refreshUser = useCallback(async () => {
    try {
      const res = await authAPI.getMe();
      const freshUser = res.data.data.user;
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
      return freshUser;
    } catch {
      return null;
    }
  }, []);

  // ── Derived auth state ──
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isEmployee = user?.role === 'employee';
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const value = {
    // State
    user,
    loading,
    initialized,
    isAuthenticated,

    // Role shortcuts
    isAdmin,
    isManager,
    isEmployee,
    isAdminOrManager,

    // Actions
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────
//  useAuth hook
// ─────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default useAuth;
