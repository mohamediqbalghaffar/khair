import React from 'react';
import { useApp, NavTab } from '../context/AppContext';
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
  Settings
} from 'lucide-react';

interface NavItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const NavigationDock: React.FC = () => {
  const { activeTab, setActiveTab, beneficiaries, inventory } = useApp();

  // Count items needing attention
  const pendingBeneficiaries = beneficiaries.filter(b => b.status === 'pending').length;
  const lowStockCount = inventory.filter(i => i.quantity <= i.minAlertThreshold).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'داشبۆرد', icon: LayoutDashboard },
    { id: 'beneficiaries', label: 'سوودمەندان', icon: Users, badge: pendingBeneficiaries },
    { id: 'donors', label: 'بەخشەران', icon: HeartHandshake },
    { id: 'projects', label: 'پڕۆژەکان', icon: FolderKanban },
    { id: 'inventory', label: 'کۆگا و دابەشکردن', icon: PackageSearch, badge: lowStockCount },
    { id: 'finance', label: 'دارایی', icon: Wallet },
    { id: 'volunteers', label: 'خۆبەخشان', icon: UserCheck },
    { id: 'geo', label: 'نەخشەی هاوکاری', icon: MapPin },
    { id: 'documents', label: 'بەڵگەنامەکان', icon: Files },
    { id: 'audit', label: 'مێژووی چاودێری', icon: History },
    { id: 'settings', label: 'ڕێکخستنەکان', icon: Settings },
  ];

  return (
    <footer className="w-full shrink-0 z-30 py-2.5 px-3 flex justify-center bg-white/90 backdrop-blur-2xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(15,23,42,0.03)]">
      <nav className="max-w-full overflow-x-auto no-scrollbar rounded-full p-1.5 bg-white border border-slate-200/90 shadow-[0_4px_20px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.9)] flex items-center gap-1.5 transition-all">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_4px_16px_rgba(2,132,199,0.35),inset_0_1px_1px_rgba(255,255,255,0.6)] scale-[1.03]'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90'
              }`}
            >
              <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-900'}`} />
              <span className={`${isActive ? 'inline' : 'hidden md:inline'}`}>{item.label}</span>

              {/* Badges for pending items or alerts */}
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white animate-pulse'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </footer>
  );
};
