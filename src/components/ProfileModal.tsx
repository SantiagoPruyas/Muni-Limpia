import React, { useState } from 'react';
import { X, User, Save, RotateCcw } from 'lucide-react';
import { CORRIENTES_NEIGHBORHOODS } from '../data/corrientesData';
import { UserProfile } from '../types';
import { Modal } from './Modal';
import { BrandLogo } from './BrandLogo';

interface ProfileModalProps {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  /** Vuelve la demo a su estado inicial (ver T09). */
  onResetDemo: () => void;
  onClose: () => void;
}

const INPUT_CLASS =
  'h-12 bg-surface-card border border-line-strong rounded-control px-3.5 text-base text-ink outline-none focus:border-brand-600';

const Switch: React.FC<{ id: string; label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({
  id,
  label,
  checked,
  onChange,
}) => (
  <div className="flex items-center justify-between gap-3 py-2">
    <span id={`${id}-label`} className="text-sm text-ink-body">
      {label}
    </span>
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={`${id}-label`}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-line-strong'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-elev-1 transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  </div>
);

export const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onSaveProfile, onResetDemo, onClose }) => {
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [confirmReset, setConfirmReset] = useState(false);
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSave = (e: React.FormEvent, close: () => void) => {
    e.preventDefault();
    onSaveProfile({ ...draft, name: draft.name.trim(), address: draft.address.trim() });
    close();
  };

  return (
    <Modal variant="sheet" id="modal-profile" labelledBy="modal-profile-title" onClose={onClose} className="max-w-md max-h-[90dvh]">
      {(close) => (
        <>
          {/* Header */}
          <div className="p-4 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 id="modal-profile-title" className="font-display font-bold text-lg text-ink leading-tight">
                  Tu perfil
                </h2>
                <span className="text-xs text-ink-muted">{profile.email}</span>
              </div>
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

          {/* Body */}
          <form onSubmit={(e) => handleSave(e, close)} className="p-5 flex flex-col gap-4 overflow-y-auto">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-name" className="text-sm font-semibold text-ink">
                Nombre
              </label>
              <input
                id="profile-name"
                type="text"
                value={draft.name}
                onChange={(e) => update('name', e.target.value)}
                autoComplete="name"
                required
                className={INPUT_CLASS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-neighborhood" className="text-sm font-semibold text-ink">
                Barrio
              </label>
              <select
                id="profile-neighborhood"
                value={draft.neighborhood}
                onChange={(e) => update('neighborhood', e.target.value)}
                className={INPUT_CLASS}
              >
                {CORRIENTES_NEIGHBORHOODS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="profile-address" className="text-sm font-semibold text-ink">
                Domicilio
              </label>
              <input
                id="profile-address"
                type="text"
                value={draft.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Ej.: Calle Junín 1200, Corrientes"
                autoComplete="street-address"
                aria-describedby="profile-address-hint"
                required
                className={INPUT_CLASS}
              />
              <span id="profile-address-hint" className="text-xs text-ink-muted">
                Lo usamos para avisarte cuando pasa el camión y para completar tus reclamos.
              </span>
            </div>

            <div role="group" aria-labelledby="profile-alerts-title" className="flex flex-col border-t border-line pt-3">
              <span id="profile-alerts-title" className="text-sm font-semibold text-ink">
                Avisos
              </span>
              <Switch
                id="profile-notifications"
                label="Avisos de paso del camión"
                checked={draft.notificationsEnabled}
                onChange={(v) => update('notificationsEnabled', v)}
              />
              <Switch
                id="profile-sound"
                label="Sonido y vibración"
                checked={draft.soundEnabled}
                onChange={(v) => update('soundEnabled', v)}
              />
            </div>

            {/* Nota institucional */}
            <div className="bg-surface-card p-3 rounded-control border border-line text-xs text-ink-muted flex items-start gap-3">
              <BrandLogo variant="escudo" className="h-7 w-auto shrink-0" />
              <span>
                Municipalidad de la Ciudad de Corrientes. Tus reclamos y datos se procesan según la ordenanza de Gestión
                Integral de Residuos Sólidos Urbanos (GIRSU).
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 h-12 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-control text-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={close}
                className="h-12 px-4 bg-surface-muted hover:bg-brand-500/15 text-ink font-semibold rounded-control text-sm transition-colors"
              >
                Cancelar
              </button>
            </div>

            {/* Restablecer demo */}
            <div className="border-t border-line pt-3 flex items-center justify-between gap-2 min-h-14 text-sm">
              {confirmReset ? (
                <>
                  <span className="text-ink">¿Volver la demo al inicio? Se pierden reclamos y avisos nuevos.</span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="h-10 px-3 rounded-control font-semibold text-ink-muted hover:bg-surface-muted"
                    >
                      No
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResetDemo();
                        close();
                      }}
                      className="h-10 px-3 rounded-control font-semibold text-white bg-danger hover:opacity-90"
                    >
                      Restablecer
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="h-10 px-2 -ml-2 rounded-control font-semibold text-ink-muted hover:bg-surface-muted flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restablecer demo
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </Modal>
  );
};
