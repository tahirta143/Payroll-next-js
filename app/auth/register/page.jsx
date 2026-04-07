'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';
import { CosmicParallaxBg } from '@/components/ui/parallax-cosmic-background';
import {
  Eye,
  EyeOff,
  Clock,
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  CheckCircle2,
  Building2,
  Phone,
} from 'lucide-react';

// ─────────────────────────────────────────────
//  Password strength indicator
// ─────────────────────────────────────────────

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', pass: /[a-z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];

  const passed = checks.filter((c) => c.pass).length;
  const strength = passed === 0 ? 0 : passed <= 2 ? 1 : passed === 3 ? 2 : 3;

  const colors = ['bg-slate-700', 'bg-red-500', 'bg-amber-500', 'bg-green-500'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bars */}
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-1 rounded-full transition-all duration-300',
              i < strength ? colors[strength] : 'bg-slate-700/60'
            )}
          />
        ))}
        <span
          className={cn(
            'text-[11px] font-semibold ml-1',
            strength === 1 && 'text-red-400',
            strength === 2 && 'text-amber-400',
            strength === 3 && 'text-green-400',
            strength === 0 && 'text-slate-600'
          )}
        >
          {labels[strength]}
        </span>
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {checks.map((c, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <CheckCircle2
              size={11}
              className={cn(
                'flex-shrink-0 transition-colors duration-200',
                c.pass ? 'text-green-400' : 'text-slate-600'
              )}
              strokeWidth={2.5}
            />
            <span
              className={cn(
                'text-[11px] transition-colors duration-200',
                c.pass ? 'text-slate-300' : 'text-slate-600'
              )}
            >
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Role Option Card
// ─────────────────────────────────────────────

function RoleOption({ value, label, desc, icon: Icon, color, bg, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        'flex items-start gap-3 p-3 rounded-xl border text-left',
        'transition-all duration-200',
        selected
          ? cn('border-teal-500/50 bg-teal-500/10', 'ring-1 ring-teal-500/30')
          : 'border-white/[0.07] bg-slate-800/30 hover:border-white/[0.14] hover:bg-slate-800/50'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
          bg
        )}
      >
        <Icon size={15} className={color} strokeWidth={2} />
      </div>
      <div>
        <p
          className={cn(
            'text-sm font-semibold leading-tight',
            selected ? 'text-white' : 'text-slate-300'
          )}
        >
          {label}
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{desc}</p>
      </div>
      {selected && (
        <CheckCircle2
          size={14}
          className="text-teal-400 flex-shrink-0 ml-auto mt-0.5"
          strokeWidth={2.5}
        />
      )}
    </button>
  );
}

// ─────────────────────────────────────────────
//  Main Register Page
// ─────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { register, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'employee',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  // ── Input handler ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ── Validation ──
  const validate = () => {
    const errs = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters';
    }

    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (!form.password) {
      errs.password = 'Password is required';
    } else if (form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!form.confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        phone: form.phone.trim() || undefined,
      });

      if (result.success) {
        toast.success(`Welcome to AttendanceIQ, ${result.user?.name?.split(' ')[0]}! 🎉`);
        const role = result.user?.role;
        router.replace(role === 'admin' || role === 'manager' ? '/dashboard' : '/attendance');
      } else {
        toast.error(result.message || 'Registration failed. Please try again.');
        if (result.message?.toLowerCase().includes('email')) {
          setErrors({ email: result.message });
        } else {
          setErrors({ general: result.message });
        }
      }
    } catch {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-6 h-6 spinner" />
      </div>
    );
  }

  const roleOptions = [
    {
      value: 'employee',
      label: 'Employee',
      desc: 'Track attendance & request leave',
      icon: User,
      color: 'text-slate-300',
      bg: 'bg-slate-700/60',
    },
    {
      value: 'manager',
      label: 'Manager',
      desc: 'Manage team & approve requests',
      icon: Building2,
      color: 'text-violet-400',
      bg: 'bg-violet-500/15',
    },
  ];

  return (
    <>
      <CosmicParallaxBg loop={true} />
    <div className="min-h-screen bg-[#0F172A] flex overflow-hidden relative z-10">

      {/* ════════════════════════════════════════
          LEFT PANEL — Branding
      ════════════════════════════════════════ */}
      <div
        className={cn(
          'hidden lg:flex lg:w-[44%] xl:w-[46%] flex-col relative overflow-hidden',
          'bg-gradient-to-br from-[#0F172A] via-[#0c1b2e] to-[#091622]',
          'transition-all duration-700',
          mounted ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full bg-teal-500/[0.06] blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-blue-500/[0.04] blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(148,163,184,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,0.8) 1px,transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col h-full px-10 xl:px-14 py-10">
          {/* Logo */}
          <div
            className="flex items-center gap-3 animate-fade-in"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
          >
            <div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700
                          flex items-center justify-center
                          shadow-[0_0_20px_rgba(20,184,166,0.5)]"
            >
              <Clock size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-heading font-bold text-white">AttendanceIQ</h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-widest uppercase">Enterprise</p>
            </div>
          </div>

          {/* Hero */}
          <div className="mt-auto mb-10">
            <div
              className="animate-fade-in"
              style={{ animationDelay: '200ms', animationFillMode: 'both' }}
            >
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                             bg-teal-500/10 border border-teal-500/20 mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs font-semibold text-teal-400 tracking-wide">
                  Join thousands of teams
                </span>
              </span>

              <h2 className="text-3xl xl:text-4xl font-heading font-bold text-white leading-tight mb-4">
                Set up your
                <br />
                <span className="text-gradient">workspace</span>
                <br />
                in seconds
              </h2>

              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Create your account and start managing attendance, leaves, and
                reports for your entire organisation from one unified dashboard.
              </p>
            </div>

            {/* Feature pills */}
            <div
              className="mt-8 flex flex-wrap gap-2 animate-fade-in"
              style={{ animationDelay: '400ms', animationFillMode: 'both' }}
            >
              {[
                'Real-time tracking',
                'Leave management',
                'CSV exports',
                'Email alerts',
                'Role-based access',
                'Geolocation',
              ].map((f) => (
                <span
                  key={f}
                  className="px-3 py-1 rounded-full text-xs font-medium
                             bg-slate-800/60 border border-white/[0.07] text-slate-400"
                >
                  {f}
                </span>
              ))}
            </div>

            {/* Social proof */}
            <div
              className="mt-8 flex items-center gap-3 animate-fade-in"
              style={{ animationDelay: '550ms', animationFillMode: 'both' }}
            >
              {/* Avatar stack */}
              <div className="flex -space-x-2">
                {['#14B8A6', '#8b5cf6', '#3b82f6', '#f59e0b'].map((c, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-[#0F172A] flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: c }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                <span className="text-slate-300 font-semibold">2,400+</span> teams already onboard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT PANEL — Register Form
      ════════════════════════════════════════ */}
      <div
        className={cn(
          'flex-1 flex flex-col items-center justify-center',
          'px-6 sm:px-10 lg:px-14 xl:px-16 py-10',
          'bg-[#0F172A] lg:bg-[#080e1a] overflow-y-auto',
          'transition-all duration-700',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-6 lg:hidden">
          <div
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700
                        flex items-center justify-center shadow-[0_0_16px_rgba(20,184,166,0.4)]"
          >
            <Clock size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-heading font-bold text-white">AttendanceIQ</h1>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase">Enterprise</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-7">
            <h2 className="text-2xl font-heading font-bold text-white mb-1">
              Create your account
            </h2>
            <p className="text-slate-400 text-sm">
              Fill in the details below to get started
            </p>
          </div>

          {/* General error */}
          {errors.general && (
            <div
              className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-lg
                          bg-red-500/10 border border-red-500/25 animate-fade-in"
            >
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-400 text-xs font-bold">!</span>
              </div>
              <p className="text-sm text-red-400">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="form-label">Full Name</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User
                    size={15}
                    className={cn(
                      'transition-colors duration-200',
                      errors.name ? 'text-red-400' : 'text-slate-500'
                    )}
                  />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={handleChange}
                  disabled={submitting}
                  className={cn(
                    'form-input pl-9',
                    errors.name && 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50'
                  )}
                />
              </div>
              {errors.name && (
                <p className="form-error"><span>⚠</span> {errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail
                    size={15}
                    className={cn(
                      'transition-colors duration-200',
                      errors.email ? 'text-red-400' : 'text-slate-500'
                    )}
                  />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="jane@company.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={submitting}
                  className={cn(
                    'form-input pl-9',
                    errors.email && 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50'
                  )}
                />
              </div>
              {errors.email && (
                <p className="form-error"><span>⚠</span> {errors.email}</p>
              )}
            </div>

            {/* Phone (optional) */}
            <div>
              <label htmlFor="phone" className="form-label">
                Phone Number
                <span className="text-slate-600 font-normal ml-1">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Phone size={15} className="text-slate-500" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+1 555 000 0000"
                  value={form.phone}
                  onChange={handleChange}
                  disabled={submitting}
                  className="form-input pl-9"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock
                    size={15}
                    className={cn(
                      'transition-colors duration-200',
                      errors.password ? 'text-red-400' : 'text-slate-500'
                    )}
                  />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={submitting}
                  className={cn(
                    'form-input pl-9 pr-10',
                    errors.password && 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500
                             hover:text-slate-300 transition-colors disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                </button>
              </div>
              {errors.password && (
                <p className="form-error"><span>⚠</span> {errors.password}</p>
              )}
              <PasswordStrength password={form.password} />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock
                    size={15}
                    className={cn(
                      'transition-colors duration-200',
                      errors.confirmPassword ? 'text-red-400' : 'text-slate-500'
                    )}
                  />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  disabled={submitting}
                  className={cn(
                    'form-input pl-9 pr-10',
                    errors.confirmPassword && 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50',
                    form.confirmPassword && form.password === form.confirmPassword && 'border-green-500/40'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  disabled={submitting}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500
                             hover:text-slate-300 transition-colors disabled:opacity-50"
                >
                  {showConfirm ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="form-error"><span>⚠</span> {errors.confirmPassword}</p>
              ) : form.confirmPassword && form.password === form.confirmPassword ? (
                <p className="flex items-center gap-1.5 text-xs text-green-400 mt-1.5">
                  <CheckCircle2 size={11} strokeWidth={2.5} /> Passwords match
                </p>
              ) : null}
            </div>

            {/* Role Selection */}
            <div>
              <label className="form-label">Account Type</label>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map((opt) => (
                  <RoleOption
                    key={opt.value}
                    {...opt}
                    selected={form.role === opt.value}
                    onClick={(val) => setForm((prev) => ({ ...prev, role: val }))}
                  />
                ))}
              </div>
              <p className="text-[11px] text-slate-600 mt-2 flex items-center gap-1.5">
                <Shield size={10} />
                Admin accounts must be created by an existing administrator
              </p>
            </div>

            {/* Terms */}
            <p className="text-xs text-slate-500 leading-relaxed">
              By creating an account, you agree to our{' '}
              <span className="text-teal-400 hover:text-teal-300 cursor-pointer transition-colors">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="text-teal-400 hover:text-teal-300 cursor-pointer transition-colors">
                Privacy Policy
              </span>
              .
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary btn-lg w-full"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 spinner" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Sign in link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
            >
              Sign in
            </Link>
          </p>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 mt-5">
            <Shield size={11} className="text-slate-600" />
            <p className="text-[11px] text-slate-600">
              Secured with AES-256 encryption & JWT authentication
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
