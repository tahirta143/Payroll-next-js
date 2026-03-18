"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usersAPI, attendanceAPI, leavesAPI, departmentsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  cn,
  formatDate,
  formatDateShort,
  formatTime,
  formatWorkHours,
  timeAgo,
  getAvatarUrl,
  getInitials,
  getStatusConfig,
  getLeaveStatusConfig,
  getLeaveTypeConfig,
  getRoleConfig,
  getAttendanceRateColor,
  getErrorMessage,
} from "@/lib/utils";
import {
  ArrowLeft,
  Edit3,
  Upload,
  Save,
  X,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Shield,
  RefreshCw,
  Key,
  ToggleLeft,
  ToggleRight,
  Hourglass,
} from "lucide-react";
import dayjs from "dayjs";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "attendance", label: "Attendance History" },
  { id: "leaves", label: "Leave History" },
];

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "half_day", label: "Half Day" },
  { value: "leave", label: "On Leave" },
];

const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => {
  const y = dayjs().year() - i;
  return { value: String(y), label: String(y) };
});

// ─────────────────────────────────────────────
//  Skeleton loader
// ─────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="skeleton h-9 w-9 rounded-xl" />
        <div className="skeleton h-7 w-48 rounded" />
        <div className="skeleton h-6 w-20 rounded-full ml-2" />
      </div>

      {/* Profile card skeleton */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="skeleton w-24 h-24 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-6 w-48 rounded" />
            <div className="skeleton h-4 w-64 rounded" />
            <div className="flex gap-2">
              <div className="skeleton h-5 w-20 rounded-full" />
              <div className="skeleton h-5 w-24 rounded-full" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-1 border-b border-white/[0.08] pb-0">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-9 w-32 rounded-t-lg" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="glass-card p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-4 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Stat mini-card
// ─────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, colorClass, bgClass }) {
  return (
    <div
      className={cn(
        "rounded-xl p-3 border flex flex-col gap-1",
        bgClass || "bg-slate-800/50 border-white/[0.07]",
      )}
    >
      <div className="flex items-center gap-1.5">
        {Icon && (
          <Icon
            size={12}
            strokeWidth={2}
            className={cn("flex-shrink-0", colorClass || "text-slate-400")}
          />
        )}
        <span className="text-[11px] text-slate-500 truncate">{label}</span>
      </div>
      <span
        className={cn(
          "text-xl font-bold tabular-nums leading-none",
          colorClass || "text-slate-200",
        )}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Pagination controls
// ─────────────────────────────────────────────

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total, limit, hasPrevPage, hasNextPage } =
    pagination;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
      <p className="text-xs text-slate-500">
        Showing{" "}
        <span className="text-slate-300 font-medium">
          {from}–{to}
        </span>{" "}
        of <span className="text-slate-300 font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="w-7 h-7 rounded-lg flex items-center justify-center
                     bg-slate-800/60 border border-white/[0.07] text-slate-400
                     hover:text-white hover:bg-slate-700/60
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={13} strokeWidth={2.5} />
        </button>
        <span className="text-xs text-slate-400 px-2 tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="w-7 h-7 rounded-lg flex items-center justify-center
                     bg-slate-800/60 border border-white/[0.07] text-slate-400
                     hover:text-white hover:bg-slate-700/60
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Edit Employee Modal
// ─────────────────────────────────────────────

function EditEmployeeModal({ employee, departments, onClose, onSuccess }) {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: employee?.name || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    role: employee?.role || "employee",
    department_id: employee?.department?.id || employee?.department_id || "",
    is_active: employee?.is_active !== undefined ? employee.is_active : true,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    getAvatarUrl(employee?.avatar_url),
  );

  // Password change sub-section
  const [showPw, setShowPw] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar must be < 5 MB");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Invalid email address";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await usersAPI.update(employee.id, {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        role: form.role,
        department_id: form.department_id || null,
        is_active: form.is_active,
      });
      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        await usersAPI.uploadAvatar(employee.id, fd);
      }
      toast.success("Employee updated successfully");
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to save employee");
      toast.error(msg);
      if (msg.toLowerCase().includes("email")) setErrors({ email: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePw = async () => {
    if (!newPw || newPw.length < 6) {
      setPwErr("Password must be at least 6 characters");
      return;
    }
    setPwSaving(true);
    try {
      await usersAPI.changePassword(employee.id, { newPassword: newPw });
      toast.success("Password changed successfully");
      setNewPw("");
      setShowPw(false);
      setPwErr("");
    } catch (err) {
      setPwErr(getErrorMessage(err, "Failed to change password"));
    } finally {
      setPwSaving(false);
    }
  };

  const initials = getInitials(form.name || "E");

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card w-full max-w-lg mx-4 p-6 animate-enter max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Edit Employee</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Update profile information
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center
                       bg-slate-800/60 border border-white/[0.07] text-slate-400
                       hover:text-white hover:bg-slate-700/60 transition-all"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Avatar picker */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/[0.07]">
          <div className="relative flex-shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={form.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-teal-500/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full avatar-fallback text-base ring-2 ring-white/10">
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center
                         bg-teal-500 text-white shadow-lg hover:bg-teal-400 transition-colors"
            >
              <Upload size={10} strokeWidth={2.5} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              {form.name || "Employee"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Click the upload icon to change photo
            </p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="form-label">Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className={cn("form-input", errors.name && "border-red-500/50")}
              placeholder="e.g. Jane Smith"
            />
            {errors.name && <p className="form-error mt-1">{errors.name}</p>}
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className={cn("form-input", errors.email && "border-red-500/50")}
              placeholder="jane@company.com"
            />
            {errors.email && <p className="form-error mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="form-label">
              Phone{" "}
              <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="form-input"
              placeholder="+1 555 000 0000"
            />
          </div>

          {/* Role + Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="form-input"
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Department</label>
              <select
                name="department_id"
                value={form.department_id}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">No Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status toggle */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-800/40 border border-white/[0.06]">
            <div>
              <p className="text-sm font-medium text-slate-200">
                Account Status
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {form.is_active
                  ? "Employee is active and can log in"
                  : "Employee is inactive and cannot log in"}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, is_active: !p.is_active }))
              }
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                form.is_active
                  ? "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                  : "bg-red-500/10  border-red-500/30  text-red-400  hover:bg-red-500/20",
              )}
            >
              {form.is_active ? (
                <ToggleRight size={14} strokeWidth={2} />
              ) : (
                <ToggleLeft size={14} strokeWidth={2} />
              )}
              {form.is_active ? "Active" : "Inactive"}
            </button>
          </div>
        </div>

        {/* Change-password sub-section */}
        <div className="mt-5 pt-5 border-t border-white/[0.07]">
          <button
            type="button"
            onClick={() => {
              setShowPw((v) => !v);
              setPwErr("");
              setNewPw("");
            }}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-teal-400 transition-colors"
          >
            <Key size={14} strokeWidth={2} />
            {showPw ? "Cancel password change" : "Change employee password"}
          </button>

          {showPw && (
            <div className="mt-3 flex gap-2">
              <input
                type="password"
                value={newPw}
                onChange={(e) => {
                  setNewPw(e.target.value);
                  setPwErr("");
                }}
                className={cn(
                  "form-input flex-1",
                  pwErr && "border-red-500/50",
                )}
                placeholder="New password (min 6 chars)"
              />
              <button
                type="button"
                onClick={handleChangePw}
                disabled={pwSaving}
                className="btn btn-secondary flex items-center gap-1.5 whitespace-nowrap disabled:opacity-60"
              >
                {pwSaving ? (
                  <span className="spinner w-3.5 h-3.5" />
                ) : (
                  <Save size={13} strokeWidth={2} />
                )}
                Set
              </button>
            </div>
          )}
          {pwErr && <p className="form-error mt-1">{pwErr}</p>}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t border-white/[0.07]">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? (
              <span className="spinner w-4 h-4" />
            ) : (
              <Save size={14} strokeWidth={2} />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────
//  Tab 1 — Overview
// ─────────────────────────────────────────────

function OverviewTab({ employeeId, employeeName, attendanceStats }) {
  const { toast } = useToast();

  const [recentRecords, setRecentRecords] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [monthStats, setMonthStats] = useState(null);
  const [monthLoading, setMonthLoading] = useState(true);

  // Recent attendance — last 7 records
  useEffect(() => {
    if (!employeeId) return;
    setRecentLoading(true);
    attendanceAPI
      .getByUser(employeeId, { page: 1, limit: 7 })
      .then((res) => setRecentRecords(res.data.data || []))
      .catch(() => toast.error("Failed to load recent attendance"))
      .finally(() => setRecentLoading(false));
  }, [employeeId]);

  // Leave balance
  useEffect(() => {
    if (!employeeId) return;
    setBalanceLoading(true);
    leavesAPI
      .getBalance(employeeId)
      .then((res) => setBalance(res.data.data || res.data))
      .catch(() => {}) // silently ignore if endpoint unavailable
      .finally(() => setBalanceLoading(false));
  }, [employeeId]);

  // Current-month attendance breakdown
  useEffect(() => {
    if (!employeeId) return;
    setMonthLoading(true);
    const startDate = dayjs().startOf("month").format("YYYY-MM-DD");
    const endDate = dayjs().endOf("month").format("YYYY-MM-DD");
    attendanceAPI
      .getByUser(employeeId, { page: 1, limit: 100, startDate, endDate })
      .then((res) => {
        const records = res.data.data || [];
        const counts = {
          present: 0,
          late: 0,
          absent: 0,
          leave: 0,
          half_day: 0,
        };
        records.forEach((r) => {
          if (counts[r.status] !== undefined) counts[r.status]++;
        });
        setMonthStats(counts);
      })
      .catch(() => {})
      .finally(() => setMonthLoading(false));
  }, [employeeId]);

  const BALANCE_CARDS = [
    {
      key: "sick",
      label: "Sick Leave",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      icon: "🤒",
    },
    {
      key: "casual",
      label: "Casual Leave",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      icon: "🌴",
    },
    {
      key: "annual",
      label: "Annual Leave",
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      icon: "🏖️",
    },
    {
      key: "unpaid",
      label: "Unpaid Leave",
      color: "text-slate-400",
      bg: "bg-slate-800/60",
      border: "border-slate-700/40",
      icon: "💼",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Recent Attendance ── */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Clock size={15} strokeWidth={2} className="text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Recent Attendance
            </h3>
            <span className="text-xs text-slate-600 ml-1">Last 7 records</span>
          </div>
        </div>

        {recentLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-5 w-20 rounded-full" />
                <div className="skeleton h-4 w-14 rounded" />
                <div className="skeleton h-4 w-14 rounded" />
              </div>
            ))}
          </div>
        ) : recentRecords.length === 0 ? (
          <div className="empty-state py-10">
            <Calendar className="empty-state-icon" size={28} />
            <p className="empty-state-title">No records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((rec) => {
                  const cfg = getStatusConfig(rec.status);
                  return (
                    <tr key={rec.id}>
                      <td>
                        <span className="text-sm text-slate-200 font-medium tabular-nums">
                          {formatDateShort(rec.date)}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-500">
                          {dayjs(rec.date).format("ddd")}
                        </span>
                      </td>
                      <td>
                        <span className={cfg.badgeClass}>
                          <span
                            className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)}
                          />
                          {cfg.label}
                        </span>
                      </td>
                      <td>
                        <span
                          className={cn(
                            "text-sm font-mono tabular-nums",
                            rec.check_in_time
                              ? "text-green-400"
                              : "text-slate-600",
                          )}
                        >
                          {rec.check_in_time
                            ? formatTime(rec.check_in_time)
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={cn(
                            "text-sm font-mono tabular-nums",
                            rec.check_out_time
                              ? "text-blue-400"
                              : "text-slate-600",
                          )}
                        >
                          {rec.check_out_time
                            ? formatTime(rec.check_out_time)
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-slate-300 tabular-nums">
                          {rec.work_hours > 0
                            ? formatWorkHours(rec.work_hours)
                            : "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Leave Balance ── */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <FileText size={15} strokeWidth={2} className="text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              Leave Balance
            </h3>
          </div>
        </div>

        {balanceLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
        ) : !balance ? (
          <div className="empty-state py-8">
            <p className="empty-state-title text-sm">
              Balance data unavailable
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
            {BALANCE_CARDS.map(({ key, label, color, bg, border, icon }) => {
              const used = balance[key]?.used ?? 0;
              const entitlement =
                balance[key]?.entitlement ?? balance[key]?.total ?? 0;
              const remaining = Math.max(0, entitlement - used);
              const pct =
                entitlement > 0 ? Math.round((used / entitlement) * 100) : 0;

              return (
                <div
                  key={key}
                  className={`rounded-xl p-4 border flex flex-col gap-2 ${bg} ${border}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className="text-base">{icon}</span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <span
                        className={`text-2xl font-bold tabular-nums ${color}`}
                      >
                        {remaining}
                      </span>
                      <span className="text-xs text-slate-600 ml-1">
                        / {entitlement}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {used} used
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 90
                          ? "bg-red-500"
                          : pct >= 60
                            ? "bg-amber-500"
                            : "bg-teal-500"
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-600 tabular-nums">
                    {pct}% used
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Monthly Attendance Breakdown ── */}
      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} strokeWidth={2} className="text-teal-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              This Month — {dayjs().format("MMMM YYYY")}
            </h3>
          </div>
        </div>

        {monthLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : !monthStats ? (
          <div className="empty-state py-8">
            <p className="empty-state-title text-sm">No data</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-5">
            {[
              {
                key: "present",
                label: "Present",
                color: "text-green-400",
                bg: "bg-green-500/10",
                border: "border-green-500/20",
              },
              {
                key: "late",
                label: "Late",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
                border: "border-amber-500/20",
              },
              {
                key: "absent",
                label: "Absent",
                color: "text-red-400",
                bg: "bg-red-500/10",
                border: "border-red-500/20",
              },
              {
                key: "leave",
                label: "On Leave",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
                border: "border-blue-500/20",
              },
              {
                key: "half_day",
                label: "Half Day",
                color: "text-violet-400",
                bg: "bg-violet-500/10",
                border: "border-violet-500/20",
              },
            ].map(({ key, label, color, bg, border }) => (
              <div
                key={key}
                className={`rounded-xl p-4 border flex flex-col gap-1 ${bg} ${border}`}
              >
                <span className="text-[11px] text-slate-500">{label}</span>
                <span
                  className={`text-3xl font-bold tabular-nums leading-none ${color}`}
                >
                  {monthStats[key] ?? 0}
                </span>
                <span className="text-[10px] text-slate-600">
                  {monthStats[key] === 1 ? "day" : "days"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tab 2 — Attendance History
// ─────────────────────────────────────────────

function AttendanceTab({ employeeId }) {
  const { toast } = useToast();

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
    status: "",
  });

  const fetchRecords = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.status) params.status = filters.status;

      const res = await attendanceAPI.getByUser(employeeId, params);
      setRecords(res.data.data || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load attendance records"));
    } finally {
      setLoading(false);
    }
  }, [employeeId, page, filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
      endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
      status: "",
    });
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Filters bar */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Start date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
              From
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="form-input py-1.5 text-sm w-36"
            />
          </div>

          {/* End date */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
              To
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="form-input py-1.5 text-sm w-36"
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="form-input py-1.5 text-sm w-36"
            >
              {STATUS_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2 ml-auto">
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         text-slate-400 border border-white/[0.07] bg-slate-800/60
                         hover:text-white hover:bg-slate-700/60 transition-all"
            >
              <RefreshCw size={12} strokeWidth={2} />
              Reset
            </button>
            <button
              onClick={() => fetchRecords()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         text-teal-400 border border-teal-500/30 bg-teal-500/10
                         hover:bg-teal-500/20 transition-all"
            >
              <Filter size={12} strokeWidth={2} />
              Apply
            </button>
          </div>
        </div>

        {/* Active filter summary */}
        {(filters.startDate || filters.endDate || filters.status) && (
          <p className="mt-2 text-[11px] text-slate-600">
            Showing records
            {filters.startDate && filters.endDate
              ? ` from ${formatDateShort(filters.startDate)} to ${formatDateShort(filters.endDate)}`
              : ""}
            {filters.status
              ? ` · status: ${STATUS_FILTER_OPTIONS.find((o) => o.value === filters.status)?.label}`
              : ""}
          </p>
        )}
      </div>

      {/* Table card */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-4 w-12 rounded" />
                <div className="skeleton h-5 w-20 rounded-full" />
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-4 w-16 rounded" />
                <div className="skeleton h-4 w-14 rounded" />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state py-16">
            <Calendar className="empty-state-icon" size={32} />
            <p className="empty-state-title">No records found</p>
            <p className="empty-state-desc">
              Try adjusting the date range or status filter.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Work Hours</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => {
                    const cfg = getStatusConfig(rec.status);
                    return (
                      <tr key={rec.id}>
                        {/* Date */}
                        <td>
                          <span className="text-sm text-slate-200 font-medium tabular-nums">
                            {formatDate(rec.date, "MMM D, YYYY")}
                          </span>
                        </td>

                        {/* Day */}
                        <td>
                          <span className="text-xs text-slate-500">
                            {dayjs(rec.date).format("ddd")}
                          </span>
                        </td>

                        {/* Status badge */}
                        <td>
                          <span className={cfg.badgeClass}>
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                cfg.dot,
                              )}
                            />
                            {cfg.label}
                          </span>
                        </td>

                        {/* Check-in */}
                        <td>
                          <span
                            className={cn(
                              "text-sm font-mono tabular-nums",
                              rec.check_in_time
                                ? "text-green-400"
                                : "text-slate-600",
                            )}
                          >
                            {rec.check_in_time
                              ? formatTime(rec.check_in_time)
                              : "—"}
                          </span>
                        </td>

                        {/* Check-out */}
                        <td>
                          <span
                            className={cn(
                              "text-sm font-mono tabular-nums",
                              rec.check_out_time
                                ? "text-blue-400"
                                : "text-slate-600",
                            )}
                          >
                            {rec.check_out_time
                              ? formatTime(rec.check_out_time)
                              : "—"}
                          </span>
                        </td>

                        {/* Work hours */}
                        <td>
                          <span className="text-sm text-slate-300 tabular-nums">
                            {rec.work_hours > 0
                              ? formatWorkHours(rec.work_hours)
                              : "—"}
                          </span>
                        </td>

                        {/* Note */}
                        <td>
                          <span className="text-xs text-slate-500 max-w-[160px] truncate block">
                            {rec.note || "—"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination pagination={pagination} onPageChange={setPage} />

            {/* Export hint */}
            <div className="px-5 py-2.5 border-t border-white/[0.05] flex items-center gap-1.5">
              <AlertCircle
                size={11}
                strokeWidth={2}
                className="text-slate-600"
              />
              <p className="text-[11px] text-slate-600">
                Use the Reports page to export attendance data to CSV or PDF.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tab 3 — Leave History
// ─────────────────────────────────────────────

function LeaveTab({ employeeId, employeeName }) {
  const { toast } = useToast();

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(String(dayjs().year()));

  const fetchLeaves = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await leavesAPI.getAll({
        page,
        limit: 15,
        search: employeeName,
        year,
      });
      setRecords(res.data.data || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load leave records"));
    } finally {
      setLoading(false);
    }
  }, [employeeId, employeeName, page, year]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  const handleYearChange = (val) => {
    setYear(val);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Year filter bar */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-500 font-medium uppercase tracking-wide">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => handleYearChange(e.target.value)}
              className="form-input py-1.5 text-sm w-28"
            >
              {YEAR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end ml-auto">
            <button
              onClick={() => fetchLeaves()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                         text-teal-400 border border-teal-500/30 bg-teal-500/10
                         hover:bg-teal-500/20 transition-all"
            >
              <RefreshCw size={12} strokeWidth={2} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-5 w-20 rounded-full" />
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-4 w-10 rounded" />
                <div className="skeleton h-4 w-28 rounded" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state py-16">
            <FileText className="empty-state-icon" size={32} />
            <p className="empty-state-title">No leave records found</p>
            <p className="empty-state-desc">
              No leave applications found for {year}.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Period</th>
                    <th>Days</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Reviewer</th>
                    <th>Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((leave) => {
                    const typeCfg = getLeaveTypeConfig(
                      leave.leave_type || leave.type,
                    );
                    const statusCfg = getLeaveStatusConfig(leave.status);
                    const startD = formatDateShort(leave.start_date);
                    const endD = formatDateShort(leave.end_date);
                    const isSameDay = leave.start_date === leave.end_date;
                    const days = leave.total_days ?? leave.days ?? "—";

                    return (
                      <tr key={leave.id}>
                        {/* Type badge */}
                        <td>
                          <span
                            className="badge"
                            style={{
                              color: typeCfg.color,
                              backgroundColor: typeCfg.color + "1a",
                              borderColor: typeCfg.color + "33",
                            }}
                          >
                            <span className="mr-1">{typeCfg.icon}</span>
                            {typeCfg.label}
                          </span>
                        </td>

                        {/* Period */}
                        <td>
                          <span className="text-sm text-slate-200 tabular-nums">
                            {isSameDay ? startD : `${startD} → ${endD}`}
                          </span>
                        </td>

                        {/* Days */}
                        <td>
                          <span className="text-sm font-semibold text-slate-200 tabular-nums">
                            {days}
                          </span>
                        </td>

                        {/* Reason */}
                        <td>
                          <span
                            className="text-xs text-slate-400 max-w-[180px] truncate block"
                            title={leave.reason}
                          >
                            {leave.reason || "—"}
                          </span>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={statusCfg.badgeClass}>
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                statusCfg.dot,
                              )}
                            />
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Reviewer */}
                        <td>
                          <span className="text-xs text-slate-500">
                            {leave.reviewer?.name ||
                              leave.approved_by?.name ||
                              "—"}
                          </span>
                        </td>

                        {/* Submitted */}
                        <td>
                          <span
                            className="text-xs text-slate-500 tabular-nums"
                            title={formatDate(
                              leave.created_at,
                              "MMM D, YYYY HH:mm",
                            )}
                          >
                            {timeAgo(leave.created_at)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination pagination={pagination} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAdmin, isAdminOrManager } = useAuth();
  const { toast } = useToast();

  // ── Core data ──
  const [employee, setEmployee] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ── Attendance summary stats (for profile card quick stats) ──
  const [attendanceStats, setAttendanceStats] = useState({
    totalPresent: 0,
    totalLate: 0,
    totalLeave: 0,
    avgWorkHours: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);

  // ── Access control ──
  useEffect(() => {
    if (user && !isAdminOrManager) {
      router.replace("/dashboard");
    }
  }, [user, isAdminOrManager, router]);

  // ── Fetch employee ──
  const fetchEmployee = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await usersAPI.getById(id);
      setEmployee(res.data.data || res.data);
      setNotFound(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(getErrorMessage(err, "Failed to load employee"));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ── Fetch departments for edit modal ──
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await departmentsAPI.getAll({ limit: 100 });
      setDepartments(res.data.data || []);
    } catch {
      // non-critical
    }
  }, []);

  // ── Fetch all-time attendance stats for the profile quick-stats row ──
  const fetchAttendanceStats = useCallback(async () => {
    if (!id) return;
    setStatsLoading(true);
    try {
      // Fetch last 180 days for a representative summary
      const endDate = dayjs().format("YYYY-MM-DD");
      const startDate = dayjs().subtract(180, "day").format("YYYY-MM-DD");
      const res = await attendanceAPI.getByUser(id, {
        page: 1,
        limit: 200,
        startDate,
        endDate,
      });
      const records = res.data.data || [];

      let present = 0,
        late = 0,
        leave = 0,
        totalHours = 0,
        hoursCount = 0;
      records.forEach((r) => {
        if (r.status === "present") present++;
        if (r.status === "late") {
          present++;
          late++;
        }
        if (r.status === "leave") leave++;
        if (r.work_hours > 0) {
          totalHours += r.work_hours;
          hoursCount++;
        }
      });

      setAttendanceStats({
        totalPresent: present,
        totalLate: late,
        totalLeave: leave,
        avgWorkHours: hoursCount > 0 ? (totalHours / hoursCount).toFixed(1) : 0,
      });
    } catch {
      // non-critical — silently ignore
    } finally {
      setStatsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEmployee();
    fetchDepartments();
    fetchAttendanceStats();
  }, [fetchEmployee, fetchDepartments, fetchAttendanceStats]);

  // ── Helpers ──
  const handleEditSuccess = () => {
    fetchEmployee();
    fetchAttendanceStats();
  };

  // ── Derived values ──
  const avatarUrl = getAvatarUrl(employee?.avatar_url);
  const initials = getInitials(employee?.name);
  const roleCfg = getRoleConfig(employee?.role);

  const attendanceRateColor = getAttendanceRateColor(
    attendanceStats.totalPresent > 0
      ? Math.round(
          (attendanceStats.totalPresent /
            Math.max(
              attendanceStats.totalPresent + attendanceStats.totalLate,
              1,
            )) *
            100,
        )
      : 100,
  );

  // ── Render: loading ──
  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <PageSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  // ── Render: not found ──
  if (notFound || !employee) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="glass-card p-10 text-center max-w-md mx-auto mt-12">
            <div
              className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20
                            flex items-center justify-center mx-auto mb-4"
            >
              <XCircle size={28} className="text-red-400" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">
              Employee Not Found
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              The employee you are looking for does not exist or has been
              removed.
            </p>
            <button
              onClick={() => router.push("/employees")}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <ArrowLeft size={14} strokeWidth={2} />
              Back to Employees
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Render: main page ──
  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* ══════════════════════════════════════
            PAGE HEADER
        ══════════════════════════════════════ */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Left — back + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push("/employees")}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
                         bg-slate-800/60 border border-white/[0.07] text-slate-400
                         hover:text-white hover:bg-slate-700/60 transition-all"
              aria-label="Back to employees"
            >
              <ArrowLeft size={16} strokeWidth={2} />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white truncate">
                  {employee.name}
                </h1>
                <span className={roleCfg.badgeClass}>{roleCfg.label}</span>
                {/* Active / Inactive badge */}
                <span
                  className={cn(
                    "badge",
                    employee.is_active
                      ? "bg-green-500/10 border-green-500/25 text-green-400"
                      : "bg-red-500/10  border-red-500/25  text-red-400",
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      employee.is_active ? "bg-green-500" : "bg-red-500",
                    )}
                  />
                  {employee.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5 truncate">
                {employee.email}
              </p>
            </div>
          </div>

          {/* Right — actions */}
          {isAdminOrManager && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                           bg-teal-500/10 border border-teal-500/30 text-teal-400
                           hover:bg-teal-500/20 transition-all"
              >
                <Edit3 size={14} strokeWidth={2} />
                Edit Employee
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════
            PROFILE CARD
        ══════════════════════════════════════ */}
        <div className="glass-card p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 flex flex-col items-center sm:items-start gap-2">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={employee.name}
                    className="w-24 h-24 rounded-2xl object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl avatar-fallback text-2xl ring-2 ring-white/10">
                    {initials}
                  </div>
                )}
                {/* Online indicator */}
                {employee.is_active && (
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full
                               bg-green-500 border-2 border-[#1a2332] shadow-lg"
                    title="Active"
                  />
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 space-y-4">
              {/* Name + badges */}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {employee.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <span className={roleCfg.badgeClass}>{roleCfg.label}</span>
                  {employee.department?.name && (
                    <span className="badge bg-slate-700/50 text-slate-400 border-slate-600/40">
                      <Building2 size={10} strokeWidth={2} />
                      {employee.department.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact info */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Mail
                    size={13}
                    strokeWidth={2}
                    className="text-slate-600 flex-shrink-0"
                  />
                  <span className="truncate">{employee.email}</span>
                </div>
                {employee.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone
                      size={13}
                      strokeWidth={2}
                      className="text-slate-600 flex-shrink-0"
                    />
                    <span>{employee.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar
                    size={13}
                    strokeWidth={2}
                    className="text-slate-600 flex-shrink-0"
                  />
                  <span>
                    Member since{" "}
                    {formatDate(employee.created_at, "MMM D, YYYY")}
                  </span>
                </div>
                {employee.updated_at && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock
                      size={13}
                      strokeWidth={2}
                      className="text-slate-700 flex-shrink-0"
                    />
                    <span>Updated {timeAgo(employee.updated_at)}</span>
                  </div>
                )}
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <StatCard
                  label="Total Present"
                  value={statsLoading ? "…" : attendanceStats.totalPresent}
                  icon={CheckCircle2}
                  colorClass="text-green-400"
                  bgClass="bg-green-500/10"
                  borderClass="border-green-500/20"
                />
                <StatCard
                  label="Total Late"
                  value={statsLoading ? "…" : attendanceStats.totalLate}
                  icon={AlertCircle}
                  colorClass="text-amber-400"
                  bgClass="bg-amber-500/10"
                  borderClass="border-amber-500/20"
                />
                <StatCard
                  label="Total Leave Days"
                  value={statsLoading ? "…" : attendanceStats.totalLeave}
                  icon={Hourglass}
                  colorClass="text-blue-400"
                  bgClass="bg-blue-500/10"
                  borderClass="border-blue-500/20"
                />
                <StatCard
                  label="Avg Work Hours"
                  value={
                    statsLoading ? "…" : `${attendanceStats.avgWorkHours}h`
                  }
                  icon={TrendingUp}
                  colorClass={attendanceRateColor}
                  bgClass="bg-slate-800/50"
                  borderClass="border-white/[0.07]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            TABS
        ══════════════════════════════════════ */}
        <div className="border-b border-white/[0.08]">
          <nav className="flex gap-0 -mb-px">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-5 py-3 text-sm font-medium border-b-2 transition-all duration-150 whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-teal-500 text-teal-400"
                    : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600",
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ══════════════════════════════════════
            TAB CONTENT
        ══════════════════════════════════════ */}
        <div className="min-h-[400px]">
          {activeTab === "overview" && (
            <OverviewTab
              employeeId={employee.id}
              employeeName={employee.name}
              attendanceStats={attendanceStats}
            />
          )}
          {activeTab === "attendance" && (
            <AttendanceTab employeeId={employee.id} />
          )}
          {activeTab === "leaves" && (
            <LeaveTab employeeId={employee.id} employeeName={employee.name} />
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════ */}
      {showEditModal && (
        <EditEmployeeModal
          employee={employee}
          departments={departments}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </DashboardLayout>
  );
}
