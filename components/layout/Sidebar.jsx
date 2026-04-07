'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn, getInitials, getAvatarUrl } from '@/lib/utils';
import {
  LayoutDashboard,
  Clock,
  Users,
  CalendarDays,
  BarChart3,
  Building2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Shield,
  Menu,
  X,
  Brain,
} from 'lucide-react';

// ─────────────────────────────────────────────
//  Navigation Items Config
// ─────────────────────────────────────────────

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'manager', 'employee'],
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: Clock,
    roles: ['admin', 'manager', 'employee'],
  },
  {
    label: 'Users',
    href: '/users',
    icon: Shield,
    roles: ['admin'],
  },
  {
    label: 'Employees',
    href: '/employees',
    icon: Users,
    roles: ['admin', 'manager'],
  },
  {
    label: 'Leave Requests',
    href: '/leaves',
    icon: CalendarDays,
    roles: ['admin', 'manager', 'employee'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['admin', 'manager'],
  },
  {
    label: 'Departments',
    href: '/departments',
    icon: Building2,
    roles: ['admin', 'manager'],
  },
  {
    label: 'AI Assistant',
    href: '/ai',
    icon: Brain,
    roles: ['admin', 'manager', 'employee'],
  },
];

const BOTTOM_ITEMS = [
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin', 'manager', 'employee'],
  },
];

// ─────────────────────────────────────────────
//  Nav Item component
// ─────────────────────────────────────────────

