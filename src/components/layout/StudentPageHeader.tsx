import React from 'react';
import { Bell, Search, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface StudentPageHeaderProps {
  title: string;
  subtitle: string;
  settingsLink?: string;
}

export const StudentPageHeader: React.FC<StudentPageHeaderProps> = ({
  title,
  subtitle,
  settingsLink,
}) => {
  const { user } = useAuth();
  const avatar = user?.avatarUrl || '/images/student_avatar.png';

  return (
    <header className="pk-reference-header">
      <div className="min-w-0">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {settingsLink ? (
          <Link className="pk-header-action" to={settingsLink} aria-label="Settings">
            <Settings className="h-5 w-5" />
          </Link>
        ) : (
          <>
            <Link className="pk-header-action" to="/test-series" aria-label="Search tests">
              <Search className="h-5 w-5" />
            </Link>
            <Link
              className="pk-header-action pk-notification-action"
              to="/settings"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span aria-hidden="true">3</span>
            </Link>
            <Link to="/profile" aria-label="Open profile">
              <img
                src={avatar}
                alt=""
                className="h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                onError={(event) => {
                  event.currentTarget.src = '/images/student_avatar.png';
                }}
              />
            </Link>
          </>
        )}
      </div>
    </header>
  );
};
