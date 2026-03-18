"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { dashboardAPI } from "@/lib/api";
import { cn, getInitials, getAvatarUrl, timeAgo, truncate } from "@/lib/utils";
import {
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
  Moon,
  Sun,
  X,
  CheckCheck,
  Clock,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

// ─────────────────────────────────────────────
//  Notification Item
// ─────────────────────────────────────────────

function NotificationItem({ notif }) {
  const iconMap = {
    leave_approved: {
      icon: CalendarDays,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    leave_rejected: {
      icon: CalendarDays,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    check_in: { icon: Clock, color: "text-teal-400", bg: "bg-teal-500/10" },
    info: { icon: Bell, color: "text-blue-400", bg: "bg-blue-500/10" },
  };

  const config = iconMap[notif.type] || iconMap.info;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors duration-150 cursor-default",
        "hover:bg-slate-50 dark:hover:bg-white/[0.03]",
        !notif.is_read && "bg-teal-500/[0.04]",
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5",
          config.bg,
        )}
      >
        <Icon size={14} className={config.color} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-snug">
          {truncate(notif.message, 80)}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {timeAgo(notif.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.is_read && (
        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-teal-400 mt-2" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Notifications Panel
// ─────────────────────────────────────────────

function NotificationsPanel({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardAPI.getNotifications(20);
        setNotifications(res.data.data || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await dashboardAPI.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      className={cn(
        "absolute right-0 top-full mt-2 w-80 z-50",
        "rounded-xl overflow-hidden",
        "border border-slate-200 dark:border-white/[0.08]",
        "bg-white/98 dark:bg-[#111827]/95 backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
        "animate-scale-in origin-top-right",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-heading font-semibold text-slate-800 dark:text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/25">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs
                         text-slate-500 dark:text-slate-400
                         hover:text-teal-600 dark:hover:text-teal-400
                         hover:bg-teal-500/10 transition-colors"
              title="Mark all as read"
            >
              <CheckCheck size={13} />
              <span>All read</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md flex items-center justify-center
                       text-slate-400 dark:text-slate-500
                       hover:text-slate-700 dark:hover:text-slate-200
                       hover:bg-black/5 dark:hover:bg-white/10
                       transition-colors"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 spinner" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Bell size={24} className="text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No notifications yet
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotificationItem key={notif.id} notif={notif} />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-white/[0.06]">
          <Link
            href="/settings?tab=notifications"
            onClick={onClose}
            className="text-xs text-teal-500 dark:text-teal-400 hover:text-teal-600 dark:hover:text-teal-300 transition-colors"
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  User Dropdown Menu
// ─────────────────────────────────────────────

function UserDropdown({ user, onClose }) {
  const router = useRouter();
  const { logout } = useAuth();
  const { toast } = useToast();
  const avatarUrl = getAvatarUrl(user?.avatar_url);
  const initials = getInitials(user?.name);

  const handleLogout = async () => {
    onClose();
    await logout();
    toast.info("You have been logged out");
    router.push("/auth/login");
  };

  const menuItems = [
    {
      label: "My Profile",
      icon: User,
      href: `/employees/${user?.id}`,
      desc: "View your profile",
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      desc: "Preferences & security",
    },
  ];

  return (
    <div
      className={cn(
        "absolute right-0 top-full mt-2 w-64 z-50",
        "rounded-xl overflow-hidden",
        "border border-slate-200 dark:border-white/[0.08]",
        "bg-white/98 dark:bg-[#111827]/95 backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)]",
        "animate-scale-in origin-top-right",
      )}
    >
      {/* Profile summary */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-white/[0.06]">
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={user?.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-500/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full avatar-fallback text-sm ring-2 ring-teal-500/30">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {user?.name}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {user?.email}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Shield size={10} className="text-teal-500 dark:text-teal-400" />
            <span className="text-[11px] text-teal-600 dark:text-teal-400 capitalize font-medium">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Menu items */}
      <div className="py-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 group
                         hover:bg-slate-50 dark:hover:bg-white/[0.04]
                         transition-colors duration-150"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center
                              bg-slate-100 dark:bg-slate-800/60
                              border border-slate-200 dark:border-white/[0.06]
                              group-hover:border-teal-500/20 group-hover:bg-teal-500/10
                              transition-all duration-150"
              >
                <Icon
                  size={14}
                  className="text-slate-500 dark:text-slate-400 group-hover:text-teal-500 dark:group-hover:text-teal-400 transition-colors"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {item.label}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {item.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div className="border-t border-slate-100 dark:border-white/[0.06] py-1.5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 group
                     hover:bg-red-50 dark:hover:bg-red-500/10
                     transition-colors duration-150"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center
                          bg-slate-100 dark:bg-slate-800/60
                          border border-slate-200 dark:border-white/[0.06]
                          group-hover:border-red-400/20 group-hover:bg-red-500/10
                          transition-all duration-150"
          >
            <LogOut
              size={14}
              className="text-slate-500 dark:text-slate-400 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-left text-slate-700 dark:text-slate-200 group-hover:text-red-500 dark:group-hover:text-red-300 transition-colors">
              Sign Out
            </p>
            <p className="text-xs text-left text-slate-400 dark:text-slate-500">
              End your session
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Search Bar
// ─────────────────────────────────────────────

function SearchBar() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/employees?search=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setFocused(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "hidden md:flex items-center gap-2 px-3 py-2 rounded-lg",
        "border transition-all duration-200",
        focused
          ? "border-teal-500/40 bg-white dark:bg-slate-800/80 shadow-[0_0_0_3px_rgba(20,184,166,0.1)]"
          : "bg-slate-100/80 dark:bg-slate-800/50 border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.12]",
        "w-48 lg:w-64",
      )}
    >
      <Search
        size={14}
        className={cn(
          "flex-shrink-0 transition-colors duration-200",
          focused
            ? "text-teal-500 dark:text-teal-400"
            : "text-slate-400 dark:text-slate-500",
        )}
      />
      <input
        type="text"
        placeholder="Search employees…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex-1 bg-transparent text-sm
                   text-slate-800 dark:text-slate-200
                   placeholder:text-slate-400 dark:placeholder:text-slate-500
                   outline-none min-w-0"
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="flex-shrink-0 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      )}
    </form>
  );
}

// ─────────────────────────────────────────────
//  Theme Toggle Button
// ─────────────────────────────────────────────

function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  // Render a neutral placeholder before mount to avoid hydration mismatch
  if (!mounted) {
    return (
      <div
        className="w-8 h-8 rounded-lg hidden lg:flex items-center justify-center
                      bg-slate-100 dark:bg-slate-800/40
                      border border-slate-200 dark:border-white/[0.06]"
      />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-lg hidden lg:flex items-center justify-center
                 bg-slate-100 dark:bg-slate-800/40
                 border border-slate-200 dark:border-white/[0.06]
                 text-slate-500 dark:text-slate-500
                 hover:text-amber-500 dark:hover:text-amber-300
                 hover:bg-amber-50 dark:hover:bg-amber-400/10
                 hover:border-amber-200 dark:hover:border-amber-400/20
                 transition-all duration-150 group"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun
          size={13}
          strokeWidth={2}
          className="text-slate-400 group-hover:text-amber-400 transition-all duration-200
                     group-hover:rotate-12 group-hover:scale-110"
        />
      ) : (
        <Moon
          size={13}
          strokeWidth={2}
          className="text-slate-500 group-hover:text-indigo-500 transition-all duration-200
                     group-hover:-rotate-12 group-hover:scale-110"
        />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
//  Main TopNav Component
// ─────────────────────────────────────────────

export default function TopNav({ pageTitle, pageSubtitle, mobileMenuButton }) {
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // ── Live clock ──
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Fetch unread notification count ──
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await dashboardAPI.getNotifications(50);
        const all = res.data.data || [];
        setUnreadCount(all.filter((n) => !n.is_read).length);
      } catch {
        // ignore
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Close dropdowns on Escape ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const avatarUrl = getAvatarUrl(user?.avatar_url);
  const initials = getInitials(user?.name);

  return (
    <header className="topnav">
      {/* ── Left: mobile menu + page title ── */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {mobileMenuButton}

        {pageTitle && (
          <div className="hidden sm:block min-w-0">
            <h2 className="text-base font-heading font-semibold text-slate-900 dark:text-white truncate leading-tight">
              {pageTitle}
            </h2>
            {pageSubtitle && (
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                {pageSubtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Center: search bar ── */}
      <div className="flex-shrink-0">
        <SearchBar />
      </div>

      {/* ── Right: clock + theme toggle + refresh + notifications + user ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Live clock */}
        {currentTime && (
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                          bg-slate-100 dark:bg-slate-800/40
                          border border-slate-200 dark:border-white/[0.06]"
          >
            <Clock size={12} className="text-teal-500 dark:text-teal-400" />
            <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
              {currentTime}
            </span>
          </div>
        )}

        {/* ── Theme toggle ── */}
        <ThemeToggle />

        {/* ── Refresh button ── */}
        <button
          onClick={() => window.location.reload()}
          className="w-8 h-8 rounded-lg hidden lg:flex items-center justify-center
                     bg-slate-100 dark:bg-slate-800/40
                     border border-slate-200 dark:border-white/[0.06]
                     text-slate-500 dark:text-slate-500
                     hover:text-slate-700 dark:hover:text-slate-200
                     hover:bg-slate-200 dark:hover:bg-slate-700/60
                     hover:border-slate-300 dark:hover:border-white/[0.12]
                     transition-all duration-150"
          title="Refresh page"
        >
          <RefreshCw size={13} strokeWidth={2} />
        </button>

        {/* ── Notifications bell ── */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowUserMenu(false);
            }}
            className={cn(
              "relative w-9 h-9 rounded-lg flex items-center justify-center",
              "border transition-all duration-150",
              showNotifications
                ? "border-teal-500/40 bg-teal-500/10 text-teal-500 dark:text-teal-400"
                : "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-white/[0.06] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-white/[0.12]",
            )}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={16} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1
                           rounded-full bg-red-500
                           border-2 border-white dark:border-[#0F172A]
                           flex items-center justify-center
                           text-[9px] font-bold text-white leading-none"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationsPanel onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* ── User menu ── */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className={cn(
              "flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-lg",
              "border transition-all duration-150",
              showUserMenu
                ? "border-teal-500/40 bg-teal-500/10"
                : "border-slate-200 dark:border-white/[0.06] bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-700/60 hover:border-slate-300 dark:hover:border-white/[0.12]",
            )}
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            {/* Avatar */}
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user?.name}
                  className="w-7 h-7 rounded-md object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-md avatar-fallback text-[11px]">
                  {initials}
                </div>
              )}
            </div>

            {/* Name (hidden on small screens) */}
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 leading-tight max-w-[100px] truncate">
                {user?.name?.split(" ")[0] || "User"}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 capitalize leading-tight">
                {user?.role}
              </p>
            </div>

            <ChevronDown
              size={12}
              strokeWidth={2.5}
              className={cn(
                "text-slate-400 dark:text-slate-500 transition-transform duration-200",
                showUserMenu && "rotate-180",
              )}
            />
          </button>

          {showUserMenu && (
            <UserDropdown user={user} onClose={() => setShowUserMenu(false)} />
          )}
        </div>
      </div>
    </header>
  );
}
