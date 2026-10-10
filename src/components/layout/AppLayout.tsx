import React, { useState } from 'react';
import '@/styles/student-panel.css';
import { Outlet } from 'react-router-dom';
import { StudentSidebar } from './StudentSidebar';
import { StudentNavbar } from './StudentNavbar';
import { BottomNav } from './BottomNav';
import { useMaintenance } from '@/context/MaintenanceContext';
import { useAuth } from '@/context/AuthContext';
import { MaintenanceScreen } from '@/components/common/MaintenanceScreen';
import { StudentLoading, StudentLoadError } from '@/components/student/StudentLoadState';
import { MandatoryDistrictModal } from '@/components/student/MandatoryDistrictModal';

export const AppLayout: React.FC = () => {
  const {
    isMaintenanceMode,
    loading: maintLoading,
    settingsError,
    hasLoadedSettings,
    checkMaintenanceMode,
  } = useMaintenance();
  const { isAdmin } = useAuth();

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

  if (!isAdmin && maintLoading) return <StudentLoading label="Checking platform availability" />;
  if (!isAdmin && settingsError && hasLoadedSettings === false)
    return (
      <StudentLoadError
        message="Platform settings could not be verified. Please retry."
        onRetry={() => {
          void checkMaintenanceMode().catch(() => {});
        }}
      />
    );

  // If platform maintenance mode is enabled and user is NOT an admin, block student access and display MaintenanceScreen
  if (!maintLoading && isMaintenanceMode && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return (
    <div className="student-shell min-h-screen flex bg-[#F1F5FC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 antialiased selection:bg-[#026BFC]/20 selection:text-[#026BFC]">
      <a href="#student-main" className="student-skip-link">
        Skip to content
      </a>
      {/* 1. App Left Sidebar Navigation (Desktop sticky, Mobile drawer) */}
      <StudentSidebar
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Navbar with search, notifications, theme toggle, and profile */}
        <StudentNavbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onToggleCollapse={handleToggleCollapse}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main
          id="student-main"
          tabIndex={-1}
          className="flex-1 w-full max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-12 motion-safe:transition-all motion-safe:duration-200"
        >
          <React.Suspense fallback={<StudentLoading label="Loading student page" />}>
            <Outlet
              context={{
                onToggleMobileSidebar: () => setIsMobileSidebarOpen(true),
                onToggleCollapse: handleToggleCollapse,
                isSidebarCollapsed,
              }}
            />
          </React.Suspense>
        </main>

        {/* 3. Mobile Floating Navigation Pill (App 1:1, hidden on lg screens) */}
        <BottomNav />
      </div>

      {/* Mandatory District Selection Modal for all students missing district */}
      <MandatoryDistrictModal />
    </div>
  );
};
