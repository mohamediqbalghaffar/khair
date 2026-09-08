import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { 
  Bell, 
  Search, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  HeartHandshake, 
  ShieldCheck, 
  ChevronDown,
  Terminal,
  Lock,
  Languages,
  Radio,
  Calendar,
  Plus,
  Check,
  Sparkles,
  Megaphone,
  User,
  Database,
  LogOut
} from 'lucide-react';
import { DeveloperApiModal } from './DeveloperApiModal';
import { SecurityModal } from './SecurityModal';
import { AccessibilityModal } from './AccessibilityModal';

export const Topbar: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    logout,
    currencyView,
    setCurrencyView,
    notifications,
    markNotificationRead,
    announcements,
    addAnnouncement,
    reminders,
    toggleReminder,
    setIsLocked,
    setIsSpotlightOpen,
    exportDataJSON,
    resetAllData,
    isCloudConnected,
    isCloudSyncing,
    syncLocalDataToCloud,
    checkConnectionHealth
  } = useApp();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [notifTab, setNotifTab] = useState<'notifications' | 'announcements' | 'reminders'>('notifications');

  // Modals state
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);

  // New Announcement Form State
  const [showAddAnn, setShowAddAnn] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annTag, setAnnTag] = useState<'مەیدانی' | 'کۆبوونەوە' | 'پڕۆژەکان' | 'بەپەلە'>('مەیدانی');

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingRemindersCount = reminders.filter(r => !r.completed).length;

  const rolesList: { role: UserRole; title: string; desc: string; icon: string }[] = [
    { role: 'admin', title: 'بەڕێوەبەری گشتی (Admin)', desc: 'دەسەڵاتی تەواوی سیستەم و بەڕێوەبردن', icon: '👑' },
    { role: 'finance', title: 'بەرپرسی دارایی و ژمێریاری', desc: 'تۆماری خەرجی، بەخشین و وردبینی دارایی', icon: '💳' },
    { role: 'field_officer', title: 'کارمەندی مەیدانی و دابەشکردن', desc: 'تۆماری هاوکاری، سوودمەندان و سەردانی مەیدانی', icon: '🚚' },
    { role: 'volunteer', title: 'خۆبەخش (Volunteer)', desc: 'چالاکییەکان و کاتژمێرەکانی خزمەت', icon: '🤝' },
    { role: 'auditor', title: 'وردبین و چاودێری (Auditor)', desc: 'بینینی ڕاپۆرتەکان و چاودێری شاردراوە', icon: '🔍' }
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifMenu(false);
      }
      if (roleRef.current && !roleRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePostAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    addAnnouncement(annTitle, annContent, annTag);
    setAnnTitle('');
    setAnnContent('');
    setShowAddAnn(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-white/85 border-b border-slate-200/90 shadow-sm transition-all duration-300">
        <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[1.5px] shadow-sm transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full rounded-[14.5px] bg-white flex items-center justify-center overflow-hidden">
                  <HeartHandshake className="w-6 h-6 text-cyan-600" />
                </div>
              </div>
              <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" title="سیستەم ئۆنلاینە" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  ڕێکخراوی بۆتان بامۆکی
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
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
                      onClick={async () => {
                        const res = await syncLocalDataToCloud();
                        alert(res.message);
                      }}
                      disabled={isCloudSyncing}
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
                      onClick={async () => {
                        const res = await syncLocalDataToCloud();
                        alert(res.message);
                      }}
                      disabled={isCloudSyncing}
                      className="p-1 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                      title="پشکنینەوەی پەیوەندی"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">سیستەمی بەڕێوەبردنی داتابەیس و دابەشکردنی کۆمەک</p>
            </div>
          </div>

          {/* Search Bar Pill (Spotlight trigger) */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <button
              onClick={() => setIsSpotlightOpen(true)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-100/90 hover:bg-slate-100 border border-slate-200/90 text-slate-500 text-sm hover:text-slate-800 transition-all duration-200 group shadow-sm"
            >
              <div className="flex items-center gap-2.5">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                <span>گەڕانی خێرا لە سوودمەند، بەخشەر، پڕۆژە...</span>
              </div>
              <kbd className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-white text-slate-600 border border-slate-200 shadow-sm">
                Ctrl + K
              </kbd>
            </button>
          </div>

          {/* Actions & Role Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSpotlightOpen(true)}
              className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
              title="گەڕان"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Currency Toggle (IQD / USD) */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200 shadow-sm">
              <button
                onClick={() => setCurrencyView('IQD')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  currencyView === 'IQD'
                    ? 'bg-white text-cyan-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                دینار
              </button>
              <button
                onClick={() => setCurrencyView('USD')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  currencyView === 'USD'
                    ? 'bg-white text-cyan-700 shadow-sm border border-slate-200/80'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                USD $
              </button>
            </div>

            

            

            

            {/* Notification & Communication Hub (Feature 9) */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                className="relative p-2 sm:p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
                title="ئاگاداری و ڕاگەیاندراوەکان"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {(unreadCount > 0 || pendingRemindersCount > 0) && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                    {unreadCount + pendingRemindersCount}
                  </span>
                )}
              </button>

              {/* Multi-Tab Communication Hub Dropdown */}
              {showNotifMenu && (
                <div className="absolute left-0 mt-3 w-80 sm:w-96 rounded-3xl liquid-glass-dropdown p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Tabs Header */}
                  <div className="flex items-center gap-1 pb-3 border-b border-slate-200 text-xs">
                    <button
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
                    <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <p className="text-center py-6 text-sm text-slate-500">هیچ ئاگادارییەک نییە</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => markNotificationRead(n.id)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer ${
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
                                <span className="text-[10px] text-slate-400 mt-1 block">{n.timestamp}</span>
                              </div>
                            </div>
                          </div>
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

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {announcements.map(a => (
                          <div key={a.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-right space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900">{a.title}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                                {a.tag}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{a.content}</p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
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
                    <div className="mt-3 space-y-2 max-h-72 overflow-y-auto pr-1">
                      <p className="text-[11px] text-slate-500 mb-2">بیرخەرەوەی کاتەکانی دابەشکردن، کۆگا و بەدواداچوونی خێزانەکان</p>
                      {reminders.map(r => (
                        <div
                          key={r.id}
                          onClick={() => toggleReminder(r.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
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
                              <span className="text-[10px] font-mono text-amber-800 font-bold">{r.dueDate}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 mt-0.5">{r.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* User Role Switcher Dropdown (Feature 8) */}
            <div className="relative" ref={roleRef}>
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 transition-all text-right group shadow-sm"
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser?.name || 'بەکارهێنەر'}
                    className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-300"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-600 flex items-center justify-center text-white shadow-sm ring-1 ring-cyan-200">
                    <User className="w-4 h-4" />
                  </div>
                )}
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser?.name || 'محمد ئیقبال'}</p>
                  <p className="text-[10px] text-cyan-700 font-bold">{currentUser?.roleTitleKurdish || 'بەڕێوەبەری گشتی'}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-900 transition-transform" />
              </button>

              {/* Role selection menu - 100% Opaque Solid Liquid Card to prevent any corruption */}
              {showRoleMenu && (
                <div className="absolute left-0 mt-3 w-80 rounded-3xl liquid-glass-dropdown p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                  {/* Active User Card Header */}
                  <div className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50/50 rounded-2xl border border-cyan-200/70 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      {currentUser?.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser?.name}
                          className="w-10 h-10 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-cyan-600 text-white flex items-center justify-center shadow-sm">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{currentUser?.name || 'محمد ئیقبال'}</p>
                        <p className="text-[10px] text-slate-600 font-mono truncate">{currentUser?.email || 'mohammed.iqbal@halabjagroup'}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                          {currentUser?.roleTitleKurdish || 'بەڕێوەبەری گشتی (Admin)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-2 py-1 border-b border-slate-200 mb-1">
                    <p className="text-xs font-bold text-slate-800">گۆڕینی ڕۆڵی بەکارهێنەر</p>
                    <p className="text-[10px] text-slate-500">دیاریکردنی دەسەڵات و بەرپرسیارێتییەکان لە سیستەمدا</p>
                  </div>
                  <div className="space-y-1">
                    {rolesList.map(r => (
                      <button
                        key={r.role}
                        onClick={() => {
                          setCurrentRole(r.role);
                          setShowRoleMenu(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-right text-xs transition-all ${
                          currentRole === r.role
                            ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{r.icon}</span>
                          <div>
                            <p>{r.title}</p>
                            <p className="text-[10px] text-slate-500 font-normal">{r.desc}</p>
                          </div>
                        </div>
                        {currentRole === r.role && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
                      </button>
                    ))}
                  </div>

                  {/* Lock Screen Button */}
                  <div className="pt-2 mt-2 border-t border-slate-200 px-1">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        setIsLocked(true);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-sm"
                    >
                      <Lock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>قوفڵکردنی سیستەم (Lock Screen)</span>
                    </button>
                  </div>

                  {/* Backup & Reset */}
                  <div className="pt-2 mt-1 border-t border-slate-200 flex items-center justify-between gap-2 px-1">
                    <button
                      onClick={() => {
                        exportDataJSON();
                        setShowRoleMenu(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-600" />
                      داگرتنی داتا
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('دڵنیایت لە خاوێنکردنەوەی تەواوی داتاکان بۆ سفر؟')) {
                          resetAllData();
                          setShowRoleMenu(false);
                        }
                      }}
                      className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[11px] font-bold text-rose-700 transition-colors border border-rose-200"
                      title="خاوێنکردنەوەی سەرجەم تۆمارەکان بۆ سفر"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      داتای سفر
                    </button>
                  </div>

                  {/* Sign Out Button */}
                  <div className="pt-2 mt-1 border-t border-slate-200 px-1">
                    <button
                      onClick={() => {
                        setShowRoleMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors border border-rose-200 shadow-sm"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>دەرچوون لە هەژمار (Log Out)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* Feature 15: Developer API Console Modal */}
      {/* Feature 14: Security, 2FA and Backup/Restore Center Modal */}
      {/* Feature 13: Accessibility & Multilingual Modal */}
      </>
  );
};
