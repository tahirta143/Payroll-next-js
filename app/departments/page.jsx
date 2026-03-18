"use client";

import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { departmentsAPI, usersAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  cn,
  formatDate,
  getAvatarUrl,
  getInitials,
  getErrorMessage,
  getRoleConfig,
} from "@/lib/utils";
import {
  Building2,
  Plus,
  Search,
  Users,
  User,
  Edit2,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Shield,
  Calendar,
  Eye,
  UserMinus,
  BarChart3,
} from "lucide-react";

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
//  Stat Card
// ─────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, bg, loading }) {
  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse">
        <div className="skeleton h-4 w-24 rounded mb-3" />
        <div className="skeleton h-8 w-12 rounded" />
      </div>
    );
  }
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          bg,
        )}
      >
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Department Card
// ─────────────────────────────────────────────

function DepartmentCard({ dept, isAdmin, onEdit, onDelete, onViewEmployees }) {
  const hasManager = !!dept.manager;
  const canDelete = dept.employeeCount === 0;

  return (
    <div
      className="glass-card border border-white/[0.06] p-5 flex flex-col gap-4
                    hover:border-teal-500/20 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl bg-teal-500/10 border border-teal-500/20
                          flex items-center justify-center flex-shrink-0
                          group-hover:bg-teal-500/15 transition-colors"
          >
            <Building2 size={20} className="text-teal-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">
              {dept.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                               bg-teal-500/10 text-teal-400 border border-teal-500/20"
              >
                <Users size={10} />
                {dept.employeeCount}{" "}
                {dept.employeeCount === 1 ? "employee" : "employees"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {isAdmin && (
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(dept)}
              title="Edit department"
              className="w-8 h-8 flex items-center justify-center rounded-lg
                         bg-slate-700/60 border border-white/[0.06] text-slate-400
                         hover:text-teal-400 hover:border-teal-500/30 transition-all"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={() => onDelete(dept)}
              title={
                canDelete
                  ? "Delete department"
                  : `Cannot delete: ${dept.employeeCount} active employee(s)`
              }
              disabled={!canDelete}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg border transition-all",
                canDelete
                  ? "bg-slate-700/60 border-white/[0.06] text-slate-400 hover:text-red-400 hover:border-red-500/30"
                  : "bg-slate-800/40 border-white/[0.04] text-slate-600 cursor-not-allowed",
              )}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Manager */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-white/[0.04]">
        {hasManager ? (
          <>
            <Avatar user={dept.manager} size={8} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-200 truncate">
                {dept.manager.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Shield size={10} className="text-teal-400" />
                <p className="text-xs text-teal-400 font-medium">Manager</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div
              className="w-8 h-8 rounded-full bg-slate-700/60 border border-white/[0.06]
                            flex items-center justify-center flex-shrink-0"
            >
              <UserMinus size={14} className="text-slate-500" />
            </div>
            <p className="text-sm text-slate-500 italic">No manager assigned</p>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Calendar size={11} />
          <span>Created {formatDate(dept.created_at)}</span>
        </div>
        <button
          onClick={() => onViewEmployees(dept)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                     bg-teal-500/10 text-teal-400 border border-teal-500/20
                     hover:bg-teal-500/20 transition-all"
        >
          <Eye size={12} />
          View Employees
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Card Skeleton
// ─────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="glass-card border border-white/[0.06] p-5 animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-11 h-11 rounded-xl" />
        <div className="space-y-2 flex-1">
          <div className="skeleton h-5 w-36 rounded" />
          <div className="skeleton h-4 w-20 rounded-full" />
        </div>
      </div>
      <div className="skeleton h-14 w-full rounded-xl" />
      <div className="flex items-center justify-between">
        <div className="skeleton h-3 w-28 rounded" />
        <div className="skeleton h-7 w-28 rounded-lg" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Add / Edit Department Modal
// ─────────────────────────────────────────────

function DeptModal({ dept, onClose, onSuccess }) {
  const { toast } = useToast();
  const isEdit = !!dept;

  const [form, setForm] = useState({
    name: dept?.name || "",
    manager_id: dept?.manager_id ? String(dept.manager_id) : "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [managers, setManagers] = useState([]);
  const [managersLoading, setManagersLoading] = useState(true);
  const [managerSearch, setManagerSearch] = useState("");

  // Fetch managers
  useEffect(() => {
    const fetch = async () => {
      setManagersLoading(true);
      try {
        const res = await usersAPI.getAll({ role: "manager", limit: 200 });
        const adminRes = await usersAPI.getAll({ role: "admin", limit: 200 });
        const combined = [
          ...(res.data.data || []),
          ...(adminRes.data.data || []),
        ];
        // deduplicate
        const seen = new Set();
        setManagers(
          combined.filter((u) => {
            if (seen.has(u.id)) return false;
            seen.add(u.id);
            return true;
          }),
        );
      } catch {
        // ignore
      } finally {
        setManagersLoading(false);
      }
    };
    fetch();
  }, []);

  const filteredManagers = managers.filter(
    (m) =>
      m.name.toLowerCase().includes(managerSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(managerSearch.toLowerCase()),
  );

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Department name is required";
    else if (form.name.trim().length < 2)
      errs.name = "Name must be at least 2 characters";
    return errs;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        manager_id: form.manager_id ? Number(form.manager_id) : null,
      };
      if (isEdit) {
        await departmentsAPI.update(dept.id, payload);
        toast.success("Department updated successfully");
      } else {
        await departmentsAPI.create(payload);
        toast.success("Department created successfully");
      }
      onSuccess();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to save department");
      if (msg.toLowerCase().includes("already exists")) {
        setErrors({ name: "A department with this name already exists" });
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md glass-card border border-white/10 rounded-2xl shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Building2 size={17} className="text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {isEdit ? "Edit Department" : "Add Department"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEdit ? `Editing: ${dept.name}` : "Create a new department"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/60 border border-white/10
                       text-slate-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="form-label">Department Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm((p) => ({ ...p, name: e.target.value }));
                setErrors((p) => ({ ...p, name: "" }));
              }}
              placeholder="e.g. Engineering, Marketing, HR"
              className={cn(
                "form-input w-full mt-1",
                errors.name && "border-red-500/50",
              )}
            />
            {errors.name && (
              <p className="text-xs text-red-400 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Manager */}
          <div>
            <label className="form-label">
              Department Manager{" "}
              <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            {managersLoading ? (
              <div className="form-input mt-1 flex items-center gap-2 text-slate-500">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-sm">Loading managers…</span>
              </div>
            ) : (
              <div className="mt-1 space-y-2">
                {/* Search managers */}
                <div className="relative">
                  <Search
                    size={13}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                  />
                  <input
                    type="text"
                    value={managerSearch}
                    onChange={(e) => setManagerSearch(e.target.value)}
                    placeholder="Search manager by name…"
                    className="form-input w-full pl-8 text-sm py-2"
                  />
                </div>

                {/* Manager select list */}
                <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5">
                  {/* No manager option */}
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, manager_id: "" }))}
                    className={cn(
                      "w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-sm transition-all text-left",
                      !form.manager_id
                        ? "bg-teal-500/10 border-teal-500/30 text-teal-300"
                        : "bg-slate-800/40 border-white/[0.06] text-slate-500 hover:border-white/20 hover:text-slate-300",
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-slate-700/60 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
                      <UserMinus size={12} className="text-slate-500" />
                    </div>
                    <span className="italic">No manager</span>
                    {!form.manager_id && (
                      <CheckCircle2
                        size={14}
                        className="text-teal-400 ml-auto"
                      />
                    )}
                  </button>

                  {filteredManagers.map((m) => {
                    const selected = form.manager_id === String(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, manager_id: String(m.id) }))
                        }
                        className={cn(
                          "w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-sm transition-all text-left",
                          selected
                            ? "bg-teal-500/10 border-teal-500/30"
                            : "bg-slate-800/40 border-white/[0.06] hover:border-white/20",
                        )}
                      >
                        <Avatar user={m} size={7} />
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "font-medium truncate",
                              selected ? "text-teal-300" : "text-slate-300",
                            )}
                          >
                            {m.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {m.email}
                          </p>
                        </div>
                        {selected && (
                          <CheckCircle2
                            size={14}
                            className="text-teal-400 flex-shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}

                  {filteredManagers.length === 0 && managerSearch && (
                    <p className="text-sm text-slate-500 text-center py-3">
                      No managers found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-1">
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
                  Saving…
                </>
              ) : (
                <>
                  {isEdit ? <Edit2 size={14} /> : <Plus size={14} />}
                  {isEdit ? "Save Changes" : "Create Department"}
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
//  Delete Confirmation Modal
// ─────────────────────────────────────────────

function DeleteModal({ dept, onClose, onSuccess }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const canDelete = dept?.employeeCount === 0;

  const handleDelete = async () => {
    if (!canDelete) return;
    setLoading(true);
    try {
      await departmentsAPI.delete(dept.id);
      toast.success(`"${dept.name}" deleted successfully`);
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete department"));
    } finally {
      setLoading(false);
    }
  };

  if (!dept) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm glass-card border border-white/10 rounded-2xl shadow-2xl p-6 animate-fade-in">
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              canDelete
                ? "bg-red-500/10 border border-red-500/20"
                : "bg-amber-500/10 border border-amber-500/20",
            )}
          >
            {canDelete ? (
              <Trash2 size={24} className="text-red-400" />
            ) : (
              <AlertCircle size={24} className="text-amber-400" />
            )}
          </div>

          <div>
            <h2 className="text-base font-semibold text-white mb-2">
              {canDelete ? "Delete Department?" : "Cannot Delete Department"}
            </h2>
            {canDelete ? (
              <p className="text-sm text-slate-400">
                This will permanently delete{" "}
                <span className="text-slate-200 font-semibold">
                  "{dept.name}"
                </span>
                . This action cannot be undone.
              </p>
            ) : (
              <p className="text-sm text-slate-400">
                <span className="text-slate-200 font-semibold">
                  "{dept.name}"
                </span>{" "}
                has{" "}
                <span className="text-amber-400 font-semibold">
                  {dept.employeeCount} active employee
                  {dept.employeeCount !== 1 ? "s" : ""}
                </span>
                . Please reassign or deactivate them before deleting this
                department.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full">
            <button onClick={onClose} className="btn-secondary flex-1">
              {canDelete ? "Cancel" : "OK"}
            </button>
            {canDelete && (
              <button
                onClick={handleDelete}
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
                {loading ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Employees Modal
// ─────────────────────────────────────────────

function EmployeesModal({ dept, onClose }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await departmentsAPI.getEmployees(dept.id, {
          page,
          limit: 10,
        });
        setEmployees(res.data.data || []);
        setPagination(res.data.pagination || {});
      } catch (err) {
        toast.error(getErrorMessage(err, "Failed to load employees"));
      } finally {
        setLoading(false);
      }
    };
    if (dept?.id) fetch();
  }, [dept?.id, page]);

  if (!dept) return null;

  const totalPages = pagination.totalPages || 1;
  const total = pagination.total || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg glass-card border border-white/10 rounded-2xl shadow-2xl animate-fade-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Users size={17} className="text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {dept.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {total} employee{total !== 1 ? "s" : ""} in this department
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/60 border border-white/10
                       text-slate-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Employee list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 animate-pulse"
              >
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-32 rounded" />
                  <div className="skeleton h-3 w-48 rounded" />
                </div>
                <div className="skeleton h-5 w-16 rounded-full" />
              </div>
            ))
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-white/[0.06] flex items-center justify-center mb-3">
                <Users size={24} className="text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-slate-300 mb-1">
                No employees found
              </p>
              <p className="text-xs text-slate-500">
                This department has no active employees yet.
              </p>
            </div>
          ) : (
            employees.map((emp) => {
              const roleCfg = getRoleConfig(emp.role);
              return (
                <div
                  key={emp.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-white/[0.04]
                             hover:border-white/10 transition-colors"
                >
                  <Avatar user={emp} size={10} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">
                      {emp.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {emp.email}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0",
                      roleCfg.badgeClass,
                    )}
                  >
                    {roleCfg.label}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/[0.06] flex-shrink-0">
            <p className="text-xs text-slate-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10
                           text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center justify-center w-8 h-8 rounded-lg border border-white/10
                           text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Empty State
// ─────────────────────────────────────────────

function EmptyState({ search, isAdmin, onAdd }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20
                      flex items-center justify-center mb-4"
      >
        <Building2 size={28} className="text-teal-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">
        {search ? "No departments found" : "No departments yet"}
      </h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">
        {search
          ? "Try a different search term or clear the filter."
          : "Get started by creating your first department."}
      </p>
      {!search && isAdmin && (
        <button onClick={onAdd} className="btn-primary flex items-center gap-2">
          <Plus size={15} />
          Add Department
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Departments Page
// ─────────────────────────────────────────────

export default function DepartmentsPage() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals
  const [editDept, setEditDept] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteDept, setDeleteDept] = useState(null);
  const [viewDept, setViewDept] = useState(null);

  // ── Fetch departments ──
  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await departmentsAPI.getAll({
        limit: 200,
        search: search || undefined,
      });
      setDepartments(res.data.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load departments"));
    } finally {
      setLoading(false);
    }
  }, [search, refreshKey]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleSuccess = () => {
    setEditDept(null);
    setShowAdd(false);
    setDeleteDept(null);
    setRefreshKey((k) => k + 1);
  };

  // Compute stats
  const totalEmployees = departments.reduce(
    (sum, d) => sum + (d.employeeCount || 0),
    0,
  );
  const withManager = departments.filter((d) => d.manager_id).length;

  return (
    <DashboardLayout
      pageTitle="Departments"
      pageSubtitle="Manage your organization's departments and teams"
      actions={
        isAdmin && (
          <button
            onClick={() => setShowAdd(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={15} />
            Add Department
          </button>
        )
      }
    >
      {/* ── Stats ── */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Building2}
          label="Total Departments"
          value={loading ? "—" : departments.length}
          color="text-teal-400"
          bg="bg-teal-500/10"
          loading={loading}
        />
        <StatCard
          icon={Users}
          label="Total Employees"
          value={loading ? "—" : totalEmployees}
          color="text-blue-400"
          bg="bg-blue-500/10"
          loading={loading}
        />
        <StatCard
          icon={Shield}
          label="With Manager"
          value={loading ? "—" : withManager}
          color="text-violet-400"
          bg="bg-violet-500/10"
          loading={loading}
        />
      </div>

      {/* ── Search ── */}
      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments…"
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
        {!loading && (
          <p className="text-sm text-slate-500">
            <span className="text-slate-300 font-medium">
              {departments.length}
            </span>{" "}
            department{departments.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
        ) : departments.length === 0 ? (
          <EmptyState
            search={search}
            isAdmin={isAdmin}
            onAdd={() => setShowAdd(true)}
          />
        ) : (
          departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              isAdmin={isAdmin}
              onEdit={setEditDept}
              onDelete={setDeleteDept}
              onViewEmployees={setViewDept}
            />
          ))
        )}
      </div>

      {/* ── Modals ── */}
      {showAdd && (
        <DeptModal
          dept={null}
          onClose={() => setShowAdd(false)}
          onSuccess={handleSuccess}
        />
      )}

      {editDept && (
        <DeptModal
          dept={editDept}
          onClose={() => setEditDept(null)}
          onSuccess={handleSuccess}
        />
      )}

      {deleteDept && (
        <DeleteModal
          dept={deleteDept}
          onClose={() => setDeleteDept(null)}
          onSuccess={handleSuccess}
        />
      )}

      {viewDept && (
        <EmployeesModal dept={viewDept} onClose={() => setViewDept(null)} />
      )}
    </DashboardLayout>
  );
}
