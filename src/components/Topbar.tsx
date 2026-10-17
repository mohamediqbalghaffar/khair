import React, { useState, useRef, useEffect } from 'react';
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
  Lock
} from 'lucide-react';
import { UserRole } from '../types';
import { useFeedback } from './ui/FeedbackProvider';

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
    syncLocalDataToCloud
  } = useApp();

  const { showToast } = useFeedback();
  const { user, isLoaded, isSignedIn } = useUser();

  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || '';
  const isDeveloperAccount =
    userEmail.includes('moham.iqbal99') ||
    userEmail.includes('mohammed.iqbal') ||
    userEmail.includes('developer');

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

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifTab, setNotifTab] = useState<'notifications' | 'announcements' | 'reminders'>('notifications');

  // New Announcement Form State
  const [showAddAnn, setShowAddAnn] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTag, setAnnTag] = useState<'مەیدانی' | 'کۆبوونەوە' | 'پڕۆژەکان' | 'بەپەلە'>('مەیدانی');

  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingRemindersCount = reminders.filter(r => !r.completed).length;

  // Close notifications menu on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showNotifMenu) {
        setShowNotifMenu(false);
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
  }, [showNotifMenu, setIsLocked]);

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

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-white/85 border-b border-slate-200/90 shadow-sm transition-all duration-300 no-print">
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Logo & Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative group shrink-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] shadow-sm transition-transform duration-300 group-hover:scale-105">
              <div className="w-full h-full rounded-[14.5px] bg-white flex items-center justify-center overflow-hidden">
                <HeartHandshake className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
            <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" title="سیستەم ئۆنلاینە" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5 truncate">
                <span>ڕێکخراوی بۆتان بامۆکی</span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200 shrink-0">
                  خێرخوازی
                </span>
              </h1>
              {isCloudConnected ? (
                <div className="hidden sm:inline-flex items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[11px] font-bold"
                    title="داتابەیسی هەوری سەرهێڵ (Supabase) پەیوەستە و چاودێری دەکرێت"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isCloudSyncing ? 'bg-cyan-400' : 'bg-emerald-400'} opacity-75`}></span>
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isCloudSyncing ? 'bg-cyan-500' : 'bg-emerald-500'}`}></span>
                    </span>
                    <Database className="w-3 h-3 text-emerald-600" />
                    <span>{isCloudSyncing ? 'هاوکاتکردن...' : 'داتابەیسی سەرهێڵ'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncClick}
                    disabled={isCloudSyncing}
                    aria-label="هاوکاتکردنی داتاکان لەگەڵ هەور"
                    className="p-1 text-slate-400 hover:text-cyan-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="هاوکاتکردنی داتاکان لەگەڵ هەور (Force Sync)"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin text-cyan-600' : ''}`} />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:inline-flex items-center gap-1.5">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold"
                    title="داتابەیس ناپەیوەستە - داخڵکردن بەربەستکراوە تا ئینتەرنێت دەگەڕێتەوە"
                  >
                    <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>داتابەیس ناپەیوەستە</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleSyncClick}
                    disabled={isCloudSyncing}
                    aria-label="پشکنینەوەی پەیوەندی"
                    className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                    title="پشکنینەوەی پەیوەندی"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 hidden sm:block truncate">سیستەمی بەڕێوەبردنی داتابەیس و دابەشکردنی کۆمەک</p>
          </div>
        </div>

        {/* Search Bar Pill (Spotlight trigger) */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <button
            type="button"
            onClick={() => setIsSpotlightOpen(true)}
            aria-label="گەڕانی خێرا و فەرمانەکان (Ctrl + K)"
            className="w-full flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 text-slate-500 text-xs sm:text-sm hover:text-slate-800 transition-all duration-200 group shadow-sm"
          >
            <div className="flex items-center gap-2.5 truncate">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors shrink-0" />
              <span className="truncate">گەڕانی خێرا لە سوودمەند، بەخشەر، پسوولە...</span>
            </div>
            <kbd className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-white text-slate-600 border border-slate-200 shadow-sm shrink-0 font-mono">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Actions & Role Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setIsSpotlightOpen(true)}
            aria-label="گەڕانی خێرا"
            className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
            title="گەڕانی خێرا (Ctrl+K)"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Currency Toggle (IQD / USD) */}
          <div role="group" aria-label="هەڵبژاردنی دراوی پیشاندان" className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
            <button
              type="button"
              onClick={() => setCurrencyView('IQD')}
              aria-pressed={currencyView === 'IQD'}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                currencyView === 'IQD'
                  ? 'bg-white text-cyan-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              دینار
            </button>
            <button
              type="button"
              onClick={() => setCurrencyView('USD')}
              aria-pressed={currencyView === 'USD'}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                currencyView === 'USD'
                  ? 'bg-white text-cyan-700 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              USD $
            </button>
          </div>

          {/* 1-Click Quick Screen Lock Button */}
          <button
            type="button"
            onClick={() => setIsLocked(true)}
            aria-label="قوفڵکردنی خێرای شاشە (Ctrl + L)"
            title="قوفڵکردنی خێرای شاشە (Ctrl + L)"
            className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-200 text-slate-600 hover:text-cyan-700 transition-colors shadow-sm"
          >
            <Lock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Notification & Communication Hub */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              aria-label="ئاگاداری و ڕاگەیاندراوەکان"
              aria-expanded={showNotifMenu}
              className="relative p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
              title="ئاگاداری و ڕاگەیاندراوەکان"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {(unreadCount > 0 || pendingRemindersCount > 0) && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount + pendingRemindersCount}
                </span>
              )}
            </button>

            {/* Multi-Tab Communication Hub Dropdown */}
            {showNotifMenu && (
              <div
                role="dialog"
                aria-label="ناوەندی ئاگاداری و ڕاگەیاندراوەکان"
                className="absolute left-0 mt-3 w-80 sm:w-96 rounded-3xl liquid-glass-dropdown p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200"
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
                              <span className="text-[11px] text-slate-400 mt-1 block">{n.timestamp}</span>
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
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                              {a.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed">{a.content}</p>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
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

          {/* Clerk Authentication Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 me-1">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold transition-all shadow-sm shadow-cyan-600/20">
                  <LogIn className="w-3.5 h-3.5" />
                  <span>چوونەژوورەوە</span>
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition-all">
                  <span>خۆتۆمارکردن</span>
                </button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <div className="flex items-center gap-2">
                {/* Role Badge */}
                <div className="hidden sm:block">
                  {isDeveloperAccount ? (
                    <div
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border text-xs font-black shadow-sm bg-purple-50 border-purple-200 text-purple-900 select-none"
                      title="پەرەپێدەری سیستەم (دەسەڵاتی هەمیشەیی و نەگۆڕ)"
                    >
                      <span className="text-sm">👑</span>
                      <span>پەرەپێدەری سیستەم</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold shadow-sm select-none">
                      <span>{currentRole === 'head_of_organization' ? '🏛️ سەرۆکی ڕێکخراو' : '👤 بەکارهێنەر'}</span>
                    </div>
                  )}
                </div>

                {/* Profile and UserButton */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-2xl shadow-sm">
                  <div className="hidden lg:block text-end">
                    <p className="text-xs font-bold text-slate-900 leading-tight">
                      {user?.fullName || user?.firstName || 'محمد ئیقبال'}
                    </p>
                    <p className="text-[11px] text-cyan-700 font-bold truncate max-w-[130px]">
                      {user?.primaryEmailAddress?.emailAddress || 'Gmail'}
                    </p>
                  </div>
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: 'w-7 h-7 sm:w-8 sm:h-8 rounded-xl ring-2 ring-cyan-500/30 shadow-sm'
                      }
                    }}
                  />
                </div>
              </div>
            </Show>
          </div>

        </div>

      </div>
    </header>
  );
};
