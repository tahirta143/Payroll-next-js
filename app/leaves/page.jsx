"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { leavesAPI, departmentsAPI, employeesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  cn,
  formatDate,
  formatDateShort,
  timeAgo,
  getLeaveStatusConfig,
  getLeaveTypeConfig,
  getAvatarUrl,
  getInitials,
  getErrorMessage,
  getYearOptions,
  cleanParams,
} from "@/lib/utils";
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  User,
  Building2,
  Calendar,
  MessageSquare,
  Check,
  Ban,
  Trash2,
  Info,
  TrendingUp,
} from "lucide-react";
import dayjs from "dayjs";

// ─────────────────────────────────────────────
//  Leave type configuration
// ─────────────────────────────────────────────

const LEAVE_TYPES = [
  {
    value: "sick",
    label: "Sick Leave",
    icon: "🤒",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    entitlement: 10,
  },
  {
    value: "casual",
    label: "Casual Leave",
    icon: "🌴",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    entitlement: 7,
  },
  {
    value: "annual",
    label: "Annual Leave",
    icon: "✈️",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    border: "border-teal-500/20",
    entitlement: 15,
  },
  {
    value: "unpaid",
    label: "Unpaid Leave",
    icon: "💼",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    entitlement: 30,
  },
];

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function getWorkingDaysBetween(start, end) {
  if (!start || !end) return 0;
  let s = dayjs(start);
  const e = dayjs(end);
  if (s.isAfter(e)) return 0;
  let count = 0;
  while (!s.isAfter(e)) {
    const dow = s.day();
    if (dow !== 0 && dow !== 6) count++;
    s = s.add(1, "day");
  }
  return count;
}

// ─────────────────────────────────────────────
//  Balance Card
// ─────────────────────────────────────────────

function BalanceCard({ type, used, entitlement, remaining, loading }) {
  const cfg = LEAVE_TYPES.find((t) => t.value === type) || LEAVE_TYPES[0];
  const pct = entitlement > 0 ? Math.min(100, (used / entitlement) * 100) : 0;
  const barColor =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-teal-500";

  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="skeleton h-4 w-20 rounded mb-3" />
        <div className="skeleton h-7 w-16 rounded mb-2" />
        <div className="skeleton h-2 w-full rounded-full mb-1" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "glass-card p-5 border",
        cfg.border,
        "hover:border-opacity-40 transition-all",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            {cfg.label}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-2xl font-bold", cfg.color)}>
              {remaining}
            </span>
            <span className="text-sm text-slate-500">/ {entitlement} days</span>
          </div>
        </div>
        <span className={cn("text-2xl leading-none rounded-xl p-2", cfg.bg)}>
          {cfg.icon}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            barColor,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        <span className={cn("font-semibold", cfg.color)}>{used}</span> used
        &bull; {remaining} remaining
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Status Badge
// ─────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = getLeaveStatusConfig(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        cfg.badgeClass,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────
//  Type Badge
// ─────────────────────────────────────────────

function TypeBadge({ type }) {
  const cfg = LEAVE_TYPES.find((t) => t.value === type);
  if (!cfg) return <span className="text-slate-400 text-xs">{type}</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        cfg.bg,
        cfg.color,
        "border",
        cfg.border,
      )}
    >
      <span>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────
//  Avatar
// ─────────────────────────────────────────────

