import React from 'react';
import {
  X,
  Truck,
  User,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  DownloadCloud,
  Navigation,
  ShieldCheck,
  MapPin
} from 'lucide-react';
import { ZoneLocation } from '../types';
import { Modal } from './Modal';

interface RouteDetailsModalProps {
  zone: ZoneLocation | null;
  onClose: () => void;
  onExportSchedule: (zone: ZoneLocation) => void;
}

export const RouteDetailsModal: React.FC<RouteDetailsModalProps> = ({
  zone,
  onClose,
  onExportSchedule,
}) => {
  if (!zone) return null;

  return (
    <Modal
      id="modal-route-details"
      labelledBy="modal-route-details-title"
      onClose={onClose}
      className="max-w-lg max-h-[90vh]"
    >
      {(close) => (
        <>
          {/* Modal Header */}
          <div className="p-5 border-b border-line flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                  Detalles Oficiales de Ruta
                </span>
                <h2 id="modal-route-details-title" className="font-display text-lg font-extrabold text-ink">
                  {zone.name}
                </h2>
              </div>
            </div>

            <button
              onClick={close}
              aria-label="Cerrar"
              className="w-9 h-9 rounded-full bg-surface-card hover:bg-surface-muted border border-line flex items-center justify-center text-ink-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Scrollable Body */}
          <div className="p-5 overflow-y-auto flex flex-col gap-4">
            {/* General Information Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-surface p-3 rounded-xl border border-line flex flex-col">
                <span className="text-xs font-bold text-ink-muted uppercase">Turno / Horario</span>
                <span className="text-xs font-bold text-ink mt-0.5">{zone.shift} ({zone.timeWindow})</span>
              </div>
              <div className="bg-surface p-3 rounded-xl border border-line flex flex-col">
                <span className="text-xs font-bold text-ink-muted uppercase">Frecuencia</span>
                <span className="text-xs font-bold text-ink mt-0.5">{zone.frequency}</span>
              </div>
            </div>

            {/* Truck Unit & Crew details */}
            <div className="bg-brand-soft border border-brand-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-card border border-brand-500/30 text-brand-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-ink">{zone.truckNumber || 'Camión Asignado #MUNI-18'}</span>
                  <span className="text-xs text-ink-muted">Chofer: {zone.truckDriver || 'Marcos Benítez'}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-surface-card text-brand-600 font-bold text-xs rounded-lg border border-brand-500/20">
                Operativo
              </span>
            </div>

            {/* Description */}
            <div className="text-xs text-ink-body bg-surface p-3.5 rounded-xl border border-line leading-relaxed">
              {zone.description}
            </div>

            {/* Route Stops Timeline */}
            {zone.stops && zone.stops.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-brand-600" />
                  Itinerario de Paradas y Recorrido
                </h3>

                <div className="flex flex-col gap-2 bg-surface p-3 rounded-2xl border border-line">
                  {zone.stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className="flex items-start gap-3 relative pb-2 last:pb-0"
                    >
                      {/* Circle icon */}
                      <div className="pt-0.5">
                        {stop.done ? (
                          <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                        ) : stop.isCurrent ? (
                          <div className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center animate-pulse ring-4 ring-brand-500/30">
                            <span className="w-2 h-2 bg-white rounded-full"></span>
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-surface-card border-2 border-line-strong flex items-center justify-center text-xs font-bold text-ink-muted">
                            {index + 1}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex items-center justify-between text-xs">
                        <div>
                          <span className={`font-semibold ${stop.isCurrent ? 'text-brand-600 font-bold' : 'text-ink'}`}>
                            {stop.name}
                          </span>
                          {stop.isCurrent && (
                            <span className="ml-2 px-1.5 py-0.5 bg-brand-600 text-white text-xs font-bold rounded">
                              En curso ahora
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-ink-muted shrink-0 ml-2">
                          {stop.time} hs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Citizen Rules Reminder */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-bold">Recomendación para vecinos:</span>
                <span className="text-xs text-amber-800 mt-0.5">
                  Sacar las bolsas hasta 15 minutos antes de la hora indicada para evitar roturas por animales y anegamientos en días de lluvia.
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-line bg-surface flex items-center gap-2">
            <button
              onClick={() => onExportSchedule(zone)}
              className="flex-1 h-12 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
            >
              <DownloadCloud className="w-4 h-4" />
              Exportar a Google Drive
            </button>
            <button
              onClick={close}
              className="h-12 px-5 bg-surface-card hover:bg-surface-muted border border-line text-ink font-bold text-xs rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};
