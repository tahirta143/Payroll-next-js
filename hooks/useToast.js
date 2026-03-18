'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────
//  Toast Context
// ─────────────────────────────────────────────

const ToastContext = createContext(null);

// ─────────────────────────────────────────────
//  Toast Provider
// ─────────────────────────────────────────────

let toastIdCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);

    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const addToast = useCallback(
    ({ message, type = 'info', duration = 4000, title = '' }) => {
      const id = ++toastIdCounter;

      const toast = {
        id,
        message,
        type,
        title: title || getDefaultTitle(type),
        duration,
        removing: false,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        // Keep max 5 toasts
        const limited = prev.length >= 5 ? prev.slice(1) : prev;
        return [...limited, toast];
      });

      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: 'info', ...options });
    },
    [addToast]
  );

  toast.success = (message, options = {}) =>
    addToast({ message, type: 'success', ...options });

  toast.error = (message, options = {}) =>
    addToast({ message, type: 'error', duration: 6000, ...options });

  toast.warning = (message, options = {}) =>
    addToast({ message, type: 'warning', ...options });

  toast.info = (message, options = {}) =>
    addToast({ message, type: 'info', ...options });

  toast.loading = (message, options = {}) =>
    addToast({ message, type: 'loading', duration: 0, ...options });

  toast.dismiss = (id) => {
    if (id !== undefined) {
      removeToast(id);
    } else {
      // Dismiss all
      setToasts((prev) => {
        prev.forEach((t) => {
          if (timersRef.current[t.id]) {
            clearTimeout(timersRef.current[t.id]);
            delete timersRef.current[t.id];
          }
        });
        return [];
      });
    }
  };

  toast.update = (id, updates) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const value = {
    toasts,
    toast,
    removeToast,
  };

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

// ─────────────────────────────────────────────
//  Helper: default toast title per type
// ─────────────────────────────────────────────

function getDefaultTitle(type) {
  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'loading':
      return 'Loading…';
    case 'info':
    default:
      return 'Info';
  }
}

// ─────────────────────────────────────────────
//  Icon per toast type (returns a Unicode/emoji
//  string used inside the ToastContainer)
// ─────────────────────────────────────────────

export function getToastIcon(type) {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'loading':
      return '⟳';
    case 'info':
    default:
      return 'ℹ';
  }
}

// ─────────────────────────────────────────────
//  Style config per toast type
// ─────────────────────────────────────────────

export const TOAST_STYLES = {
  success: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/25',
    icon: 'text-green-400 bg-green-500/15',
    title: 'text-green-300',
    bar: 'bg-green-500',
  },
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    icon: 'text-red-400 bg-red-500/15',
    title: 'text-red-300',
    bar: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    icon: 'text-amber-400 bg-amber-500/15',
    title: 'text-amber-300',
    bar: 'bg-amber-500',
  },
  loading: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/25',
    icon: 'text-blue-400 bg-blue-500/15',
    title: 'text-blue-300',
    bar: 'bg-blue-500',
  },
  info: {
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/25',
    icon: 'text-teal-400 bg-teal-500/15',
    title: 'text-teal-300',
    bar: 'bg-teal-500',
  },
};

// ─────────────────────────────────────────────
//  useToast hook
// ─────────────────────────────────────────────

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export default useToast;
