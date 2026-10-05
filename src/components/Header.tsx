import React from 'react';
import { Bell, User, Recycle } from 'lucide-react';
import { NotificationItem, UserProfile } from '../types';

interface HeaderProps {
  notifications: NotificationItem[];
  profile: UserProfile;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  profile,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header
      id="muni-header"
      className="fixed top-0 w-full z-40 bg-[#f7fafc]/90 backdrop-blur-md border-b border-[#e2e8f0]/80 shadow-[0_1px_8px_rgba(0,0,0,0.03)]"
    >
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-[#006b21] flex items-center justify-center shadow-sm text-white transition-transform active:scale-95">
            <Recycle className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-[22px] text-[#006b21] tracking-tight leading-none font-['Public_Sans',sans-serif]">
              Muni Limpia
            </span>
            <span className="text-[10px] text-[#555f71] font-medium tracking-wide uppercase">
              Corrientes Ciudad
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {/* Notification button with badge */}
          <button
            id="btn-notifications"
            onClick={onOpenNotifications}
            aria-label="Notificaciones"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#ebeef0] text-[#3e4a3c] transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#DC2626] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Profile button */}
          <button
            id="btn-profile"
            onClick={onOpenProfile}
            aria-label="Perfil y Configuración"
            className="w-9 h-9 rounded-full bg-[#006b21] hover:bg-[#00872c] text-white flex items-center justify-center transition-all shadow-sm active:scale-95 relative"
          >
            <User className="w-4 h-4" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#81fc89] border-2 border-white rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
};
