import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/react';
import { HeartHandshake, ShieldCheck, Crown, Building2, UserCheck, Sparkles } from 'lucide-react';
import { LiquidBackground } from '../components/LiquidBackground';

export const ClerkAuthView: React.FC = () => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
      {/* Background Atmosphere */}
      <LiquidBackground />

      <div className="relative z-10 w-full max-w-md my-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-600/25 ring-4 ring-white/80">
            <HeartHandshake className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ڕێکخراوی خێرخوازی بۆتان بامۆکی
            </h1>
            <p className="text-xs font-bold text-cyan-800 mt-1">
              سیستەمی یەکگرتووی بەڕێوەبردنی بەخشین و هاوکارییە مرۆییەکان
            </p>
          </div>

          {/* Quick Info Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-800 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
            <span>چوونەژوورەوەی خێرا بە گووگڵ (Gmail) • بەبێ داواکردنی ژمارەی مۆبایل</span>
          </div>
        </div>

        {/* 3 System Roles Guide Banner */}
        <div className="mb-5 p-3.5 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-sm space-y-2">
          <p className="text-[11px] font-black text-slate-700 text-end">ڕۆڵەکانی بەکارهێنەر لە سیستەمدا:</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            
            {/* Developer */}
            <div className="p-2 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-900 space-y-0.5">
              <Crown className="w-4 h-4 mx-auto text-purple-600" />
              <p className="text-[11px] font-black leading-tight">پەرەپێدەر</p>
              <p className="text-[9px] text-purple-600">Developer</p>
            </div>

            {/* Head of Organization */}
            <div className="p-2 rounded-2xl bg-cyan-50/80 border border-cyan-200 text-cyan-900 space-y-0.5">
              <Building2 className="w-4 h-4 mx-auto text-cyan-600" />
              <p className="text-[11px] font-black leading-tight">سەرۆکی ڕێکخراو</p>
              <p className="text-[9px] text-cyan-600">Head of Org</p>
            </div>

            {/* User */}
            <div className="p-2 rounded-2xl bg-slate-100/80 border border-slate-200 text-slate-800 space-y-0.5">
              <UserCheck className="w-4 h-4 mx-auto text-slate-600" />
              <p className="text-[11px] font-black leading-tight">بەکارهێنەر</p>
              <p className="text-[9px] text-slate-500">User</p>
            </div>

          </div>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-200/80 backdrop-blur-md mb-4">
          <button
            onClick={() => setAuthMode('signin')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              authMode === 'signin'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            چوونەژوورەوە (Sign In)
          </button>
          <button
            onClick={() => setAuthMode('signup')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
              authMode === 'signup'
                ? 'bg-white text-slate-900 shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تۆمارکردنی هەژمار (Sign Up)
          </button>
        </div>

        {/* Clerk Auth Card */}
        <div className="w-full flex justify-center">
          {authMode === 'signin' ? (
            <SignIn
              routing="hash"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'w-full bg-white/95 backdrop-blur-2xl shadow-xl border border-slate-200/80 rounded-3xl p-6 sm:p-7',
                  headerTitle: 'text-lg font-black text-slate-900 text-center',
                  headerSubtitle: 'text-xs text-slate-500 text-center',
                  socialButtonsBlockButton: 'rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-bold py-3 transition-all',
                  socialButtonsBlockButtonText: 'font-bold text-xs',
                  formButtonPrimary: 'rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-xs font-bold py-3 shadow-md shadow-cyan-600/20',
                  formFieldInput: 'rounded-xl border border-slate-200 text-xs py-2.5',
                  formFieldLabel: 'text-xs font-bold text-slate-700',
                  footerAction: 'text-xs text-slate-500',
                  footerActionLink: 'text-cyan-600 font-bold hover:underline'
                }
              }}
            />
          ) : (
            <SignUp
              routing="hash"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'w-full bg-white/95 backdrop-blur-2xl shadow-xl border border-slate-200/80 rounded-3xl p-6 sm:p-7',
                  headerTitle: 'text-lg font-black text-slate-900 text-center',
                  headerSubtitle: 'text-xs text-slate-500 text-center',
                  socialButtonsBlockButton: 'rounded-2xl border border-slate-200 hover:bg-slate-50 text-xs font-bold py-3 transition-all',
                  socialButtonsBlockButtonText: 'font-bold text-xs',
                  formButtonPrimary: 'rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-xs font-bold py-3 shadow-md shadow-cyan-600/20',
                  formFieldInput: 'rounded-xl border border-slate-200 text-xs py-2.5',
                  formFieldLabel: 'text-xs font-bold text-slate-700',
                  footerAction: 'text-xs text-slate-500',
                  footerActionLink: 'text-cyan-600 font-bold hover:underline'
                }
              }}
            />
          )}
        </div>

        {/* Security Footer */}
        <div className="text-center mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>سیستەمێکی پارێزراو بە ستانداردی جیهانی Clerk & Supabase</span>
        </div>

      </div>
    </div>
  );
};
