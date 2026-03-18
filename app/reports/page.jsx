"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { reportsAPI, departmentsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  cn,
  formatDate,
  formatWorkHours,
  getAvatarUrl,
  getInitials,
  getErrorMessage,
  getMonthOptions,
  getYearOptions,
  downloadBlob,
  getAttendanceRateHex,
} from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BarChart3,
  Download,
  Users,
  Clock,
  UserCheck,
  UserX,
  Timer,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Search,
  Building2,
  AlertCircle,
  Calendar,
  Loader2,
  FileText,
  X,
} from "lucide-react";
import dayjs from "dayjs";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const COLORS = {
  present: "#22c55e",
  late: "#f59e0b",
  absent: "#ef4444",
  leave: "#3b82f6",
  half_day: "#8b5cf6",
};

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "summary", label: "Employee Summary" },
  { id: "late", label: "Late Arrivals" },
  { id: "absentees", label: "Absentees" },
];

// ─────────────────────────────────────────────
//  Avatar helper
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
        "rounded-full flex items-center justify-center flex-shrink-0 font-semibold",
        "bg-gradient-to-br from-teal-500/30 to-teal-700/30 text-teal-300 ring-2 ring-slate-700/50",
        size <= 8 ? "text-xs" : "text-sm",
      )}
    >
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Custom Recharts Tooltip
// ─────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      className="rounded-xl border border-white/10 p-3 shadow-xl text-xs"
      style={{ background: "#1e293b" }}
    >
      <p className="text-slate-300 font-semibold mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-slate-400 capitalize">
            {entry.name.replace("_", " ")}:
          </span>
          <span className="text-white font-semibold ml-auto pl-3">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  KPI Card
// ─────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  loading,
  suffix = "",
}) {
  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-9 w-9 rounded-xl" />
        </div>
        <div className="skeleton h-8 w-16 rounded mb-1" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    );
  }
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center",
            bg,
          )}
        >
          <Icon size={17} className={color} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">
        {value}
        {suffix && (
          <span className="text-sm text-slate-400 ml-1">{suffix}</span>
        )}
      </p>
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
        of <span className="text-slate-300 font-medium">{total}</span>
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10
                     text-slate-400 hover:text-white hover:bg-slate-700/50
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                     text-slate-400 hover:text-white hover:bg-slate-700/50
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Table skeleton
// ─────────────────────────────────────────────

