import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { StudentSidebar } from './StudentSidebar';
import { StudentNavbar } from './StudentNavbar';
import { BottomNav } from './BottomNav';
import { useMaintenance } from '@/context/MaintenanceContext';
import { useAuth } from '@/context/AuthContext';
import { MaintenanceScreen } from '@/components/common/MaintenanceScreen';
import { MandatoryDistrictModal } from '@/components/student/MandatoryDistrictModal';
import { cn } from '@/lib/utils';

export const AppLayout: React.FC = () => {
  const { isMaintenanceMode, loading: maintLoading } = useMaintenance();
  const { isAdmin } = useAuth();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pk_student_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pk_student_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // If platform maintenance mode is enabled and user is NOT an admin, block student access and display MaintenanceScreen
  if (!maintLoading && isMaintenanceMode && !isAdmin) {
    return <MaintenanceScreen />;
  }

  const isHome =
    location.pathname === '/' ||
    location.pathname === '/dashboard' ||
    location.pathname === '/home';

  return (
    <div className="min-h-screen flex bg-[#F1F5FC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 antialiased selection:bg-[#0877FF]/20 selection:text-[#0877FF]">
      {/* 1. App Left Sidebar Navigation (Desktop sticky, Mobile drawer) */}
      <StudentSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Only show StudentNavbar on subpages, as Home dashboard has its own 1:1 App Brand Header */}
        {!isHome && (
          <StudentNavbar
            onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onToggleCollapse={handleToggleCollapse}
            isSidebarCollapsed={isSidebarCollapsed}
          />
        )}

        <main
          className={cn(
            'flex-1 w-full px-3.5 sm:px-6 py-3.5 sm:py-5 pb-28 lg:pb-12 transition-all duration-200',
            isHome
              ? 'max-w-[680px] xl:max-w-[720px] mx-auto'
              : 'max-w-6xl xl:max-w-7xl mx-auto lg:px-8'
          )}
        >
          <Outlet
            context={{
              onToggleMobileSidebar: () => setIsMobileSidebarOpen(true),
              onToggleCollapse: handleToggleCollapse,
              isSidebarCollapsed,
            }}
          />
        </main>

        {/* 3. Mobile Floating Navigation Pill (App 1:1, hidden on lg screens) */}
        <BottomNav />
      </div>

      {/* Mandatory District Selection Modal for all students missing district */}
      <MandatoryDistrictModal />
    </div>
  );
};
