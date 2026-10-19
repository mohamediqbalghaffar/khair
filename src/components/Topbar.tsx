import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Show, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/react';
import {
  Bell,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  ShieldCheck,
  Plus,
  Check,
  Database,
  LogIn,
  Lock,
  Eye,
  SlidersHorizontal,
  Printer,
  Users,
  Gift,
  PackageSearch,
  Megaphone,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Layers,
  Activity
} from 'lucide-react';
import { UserRole } from '../types';
import { useFeedback } from './ui/FeedbackProvider';
import { AccessibilityModal } from './AccessibilityModal';
import { getExchangeRateForDate } from '../utils/exchangeRates';

const SYSTEM_ROLES: { role: UserRole; titleKurdish: string; english: string; desc: string; icon: string }[] = [
  {
    role: 'developer',
    titleKurdish: 'پەرەپێدەری سیستەم',
    english: 'Developer',
    desc: 'مۆڵەتی تەواوی پەرەپێدان و بەڕێوەبردنی تەکنیکی',
    icon: '👑'
  },
  {
    role: 'head_of_organization',
    titleKurdish: 'سەرۆکی ڕێکخراو',
    english: 'Head of Organization',
    desc: 'سەرپەرشتیاری گشتی کارگێڕی، سوودمەندان و دارایی',
    icon: '🏛️'
  },
  {
    role: 'user',
    titleKurdish: 'بەکارهێنەر',
    english: 'User',
    desc: 'ئەندام و تۆمارکەری مەیدانی خێرخوازی',
    icon: '👤'
  }
];

