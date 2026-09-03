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
  ChevronDown
} from 'lucide-react';

export const Topbar: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    currencyView,
    setCurrencyView,
    notifications,
    markNotificationRead,
    setIsSpotlightOpen,
    exportDataJSON,
    resetAllData
  } = useApp();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const rolesList: { role: UserRole; title: string; desc: string; icon: string }[] = [
    { role: 'admin', title: 'بەڕێوەبەری گشتی', desc: 'دەسەڵاتی تەواوی سیستەم', icon: '👑' },
    { role: 'manager', title: 'بەرپرسی پڕۆژەکان', desc: 'بەڕێوەبردنی کەمپەین و تیم', icon: '📋' },
    { role: 'staff', title: 'کارمەندی تۆمار', desc: 'تۆماری سوودمەندان و کۆگا', icon: '✍️' },
    { role: 'volunteer', title: 'خۆبەخش', desc: 'ئەرکەکان و کاتژمێری خزمەت', icon: '🤝' },
    { role: 'donor', title: 'بەخشەر', desc: 'مێژووی بەخشین و پسوولەکان', icon: '🎁' },
    { role: 'auditor', title: 'چاودێری دارایی', desc: 'ڕاپۆرتی شەفافییەت و ژمێریاری', icon: '🔍' },
  ];

  // Close menus on click outside
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

  return (
    <header className="sticky top-0 z-40 px-4 py-3 sm:px-6 w-full backdrop-blur-3xl bg-white/85 border-b border-slate-200/80 shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* NGO Brand & Identity */}
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
                ڕێکخراوی ئایندە
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-100 text-cyan-800 border border-cyan-200">
                  خێرخوازی
                </span>
              </h1>
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
        <div className="flex items-center gap-2 sm:gap-3">
          
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

          {/* Notification Bell with Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
              title="ئاگادارییەکان"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Popover */}
            {showNotifMenu && (
              <div className="absolute left-0 mt-3 w-80 sm:w-96 rounded-3xl liquid-glass-dropdown p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-600" />
                    ئاگادارییەکانی سیستەم
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">{notifications.length} ئاگاداری</span>
                </div>

                <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto pr-1">
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
              </div>
            )}
          </div>

          {/* User Role Switcher Dropdown */}
          <div className="relative" ref={roleRef}>
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 hover:bg-slate-200/70 border border-slate-200 transition-all text-right group shadow-sm"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-300"
              />
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold text-slate-900 leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-cyan-700 font-bold">{currentUser.roleTitleKurdish}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-900 transition-transform" />
            </button>

            {/* Role selection menu - 100% Opaque Solid Liquid Card to prevent any corruption */}
            {showRoleMenu && (
              <div className="absolute left-0 mt-3 w-72 rounded-3xl liquid-glass-dropdown p-2.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="px-3 py-2 border-b border-slate-200 mb-1">
                  <p className="text-xs font-bold text-slate-800">گۆڕینی ڕۆڵی بەکارهێنەر</p>
                  <p className="text-[10px] text-slate-500">بۆ تاقیکردنەوەی دەسەڵاتە جیاوازەکان</p>
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

                <div className="pt-2 mt-2 border-t border-slate-200 flex items-center justify-between gap-2 px-1">
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
                      if (confirm('دڵنیایت لە گەڕانەوەی تەواوی داتاکان بۆ باری سەرەتایی؟')) {
                        resetAllData();
                        setShowRoleMenu(false);
                      }
                    }}
                    className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[11px] font-bold text-rose-700 transition-colors border border-rose-200"
                    title="ڕیسێتکردنەوە بۆ نموونە بنەڕەتییەکان"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    داتای بنەڕەت
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
