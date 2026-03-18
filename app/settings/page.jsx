"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usersAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  cn,
  getAvatarUrl,
  getInitials,
  getErrorMessage,
  formatDate,
  getRoleConfig,
} from "@/lib/utils";
import {
  User,
  Lock,
  Palette,
  Bell,
  Camera,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Shield,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Globe,
  Clock,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Check,
  X,
  Info,
  ChevronRight,
  KeyRound,
  Smartphone,
} from "lucide-react";

// ─────────────────────────────────────────────
//  Settings tabs config
// ─────────────────────────────────────────────

const SETTINGS_TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
];

// ─────────────────────────────────────────────
//  Toggle Switch Component
// ─────────────────────────────────────────────

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none",
        checked ? "bg-teal-500" : "bg-slate-700",
        disabled && "opacity-40 cursor-not-allowed",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow-md transform transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

// ─────────────────────────────────────────────
//  Password Strength Indicator
// ─────────────────────────────────────────────

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  score = Object.values(checks).filter(Boolean).length;

  const levels = [
    { minScore: 0, label: "", color: "" },
    {
      minScore: 1,
      label: "Very Weak",
      color: "bg-red-500",
      text: "text-red-400",
    },
    {
      minScore: 2,
      label: "Weak",
      color: "bg-orange-500",
      text: "text-orange-400",
    },
    {
      minScore: 3,
      label: "Fair",
      color: "bg-amber-500",
      text: "text-amber-400",
    },
    {
      minScore: 4,
      label: "Strong",
      color: "bg-teal-500",
      text: "text-teal-400",
    },
    {
      minScore: 5,
      label: "Very Strong",
      color: "bg-green-500",
      text: "text-green-400",
    },
  ];

  const level = levels[Math.min(score, 5)];
  return {
    score,
    label: level.label,
    color: level.color,
    text: level.text,
    checks,
  };
}

function PasswordStrengthBar({ password }) {
  const { score, label, color, text } = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i <= score ? color : "bg-slate-700/60",
            )}
          />
        ))}
      </div>
      {label && <p className={cn("text-xs font-medium", text)}>{label}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Avatar Upload
// ─────────────────────────────────────────────

function AvatarUpload({ user, onAvatarChange }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const currentAvatarUrl = getAvatarUrl(user?.avatar_url);
  const initials = getInitials(user?.name);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are supported");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be smaller than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("avatar", selectedFile);
      const res = await usersAPI.uploadAvatar(user.id, fd);
      const newAvatarUrl = res.data.data?.avatar_url;
      onAvatarChange(newAvatarUrl);
      setPreview(null);
      setSelectedFile(null);
      toast.success("Profile photo updated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to upload photo"));
    } finally {
      setUploading(false);
    }
  };

  const handleDiscard = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const displaySrc = preview || currentAvatarUrl;

  return (
    <div className="flex items-start gap-6">
      {/* Avatar circle */}
      <div className="relative flex-shrink-0">
        {displaySrc ? (
          <img
            src={displaySrc}
            alt={user?.name}
            className="w-24 h-24 rounded-2xl object-cover ring-4 ring-teal-500/20"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500/30 to-teal-700/30
                          text-teal-300 text-2xl font-bold ring-4 ring-teal-500/20
                          flex items-center justify-center"
          >
            {initials}
          </div>
        )}

        {/* Camera button */}
        <button
          onClick={() => fileRef.current?.click()}
          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-teal-500 text-white
                     flex items-center justify-center shadow-lg hover:bg-teal-400 transition-colors"
          title="Change photo"
        >
          <Camera size={14} />
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Info + actions */}
      <div className="flex-1 min-w-0 pt-1">
        <p className="text-sm font-semibold text-slate-200 mb-0.5">
          Profile Photo
        </p>
        <p className="text-xs text-slate-500 mb-4">
          JPG, PNG or WebP · Max 2MB
        </p>

        {preview ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                         bg-teal-500 hover:bg-teal-400 text-white disabled:opacity-60 transition-all"
            >
              {uploading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Check size={12} />
              )}
              {uploading ? "Uploading…" : "Upload Photo"}
            </button>
            <button
              onClick={handleDiscard}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                         bg-slate-700/60 border border-white/[0.06] text-slate-400
                         hover:text-slate-200 disabled:opacity-60 transition-all"
            >
              <X size={12} />
              Discard
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                       bg-slate-700/60 border border-white/[0.06] text-slate-400
                       hover:text-slate-200 hover:border-white/20 transition-all"
          >
            <Camera size={12} />
            Change Photo
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tab: Profile
// ─────────────────────────────────────────────

