"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usersAPI, departmentsAPI } from "@/lib/api";
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
  Key,
} from "lucide-react";

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "employee", label: "Employee" },
  { value: "admin", label: "Admin" },
];

const ITEMS_PER_PAGE = 12;

// ─────────────────────────────────────────────
//  User Card Component
// ─────────────────────────────────────────────

function UserCard({ user, onEdit, onDelete, onChangePassword }) {
  const roleConfig = getRoleConfig(user.role);

  return (
    <div className="glass-card p-5 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={getAvatarUrl(user.avatar_url)}
              alt={user.name}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/10"
            />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-teal-400 transition-colors">
              {user.name}
            </h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onChangePassword(user)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-blue-400 transition-colors"
            title="Change Password"
          >
            <Key size={16} />
          </button>
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-teal-400 transition-colors"
            title="Edit User"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => onDelete(user)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-red-400 transition-colors"
            title="Delete User"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Role</span>
          <span className={cn(
            "px-2 py-1 rounded-md text-xs font-medium",
            roleConfig.bgColor,
            roleConfig.textColor
          )}>
            <Shield size={12} className="inline mr-1" />
            {roleConfig.label}
          </span>
        </div>

        {user.department && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Department</span>
            <span className="text-sm text-foreground">{user.department.name}</span>
          </div>
        )}

        {user.phone && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Phone</span>
            <span className="text-sm text-foreground">{user.phone}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Created</span>
          <span className="text-sm text-foreground">{formatDate(user.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  User Modal Component
// ─────────────────────────────────────────────

function UserModal({ user, departments, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "employee",
    department_id: user?.department_id || "",
    phone: user?.phone || "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(
    getAvatarUrl(user?.avatar_url)
  );
  const modalRef = useRef(null);
  const { toast } = useToast();

  const isEditing = Boolean(user);

  // Animate modal open
  useEffect(() => {
    if (modalRef.current) {
      animateModalOpen(modalRef.current);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (modalRef.current) {
      animateModalClose(modalRef.current, onClose);
    } else {
      onClose();
    }
  }, [onClose]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!isEditing && !formData.password.trim()) newErrors.password = "Password is required";
    if (!isEditing && formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      let savedId = user?.id;

      if (isEditing) {
        await usersAPI.updateUser(user.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department_id: formData.department_id || null,
          phone: formData.phone || null,
        });
        toast.success("User updated successfully");
      } else {
        const response = await usersAPI.createUser(formData);
        savedId = response.data.data?.id;
        toast.success("User created successfully");
      }

      // Upload avatar if provided
      if (avatarFile && savedId) {
        const fd = new FormData();
        fd.append("avatar", avatarFile);
        await usersAPI.uploadAvatar(savedId, fd);
      }

      onSuccess();
      handleClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save user"));
    } finally {
      setLoading(false);
    }
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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="glass-card w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {isEditing ? "Edit User" : "Create New User"}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex-shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-teal-500/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white font-semibold text-lg">
                    {formData.name ? getInitials(formData.name) : "U"}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Profile Photo</p>
                <p className="text-xs text-muted-foreground mb-2">
                  JPG, PNG or WebP, max 5 MB
                </p>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-sm text-foreground cursor-pointer transition-colors">
                  <Upload size={14} />
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={cn(
                  "form-input w-full",
                  errors.name && "border-red-500 focus:border-red-500"
                )}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={cn(
                  "form-input w-full",
                  errors.email && "border-red-500 focus:border-red-500"
                )}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  className={cn(
                    "form-input w-full",
                    errors.password && "border-red-500 focus:border-red-500"
                  )}
                  placeholder="Enter password (min 6 characters)"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleChange("role", e.target.value)}
                className="form-input w-full"
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Department
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => handleChange("department_id", e.target.value)}
                className="form-input w-full"
              >
                <option value="">Select Department</option>
                {Array.isArray(departments) && departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="form-input w-full"
                placeholder="Enter phone number"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isEditing ? "Update User" : "Create User"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Change Password Modal Component
// ─────────────────────────────────────────────

function ChangePasswordModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const modalRef = useRef(null);
  const { toast } = useToast();

  // Animate modal open
  useEffect(() => {
    if (modalRef.current) {
      animateModalOpen(modalRef.current);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (modalRef.current) {
      animateModalClose(modalRef.current, onClose);
    } else {
      onClose();
    }
  }, [onClose]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.new_password.trim()) newErrors.new_password = "New password is required";
    if (formData.new_password.length < 6) newErrors.new_password = "Password must be at least 6 characters";
    if (formData.new_password !== formData.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await usersAPI.changePassword(user.id, {
        new_password: formData.new_password,
      });
      toast.success("Password changed successfully");
      onSuccess();
      handleClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to change password"));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="glass-card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              Change Password for {user.name}
            </h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Password *
              </label>
              <input
                type="password"
                value={formData.new_password}
                onChange={(e) => handleChange("new_password", e.target.value)}
                className={cn(
                  "form-input w-full",
                  errors.new_password && "border-red-500 focus:border-red-500"
                )}
                placeholder="Enter new password (min 6 characters)"
              />
              {errors.new_password && (
                <p className="text-red-500 text-sm mt-1">{errors.new_password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                value={formData.confirm_password}
                onChange={(e) => handleChange("confirm_password", e.target.value)}
                className={cn(
                  "form-input w-full",
                  errors.confirm_password && "border-red-500 focus:border-red-500"
                )}
                placeholder="Confirm new password"
              />
              {errors.confirm_password && (
                <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 spinner" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Key size={16} />
                    Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Delete Modal Component
// ─────────────────────────────────────────────

function DeleteModal({ user, onClose, onConfirm, loading }) {
  const modalRef = useRef(null);

  // Animate modal open
  useEffect(() => {
    if (modalRef.current) {
      animateModalOpen(modalRef.current);
    }
  }, []);

  const handleClose = useCallback(() => {
    if (modalRef.current) {
      animateModalClose(modalRef.current, onClose);
    } else {
      onClose();
    }
  }, [onClose]);

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="glass-card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Delete User</h2>
              <p className="text-sm text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>

          <p className="text-muted-foreground mb-6">
            Are you sure you want to delete <span className="font-medium text-foreground">{user.name}</span>? 
            This will deactivate their account and they will no longer be able to access the system.
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 spinner" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete User
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
  const { currentPage, totalPages, hasNext, hasPrev } = pagination;

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrev}
          className="p-2 rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNext}
          className="p-2 rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Users Page Component
// ─────────────────────────────────────────────

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: "",
    role: "",
    department: "",
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const pageRef = useRef(null);

  // Animate page entrance
  useEffect(() => {
    if (!loading && pageRef.current) {
      animatePageEntrance(pageRef.current);
    }
  }, [loading]);

  // Load initial data
  useEffect(() => {
    loadUsers();
    loadDepartments();
  }, []);

  // Load users when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadUsers(1);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [filters]);

  const loadUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = cleanParams({
        page,
        limit: ITEMS_PER_PAGE,
        search: filters.search || undefined,
        role: filters.role || undefined,
        department: filters.department || undefined,
      });

      const response = await usersAPI.getUsers(params);
      setUsers(response.data.data || []);
      setPagination(response.data.pagination || {});
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to load users"));
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const response = await departmentsAPI.getAll({ limit: 100 });
      setDepartments(response.data.data || []);
    } catch (err) {
      console.error("Failed to load departments:", err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleChangePassword = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    setDeleteLoading(true);
    try {
      await usersAPI.deleteUser(selectedUser.id);
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers(pagination.currentPage);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to delete user"));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleModalSuccess = () => {
    loadUsers(pagination.currentPage);
  };

  const handlePageChange = (page) => {
    loadUsers(page);
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      role: "",
      department: "",
    });
  };

  if (!isAdmin) {
    return (
      <DashboardLayout
        pageTitle="Access Denied"
        pageSubtitle="You don't have permission to access this page"
        requiredRoles={["admin"]}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Shield size={48} className="mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to manage users.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      pageTitle="User Management"
      pageSubtitle="Manage user accounts and permissions"
      requiredRoles={["admin"]}
      loading={loading}
      actions={
        <button
          onClick={handleCreateUser}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} />
          Add User
        </button>
      }
    >
      <div ref={pageRef} className="space-y-6">
        {/* Filters */}
        <div className="glass-card p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="form-input pl-10 w-full"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange("role", e.target.value)}
                className="form-input min-w-[140px]"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.department}
                onChange={(e) => handleFilterChange("department", e.target.value)}
                className="form-input min-w-[160px]"
              >
                <option value="">All Departments</option>
                {Array.isArray(departments) && departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>

              <button
                onClick={clearFilters}
                className="px-4 py-2 rounded-lg border border-white/10 text-muted-foreground hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card p-5 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="skeleton w-12 h-12 rounded-xl" />
                  <div className="space-y-2">
                    <div className="skeleton h-4 w-24 rounded" />
                    <div className="skeleton h-3 w-32 rounded" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="skeleton h-3 w-full rounded" />
                  <div className="skeleton h-3 w-3/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : !Array.isArray(users) || users.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Users size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Users Found</h3>
            <p className="text-muted-foreground mb-4">
              {Object.values(filters).some(Boolean)
                ? "No users match your current filters."
                : "Get started by creating your first user account."}
            </p>
            {Object.values(filters).some(Boolean) ? (
              <button
                onClick={clearFilters}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={handleCreateUser}
                className="btn-primary"
              >
                <Plus size={16} className="mr-2" />
                Add First User
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(users) && users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  onChangePassword={handleChangePassword}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}

        {/* Modals */}
        {showUserModal && (
          <UserModal
            user={selectedUser}
            departments={departments}
            onClose={() => setShowUserModal(false)}
            onSuccess={handleModalSuccess}
          />
        )}

        {showPasswordModal && (
          <ChangePasswordModal
            user={selectedUser}
            onClose={() => setShowPasswordModal(false)}
            onSuccess={handleModalSuccess}
          />
        )}

        {showDeleteModal && (
          <DeleteModal
            user={selectedUser}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            loading={deleteLoading}
          />
        )}
      </div>
    </DashboardLayout>
  );
}