import React from 'react';
import { CheckCircle2, AlertCircle, Info, DownloadCloud, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error' | 'drive';
  title: string;
  message?: string;
  linkUrl?: string;
  linkLabel?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-18 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-white border border-[#e2e8f0] shadow-2xl rounded-2xl p-3.5 flex items-start gap-3 animate-slideDown"
        >
          <div className="pt-0.5 shrink-0">
            {t.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-[#059669]" />
            )}
            {t.type === 'drive' && (
              <DownloadCloud className="w-5 h-5 text-[#006b21]" />
            )}
            {t.type === 'info' && (
              <Info className="w-5 h-5 text-[#2563EB]" />
            )}
            {t.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-[#DC2626]" />
            )}
          </div>

          <div className="flex-1 flex flex-col">
            <span className="text-xs font-bold text-[#181c1e]">{t.title}</span>
            {t.message && (
              <span className="text-[11px] text-[#555f71] mt-0.5 leading-snug">
                {t.message}
              </span>
            )}
            {t.linkUrl && (
              <a
                href={t.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-[#006b21] hover:underline mt-1 inline-flex items-center gap-1"
              >
                {t.linkLabel || 'Abrir en Google Drive'}
              </a>
            )}
          </div>

          <button
            onClick={() => onDismiss(t.id)}
            className="text-[#555f71] hover:text-[#181c1e] p-1 -mr-1 -mt-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
