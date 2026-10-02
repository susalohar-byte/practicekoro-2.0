import React from 'react';
import { Outlet } from 'react-router-dom';
import { StudentNavbar } from './StudentNavbar';
import { BottomNav } from './BottomNav';
import { useMaintenance } from '@/context/MaintenanceContext';
import { useAuth } from '@/context/AuthContext';
import { MaintenanceScreen } from '@/components/common/MaintenanceScreen';
import { MandatoryDistrictModal } from '@/components/student/MandatoryDistrictModal';

export const AppLayout: React.FC = () => {
  const { isMaintenanceMode, loading: maintLoading } = useMaintenance();
  const { isAdmin } = useAuth();

  // If platform maintenance mode is enabled and user is NOT an admin, block student access and display MaintenanceScreen
  if (!maintLoading && isMaintenanceMode && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F1F5FC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 antialiased selection:bg-[#0877FF]/20 selection:text-[#0877FF]">
      {/* 1. App Top Navigation Bar (Shared across Mobile, Tablet, Laptop & Desktop) */}
      <StudentNavbar />

      {/* 2. Main Content Responsive Container */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-28 lg:pb-12">
          <Outlet
            context={{
              onToggleMobileSidebar: () => {},
              onToggleCollapse: () => {},
              isSidebarCollapsed: false,
            }}
          />
        </main>
        {/* 3. Mobile Floating Navigation Pill (App 1:1) */}
        <BottomNav />
      </div>

      {/* Mandatory District Selection Modal for all students missing district */}
      <MandatoryDistrictModal />
    </div>
  );
};
