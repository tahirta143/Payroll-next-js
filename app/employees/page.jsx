"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usersAPI, departmentsAPI, employeesAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { animatePageEntrance, animateModalOpen, animateModalClose } from "@/lib/gsap";
import {
  cn,
  getInitials,
  getAvatarUrl,
  getRoleConfig,
  getErrorMessage,
  formatDate,
  cleanParams,
} from "@/lib/utils";
import {
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Edit3,
  Trash2,
  Eye,
  Users,
  Building2,
  Mail,
  Phone,
  Shield,
  RefreshCw,
  Upload,
  Save,
  AlertCircle,
  MoreVertical,
} from "lucide-react";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "admin", label: "Admin" },
];

// ─────────────────────────────────────────────
//  Employee Card (mobile grid view)
// ─────────────────────────────────────────────

function EmployeeCard({ employee, onEdit, onDelete, canManage }) {
  const avatarUrl = getAvatarUrl(employee.avatar_url);
  const initials = getInitials(employee.name);
  const roleCfg = getRoleConfig(employee.role);

  return (
    <div className="glass-card p-4 flex flex-col gap-3 hover:border-white/[0.12] transition-all duration-200 group">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={employee.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="w-10 h-10 rounded-full avatar-fallback text-sm ring-2 ring-white/10">
                {initials}
              </div>
            )}
            {/* Online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#1a2332]" />
          </div>

          {/* Name + email */}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {employee.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{employee.email}</p>
          </div>
        </div>

        {/* Actions dropdown */}
        {canManage && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(employee)}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         bg-slate-800/60 border border-white/[0.07]
                         text-slate-400 hover:text-teal-400 hover:border-teal-500/30
                         transition-all duration-150"
              title="Edit employee"
            >
              <Edit3 size={12} strokeWidth={2} />
            </button>
            <button
              onClick={() => onDelete(employee)}
              className="w-7 h-7 rounded-lg flex items-center justify-center
                         bg-slate-800/60 border border-white/[0.07]
                         text-slate-400 hover:text-red-400 hover:border-red-500/30
                         transition-all duration-150"
              title="Deactivate employee"
            >
              <Trash2 size={12} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={roleCfg.badgeClass}>{roleCfg.label}</span>
        {employee.department?.name && (
          <span className="badge bg-slate-700/50 text-slate-400 border-slate-600/40">
            <Building2 size={10} strokeWidth={2} />
            {employee.department.name}
          </span>
        )}
      </div>

      {/* Phone */}
      {employee.phone && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Phone size={11} strokeWidth={2} />
          {employee.phone}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
        <span className="text-[11px] text-slate-600">
          Joined {formatDate(employee.created_at, "MMM YYYY")}
        </span>
        <Link
          href={`/employees/${employee.id}`}
          className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
        >
          <Eye size={11} strokeWidth={2} />
          View profile
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Employee Table Row (desktop)
// ─────────────────────────────────────────────

function EmployeeRow({ employee, onEdit, onDelete, canManage }) {
  const avatarUrl = getAvatarUrl(employee.avatar_url);
  const initials = getInitials(employee.name);
  const roleCfg = getRoleConfig(employee.role);

  return (
    <tr>
      {/* Employee */}
      <td>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={employee.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full avatar-fallback text-xs">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100 truncate">
              {employee.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{employee.email}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td>
        <span className={roleCfg.badgeClass}>
          <Shield size={10} strokeWidth={2} />
          {roleCfg.label}
        </span>
      </td>

      {/* Department */}
      <td>
        <span className="text-sm text-slate-300">
          {employee.department?.name || (
            <span className="text-slate-600">—</span>
          )}
        </span>
      </td>

      {/* Phone */}
      <td>
        <span className="text-sm text-slate-400 font-mono">
          {employee.phone || <span className="text-slate-600">—</span>}
        </span>
      </td>

      {/* Joined */}
      <td>
        <span className="text-sm text-slate-400">
          {formatDate(employee.created_at, "MMM D, YYYY")}
        </span>
      </td>

      {/* Status */}
      <td>
        <span
          className={cn(
            "badge",
            employee.is_active
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20",
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
      </td>

      {/* Actions */}
      <td className="text-right">
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/employees/${employee.id}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
                       font-medium text-slate-400 border border-white/[0.07]
                       hover:text-teal-400 hover:border-teal-500/30 hover:bg-teal-500/10
                       transition-all duration-150"
          >
            <Eye size={12} strokeWidth={2} />
            View
          </Link>
          {canManage && (
            <>
              <button
                onClick={() => onEdit(employee)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
                           font-medium text-slate-400 border border-white/[0.07]
                           hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-500/10
                           transition-all duration-150"
              >
                <Edit3 size={12} strokeWidth={2} />
                Edit
              </button>
              <button
                onClick={() => onDelete(employee)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
                           font-medium text-slate-400 border border-white/[0.07]
                           hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10
                           transition-all duration-150"
              >
                <Trash2 size={12} strokeWidth={2} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
//  Add / Edit Employee Modal
// ─────────────────────────────────────────────

function EmployeeModal({ employee, departments, onClose, onSuccess }) {
  const { toast } = useToast();
  const modalRef = useRef(null);
  const isEdit = !!employee;

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
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar must be smaller than 5 MB");
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
      let savedId = employee?.id;

      if (isEdit) {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          role: form.role,
          department_id: form.department_id || null,
          is_active: form.is_active,
        };
        await employeesAPI.update(employee.id, payload);
        toast.success("Employee updated successfully");
      } else {
        // Create new employee profile
        const payload = {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          role: form.role,
          department_id: form.department_id || null,
          is_active: form.is_active,
        };
        const response = await employeesAPI.create(payload);
        savedId = response.data.data?.id;
        toast.success("Employee profile created successfully");
        toast.info("To enable login access, create a user account via the Users page");
      }

      // Upload avatar if provided
      if (avatarFile && savedId) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        await usersAPI.uploadAvatar(savedId, fd);
      }

      onSuccess?.();
      handleClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to save employee");
      toast.error(msg);
      if (msg.toLowerCase().includes("email")) {
        setErrors({ email: msg });
      }
    } finally {
      setSaving(false);
    }
  };

  const initials = getInitials(form.name || "E");

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        ref={modalRef}
        className="glass-card w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-heading font-semibold text-white">
              {isEdit ? "Edit Employee Profile" : "Create Employee Profile"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit
                ? "Update employee profile information"
                : "Create a new employee profile (login access requires separate user account)"}
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

        {!isEdit && (
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-400">
              <AlertCircle size={16} className="inline mr-2" />
              This creates an employee profile. To enable login access, create a user account via the <strong>Users</strong> page.
            </p>
          </div>
        )}

        {/* Avatar upload */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-slate-800/30 border border-white/[0.06]">
          <div className="flex-shrink-0">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar preview"
                className="w-14 h-14 rounded-full object-cover ring-2 ring-teal-500/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-full avatar-fallback text-base ring-2 ring-teal-500/30">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-200">Profile Photo</p>
            <p className="text-xs text-slate-500 mb-2">
              JPG, PNG or WebP, max 5 MB
            </p>
            <label className="btn btn-secondary btn-sm cursor-pointer inline-flex items-center gap-1.5">
              <Upload size={12} strokeWidth={2} />
              Upload Photo
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="form-label">Full Name *</label>
            <input
              name="name"
              type="text"
              placeholder="Jane Smith"
              value={form.name}
              onChange={handleChange}
              disabled={saving}
              className={cn("form-input", errors.name && "border-red-500/50")}
            />
            {errors.name && (
              <p className="form-error">
                <span>⚠</span> {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="form-label">Email Address *</label>
            <input
              name="email"
              type="email"
              placeholder="jane@company.com"
              value={form.email}
              onChange={handleChange}
              disabled={saving}
              className={cn("form-input", errors.email && "border-red-500/50")}
            />
            {errors.email && (
              <p className="form-error">
                <span>⚠</span> {errors.email}
              </p>
            )}
          </div>

          {/* Phone + Role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Phone</label>
              <input
                name="phone"
                type="tel"
                placeholder="+1 555 000 0000"
                value={form.phone}
                onChange={handleChange}
                disabled={saving}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Role</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                disabled={saving}
                className="form-input"
              >
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="form-label">Department</label>
            <select
              name="department_id"
              value={form.department_id}
              onChange={handleChange}
              disabled={saving}
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

          {/* Active toggle (both create and edit) */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-lg
                          bg-slate-800/40 border border-white/[0.06]"
          >
            <div>
              <p className="text-sm font-medium text-slate-200">
                Account Status
              </p>
              <p className="text-xs text-slate-500">
                {isEdit 
                  ? "Inactive accounts cannot log in" 
                  : "Set initial account status (can be changed later)"
                }
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div
                className="w-10 h-5 bg-slate-700 peer-focus:ring-2 peer-focus:ring-teal-500/30
                              rounded-full peer peer-checked:bg-teal-600
                              peer-checked:after:translate-x-5
                              after:content-[''] after:absolute after:top-0.5 after:left-0.5
                              after:bg-white after:rounded-full after:h-4 after:w-4
                              after:transition-all duration-200"
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleClose}
            className="btn-secondary flex-1"
            disabled={saving}
          >
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
                <Save size={14} strokeWidth={2} />
                <span>{isEdit ? "Save Changes" : "Create Employee"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Delete Confirm Modal
// ─────────────────────────────────────────────

function DeleteModal({ employee, onClose, onConfirm, loading }) {
  const modalRef = useRef(null);

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

  // Handle confirm with animation
  const handleConfirm = async () => {
    await onConfirm();
    // onConfirm should handle closing the modal after success
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        ref={modalRef}
        className="glass-card w-full max-w-sm mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
            <AlertCircle size={22} className="text-red-400" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-base font-heading font-semibold text-white">
              Deactivate Employee
            </h3>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
              Are you sure you want to deactivate{" "}
              <span className="font-semibold text-white">{employee?.name}</span>
              ? They will lose access to the system immediately.
            </p>
          </div>
          <div className="flex gap-3 w-full">
            <button
              onClick={handleClose}
              className="btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="btn-danger flex-1 gap-2 hover:bg-red-600 hover:text-white hover:border-red-600"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 spinner" />
                  <span>Deactivating…</span>
                </>
              ) : (
                <>
                  <Trash2 size={13} strokeWidth={2} />
                  <span>Deactivate</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Pagination Component
// ─────────────────────────────────────────────

function Pagination({ pagination, onPageChange }) {
  if (!pagination || pagination.totalPages <= 1) return null;
  const { page, totalPages, total, limit, hasPrevPage, hasNextPage } =
    pagination;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
      <p className="text-xs text-slate-500">
        Showing{" "}
        <span className="text-slate-300 font-medium">
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)}
        </span>{" "}
        of <span className="text-slate-300 font-medium">{total}</span> employees
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="w-7 h-7 rounded-lg flex items-center justify-center
                     bg-slate-800/60 border border-white/[0.07]
                     text-slate-400 hover:text-white hover:bg-slate-700/60
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
                     bg-slate-800/60 border border-white/[0.07]
                     text-slate-400 hover:text-white hover:bg-slate-700/60
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Employees Page
// ─────────────────────────────────────────────

export default function EmployeesPage() {
  const { user, isAdmin, isAdminOrManager } = useAuth();
  const { toast } = useToast();
  const pageContentRef = useRef(null);

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deptLoading, setDeptLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    department: "",
    status: "", // Add status filter
  });
  const [page, setPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [deleteEmployee, setDeleteEmployee] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [viewMode, setViewMode] = useState("table"); // 'table' | 'grid'

  // Animate page content on mount
  useEffect(() => {
    if (!loading && pageContentRef.current) {
      animatePageEntrance(pageContentRef.current);
    }
  }, [loading]);

  // ── Fetch employees ──
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = cleanParams({
        page,
        limit: 15,
        search: filters.search || undefined,
        role: filters.role || undefined,
        department: filters.department || undefined,
        status: filters.status || undefined,
      });
      const res = await employeesAPI.getAll(params);
      setEmployees(res.data.data || []);
      setPagination(res.data.pagination || null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load employees"));
    } finally {
      setLoading(false);
    }
  }, [page, filters, refreshKey]);

  // ── Fetch departments for filters + modal ──
  const fetchDepartments = useCallback(async () => {
    setDeptLoading(true);
    try {
      const res = await departmentsAPI.getAll({ limit: 100 });
      setDepartments(res.data.data || []);
    } catch {
      // ignore
    } finally {
      setDeptLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ search: "", role: "", department: "", status: "" });
    setPage(1);
  };

  const handleSuccess = () => {
    setRefreshKey((k) => k + 1);
    setPage(1);
  };

  const handleDelete = async () => {
    if (!deleteEmployee) return;
    setDeleteLoading(true);
    try {
      await employeesAPI.delete(deleteEmployee.id);
      toast.success(`${deleteEmployee.name} has been deactivated`);
      setDeleteEmployee(null);
      handleSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to deactivate employee"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasFilters = filters.search || filters.role || filters.department || filters.status;

  const totalActive = employees.filter((e) => e.is_active).length;

  return (
    <DashboardLayout
      pageTitle="Employee Profiles"
      pageSubtitle="View and manage employee profile information"
      requiredRoles={["admin", "manager"]}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="btn-secondary btn-sm flex items-center gap-1.5"
          >
            <RefreshCw size={13} strokeWidth={2} />
            Refresh
          </button>
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary btn-sm flex items-center gap-1.5"
            >
              <Plus size={14} strokeWidth={2.5} />
              Add Employee
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5 pt-2" ref={pageContentRef}>
        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total Employees",
              value: pagination?.total ?? "—",
              icon: Users,
              color: "text-teal-400",
              bg: "bg-teal-500/10",
            },
            {
              label: "Active",
              value: loading
                ? "—"
                : employees.filter((e) => e.is_active).length,
              icon: Users,
              color: "text-green-400",
              bg: "bg-green-500/10",
            },
            {
              label: "Managers",
              value: loading
                ? "—"
                : employees.filter((e) => e.role === "manager").length,
              icon: Shield,
              color: "text-violet-400",
              bg: "bg-violet-500/10",
            },
            {
              label: "Departments",
              value: departments.length,
              icon: Building2,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="glass-card px-4 py-3 flex items-center gap-3"
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    s.bg,
                  )}
                >
                  <Icon size={16} className={s.color} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p
                    className={cn(
                      "text-xl font-heading font-bold leading-tight",
                      s.color,
                    )}
                  >
                    {s.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Filters + Table ── */}
        <div className="glass-card">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/[0.06]">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="form-input pl-8 py-1.5 text-xs w-full"
              />
            </div>

            {/* Role filter */}
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="form-input py-1.5 text-xs w-32"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            {/* Department filter */}
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
              className="form-input py-1.5 text-xs w-40"
              disabled={deptLoading}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="form-input py-1.5 text-xs w-32"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400
                           transition-colors px-2 py-1.5 rounded-lg hover:bg-red-500/10"
              >
                <X size={12} strokeWidth={2.5} />
                Clear
              </button>
            )}

            {/* View toggle */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  viewMode === "table"
                    ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
                    : "bg-slate-800/40 border-white/[0.07] text-slate-500 hover:text-slate-300",
                )}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  viewMode === "grid"
                    ? "bg-teal-500/15 border-teal-500/30 text-teal-400"
                    : "bg-slate-800/40 border-white/[0.07] text-slate-500 hover:text-slate-300",
                )}
              >
                Grid
              </button>
            </div>
          </div>

          {/* Loading skeleton */}
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton h-3.5 w-40 rounded" />
                    <div className="skeleton h-2.5 w-56 rounded" />
                  </div>
                  <div className="skeleton h-5 w-16 rounded-full" />
                  <div className="skeleton h-5 w-24 rounded-full" />
                  <div className="skeleton h-4 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="empty-state py-16">
              <Users className="empty-state-icon" size={36} />
              <p className="empty-state-title">No employees found</p>
              <p className="empty-state-desc">
                {hasFilters
                  ? "Try adjusting your search or filters."
                  : "Get started by adding your first employee."}
              </p>
              {isAdmin && !hasFilters && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary btn-sm mt-4 flex items-center gap-1.5"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Add First Employee
                </button>
              )}
            </div>
          ) : viewMode === "grid" ? (
            /* Grid view */
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {employees.map((emp) => (
                <EmployeeCard
                  key={emp.id}
                  employee={emp}
                  onEdit={setEditEmployee}
                  onDelete={setDeleteEmployee}
                  canManage={isAdmin}
                />
              ))}
            </div>
          ) : (
            /* Table view */
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <EmployeeRow
                      key={emp.id}
                      employee={emp}
                      onEdit={setEditEmployee}
                      onDelete={setDeleteEmployee}
                      canManage={isAdmin}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      </div>

      {/* Modals */}
      {(showAddModal || editEmployee) && (
        <EmployeeModal
          employee={editEmployee}
          departments={departments}
          onClose={() => {
            setShowAddModal(false);
            setEditEmployee(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {deleteEmployee && (
        <DeleteModal
          employee={deleteEmployee}
          onClose={() => setDeleteEmployee(null)}
          onConfirm={handleDelete}
          loading={deleteLoading}
        />
      )}
    </DashboardLayout>
  );
}
