import { AdminPageSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ShieldAlert } from 'lucide-react';

import type { AdminPermissions } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

interface AdminRouteProps extends ProtectedRouteProps {
  requiredPermission?: keyof AdminPermissions;
}

/** Requires any authenticated user (student or admin). */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  if (!user) {
    // No exceptions: every protected page (including /dashboard) requires a
    // valid session. Guests are sent to /login and returned after sign-in.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

/** Requires authenticated user with admin role (verified from database) & optional sub-role permission. */
export const AdminRoute: React.FC<AdminRouteProps> = ({ children, requiredPermission }) => {
  const { user, isAdmin, adminRole, hasPermission, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (loading) return <AdminPageSkeleton label="Loading admin session…" variant="dashboard" />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check sub-role permission if requested
  if (requiredPermission && !hasPermission(requiredPermission)) {
    const roleTitles: Record<string, string> = {
      content_writer: 'Content Writer',
      support_agent: 'Support Agent',
      super_admin: 'Super Admin',
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Permission Restricted
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            Your role is configured as{' '}
            <span className="font-semibold text-slate-900 dark:text-slate-200">
              {roleTitles[adminRole] || adminRole}
            </span>
            . You do not have permission to access this administration module.
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400 mb-6">
            Required Permission:{' '}
            <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
              {requiredPermission}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/admin', { replace: true })}
              className="px-5 py-2.5 bg-pk-primary hover:bg-pk-primary/90 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Admin Dashboard
            </button>
            {adminRole === 'content_writer' && (
              <button
                onClick={() => navigate('/admin/question-bank', { replace: true })}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Question Bank
              </button>
            )}
            {adminRole === 'support_agent' && (
              <button
                onClick={() => navigate('/admin/support', { replace: true })}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Support Tickets
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/** Redirects already-authenticated users away from public auth pages. */
export const PublicOnlyRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
      </div>
    );
  }

  // Any authenticated user is sent to their panel — no fake/demo exceptions.
  if (user) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
};
