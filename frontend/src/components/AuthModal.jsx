import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, User, Loader2, Eye, EyeOff, CheckCircle, ArrowLeft, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

// Tab identifiers
const TABS = { LOGIN: 'login', SIGNUP: 'signup', FORGOT: 'forgot' };

const InputField = ({ label, icon: Icon, type = 'text', value, onChange, placeholder, required, error }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type={isPassword && showPassword ? 'text' : type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full pl-11 pr-${isPassword ? '11' : '4'} py-2.5 bg-slate-900/40 border rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none transition-colors text-sm ${
            error ? 'border-red-500/60 focus:border-red-500' : 'border-slate-800 focus:border-brand-500'
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
};

const AuthModal = ({ isOpen, onClose, defaultTab = TABS.LOGIN, onAuthSuccess }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [globalError, setGlobalError] = useState('');

  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab, isOpen]);

  // Reset state on tab switch
  useEffect(() => {
    setGlobalError('');
    setSuccess('');
    setFieldErrors({});
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  }, [tab]);

  if (!isOpen) return null;

  const validate = () => {
    const errors = {};
    if (tab === TABS.LOGIN) {
      if (!username.trim()) errors.username = 'Username is required';
      if (!password) errors.password = 'Password is required';
    } else if (tab === TABS.SIGNUP) {
      if (!username.trim()) errors.username = 'Username is required';
      if (username.length < 3) errors.username = 'Username must be at least 3 characters';
      if (!email.trim()) errors.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Please enter a valid email';
      if (!password) errors.password = 'Password is required';
      if (password.length < 6) errors.password = 'Password must be at least 6 characters';
      if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    } else if (tab === TABS.FORGOT) {
      if (!email.trim()) errors.email = 'Email is required';
      if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Please enter a valid email';
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setGlobalError('');
    setLoading(true);

    try {
      if (tab === TABS.LOGIN) {
        await login(username.trim(), password);
        onAuthSuccess?.();
        onClose();
      } else if (tab === TABS.SIGNUP) {
        await register(username.trim(), email.trim(), password);
        onAuthSuccess?.();
        onClose();
      } else if (tab === TABS.FORGOT) {
        await authService.requestPasswordReset(email.trim());
        setSuccess('If that email is registered, a reset link has been sent to your inbox.');
      }
    } catch (err) {
      const data = err.response?.data;
      setGlobalError(
        data?.detail ||
        data?.username?.[0] ||
        data?.email?.[0] ||
        data?.password?.[0] ||
        data?.non_field_errors?.[0] ||
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-800/80">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800/80 bg-gradient-to-b from-brand-900/20 to-transparent">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-brand-500/10 border border-brand-500/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white m-0">
                {tab === TABS.LOGIN && 'Welcome Back'}
                {tab === TABS.SIGNUP && 'Create Account'}
                {tab === TABS.FORGOT && 'Reset Password'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {tab === TABS.LOGIN && 'Sign in to access your documents'}
                {tab === TABS.SIGNUP && 'Join DocuMind AI for free'}
                {tab === TABS.FORGOT && "We'll send a reset link to your email"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Tab bar ─────────────────────────────────────── */}
        {tab !== TABS.FORGOT && (
          <div className="flex border-b border-slate-800/80">
            {[TABS.LOGIN, TABS.SIGNUP].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                  tab === t
                    ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t === TABS.LOGIN ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>
        )}

        {/* ── Form ────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Success message */}
          {success && (
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs px-4 py-3 rounded-xl">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Global error */}
          {globalError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-4 py-3 rounded-xl">
              {globalError}
            </div>
          )}

          {/* Username (Login + Signup) */}
          {tab !== TABS.FORGOT && (
            <InputField
              label="Username"
              icon={User}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              required
              error={fieldErrors.username}
            />
          )}

          {/* Email (Signup + Forgot) */}
          {(tab === TABS.SIGNUP || tab === TABS.FORGOT) && (
            <InputField
              label="Email Address"
              icon={Mail}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              required
              error={fieldErrors.email}
            />
          )}

          {/* Password (Login + Signup) */}
          {tab !== TABS.FORGOT && (
            <InputField
              label="Password"
              icon={Lock}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              error={fieldErrors.password}
            />
          )}

          {/* Confirm Password (Signup only) */}
          {tab === TABS.SIGNUP && (
            <InputField
              label="Confirm Password"
              icon={ShieldCheck}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              error={fieldErrors.confirmPassword}
            />
          )}

          {/* Forgot Password link (Login only) */}
          {tab === TABS.LOGIN && (
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => setTab(TABS.FORGOT)}
                className="text-xs text-brand-400 hover:text-brand-300 hover:underline transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit Button */}
          {!success && (
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:from-brand-800 disabled:to-indigo-800 disabled:opacity-60 text-white rounded-xl shadow-lg shadow-brand-900/20 font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {tab === TABS.LOGIN && 'Sign In'}
                  {tab === TABS.SIGNUP && 'Create Account'}
                  {tab === TABS.FORGOT && 'Send Reset Link'}
                </>
              )}
            </button>
          )}

          {/* Back to login from Forgot */}
          {tab === TABS.FORGOT && (
            <button
              type="button"
              onClick={() => setTab(TABS.LOGIN)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </button>
          )}

          {/* Bottom divider + toggle */}
          {tab !== TABS.FORGOT && (
            <p className="text-center text-xs text-slate-500 pt-2">
              {tab === TABS.LOGIN ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button type="button" onClick={() => setTab(TABS.SIGNUP)} className="text-brand-400 hover:underline font-medium">
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setTab(TABS.LOGIN)} className="text-brand-400 hover:underline font-medium">
                    Sign In
                  </button>
                </>
              )}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
