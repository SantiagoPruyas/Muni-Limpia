import React, { useState } from 'react';
import { X, Bell, CheckCheck, Truck, ClipboardCheck, Recycle, Calendar } from 'lucide-react';
import { NotificationItem } from '../types';
import { Modal } from './Modal';

interface NotificationsModalProps {
  notifications: NotificationItem[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  /** Marca la notificación como leída y, si tiene zoneId, abre la zona en el mapa. */
  onOpenNotification: (notification: NotificationItem) => void;
}

const TYPE_ICON: Record<NotificationItem['type'], { Icon: typeof Bell; className: string }> = {
  truck_nearby: { Icon: Truck, className: 'text-brand-600' },
  schedule_change: { Icon: Calendar, className: 'text-info' },
  report_update: { Icon: ClipboardCheck, className: 'text-warning' },
  eco_tip: { Icon: Recycle, className: 'text-cat-reciclables' },
};

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  onClose,
  onMarkAllRead,
  onClearAll,
  onOpenNotification,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Modal
      id="modal-notifications"
      labelledBy="modal-notifications-title"
      onClose={onClose}
      className="max-w-md max-h-[85dvh]"
    >
      {(close) => (
        <>
          {/* Header */}
          <div className="p-4 border-b border-line flex items-center justify-between gap-2 bg-surface">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <h2 id="modal-notifications-title" className="font-display text-lg font-bold text-ink">
                Notificaciones
              </h2>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="w-11 h-11 -mr-2 rounded-full hover:bg-surface-muted flex items-center justify-center text-ink-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="p-4 overflow-y-auto flex flex-col gap-2.5">
            {notifications.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                <Bell className="w-10 h-10 text-line-strong" />
                <span className="text-sm font-semibold text-ink">No tenés notificaciones</span>
                <span className="text-sm text-ink-muted">
                  Te avisamos cuando el camión esté cerca de tu domicilio.
                </span>
              </div>
            ) : (
              notifications.map((n) => {
                const { Icon, className } = TYPE_ICON[n.type];
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      onOpenNotification(n);
                      if (n.zoneId) close();
                    }}
                    className={`w-full text-left p-3.5 rounded-card border transition-colors flex items-start gap-3 ${
                      n.zoneId ? 'cursor-pointer hover:border-brand-500/50' : 'cursor-default'
                    } ${n.read ? 'bg-surface-card border-line' : 'bg-brand-soft border-brand-500/30'}`}
                  >
                    <span className="w-8 h-8 rounded-control bg-surface-card border border-line flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className={`w-4 h-4 ${className}`} />
                    </span>
                    <span className="flex-1 min-w-0 flex flex-col">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {!n.read && <span className="sr-only">Sin leer: </span>}
                          {n.title}
                        </span>
                        <span className="text-xs text-ink-muted whitespace-nowrap pt-0.5">{n.time}</span>
                      </span>
                      <span className="text-sm text-ink-body mt-0.5 leading-snug">{n.message}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-line bg-surface flex justify-between items-center gap-2 text-sm min-h-16">
              {confirmClear ? (
                <>
                  <span className="text-ink font-medium">¿Borrar todas las notificaciones?</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="h-10 px-3 rounded-control font-semibold text-ink-muted hover:bg-surface-muted"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClearAll();
                        setConfirmClear(false);
                      }}
                      className="h-10 px-3 rounded-control font-semibold text-white bg-danger hover:opacity-90"
                    >
                      Borrar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onMarkAllRead}
                    disabled={unreadCount === 0}
                    className="h-10 px-2 -ml-2 rounded-control font-semibold text-brand-600 hover:bg-surface-muted flex items-center gap-1.5 disabled:text-ink-muted disabled:hover:bg-transparent"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Marcar todo como leído
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="h-10 px-2 -mr-2 rounded-control font-semibold text-danger hover:bg-danger/10"
                  >
                    Borrar todas
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  );
};
