import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import localizedFormat from 'dayjs/plugin/localizedFormat';

dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(localizedFormat);

// ─────────────────────────────────────────────
//  Tailwind class merging
// ─────────────────────────────────────────────

/**
 * Merge Tailwind CSS class names without conflicts.
 * Uses clsx for conditional logic + tailwind-merge for dedup.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ─────────────────────────────────────────────
//  Date & Time Formatting
// ─────────────────────────────────────────────

/**
 * Format a date string or Date object to a readable format.
 * @param {string|Date} date
 * @param {string} format - dayjs format string (default: 'MMM D, YYYY')
 * @returns {string}
 */
export function formatDate(date, format = 'MMM D, YYYY') {
  if (!date) return '—';
  const d = dayjs(date);
  return d.isValid() ? d.format(format) : '—';
}

/**
 * Format a date to short form: Jan 15, 2024
 */
export function formatDateShort(date) {
  return formatDate(date, 'MMM D, YYYY');
}

/**
 * Format a date to long form: Monday, January 15, 2024
 */
export function formatDateLong(date) {
  return formatDate(date, 'dddd, MMMM D, YYYY');
}

/**
 * Format a date to numeric form: 2024-01-15
 */
export function formatDateISO(date) {
  return formatDate(date, 'YYYY-MM-DD');
}

/**
 * Format a time string (HH:mm:ss or HH:mm) to 12-hour format.
 * @param {string} time - e.g. '09:30:00'
 * @returns {string} - e.g. '9:30 AM'
 */
export function formatTime(time) {
  if (!time) return '—';
  const base = dayjs().format('YYYY-MM-DD');
  const dt = dayjs(`${base} ${time}`);
  return dt.isValid() ? dt.format('h:mm A') : time;
}

/**
 * Format a time to 24-hour format: 09:30
 */
export function formatTime24(time) {
  if (!time) return '—';
  const base = dayjs().format('YYYY-MM-DD');
  const dt = dayjs(`${base} ${time}`);
  return dt.isValid() ? dt.format('HH:mm') : time;
}

/**
 * Format a datetime string to date + time together.
 * @param {string|Date} datetime
 * @returns {string} - e.g. 'Jan 15, 2024 · 9:30 AM'
 */
export function formatDateTime(datetime) {
  if (!datetime) return '—';
  const dt = dayjs(datetime);
  return dt.isValid() ? dt.format('MMM D, YYYY · h:mm A') : '—';
}

/**
 * Get relative time from now: '2 hours ago', 'in 3 days'
 */
export function timeAgo(date) {
  if (!date) return '—';
  const d = dayjs(date);
  return d.isValid() ? d.fromNow() : '—';
}

/**
 * Format decimal work hours to human-readable string.
 * @param {number} hours - e.g. 7.5
 * @returns {string} - e.g. '7h 30m'
 */
export function formatWorkHours(hours) {
  if (hours === null || hours === undefined || isNaN(hours)) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Get start and end of current month as YYYY-MM-DD strings.
 */
export function getCurrentMonthRange() {
  return {
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end: dayjs().endOf('month').format('YYYY-MM-DD'),
  };
}

/**
 * Get array of month options for select dropdowns.
 */
export function getMonthOptions() {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: dayjs().month(i).format('MMMM'),
    short: dayjs().month(i).format('MMM'),
  }));
}

/**
 * Get array of year options (current year ± 2).
 */
export function getYearOptions(range = 3) {
  const current = dayjs().year();
  return Array.from({ length: range * 2 + 1 }, (_, i) => {
    const year = current - range + i;
    return { value: year, label: String(year) };
  }).reverse();
}

/**
 * Check if a date is today.
 */
export function isToday(date) {
  return dayjs(date).isSame(dayjs(), 'day');
}

/**
 * Check if a date is in the past.
 */
export function isPast(date) {
  return dayjs(date).isBefore(dayjs(), 'day');
}

/**
 * Check if a date is a weekend (Saturday or Sunday).
 */
export function isWeekend(date) {
  const dow = dayjs(date).day();
  return dow === 0 || dow === 6;
}

// ─────────────────────────────────────────────
//  Attendance Status Helpers
// ─────────────────────────────────────────────

export const STATUS_CONFIG = {
  present: {
    label: 'Present',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.25)',
    badgeClass: 'badge-present',
    dot: 'bg-green-500',
  },
  absent: {
    label: 'Absent',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.25)',
    badgeClass: 'badge-absent',
    dot: 'bg-red-500',
  },
  late: {
    label: 'Late',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    border: 'rgba(245,158,11,0.25)',
    badgeClass: 'badge-late',
    dot: 'bg-amber-500',
  },
  half_day: {
    label: 'Half Day',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    border: 'rgba(139,92,246,0.25)',
    badgeClass: 'badge-half_day',
    dot: 'bg-violet-500',
  },
  leave: {
    label: 'On Leave',
    color: '#3b82f6',
    bg: 'rgba(59,130,246,0.12)',
    border: 'rgba(59,130,246,0.25)',
    badgeClass: 'badge-leave',
    dot: 'bg-blue-500',
  },
};

export const LEAVE_STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    color: '#f59e0b',
    badgeClass: 'badge-pending',
    dot: 'bg-amber-500',
  },
  approved: {
    label: 'Approved',
    color: '#22c55e',
    badgeClass: 'badge-approved',
    dot: 'bg-green-500',
  },
  rejected: {
    label: 'Rejected',
    color: '#ef4444',
    badgeClass: 'badge-rejected',
    dot: 'bg-red-500',
  },
};

export const ROLE_CONFIG = {
  admin: {
    label: 'Admin',
    badgeClass: 'badge-admin',
    color: '#14b8a6',
  },
  manager: {
    label: 'Manager',
    badgeClass: 'badge-manager',
    color: '#8b5cf6',
  },
  employee: {
    label: 'Employee',
    badgeClass: 'badge-employee',
    color: '#94a3b8',
  },
};