function ProfileTab() {
  const { user, updateUser, refreshUser } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const roleCfg = getRoleConfig(user?.role);

  useEffect(() => {
    setForm({ name: user?.name || "", phone: user?.phone || "" });
  }, [user?.name, user?.phone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
    setDirty(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Full name is required";
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
      await usersAPI.update(user.id, {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
      });
      updateUser({ name: form.name.trim(), phone: form.phone.trim() || null });
      setDirty(false);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = (newAvatarUrl) => {
    updateUser({ avatar_url: newAvatarUrl });
  };

  return (
    <div className="space-y-6">
      {/* Avatar section */}
      <div className="glass-card border border-white/[0.06] p-6">
        <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <Camera size={15} className="text-teal-400" />
          Profile Photo
        </h3>
        <AvatarUpload user={user} onAvatarChange={handleAvatarChange} />
      </div>

      {/* Personal info form */}
      <div className="glass-card border border-white/[0.06] p-6">
        <h3 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <User size={15} className="text-teal-400" />
          Personal Information
        </h3>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={cn(
                  "form-input w-full mt-1",
                  errors.name && "border-red-500/50",
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-400 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="form-label">Phone Number</label>
              <div className="relative mt-1">
                <Phone
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className="form-input w-full pl-9"
                />
              </div>
            </div>

            {/* Email — read-only */}
            <div>
              <label className="form-label">Email Address</label>
              <div className="relative mt-1">
                <Mail
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className="form-input w-full pl-9 opacity-50 cursor-not-allowed select-none"
                />
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Email cannot be changed from here.
              </p>
            </div>

            {/* Role — read-only */}
            <div>
              <label className="form-label">Role</label>
              <div
                className="mt-1 h-[42px] flex items-center px-3 rounded-xl border border-white/[0.08]
                              bg-slate-800/40"
              >
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
                    roleCfg.badgeClass,
                  )}
                >
                  {roleCfg.label}
                </span>
                <p className="text-xs text-slate-600 ml-2">Assigned by admin</p>
              </div>
            </div>
          </div>

          {/* Department — read-only */}
          {user?.department && (
            <div>
              <label className="form-label">Department</label>
              <div className="relative mt-1">
                <div className="form-input flex items-center gap-2 opacity-60 cursor-not-allowed">
                  <span className="text-sm text-slate-300">
                    {user.department.name}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Save button */}
          <div className="flex items-center justify-between pt-2">
            {dirty && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <AlertCircle size={12} />
                You have unsaved changes
              </p>
            )}
            <div
              className={cn(
                "flex items-center gap-3 ml-auto",
                !dirty && "w-full justify-end",
              )}
            >
              {dirty && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({
                      name: user?.name || "",
                      phone: user?.phone || "",
                    });
                    setErrors({});
                    setDirty(false);
                  }}
                  className="btn-secondary"
                >
                  Reset
                </button>
              )}
              <button
                type="submit"
                disabled={saving || !dirty}
                className="btn-primary flex items-center gap-2 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Account info */}
      <div className="glass-card border border-white/[0.06] p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Info size={15} className="text-teal-400" />
          Account Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-slate-800/40 border border-white/[0.04]">
            <p className="text-xs text-slate-500 mb-1">User ID</p>
            <p className="text-sm font-mono text-slate-300">#{user?.id}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-white/[0.04]">
            <p className="text-xs text-slate-500 mb-1">Member Since</p>
            <p className="text-sm text-slate-300">
              {formatDate(user?.created_at)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/40 border border-white/[0.04]">
            <p className="text-xs text-slate-500 mb-1">Account Status</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-sm text-green-400 font-medium">Active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tab: Security
// ─────────────────────────────────────────────

function SecurityTab() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [saving, setSaving] = useState(false);

  const strength = getPasswordStrength(form.new_password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const toggleShow = (field) => setShow((p) => ({ ...p, [field]: !p[field] }));

  const validate = () => {
    const errs = {};
    if (!form.current_password)
      errs.current_password = "Current password is required";
    if (!form.new_password) errs.new_password = "New password is required";
    else if (form.new_password.length < 6)
      errs.new_password = "New password must be at least 6 characters";
    else if (form.new_password === form.current_password)
      errs.new_password = "New password must differ from current";
    if (!form.confirm_password)
      errs.confirm_password = "Please confirm your new password";
    else if (form.confirm_password !== form.new_password)
      errs.confirm_password = "Passwords do not match";
    return errs;
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
      await usersAPI.changePassword(user.id, {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      toast.success("Password changed successfully");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
      setErrors({});
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to change password");
      if (
        msg.toLowerCase().includes("incorrect") ||
        msg.toLowerCase().includes("current")
      ) {
        setErrors({ current_password: "Current password is incorrect" });
      } else {
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const PasswordField = ({ label, name, fieldKey, placeholder, hint }) => (
    <div>
      <label className="form-label">{label}</label>
      <div className="relative mt-1">
        <input
          type={show[fieldKey] ? "text" : "password"}
          name={name}
          value={form[name]}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="new-password"
          className={cn(
            "form-input w-full pr-10",
            errors[name] && "border-red-500/50",
          )}
        />
        <button
          type="button"
          onClick={() => toggleShow(fieldKey)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
        >
          {show[fieldKey] ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
      {name === "new_password" && (
        <PasswordStrengthBar password={form.new_password} />
      )}
      {errors[name] && (
        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <AlertCircle size={11} />
          {errors[name]}
        </p>
      )}
      {hint && !errors[name] && (
        <p className="text-xs text-slate-600 mt-1">{hint}</p>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Change password */}
      <div className="glass-card border border-white/[0.06] p-6">
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <KeyRound size={15} className="text-teal-400" />
          Change Password
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Choose a strong password to keep your account secure.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordField
            label="Current Password *"
            name="current_password"
            fieldKey="current"
            placeholder="Enter your current password"
          />

          <PasswordField
            label="New Password *"
            name="new_password"
            fieldKey="new"
            placeholder="Enter a strong new password"
            hint="Min 8 characters with uppercase, number & symbol recommended"
          />

          {/* Password requirements */}
          {form.new_password && (
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: "length", label: "8+ characters" },
                { key: "upper", label: "Uppercase letter" },
                { key: "lower", label: "Lowercase letter" },
                { key: "number", label: "Number" },
                { key: "special", label: "Special character" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-1.5">
                  {strength.checks?.[key] ? (
                    <CheckCircle2
                      size={12}
                      className="text-green-400 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-3 h-3 rounded-full border border-slate-600 flex-shrink-0" />
                  )}
                  <span
                    className={cn(
                      "text-xs",
                      strength.checks?.[key]
                        ? "text-green-400"
                        : "text-slate-500",
                    )}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <PasswordField
            label="Confirm New Password *"
            name="confirm_password"
            fieldKey="confirm"
            placeholder="Re-enter your new password"
          />

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Changing…
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Account security info */}
      <div className="glass-card border border-white/[0.06] p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Shield size={15} className="text-teal-400" />
          Account Security
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Lock size={15} className="text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Password</p>
                <p className="text-xs text-slate-500">Last changed: Recently</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
              <CheckCircle2 size={11} />
              Enabled
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-white/[0.04]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-700/60 border border-white/[0.06] flex items-center justify-center">
                <Smartphone size={15} className="text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Two-Factor Authentication
                </p>
                <p className="text-xs text-slate-500">
                  Add an extra layer of security
                </p>
              </div>
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                             bg-slate-700/60 text-slate-400 border border-white/[0.06]"
            >
              Coming Soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tab: Appearance
// ─────────────────────────────────────────────

function AppearanceTab() {
  const { toast } = useToast();

  const [timeFormat, setTimeFormat] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("timeFormat") || "12h"
      : "12h",
  );
  const [dateFormat, setDateFormat] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("dateFormat") || "MMM D, YYYY"
      : "MMM D, YYYY",
  );

  const savePreference = (key, value) => {
    if (typeof window !== "undefined") localStorage.setItem(key, value);
    toast.success("Preference saved");
  };

  const nowSample = new Date();
  const timePreview12 = nowSample.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const timePreview24 = nowSample.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="space-y-6">
      {/* Theme */}
      <div className="glass-card border border-white/[0.06] p-6">
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Palette size={15} className="text-teal-400" />
          Theme
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Choose how AttendanceIQ looks to you.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Dark mode — current */}
          <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-teal-500/40 bg-teal-500/5 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0">
              <Moon size={18} className="text-teal-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Dark Mode</p>
              <p className="text-xs text-slate-500">Easy on the eyes</p>
            </div>
            <CheckCircle2 size={18} className="text-teal-400 flex-shrink-0" />
          </div>

          {/* Light mode — coming soon */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-slate-800/40 opacity-50 cursor-not-allowed">
            <div className="w-10 h-10 rounded-xl bg-slate-700/60 border border-white/[0.06] flex items-center justify-center flex-shrink-0">
              <Sun size={18} className="text-slate-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-400">Light Mode</p>
              <p className="text-xs text-slate-600">Coming soon</p>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full border border-white/[0.06] flex-shrink-0">
              Soon
            </span>
          </div>
        </div>
      </div>

      {/* Time format */}
      <div className="glass-card border border-white/[0.06] p-6">
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Clock size={15} className="text-teal-400" />
          Time Format
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Choose how time is displayed across the app.
        </p>
        <div className="flex items-center gap-3">
          {[
            { value: "12h", label: "12-hour", preview: timePreview12 },
            { value: "24h", label: "24-hour", preview: timePreview24 },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setTimeFormat(opt.value);
                savePreference("timeFormat", opt.value);
              }}
              className={cn(
                "flex-1 flex items-center justify-between p-4 rounded-xl border transition-all",
                timeFormat === opt.value
                  ? "border-teal-500/40 bg-teal-500/5"
                  : "border-white/[0.06] bg-slate-800/40 hover:border-white/20",
              )}
            >
              <div className="text-left">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    timeFormat === opt.value
                      ? "text-teal-300"
                      : "text-slate-300",
                  )}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {opt.preview}
                </p>
              </div>
              {timeFormat === opt.value && (
                <CheckCircle2 size={16} className="text-teal-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Date format */}
      <div className="glass-card border border-white/[0.06] p-6">
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Calendar size={15} className="text-teal-400" />
          Date Format
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Choose how dates are displayed across the app.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              value: "MMM D, YYYY",
              label: "Jan 5, 2025",
              preview: "Jan 5, 2025",
            },
            { value: "DD/MM/YYYY", label: "05/01/2025", preview: "05/01/2025" },
            { value: "MM/DD/YYYY", label: "01/05/2025", preview: "01/05/2025" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setDateFormat(opt.value);
                savePreference("dateFormat", opt.value);
              }}
              className={cn(
                "flex items-center justify-between p-3.5 rounded-xl border transition-all",
                dateFormat === opt.value
                  ? "border-teal-500/40 bg-teal-500/5"
                  : "border-white/[0.06] bg-slate-800/40 hover:border-white/20",
              )}
            >
              <span
                className={cn(
                  "text-sm font-mono font-semibold",
                  dateFormat === opt.value ? "text-teal-300" : "text-slate-400",
                )}
              >
                {opt.preview}
              </span>
              {dateFormat === opt.value && (
                <CheckCircle2 size={14} className="text-teal-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="glass-card border border-white/[0.06] p-6">
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Globe size={15} className="text-teal-400" />
          Language
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Interface language preference.
        </p>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-teal-500/30 bg-teal-500/5">
          <span className="text-xl">🇺🇸</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">English (US)</p>
            <p className="text-xs text-slate-500">More languages coming soon</p>
          </div>
          <CheckCircle2 size={16} className="text-teal-400" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Tab: Notifications
// ─────────────────────────────────────────────

function NotificationsTab() {
  const { isAdminOrManager } = useAuth();
  const { toast } = useToast();

  const [prefs, setPrefs] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("notificationPrefs") || "{}");
    } catch {
      return {};
    }
  });

  const defaults = {
    emailNotifications: true,
    leaveUpdates: true,
    attendanceReminders: true,
    weeklyReports: false,
    systemAlerts: true,
  };

  const getValue = (key) =>
    prefs[key] !== undefined ? prefs[key] : defaults[key];

  const toggle = (key) => {
    setPrefs((p) => ({ ...p, [key]: !getValue(key) }));
  };

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("notificationPrefs", JSON.stringify(prefs));
    }
    toast.success("Notification preferences saved");
  };

  const NOTIF_SETTINGS = [
    {
      key: "emailNotifications",
      label: "Email Notifications",
      desc: "Receive email updates about important account activity",
      icon: Mail,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      forAll: true,
    },
    {
      key: "leaveUpdates",
      label: "Leave Request Updates",
      desc: "Get notified when your leave requests are approved or rejected",
      icon: Calendar,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      forAll: true,
    },
    {
      key: "attendanceReminders",
      label: "Attendance Reminders",
      desc: "Daily check-in / check-out reminders",
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      forAll: true,
    },
    {
      key: "weeklyReports",
      label: "Weekly Reports",
      desc: "Receive a weekly summary of team attendance (managers only)",
      icon: Bell,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      forAll: false,
      adminOnly: true,
    },
    {
      key: "systemAlerts",
      label: "System Alerts",
      desc: "Important system updates and security alerts",
      icon: Shield,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      forAll: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card border border-white/[0.06] p-6">
        <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
          <Bell size={15} className="text-teal-400" />
          Notification Preferences
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Control which notifications you receive.
          <span className="ml-1 text-amber-400">
            Preferences are saved locally.
          </span>
        </p>

        <div className="space-y-3">
          {NOTIF_SETTINGS.map((s) => {
            if (s.adminOnly && !isAdminOrManager) return null;
            const enabled = getValue(s.key);
            return (
              <div
                key={s.key}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border transition-all",
                  enabled
                    ? "border-white/[0.08] bg-slate-800/40"
                    : "border-white/[0.04] bg-slate-800/20 opacity-70",
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                    s.bg,
                  )}
                >
                  <s.icon size={16} className={s.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200">
                    {s.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.desc}</p>
                </div>
                <Toggle checked={enabled} onChange={() => toggle(s.key)} />
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-5 pt-4 border-t border-white/[0.06]">
          <button
            onClick={handleSave}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={14} />
            Save Preferences
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
        <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400">
          Email notification delivery depends on your organization's email
          configuration. In-app notifications are always delivered regardless of
          these settings.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Settings Page
// ─────────────────────────────────────────────

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <DashboardLayout
      pageTitle="Settings"
      pageSubtitle="Manage your account preferences and security"
    >
      <div className="mt-6 flex flex-col lg:flex-row gap-6">
        {/* ── Sidebar nav (desktop) / top tabs (mobile) ── */}
        <div className="lg:w-56 flex-shrink-0">
          {/* Mobile: horizontal scrollable tabs */}
          <div
            className="lg:hidden flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar
                          bg-slate-800/60 p-1 rounded-xl border border-white/[0.06]"
          >
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                    active
                      ? "bg-teal-500 text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50",
                  )}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Desktop: vertical sidebar */}
          <nav className="hidden lg:flex flex-col gap-1 glass-card border border-white/[0.06] p-2">
            {SETTINGS_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left w-full",
                    active
                      ? "bg-teal-500/10 text-teal-300 border-l-2 border-teal-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/30",
                  )}
                >
                  <Icon
                    size={16}
                    className={active ? "text-teal-400" : "text-slate-500"}
                  />
                  {tab.label}
                  {active && (
                    <ChevronRight
                      size={14}
                      className="ml-auto text-teal-400/60"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Account summary card */}
          {user && (
            <div className="hidden lg:block mt-4 glass-card border border-white/[0.06] p-4 text-center">
              {getAvatarUrl(user.avatar_url) ? (
                <img
                  src={getAvatarUrl(user.avatar_url)}
                  alt={user.name}
                  className="w-14 h-14 rounded-xl object-cover mx-auto mb-3 ring-2 ring-teal-500/20"
                />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500/30 to-teal-700/30
                                text-teal-300 text-lg font-bold mx-auto mb-3 ring-2 ring-teal-500/20
                                flex items-center justify-center"
                >
                  {getInitials(user.name)}
                </div>
              )}
              <p className="text-sm font-semibold text-slate-200 truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {user.email}
              </p>
              <span
                className={cn(
                  "inline-flex items-center mt-2 px-2.5 py-1 rounded-full text-xs font-semibold",
                  getRoleConfig(user.role).badgeClass,
                )}
              >
                {getRoleConfig(user.role).label}
              </span>
            </div>
          )}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 min-w-0">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "appearance" && <AppearanceTab />}
          {activeTab === "notifications" && <NotificationsTab />}
        </div>
      </div>
    </DashboardLayout>
  );
}