function Avatar({ user, size = 8 }) {
  const initials = getInitials(user?.name);
  const avatarUrl = getAvatarUrl(user?.avatar_url);
  const sizeClass = `w-${size} h-${size}`;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={user?.name}
        className={cn(
          sizeClass,
          "rounded-full object-cover ring-2 ring-slate-700/50 flex-shrink-0",
        )}
      />
    );
  }
  return (
    <div
      className={cn(
        sizeClass,
        "rounded-full flex items-center justify-center flex-shrink-0",
        "bg-gradient-to-br from-teal-500/30 to-teal-700/30 text-teal-300 font-semibold ring-2 ring-slate-700/50",
        size <= 8 ? "text-xs" : "text-sm",
      )}
    >
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Pagination
// ─────────────────────────────────────────────

function Pagination({
  page,
  totalPages,
  total,
  limit,
  hasPrevPage,
  hasNextPage,
  onPageChange,
}) {
  if (totalPages <= 1) return null;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between pt-4 border-t border-white/[0.05]">
      <p className="text-xs text-slate-500">
        Showing{" "}
        <span className="text-slate-300 font-medium">
          {start}–{end}
        </span>{" "}
        of <span className="text-slate-300 font-medium">{total}</span> results
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10
                     text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-40
                     disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="px-3 py-1.5 text-xs text-slate-300 bg-slate-800/60 rounded-lg border border-white/10">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10
                     text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-40
                     disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Apply Leave Modal
// ─────────────────────────────────────────────

function ApplyLeaveModal({ onClose, onSuccess, balance }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    type: "sick",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const estimatedDays = getWorkingDaysBetween(form.start_date, form.end_date);

  const getRemaining = (type) => {
    const b = balance.find((b) => b.type === type);
    return b ? b.remaining : null;
  };

  const selectedRemaining = getRemaining(form.type);
  const selectedTypeCfg = LEAVE_TYPES.find((t) => t.value === form.type);

  const validate = () => {
    const errs = {};
    if (!form.type) errs.type = "Leave type is required";
    if (!form.start_date) errs.start_date = "Start date is required";
    if (!form.end_date) errs.end_date = "End date is required";
    if (
      form.start_date &&
      form.end_date &&
      dayjs(form.start_date).isAfter(dayjs(form.end_date))
    ) {
      errs.end_date = "End date must be after start date";
    }
    if (!form.reason.trim()) errs.reason = "Reason is required";
    else if (form.reason.trim().length < 10)
      errs.reason = "Please provide a more detailed reason (min 10 chars)";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await leavesAPI.submit({
        type: form.type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason.trim(),
      });
      toast.success("Leave request submitted successfully!");
      onSuccess();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to submit leave request");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const today = dayjs().format("YYYY-MM-DD");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg glass-card border border-white/10 rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Apply for Leave
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Submit a new leave request
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/60 border border-white/10
                       text-slate-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Leave Type */}
          <div>
            <label className="form-label">Leave Type *</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {LEAVE_TYPES.map((t) => {
                const rem = getRemaining(t.value);
                const selected = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, type: t.value }));
                      setErrors((p) => ({ ...p, type: "" }));
                    }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
                      selected
                        ? cn(
                            t.bg,
                            t.border,
                            t.color,
                            "border-opacity-60 ring-1 ring-inset",
                            t.border.replace("border-", "ring-"),
                          )
                        : "bg-slate-800/40 border-white/[0.06] text-slate-400 hover:border-white/20",
                    )}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-xs font-semibold truncate",
                          selected ? t.color : "",
                        )}
                      >
                        {t.label}
                      </p>
                      {rem !== null && (
                        <p className="text-[10px] text-slate-500">
                          {rem} days left
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.type && (
              <p className="text-xs text-red-400 mt-1">{errors.type}</p>
            )}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                min={today}
                onChange={handleChange}
                className={cn(
                  "form-input w-full mt-1",
                  errors.start_date && "border-red-500/50",
                )}
              />
              {errors.start_date && (
                <p className="text-xs text-red-400 mt-1">{errors.start_date}</p>
              )}
            </div>
            <div>
              <label className="form-label">End Date *</label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                min={form.start_date || today}
                onChange={handleChange}
                className={cn(
                  "form-input w-full mt-1",
                  errors.end_date && "border-red-500/50",
                )}
              />
              {errors.end_date && (
                <p className="text-xs text-red-400 mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Estimated days info */}
          {estimatedDays > 0 && (
            <div
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl border text-sm",
                selectedTypeCfg?.bg,
                selectedTypeCfg?.border,
              )}
            >
              <Calendar size={14} className={selectedTypeCfg?.color} />
              <span className="text-slate-300">
                Estimated{" "}
                <span className={cn("font-semibold", selectedTypeCfg?.color)}>
                  {estimatedDays} working day{estimatedDays !== 1 ? "s" : ""}
                </span>
                {selectedRemaining !== null && form.type !== "unpaid" && (
                  <> &bull; {selectedRemaining} days available</>
                )}
              </span>
            </div>
          )}

          {/* Insufficient balance warning */}
          {estimatedDays > 0 &&
            selectedRemaining !== null &&
            form.type !== "unpaid" &&
            estimatedDays > selectedRemaining && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                <AlertCircle size={14} />
                <span>
                  Insufficient leave balance. You only have {selectedRemaining}{" "}
                  days remaining.
                </span>
              </div>
            )}

          {/* Reason */}
          <div>
            <label className="form-label">Reason *</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              placeholder="Provide a brief reason for your leave..."
              className={cn(
                "form-input w-full mt-1 resize-none",
                errors.reason && "border-red-500/50",
              )}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.reason ? (
                <p className="text-xs text-red-400">{errors.reason}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-slate-600">
                {form.reason.length} chars
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Submit Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Approve / Reject Modal
// ─────────────────────────────────────────────

function ReviewModal({ leave, action, onClose, onSuccess }) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const isApprove = action === "approve";
  const typeCfg = LEAVE_TYPES.find((t) => t.value === leave?.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isApprove) {
        await leavesAPI.approve(leave.id, { review_note: note });
        toast.success("Leave request approved");
      } else {
        await leavesAPI.reject(leave.id, { review_note: note });
        toast.success("Leave request rejected");
      }
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, "Action failed. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  if (!leave) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md glass-card border border-white/10 rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between p-5 border-b border-white/[0.06]",
            isApprove ? "bg-green-500/5" : "bg-red-500/5",
          )}
        >
          <div className="flex items-center gap-3">
            {isApprove ? (
              <CheckCircle2 size={20} className="text-green-400" />
            ) : (
              <XCircle size={20} className="text-red-400" />
            )}
            <div>
              <h2 className="text-base font-semibold text-white">
                {isApprove ? "Approve" : "Reject"} Leave Request
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {leave.user?.name || "Employee"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800/60 border border-white/10 text-slate-400 hover:text-white"
          >
            <X size={13} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Leave summary */}
          <div
            className={cn(
              "p-4 rounded-xl border",
              typeCfg?.bg,
              typeCfg?.border,
            )}
          >
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Type</p>
                <p className={cn("font-semibold", typeCfg?.color)}>
                  {typeCfg?.icon} {typeCfg?.label}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Duration</p>
                <p className="text-white font-semibold">
                  {leave.days_count} day{leave.days_count !== 1 ? "s" : ""}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">From</p>
                <p className="text-slate-200">{formatDate(leave.start_date)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">To</p>
                <p className="text-slate-200">{formatDate(leave.end_date)}</p>
              </div>
            </div>
            {leave.reason && (
              <div className="mt-3 pt-3 border-t border-white/[0.06]">
                <p className="text-slate-500 text-xs mb-0.5">Reason</p>
                <p className="text-slate-300 text-sm">{leave.reason}</p>
              </div>
            )}
          </div>

          {/* Review note */}
          <div>
            <label className="form-label">
              Review Note{" "}
              <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={
                isApprove
                  ? "Add any comments for the employee…"
                  : "Explain why this request is being rejected…"
              }
              className="form-input w-full mt-1 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all",
                isApprove
                  ? "bg-green-600 hover:bg-green-500 text-white disabled:opacity-60"
                  : "bg-red-600 hover:bg-red-500 text-white disabled:opacity-60",
              )}
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isApprove ? (
                <Check size={14} />
              ) : (
                <X size={14} />
              )}
              {saving ? "Processing…" : isApprove ? "Approve" : "Reject"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Cancel Confirmation Modal
// ─────────────────────────────────────────────

function CancelModal({ leave, onClose, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      await leavesAPI.cancel(leave.id);
      toast.success("Leave request cancelled successfully");
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to cancel request"));
    } finally {
      setLoading(false);
    }
  };

  if (!leave) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm glass-card border border-white/10 rounded-2xl shadow-2xl p-6 animate-fade-in">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <AlertCircle size={22} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white mb-1">
              Cancel Leave Request?
            </h2>
            <p className="text-sm text-slate-400">
              This will permanently cancel your{" "}
              <span className="text-slate-200 font-medium">
                {LEAVE_TYPES.find((t) => t.value === leave.type)?.label}
              </span>{" "}
              request for{" "}
              <span className="text-slate-200 font-medium">
                {formatDateShort(leave.start_date)}
                {leave.start_date !== leave.end_date
                  ? ` – ${formatDateShort(leave.end_date)}`
                  : ""}
              </span>
              .
            </p>
          </div>
          <div className="flex items-center gap-3 w-full">
            <button onClick={onClose} className="btn-secondary flex-1">
              Keep It
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         bg-red-600 hover:bg-red-500 text-white font-semibold text-sm
                         disabled:opacity-60 transition-all"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              {loading ? "Cancelling…" : "Cancel Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Leave Row (table)
// ─────────────────────────────────────────────

function LeaveRow({
  leave,
  isAdminOrManager,
  user,
  onApprove,
  onReject,
  onCancel,
}) {
  const isOwnLeave = leave.user_id === user?.id;
  const canCancel = isOwnLeave && leave.status === "pending";
  const canReview = isAdminOrManager && leave.status === "pending";

  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors group">
      {/* Employee — admin/manager only */}
      {isAdminOrManager && (
        <td className="px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar user={leave.user} size={7} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {leave.user?.name || "—"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {leave.user?.department?.name || "—"}
              </p>
            </div>
          </div>
        </td>
      )}

      {/* Type */}
      <td className="px-4 py-3.5">
        <TypeBadge type={leave.type} />
      </td>

      {/* Period */}
      <td className="px-4 py-3.5">
        <div>
          <p className="text-sm text-slate-200 font-medium">
            {formatDateShort(leave.start_date)}
            {leave.start_date !== leave.end_date && (
              <> → {formatDateShort(leave.end_date)}</>
            )}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {leave.days_count} working day{leave.days_count !== 1 ? "s" : ""}
          </p>
        </div>
      </td>

      {/* Reason */}
      <td className="px-4 py-3.5 max-w-[180px]">
        <p className="text-sm text-slate-400 truncate" title={leave.reason}>
          {leave.reason || "—"}
        </p>
      </td>

      {/* Status */}
      <td className="px-4 py-3.5">
        <StatusBadge status={leave.status} />
      </td>

      {/* Reviewer */}
      <td className="px-4 py-3.5">
        {leave.reviewer ? (
          <p className="text-sm text-slate-400">{leave.reviewer.name}</p>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )}
        {leave.review_note && (
          <p
            className="text-xs text-slate-600 mt-0.5 truncate max-w-[120px]"
            title={leave.review_note}
          >
            {leave.review_note}
          </p>
        )}
      </td>

      {/* Submitted */}
      <td className="px-4 py-3.5">
        <p className="text-xs text-slate-500">{timeAgo(leave.created_at)}</p>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          {canReview && (
            <>
              <button
                onClick={() => onApprove(leave)}
                title="Approve"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                           bg-green-500/10 text-green-400 border border-green-500/20
                           hover:bg-green-500/20 transition-all"
              >
                <Check size={11} />
                Approve
              </button>
              <button
                onClick={() => onReject(leave)}
                title="Reject"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                           bg-red-500/10 text-red-400 border border-red-500/20
                           hover:bg-red-500/20 transition-all"
              >
                <X size={11} />
                Reject
              </button>
            </>
          )}
          {canCancel && (
            <button
              onClick={() => onCancel(leave)}
              title="Cancel request"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold
                         bg-slate-700/60 text-slate-400 border border-white/[0.06]
                         hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
            >
              <Ban size={11} />
              Cancel
            </button>
          )}
          {!canReview && !canCancel && (
            <span className="text-xs text-slate-600">—</span>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
//  Admin Add Leave Modal
// ─────────────────────────────────────────────

function AdminAddLeaveModal({ onClose, onSuccess }) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [form, setForm] = useState({
    user_id: "",
    type: "sick",
    start_date: "",
    end_date: "",
    reason: "",
    status: "approved",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const estimatedDays = getWorkingDaysBetween(form.start_date, form.end_date);
  const selectedTypeCfg = LEAVE_TYPES.find((t) => t.value === form.type);

  // Fetch employees on mount
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await employeesAPI.getAll({ limit: 1000 });
        setEmployees(res.data.data || []);
      } catch (err) {
        toast.error("Failed to load employees");
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [toast]);

  const validate = () => {
    const errs = {};
    if (!form.user_id) errs.user_id = "Employee is required";
    if (!form.type) errs.type = "Leave type is required";
    if (!form.start_date) errs.start_date = "Start date is required";
    if (!form.end_date) errs.end_date = "End date is required";
    if (
      form.start_date &&
      form.end_date &&
      dayjs(form.start_date).isAfter(dayjs(form.end_date))
    ) {
      errs.end_date = "End date must be after start date";
    }
    if (!form.reason.trim()) errs.reason = "Reason is required";
    else if (form.reason.trim().length < 10)
      errs.reason = "Please provide a more detailed reason (min 10 chars)";
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await leavesAPI.adminCreate({
        user_id: parseInt(form.user_id),
        type: form.type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason.trim(),
        status: form.status,
      });
      toast.success("Leave request created successfully!");
      onSuccess();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to create leave request");
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const today = dayjs().format("YYYY-MM-DD");
  const selectedEmployee = employees.find(emp => emp.id === parseInt(form.user_id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg glass-card border border-white/10 rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Add Leave Request
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Create a leave request for an employee
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/60 border border-white/10
                       text-slate-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Employee Selection */}
          <div>
            <label className="form-label">Employee *</label>
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              disabled={loadingEmployees}
              className={cn(
                "form-input w-full mt-1",
                errors.user_id && "border-red-500/50",
              )}
            >
              <option value="">
                {loadingEmployees ? "Loading employees..." : "Select an employee"}
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.department?.name || "No Department"}
                </option>
              ))}
            </select>
            {errors.user_id && (
              <p className="text-xs text-red-400 mt-1">{errors.user_id}</p>
            )}
          </div>

          {/* Leave Type */}
          <div>
            <label className="form-label">Leave Type *</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {LEAVE_TYPES.map((t) => {
                const selected = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setForm((p) => ({ ...p, type: t.value }));
                      setErrors((p) => ({ ...p, type: "" }));
                    }}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-xl border text-left transition-all",
                      selected
                        ? cn(
                            t.bg,
                            t.border,
                            t.color,
                            "border-opacity-60 ring-1 ring-inset",
                            t.border.replace("border-", "ring-"),
                          )
                        : "bg-slate-800/40 border-white/[0.06] text-slate-400 hover:border-white/20",
                    )}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-xs font-semibold truncate",
                          selected ? t.color : "",
                        )}
                      >
                        {t.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.type && (
              <p className="text-xs text-red-400 mt-1">{errors.type}</p>
            )}
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className={cn(
                  "form-input w-full mt-1",
                  errors.start_date && "border-red-500/50",
                )}
              />
              {errors.start_date && (
                <p className="text-xs text-red-400 mt-1">{errors.start_date}</p>
              )}
            </div>
            <div>
              <label className="form-label">End Date *</label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                min={form.start_date || today}
                onChange={handleChange}
                className={cn(
                  "form-input w-full mt-1",
                  errors.end_date && "border-red-500/50",
                )}
              />
              {errors.end_date && (
                <p className="text-xs text-red-400 mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="form-label">Status *</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="form-input w-full mt-1"
            >
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Estimated days info */}
          {estimatedDays > 0 && (
            <div
              className={cn(
                "flex items-center gap-2.5 p-3 rounded-xl border text-sm",
                selectedTypeCfg?.bg,
                selectedTypeCfg?.border,
              )}
            >
              <Calendar size={14} className={selectedTypeCfg?.color} />
              <span className="text-slate-300">
                Estimated{" "}
                <span className={cn("font-semibold", selectedTypeCfg?.color)}>
                  {estimatedDays} working day{estimatedDays !== 1 ? "s" : ""}
                </span>
                {selectedEmployee && (
                  <> for {selectedEmployee.name}</>
                )}
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="form-label">Reason *</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              placeholder="Provide a reason for this leave request..."
              className={cn(
                "form-input w-full mt-1 resize-none",
                errors.reason && "border-red-500/50",
              )}
            />
            <div className="flex items-center justify-between mt-1">
              {errors.reason ? (
                <p className="text-xs text-red-400">{errors.reason}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-slate-600">
                {form.reason.length} chars
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || loadingEmployees}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Create Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Empty State
// ─────────────────────────────────────────────

function EmptyState({ hasFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20
                      flex items-center justify-center mb-4"
      >
        <CalendarDays size={28} className="text-teal-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">
        {hasFilters ? "No matching leave requests" : "No leave requests yet"}
      </h3>
      <p className="text-sm text-slate-500 max-w-xs">
        {hasFilters
          ? "Try adjusting your filters to see more results."
          : "Submit your first leave request using the button above."}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Table Skeleton
// ─────────────────────────────────────────────

function TableSkeleton({ cols }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-white/[0.04]">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="skeleton h-4 rounded"
                style={{ width: `${60 + ((j * 15) % 40)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────
//  Main Leaves Page
// ─────────────────────────────────────────────

export default function LeavesPage() {
  const { user, isAdminOrManager } = useAuth();
  const { toast } = useToast();

  // Data
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Loading
  const [loading, setLoading] = useState(true);
  const [balanceLoading, setBalanceLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [yearFilter, setYearFilter] = useState(
    String(new Date().getFullYear()),
  );
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [page, setPage] = useState(1);

  // Modals
  const [showApply, setShowApply] = useState(false);
  const [showAdminAddModal, setShowAdminAddModal] = useState(false);
  const [reviewLeave, setReviewLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState(null);
  const [cancelLeave, setCancelLeave] = useState(null);

  // Refresh key
  const [refreshKey, setRefreshKey] = useState(0);

  const yearOptions = getYearOptions(3);

  // ── Fetch leaves ──
  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const params = cleanParams({
        page,
        limit: 10,
        status: statusFilter || undefined,
        year: yearFilter || undefined,
        search: isAdminOrManager ? search || undefined : undefined,
        department: isAdminOrManager ? deptFilter || undefined : undefined,
      });

      let res;
      if (isAdminOrManager) {
        res = await leavesAPI.getAll(params);
      } else {
        res = await leavesAPI.getMy(params);
      }

      setLeaves(res.data.data || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load leave requests"));
    } finally {
      setLoading(false);
    }
  }, [
    page,
    statusFilter,
    yearFilter,
    search,
    deptFilter,
    isAdminOrManager,
    refreshKey,
  ]);

  // ── Fetch balance ──
  const fetchBalance = useCallback(async () => {
    if (!user?.id) return;
    setBalanceLoading(true);
    try {
      const res = await leavesAPI.getBalance(user.id);
      setBalance(res.data.data || []);
    } catch {
      // ignore balance errors
    } finally {
      setBalanceLoading(false);
    }
  }, [user?.id]);

  // ── Fetch departments (admin/manager) ──
  const fetchDepartments = useCallback(async () => {
    if (!isAdminOrManager) return;
    try {
      const res = await departmentsAPI.getAll({ limit: 100 });
      setDepartments(res.data.data || []);
    } catch {
      // ignore
    }
  }, [isAdminOrManager]);

  useEffect(() => {
    fetchLeaves();
  }, [fetchLeaves]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, refreshKey]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, yearFilter, search, deptFilter]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setPage(1);
  };

  const handleApprove = (leave) => {
    setReviewLeave(leave);
    setReviewAction("approve");
  };

  const handleReject = (leave) => {
    setReviewLeave(leave);
    setReviewAction("reject");
  };

  const handleReviewClose = () => {
    setReviewLeave(null);
    setReviewAction(null);
  };

  const handleSuccess = () => {
    handleReviewClose();
    setCancelLeave(null);
    setShowApply(false);
    setShowAdminAddModal(false);
    handleRefresh();
  };

  const colCount = isAdminOrManager ? 8 : 7;

  const hasFilters = !!(
    statusFilter ||
    search ||
    deptFilter ||
    (yearFilter && yearFilter !== String(new Date().getFullYear()))
  );

  return (
    <DashboardLayout
      pageTitle="Leave Requests"
      pageSubtitle={
        isAdminOrManager
          ? "Review and manage all employee leave requests"
          : "Manage your leave requests and check your leave balance"
      }
      actions={
        <div className="flex items-center gap-3">
          {isAdminOrManager && (
            <button
              onClick={() => setShowAdminAddModal(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <Plus size={15} />
              Add Leave Request
            </button>
          )}
          <button
            onClick={() => setShowApply(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} />
            Apply for Leave
          </button>
        </div>
      }
    >
      {/* ── Balance Cards ── */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {["sick", "casual", "annual", "unpaid"].map((type) => {
          const b = balance.find((x) => x.type === type);
          return (
            <BalanceCard
              key={type}
              type={type}
              used={b?.used ?? 0}
              entitlement={
                b?.entitlement ??
                LEAVE_TYPES.find((t) => t.value === type)?.entitlement ??
                0
              }
              remaining={
                b?.remaining ??
                LEAVE_TYPES.find((t) => t.value === type)?.entitlement ??
                0
              }
              loading={balanceLoading}
            />
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="mt-6 glass-card border border-white/[0.06] p-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          {/* Status tabs */}
          <div className="flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-white/[0.06]">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  statusFilter === tab.value
                    ? "bg-teal-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Year */}
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="form-input text-sm py-1.5 min-w-[100px]"
          >
            {yearOptions.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>

          {/* Admin/manager: search + dept */}
          {isAdminOrManager && (
            <>
              <div className="relative flex-1 min-w-[160px]">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee…"
                  className="form-input w-full pl-8 py-1.5 text-sm"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="form-input text-sm py-1.5 min-w-[140px]"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={() => {
                setStatusFilter("");
                setSearch("");
                setDeptFilter("");
                setYearFilter(String(new Date().getFullYear()));
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400
                         hover:text-white bg-slate-800/60 border border-white/[0.06] hover:border-white/20 transition-all"
            >
              <X size={12} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="mt-4 glass-card border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] bg-slate-800/40">
                {isAdminOrManager && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Employee
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Reviewer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={colCount} />
              ) : leaves.length === 0 ? (
                <tr>
                  <td colSpan={colCount} className="px-4 py-2">
                    <EmptyState hasFilters={hasFilters} />
                  </td>
                </tr>
              ) : (
                leaves.map((leave) => (
                  <LeaveRow
                    key={leave.id}
                    leave={leave}
                    isAdminOrManager={isAdminOrManager}
                    user={user}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onCancel={setCancelLeave}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && leaves.length > 0 && (
          <div className="px-4 pb-4">
            <Pagination
              page={pagination.page || page}
              totalPages={pagination.totalPages || 1}
              total={pagination.total || 0}
              limit={pagination.limit || 10}
              hasPrevPage={pagination.hasPrevPage}
              hasNextPage={pagination.hasNextPage}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showApply && (
        <ApplyLeaveModal
          onClose={() => setShowApply(false)}
          onSuccess={handleSuccess}
          balance={balance}
        />
      )}

      {showAdminAddModal && (
        <AdminAddLeaveModal
          onClose={() => setShowAdminAddModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {reviewLeave && reviewAction && (
        <ReviewModal
          leave={reviewLeave}
          action={reviewAction}
          onClose={handleReviewClose}
          onSuccess={handleSuccess}
        />
      )}

      {cancelLeave && (
        <CancelModal
          leave={cancelLeave}
          onClose={() => setCancelLeave(null)}
          onSuccess={handleSuccess}
        />
      )}
    </DashboardLayout>
  );
}
