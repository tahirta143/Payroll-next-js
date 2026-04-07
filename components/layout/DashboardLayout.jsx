'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import FloatingAIButton from '../FloatingAIButton';
import { cn } from '@/lib/utils';
import { animatePageEntrance } from '@/lib/gsap';
import { CosmicParallaxBg } from '@/components/ui/parallax-cosmic-background';

// ─────────────────────────────────────────────
//  Page loading skeleton
// ─────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="p-6 animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-48 rounded-lg" />
          <div className="skeleton h-4 w-72 rounded-md" />
        </div>
        <div className="skeleton h-9 w-28 rounded-lg" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="dashboard-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="skeleton h-4 w-24 rounded-md" />
              <div className="skeleton h-8 w-8 rounded-lg" />
            </div>
            <div className="skeleton h-8 w-16 rounded-md" />
            <div className="skeleton h-3 w-32 rounded-md" />
          </div>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 dashboard-card space-y-4">
          <div className="skeleton h-5 w-36 rounded-md" />
          <div className="skeleton h-48 w-full rounded-lg" />
        </div>
        <div className="dashboard-card space-y-4">
          <div className="skeleton h-5 w-28 rounded-md" />
          <div className="skeleton h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Auth guard wrapper
// ─────────────────────────────────────────────

function AuthGuard({ children, requiredRoles }) {
  const { user, loading, initialized, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user?.role)) {
        router.replace('/dashboard');
        return;
      }
    }
  }, [initialized, isAuthenticated, user, router, requiredRoles]);

  if (loading || !initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          {/* Logo */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700
                          flex items-center justify-center shadow-[0_0_24px_rgba(20,184,166,0.4)]
                          animate-glow-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="space-y-1 text-center">
            <p className="text-sm font-semibold text-slate-300">AttendanceIQ</p>
            <p className="text-xs text-slate-500">Loading your workspace…</p>
          </div>
          {/* Spinner */}
          <div className="w-5 h-5 spinner" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user?.role)) {
    return null;
  }

  return children;
}

// ─────────────────────────────────────────────
//  Main Dashboard Layout
// ─────────────────────────────────────────────

export default function DashboardLayout({
  children,
  pageTitle,
  pageSubtitle,
  requiredRoles,
  loading = false,
  actions,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuBtn, setMobileMenuBtn] = useState(null);
  const mainContentRef = useRef(null);

  const handleCollapseChange = useCallback((collapsed) => {
    setSidebarCollapsed(collapsed);
  }, []);

  // Animate main content on mount
  useEffect(() => {
    if (!loading && mainContentRef.current) {
      animatePageEntrance(mainContentRef.current);
    }
  }, [loading]);

  // Capture the mobile menu button rendered by Sidebar
  // so we can pass it into TopNav (which lives in the header)
  const [sidebarRef, setSidebarRef] = useState(null);

  return (
    <AuthGuard requiredRoles={requiredRoles}>
      <CosmicParallaxBg loop={true} />
      <div className="min-h-screen bg-background/80 flex relative z-10">

        {/* ── Sidebar ── */}
        <Sidebar onCollapseChange={handleCollapseChange} />

        {/* ── Main area (shifts right based on sidebar width) ── */}
        <div
          className={cn(
            'flex-1 flex flex-col min-h-screen min-w-0',
            'transition-[margin-left] duration-300 ease-in-out',
            // Desktop: offset by sidebar width
            sidebarCollapsed
              ? 'lg:ml-[72px]'
              : 'lg:ml-[260px]'
          )}
        >
          {/* ── Top Navigation Bar ── */}
          <TopNav
            pageTitle={pageTitle}
            pageSubtitle={pageSubtitle}
          />

          {/* ── Page content ── */}
          <main className="flex-1 overflow-auto" ref={mainContentRef}>
            {loading ? (
              <PageSkeleton />
            ) : (
              <div className="animate-fade-in">
                {/* Optional page header with actions */}
                {(pageTitle || actions) && (
                  <div className="px-6 pt-6 pb-0">
                    <div className="page-header">
                      <div>
                        {pageTitle && (
                          <h1 className="page-title">{pageTitle}</h1>
                        )}
                        {pageSubtitle && (
                          <p className="page-subtitle">{pageSubtitle}</p>
                        )}
                      </div>
                      {actions && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {actions}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Page children */}
                <div className={cn(pageTitle || actions ? 'px-6 pb-6' : 'p-6')}>
                  <CosmicParallaxBg loop={true} />
                  {children}
                </div>
              </div>
            )}
          </main>

          {/* ── Footer ── */}
          <footer className="flex-shrink-0 border-t border-white/[0.05] px-6 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <p className="text-xs text-slate-600">
                {new Date().getFullYear()} AttendanceIQ — Enterprise Attendance Management
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-700">v1.0.0</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-slate-600">All systems operational</span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
      
      {/* Floating AI Button */}
      <FloatingAIButton />
    </AuthGuard>
  );
}