export const LEAVE_TYPE_CONFIG = {
  sick: { label: 'Sick Leave', color: '#ef4444', icon: '🤒' },
  casual: { label: 'Casual Leave', color: '#f59e0b', icon: '🌴' },
  annual: { label: 'Annual Leave', color: '#22c55e', icon: '🏖️' },
  unpaid: { label: 'Unpaid Leave', color: '#94a3b8', icon: '💼' },
};

/**
 * Get status config for attendance status.
 */
export function getStatusConfig(status) {
  return STATUS_CONFIG[status] || {
    label: status,
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.12)',
    border: 'rgba(148,163,184,0.25)',
    badgeClass: 'badge',
    dot: 'bg-slate-500',
  };
}

/**
 * Get leave status config.
 */
export function getLeaveStatusConfig(status) {
  return LEAVE_STATUS_CONFIG[status] || {
    label: status,
    color: '#94a3b8',
    badgeClass: 'badge',
    dot: 'bg-slate-500',
  };
}

/**
 * Get role config.
 */
export function getRoleConfig(role) {
  return ROLE_CONFIG[role] || {
    label: role,
    badgeClass: 'badge-employee',
    color: '#94a3b8',
  };
}

/**
 * Get leave type config.
 */
export function getLeaveTypeConfig(type) {
  return LEAVE_TYPE_CONFIG[type] || {
    label: type,
    color: '#94a3b8',
    icon: '📋',
  };
}

// ─────────────────────────────────────────────
//  Number & Percentage Formatting
// ─────────────────────────────────────────────

/**
 * Format a number with commas: 1000000 → '1,000,000'
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat().format(num);
}

/**
 * Format a percentage: 0.856 → '85.6%' or 85.6 → '85.6%'
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '0%';
  const v = value > 1 ? value : value * 100;
  return `${parseFloat(v).toFixed(decimals)}%`;
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

// ─────────────────────────────────────────────
//  String Utilities
// ─────────────────────────────────────────────

/**
 * Get initials from a full name: 'John Doe' → 'JD'
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('');
}

/**
 * Capitalise the first letter of each word.
 */
export function titleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Capitalise first letter only.
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate a string to maxLength and append '...' if needed.
 */
export function truncate(str, maxLength = 50) {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}...` : str;
}

/**
 * Convert snake_case or kebab-case to readable Title Case.
 * e.g. 'half_day' → 'Half Day'
 */
export function snakeToTitle(str) {
  if (!str) return '';
  return str
    .replace(/[_-]/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ─────────────────────────────────────────────
//  Object & Array Utilities
// ─────────────────────────────────────────────

/**
 * Remove undefined/null keys from an object (for API query params).
 */
export function cleanParams(obj) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Group an array of objects by a key.
 * @param {Array} arr
 * @param {string} key
 * @returns {Object}
 */
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const group = item[key];
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

/**
 * Sort an array of objects by a key (ascending by default).
 */
export function sortBy(arr, key, direction = 'asc') {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Deduplicate an array of objects by a key.
 */
export function uniqueBy(arr, key) {
  const seen = new Set();
  return arr.filter((item) => {
    const val = item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
}

// ─────────────────────────────────────────────
//  File / Download Utilities
// ─────────────────────────────────────────────

/**
 * Trigger a file download from a Blob response.
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

/**
 * Get the full URL for a stored avatar path.
 */
export function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http')) return avatarPath;
  const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
  return `${base}${avatarPath}`;
}

// ─────────────────────────────────────────────
//  Validation Helpers
// ─────────────────────────────────────────────

/**
 * Check if a value is a valid email address.
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Check if a password meets minimum requirements.
 * At least 8 chars, 1 uppercase, 1 lowercase, 1 number.
 */
export function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

/**
 * Check if a date string is in YYYY-MM-DD format and is valid.
 */
export function isValidDate(dateStr) {
  if (!dateStr) return false;
  const d = dayjs(dateStr, 'YYYY-MM-DD', true);
  return d.isValid();
}

// ─────────────────────────────────────────────
//  Error Extraction
// ─────────────────────────────────────────────

/**
 * Extract a user-friendly error message from an Axios error response.
 * @param {Error} error - Axios error
 * @param {string} fallback - default message
 * @returns {string}
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  // Axios response error
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  // Network / timeout
  if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  if (error.message === 'Network Error') return 'Cannot reach the server. Check your connection.';
  // Generic
  return error.message || fallback;
}

// ─────────────────────────────────────────────
//  Pagination Helpers
// ─────────────────────────────────────────────

/**
 * Build page number array for pagination UI.
 * e.g. getPageNumbers(1, 10) → [1, 2, 3, '...', 10]
 */
export function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [];

  if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(
      1,
      '...',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages
    );
  } else {
    pages.push(
      1,
      '...',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      '...',
      totalPages
    );
  }

  return pages;
}

// ─────────────────────────────────────────────
//  Attendance Rate Color
// ─────────────────────────────────────────────

/**
 * Get a color based on attendance rate value.
 * @param {number} rate - 0 to 100
 * @returns {string} - Tailwind text color class
 */
export function getAttendanceRateColor(rate) {
  if (rate >= 90) return 'text-green-400';
  if (rate >= 75) return 'text-amber-400';
  if (rate >= 60) return 'text-orange-400';
  return 'text-red-400';
}

/**
 * Get a hex color based on attendance rate value.
 */
export function getAttendanceRateHex(rate) {
  if (rate >= 90) return '#22c55e';
  if (rate >= 75) return '#f59e0b';
  if (rate >= 60) return '#f97316';
  return '#ef4444';
}
