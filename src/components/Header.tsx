import React from 'react';
import { Bell, User } from 'lucide-react';
import { NotificationItem } from '../types';
import { BrandLogo } from './BrandLogo';
import { APP_COLUMN } from '../lib/layout';

interface HeaderProps {
  notifications: NotificationItem[];
  onGoHome: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  onGoHome,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      id="muni-header"
      className={`fixed top-0 inset-x-0 z-40 ${APP_COLUMN} bg-surface-card border-b border-line lg:border-x`}
    >
      <div className="h-16 flex items-center justify-between px-4">
        <button
          type="button"
          onClick={onGoHome}
          aria-label="Muni Limpia, ir a inicio"
          className="-ml-1 p-1 rounded-control"
        >
          <BrandLogo variant="muni-limpia-h" className="h-8 w-auto" />
        </button>

        <div className="flex items-center gap-1">
          <button
            id="btn-notifications"
            type="button"
            onClick={onOpenNotifications}
            aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
            className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-surface-muted text-ink-body transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 bg-danger text-white text-xs font-semibold rounded-full flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            id="btn-profile"
            type="button"
            onClick={onOpenProfile}
            aria-label="Perfil y configuración"
            className="w-11 h-11 flex items-center justify-center rounded-full group"
          >
            <span className="w-10 h-10 rounded-full bg-brand-600 group-hover:bg-brand-700 text-white flex items-center justify-center transition-colors">
              <User className="w-5 h-5" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
