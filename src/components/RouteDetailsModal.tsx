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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        id="modal-route-details"
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#e2e8f0] flex items-center justify-between bg-[#f7fafc]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#006b21] text-white flex items-center justify-center shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#006b21] uppercase tracking-wider">
                Detalles Oficiales de Ruta
              </span>
              <h2 className="text-lg font-black text-[#181c1e] font-['Public_Sans',sans-serif]">
                {zone.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white hover:bg-[#ebeef0] border border-[#e2e8f0] flex items-center justify-center text-[#555f71] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4">
          {/* General Information Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-[#f7fafc] p-3 rounded-xl border border-[#e2e8f0] flex flex-col">
              <span className="text-[10px] font-bold text-[#555f71] uppercase">Turno / Horario</span>
              <span className="text-xs font-bold text-[#181c1e] mt-0.5">{zone.shift} ({zone.timeWindow})</span>
            </div>
            <div className="bg-[#f7fafc] p-3 rounded-xl border border-[#e2e8f0] flex flex-col">
              <span className="text-[10px] font-bold text-[#555f71] uppercase">Frecuencia</span>
              <span className="text-xs font-bold text-[#181c1e] mt-0.5">{zone.frequency}</span>
            </div>
          </div>

          {/* Truck Unit & Crew details */}
          <div className="bg-[#006b21]/5 border border-[#006b21]/20 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#006b21]/30 text-[#006b21] flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#181c1e]">{zone.truckNumber || 'Camión Asignado #MUNI-18'}</span>
                <span className="text-[11px] text-[#555f71]">Chofer: {zone.truckDriver || 'Marcos Benítez'}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-white text-[#006b21] font-bold text-[10px] rounded-lg border border-[#006b21]/20">
              Operativo
            </span>
          </div>

          {/* Description */}
          <div className="text-xs text-[#3e4a3c] bg-[#f7fafc] p-3.5 rounded-xl border border-[#e2e8f0] leading-relaxed">
            {zone.description}
          </div>

          {/* Route Stops Timeline */}
          {zone.stops && zone.stops.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-bold text-[#181c1e] uppercase tracking-wider flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-[#006b21]" />
                Itinerario de Paradas y Recorrido
              </h3>

              <div className="flex flex-col gap-2 bg-[#f7fafc] p-3 rounded-2xl border border-[#e2e8f0]">
                {zone.stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className="flex items-start gap-3 relative pb-2 last:pb-0"
                  >
                    {/* Circle icon */}
                    <div className="pt-0.5">
                      {stop.done ? (
                        <div className="w-5 h-5 rounded-full bg-[#059669] text-white flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </div>
                      ) : stop.isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-[#006b21] text-white flex items-center justify-center animate-pulse ring-4 ring-[#81fc89]/50">
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white border-2 border-[#bdcab8] flex items-center justify-center text-[9px] font-bold text-[#555f71]">
                          {index + 1}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex items-center justify-between text-xs">
                      <div>
                        <span className={`font-semibold ${stop.isCurrent ? 'text-[#006b21] font-bold' : 'text-[#181c1e]'}`}>
                          {stop.name}
                        </span>
                        {stop.isCurrent && (
                          <span className="ml-2 px-1.5 py-0.5 bg-[#006b21] text-white text-[9px] font-bold rounded">
                            En curso ahora
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-[#555f71] shrink-0 ml-2">
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
              <span className="text-[11px] text-amber-800 mt-0.5">
                Sacar las bolsas hasta 15 minutos antes de la hora indicada para evitar roturas por animales y anegamientos en días de lluvia.
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#e2e8f0] bg-[#f7fafc] flex items-center gap-2">
          <button
            onClick={() => onExportSchedule(zone)}
            className="flex-1 h-12 bg-[#006b21] hover:bg-[#00872c] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
          >
            <DownloadCloud className="w-4 h-4" />
            Exportar a Google Drive
          </button>
          <button
            onClick={onClose}
            className="h-12 px-5 bg-white hover:bg-[#ebeef0] border border-[#e2e8f0] text-[#181c1e] font-bold text-xs rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
