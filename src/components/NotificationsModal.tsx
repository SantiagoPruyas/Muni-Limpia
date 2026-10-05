import React from 'react';
import {
  X,
  Bell,
  CheckCheck,
  Truck,
  AlertTriangle,
  Sparkles,
  Calendar,
  Trash2
} from 'lucide-react';
import { NotificationItem, ZoneLocation } from '../types';

interface NotificationsModalProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onSelectZoneById: (zoneId: string) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
  onClearAll,
  onSelectZoneById,
}) => {
  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'truck_nearby':
        return <Truck className="w-4 h-4 text-[#006b21]" />;
      case 'report_update':
        return <AlertTriangle className="w-4 h-4 text-[#d97706]" />;
      case 'schedule_change':
        return <Calendar className="w-4 h-4 text-[#2563eb]" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#059669]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        id="modal-notifications"
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f7fafc]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#006b21]/10 text-[#006b21] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#181c1e]">
              Avisos y Notificaciones
            </h2>
          </div>

          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={onMarkAllRead}
                title="Marcar todas como leídas"
                className="text-xs font-bold text-[#006b21] hover:bg-[#ebeef0] px-2 py-1 rounded transition-colors"
              >
                Leídas
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[#ebeef0] flex items-center justify-center text-[#555f71]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto flex flex-col gap-2.5">
          {notifications.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
              <Bell className="w-10 h-10 text-[#bdcab8]" />
              <span className="text-sm font-bold text-[#181c1e]">
                No tienes notificaciones pendientes
              </span>
              <span className="text-xs text-[#555f71]">
                Te avisaremos cuando el camión esté cerca de tu domicilio.
              </span>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  if (n.zoneId) {
                    onSelectZoneById(n.zoneId);
                    onClose();
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  n.read
                    ? 'bg-white border-[#e2e8f0] opacity-80'
                    : 'bg-[#f7fff1] border-[#006b21]/30 shadow-sm'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center shrink-0 mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#181c1e]">{n.title}</h4>
                    <span className="text-[10px] text-[#555f71]">{n.time}</span>
                  </div>
                  <p className="text-xs text-[#3e4a3c] mt-0.5 leading-relaxed">
                    {n.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t border-[#e2e8f0] bg-[#f7fafc] flex justify-between items-center text-xs">
            <span className="text-[#555f71]">
              {notifications.filter((n) => !n.read).length} sin leer
            </span>
            <button
              onClick={onClearAll}
              className="text-[#DC2626] font-bold hover:underline"
            >
              Borrar todas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
