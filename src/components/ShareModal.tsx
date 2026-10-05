import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Send } from 'lucide-react';
import { ZoneLocation } from '../types';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        id="modal-share"
        className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f7fafc]">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#006b21]" />
            <h2 className="text-base font-bold text-[#181c1e]">
              Compartir Horario
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#ebeef0] flex items-center justify-center text-[#555f71]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="bg-[#f7fafc] p-3.5 rounded-2xl border border-[#e2e8f0] text-xs text-[#3e4a3c] leading-relaxed">
            {shareText}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleWhatsApp}
              className="w-full h-11 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Compartir por WhatsApp
            </button>

            <button
              onClick={handleCopy}
              className="w-full h-11 bg-[#f1f4f6] hover:bg-[#e5e9eb] text-[#181c1e] font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#006b21]" />
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
      </div>
    </div>
  );
};
