'use client';

import { useEffect, useState } from 'react';
import { useToast, getToastIcon, TOAST_STYLES } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
//  Single Toast Item
// ─────────────────────────────────────────────

function ToastItem({ toast, onRemove }) {
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const styles = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  // Mount animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Progress bar countdown
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;

    const interval = 50;
    const decrement = (interval / toast.duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev - decrement;
        if (next <= 0) {
          clearInterval(timer);
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [toast.duration]);

  const isRemoving = toast.removing;

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 w-full max-w-sm rounded-xl border p-4',
        'shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl',
        'transition-all duration-300 ease-out overflow-hidden',
        styles.bg,
        styles.border,
        visible && !isRemoving
          ? 'opacity-100 translate-x-0 scale-100'
          : 'opacity-0 translate-x-8 scale-95'
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
          'text-sm font-bold',
          styles.icon
        )}
      >
        {toast.type === 'loading' ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <span>{getToastIcon(toast.type)}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        {toast.title && (
          <p className={cn('text-sm font-semibold leading-tight mb-0.5', styles.title)}>
            {toast.title}
          </p>
        )}
        <p className="text-sm text-slate-300 leading-snug break-words">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center
                   text-slate-500 hover:text-slate-200 hover:bg-white/10
                   transition-colors duration-150 mt-0.5"
        aria-label="Dismiss notification"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M1 1L11 11M11 1L1 11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Progress bar (only when duration > 0) */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 rounded-b-xl overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-none', styles.bar)}
            style={{ width: `${progress}%`, transition: 'width 50ms linear' }}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Toast Container
// ─────────────────────────────────────────────

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 items-end"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}
