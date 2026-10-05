import React from 'react';
import { Bell, BellRing, Calendar, Clock, Navigation, Route, Share2, X } from 'lucide-react';
import { ZoneLocation } from '../types';
import { categoryMeta } from '../lib/categoryMeta';
import { formatDuration, nextService } from '../data/schedule';

interface MapZoneSheetProps {
  zone: ZoneLocation;
  isReminderActive: boolean;
  onClose: () => void;
  onToggleReminder: (zone: ZoneLocation) => void;
  onOpenRouteDetails: (zone: ZoneLocation) => void;
  onShare: (zone: ZoneLocation) => void;
}

/** Recuadro de estado: sale de nextService, nunca de `zone.status`. */
const serviceBadge = (zone: ZoneLocation) => {
  const service = nextService(zone);
  if (zone.type === 'Punto Verde') {
    return service.openNow
      ? { caption: 'Abierto ahora', value: `Cierra ${service.closesAt}`, live: true }
      : { caption: 'Cerrado', value: service.label, live: false };
  }
  if (service.state === 'en-curso') return { caption: 'Ahora', value: 'En curso', live: true };
  if (service.state === 'hoy') return { caption: 'Pasa en', value: formatDuration(service.startsInMin), live: true };
  return { caption: 'Próxima', value: service.label, live: false };
};

/** Hoja inferior única del mapa (§3.2): recolección o Punto Verde. */
export const MapZoneSheet: React.FC<MapZoneSheetProps> = ({
  zone,
  isReminderActive,
  onClose,
  onToggleReminder,
  onOpenRouteDetails,
  onShare,
}) => {
  const isGreenPoint = zone.type === 'Punto Verde';
  const meta = categoryMeta[zone.category];
  const badge = serviceBadge(zone);
  const place = zone.address === zone.name ? zone.neighborhood : `${zone.address} · ${zone.neighborhood}`;

  return (
    <section
      id="map-zone-sheet"
      aria-label={`Información de ${zone.name}`}
      className="bg-surface-card rounded-sheet shadow-elev-3 border border-line p-4 flex flex-col gap-3"
    >
      <div aria-hidden="true" className="w-9 h-1 rounded-full bg-line mx-auto" />

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted">
          <meta.Icon className="w-4 h-4" style={{ color: `var(--color-${meta.colorToken})` }} />
          {isGreenPoint ? `Punto Verde · ${meta.label}` : `${meta.label} · ${zone.shift}`}
        </span>
        <button
          onClick={onClose}
          aria-label="Cerrar información"
          className="w-11 h-11 -my-3 -mr-2 rounded-full flex items-center justify-center text-ink-muted hover:bg-surface-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-xl leading-[26px] font-bold text-ink">{zone.name}</h2>
          <p className="text-sm text-ink-muted mt-0.5">{place}</p>
        </div>
        <div
          id="map-sheet-status"
          className={`shrink-0 max-w-[9.5rem] rounded-card px-3 py-2 text-center ${
            badge.live ? 'bg-brand-600 text-white' : 'bg-surface-muted text-ink'
          }`}
        >
          <div className={`text-xs font-semibold ${badge.live ? 'text-white/90' : 'text-ink-muted'}`}>
            {badge.caption}
          </div>
          <div className="font-display text-lg leading-6 font-bold tabular-nums">{badge.value}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2 rounded-control bg-surface-muted px-3 py-2.5 text-sm text-ink-body">
          <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
          {zone.frequency}
        </div>
        <div className="flex items-center gap-2 rounded-control bg-surface-muted px-3 py-2.5 text-sm text-ink-body tabular-nums">
          <Clock className="w-4 h-4 text-brand-600 shrink-0" />
          {zone.start} – {zone.end}
        </div>
      </div>

      {isGreenPoint && zone.materialsAccepted && (
        <div>
          <h3 className="text-xs font-semibold text-ink-muted mb-1.5">Qué podés llevar</h3>
          <ul id="map-sheet-materials" className="flex flex-wrap gap-1.5">
            {zone.materialsAccepted.map((material) => (
              <li key={material} className="px-2.5 py-1 rounded-full bg-brand-soft text-ink-body text-xs font-medium">
                {material}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2">
        {isGreenPoint ? (
          <a
            id="btn-como-llegar"
            href={`https://www.google.com/maps/dir/?api=1&destination=${zone.coordinates.lat},${zone.coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-12 rounded-control bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            Cómo llegar
          </a>
        ) : (
          <>
            <button
              id="btn-avisarme"
              onClick={() => onToggleReminder(zone)}
              aria-pressed={isReminderActive}
              className={`flex-1 h-12 rounded-control font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors ${
                isReminderActive
                  ? 'bg-brand-soft text-brand-700 border border-brand-500'
                  : 'bg-brand-600 hover:bg-brand-700 text-white'
              }`}
            >
              {isReminderActive ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              {isReminderActive ? 'Aviso activado' : 'Avisame'}
            </button>
            <button
              id="btn-ver-recorrido"
              onClick={() => onOpenRouteDetails(zone)}
              className="h-12 px-3 rounded-control bg-surface-muted hover:bg-brand-soft text-brand-600 font-semibold text-sm flex items-center gap-1.5 transition-colors"
            >
              <Route className="w-4 h-4" />
              Ver recorrido
            </button>
          </>
        )}
        <button
          id="btn-share-zone"
          onClick={() => onShare(zone)}
          aria-label={`Compartir ${zone.name}`}
          className="w-12 h-12 shrink-0 rounded-control bg-surface-muted hover:bg-brand-soft text-ink flex items-center justify-center transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