function TableSkeleton({ cols = 6, rows = 8 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-white/[0.04]">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3.5">
              <div
                className="skeleton h-4 rounded"
                style={{ width: `${55 + ((j * 13) % 35)}%` }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─────────────────────────────────────────────
//  Chart skeleton
// ─────────────────────────────────────────────

function ChartSkeleton({ height = 280 }) {
  return (
    <div
      className="w-full animate-pulse bg-slate-800/40 rounded-xl flex items-end gap-2 px-6 pb-6 pt-4"
      style={{ height }}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="skeleton flex-1 rounded-t-lg"
          style={{ height: `${30 + ((i * 17) % 60)}%` }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Empty State
// ─────────────────────────────────────────────

function EmptyState({
  message = "No data available for the selected period.",
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-white/[0.06] flex items-center justify-center mb-4">
        <FileText size={26} className="text-slate-500" />
      </div>
      <p className="text-sm font-semibold text-slate-300 mb-1">No Data Found</p>
      <p className="text-xs text-slate-500 max-w-xs">{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Attendance Rate Bar
// ─────────────────────────────────────────────

function AttendanceRateBar({ rate }) {
  const hex = getAttendanceRateHex(rate);
  const color =
    rate >= 90 ? "bg-green-500" : rate >= 75 ? "bg-amber-500" : "bg-red-500";
  const textColor =
    rate >= 90
      ? "text-green-400"
      : rate >= 75
        ? "text-amber-400"
        : "text-red-400";

  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            color,
          )}
          style={{ width: `${Math.min(100, rate)}%` }}
        />
      </div>
      <span className={cn("text-xs font-semibold w-10 text-right", textColor)}>
        {rate}%
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tab 1 — Overview
// ─────────────────────────────────────────────

function OverviewTab({ year, month, deptFilter }) {
  const [overviewData, setOverviewData] = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [monthData, setMonthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [overviewRes, deptRes] = await Promise.all([
          reportsAPI.getYearOverview(year),
          reportsAPI.getDepartmentReport({ month, year }),
        ]);
        setOverviewData(overviewRes.data.data || []);
        const depts = deptRes.data.data || [];
        setDeptData(depts);
        // current month data for the pie
        const total = depts.reduce(
          (acc, d) => ({
            present: acc.present + d.totalPresent,
            late: acc.late + d.totalLate,
            absent: acc.absent + d.totalAbsent,
            leave: acc.leave + d.totalLeave,
          }),
          { present: 0, late: 0, absent: 0, leave: 0 },
        );
        setMonthData(total);
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to load overview data"));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [year, month, deptFilter]);

  const pieData = monthData
    ? [
        { name: "Present", value: monthData.present, fill: COLORS.present },
        { name: "Late", value: monthData.late, fill: COLORS.late },
        { name: "Absent", value: monthData.absent, fill: COLORS.absent },
        { name: "On Leave", value: monthData.leave, fill: COLORS.leave },
      ].filter((d) => d.value > 0)
    : [];

  const deptChartData = deptData.map((d) => ({
    name:
      d.department_name.length > 12
        ? d.department_name.slice(0, 12) + "…"
        : d.department_name,
    fullName: d.department_name,
    rate: d.avgAttendanceRate,
    employees: d.totalEmployees,
  }));

  const axisStyle = {
    fontSize: 11,
    fill: "#64748b",
    fontFamily: "DM Sans, sans-serif",
  };

  return (
    <div className="space-y-5">
      {/* Year Overview chart */}
      <div className="glass-card border border-white/[0.06] p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-white">
              {year} Attendance Overview
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Monthly breakdown of attendance statuses
            </p>
          </div>
        </div>
        {loading ? (
          <ChartSkeleton height={260} />
        ) : overviewData.length === 0 ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={overviewData}
              margin={{ top: 4, right: 4, bottom: 0, left: -10 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
              />
              <XAxis dataKey="label" tick={axisStyle} />
              <YAxis tick={axisStyle} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{
                  fontSize: 11,
                  paddingTop: 12,
                  fontFamily: "DM Sans, sans-serif",
                }}
              />
              <Bar
                dataKey="present"
                name="Present"
                stackId="a"
                fill={COLORS.present}
                radius={[0, 0, 0, 0]}
              />
              <Bar dataKey="late" name="Late" stackId="a" fill={COLORS.late} />
              <Bar
                dataKey="half_day"
                name="Half Day"
                stackId="a"
                fill={COLORS.half_day}
              />
              <Bar
                dataKey="absent"
                name="Absent"
                stackId="a"
                fill={COLORS.absent}
              />
              <Bar
                dataKey="leave"
                name="Leave"
                stackId="a"
                fill={COLORS.leave}
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom row: dept chart + pie */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Department attendance rate bar chart */}
        <div className="lg:col-span-3 glass-card border border-white/[0.06] p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-white">
              Department Attendance Rate
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Average attendance rate per department —{" "}
              {dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format(
                "MMMM YYYY",
              )}
            </p>
          </div>
          {loading ? (
            <ChartSkeleton height={220} />
          ) : deptChartData.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={deptChartData}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.04)"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={axisStyle}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={axisStyle}
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div
                        className="rounded-xl border border-white/10 p-3 text-xs shadow-xl"
                        style={{ background: "#1e293b" }}
                      >
                        <p className="text-slate-200 font-semibold mb-1">
                          {d.fullName}
                        </p>
                        <p className="text-teal-400">
                          Attendance Rate:{" "}
                          <span className="font-bold">{d.rate}%</span>
                        </p>
                        <p className="text-slate-400">
                          Employees:{" "}
                          <span className="font-semibold text-slate-300">
                            {d.employees}
                          </span>
                        </p>
                      </div>
                    );
                  }}
                />
                <Bar
                  dataKey="rate"
                  name="Attendance Rate"
                  fill={COLORS.present}
                  radius={[0, 3, 3, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart */}
        <div className="lg:col-span-2 glass-card border border-white/[0.06] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">
              This Month Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format(
                "MMMM YYYY",
              )}
            </p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center h-44">
              <div className="skeleton w-36 h-36 rounded-full" />
            </div>
          ) : pieData.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.fill}
                        strokeWidth={0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div
                          className="rounded-xl border border-white/10 p-3 text-xs shadow-xl"
                          style={{ background: "#1e293b" }}
                        >
                          <p
                            className="font-semibold"
                            style={{ color: d.fill }}
                          >
                            {d.name}: {d.value}
                          </p>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((d) => (
                  <div
                    key={d.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: d.fill }}
                      />
                      <span className="text-slate-400">{d.name}</span>
                    </div>
                    <span className="text-slate-200 font-semibold">
                      {d.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tab 2 — Employee Summary
// ─────────────────────────────────────────────

function SummaryTab({ month, year, deptFilter }) {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const params = {
          month,
          year,
          page,
          limit: 15,
        };
        if (deptFilter) params.department = deptFilter;
        const res = await reportsAPI.getSummary(params);
        setRows(res.data.data || []);
        setPagination(res.data.pagination || {});
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to load summary"));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [month, year, deptFilter, page]);

  useEffect(() => {
    setPage(1);
  }, [month, year, deptFilter]);

  return (
    <div className="glass-card border border-white/[0.06] overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-white/[0.06]">
        <div className="relative max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee…"
            className="form-input w-full pl-8 py-2 text-sm"
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
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-slate-800/40">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Working Days
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Present
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Late
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Half Day
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Absent
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Leave
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Work Hours
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider min-w-[140px]">
                Attendance Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={9} rows={8} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <EmptyState />
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.user_id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        user={{ name: r.name, avatar_url: r.avatar_url }}
                        size={7}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {r.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {r.department}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center text-slate-300">
                    {r.workingDays}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-semibold text-green-400">
                      {r.present}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-semibold text-amber-400">
                      {r.late}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-semibold text-violet-400">
                      {r.halfDay}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-semibold text-red-400">
                      {r.absent}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="font-semibold text-blue-400">
                      {r.leaveCount}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-slate-300">
                    {formatWorkHours(r.totalWorkHours)}
                  </td>
                  <td className="px-4 py-3.5">
                    <AttendanceRateBar rate={r.attendanceRate} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && rows.length > 0 && (
        <div className="px-4 pb-4">
          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            total={pagination.total || rows.length}
            limit={pagination.limit || 15}
            hasPrevPage={pagination.hasPrevPage}
            hasNextPage={pagination.hasNextPage}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tab 3 — Late Arrivals
// ─────────────────────────────────────────────

function LateTab({ month, year }) {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await reportsAPI.getLateArrivals({
          month,
          year,
          page,
          limit: 15,
        });
        setRows(res.data.data || []);
        setPagination(res.data.pagination || {});
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to load late arrivals"));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [month, year, page]);

  useEffect(() => {
    setPage(1);
  }, [month, year]);

  return (
    <div className="glass-card border border-white/[0.06] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-slate-800/40">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Late Count
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Most Recent Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Check-in Time
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={5} rows={8} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState message="No late arrivals recorded for the selected period." />
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const latest = r.records?.[0];
                return (
                  <tr
                    key={r.user_id}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <Avatar
                            user={{ name: r.name, avatar_url: r.avatar_url }}
                            size={8}
                          />
                          {idx < 3 && (
                            <span
                              className={cn(
                                "absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center",
                                idx === 0
                                  ? "bg-amber-500 text-white"
                                  : idx === 1
                                    ? "bg-slate-400 text-white"
                                    : "bg-amber-700 text-white",
                              )}
                            >
                              {idx + 1}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {r.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-slate-400">{r.department}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm">
                        {r.lateCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-slate-300">
                        {latest ? formatDate(latest.date) : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-mono text-amber-400">
                        {latest?.check_in_time
                          ? new Date(
                              `1970-01-01T${latest.check_in_time}`,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {!loading && rows.length > 0 && (
        <div className="px-4 pb-4">
          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            total={pagination.total || rows.length}
            limit={pagination.limit || 15}
            hasPrevPage={pagination.hasPrevPage}
            hasNextPage={pagination.hasNextPage}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tab 4 — Absentees
// ─────────────────────────────────────────────

function AbsenteesTab({ month, year }) {
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await reportsAPI.getAbsentees({
          month,
          year,
          page,
          limit: 15,
        });
        setRows(res.data.data || []);
        setPagination(res.data.pagination || {});
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to load absentees"));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [month, year, page]);

  useEffect(() => {
    setPage(1);
  }, [month, year]);

  return (
    <div className="glass-card border border-white/[0.06] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-slate-800/40">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Absent Days
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={4} rows={8} />
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState message="No absentees recorded for the selected period." />
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr
                  key={r.user_id}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-500 font-medium">
                      {(page - 1) * 15 + idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar
                        user={{ name: r.name, avatar_url: r.avatar_url }}
                        size={8}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {r.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {r.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-slate-400">{r.department}</p>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm">
                      {r.absentCount}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!loading && rows.length > 0 && (
        <div className="px-4 pb-4">
          <Pagination
            page={pagination.page || page}
            totalPages={pagination.totalPages || 1}
            total={pagination.total || rows.length}
            limit={pagination.limit || 15}
            hasPrevPage={pagination.hasPrevPage}
            hasNextPage={pagination.hasNextPage}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Reports Page
// ─────────────────────────────────────────────

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const currentMonth = dayjs().month() + 1;
  const currentYear = dayjs().year();

  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [deptFilter, setDeptFilter] = useState("");
  const [departments, setDepartments] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [exporting, setExporting] = useState(false);

  // KPI data
  const [kpiData, setKpiData] = useState(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions(3);

  // ── Fetch departments ──
  useEffect(() => {
    departmentsAPI
      .getAll({ limit: 100 })
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => {});
  }, []);

  // ── Fetch KPI summary ──
  useEffect(() => {
    const fetchKpi = async () => {
      setKpiLoading(true);
      try {
        const params = { month, year, limit: 500 };
        if (deptFilter) params.department = deptFilter;
        const res = await reportsAPI.getSummary(params);
        const rows = res.data.data || [];
        const totalPresent = rows.reduce((s, r) => s + r.present, 0);
        const totalLate = rows.reduce((s, r) => s + r.late, 0);
        const totalAbsent = rows.reduce((s, r) => s + r.absent, 0);
        const avgRate =
          rows.length > 0
            ? parseFloat(
                (
                  rows.reduce((s, r) => s + r.attendanceRate, 0) / rows.length
                ).toFixed(1),
              )
            : 0;
        setKpiData({ totalPresent, totalLate, totalAbsent, avgRate });
      } catch {
        // ignore kpi errors
      } finally {
        setKpiLoading(false);
      }
    };
    fetchKpi();
  }, [month, year, deptFilter]);

  // ── Export CSV ──
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { month, year, format: "csv" };
      if (deptFilter) params.department = deptFilter;
      const res = await reportsAPI.export(params);
      const monthLabel =
        monthOptions.find((m) => m.value === month)?.short || month;
      downloadBlob(
        res.data,
        `attendance_report_${year}_${String(month).padStart(2, "0")}.csv`,
      );
      toast.success("Report exported successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to export report"));
    } finally {
      setExporting(false);
    }
  };

  const selectedMonthLabel =
    monthOptions.find((m) => m.value === month)?.label ||
    dayjs(`${year}-${String(month).padStart(2, "0")}-01`).format("MMMM");

  return (
    <DashboardLayout
      pageTitle="Reports & Analytics"
      pageSubtitle="Monthly attendance insights and workforce analytics"
      requiredRoles={["admin", "manager"]}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month */}
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="form-input text-sm py-1.5 min-w-[120px]"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Year */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="form-input text-sm py-1.5 min-w-[90px]"
          >
            {yearOptions.map((y) => (
              <option key={y.value} value={y.value}>
                {y.label}
              </option>
            ))}
          </select>

          {/* Department */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="form-input text-sm py-1.5 min-w-[150px]"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Export */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm
                       bg-slate-700/80 border border-white/10 text-slate-300
                       hover:bg-slate-600/80 hover:text-white disabled:opacity-60 transition-all"
          >
            {exporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {exporting ? "Exporting…" : "Export CSV"}
          </button>
        </div>
      }
    >
      {/* ── KPI Cards ── */}
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={TrendingUp}
          label="Avg Attendance Rate"
          value={kpiData ? `${kpiData.avgRate}` : "—"}
          suffix="%"
          color="text-teal-400"
          bg="bg-teal-500/10"
          loading={kpiLoading}
        />
        <KpiCard
          icon={UserCheck}
          label="Total Present Days"
          value={kpiData ? kpiData.totalPresent.toLocaleString() : "—"}
          color="text-green-400"
          bg="bg-green-500/10"
          loading={kpiLoading}
        />
        <KpiCard
          icon={Timer}
          label="Total Late Days"
          value={kpiData ? kpiData.totalLate.toLocaleString() : "—"}
          color="text-amber-400"
          bg="bg-amber-500/10"
          loading={kpiLoading}
        />
        <KpiCard
          icon={UserX}
          label="Total Absent Days"
          value={kpiData ? kpiData.totalAbsent.toLocaleString() : "—"}
          color="text-red-400"
          bg="bg-red-500/10"
          loading={kpiLoading}
        />
      </div>

      {/* ── Period label ── */}
      <div className="mt-4 flex items-center gap-2">
        <Calendar size={14} className="text-teal-400" />
        <p className="text-sm text-slate-400">
          Showing data for{" "}
          <span className="text-teal-400 font-semibold">
            {selectedMonthLabel} {year}
          </span>
          {deptFilter && departments.length > 0 && (
            <>
              {" "}
              —{" "}
              <span className="text-slate-300 font-medium">
                {departments.find((d) => String(d.id) === deptFilter)?.name}
              </span>
            </>
          )}
        </p>
      </div>

      {/* ── Tabs ── */}
      <div className="mt-4 flex items-center gap-1 border-b border-white/[0.06]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold transition-all relative",
              activeTab === tab.id
                ? "text-teal-400"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="mt-5">
        {activeTab === "overview" && (
          <OverviewTab year={year} month={month} deptFilter={deptFilter} />
        )}
        {activeTab === "summary" && (
          <SummaryTab month={month} year={year} deptFilter={deptFilter} />
        )}
        {activeTab === "late" && <LateTab month={month} year={year} />}
        {activeTab === "absentees" && (
          <AbsenteesTab month={month} year={year} />
        )}
      </div>
    </DashboardLayout>
  );
}
