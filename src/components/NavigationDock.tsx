import React, { useState, useRef, useEffect } from 'react';
import { useApp, NavTab } from '../context/AppContext';
import { useFeedback } from './ui/FeedbackProvider';
import { AdaptiveDrawerSheet } from './ui/AdaptiveDrawerSheet';
import { useHaptics } from '../utils/useHaptics';
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  FolderKanban,
  PackageSearch,
  Wallet,
  UserCheck,
  MapPin,
  Files,
  History,
  Settings,
  MoreHorizontal,
  RotateCcw,
  Database,
  AlertTriangle,
  Coins
} from 'lucide-react';

interface NavItem {
  id: NavTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const NavigationDock: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    beneficiaries,
    inventory,
    currentRole,
    isTabAllowedForRole,
    currencyView,
    setCurrencyView,
    isCloudConnected,
    isCloudSyncing,
    syncLocalDataToCloud
  } = useApp();
  const { showToast } = useFeedback();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const haptics = useHaptics();

  const handleManualSync = async () => {
    haptics.medium();
    showToast('دەستکرا بە هاوکاتکردنی داتاکان لەگەڵ هەور...', 'info');
    try {
      const ok = await syncLocalDataToCloud();
      if (ok) {
        showToast('داتاکان بەسەرکەوتوویی لەگەڵ هەور هاوکاتکران', 'success');
      } else {
        showToast('نەتوانرا هاوکات بکرێت، تکایە ئینتەرنێتەکەت بپشکنە', 'error');
      }
    } catch {
      showToast('هەڵە لە پەیوەندی هەور', 'error');
    }
  };

  // Count items needing attention
  const pendingBeneficiaries = beneficiaries.filter(b => b.status === 'pending').length;
  const lowStockCount = inventory.filter(i => i.quantity <= i.minAlertThreshold).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'داشبۆرد', shortLabel: 'داشبۆرد', icon: LayoutDashboard },
    { id: 'beneficiaries', label: 'سوودمەندان', shortLabel: 'سوودمەندان', icon: Users, badge: pendingBeneficiaries },
    { id: 'donors', label: 'بەخشەران', shortLabel: 'بەخشەران', icon: HeartHandshake },
    { id: 'inventory', label: 'کۆگا و دابەشکردن', shortLabel: 'کۆگا', icon: PackageSearch, badge: lowStockCount },
    { id: 'finance', label: 'دارایی', shortLabel: 'دارایی', icon: Wallet },
    { id: 'projects', label: 'پڕۆژەکان', shortLabel: 'پڕۆژەکان', icon: FolderKanban },
    { id: 'geo', label: 'نەخشەی هاوکاری', shortLabel: 'نەخشە', icon: MapPin },
    { id: 'documents', label: 'بەڵگەنامەکان', shortLabel: 'بەڵگەنامە', icon: Files },
    { id: 'volunteers', label: 'خۆبەخشان', shortLabel: 'خۆبەخشان', icon: UserCheck },
    { id: 'audit', label: 'مێژووی چاودێری', shortLabel: 'چاودێری', icon: History },
    { id: 'settings', label: 'ڕێکخستنەکان', shortLabel: 'ڕێکخستن', icon: Settings },
  ];

  // Filter items visible to the currently active user role
  const visibleNavItems = navItems.filter(item => isTabAllowedForRole(item.id, currentRole));
  const primaryMobileItems = visibleNavItems.slice(0, 5);
  const secondaryMobileItems = visibleNavItems.slice(5);
  const isSecondaryActive = secondaryMobileItems.some(item => item.id === activeTab);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMoreOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  return (
    <footer className="w-full shrink-0 z-30 py-2 pb-safe px-3 flex justify-center bg-white/90 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(15,23,42,0.03)] no-print">
      {/* Desktop Full Dock (lg+) */}
      <nav
        aria-label="ڕێڕەوی سەرەکی سیستەم"
        className="hidden lg:flex max-w-full overflow-x-auto no-scrollbar rounded-full p-1.5 bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] items-center gap-1 transition-all"
      >
        {visibleNavItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                haptics.light();
                setActiveTab(item.id);
              }}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 group touch-manipulation active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_4px_16px_rgba(2,132,199,0.35),inset_0_1px_1px_rgba(255,255,255,0.6)] scale-[1.02]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
              <span>{item.label}</span>

              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile & Tablet Adaptive Dock (< lg) — Always shows readable Kurdish labels */}
      <div ref={moreRef} className="relative flex lg:hidden w-full max-w-xl">
        {/* iOS-like Physics Bottom Sheet Drawer (Vaul) for More Tabs */}
        <AdaptiveDrawerSheet
          isOpen={isMoreOpen}
          onClose={() => setIsMoreOpen(false)}
          title="بەشەکانی تری سیستەم"
          description="بەشە سەرەکی و کارگێڕییەکانی تر هەڵبژێرە"
          adaptive={false}
          maxHeight="max-h-[85dvh]"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              {secondaryMobileItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setActiveTab(item.id);
                      setIsMoreOpen(false);
                    }}
                    className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all touch-manipulation active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-cyan-500 shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-cyan-600'}`} />
                    <span className="truncate max-w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Mobile Settings: Cloud Sync & Currency View */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-cyan-600" />
                  <span className="text-xs font-bold text-slate-800">دراوی پیشاندان</span>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setCurrencyView('IQD');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      currencyView === 'IQD'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    دینار
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptics.light();
                      setCurrencyView('USD');
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all font-mono ${
                      currencyView === 'USD'
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    USD $
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2">
                  {isCloudConnected ? (
                    <Database className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">پەیوەندی داتابەیسی هەور</span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {isCloudConnected ? 'سەرهێڵ (Supabase)' : 'ناپەیوەست'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isCloudSyncing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-cyan-700 hover:bg-cyan-50 transition-colors disabled:opacity-50 touch-manipulation active:scale-95"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin text-cyan-600' : ''}`} />
                  <span>{isCloudSyncing ? 'هاوکاتکردن...' : 'هاوکاتکردن'}</span>
                </button>
              </div>
            </div>
          </div>
        </AdaptiveDrawerSheet>

        <nav
          aria-label="ڕێڕەوی مۆبایل"
          className="w-full rounded-2xl p-1 bg-white border border-slate-200/90 shadow-md grid grid-cols-6 gap-1"
        >
          {primaryMobileItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  haptics.light();
                  setActiveTab(item.id);
                  setIsMoreOpen(false);
                }}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-h-[44px] rounded-xl text-[11px] font-bold transition-all touch-manipulation active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate max-w-full">{item.shortLabel}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`absolute top-1 end-1.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black ${
                    isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {secondaryMobileItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                haptics.medium();
                setIsMoreOpen(!isMoreOpen);
              }}
              aria-expanded={isMoreOpen}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-h-[44px] rounded-xl text-[11px] font-bold transition-all touch-manipulation active:scale-95 ${
                isSecondaryActive || isMoreOpen
                  ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MoreHorizontal className="w-4 h-4 shrink-0" />
              <span>زیاتر</span>
            </button>
          )}
        </nav>
      </div>
    </footer>
  );
};
