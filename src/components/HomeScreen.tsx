import React from 'react';
import {
  MapPin,
  Clock,
  Bell,
  CheckCircle2,
  Trash2,
  Recycle,
  AlertTriangle,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  DownloadCloud
} from 'lucide-react';
import { ZoneLocation, IncidentReport, UserProfile, NavTab } from '../types';
import { nextService } from '../data/schedule';

interface HomeScreenProps {
  currentZone: ZoneLocation;
  reports: IncidentReport[];
  profile: UserProfile;
  onNavigate: (tab: NavTab) => void;
  onSelectZone: (zone: ZoneLocation) => void;
  onToggleReminder: (zone: ZoneLocation) => void;
  onExportSchedule: (zone: ZoneLocation) => void;
  isReminderActive: boolean;
  onOpenReportModal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  currentZone,
  reports,
  profile,
  onNavigate,
  onToggleReminder,
  onExportSchedule,
  isReminderActive,
}) => {
  const activeReports = reports.filter((r) => r.status !== 'resuelto');
  const service = nextService(currentZone);

  return (
    <div id="home-screen" className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24 flex flex-col gap-5">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Municipalidad de Corrientes
          </span>
          <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">
            Hola, {profile.name || 'Vecino'} 👋
          </h1>
          <div className="flex items-center gap-1 text-xs text-ink-muted mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-brand-600" />
            <span>Zona seleccionada: <strong className="text-ink">{currentZone.name}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Hero Card - Next Collection Countdown */}
      <div
        id="hero-collection-card"
        className="relative overflow-hidden bg-brand-700 text-white rounded-3xl p-5 sm:p-6 shadow-elev-2"
      >
        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold w-fit">
                <span className="w-2 h-2 bg-brand-accent rounded-full animate-ping" />
                {currentZone.status}
              </span>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold mt-2 leading-tight">
                Próxima Recolección
              </h2>
              <p className="text-xs sm:text-sm text-white/90">
                {currentZone.type} en {currentZone.name}
              </p>
            </div>

            {/* Countdown Pill */}
            <div className="bg-surface-card text-brand-600 px-3.5 py-2 rounded-2xl shadow-lg flex flex-col items-center justify-center font-extrabold">
              <span className="text-xs uppercase tracking-wider text-ink-muted">
                {service.state === 'en-curso' ? 'Ahora' : 'Próxima'}
              </span>
              <span className="text-xl sm:text-2xl leading-none font-extrabold">{service.label}</span>
            </div>
          </div>

          {/* Time & Frequency Box */}
          <div className="grid grid-cols-2 gap-2 bg-black/15 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-xs">
            <div className="flex flex-col">
              <span className="text-white/70 font-medium">Ventana Horaria</span>
              <span className="font-bold text-sm text-white">{currentZone.timeWindow}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/70 font-medium">Días de Servicio</span>
              <span className="font-bold text-sm text-white">{currentZone.frequency}</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              id="btn-home-reminder"
              onClick={() => onToggleReminder(currentZone)}
              className={`flex-1 h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                isReminderActive
                  ? 'bg-surface-card text-brand-600'
                  : 'bg-brand-accent text-ink hover:bg-brand-soft'
              }`}
            >
              {isReminderActive ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Alarma Activada
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Activar Recordatorio
                </>
              )}
            </button>

            <button
              id="btn-home-export-drive"
              onClick={() => onExportSchedule(currentZone)}
              title="Descargar horario"
              className="h-12 px-3.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 backdrop-blur-md transition-colors"
            >
              <DownloadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Descargar horario</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid: Quick Action Shortcuts */}
      <div>
        <h3 className="text-sm font-bold text-ink mb-3 uppercase tracking-wider">
          Accesos Rápidos
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Action 1: Map */}
          <div
            id="card-action-mapa"
            onClick={() => onNavigate('mapa')}
            className="bg-surface-card p-4 rounded-2xl border border-line shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-ink group-hover:text-brand-600 transition-colors">
                Mapa en Vivo
              </h4>
              <p className="text-xs text-ink-muted mt-0.5">
                Ubica camiones, zonas y puntos verdes
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-brand-600 mt-2 gap-1">
              <span>Explorar</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 2: Report */}
          <div
            id="card-action-reportar"
            onClick={() => onNavigate('reportar')}
            className="bg-surface-card p-4 rounded-2xl border border-line shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-danger/10 text-danger flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-ink group-hover:text-danger transition-colors">
                Reportar Reclamo
              </h4>
              <p className="text-xs text-ink-muted mt-0.5">
                Microbasurales, ramas o contenedores
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-danger mt-2 gap-1">
              <span>Nuevo Reporte</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 3: Schedules */}
          <div
            id="card-action-horarios"
            onClick={() => onNavigate('horarios')}
            className="bg-surface-card p-4 rounded-2xl border border-line shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-ink group-hover:text-success transition-colors">
                Guía de Horarios
              </h4>
              <p className="text-xs text-ink-muted mt-0.5">
                Turnos diurnos, nocturnos y especiales
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-success mt-2 gap-1">
              <span>Consultar</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 4: Recycling Points */}
          <div
            id="card-action-reciclaje"
            onClick={() => onNavigate('mapa')}
            className="bg-surface-card p-4 rounded-2xl border border-line shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-info/10 text-info flex items-center justify-center group-hover:scale-110 transition-transform">
              <Recycle className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-ink group-hover:text-info transition-colors">
                Puntos Verdes
              </h4>
              <p className="text-xs text-ink-muted mt-0.5">
                Plásticos, vidrios, cartones y pilas
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-info mt-2 gap-1">
              <span>Ver Ubicaciones</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Reports Status Snippet (if any) */}
      {activeReports.length > 0 && (
        <div className="bg-surface-card rounded-2xl border border-line p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              <h3 className="font-bold text-sm text-ink">
                Tus Reclamos en Gestión ({activeReports.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('reportar')}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {activeReports.slice(0, 2).map((r) => (
              <div
                key={r.id}
                onClick={() => onNavigate('reportar')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-line hover:bg-surface-muted cursor-pointer transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-ink">
                    Ticket #{r.code} - {r.categoryLabel}
                  </span>
                  <span className="text-xs text-ink-muted truncate max-w-[200px]">
                    {r.address}
                  </span>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-md">
                  {r.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eco Separation Guide / Tips */}
      <div className="bg-surface rounded-2xl border border-line p-4.5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-brand-600">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-bold text-sm text-ink">
            Guía Ciudadana de Separación en Corrientes
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="bg-surface-card p-3 rounded-xl border border-line flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 font-bold">
              ⬛
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-ink">Bolsa Negra (Húmedos)</span>
              <span className="text-ink-muted text-xs mt-0.5">
                Restos de comida, pañales, envoltorios sucios y residuos no reciclables.
              </span>
            </div>
          </div>

          <div className="bg-surface-card p-3 rounded-xl border border-line flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-600 text-white flex items-center justify-center shrink-0 font-bold">
              🟩
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-ink">Bolsa Verde / Puntos Verdes</span>
              <span className="text-ink-muted text-xs mt-0.5">
                Botellas plásticas secas, cartones limpios, latas de aluminio y vidrio.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
