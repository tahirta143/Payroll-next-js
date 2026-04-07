"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { dashboardAPI, attendanceAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  cn,
  formatDate,
  formatTime,
  timeAgo,
  formatWorkHours,
  getStatusConfig,
  getLeaveStatusConfig,
  getLeaveTypeConfig,
  getAvatarUrl,
  getInitials,
  getAttendanceRateColor,
} from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Users,
  Clock,
  UserCheck,
  UserX,
  Timer,
  CalendarOff,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Calendar,
  MapPin,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";
import AIChat from "@/components/AIChat";
import PayrollInsights from "@/components/PayrollInsights";

// ─────────────────────────────────────────────
//  Chart colors
// ─────────────────────────────────────────────

const CHART_COLORS = {
  present: "#22c55e",
  late: "#f59e0b",
  absent: "#ef4444",
  leave: "#3b82f6",
  half_day: "#8b5cf6",
};

// ─────────────────────────────────────────────
//  Custom Tooltip for Recharts
// ─────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="glass-card px-3 py-2.5 text-xs space-y-1 min-w-[120px]">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-muted-foreground capitalize">{entry.name}:</span>
          <span className="font-semibold text-foreground ml-auto pl-3">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: payload[0].payload.fill }}
        />
        <span className="text-muted-foreground capitalize">{payload[0].name}:</span>
        <span className="font-bold text-white ml-1">{payload[0].value}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  KPI Card Component
