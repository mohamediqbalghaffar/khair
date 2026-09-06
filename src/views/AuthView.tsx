import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  HeartHandshake, 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Phone, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Database, 
  CheckCircle2, 
  AlertCircle,
  Briefcase
} from 'lucide-react';

export const AuthView: React.FC = () => {
  const { login, signup, isCloudConnected } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('mohammed.iqbal@halabjagroup');
  const [loginPassword, setLoginPassword] = useState('Admin@2026');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupRole, setSignupRole] = useState<UserRole>('field_officer');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Status & feedback state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Quick fill Admin credentials
  const fillAdminCredentials = () => {
    setLoginIdentifier('mohammed.iqbal@halabjagroup');
    setLoginPassword('Admin@2026');
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await login(loginIdentifier, loginPassword);
      if (!res.success) {
        setErrorMsg(res.message || 'ئیمەیڵ یان وشەی نهێنی نادروستە!');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'هەڵەیەک ڕوویدا لە کاتی چوونەژوورەوە');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setErrorMsg('تکایە سەرجەم خانە پێویستەکان پڕبکەرەوە.');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMsg('وشەی نهێنی و دووبارەکردنەوەی یەکناگرنەوە!');
      return;
    }

    if (signupPassword.length < 6) {
      setErrorMsg('وشەی نهێنی دەبێت بەلایەنی کەمەوە ٦ پیت یان ژمارە بێت.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup(signupName, signupEmail, signupPassword, signupPhone, signupRole);
      if (res.success) {
        setSuccessMsg(res.message || 'هەژمارەکەت بە سەرکەوتوویی دروستکرا!');
      } else {
        setErrorMsg(res.message || 'نەتوانرا هەژمار دروستبکرێت.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'هەڵەیەک لە تۆمارکردندا ڕوویدا.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950 text-slate-100 select-text">
      {/* Background Animated Blobs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none animate-pulse duration-700" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000" />

      <div className="w-full max-w-lg relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-3xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 shadow-xl shadow-cyan-500/20 ring-4 ring-white/10">
            <HeartHandshake className="w-10 h-10 text-white" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              ڕێکخراوی بۆتان بامۆکی
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                خێرخوازی
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
              سیستەمی پارێزراوی داتابەیسی هەور و بەڕێوەبردنی کۆمەک
            </p>
          </div>

          {/* Cloud Database Connected Status Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Database className="w-3.5 h-3.5" />
            <span>{isCloudConnected ? 'داتابەیسی هەوری خێرا و پارێزراو (Supabase PostgreSQL) چالاکە' : 'دۆخی ئۆفلاینی پارێزراو'}</span>
          </div>
        </div>

        {/* Main Auth Card */}
        <div className="rounded-3xl bg-slate-900/80 backdrop-blur-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6">
          
          {/* Mode Switcher Tabs */}
          <div className="flex p-1.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-sm font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>چوونەژوورەوە (Log In)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>خۆتۆمارکردنی نوێ (Sign Up)</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: LOG IN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Quick Admin Fill Helper Pill */}
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs text-cyan-300">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>هەژماری سەرەکی: <strong>mohammed.iqbal@halabjagroup</strong></span>
                </div>
                <button
                  type="button"
                  onClick={fillAdminCredentials}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 transition-all shrink-0"
                >
                  پڕکردنەوەی خێرا
                </button>
              </div>

              {/* Identifier (Email / Username) */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ئیمەیڵ یان ناوی بەکارهێنەر</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="mohammed.iqbal@halabjagroup"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-right">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>وشەی نهێنی (Password)</span>
                  </label>
                  <span className="text-[11px] text-slate-400">بنەڕەتی: Admin@2026</span>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm transition-all pl-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
                    title={showLoginPassword ? 'شاردنەوە' : 'نیشاندان'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>چوونەژوورەوە بۆ ناو سیستەم</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              
              {/* Full Name */}
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ناوی تەواوی سیانی</span>
                </label>
                <input
                  type="text"
                  required
                  value={signupName}
                  onChange={e => setSignupName(e.target.value)}
                  placeholder="ناوی سیانی بەکارهێنەر"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                />
              </div>

              {/* Email / Username */}
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>ئیمەیڵ یان ناسنامەی چوونەژوورەوە</span>
                </label>
                <input
                  type="text"
                  required
                  value={signupEmail}
                  onChange={e => setSignupEmail(e.target.value)}
                  placeholder="user@halabjagroup.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                />
              </div>

              {/* Phone & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ژمارەی مۆبایل</span>
                  </label>
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={e => setSignupPhone(e.target.value)}
                    placeholder="0750 000 0000"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                  />
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ڕۆڵ لە ڕێکخراودا</span>
                  </label>
                  <select
                    value={signupRole}
                    onChange={e => setSignupRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs"
                  >
                    <option value="field_officer">کارمەندی مەیدانی و دابەشکردن</option>
                    <option value="finance">بەرپرسی دارایی و ژمێریاری</option>
                    <option value="volunteer">خۆبەخش (Volunteer)</option>
                    <option value="auditor">وردبین / چاودێر (Auditor)</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>وشەی نهێنی (بەلایەنی کەمەوە ٦ پیت/ژمارە)</span>
                </label>
                <div className="relative">
                  <input
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    placeholder="وشەی نهێنی نوێ"
                    className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1 text-right">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>دووبارەکردنەوەی وشەی نهێنی</span>
                </label>
                <input
                  type={showSignupPassword ? 'text' : 'password'}
                  required
                  value={signupConfirmPassword}
                  onChange={e => setSignupConfirmPassword(e.target.value)}
                  placeholder="دووبارەکردنەوەی وشەی نهێنی"
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-3 cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    <span>تۆمارکردنی هەژمار لە داتابەیسدا</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Security Advisory Badge */}
        <div className="p-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-1 text-xs text-slate-400">
          <div className="flex items-center justify-center gap-1.5 text-slate-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>ئاسایشی بەرز و پاراستنی زانیارییە نهێنییەکان</span>
          </div>
          <p className="text-[11px] text-slate-500">
            تەواوی وشە نهێنییەکان بە شێوازی SHA-256 پەنهان دەکرێن و بە ڕێسای RLS لە نێو بنکەدراوەی PostgreSQL دەپارێزرێن.
          </p>
        </div>

      </div>
    </div>
  );
};