function NavItem({ item, collapsed, onClick }) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        'sidebar-item group relative',
        isActive && 'active',
        collapsed && 'justify-center px-0 mx-2'
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-teal-400 rounded-r-full" />
      )}

      {/* Icon */}
      <Icon
        className={cn(
          'sidebar-icon flex-shrink-0',
          isActive ? 'text-teal-400' : 'text-slate-400 group-hover:text-slate-200'
        )}
        size={20}
        strokeWidth={isActive ? 2.2 : 1.8}
      />

      {/* Label */}
      {!collapsed && (
        <span className="sidebar-label flex-1 truncate">{item.label}</span>
      )}

      {/* Active dot when collapsed */}
      {collapsed && isActive && (
        <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-400" />
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────
//  Sidebar Section Divider
// ─────────────────────────────────────────────

function SectionLabel({ label, collapsed }) {
  if (collapsed) {
    return (
      <div className="mx-4 my-2 border-t border-white/5" />
    );
  }
  return (
    <div className="px-4 pt-4 pb-1">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-600 select-none">
        {label}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Avatar + User Info
// ─────────────────────────────────────────────

function UserProfile({ user, collapsed }) {
  const initials = getInitials(user?.name);
  const avatarUrl = getAvatarUrl(user?.avatar_url);

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl mx-2 mb-2',
        'bg-slate-800/50 border border-white/[0.06] transition-all duration-200',
        collapsed && 'justify-center px-0'
      )}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user?.name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-teal-500/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full avatar-fallback text-xs ring-2 ring-teal-500/30">
            {initials}
          </div>
        )}
        {/* Online dot */}
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-black" />
      </div>

      {/* Info */}
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-100 truncate leading-tight">
            {user?.name || 'User'}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Shield size={10} className="text-teal-400 flex-shrink-0" />
            <p className="text-[11px] text-teal-400 capitalize font-medium truncate">
              {user?.role || 'employee'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Sidebar Component
// ─────────────────────────────────────────────

export default function Sidebar({ onCollapseChange }) {
  const { user, logout, isAdmin, isAdminOrManager } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Notify parent about collapse state
  useEffect(() => {
    onCollapseChange?.(collapsed);
  }, [collapsed, onCollapseChange]);

  // Restore collapse preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === 'true') setCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebarCollapsed', String(next));
  };

  const handleLogout = async () => {
    await logout();
  };

  // Filter nav items by user role
  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );
  const visibleBottomItems = BOTTOM_ITEMS.filter(
    (item) => !user?.role || item.roles.includes(user.role)
  );

  // ── Sidebar inner content (shared between desktop + mobile) ──
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* ── Logo ── */}
      <div
        className={cn(
          'flex items-center h-16 px-4 flex-shrink-0 border-b',
          'border-white/[0.05]',
          collapsed ? 'justify-center px-0' : 'gap-3'
        )}
      >
        {/* Logo icon */}
        <div
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
            'bg-gradient-to-br from-teal-500 to-teal-700 shadow-[0_0_12px_rgba(20,184,166,0.4)]'
          )}
        >
          <Clock size={16} className="text-white" strokeWidth={2.5} />
        </div>

        {/* Brand name */}
        {!collapsed && (
          <div>
            <h1 className="text-sm font-heading font-bold text-white leading-tight">
              AttendanceIQ
            </h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
              Enterprise
            </p>
          </div>
        )}
      </div>

      {/* ── Scrollable nav area ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 no-scrollbar">
        {/* Main navigation */}
        <SectionLabel label="Main Menu" collapsed={collapsed} />

        <nav className="space-y-0.5 px-2">
          {visibleNavItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* Bottom navigation */}
        <SectionLabel label="Account" collapsed={collapsed} />

        <nav className="space-y-0.5 px-2">
          {visibleBottomItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              collapsed={collapsed}
              onClick={() => setMobileOpen(false)}
            />
          ))}

          {/* Logout button */}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'sidebar-item w-full text-left group',
              'text-slate-400 hover:text-red-400 hover:bg-red-500/10',
              collapsed && 'justify-center px-0 mx-0'
            )}
          >
            <LogOut
              size={20}
              className="sidebar-icon text-slate-400 group-hover:text-red-400"
              strokeWidth={1.8}
            />
            {!collapsed && (
              <span className="sidebar-label">Logout</span>
            )}
          </button>
        </nav>
      </div>

      {/* ── User profile ── */}
      <div className="flex-shrink-0 border-t border-white/[0.05] pt-3">
        <UserProfile user={user} collapsed={collapsed} />
      </div>

      {/* ── Collapse toggle (desktop only) ── */}
      <button
        onClick={toggleCollapse}
        className={cn(
          'hidden lg:flex items-center justify-center mx-auto mb-3',
          'w-7 h-7 rounded-full',
          'bg-slate-800 border border-white/10',
          'text-slate-400 hover:text-teal-400 hover:border-teal-500/40',
          'transition-all duration-200'
        )}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight size={13} strokeWidth={2.5} />
        ) : (
          <ChevronLeft size={13} strokeWidth={2.5} />
        )}
      </button>
    </div>
  );

  return (
    <>
      {/* ─────────────────────────────────────────────
          Desktop Sidebar (fixed, always visible)
      ───────────────────────────────────────────── */}
      <aside
        className={cn(
          'sidebar hidden lg:flex flex-col',
          'transition-[width] duration-300 ease-in-out',
          collapsed ? 'collapsed' : ''
        )}
      >
        <SidebarContent />
      </aside>

      {/* ─────────────────────────────────────────────
          Mobile: Hamburger trigger (in topnav)
      ───────────────────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg
                   bg-slate-800/60 border border-white/10 text-slate-300
                   hover:text-white hover:bg-slate-700/60 transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>

      {/* ─────────────────────────────────────────────
          Mobile Drawer
      ───────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm',
          'transition-opacity duration-300',
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Drawer panel */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col',
          'bg-[#0F172A] border-r border-white/[0.06]',
          'transition-transform duration-300 ease-in-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center
                     bg-slate-800 border border-white/10 text-slate-400
                     hover:text-white transition-colors"
          aria-label="Close navigation"
        >
          <X size={13} strokeWidth={2.5} />
        </button>

        <SidebarContent />
      </div>
    </>
  );
}
