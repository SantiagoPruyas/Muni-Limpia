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
import { Modal } from './Modal';

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
        return <Truck className="w-4 h-4 text-brand-600" />;
      case 'report_update':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'schedule_change':
        return <Calendar className="w-4 h-4 text-info" />;
      default:
        return <Sparkles className="w-4 h-4 text-success" />;
    }
  };

  return (
    <Modal
      id="modal-notifications"
      labelledBy="modal-notifications-title"
      onClose={onClose}
      className="max-w-md max-h-[85vh]"
    >
      {(close) => (
        <>
          {/* Header */}
          <div className="p-4 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <h2 id="modal-notifications-title" className="font-display text-base font-bold text-ink">
                Avisos y Notificaciones
              </h2>
            </div>

            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <button
                  onClick={onMarkAllRead}
                  title="Marcar todas como leídas"
                  className="text-xs font-bold text-brand-600 hover:bg-surface-muted px-2 py-1 rounded transition-colors"
                >
                  Leídas
                </button>
              )}
              <button
                onClick={close}
                aria-label="Cerrar"
                className="w-8 h-8 rounded-full hover:bg-surface-muted flex items-center justify-center text-ink-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="p-4 overflow-y-auto flex flex-col gap-2.5">
            {notifications.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <Bell className="w-10 h-10 text-line-strong" />
                <span className="text-sm font-bold text-ink">
                  No tienes notificaciones pendientes
                </span>
                <span className="text-xs text-ink-muted">
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
                      close();
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    n.read
                      ? 'bg-surface-card border-line opacity-80'
                      : 'bg-brand-soft border-brand-500/30 shadow-sm'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-surface-card border border-line flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-ink">{n.title}</h4>
                      <span className="text-xs text-ink-muted">{n.time}</span>
                    </div>
                    <p className="text-xs text-ink-body mt-0.5 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-line bg-surface flex justify-between items-center text-xs">
              <span className="text-ink-muted">
                {notifications.filter((n) => !n.read).length} sin leer
              </span>
              <button
                onClick={onClearAll}
                className="text-danger font-bold hover:underline"
              >
                Borrar todas
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};
