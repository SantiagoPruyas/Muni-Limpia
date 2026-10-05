import React, { useState } from 'react';
import { X, User, MapPin, Bell, Cloud, Save, CheckCircle2, Shield, Heart } from 'lucide-react';
import { CORRIENTES_NEIGHBORHOODS } from '../data/corrientesData';

interface ProfileModalProps {
  userAddress: string;
  onUpdateAddress: (newAddress: string) => void;
  onClose: () => void;
  onShowToast: (message: string, type?: 'success' | 'info') => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  userAddress,
  onUpdateAddress,
  onClose,
  onShowToast
}) => {
  const [addressInput, setAddressInput] = useState(userAddress);
  const [notifSound, setNotifSound] = useState(true);
  const [driveAutoSync, setDriveAutoSync] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;
    onUpdateAddress(addressInput);
    onShowToast('Dirección y preferencias guardadas', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f7fafc]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#006b21] text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-['Public_Sans'] font-extrabold text-base text-[#181c1e]">
                Perfil Ciudadano
              </h2>
              <span className="text-[10px] text-[#555f71]">Muni Limpia • Ciudad de Corrientes</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#ebeef0] hover:bg-[#e0e3e5] flex items-center justify-center text-[#555f71]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
          
          {/* Address input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#555f71] flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#006b21]" />
              <span>Mi Domicilio Habitual</span>
            </label>
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Ej: Calle Junín 1200, Corrientes"
              className="bg-[#f7fafc] border border-[#e2e8f0] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-[#181c1e] outline-none focus:border-[#006b21]"
              required
            />
            <span className="text-[10px] text-[#555f71]">
              Utilizado para calcular las alertas de paso de camión y horarios de recolección en tu cuadra.
            </span>
          </div>

          {/* Google Drive Status */}
          <div className="bg-[#f1f4f6] rounded-2xl p-3.5 border border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#006b21]/10 text-[#006b21] flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#181c1e]">Google Drive Conectado</div>
                <div className="text-[10px] text-[#059669] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Sincronización activa</span>
                </div>
              </div>
            </div>

            <input
              type="checkbox"
              checked={driveAutoSync}
              onChange={(e) => setDriveAutoSync(e.target.checked)}
              className="w-4 h-4 text-[#006b21] rounded accent-[#006b21]"
            />
          </div>

          {/* Notification toggles */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between text-xs text-[#181c1e] p-2.5 rounded-xl bg-[#f7fafc] border border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#006b21]" />
                <span>Sonido y vibración para alertas de camión</span>
              </div>
              <input
                type="checkbox"
                checked={notifSound}
                onChange={(e) => setNotifSound(e.target.checked)}
                className="w-4 h-4 text-[#006b21] rounded accent-[#006b21]"
              />
            </label>
          </div>

          {/* Civic Info Note */}
          <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0] text-[11px] text-[#555f71] flex items-start gap-2">
            <Shield className="w-4 h-4 text-[#006b21] flex-shrink-0 mt-0.5" />
            <span>
              Municipalidad de la Ciudad de Corrientes. Todos los reclamos y datos son procesados bajo la Ordenanza de Gestión Integral de Residuos Urbanos (GIRSU).
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-[#006b21] hover:bg-[#00872c] text-white font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-[#ebeef0] hover:bg-[#e0e3e5] text-[#181c1e] font-bold py-3 px-4 rounded-xl text-xs transition-all"
            >
              Cerrar
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