export const Topbar: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    setCurrentUser,
    currencyView,
    setCurrencyView,
    notifications,
    markNotificationRead,
    announcements,
    addAnnouncement,
    reminders,
    toggleReminder,
    setIsSpotlightOpen,
    setIsLocked,
    isCloudConnected,
    isCloudSyncing,
    syncLocalDataToCloud,
    beneficiaries,
    inventory,
    setActiveTab
  } = useApp();

  const { showToast } = useFeedback();
  const { user, isLoaded, isSignedIn } = useUser();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const [showImpactPopover, setShowImpactPopover] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [notifTab, setNotifTab] = useState<'notifications' | 'announcements' | 'reminders'>('notifications');

  // Announcement Form State
  const [showAddAnn, setShowAddAnn] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTag, setAnnTag] = useState<'مەیدانی' | 'کۆبوونەوە' | 'پڕۆژەکان' | 'بەپەلە'>('مەیدانی');

  const notifRef = useRef<HTMLDivElement>(null);
  const quickMenuRef = useRef<HTMLDivElement>(null);
  const impactRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingRemindersCount = reminders.filter(r => !r.completed).length;

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
  const isDeveloperAccount =
    userEmail.includes('moham.iqbal99') ||
    userEmail.includes('mohammed.iqbal') ||
    userEmail.includes('developer');

  // Exchange rate for today
  const todayRate = useMemo(() => {
    try {
      return getExchangeRateForDate().rate || 1530;
    } catch {
      return 1530;
    }
  }, []);

  // Sync authenticated Clerk user profile with AppContext
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const activeRole: UserRole = isDeveloperAccount ? 'developer' : (currentRole || 'user');
      const roleConfig = SYSTEM_ROLES.find(r => r.role === activeRole) || SYSTEM_ROLES[0];

      setCurrentRole(activeRole);
      setCurrentUser({
        id: user.id,
        name: user.fullName || user.firstName || 'محمد ئیقبال',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl,
        role: activeRole,
        roleTitleKurdish: roleConfig.titleKurdish,
        status: 'active',
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString()
      });
    }
  }, [isLoaded, isSignedIn, user, isDeveloperAccount, currentRole, setCurrentRole, setCurrentUser]);

  // Outside click & keyboard Escape listeners
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (quickMenuRef.current && !quickMenuRef.current.contains(event.target as Node)) {
        setShowQuickMenu(false);
      }
      if (impactRef.current && !impactRef.current.contains(event.target as Node)) {
        setShowImpactPopover(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifMenu(false);
        setShowQuickMenu(false);
        setShowImpactPopover(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setIsLocked(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setIsLocked]);

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    addAnnouncement(annTitle, annContent, annTag);
    setAnnTitle('');
    setAnnContent('');
    setShowAddAnn(false);
    showToast('ڕاگەیاندراوەکە لە تابلۆی گشتی بڵاوکرایەوە.', 'success');
  };

  const handleSyncClick = async () => {
    const res = await syncLocalDataToCloud();
    showToast(res.message, res.success ? 'success' : 'warning');
  };

  // Quick navigation helpers
  const handleQuickAction = (tab: 'beneficiaries' | 'donors' | 'inventory' | 'dashboard', extraAction?: () => void) => {
    setShowQuickMenu(false);
    setActiveTab(tab);
    if (extraAction) extraAction();
  };

  return (
    <>
      <header
        role="banner"
        aria-label="سەردێڕی سەرەکی سیستەم"
        className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-2xl border-b border-slate-200/70 shadow-[0_4px_24px_-6px_rgba(15,23,42,0.04)] transition-all duration-300 no-print select-none"
      >
        <div className="max-w-[1536px] mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2.5 sm:gap-4">
          
          {/* ============================================================== */}
          {/* 1. BRAND IDENTITY & CLOUD STATUS (Right Side in RTL)           */}
          {/* ============================================================== */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            {/* Logo Mark: Clean Monochromatic 10px Radius Container (rule.md 2.2 & 4.2) */}
            <div className="relative group shrink-0">
              <div className="w-10 h-10 rounded-[10px] bg-cyan-600 hover:bg-cyan-700 text-white flex items-center justify-center shadow-xs transition-colors">
                <HeartHandshake className="w-5 h-5" strokeWidth={2} />
              </div>
              {/* Online Pulse Dot */}
              <span
                className={`absolute -bottom-0.5 -start-0.5 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                  isCloudConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                title={isCloudConnected ? 'پەیوەستکراوە بە داتابەیسی هەور' : 'پەیوەندی نییە'}
              />
            </div>

            {/* Single-Row Title + Cloud Sync Status Pill */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 truncate">
                  ڕێکخراوی بۆتان بامۆکی
                </h1>

                {/* Cloud Sync State Pill */}
                {isCloudConnected ? (
                  <div className="hidden md:inline-flex items-center gap-1 shrink-0">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-[11px] font-bold"
                      title="داتابەیسی سەرهێڵ (Supabase) پەیوەستە و چاودێری دەکرێت"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <Database className="w-3 h-3 text-emerald-600" />
                      <span>{isCloudSyncing ? 'هاوکاتکردن...' : 'داتابەیسی سەرهێڵ'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleSyncClick}
                      disabled={isCloudSyncing}
                      aria-label="هاوکاتکردنی داتاکان لەگەڵ هەور"
                      title="هاوکاتکردنی خێرا لەگەڵ هەور (Force Cloud Sync)"
                      className="p-1 text-slate-400 hover:text-cyan-600 rounded-[8px] hover:bg-slate-100 transition-colors"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin text-cyan-600' : ''}`} />
                    </button>
                  </div>
                ) : (
                  <div className="hidden md:inline-flex items-center gap-1 shrink-0">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[8px] bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold"
                      title="داتابەیس ناپەیوەستە"
                    >
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      <span>ناپەیوەست</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleSyncClick}
                      disabled={isCloudSyncing}
                      aria-label="پشکنینەوەی پەیوەندی"
                      title="پشکنینەوەی پەیوەندی"
                      className="p-1 text-rose-500 hover:text-rose-700 rounded-[8px] hover:bg-rose-50 transition-colors"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block truncate leading-tight mt-0.5">
                سیستەمی بەڕێوەبردنی کاروباری خێرخوازی و مرۆیی
              </p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 2. LIVE HUMANITARIAN PULSE GAUGE (Plugin: charity-data-viz)     */}
          {/* ============================================================== */}
          <div className="relative hidden xl:block shrink-0" ref={impactRef}>
            <button
              type="button"
              onClick={() => setShowImpactPopover(!showImpactPopover)}
              aria-expanded={showImpactPopover}
              aria-label="کورتەی خێرای داتای مرۆیی"
              className="h-10 flex items-center gap-2 px-3 rounded-[10px] bg-slate-50/90 hover:bg-cyan-50/80 border border-slate-200/80 hover:border-cyan-300 text-slate-700 text-xs font-bold transition-all group"
              title="کورتەی ئاماری ڕاستەوخۆ (Live Impact)"
            >
              <div className="w-6 h-6 rounded-[6px] bg-cyan-100/80 flex items-center justify-center text-cyan-700">
                <Activity className="w-3.5 h-3.5 text-cyan-600" />
              </div>
              <span className="font-mono text-cyan-900 font-black">
                {beneficiaries.length.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-500">خێزانی سوودمەند</span>
              <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-cyan-600 transition-colors" />
            </button>

            {/* Mini Impact Popover */}
            {showImpactPopover && (
              <div
                role="dialog"
                aria-label="ئاماری مرۆیی و کۆگا"
                className="absolute start-0 mt-2.5 w-64 rounded-2xl bg-white border border-slate-200 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-600" />
                    ئاماری چالاکی مەیدانی
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-[6px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ڕاستەوخۆ
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-[10px] bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">کۆی خێزانە تۆمارکراوەکان:</span>
                    <span className="font-mono font-black text-slate-900">{beneficiaries.length}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-[10px] bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">کەرەستە و بەشەخۆراک لە کۆگا:</span>
                    <span className="font-mono font-black text-cyan-800">{inventory.length} پۆل</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-[10px] bg-slate-50 border border-slate-100">
                    <span className="text-slate-600">نرخی رۆژی دۆلار (IQD):</span>
                    <span className="font-mono font-black text-amber-800">{todayRate.toLocaleString()} د.ع</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowImpactPopover(false);
                    setActiveTab('dashboard');
                  }}
                  className="mt-3 w-full h-9 rounded-[10px] bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold text-center transition-colors"
                >
                  بینینی داشبۆردی گشتی ئامارەکان
                </button>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* 3. SPOTLIGHT SEARCH PILL (Plugin: smart-forms-ux-wizard)       */}
          {/* ============================================================== */}
          <div className="flex-1 max-w-sm md:max-w-md mx-1 sm:mx-2 hidden sm:block">
            <button
              type="button"
              onClick={() => setIsSpotlightOpen(true)}
              aria-label="گەڕانی خێرا و فەرمانەکان (Ctrl + K)"
              className="w-full h-10 flex items-center justify-between px-3.5 rounded-[10px] bg-slate-50/90 hover:bg-white border border-slate-200/80 hover:border-cyan-400 text-slate-500 text-xs hover:text-slate-800 transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            >
              <div className="flex items-center gap-2.5 truncate">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors shrink-0" />
                <span className="truncate font-medium">گەڕانی خێرا لە سوودمەند، بەخشەر، پسوولە...</span>
              </div>
              <kbd className="px-2 py-0.5 text-[11px] font-bold rounded-[6px] bg-white group-hover:bg-cyan-50 text-slate-600 group-hover:text-cyan-800 border border-slate-200/90 shrink-0 font-mono transition-colors">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* ============================================================== */}
          {/* 4. ACTION TOOLBAR & USER CONTROLS (Left Side in RTL)           */}
          {/* ============================================================== */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Mobile Search Icon Trigger */}
            <button
              type="button"
              onClick={() => setIsSpotlightOpen(true)}
              aria-label="گەڕانی خێرا"
              title="گەڕانی خێرا (Ctrl+K)"
              className="sm:hidden w-10 h-10 flex items-center justify-center rounded-[10px] bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200/80"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Quick Action (+) Dropdown Menu (smart-forms-ux-wizard) */}
            <div className="relative" ref={quickMenuRef}>
              <button
                type="button"
                onClick={() => setShowQuickMenu(!showQuickMenu)}
                aria-expanded={showQuickMenu}
                aria-label="کردارە خێراکان"
                title="کردارە خێراکان (Quick Create)"
                className="h-10 flex items-center gap-1.5 px-3 rounded-[10px] bg-cyan-600 hover:bg-cyan-700 active:scale-[0.98] text-white text-xs font-bold shadow-xs transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">کرداری خێرا</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showQuickMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Quick Actions Flyout */}
              {showQuickMenu && (
                <div
                  role="menu"
                  aria-label="لیستی کردارە خێراکان"
                  className="absolute start-0 mt-2.5 w-60 rounded-2xl bg-white border border-slate-200 p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100"
                >
                  <div className="pb-1.5 px-2 text-xs font-bold text-slate-400">
                    تۆمارکردنی خێرا لە سیستەم:
                  </div>

                  <div className="py-1 space-y-0.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleQuickAction('beneficiaries')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-bold text-slate-800 hover:bg-cyan-50 hover:text-cyan-900 transition-colors text-start"
                    >
                      <div className="w-7 h-7 rounded-[8px] bg-cyan-100 flex items-center justify-center text-cyan-700">
                        <Users className="w-4 h-4" />
                      </div>
                      <span>تۆمارکردنی سوودمەندی نوێ</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleQuickAction('donors')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-bold text-slate-800 hover:bg-amber-50 hover:text-amber-900 transition-colors text-start"
                    >
                      <div className="w-7 h-7 rounded-[8px] bg-amber-100 flex items-center justify-center text-amber-700">
                        <Gift className="w-4 h-4" />
                      </div>
                      <span>تۆمارکردنی بەخشینی نوێ</span>
                    </button>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => handleQuickAction('inventory')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors text-start"
                    >
                      <div className="w-7 h-7 rounded-[8px] bg-emerald-100 flex items-center justify-center text-emerald-700">
                        <PackageSearch className="w-4 h-4" />
                      </div>
                      <span>دابەشکردنی کۆگا و کۆمەک</span>
                    </button>
                  </div>

                  <div className="pt-1.5 space-y-0.5">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowQuickMenu(false);
                        setShowNotifMenu(true);
                        setNotifTab('announcements');
                        setShowAddAnn(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-xs font-bold text-slate-800 hover:bg-indigo-50 hover:text-indigo-900 transition-colors text-start"
                    >
                      <div className="w-7 h-7 rounded-[8px] bg-indigo-100 flex items-center justify-center text-indigo-700">
                        <Megaphone className="w-4 h-4" />
                      </div>
                      <span>نووسینی ڕاگەیاندراوی نوێ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Dual-Currency Segmented Control (charity-data-viz & kurdish-rtl-ui) */}
            <div
              role="group"
              aria-label="هەڵبژاردنی دراوی پیشاندان"
              className="h-10 flex items-center p-1 rounded-[10px] bg-slate-100 border border-slate-200/80"
              title={`نرخی دۆلار: 1$ = ${todayRate.toLocaleString()} د.ع`}
            >
              <button
                type="button"
                onClick={() => setCurrencyView('IQD')}
                aria-pressed={currencyView === 'IQD'}
                className={`h-8 px-2.5 text-xs font-bold rounded-[8px] transition-all ${
                  currencyView === 'IQD'
                    ? 'bg-white text-cyan-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                دینار
              </button>
              <button
                type="button"
                onClick={() => setCurrencyView('USD')}
                aria-pressed={currencyView === 'USD'}
                className={`h-8 px-2.5 text-xs font-bold rounded-[8px] transition-all font-mono ${
                  currencyView === 'USD'
                    ? 'bg-white text-cyan-800 shadow-xs border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                USD $
              </button>
            </div>

            {/* Accessibility Quick Settings Button (a11y-keyboard-auditor) */}
            <button
              type="button"
              onClick={() => setIsAccessModalOpen(true)}
              aria-label="ڕێکخستنەکانی دەستگەیشتن و بینین (Accessibility)"
              title="ڕێکخستنەکانی دەستگەیشتن و بینین (فۆنت و کۆنتراست)"
              className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-slate-50/90 hover:bg-cyan-50 border border-slate-200/80 hover:border-cyan-300 text-slate-600 hover:text-cyan-700 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Screen Lock Button */}
            <button
              type="button"
              onClick={() => setIsLocked(true)}
              aria-label="قوفڵکردنی خێرای شاشە (Ctrl + L)"
              title="قوفڵکردنی خێرای شاشە (Ctrl + L)"
              className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-slate-50/90 hover:bg-cyan-50 border border-slate-200/80 hover:border-cyan-300 text-slate-600 hover:text-cyan-700 transition-colors"
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Notification & Communication Hub */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                aria-label="ئاگاداری و ڕاگەیاندراوەکان"
                aria-expanded={showNotifMenu}
                className="relative w-10 h-10 flex items-center justify-center rounded-[10px] bg-slate-50/90 hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors"
                title="ئاگاداری و ڕاگەیاندراوەکان"
              >
                <Bell className="w-4 h-4" />
                {(unreadCount > 0 || pendingRemindersCount > 0) && (
                  <span className="absolute -top-1 -end-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs font-mono">
                    {unreadCount + pendingRemindersCount}
                  </span>
                )}
              </button>

              {/* Multi-Tab Communication Hub Dropdown */}
              {showNotifMenu && (
                <div
                  role="dialog"
                  aria-label="ناوەندی ئاگاداری و ڕاگەیاندراوەکان"
                  className="absolute start-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white border border-slate-200 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Tabs Header */}
                  <div className="flex items-center gap-1 pb-3 border-b border-slate-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setNotifTab('notifications')}
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all text-center ${
                        notifTab === 'notifications'
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ئاگاداری ({notifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifTab('announcements')}
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all text-center ${
                        notifTab === 'announcements'
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      ڕاگەیاندراو ({announcements.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotifTab('reminders')}
                      className={`flex-1 py-1.5 px-2 rounded-xl font-bold transition-all text-center ${
                        notifTab === 'reminders'
                          ? 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      بیرخەرەوە ({pendingRemindersCount})
                    </button>
                  </div>

                  {/* TAB 1: System Notifications */}
                  {notifTab === 'notifications' && (
                    <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pe-1">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-sm text-slate-500">هیچ ئاگادارییەک نییە</p>
                      ) : (
                        notifications.map(n => (
                          <button
                            type="button"
                            key={n.id}
                            onClick={() => markNotificationRead(n.id)}
                            className={`w-full text-start p-3 rounded-2xl border transition-all cursor-pointer ${
                              n.read
                                ? 'bg-slate-50 border-slate-200 opacity-80'
                                : 'bg-cyan-50/70 border-cyan-200 hover:bg-cyan-50'
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              {n.type === 'inventory' ? (
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              ) : n.type === 'duplicate' ? (
                                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900">{n.title}</p>
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                                <span className="text-[11px] text-slate-400 mt-1 block font-mono">{n.timestamp}</span>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 2: Announcements Board */}
                  {notifTab === 'announcements' && (
                    <div className="mt-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">تابلۆی گشتی ڕاگەیاندراوە ناوخۆییەکان</span>
                        <button
                          type="button"
                          onClick={() => setShowAddAnn(!showAddAnn)}
                          className="text-[11px] text-cyan-700 hover:text-cyan-800 font-bold flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> {showAddAnn ? 'داخستنی فۆڕم' : 'نووسینی نوێ'}
                        </button>
                      </div>

                      {showAddAnn && (
                        <form onSubmit={handlePostAnnouncement} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                          <input
                            type="text"
                            placeholder="ناونیشانی ڕاگەیاندراو..."
                            value={annTitle}
                            onChange={(e) => setAnnTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl liquid-input text-slate-900"
                            required
                          />
                          <textarea
                            placeholder="دەقی ڕاگەیاندراو..."
                            rows={2}
                            value={annContent}
                            onChange={(e) => setAnnContent(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-xl liquid-input text-slate-900"
                            required
                          />
                          <div className="flex items-center justify-between gap-2">
                            <select
                              value={annTag}
                              onChange={(e) => setAnnTag(e.target.value as any)}
                              className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-white"
                            >
                              <option value="مەیدانی">مەیدانی</option>
                              <option value="کۆبوونەوە">کۆبوونەوە</option>
                              <option value="پڕۆژەکان">پڕۆژەکان</option>
                              <option value="بەپەلە">بەپەلە</option>
                            </select>
                            <button
                              type="submit"
                              className="px-3 py-1 rounded-lg bg-cyan-600 text-white text-xs font-bold shadow-sm"
                            >
                              بڵاوکردنەوە
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="space-y-2 max-h-60 overflow-y-auto pe-1">
                        {announcements.map(a => (
                          <div key={a.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-end space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{a.title}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                                {a.tag}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{a.content}</p>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 font-mono">
                              <span>{a.author}</span>
                              <span>{a.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Automated Reminders */}
                  {notifTab === 'reminders' && (
                    <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pe-1">
                      <p className="text-[11px] text-slate-500 mb-2">بیرخەرەوەی کاتەکانی دابەشکردن، کۆگا و بەدواداچوونی خێزانەکان</p>
                      {reminders.map(r => (
                        <button
                          type="button"
                          key={r.id}
                          onClick={() => toggleReminder(r.id)}
                          className={`w-full text-start p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                            r.completed ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-amber-50/70 border-amber-200 hover:bg-amber-50'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md border mt-0.5 flex items-center justify-center shrink-0 ${
                            r.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-400'
                          }`}>
                            {r.completed && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-xs font-bold ${r.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                {r.title}
                              </p>
                              <span className="text-[11px] font-mono text-amber-800 font-bold">{r.dueDate}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">{r.details}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Clerk Authentication Controls & Profile */}
            <div className="flex items-center gap-1.5 sm:gap-2 ms-0.5 sm:ms-1">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="h-10 flex items-center gap-1.5 px-3.5 rounded-[10px] bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-xs">
                    <LogIn className="w-3.5 h-3.5" />
                    <span>چوونەژوورەوە</span>
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="hidden sm:flex h-10 items-center gap-1.5 px-3.5 rounded-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition-all">
                    <span>خۆتۆمارکردن</span>
                  </button>
                </SignUpButton>
              </Show>

              <Show when="signed-in">
                {/* Unified User Profile & Role Capsule (rule.md 4.2 & 5.2: No emoji clutter, uniform 10px radius) */}
                <div className="h-10 flex items-center gap-2.5 bg-slate-50/90 hover:bg-white border border-slate-200/80 ps-3 pe-1.5 rounded-[10px] transition-all min-w-0">
                  <div className="hidden lg:flex flex-col items-end justify-center min-w-0 max-w-[165px] text-end leading-tight select-none">
                    <div className="flex items-center gap-1.5 w-full justify-end min-w-0">
                      <span
                        className="text-xs font-black text-slate-900 truncate tracking-tight"
                        title={user?.fullName || user?.firstName || 'محمد ئیقبال'}
                      >
                        {user?.fullName || user?.firstName || 'محمد ئیقبال'}
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[6px] text-[10px] font-bold shrink-0 ${
                          isDeveloperAccount
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/70'
                            : 'bg-cyan-50 text-cyan-800 border border-cyan-200/70'
                        }`}
                        title={
                          isDeveloperAccount
                            ? 'پەرەپێدەری سیستەم (دەسەڵاتی تەواو)'
                            : currentRole === 'head_of_organization'
                            ? 'سەرۆکی ڕێکخراو'
                            : 'بەکارهێنەری فەرمی'
                        }
                      >
                        <ShieldCheck className="w-2.5 h-2.5" strokeWidth={2.5} />
                        <span>
                          {isDeveloperAccount
                            ? 'پەرەپێدەر'
                            : currentRole === 'head_of_organization'
                            ? 'بەڕێوەبەر'
                            : 'ئەندام'}
                        </span>
                      </span>
                    </div>
                    <span
                      className="text-[11px] text-slate-500 font-semibold font-mono truncate w-full text-end mt-0.5"
                      dir="ltr"
                      title={user?.primaryEmailAddress?.emailAddress || ''}
                    >
                      {user?.primaryEmailAddress?.emailAddress || 'بەکارھێنەر'}
                    </span>
                  </div>
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: 'w-7 h-7 rounded-[8px] ring-1 ring-slate-200'
                      }
                    }}
                  />
                </div>
              </Show>
            </div>

          </div>

        </div>
      </header>

      {/* Quick Accessibility Modal Mount */}
      <AccessibilityModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
      />
    </>
  );
};
