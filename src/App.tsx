import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LiquidBackground } from './components/LiquidBackground';
import { Topbar } from './components/Topbar';
import { NavigationDock } from './components/NavigationDock';
import { SpotlightModal } from './components/SpotlightModal';
import { LockScreenModal } from './components/LockScreenModal';

// Views
import { DashboardView } from './views/DashboardView';
import { BeneficiariesView } from './views/BeneficiariesView';
import { DonorsView } from './views/DonorsView';
import { ProjectsView } from './views/ProjectsView';
import { InventoryView } from './views/InventoryView';
import { FinanceView } from './views/FinanceView';
import { VolunteersView } from './views/VolunteersView';
import { GeoMapView } from './views/GeoMapView';
import { DocumentsView } from './views/DocumentsView';
import { AuditView } from './views/AuditView';
import { SettingsView } from './views/SettingsView';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderActiveView = () => {
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
        <div className="max-w-[1536px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {renderActiveView()}
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

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
