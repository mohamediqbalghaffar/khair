import React, { useEffect, Suspense, lazy } from 'react';
import { useUrlTabSync } from './utils/useUrlTabSync';
import { AppProvider, useApp } from './context/AppContext';
import { FeedbackProvider } from './components/ui/FeedbackProvider';
import { LiquidBackground } from './components/LiquidBackground';
import { Topbar } from './components/Topbar';
import { NavigationDock } from './components/NavigationDock';
import { SpotlightModal } from './components/SpotlightModal';
import { LockScreenModal } from './components/LockScreenModal';
import { loadAndApplyAccessibilityPrefs } from './components/AccessibilityModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from '@clerk/react';
import { ClerkAuthView } from './views/ClerkAuthView';
import { ShieldAlert } from 'lucide-react';

// Lazy-loaded Views for bundle splitting
const DashboardView = lazy(() =>
  import('./views/DashboardView').then(m => ({ default: m.DashboardView }))
);
const BeneficiariesView = lazy(() =>
  import('./views/BeneficiariesView').then(m => ({ default: m.BeneficiariesView }))
);
const DonorsView = lazy(() =>
  import('./views/DonorsView').then(m => ({ default: m.DonorsView }))
);
const ProjectsView = lazy(() =>
  import('./views/ProjectsView').then(m => ({ default: m.ProjectsView }))
);
const InventoryView = lazy(() =>
  import('./views/InventoryView').then(m => ({ default: m.InventoryView }))
);
const FinanceView = lazy(() =>
  import('./views/FinanceView').then(m => ({ default: m.FinanceView }))
);
const VolunteersView = lazy(() =>
  import('./views/VolunteersView').then(m => ({ default: m.VolunteersView }))
);
const GeoMapView = lazy(() =>
  import('./views/GeoMapView').then(m => ({ default: m.GeoMapView }))
);
const DocumentsView = lazy(() =>
  import('./views/DocumentsView').then(m => ({ default: m.DocumentsView }))
);
const AuditView = lazy(() =>
  import('./views/AuditView').then(m => ({ default: m.AuditView }))
);
const SettingsView = lazy(() =>
  import('./views/SettingsView').then(m => ({ default: m.SettingsView }))
);

const ViewLoadingFallback: React.FC = () => (
  <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-200/80 p-12 flex flex-col items-center justify-center gap-3 shadow-sm">
    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    <p className="text-xs font-bold text-slate-600">بارکردنی بەش...</p>
  </div>
);

const MainContent: React.FC = () => {
  const { activeTab, setActiveTab, currentRole, isTabAllowedForRole } = useApp();
  useUrlTabSync(activeTab, setActiveTab);

  useEffect(() => {
    loadAndApplyAccessibilityPrefs();
  }, []);

  const renderActiveView = () => {
    if (!isTabAllowedForRole(activeTab, currentRole)) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-sm max-w-lg mx-auto my-12 space-y-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-md">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-slate-900">دەسەڵاتی بینینی ئەم بەشەت نییە</h3>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              ئەم بەشە لەلایەن پەرەپێدەری سیستەمەوە بۆ ئەم ڕۆڵە شاردراوەتەوە یان سنووردار کراوە.
            </p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'beneficiaries':
        return <BeneficiariesView />;
      case 'donors':
        return <DonorsView />;
      case 'projects':
        return <ProjectsView />;
      case 'inventory':
        return <InventoryView />;
      case 'finance':
        return <FinanceView />;
      case 'volunteers':
        return <VolunteersView />;
      case 'geo':
        return <GeoMapView />;
      case 'documents':
        return <DocumentsView />;
      case 'audit':
        return <AuditView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="relative h-full text-slate-900 flex flex-col overflow-hidden select-text">
      {/* Background Liquid Atmosphere */}
      <LiquidBackground />

      {/* Persistent iOS 26 Liquid Topbar */}
      <div className="shrink-0 z-30">
        <Topbar />
      </div>

      {/* Main Content Area with Adaptive Layout - bounded cleanly between Topbar and Navigation Dock */}
      <main className="relative z-10 flex-1 min-h-0 w-full overflow-y-auto">
        <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-28 lg:pb-8">
          <ErrorBoundary>
            <Suspense fallback={<ViewLoadingFallback />}>
              {renderActiveView()}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>

      {/* Bottom Navigation Dock Area */}
      <NavigationDock />

      {/* Global Spotlight Search Modal */}
      <SpotlightModal />

      {/* iOS 26 Liquid Lock Screen Modal */}
      <LockScreenModal />
    </div>
  );
};

const MainApp: React.FC = () => {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white select-none">
        <LiquidBackground />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-cyan-300">چاوەڕوانبە، سیستەم ئامادە دەکرێت...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <ClerkAuthView />;
  }

  return <MainContent />;
};

export default function App() {
  return (
    <FeedbackProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </FeedbackProvider>
  );
}
