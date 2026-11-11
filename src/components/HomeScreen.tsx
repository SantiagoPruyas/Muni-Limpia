import React from 'react';
import {
  MapPin,
  Bell,
  BellRing,
  Download,
  ArrowRight,
  ChevronRight,
  Megaphone,
  CalendarDays,
  type LucideIcon,
} from 'lucide-react';
import { ZoneLocation, IncidentReport, UserProfile, NavTab } from '../types';
import { nextService } from '../data/schedule';
import { categoryMeta } from '../lib/categoryMeta';
import { reportStatusBadge } from '../lib/reportStatusMeta';
import { BrandLogo } from './BrandLogo';

interface HomeScreenProps {
  currentZone: ZoneLocation;
  reports: IncidentReport[];
  profile: UserProfile;
  onNavigate: (tab: NavTab) => void;
  onOpenGreenPoints: () => void;
  onOpenReportHistory: () => void;
  onToggleReminder: (zone: ZoneLocation) => void;
  onExportSchedule: (zone: ZoneLocation) => void;
  isReminderActive: boolean;
}

interface Shortcut {
  id: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
  color: string;
  onClick: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentZone,
  reports,
  profile,
  onNavigate,
  onOpenGreenPoints,
  onOpenReportHistory,
  onToggleReminder,
  onExportSchedule,
  isReminderActive,
}) => {
  const activeReports = reports.filter((r) => r.status !== 'resuelto');
  const firstName = profile.name.split(' ')[0] || 'vecina/o';

  // Estado, etiqueta y valor de la pastilla salen de nextService (zone.status es estático).
  const service = nextService(currentZone);
  const isGreenPoint = currentZone.type === 'Punto Verde';
  const isLive = service.state === 'en-curso';
  const statusText = isGreenPoint ? (isLive ? 'Abierto' : 'Cerrado') : isLive ? 'En camino' : 'Programado';
  const pillOverline = isGreenPoint
    ? isLive ? `Hasta las ${service.closesAt}` : 'Próxima apertura'
    : isLive ? 'Ahora' : service.state === 'hoy' ? 'Hoy' : 'Próxima';

  const greenPoints = categoryMeta['puntos-verdes'];
  const shortcuts: Shortcut[] = [
    { id: 'mapa', title: 'Mapa en vivo', desc: 'Ubicá camiones, zonas y Puntos Verdes', Icon: MapPin, color: 'var(--color-brand-600)', onClick: () => onNavigate('mapa') },
    { id: 'reportar', title: 'Reportar reclamo', desc: 'Microbasurales, ramas o contenedores', Icon: Megaphone, color: 'var(--color-brand-600)', onClick: () => onNavigate('reportar') },
    { id: 'horarios', title: 'Horarios', desc: 'Turnos de mañana, tarde y noche', Icon: CalendarDays, color: 'var(--color-brand-600)', onClick: () => onNavigate('horarios') },
    { id: 'reciclaje', title: greenPoints.label, desc: 'Plástico, cartón, vidrio, latas y pilas', Icon: greenPoints.Icon, color: `var(--color-${greenPoints.colorToken})`, onClick: onOpenGreenPoints },
  ];

  const guide = [
    { meta: categoryMeta['residuos-comunes'], title: 'Bolsa negra · Residuos comunes', desc: 'Restos de comida, pañales y envoltorios sucios. Sacala en el horario de tu zona.' },
    { meta: categoryMeta.reciclables, title: 'Bolsa verde · Reciclables', desc: 'Plástico seco, cartón limpio, latas y vidrio. Llevala a un Punto Verde.' },
  ];

  return (
    <div id="home-screen" className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24 flex flex-col gap-6">
      {/* Saludo */}
      <div>
        <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
          Municipalidad de Corrientes
        </span>
        <h1 className="font-display text-[26px] leading-8 font-extrabold text-ink">Hola, {firstName}</h1>
        <p id="home-profile-address" className="flex items-center gap-1 text-sm text-ink-muted mt-0.5">
          <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
          <span>
            {profile.address} · {profile.neighborhood}
          </span>
        </p>
      </div>

      {/* Hero: próxima recolección */}
      <section
        id="hero-collection-card"
        aria-labelledby="hero-title"
        className="bg-brand-700 text-white rounded-sheet p-5 shadow-elev-2 flex flex-col gap-4"
      >
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/15 rounded-full text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-brand-accent' : 'bg-white/60'}`} aria-hidden="true" />
            {statusText}
          </span>
          <h2 id="hero-title" className="font-display text-xl leading-[26px] font-bold mt-3">
            {isGreenPoint ? 'Horario de atención' : 'Próxima recolección'}
          </h2>
          <p className="text-sm text-white/90">
            {isGreenPoint ? currentZone.name : `${categoryMeta[currentZone.category].label} en ${currentZone.name}`}
          </p>
        </div>

        <div id="hero-countdown" className="bg-surface-card text-brand-700 rounded-card px-4 py-3">
          <span className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">{pillOverline}</span>
          <span className="block font-display text-xl leading-[26px] font-extrabold tabular-nums">{service.label}</span>
        </div>

        <dl className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 rounded-control px-3 py-2">
            <dt className="text-xs text-white/80">Horario</dt>
            <dd className="text-sm font-semibold tabular-nums">{currentZone.timeWindow}</dd>
          </div>
          <div className="bg-white/10 rounded-control px-3 py-2">
            <dt className="text-xs text-white/80">Días</dt>
            <dd className="text-sm font-semibold">{currentZone.frequency}</dd>
          </div>
        </dl>

        <div className="flex items-center gap-2">
          <button
            id="btn-home-reminder"
            onClick={() => onToggleReminder(currentZone)}
            aria-pressed={isReminderActive}
            className="flex-1 h-12 rounded-control bg-surface-card text-brand-700 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-brand-soft transition-colors focus-visible:outline-white!"
          >
            {isReminderActive ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            {isReminderActive ? 'Aviso activado' : 'Avisame'}
          </button>
          <button
            id="btn-home-download-schedule"
            onClick={() => onExportSchedule(currentZone)}
            aria-label="Descargar horario"
            className="h-12 px-4 rounded-control bg-brand-soft text-brand-700 text-sm font-semibold inline-flex items-center justify-center gap-2 hover:bg-surface-card transition-colors focus-visible:outline-white!"
          >
            <Download className="w-5 h-5" />
            <span>
              Descargar<span className="hidden sm:inline"> horario</span>
            </span>
          </button>
        </div>
      </section>

      {/* Accesos rápidos */}
      <section aria-labelledby="shortcuts-title">
        <h2 id="shortcuts-title" className="font-display text-[17px] leading-6 font-bold text-ink mb-3">
          Accesos rápidos
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {shortcuts.map(({ id, title, desc, Icon, color, onClick }) => (
            <button
              key={id}
              id={`card-action-${id}`}
              onClick={onClick}
              className="group bg-surface-card p-4 rounded-card border border-line shadow-elev-1 hover:border-line-strong transition-colors text-left flex flex-col gap-3"
            >
              <span className="flex items-center justify-between">
                <span className="w-10 h-10 rounded-control bg-brand-soft flex items-center justify-center" style={{ color }}>
                  <Icon className="w-5 h-5" />
                </span>
                <ArrowRight className="w-4 h-4 text-ink-muted group-hover:text-brand-600 transition-colors" />
              </span>
              <span>
                <span className="block font-display text-base leading-6 font-bold text-ink">{title}</span>
                <span className="block text-sm leading-5 text-ink-muted mt-0.5">{desc}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Reclamos en gestión */}
      {activeReports.length > 0 && (
        <section aria-labelledby="reports-title" className="bg-surface-card rounded-card border border-line p-4 shadow-elev-1">
          <div className="flex items-center justify-between mb-3">
            <h2 id="reports-title" className="font-display text-[17px] leading-6 font-bold text-ink">
              Tus reclamos en gestión ({activeReports.length})
            </h2>
            <button
              onClick={onOpenReportHistory}
              className="text-sm font-semibold text-brand-600 hover:underline px-1 py-2"
            >
              Ver todos
            </button>
          </div>

          <ul className="flex flex-col gap-2">
            {activeReports.slice(0, 2).map((r) => (
              <li key={r.id}>
                <button
                  onClick={onOpenReportHistory}
                  className="w-full flex items-center gap-3 p-3 rounded-control bg-surface border border-line hover:bg-surface-muted transition-colors text-left"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-ink truncate">
                      #{r.code} · {r.categoryLabel}
                    </span>
                    <span className="block text-xs text-ink-muted truncate">{r.address}</span>
                  </span>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${reportStatusBadge[r.status]}`}>
                    {r.statusLabel}
                  </span>
                  <ChevronRight className="w-4 h-4 text-ink-muted shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Guía de separación */}
      <section aria-labelledby="guide-title" className="flex flex-col gap-3">
        <h2 id="guide-title" className="font-display text-[17px] leading-6 font-bold text-ink">
          Cómo separar tus residuos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {guide.map(({ meta, title, desc }) => (
            <div key={title} className="bg-surface-card p-3 rounded-card border border-line flex items-start gap-3">
              <span
                className="w-9 h-9 rounded-control text-white flex items-center justify-center shrink-0"
                style={{ backgroundColor: `var(--color-${meta.colorToken})` }}
                aria-hidden="true"
              >
                <meta.Icon className="w-5 h-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold text-ink">{title}</span>
                <span className="text-sm leading-5 text-ink-muted mt-0.5">{desc}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Firma institucional (§3.3) */}
      <BrandLogo variant="municipalidad-h" className="block w-[168px] h-auto mx-auto mt-2" />
    </div>
  );
};