// ─────────────────────────────────────────────

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
  trend,
  trendLabel,
  loading,
}) {
  if (loading) {
    return (
      <div className="kpi-card">
        <div className="skeleton h-4 w-28 rounded" />
        <div className="skeleton h-8 w-16 rounded-lg mt-2" />
        <div className="skeleton h-3 w-36 rounded mt-1" />
      </div>
    );
  }

  return (
    <div className="kpi-card group">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-tight">
          {title}
        </p>
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
            "transition-transform duration-200 group-hover:scale-110",
            bg,
          )}
        >
          <Icon size={17} className={color} strokeWidth={2} />
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span className={cn("text-3xl font-heading font-bold", color)}>
          {value ?? "—"}
        </span>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-0.5 text-xs font-semibold mb-1",
              trend >= 0 ? "text-green-400" : "text-red-400",
            )}
          >
            {trend >= 0 ? (
              <TrendingUp size={12} strokeWidth={2.5} />
            ) : (
              <TrendingDown size={12} strokeWidth={2.5} />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-muted-foreground leading-snug">{subtitle}</p>
      )}

      {/* Trend label */}
      {trendLabel && (
        <p className="text-[11px] text-foreground mt-0.5">{trendLabel}</p>
      )}

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"
        style={{ color: color?.replace("text-", "") }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
//  Recent Activity Feed
// ─────────────────────────────────────────────

function ActivityFeed({ activities, loading }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3.5 w-3/4 rounded" />
              <div className="skeleton h-2.5 w-1/2 rounded" />
            </div>
            <div className="skeleton h-5 w-14 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="empty-state py-8">
        <Clock className="empty-state-icon" size={32} />
        <p className="empty-state-title">No recent activity</p>
        <p className="empty-state-desc">
          Activity will appear here as employees check in and submit leave
          requests
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5">
      {activities.map((item) => {
        const avatarUrl = getAvatarUrl(item.user?.avatar_url);
        const initials = getInitials(item.user?.name);
        const isCheckIn = item.type === "check_in";
        const statusCfg = isCheckIn
          ? getStatusConfig(item.status)
          : getLeaveStatusConfig(item.status);

        return (
          <div
            key={item.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                       hover:bg-white/[0.02] transition-colors duration-150 group"
          >
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={item.user?.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full avatar-fallback text-xs">
                  {initials}
                </div>
              )}
              {/* Type indicator */}
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full",
                  "flex items-center justify-center border-2 border-[#1a2332]",
                  isCheckIn ? "bg-teal-500/80" : "bg-blue-500/80",
                )}
              >
                {isCheckIn ? (
                  <Clock size={7} className="text-white" strokeWidth={3} />
                ) : (
                  <Calendar size={7} className="text-white" strokeWidth={3} />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground leading-snug">
                <span className="font-semibold text-white">
                  {item.user?.name || "Unknown"}
                </span>{" "}
                <span className="text-muted-foreground">
                  {isCheckIn
                    ? `checked in${item.meta?.check_out_time ? " & out" : ""}`
                    : `requested ${item.meta?.leave_type} leave`}
                </span>
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-foreground">
                  {timeAgo(item.time)}
                </span>
                {item.user?.department?.name && (
                  <>
                    <span className="text-foreground">·</span>
                    <span className="text-[11px] text-foreground">
                      {item.user.department.name}
                    </span>
                  </>
                )}
                {isCheckIn && item.meta?.check_in_time && (
                  <>
                    <span className="text-slate-700">·</span>
                    <span className="text-[11px] text-slate-600">
                      {formatTime(item.meta.check_in_time)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Status badge */}
            <span className={cn("flex-shrink-0", statusCfg.badgeClass)}>
              {statusCfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Department Stats Bar Chart
// ─────────────────────────────────────────────

function DeptBarChart({ data, loading }) {
  if (loading) {
    return (
      <div className="space-y-3 pt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="skeleton h-3 w-24 rounded" />
            <div
              className="skeleton h-6 rounded"
              style={{ width: `${60 + i * 10}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state py-8">
        <Building2 className="empty-state-icon" size={28} />
        <p className="empty-state-title">No department data</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name:
      d.department_name?.length > 10
        ? d.department_name.slice(0, 10) + "…"
        : d.department_name,
    present: d.present,
    late: d.late,
    absent: d.absent > 0 ? d.absent : 0,
    onLeave: d.onLeave,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} barCategoryGap="30%" barGap={2}>
        <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.06)" />
        <XAxis
          dataKey="name"
          tick={{
            fontSize: 10,
            fill: "rgba(148,163,184,0.6)",
            fontFamily: "DM Sans",
          }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{
            fontSize: 10,
            fill: "rgba(148,163,184,0.6)",
            fontFamily: "DM Sans",
          }}
          axisLine={false}
          tickLine={false}
          width={24}
        />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(255,255,255,0.03)" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: "DM Sans", paddingTop: 8 }}
        />
        <Bar
          dataKey="present"
          name="Present"
          fill={CHART_COLORS.present}
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="late"
          name="Late"
          fill={CHART_COLORS.late}
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="absent"
          name="Absent"
          fill={CHART_COLORS.absent}
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────
//  Attendance Trend Line Chart
// ─────────────────────────────────────────────

function TrendLineChart({ data, loading }) {
  if (loading) {
    return <div className="skeleton h-52 w-full rounded-lg" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="empty-state py-8">
        <TrendingUp className="empty-state-icon" size={28} />
        <p className="empty-state-title">No trend data yet</p>
      </div>
    );
  }

  // Show last 14 days for cleaner chart
  const display = data.slice(-14).map((d) => ({
    ...d,
    label: dayjs(d.date).format("MMM D"),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={display}>
        <defs>
          <linearGradient id="gradPresent" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={CHART_COLORS.present}
              stopOpacity={0.25}
            />
            <stop
              offset="95%"
              stopColor={CHART_COLORS.present}
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id="gradLate" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.late} stopOpacity={0.2} />
            <stop offset="95%" stopColor={CHART_COLORS.late} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradAbsent" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor={CHART_COLORS.absent}
              stopOpacity={0.15}
            />
            <stop
              offset="95%"
              stopColor={CHART_COLORS.absent}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.06)" />
        <XAxis
          dataKey="label"
          tick={{
            fontSize: 10,
            fill: "rgba(148,163,184,0.6)",
            fontFamily: "DM Sans",
          }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{
            fontSize: 10,
            fill: "rgba(148,163,184,0.6)",
            fontFamily: "DM Sans",
          }}
          axisLine={false}
          tickLine={false}
          width={24}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, fontFamily: "DM Sans", paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey="present"
          name="Present"
          stroke={CHART_COLORS.present}
          strokeWidth={2}
          fill="url(#gradPresent)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="late"
          name="Late"
          stroke={CHART_COLORS.late}
          strokeWidth={2}
          fill="url(#gradLate)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="absent"
          name="Absent"
          stroke={CHART_COLORS.absent}
          strokeWidth={2}
          fill="url(#gradAbsent)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────
//  Status Donut Chart
// ─────────────────────────────────────────────

function StatusDonut({ stats, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-52">
        <div className="skeleton w-32 h-32 rounded-full" />
      </div>
    );
  }

  const pieData = [
    {
      name: "Present",
      value: stats?.presentToday || 0,
      fill: CHART_COLORS.present,
    },
    { name: "Late", value: stats?.lateToday || 0, fill: CHART_COLORS.late },
    {
      name: "Absent",
      value: stats?.absentToday || 0,
      fill: CHART_COLORS.absent,
    },
    {
      name: "On Leave",
      value: stats?.onLeaveToday || 0,
      fill: CHART_COLORS.leave,
    },
  ].filter((d) => d.value > 0);

  const total = pieData.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="empty-state py-8">
        <Users className="empty-state-icon" size={28} />
        <p className="empty-state-title">No data for today</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-heading font-bold text-white">
            {total}
          </span>
          <span className="text-[10px] text-foreground font-medium uppercase tracking-wider">
            Total
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full">
        {pieData.map((entry, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: entry.fill }}
            />
            <span className="text-xs text-slate-400 truncate">
              {entry.name}
            </span>
            <span className="text-xs font-semibold text-slate-200 ml-auto">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Quick Action Button
// ─────────────────────────────────────────────

function QuickAction({ icon: Icon, label, href, color, bg }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-2 p-3 rounded-xl dashboard-card",
        "transition-all duration-200 hover:-translate-y-0.5 group",
        bg,
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center",
          bg,
        )}
      >
        <Icon size={18} className={color} strokeWidth={2} />
      </div>
      <span
        className={cn("text-xs font-semibold text-center leading-tight", color)}
      >
        {label}
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────
//  Main Dashboard Page
// ─────────────────────────────────────────────

export default function DashboardPage() {
  const { user, isAdmin, isAdminOrManager } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [trend, setTrend] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [trendLoading, setTrendLoading] = useState(true);
  const [deptLoading, setDeptLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await dashboardAPI.getStats();
      setStats(res.data.data);
    } catch {
      toast.error("Failed to load dashboard stats");
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const res = await dashboardAPI.getRecentActivity();
      setActivities(res.data.data || []);
    } catch {
      // silently fail
    } finally {
      setActivityLoading(false);
    }
  }, []);

  const fetchTrend = useCallback(async () => {
    // Only admins see trend data
    if (!isAdmin) return;
    setTrendLoading(true);
    try {
      const res = await dashboardAPI.getAttendanceTrend(30);
      setTrend(res.data.data || []);
    } catch {
      // silently fail
    } finally {
      setTrendLoading(false);
    }
  }, [isAdmin]);

  const fetchDeptStats = useCallback(async () => {
    if (!isAdminOrManager) return;
    setDeptLoading(true);
    try {
      const res = await dashboardAPI.getDepartmentStats();
      setDeptStats(res.data.data || []);
    } catch {
      // silently fail
    } finally {
      setDeptLoading(false);
    }
  }, [isAdminOrManager]);

  useEffect(() => {
    fetchStats();
    fetchActivity();
    fetchTrend();
    fetchDeptStats();
  }, [refreshKey, fetchStats, fetchActivity, fetchTrend, fetchDeptStats]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    toast.info("Dashboard refreshed");
  };

  const today = dayjs().format("dddd, MMMM D, YYYY");

  // Role-based dashboard content
  const isEmployee = user?.role === 'employee';

  return (
    <DashboardLayout
      pageTitle="Dashboard"
      pageSubtitle={isEmployee ? `Welcome back, ${user?.name?.split(' ')[0]}!` : today}
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
      <div className="space-y-6 pt-2">
        {/* ── Admin KPI Cards ── */}
        {isAdmin && (
          <div className="stats-grid">
            <KpiCard
              title="Total Employees"
              value={stats?.totalEmployees ?? "—"}
              subtitle="Active in the system"
              icon={Users}
              color="text-white"
              bg="bg-white/10"
              loading={statsLoading}
            />
            <KpiCard
              title="Present Today"
              value={stats?.presentToday ?? "—"}
              subtitle={`${stats?.lateToday ?? 0} arrived late`}
              icon={UserCheck}
              color="text-white"
              bg="bg-white/10"
              loading={statsLoading}
            />
            <KpiCard
              title="Absent Today"
              value={stats?.absentToday ?? "—"}
              subtitle="No check-in recorded"
              icon={UserX}
              color="text-white"
              bg="bg-white/10"
              loading={statsLoading}
            />
            <KpiCard
              title="On Leave"
              value={stats?.onLeaveToday ?? "—"}
              subtitle={`${stats?.pendingLeaves ?? 0} requests pending`}
              icon={CalendarOff}
              color="text-white"
              bg="bg-white/10"
              loading={statsLoading}
            />
          </div>
        )}

        {/* ── Employee Personal Stats ── */}
        {isEmployee && (
          <div className="stats-grid">
            <KpiCard
              title="Today's Status"
              value={stats?.todayAttendance?.status ? 
                getStatusConfig(stats.todayAttendance.status).label : 
                (stats?.onLeaveToday ? "On Leave" : "Not Checked In")
              }
              subtitle={stats?.todayAttendance?.check_in_time ? 
                `Checked in at ${formatTime(stats.todayAttendance.check_in_time)}` : 
                "No attendance record"
              }
              icon={Clock}
              color="text-teal-400"
              bg="bg-teal-500/10"
              loading={statsLoading}
            />
            <KpiCard
              title="Work Hours"
              value={stats?.todayAttendance?.work_hours ? 
                formatWorkHours(stats.todayAttendance.work_hours) : 
                "—"
              }
              subtitle="Hours worked today"
              icon={Timer}
              color="text-white"
              bg="bg-white/10"
              loading={statsLoading}
            />
            <KpiCard
              title="Leave Balance"
              value={stats?.leaveBalance ? 
                Object.values(stats.leaveBalance).reduce((sum, days) => sum + days, 0) : 
                "—"
              }
              subtitle="Total days used this year"
              icon={CalendarOff}
              color="text-white"
              bg="bg-white/10"
              loading={statsLoading}
            />
            <KpiCard
              title="Pending Requests"
              value={stats?.pendingLeaves ?? "—" }
              subtitle="Leave requests awaiting approval"
              icon={AlertCircle}
              color="text-white"
              bg="bg-white/10"
              loading={statsLoading}
            />
          </div>
        )}

        {/* ── Admin Secondary KPI row ── */}
        {isAdmin && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Late Arrivals",
                value: stats?.lateToday ?? "—",
                color: "text-white",
                dot: "bg-white/500",
                icon: Timer,
              },
              {
                label: "Half Day",
                value: stats?.halfDayToday ?? "—",
                color: "text-white",
                dot: "bg-white/500",
                icon: Clock,
              },
              {
                label: "Pending Leaves",
                value: stats?.pendingLeaves ?? "—",
                color: "text-white",
                dot: "bg-white/500",
                icon: AlertCircle,
              },
              {
                label: "Unread Alerts",
                value: stats?.unreadNotifications ?? "—",
                color: "text-pink-400",
                dot: "bg-pink-500",
                icon: AlertCircle,
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="glass-card px-4 py-3 flex items-center gap-3"
                >
                  <div
                    className={cn("w-2 h-2 rounded-full flex-shrink-0", item.dot)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground truncate">
                      {item.label}
                    </p>
                    <p
                      className={cn(
                        "text-lg font-heading font-bold leading-tight",
                        item.color,
                      )}
                    >
                      {statsLoading ? (
                        <span className="skeleton inline-block h-5 w-8 rounded" />
                      ) : (
                        item.value
                      )}
                    </p>
                  </div>
                  <Icon
                    size={16}
                    className={cn(item.color, "opacity-50 flex-shrink-0")}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ── Main content grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left: Trend Chart (Admin only) or Employee Leave Balance ── */}
          {isAdmin ? (
            <div className="lg:col-span-2 dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-heading font-semibold text-foreground">
                    30-Day Attendance Trend
                  </h3>
                  <p className="text-xs text-foreground mt-0.5">
                    Daily check-in counts over the past month
                  </p>
                </div>
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg
                                bg-teal-500/10 border border-teal-500/20"
                >
                  <TrendingUp
                    size={12}
                    className="text-teal-400"
                    strokeWidth={2.5}
                  />
                  <span className="text-xs font-semibold text-teal-400">
                    Live
                  </span>
                </div>
              </div>
              <TrendLineChart data={trend} loading={trendLoading} />
            </div>
          ) : (
            <div className="lg:col-span-2 dashboard-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-heading font-semibold text-foreground">
                    Your Leave Balance
                  </h3>
                  <p className="text-xs text-foreground mt-0.5">
                    Days used vs. available this year
                  </p>
                </div>
              </div>
              {statsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                      <div className="skeleton h-4 w-20 rounded" />
                      <div className="skeleton h-4 w-16 rounded" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.leaveBalance && Object.entries(stats.leaveBalance).map(([type, used]) => {
                    const entitlements = { sick: 10, casual: 7, annual: 15, unpaid: 30 };
                    const total = entitlements[type] || 0;
                    const remaining = total - used;
                    const percentage = total > 0 ? (used / total) * 100 : 0;
                    
                    return (
                      <div key={type} className="p-3 rounded-lg bg-secondary/30 border border-border/05]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-foreground capitalize">{type} Leave</span>
                          <span className="text-xs text-muted-foreground">{used} / {total} days</span>
                        </div>
                        <div className="w-full bg-secondary/50 rounded-full h-2">
                          <div 
                            className={cn(
                              "h-2 rounded-full transition-all duration-300",
                              percentage > 80 ? "bg-red-500" : 
                              percentage > 60 ? "bg-amber-500" : "bg-green-500"
                            )}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1">
                          <span className="text-xs text-foreground">Remaining: {remaining} days</span>
                          <span className="text-xs text-foreground">{percentage.toFixed(0)}% used</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Right: Status Donut (Admin) or Empty state for Employee ── */}
          <div className="space-y-5">
            {isAdmin ? (
              <div className="dashboard-card">
                <h3 className="text-sm font-heading font-semibold text-slate-200 mb-4">
                  Today&apos;s Breakdown
                </h3>
                <StatusDonut stats={stats} loading={statsLoading} />
              </div>
            ) : (
              <div className="dashboard-card flex flex-col items-center justify-center text-center min-h-[300px]">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                  <Clock size={28} className="text-foreground" />
                </div>
                <h3 className="text-sm font-heading font-semibold text-slate-200 mb-2">
                  Attendance Dashboard
                </h3>
                <p className="text-xs text-foreground max-w-[200px]">
                  Use the attendance page to check in/out and track your daily attendance
                </p>
                <Link
                  href="/attendance"
                  className="mt-4 btn-primary btn-sm flex items-center gap-2"
                >
                  Go to Attendance
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom grid: Dept Stats | Activity ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Department Bar Chart (Admin/Manager only) */}
          {isAdminOrManager && (
            <div className={cn("dashboard-card", !isAdmin && "lg:col-span-1")}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-heading font-semibold text-foreground">
                    By Department
                  </h3>
                  <p className="text-xs text-foreground mt-0.5">
                    Today&apos;s attendance
                  </p>
                </div>
                <Link
                  href="/departments"
                  className="flex items-center gap-1 text-xs text-foreground
                             hover:text-primary transition-colors"
                >
                  View all
                  <ChevronRight size={12} strokeWidth={2.5} />
                </Link>
              </div>
              <DeptBarChart data={deptStats} loading={deptLoading} />
            </div>
          )}
          <div
            className={cn(
              "dashboard-card",
              (!isAdminOrManager || !isAdmin) && "lg:col-span-2",
              isEmployee && !isAdminOrManager && "lg:col-span-3",
              isAdminOrManager && !isAdmin && "lg:col-span-2"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-heading font-semibold text-foreground">
                  Recent Activity
                </h3>
                <p className="text-xs text-foreground mt-0.5">
                  {isEmployee ? "Your check-ins & leave requests" : "Latest check-ins & leave requests"}
                </p>
              </div>
              <Link
                href="/attendance"
                className="flex items-center gap-1 text-xs text-teal-400
                           hover:text-teal-300 transition-colors"
              >
                View all
                <ChevronRight size={12} strokeWidth={2.5} />
              </Link>
            </div>
            <ActivityFeed activities={activities} loading={activityLoading} />
          </div>
        </div>

        </div>
    </DashboardLayout>
  );
}