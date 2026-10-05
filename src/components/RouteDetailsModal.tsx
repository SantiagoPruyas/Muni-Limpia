import React from 'react';
import { X, Truck, Check, Download, Lightbulb, MapPin } from 'lucide-react';
import { ZoneLocation } from '../types';
import { Modal } from './Modal';
import { nextService } from '../data/schedule';

interface RouteDetailsModalProps {
  zone: ZoneLocation | null;
  onClose: () => void;
  onExportSchedule: (zone: ZoneLocation) => void;
}

const TIPS: Record<ZoneLocation['type'], string> = {
  'Residuos Comunes':
    'Sacá las bolsas como mucho 15 minutos antes del horario. Así evitás que los animales las rompan y que tapen los desagües si llueve.',
  Reciclables: 'Sacá los reciclables limpios, secos y separados de los residuos comunes.',
  'Poda y Escombros':
    'Sacá las ramas atadas o embolsadas el día del retiro, sin tapar la vereda ni los desagües.',
  'Punto Verde': 'Llevá los materiales limpios, secos y separados por tipo.',
};

export const RouteDetailsModal: React.FC<RouteDetailsModalProps> = ({
  zone,
  onClose,
  onExportSchedule,
}) => {
  if (!zone) return null;

  const service = nextService(zone);
  const stops = zone.stops ?? [];

  return (
    <Modal
      id="modal-route-details"
      labelledBy="modal-route-details-title"
      onClose={onClose}
      className="max-w-lg max-h-[90dvh]"
    >
      {(close) => (
        <>
          <div className="p-5 border-b border-line flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-semibold text-brand-600">Detalle de ruta</span>
              <h2 id="modal-route-details-title" className="font-display text-xl font-bold text-ink">
                {zone.name}
              </h2>
              <p className="flex items-center gap-1 text-sm text-ink-muted mt-0.5">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
                {zone.address === zone.name ? zone.neighborhood : `${zone.address} · ${zone.neighborhood}`}
              </p>
            </div>

            <button
              onClick={close}
              aria-label="Cerrar"
              className="w-11 h-11 -mr-2 -mt-2 shrink-0 rounded-full hover:bg-surface-muted flex items-center justify-center text-ink-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-2 bg-surface rounded-control p-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-ink-muted">Días</dt>
                <dd className="font-semibold text-ink">{zone.frequency}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-ink-muted">Horario · {zone.shift}</dt>
                <dd className="font-semibold text-ink tabular-nums">{zone.timeWindow}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs font-medium text-ink-muted">Próximo servicio</dt>
                <dd className="font-semibold text-ink tabular-nums">{service.label}</dd>
              </div>
            </dl>

            {zone.truckNumber && (
              <div className="bg-brand-soft rounded-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-control bg-surface-card text-brand-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="text-sm font-semibold text-ink">{zone.truckNumber}</span>
                  {zone.truckDriver && <span className="text-sm text-ink-muted">{zone.truckDriver}</span>}
                </div>
                {service.state === 'en-curso' && (
                  <span className="shrink-0 px-2.5 py-1 bg-brand-600 text-white font-semibold text-xs rounded-full">
                    Operativo
                  </span>
                )}
              </div>
            )}

            <p className="text-sm text-ink-body leading-relaxed">{zone.description}</p>

            {zone.materialsAccepted && zone.materialsAccepted.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label="Materiales que recibe">
                {zone.materialsAccepted.map((mat) => (
                  <li key={mat} className="px-2.5 py-1 bg-brand-soft text-brand-700 rounded-full text-xs font-medium">
                    {mat}
                  </li>
                ))}
              </ul>
            )}

            {stops.length > 0 && (
              <section aria-labelledby="route-stops-title" className="flex flex-col gap-3">
                <h3 id="route-stops-title" className="font-display text-base font-bold text-ink">
                  Recorrido
                </h3>

                <ol className="flex flex-col">
                  {stops.map((stop, index) => (
                    <li
                      key={stop.id}
                      aria-current={stop.isCurrent ? 'step' : undefined}
                      className="relative flex items-start gap-3 pb-4 last:pb-0"
                    >
                      {/* Línea conectora hasta la parada siguiente */}
                      {index < stops.length - 1 && (
                        <span
                          className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${stop.done ? 'bg-brand-500' : 'bg-line-strong'}`}
                          aria-hidden="true"
                        />
                      )}

                      {stop.done ? (
                        <span className="relative w-6 h-6 shrink-0 rounded-full bg-brand-500 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" strokeWidth={3} aria-hidden="true" />
                          <span className="sr-only">Completada:</span>
                        </span>
                      ) : stop.isCurrent ? (
                        <span className="relative w-6 h-6 shrink-0 rounded-full bg-surface-card border-2 border-brand-600 ring-4 ring-brand-500/20 flex items-center justify-center">
                          <span className="w-2.5 h-2.5 rounded-full bg-brand-600" />
                        </span>
                      ) : (
                        <span className="relative w-6 h-6 shrink-0 rounded-full bg-surface-card border-2 border-line-strong flex items-center justify-center text-xs font-semibold text-ink-muted">
                          {index + 1}
                        </span>
                      )}

                      <div className="flex-1 min-w-0 flex items-start justify-between gap-2 text-sm pt-0.5">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className={stop.isCurrent ? 'font-semibold text-ink' : stop.done ? 'text-ink-muted' : 'text-ink-body'}>
                            {stop.name}
                          </span>
                          {stop.isCurrent && (
                            <span className="px-2 py-0.5 bg-brand-soft text-brand-700 text-xs font-semibold rounded-full">
                              Parada actual
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-ink-muted tabular-nums">{stop.time}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <div className="bg-warning/10 rounded-control p-3 flex items-start gap-2.5 text-sm text-ink-body">
              <Lightbulb className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
              <p>{TIPS[zone.type]}</p>
            </div>
          </div>

          <div className="p-4 border-t border-line flex items-center gap-2">
            <button
              onClick={() => onExportSchedule(zone)}
              className="flex-1 h-12 bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm rounded-control flex items-center justify-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Descargar horario
            </button>
            <button
              onClick={close}
              className="h-12 px-5 bg-surface-muted hover:bg-brand-soft text-ink font-semibold text-sm rounded-control transition-colors"
            >
              Cerrar
            </button>
          </div>
        </>
      )}
    </Modal>
  );
};
