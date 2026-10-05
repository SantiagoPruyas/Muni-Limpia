import React, { useState } from 'react';
import { X, User, MapPin, Bell, Save, Shield, Heart } from 'lucide-react';
import { CORRIENTES_NEIGHBORHOODS } from '../data/corrientesData';
import { UserProfile } from '../types';
import { Modal } from './Modal';

interface ProfileModalProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onSaveProfile,
  onClose,
}) => {
  const [addressInput, setAddressInput] = useState(profile.address);
  const [notifSound, setNotifSound] = useState(true);

  const handleSave = (e: React.FormEvent, close: () => void) => {
    e.preventDefault();
    if (!addressInput.trim()) return;
    onSaveProfile({ ...profile, address: addressInput });
    close();
  };

  return (
    <Modal variant="sheet" labelledBy="modal-profile-title" onClose={onClose} className="max-w-md">
      {(close) => (
        <>
          {/* Header */}
          <div className="p-4 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h2 id="modal-profile-title" className="font-display font-extrabold text-base text-ink">
                  Perfil Ciudadano
                </h2>
                <span className="text-xs text-ink-muted">Muni Limpia • Ciudad de Corrientes</span>
              </div>
            </div>

            <button
              onClick={close}
              aria-label="Cerrar"
              className="w-8 h-8 rounded-full bg-surface-muted hover:bg-brand-500/15 flex items-center justify-center text-ink-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={(e) => handleSave(e, close)} className="p-5 flex flex-col gap-4">

            {/* Address input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span>Mi Domicilio Habitual</span>
              </label>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Ej: Calle Junín 1200, Corrientes"
                className="bg-surface border border-line rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-ink outline-none focus:border-brand-600"
                required
              />
              <span className="text-xs text-ink-muted">
                Utilizado para calcular las alertas de paso de camión y horarios de recolección en tu cuadra.
              </span>
            </div>

            {/* Notification toggles */}
            <div className="flex flex-col gap-2">
              <label className="flex items-center justify-between text-xs text-ink p-2.5 rounded-xl bg-surface border border-line">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-600" />
                  <span>Sonido y vibración para alertas de camión</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifSound}
                  onChange={(e) => setNotifSound(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-600"
                />
              </label>
            </div>

            {/* Civic Info Note */}
            <div className="bg-surface p-3 rounded-xl border border-line text-xs text-ink-muted flex items-start gap-2">
              <Shield className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <span>
                Municipalidad de la Ciudad de Corrientes. Todos los reclamos y datos son procesados bajo la Ordenanza de Gestión Integral de Residuos Urbanos (GIRSU).
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 h-12 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>

              <button
                type="button"
                onClick={close}
                className="h-12 bg-surface-muted hover:bg-brand-500/15 text-ink font-bold px-4 rounded-xl text-xs transition-all"
              >
                Cerrar
              </button>
            </div>

          </form>
        </>
      )}
    </Modal>
  );
};
