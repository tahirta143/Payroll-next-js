"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { attendanceAPI, employeesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { animatePageEntrance, animateModalOpen, animateModalClose } from "@/lib/gsap";
import {
  cn,
  formatDate,
  formatTime,
  formatWorkHours,
  getStatusConfig,
  getInitials,
  getAvatarUrl,
  getErrorMessage,
  cleanParams,
} from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  Edit3,
  X,
  Save,
  Search,
  Calendar,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Users,
  UserX,
  Plus,
} from "lucide-react";
import dayjs from "dayjs";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "half_day", label: "Half Day" },
  { value: "leave", label: "On Leave" },
];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ─────────────────────────────────────────────
//  Calendar Heatmap
// ─────────────────────────────────────────────

function CalendarHeatmap({ records, month, year, onMonthChange }) {
  const startOfMonth = dayjs(`${year}-${String(month).padStart(2, "0")}-01`);
  const daysInMonth = startOfMonth.daysInMonth();
  const startDow = startOfMonth.day(); // 0 = Sunday

  // Build a map: date string → status
  const statusMap = {};
  records.forEach((r) => {
    statusMap[r.date] = r.status;
  });

  const today = dayjs().format("YYYY-MM-DD");

  // Build calendar cells (blanks + days)
  const cells = [];
  for (let i = 0; i < startDow; i++) {
    cells.push({ type: "blank", key: `blank-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = dayjs(dateStr).day();
    const isWeekend = dow === 0 || dow === 6;
    const isToday = dateStr === today;
    const isFuture = dateStr > today;
    const status = statusMap[dateStr];
    cells.push({
      type: "day",
      key: dateStr,
      date: d,
      dateStr,
      status,
      isWeekend,
      isToday,
      isFuture,
    });
  }

  const getDayClass = (cell) => {
    if (cell.isToday) return "cal-day cal-day-today font-bold";
    if (cell.isFuture)
      return "cal-day bg-slate-800/20 text-slate-700 cursor-default";
    if (cell.isWeekend) return "cal-day-weekend";
    if (!cell.status)
      return "cal-day bg-slate-800/30 text-slate-600 hover:bg-slate-700/30";
    return `cal-day-${cell.status}`;
  };

  const prevMonth = () => {
    const d = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).subtract(
      1,
      "month",
    );
    onMonthChange(d.month() + 1, d.year());
  };
  const nextMonth = () => {
    const d = dayjs(`${year}-${String(month).padStart(2, "0")}-01`).add(
      1,
      "month",
    );
    onMonthChange(d.month() + 1, d.year());
  };

  const isCurrentMonth =
    month === dayjs().month() + 1 && year === dayjs().year();

  // Monthly stats
  const monthRecords = records.filter((r) => {
    const d = dayjs(r.date);
    return d.month() + 1 === month && d.year() === year;
  });
  const presentCount = monthRecords.filter(
    (r) => r.status === "present",
  ).length;
  const lateCount = monthRecords.filter((r) => r.status === "late").length;
  const absentCount = monthRecords.filter((r) => r.status === "absent").length;
  const leaveCount = monthRecords.filter((r) => r.status === "leave").length;

  return (
    <div className="glass-card p-4 sm:p-5 lg:p-6 overflow-x-auto">
      <div className="min-w-[320px] lg:min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
          <div>
            <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
              Attendance Calendar
            </h3>
            <p className="text-sm text-muted-foreground">
              {startOfMonth.format("MMMM YYYY")}
            </p>
          </div>
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center
                     bg-secondary/60 border border-border
                     text-muted-foreground hover:text-foreground hover:bg-secondary
                     transition-all duration-150"
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              onClick={() => onMonthChange(dayjs().month() + 1, dayjs().year())}
              disabled={isCurrentMonth}
              className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium",
                "border transition-all duration-150",
                isCurrentMonth
                  ? "border-border opacity-40 cursor-not-allowed text-muted-foreground"
                  : "border-primary hover:bg-primary hover:text-primary-foreground cursor-pointer"
              )}
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-lg flex items-center justify-center
                     bg-secondary/60 border border-border
                     text-muted-foreground hover:text-foreground hover:bg-secondary
                     transition-all duration-150"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Monthly summary pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            {
              label: "Present",
              count: presentCount,
              cls: "bg-green-500/10 text-green-400 border-green-500/20",
            },
            {
              label: "Late",
              count: lateCount,
              cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",
            },
            {
              label: "Absent",
              count: absentCount,
              cls: "bg-red-500/10 text-red-400 border-red-500/20",
            },
            {
              label: "Leave",
              count: leaveCount,
              cls: "bg-blue-500/10 text-blue-400 border-blue-500/20",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold",
                s.cls
              )}
            >
              <span>{s.count}</span>
              <span className="font-normal opacity-80">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Weekday headers - Responsive */}
        <div className="grid grid-cols-7 gap-0.5 mb-1 text-xs">
          {WEEKDAY_LABELS.map((d) => (
            <div
              key={d}
              className="text-center text-muted-foreground py-2 font-semibold uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid - Responsive */}
        <div className="grid grid-cols-7 gap-0.5 text-xs">
          {cells.map((cell) => {
            if (cell.type === "blank") {
              return <div key={cell.key} />;
            }
            return (
              <div
                key={cell.key}
                title={
                  cell.status ? `${cell.dateStr}: ${cell.status}` : cell.dateStr
                }
                className={cn("cal-day text-xs select-none", getDayClass(cell))}
              >
                {cell.date}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-border">
          {[
            { label: "Present", color: "bg-green-500/40" },
            { label: "Late", color: "bg-amber-500/40" },
            { label: "Absent", color: "bg-red-500/40" },
            { label: "Leave", color: "bg-blue-500/40" },
            { label: "Half Day", color: "bg-violet-500/40" },
            { label: "Weekend", color: "bg-secondary/60" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={cn("w-3 h-3 rounded-sm", l.color)} />
              <span className="text-xs text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Check-In Panel
// ─────────────────────────────────────────────

function CheckInPanel({ onAction }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const loadToday = useCallback(async () => {
    try {
      const res = await attendanceAPI.getToday();
      setRecord(res.data.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      let lat = null,
        lng = null;
      try {
        const pos = await new Promise((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }),
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        /* optional */
      }

      const res = await attendanceAPI.checkIn({
        latitude: lat,
        longitude: lng,
      });
      setRecord(res.data.data);
      toast.success(res.data.message || "Checked in! Have a productive day 🎯");
      onAction?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Check-in failed"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await attendanceAPI.checkOut();
      setRecord(res.data.data);
      toast.success("Checked out! See you tomorrow 👋");
      onAction?.();
    } catch (err) {
      toast.error(getErrorMessage(err, "Check-out failed"));
    } finally {
      setActionLoading(false);
    }
  };

  const isIn = !!record?.check_in_time;
  const isOut = !!record?.check_out_time;
  const cfg = record ? getStatusConfig(record.status) : null;

  return (
    <div className="glass-card p-5 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-heading font-semibold text-slate-200">
          Today&apos;s Status
        </h3>
        {cfg && (
          <span className={cfg.badgeClass}>
            <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
            {cfg.label}
          </span>
        )}
      </div>

      {/* Live Clock */}
      <div className="text-center py-4 rounded-xl bg-slate-900/60 border border-white/[0.05]">
        <p className="text-4xl font-mono font-bold text-white tabular-nums tracking-tight leading-none">
          {currentTime || "—"}
        </p>
        <p className="text-xs text-slate-500 mt-2">{currentDate}</p>
      </div>

      {/* Times grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="skeleton h-16 rounded-lg" />
          <div className="skeleton h-16 rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div
            className="flex flex-col items-center justify-center p-3 rounded-xl
                          bg-green-500/[0.07] border border-green-500/15"
          >
            <span className="text-[10px] font-semibold text-green-600 uppercase tracking-wider mb-1">
              Check In
            </span>
            <span className="text-xl font-mono font-bold text-green-400 tabular-nums">
              {record?.check_in_time ? formatTime(record.check_in_time) : "—"}
            </span>
          </div>
          <div
            className="flex flex-col items-center justify-center p-3 rounded-xl
                          bg-blue-500/[0.07] border border-blue-500/15"
          >
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Check Out
            </span>
            <span className="text-xl font-mono font-bold text-blue-400 tabular-nums">
              {record?.check_out_time ? formatTime(record.check_out_time) : "—"}
            </span>
          </div>
        </div>
      )}

      {/* Work hours */}
      {record?.work_hours > 0 && (
        <div
          className="flex items-center justify-between px-3 py-2 rounded-lg
                        bg-teal-500/[0.06] border border-teal-500/15"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={13} className="text-teal-400" strokeWidth={2} />
            <span className="text-xs text-slate-400">Work hours</span>
          </div>
          <span className="text-sm font-bold text-teal-400">
            {formatWorkHours(record.work_hours)}
          </span>
        </div>
      )}

      {/* Location */}
      {record?.location && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg
                        bg-slate-800/40 border border-white/[0.05]"
        >
          <MapPin size={12} className="text-slate-500 flex-shrink-0" />
          <span className="text-[11px] text-slate-500 truncate font-mono">
            {record.location}
          </span>
        </div>
      )}

      {/* Action button */}
      {!loading && (
        <div className="mt-auto">
          {!isIn && (
            <button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="btn-primary w-full gap-2"
            >
              {actionLoading ? (
                <>
                  <span className="w-4 h-4 spinner" />
                  <span>Checking in…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} strokeWidth={2.5} />
                  <span>Check In Now</span>
                </>
              )}
            </button>
          )}
          {isIn && !isOut && (
            <button
              onClick={handleCheckOut}
              disabled={actionLoading}
              className="btn w-full gap-2 bg-blue-600/20 text-blue-400 border border-blue-500/30
                         hover:bg-blue-600 hover:text-white hover:border-blue-600"
            >
              {actionLoading ? (
                <>
                  <span className="w-4 h-4 spinner" />
                  <span>Checking out…</span>
                </>
              ) : (
                <>
                  <XCircle size={16} strokeWidth={2.5} />
                  <span>Check Out Now</span>
                </>
              )}
            </button>
          )}
          {isIn && isOut && (
            <div
              className="flex items-center justify-center gap-2 py-2.5 rounded-lg
                            bg-green-500/10 border border-green-500/20"
            >
              <CheckCircle2
                size={14}
                className="text-green-400"
                strokeWidth={2.5}
              />
              <span className="text-sm font-semibold text-green-400">
                All done for today!
              </span>
            </div>
          )}
        </div>
      )}

      {/* Geolocation note */}
      <p className="flex items-center gap-1.5 text-[11px] text-slate-600">
        <MapPin size={10} />
        Location captured automatically on check-in
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Add Attendance Modal (Admin Only)
// ─────────────────────────────────────────────

function AddAttendanceModal({ onClose, onSave }) {
  const { toast } = useToast();
  const modalRef = useRef(null);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [form, setForm] = useState({
    user_id: "",
    date: dayjs().format("YYYY-MM-DD"),
    status: "present",
    check_in_time: "",
    check_out_time: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);

  // Animate modal open on mount
  useEffect(() => {
    if (modalRef.current) {
      animateModalOpen(modalRef.current);
    }
  }, []);

  // Fetch employees for dropdown
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await employeesAPI.getAll({ limit: 100 });
        setEmployees(res.data.data || []);
      } catch (err) {
        toast.error("Failed to load employees");
      } finally {
        setLoadingEmployees(false);
      }
    };
    fetchEmployees();
  }, [toast]);

  // Handle close with animation
  const handleClose = () => {
    if (modalRef.current) {
      animateModalClose(modalRef.current, onClose);
    } else {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!form.user_id || !form.date || !form.status) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.check_in_time) payload.check_in_time = payload.check_in_time + ":00";
      if (payload.check_out_time) payload.check_out_time = payload.check_out_time + ":00";
      
      await attendanceAPI.markEmployee(payload);
      toast.success("Employee attendance marked successfully");
      onSave?.();
      handleClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to mark attendance"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        ref={modalRef}
        className="glass-card w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-heading font-semibold text-white">
              Add Employee Attendance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manually mark attendance for an employee
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center
                       bg-slate-800/60 border border-white/[0.07]
                       text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Employee Selection */}
          <div>
            <label className="form-label">Employee *</label>
            <select
              name="user_id"
              value={form.user_id}
              onChange={handleChange}
              disabled={loadingEmployees}
              className="form-input"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="form-label">Date *</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="form-input"
            />
          </div>

          {/* Status */}
          <div>
            <label className="form-label">Status *</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="form-input"
            >
              {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Check-In Time</label>
              <input
                type="time"
                name="check_in_time"
                value={form.check_in_time}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Check-Out Time</label>
              <input
                type="time"
                name="check_out_time"
                value={form.check_out_time}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="form-label">Note</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              placeholder="Optional note..."
              className="form-input resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={handleClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 spinner" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Save size={14} strokeWidth={2.5} />
                <span>Mark Attendance</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Edit Attendance Modal (Admin / Manager)
// ─────────────────────────────────────────────

function EditModal({ record, onClose, onSave }) {
  const { toast } = useToast();
  const modalRef = useRef(null);
  const [form, setForm] = useState({
    check_in_time: record?.check_in_time?.slice(0, 5) || "",
    check_out_time: record?.check_out_time?.slice(0, 5) || "",
    status: record?.status || "present",
    note: record?.note || "",
  });
  const [saving, setSaving] = useState(false);

  // Animate modal open on mount
  useEffect(() => {
    if (modalRef.current) {
      animateModalOpen(modalRef.current);
    }
  }, []);

  // Handle close with animation
  const handleClose = () => {
    if (modalRef.current) {
      animateModalClose(modalRef.current, onClose);
    } else {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.check_in_time)
        payload.check_in_time = payload.check_in_time + ":00";
      if (payload.check_out_time)
        payload.check_out_time = payload.check_out_time + ":00";
      await attendanceAPI.update(record.id, payload);
      toast.success("Attendance record updated successfully");
      onSave?.();
      handleClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update record"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        ref={modalRef}
        className="glass-card w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-heading font-semibold text-white">
              Edit Attendance Record
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {formatDate(record?.date, "dddd, MMMM D, YYYY")}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center
                       bg-slate-800/60 border border-white/[0.07]
                       text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div>
            <label className="form-label">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="form-input"
            >
              {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Check-In Time</label>
              <input
                type="time"
                name="check_in_time"
                value={form.check_in_time}
                onChange={handleChange}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Check-Out Time</label>
              <input
                type="time"
                name="check_out_time"
                value={form.check_out_time}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="form-label">Admin Note</label>
            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              rows={3}
              placeholder="Reason for correction…"
              className="form-input resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={handleClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 gap-2"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 spinner" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Save size={14} strokeWidth={2.5} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Attendance Table
// ─────────────────────────────────────────────

function AttendanceTable({
  records,
  loading,
  pagination,
  onPageChange,
  onEdit,
  isAdminOrManager,
  isAdmin,
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-5 w-20 rounded-full" />
            <div className="skeleton h-4 w-14 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="empty-state py-16">
        <Calendar className="empty-state-icon" size={36} />
        <p className="empty-state-title">No records found</p>
        <p className="empty-state-desc">
          No attendance records match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {isAdminOrManager && <th>Employee</th>}
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Location</th>
              {isAdmin && <th className="text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {records.map((rec) => {
              const cfg = getStatusConfig(rec.status);
              const avatarUrl = getAvatarUrl(rec.user?.avatar_url);
              const initials = getInitials(rec.user?.name);

              return (
                <tr key={rec.id}>
                  {/* Employee (admin view) */}
                  {isAdminOrManager && (
                    <td>
                      <div className="flex items-center gap-2.5">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={rec.user?.name}
                            className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full avatar-fallback text-[10px] flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate max-w-[120px]">
                            {rec.user?.name || "—"}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[120px]">
                            {rec.user?.department?.name || ""}
                          </p>
                        </div>
                      </div>
                    </td>
                  )}

                  {/* Date */}
                  <td>
                    <div>
                      <p className="text-sm text-slate-200 font-medium">
                        {formatDate(rec.date, "MMM D, YYYY")}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {dayjs(rec.date).format("dddd")}
                      </p>
                    </div>
                  </td>

                  {/* Check In */}
                  <td>
                    <span
                      className={cn(
                        "text-sm font-mono tabular-nums",
                        rec.check_in_time ? "text-green-400" : "text-slate-600",
                      )}
                    >
                      {rec.check_in_time ? formatTime(rec.check_in_time) : "—"}
                    </span>
                  </td>

                  {/* Check Out */}
                  <td>
                    <span
                      className={cn(
                        "text-sm font-mono tabular-nums",
                        rec.check_out_time ? "text-blue-400" : "text-slate-600",
                      )}
                    >
                      {rec.check_out_time
                        ? formatTime(rec.check_out_time)
                        : "—"}
                    </span>
                  </td>

                  {/* Duration */}
                  <td>
                    <span className="text-sm text-slate-300 tabular-nums">
                      {rec.work_hours > 0
                        ? formatWorkHours(rec.work_hours)
                        : "—"}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={cfg.badgeClass}>
                      <span
                        className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)}
                      />
                      {cfg.label}
                    </span>
                  </td>

                  {/* Location */}
                  <td>
                    {rec.location ? (
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin size={11} strokeWidth={2} />
                        <span className="font-mono">
                          {rec.location.slice(0, 16)}…
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-700 text-xs">—</span>
                    )}
                  </td>

                  {/* Actions (admin only) */}
                  {isAdmin && (
                    <td className="text-right">
                      <button
                        onClick={() => onEdit?.(rec)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
                                   font-medium text-slate-400 border border-white/[0.07]
                                   hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/10
                                   transition-all duration-150"
                      >
                        <Edit3 size={12} strokeWidth={2} />
                        Edit
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="text-slate-300 font-medium">
              {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of{" "}
            <span className="text-slate-300 font-medium">
              {pagination.total}
            </span>{" "}
            records
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPrevPage}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         bg-slate-800/60 border border-white/[0.07]
                         text-slate-400 hover:text-white hover:bg-slate-700/60
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={13} strokeWidth={2.5} />
            </button>
            <span className="text-xs text-slate-400 px-2 tabular-nums">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         bg-slate-800/60 border border-white/[0.07]
                         text-slate-400 hover:text-white hover:bg-slate-700/60
                         disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={13} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Attendance Page
// ─────────────────────────────────────────────

export default function AttendancePage() {
  const { user, isAdminOrManager, isAdmin } = useAuth();
  const { toast } = useToast();
  const pageContentRef = useRef(null);

  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [calRecords, setCalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editRecord, setEditRecord] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [markAbsentLoading, setMarkAbsentLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filters, setFilters] = useState({
    status: "",
    search: "",
    startDate: dayjs().startOf("month").format("YYYY-MM-DD"),
    endDate: dayjs().endOf("month").format("YYYY-MM-DD"),
  });
  const [page, setPage] = useState(1);
  const [calMonth, setCalMonth] = useState(dayjs().month() + 1);
  const [calYear, setCalYear] = useState(dayjs().year());

  // Animate page content on mount
  useEffect(() => {
    if (!loading && pageContentRef.current) {
      animatePageEntrance(pageContentRef.current);
    }
  }, [loading]);

  // ── Fetch table records ──
  const fetchRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = cleanParams({
        page,
        limit: 15,
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status || undefined,
        search: filters.search || undefined,
      });

      let res;
      if (isAdminOrManager) {
        // Admin/Manager: Call /api/attendance/all to get all employees' records
        res = await attendanceAPI.getAll(params);
      } else {
        // Employee: Call /api/attendance/user/:id with own user ID to get only own records
        res = await attendanceAPI.getByUser(user.id, params);
      }
      setRecords(res.data.data || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load attendance records"));
    } finally {
      setLoading(false);
    }
  }, [user, isAdminOrManager, page, filters, refreshKey]);

  // ── Fetch calendar records (full month, no pagination) ──
  const fetchCalRecords = useCallback(async () => {
    if (!user) return;
    try {
      const startDate = `${calYear}-${String(calMonth).padStart(2, "0")}-01`;
      const endDate = dayjs(startDate).endOf("month").format("YYYY-MM-DD");
      const params = { startDate, endDate, limit: 100 };

      let res;
      if (isAdminOrManager) {
        // Admin/Manager: Call /api/attendance/all to get all employees' records for calendar
        res = await attendanceAPI.getAll(params);
      } else {
        // Employee: Call /api/attendance/user/:id with own user ID for calendar
        res = await attendanceAPI.getByUser(user.id, params);
      }
      setCalRecords(res.data.data || []);
    } catch {
      // ignore
    }
  }, [user, isAdminOrManager, calMonth, calYear]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchCalRecords();
  }, [fetchCalRecords]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    setPage(1);
  };

  const handleCalMonthChange = (m, y) => {
    setCalMonth(m);
    setCalYear(y);
  };

  const handleEditSave = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleMarkAbsent = async () => {
    if (!isAdmin) return;
    
    const today = dayjs().format('YYYY-MM-DD');
    const confirmed = window.confirm(
      `Mark all employees who haven't checked in today (${dayjs().format('MMMM D, YYYY')}) as absent?`
    );
    
    if (!confirmed) return;
    
    setMarkAbsentLoading(true);
    try {
      const res = await attendanceAPI.markAbsent({ date: today });
      toast.success(res.data.message || 'Employees marked absent successfully');
      setRefreshKey((k) => k + 1); // Refresh the data
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to mark employees absent'));
    } finally {
      setMarkAbsentLoading(false);
    }
  };

  return (
    <DashboardLayout
      pageTitle="Attendance"
      pageSubtitle="Track check-ins, check-outs and attendance history"
      actions={
        <button
          onClick={handleRefresh}
          className="btn-secondary btn-sm flex items-center gap-1.5"
        >
          <RefreshCw size={13} strokeWidth={2} />
          Refresh
        </button>
      }
    >
      <div className="space-y-5 pt-2" ref={pageContentRef}>
        {/* ── Top row: Check-in + Calendar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Check-In Panel (employees and managers only, not admins) */}
          {!isAdmin && (
            <div>
              <CheckInPanel onAction={handleRefresh} />
            </div>
          )}

          {/* Calendar Heatmap */}
          <div className={cn("lg:col-span-2", isAdmin && "lg:col-span-3")}>
            <CalendarHeatmap
              records={calRecords}
              month={calMonth}
              year={calYear}
              onMonthChange={handleCalMonthChange}
            />
          </div>
        </div>

        {/* ── Filters + Table ── */}
        <div className="glass-card">
          {/* Filter toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 flex-1 min-w-[180px]">
              <Filter size={14} className="text-slate-500 flex-shrink-0" />
              <h3 className="text-sm font-heading font-semibold text-slate-200">
                {isAdminOrManager
                  ? "All Attendance Records"
                  : "My Attendance Records"}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2 ml-auto">
              {/* Add Attendance button (admin only) */}
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary btn-sm flex items-center gap-1.5"
                >
                  <Plus size={13} strokeWidth={2} />
                  <span>Add Attendance</span>
                </button>
              )}

              {/* Mark Absent button (admin only) */}
              {isAdmin && (
                <button
                  onClick={handleMarkAbsent}
                  disabled={markAbsentLoading}
                  className="btn-secondary btn-sm flex items-center gap-1.5 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                >
                  {markAbsentLoading ? (
                    <>
                      <span className="w-3 h-3 spinner" />
                      <span>Marking...</span>
                    </>
                  ) : (
                    <>
                      <UserX size={13} strokeWidth={2} />
                      <span>Mark Absent</span>
                    </>
                  )}
                </button>
              )}

              {/* Search (admin) */}
              {isAdminOrManager && (
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Search employee…"
                    value={filters.search}
                    onChange={(e) =>
                      handleFilterChange("search", e.target.value)
                    }
                    className="form-input pl-8 py-1.5 text-xs w-44"
                  />
                </div>
              )}

              {/* Date range */}
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="form-input py-1.5 text-xs w-36"
              />
              <span className="text-slate-600 text-xs">to</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="form-input py-1.5 text-xs w-36"
              />

              {/* Status filter */}
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="form-input py-1.5 text-xs w-36"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              {/* Clear filters */}
              {(filters.status || filters.search) && (
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, status: "", search: "" }));
                    setPage(1);
                  }}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400
                             transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/10"
                >
                  <X size={12} strokeWidth={2.5} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <AttendanceTable
            records={records}
            loading={loading}
            pagination={pagination}
            onPageChange={setPage}
            onEdit={setEditRecord}
            isAdminOrManager={isAdminOrManager}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {editRecord && (
        <EditModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Add Attendance Modal */}
      {showAddModal && (
        <AddAttendanceModal
          onClose={() => setShowAddModal(false)}
          onSave={handleRefresh}
        />
      )}
    </DashboardLayout>
  );
}
