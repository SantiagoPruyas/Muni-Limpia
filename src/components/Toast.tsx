import React from 'react';
import { CheckCircle2, AlertCircle, Info, Loader2, X } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { APP_COLUMN } from '../lib/layout';

export interface ToastMessage {
  id: string;
  /** 'loading' no se cierra solo: se transforma con updateToast. */
  type: 'success' | 'info' | 'error' | 'loading';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  // La región viva existe siempre: si se monta junto con el toast, los lectores no lo anuncian.
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-18 inset-x-0 z-50 ${APP_COLUMN} px-4 flex flex-col gap-2 pointer-events-none`}
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <m.div
            key={t.id}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }}
            exit={{ opacity: 0, y: -12, transition: { duration: 0.15, ease: 'easeIn' } }}
            className="pointer-events-auto bg-surface-card border border-line shadow-elev-3 rounded-2xl p-3.5 flex items-start gap-3"
          >
            <div className="pt-0.5 shrink-0">
              {t.type === 'success' && (
                <CheckCircle2 className="w-5 h-5 text-success" />
              )}
              {t.type === 'loading' && (
                <Loader2 className="w-5 h-5 text-info animate-spin" />
              )}
              {t.type === 'info' && (
                <Info className="w-5 h-5 text-info" />
              )}
              {t.type === 'error' && (
                <AlertCircle className="w-5 h-5 text-danger" />
              )}
            </div>
  
            <div className="flex-1 flex flex-col">
              <span className="text-xs font-semibold text-ink">{t.title}</span>
              {t.message && (
                <span className="text-xs text-ink-muted mt-0.5 leading-snug">
                  {t.message}
                </span>
              )}
            </div>
  
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Cerrar aviso"
              className="text-ink-muted hover:text-ink p-1 -mr-1 -mt-1"
            >
              <X className="w-4 h-4" />
            </button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
