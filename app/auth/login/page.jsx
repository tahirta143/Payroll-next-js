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
  ArrowRight,
  Shield,
  Users,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';

// ─────────────────────────────────────────────
//  Animated feature bullet
// ─────────────────────────────────────────────

function FeatureItem({ icon: Icon, title, desc, delay }) {
  return (
    <div
      className="flex items-start gap-3 animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-teal-500/15 border border-teal-500/25
                      flex items-center justify-center mt-0.5">
        <Icon size={16} className="text-teal-400" strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-200">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Floating stat badge
// ─────────────────────────────────────────────

function StatBadge({ value, label, color, position }) {
  return (
    <div
      className={cn(
        'absolute glass-card px-3 py-2 flex items-center gap-2 animate-fade-in',
        position
      )}
      style={{ animationDelay: '800ms', animationFillMode: 'both' }}
    >
      <span className={cn('text-lg font-heading font-bold', color)}>{value}</span>
      <span className="text-xs text-slate-400 leading-tight max-w-[60px]">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Main Login Page
// ─────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mount animation trigger
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  // ── Input handler ──
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // ── Validation ──
  const validate = () => {
    const newErrors = {};
    if (!form.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await login(form.email.trim().toLowerCase(), form.password);

      if (result.success) {
        toast.success(`Welcome back, ${result.user?.name?.split(' ')[0] || 'there'}! 👋`);
        // Role-based redirect
        const role = result.user?.role;
        if (role === 'admin' || role === 'manager') {
          router.replace('/dashboard');
        } else {
          router.replace('/attendance');
        }
      } else {
        toast.error(result.message || 'Login failed. Please check your credentials.');
        setErrors({ general: result.message });
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Demo credentials fill ──
  const fillDemo = (role) => {
    const demos = {
      admin: { email: 'admin@attendance.com', password: 'Admin@1234' },
    };
    const creds = demos[role];
    if (creds) {
      setForm(creds);
      setErrors({});
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="w-6 h-6 spinner" />
      </div>
    );
  }

  return (
    <>
      <CosmicParallaxBg loop={true} />
    <div className="min-h-screen bg-[#0F172A] flex overflow-hidden relative z-10">

      {/* ═══════════════════════════════════════════
          LEFT PANEL — Branding & Features
      ═══════════════════════════════════════════ */}
      <div
        className={cn(
          'hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col relative overflow-hidden',
          'bg-gradient-to-br from-[#0F172A] via-[#0d1f35] to-[#0a2540]',
          'transition-all duration-700',
          mounted ? 'opacity-100' : 'opacity-0'
        )}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large teal circle glow */}
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full
                          bg-teal-500/[0.06] blur-3xl" />
          <div className="absolute top-1/2 -translate-y-1/2 -right-20 w-80 h-80 rounded-full
                          bg-teal-500/[0.04] blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 rounded-full
                          bg-blue-500/[0.04] blur-3xl" />

          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(148,163,184,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.8) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 xl:px-16 py-10">

          {/* ── Logo ── */}
          <div
            className="flex items-center gap-3 animate-fade-in"
            style={{ animationDelay: '100ms', animationFillMode: 'both' }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700
                            flex items-center justify-center
                            shadow-[0_0_20px_rgba(20,184,166,0.5)]">
              <Clock size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-base font-heading font-bold text-white">AttendanceIQ</h1>
              <p className="text-[11px] text-slate-500 font-medium tracking-widest uppercase">
                Enterprise
              </p>
            </div>
          </div>

          {/* ── Hero text ── */}
          <div className="mt-auto mb-8">
            <div
              className="animate-fade-in"
              style={{ animationDelay: '200ms', animationFillMode: 'both' }}
            >
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full
                               bg-teal-500/10 border border-teal-500/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs font-semibold text-teal-400 tracking-wide">
                  Production-Ready Platform
                </span>
              </span>

              <h2 className="text-4xl xl:text-5xl font-heading font-bold text-white leading-tight mb-4">
                Smart Attendance
                <br />
                <span className="text-gradient">Management</span>
                <br />
                for Modern Teams
              </h2>

              <p className="text-slate-400 text-base leading-relaxed max-w-md">
                Track attendance in real-time, manage leave requests, generate
                comprehensive reports, and keep your team synchronized — all from
                one powerful dashboard.
              </p>
            </div>

            {/* ── Features list ── */}
            <div className="mt-8 space-y-4">
              <FeatureItem
                icon={CheckCircle2}
                title="Real-Time Attendance Tracking"
                desc="One-click check-in/out with geolocation and live status updates"
                delay={350}
              />
              <FeatureItem
                icon={CalendarFeature}
                title="Leave Management"
                desc="Submit, approve or reject leave requests with email notifications"
                delay={450}
              />
              <FeatureItem
                icon={BarChart3}
                title="Advanced Reports & Analytics"
                desc="Monthly summaries, department breakdowns, and CSV exports"
                delay={550}
              />
              <FeatureItem
                icon={Shield}
                title="Role-Based Access Control"
                desc="Granular permissions for admins, managers, and employees"
                delay={650}
              />
            </div>
          </div>

          {/* ── Floating stat badges ── */}
          <div className="relative h-24 mb-4">
            <StatBadge
              value="99.9%"
              label="Uptime guarantee"
              color="text-teal-400"
              position="left-0 bottom-0"
            />
            <StatBadge
              value="50k+"
              label="Daily check-ins"
              color="text-green-400"
              position="left-40 bottom-4"
            />
            <StatBadge
              value="< 1s"
              label="Response time"
              color="text-blue-400"
              position="left-80 bottom-0"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RIGHT PANEL — Login Form
      ═══════════════════════════════════════════ */}
      <div
        className={cn(
          'flex-1 flex flex-col items-center justify-center',
          'px-6 sm:px-12 lg:px-16 xl:px-20 py-10',
          'bg-[#0F172A] lg:bg-[#080e1a]',
          'transition-all duration-700',
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        {/* Mobile logo (only visible on small screens) */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700
                          flex items-center justify-center shadow-[0_0_16px_rgba(20,184,166,0.4)]">
            <Clock size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-sm font-heading font-bold text-white">AttendanceIQ</h1>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase">Enterprise</p>
          </div>
        </div>

        {/* Form card */}
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-white mb-1">
              Welcome back
            </h2>
            <p className="text-slate-400 text-sm">
              Sign in to your workspace to continue
            </p>
          </div>

          {/* General error */}
          {errors.general && (
            <div className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-lg
                            bg-red-500/10 border border-red-500/25 animate-fade-in">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20
                              flex items-center justify-center">
                <span className="text-red-400 text-xs font-bold">!</span>
              </div>
              <p className="text-sm text-red-400">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
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
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={submitting}
                  className={cn(
                    'form-input pl-9',
                    errors.email
                      ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50'
                      : ''
                  )}
                />
              </div>
              {errors.email && (
                <p className="form-error">
                  <span>⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="form-label mb-0">
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
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
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  disabled={submitting}
                  className={cn(
                    'form-input pl-9 pr-10',
                    errors.password
                      ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500/50'
                      : ''
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={submitting}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-slate-500 hover:text-slate-300 transition-colors
                             disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={15} strokeWidth={2} />
                  ) : (
                    <Eye size={15} strokeWidth={2} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">
                  <span>⚠</span> {errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                'btn-primary btn-lg w-full mt-2',
                'relative overflow-hidden',
                'transition-all duration-200'
              )}
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 spinner" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-xs text-slate-600 font-medium select-none">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* ── Demo credentials ── */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500 text-center mb-3">
              Quick demo access
            </p>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              disabled={submitting}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg
                         bg-slate-800/50 border border-white/[0.07]
                         hover:bg-slate-800 hover:border-teal-500/25
                         transition-all duration-150 group disabled:opacity-50"
            >
              <div className="w-7 h-7 rounded-md bg-teal-500/15 border border-teal-500/25
                              flex items-center justify-center flex-shrink-0">
                <Shield size={13} className="text-teal-400" strokeWidth={2} />
              </div>
              <div className="text-left flex-1">
                <p className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                  Admin Account
                </p>
                <p className="text-[11px] text-slate-500">admin@attendance.com</p>
              </div>
              <ArrowRight
                size={13}
                className="text-slate-600 group-hover:text-teal-400 group-hover:translate-x-0.5
                           transition-all duration-150"
              />
            </button>
          </div>

          {/* ── Register link ── */}
          <p className="text-center text-sm text-slate-500 mt-8">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
            >
              Create account
            </Link>
          </p>

          {/* ── Security note ── */}
          <div className="flex items-center justify-center gap-2 mt-6">
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

// ── Calendar icon (local alias to avoid name conflict) ──
function CalendarFeature(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={props.strokeWidth || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
    </svg>
  );
}
