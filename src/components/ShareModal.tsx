import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle } from 'lucide-react';
import { ZoneLocation } from '../types';
import { Modal } from './Modal';

interface ShareModalProps {
  zone: ZoneLocation | null;
  onClose: () => void;
}

const buildShareText = (zone: ZoneLocation) =>
  zone.type === 'Punto Verde'
    ? `♻️ Muni Limpia · ${zone.name} (${zone.neighborhood}) recibe reciclables: ${zone.frequency}, ${zone.timeWindow} hs. Llevá plásticos, cartón y vidrio limpios y secos.`
    : `🚛 Muni Limpia · En ${zone.name} (${zone.neighborhood}) pasa la recolección de ${zone.type.toLowerCase()}: ${zone.frequency}, ${zone.timeWindow} hs. Sacá tus residuos en ese horario y ayudanos a mantener limpia la ciudad.`;

export const ShareModal: React.FC<ShareModalProps> = ({ zone, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!zone) return null;

  const shareText = buildShareText(zone);
  // Solo la URL de la app, sin query ni hash.
  const shareUrl = `${window.location.origin}${window.location.pathname}`;
  const canNativeShare = typeof navigator.share === 'function';

  const handleNativeShare = async (close: () => void) => {
    try {
      await navigator.share({ title: 'Muni Limpia', text: shareText, url: shareUrl });
      close();
    } catch {
      // Cancelado por el usuario: el modal queda abierto con la opción de copiar.
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(url, '_blank', 'noopener');
  };

  return (
    <Modal id="modal-share" labelledBy="modal-share-title" onClose={onClose} className="max-w-sm">
      {(close) => (
        <>
          {/* Header */}
          <div className="p-4 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-brand-600" />
              <h2 id="modal-share-title" className="font-display text-lg font-bold text-ink">
                Compartir horario
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

          <div className="p-5 flex flex-col gap-4">
            <p className="bg-surface p-3.5 rounded-card border border-line text-sm text-ink-body leading-relaxed">
              {shareText}
            </p>

            <div className="flex flex-col gap-2">
              {canNativeShare ? (
                <button
                  type="button"
                  onClick={() => handleNativeShare(close)}
                  className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-control flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="w-full h-12 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-control flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Compartir por WhatsApp
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className="w-full h-12 bg-surface-muted hover:bg-brand-500/15 text-ink font-semibold text-sm rounded-control flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-brand-600" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar texto y enlace
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
