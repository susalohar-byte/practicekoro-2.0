import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StudentSidebar } from './StudentSidebar';
import { BottomNav } from './BottomNav';
import { useMaintenance } from '@/context/MaintenanceContext';
import { useAuth } from '@/context/AuthContext';
import { MaintenanceScreen } from '@/components/common/MaintenanceScreen';
import { MandatoryDistrictModal } from '@/components/student/MandatoryDistrictModal';

export const AppLayout: React.FC = () => {
  const { isMaintenanceMode, loading: maintLoading } = useMaintenance();
  const { isAdmin } = useAuth();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pk_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // If platform maintenance mode is enabled and user is NOT an admin, block student access and display MaintenanceScreen
  if (!maintLoading && isMaintenanceMode && !isAdmin) {
    return <MaintenanceScreen />;
  }

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pk_sidebar_collapsed', String(next));
      } catch {
        // Ignore malformed cached UI preference and retain the default layout.
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen flex bg-[#F6F9FF] dark:bg-slate-950">
      {/* Side Navbar Component for Student Dashboard */}
      <StudentSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* Main Content Column (no top header: navbar lives only on Home) */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <main className="flex-1 pb-20 lg:pb-12">
          <Outlet
            context={{
              onToggleMobileSidebar: () => setMobileSidebarOpen((prev) => !prev),
              onToggleCollapse: toggleCollapse,
              isSidebarCollapsed: isCollapsed,
            }}
          />
        </main>
        <BottomNav />
      </div>

      {/* Mandatory District Selection Modal for all students missing district */}
      <MandatoryDistrictModal />
    </div>
  );
};
