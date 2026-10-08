import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, NavTab, NavItemConfig } from '../types';
import {
  Compass,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  ShieldAlert,
  Crown,
  Building2,
  UserCheck,
  Sparkles,
  Lock,
  LayoutDashboard,
  Users,
  HeartHandshake,
  FolderKanban,
  PackageSearch,
  Wallet,
  MapPin,
  Files,
  History,
  Settings,
  Sliders,
  CheckCircle2
} from 'lucide-react';

const TAB_ICONS: Record<NavTab, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  beneficiaries: Users,
  donors: HeartHandshake,
  projects: FolderKanban,
  inventory: PackageSearch,
  finance: Wallet,
  volunteers: UserCheck,
  geo: MapPin,
  documents: Files,
  audit: History,
  settings: Settings,
};

const SYSTEM_ROLES_INFO: { role: UserRole; kurdish: string; english: string; icon: string; badgeColor: string }[] = [
  { role: 'developer', kurdish: 'پەرەپێدەر', english: 'Developer', icon: '👑', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  { role: 'head_of_organization', kurdish: 'سەرۆکی ڕێکخراو', english: 'Head of Org', icon: '🏛️', badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
  { role: 'user', kurdish: 'بەکارهێنەر', english: 'User', icon: '👤', badgeColor: 'bg-slate-100 text-slate-800 border-slate-200' },
];

export const NavigationPermissionsManager: React.FC = () => {
  const {
    navConfigs,
    updateNavConfig,
    toggleNavSectionVisibility,
    toggleRoleForNavSection,
    resetNavConfigs
  } = useApp();

  const [previewRole, setPreviewRole] = useState<UserRole>('head_of_organization');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const activeSectionsCount = navConfigs.filter(c => c.isVisible).length;
  const hiddenSectionsCount = navConfigs.filter(c => !c.isVisible).length;

  // Preset quick actions
  const applyHeadOfOrgFullAccess = () => {
    navConfigs.forEach(c => {
      if (!c.allowedRoles.includes('head_of_organization')) {
        updateNavConfig(c.id, {
          isVisible: true,
          allowedRoles: [...c.allowedRoles, 'head_of_organization']
        });
      }
    });
    showNotification('سەرجەم بەشەکان بۆ سەرۆکی ڕێکخراو چالاک کران');
  };

  const applyRestrictedUserPreset = () => {
    const allowedForUser: NavTab[] = ['dashboard', 'beneficiaries', 'inventory', 'geo'];
    navConfigs.forEach(c => {
      const shouldHaveUser = allowedForUser.includes(c.id);
      const userRole: UserRole = 'user';
      const newRoles: UserRole[] = shouldHaveUser
        ? (c.allowedRoles.includes('user') ? c.allowedRoles : [...c.allowedRoles, userRole])
        : c.allowedRoles.filter(r => r !== 'user');
      updateNavConfig(c.id, { allowedRoles: newRoles });
    });
    showNotification('ڕۆڵی بەکارهێنەر سنووردار کرا تەنها بۆ (داشبۆرد، سوودمەندان، کۆگا، نەخشە)');
  };

  const handleReset = () => {
    if (window.confirm('ئایا دڵنیایت لە گەڕاندنەوەی سەرجەم ڕێکخستنەکانی ناڤیگەیشن بۆ دۆخی بنەڕەتی؟')) {
      resetNavConfigs();
      showNotification('سەرجەم بەشەکان گەڕێنرانەوە بۆ دۆخی بنەڕەتی');
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-black">
              <Crown className="w-3.5 h-3.5 text-purple-300" />
              <span>کۆنترۆڵی دەسەڵاتەکان • تایبەت بە پەرەپێدەری سیستەم</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              بەڕێوەبردنی بەشەکانی شریتی ناڤیگەیشن و دەسەڵاتی بینین
            </h3>
            <p className="text-xs sm:text-sm text-purple-200/90 font-medium max-w-2xl leading-relaxed">
              دەتوانیت هەر بەشێکی سیستەم بە تەواوی بشاریتەوە یان پیشانی بدەیت، هەروەها بە دیاریکراوی دەستنیشانی بکەیت کە کام لە ٣ ڕۆڵەکە (پەرەپێدەر، سەرۆکی ڕێکخراو، بەکارهێنەر) مافی بینینیان هەبێت.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all"
              title="گەڕاندنەوە بۆ بنەڕەت"
            >
              <RotateCcw className="w-4 h-4" />
              <span>گەڕاندنەوە بۆ بنەڕەت</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-[11px] text-purple-300 font-bold">کۆی بەشەکانی سیستەم</p>
            <p className="text-xl font-black text-white mt-0.5">{navConfigs.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-[11px] text-emerald-300 font-bold">بەشە چالاکەکان</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{activeSectionsCount}</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
            <p className="text-[11px] text-rose-300 font-bold">بەشە شاردراوەکان</p>
            <p className="text-xl font-black text-rose-400 mt-0.5">{hiddenSectionsCount}</p>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Quick Action Presets */}
      <div className="p-4 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-black text-slate-800">کردارە خێراکان بۆ دیاریکردنی دەسەڵاتەکان:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={applyHeadOfOrgFullAccess}
            className="px-3 py-1.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 text-cyan-900 text-xs font-bold transition-all"
          >
            🏛️ کردنەوەی سەرجەم بەشەکان بۆ سەرۆکی ڕێکخراو
          </button>
          <button
            onClick={applyRestrictedUserPreset}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-bold transition-all"
          >
            👤 سنووردارکردنی ڕۆڵی بەکارهێنەر بۆ هاوکاری مەیدانی
          </button>
        </div>
      </div>

      {/* Live Preview Dock Simulator */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-black text-slate-200">
              پێشبینینی ڕاستەوخۆ: شریتی ناڤیگەیشن چۆن دەردەکەوێت بۆ ئەم ڕۆڵە؟
            </h4>
          </div>

          {/* Role Preview Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-2xl border border-slate-700">
            {SYSTEM_ROLES_INFO.map(r => (
              <button
                key={r.role}
                onClick={() => setPreviewRole(r.role)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  previewRole === r.role
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{r.icon}</span>
                <span>{r.kurdish}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mock Navigation Dock */}
        <div className="pt-2">
          <div className="p-2 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-wrap items-center gap-1.5 justify-center">
            {navConfigs
              .filter(c => {
                if (previewRole === 'developer' && c.id === 'settings') return true;
                return c.isVisible && c.allowedRoles.includes(previewRole);
              })
              .map(c => {
                const Icon = TAB_ICONS[c.id];
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/80 border border-slate-600 text-slate-200 text-xs font-bold"
                  >
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{c.label}</span>
                  </div>
                );
              })}
            {navConfigs.filter(c => c.isVisible && c.allowedRoles.includes(previewRole)).length === 0 && (
              <p className="text-xs text-rose-400 py-1 font-bold">هیچ بەشێک بۆ ئەم ڕۆڵە دیاری نەکراوە!</p>
            )}
          </div>
          <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
            ئەم بەشانەی سەرەوە ڕێک بەم شێوەیە لە شریتی خوارەوەی شاشە (Navigation Dock) دەردەکەون کاتێک ئەم ڕۆڵە دێتە ژوورەوە.
          </p>
        </div>
      </div>

      {/* Permissions Matrix Table */}
      <div className="rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            <h4 className="text-sm sm:text-base font-black text-slate-900">
              خشتەی بەشەکانی ناڤیگەیشن و دیاریکردنی دەسەڵاتەکان
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-bold">
            کلیک بکە بۆ شاردنەوە یان گۆڕینی مافی دەستگەیشتن
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {navConfigs.map(c => {
            const Icon = TAB_ICONS[c.id];
            const isSettingsLocked = c.id === 'settings';

            return (
              <div
                key={c.id}
                className={`p-4 sm:p-5 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  !c.isVisible ? 'bg-slate-50/80 opacity-70' : 'hover:bg-slate-50/50'
                }`}
              >
                {/* Left: Tab Title & Master Toggle */}
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${
                      c.isVisible
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-slate-900">{c.label}</p>
                      <span className="text-[10px] font-mono font-bold text-slate-600">({c.englishLabel})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {c.isVisible ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <Eye className="w-3 h-3 text-emerald-600" />
                          <span>پیشاندراوە لە سیستەمدا</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
                          <EyeOff className="w-3 h-3 text-rose-600" />
                          <span>شاردراوەتەوە لە هەمووان</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle: Master Hide/Show Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleNavSectionVisibility(c.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      c.isVisible
                        ? 'bg-white hover:bg-rose-50 border-slate-200 text-slate-700 hover:text-rose-700 hover:border-rose-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm'
                    }`}
                  >
                    {c.isVisible ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>شاردنەوەی بەش</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>پیشاندانەوە</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Right: Role Permission Checkboxes */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  {SYSTEM_ROLES_INFO.map(r => {
                    const isAllowed = c.allowedRoles.includes(r.role);
                    const isRoleSettingsLocked = isSettingsLocked && r.role === 'developer';

                    return (
                      <button
                        key={r.role}
                        type="button"
                        disabled={!c.isVisible || isRoleSettingsLocked}
                        onClick={() => toggleRoleForNavSection(c.id, r.role)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all ${
                          !c.isVisible
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
                            : isRoleSettingsLocked
                            ? 'bg-purple-100 border-purple-300 text-purple-900 cursor-not-allowed shadow-sm'
                            : isAllowed
                            ? 'bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-900 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-500'
                        }`}
                        title={
                          isRoleSettingsLocked
                            ? 'بەشی ڕێکخستنەکان هەمیشە بۆ پەرەپێدەر کراوەیە بۆ پاراستنی دەسەڵات'
                            : `کلیک بکە بۆ گۆڕینی مافی دەستگەیشتنی ${r.kurdish}`
                        }
                      >
                        <span className="text-sm">{r.icon}</span>
                        <span>{r.kurdish}</span>
                        
                        {isRoleSettingsLocked ? (
                          <Lock className="w-3.5 h-3.5 text-purple-600 ml-0.5" />
                        ) : (
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                              isAllowed
                                ? 'bg-purple-600 border-purple-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isAllowed && <Check className="w-3 h-3" />}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-900 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold">تێبینی پارێزراوی گرنگ بۆ پەرەپێدەر:</p>
          <p className="text-amber-800/90 leading-relaxed font-medium">
            هەر گۆڕانکارییەک ئەنجام بدەیت دەستبەجێ لە سیستەمدا جێبەجێ دەبێت. بەشی (ڕێکخستنەکان) بۆ هەمیشە بۆ پەرەپێدەر کراوە و پارێزراوە تا لە هیچ دۆخێکدا پەرەپێدەر تووشی قفڵبوون یان نەبوونی دەسەڵات نەبێت.
          </p>
        </div>
      </div>

    </div>
  );
};
