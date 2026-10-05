import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Send } from 'lucide-react';
import { ZoneLocation } from '../types';
import { Modal } from './Modal';

interface ShareModalProps {
  zone: ZoneLocation | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ zone, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!zone) return null;

  const shareText = `🚛 Muni Limpia Corrientes: En ${zone.name} (${zone.neighborhood}), la recolección de ${zone.type} es ${zone.frequency} en el horario de ${zone.timeWindow}. ¡Mantengamos limpia nuestra ciudad!`;
  const shareUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `${shareText}\n${shareUrl}`
    )}`;
    window.open(url, '_blank');
  };

  return (
    <Modal id="modal-share" labelledBy="modal-share-title" onClose={onClose} className="max-w-sm">
      {(close) => (
        <>
          {/* Header */}
          <div className="p-4 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-brand-600" />
              <h2 id="modal-share-title" className="font-display text-base font-bold text-ink">
                Compartir Horario
              </h2>
            </div>
            <button
              onClick={close}
              aria-label="Cerrar"
              className="w-8 h-8 rounded-full hover:bg-surface-muted flex items-center justify-center text-ink-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-4">
            <div className="bg-surface p-3.5 rounded-2xl border border-line text-xs text-ink-body leading-relaxed">
              {shareText}
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleWhatsApp}
                className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Compartir por WhatsApp
              </button>

              <button
                onClick={handleCopy}
                className="w-full h-12 bg-surface-muted hover:bg-brand-500/15 text-ink font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-brand-600" />
                    ¡Copiado al portapapeles!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar Texto y Enlace
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
};
