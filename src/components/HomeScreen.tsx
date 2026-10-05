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

  return (
    <div id="home-screen" className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24 flex flex-col gap-5">
      {/* Welcome Banner */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-[#006b21] uppercase tracking-wider">
            Municipalidad de Corrientes
          </span>
          <h1 className="text-2xl font-black text-[#181c1e] tracking-tight">
            Hola, {profile.name || 'Vecino'} 👋
          </h1>
          <div className="flex items-center gap-1 text-xs text-[#555f71] mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-[#006b21]" />
            <span>Zona seleccionada: <strong className="text-[#181c1e]">{currentZone.name}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Hero Card - Next Collection Countdown */}
      <div
        id="hero-collection-card"
        className="relative overflow-hidden bg-gradient-to-br from-[#006b21] via-[#007a26] to-[#004e17] text-white rounded-3xl p-5 sm:p-6 shadow-xl"
      >
        {/* Subtle decorative circles */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold w-fit">
                <span className="w-2 h-2 bg-[#81fc89] rounded-full animate-ping" />
                {currentZone.status}
              </span>
              <h2 className="text-xl sm:text-2xl font-black mt-2 leading-tight">
                Próxima Recolección
              </h2>
              <p className="text-xs sm:text-sm text-[#f7fff1]/90">
                {currentZone.type} en {currentZone.name}
              </p>
            </div>

            {/* Countdown Pill */}
            <div className="bg-white text-[#006b21] px-3.5 py-2 rounded-2xl shadow-lg flex flex-col items-center justify-center font-black">
              <span className="text-[9px] uppercase tracking-wider text-[#555f71]">Faltan</span>
              <span className="text-xl sm:text-2xl leading-none font-extrabold">{currentZone.remainingTime || '2h 45m'}</span>
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
              className={`flex-1 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                isReminderActive
                  ? 'bg-white text-[#006b21]'
                  : 'bg-[#81fc89] text-[#002105] hover:bg-[#97fc9e]'
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
              title="Guardar horario en Google Drive"
              className="h-11 px-3.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 backdrop-blur-md transition-colors"
            >
              <DownloadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Guardar en Drive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid: Quick Action Shortcuts */}
      <div>
        <h3 className="text-sm font-bold text-[#181c1e] mb-3 uppercase tracking-wider">
          Accesos Rápidos
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {/* Action 1: Map */}
          <div
            id="card-action-mapa"
            onClick={() => onNavigate('mapa')}
            className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-[#006b21]/10 text-[#006b21] flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-[#181c1e] group-hover:text-[#006b21] transition-colors">
                Mapa en Vivo
              </h4>
              <p className="text-xs text-[#555f71] mt-0.5">
                Ubica camiones, zonas y puntos verdes
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-[#006b21] mt-2 gap-1">
              <span>Explorar</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 2: Report */}
          <div
            id="card-action-reportar"
            onClick={() => onNavigate('reportar')}
            className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-[#181c1e] group-hover:text-[#DC2626] transition-colors">
                Reportar Reclamo
              </h4>
              <p className="text-xs text-[#555f71] mt-0.5">
                Microbasurales, ramas o contenedores
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-[#DC2626] mt-2 gap-1">
              <span>Nuevo Reporte</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 3: Schedules */}
          <div
            id="card-action-horarios"
            onClick={() => onNavigate('horarios')}
            className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-[#059669]/10 text-[#059669] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-[#181c1e] group-hover:text-[#059669] transition-colors">
                Guía de Horarios
              </h4>
              <p className="text-xs text-[#555f71] mt-0.5">
                Turnos diurnos, nocturnos y especiales
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-[#059669] mt-2 gap-1">
              <span>Consultar</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Action 4: Recycling Points */}
          <div
            id="card-action-reciclaje"
            onClick={() => onNavigate('mapa')}
            className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center group-hover:scale-110 transition-transform">
              <Recycle className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h4 className="font-bold text-sm text-[#181c1e] group-hover:text-[#2563EB] transition-colors">
                Puntos Verdes
              </h4>
              <p className="text-xs text-[#555f71] mt-0.5">
                Plásticos, vidrios, cartones y pilas
              </p>
            </div>
            <div className="flex items-center text-xs font-bold text-[#2563EB] mt-2 gap-1">
              <span>Ver Ubicaciones</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Reports Status Snippet (if any) */}
      {activeReports.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              <h3 className="font-bold text-sm text-[#181c1e]">
                Tus Reclamos en Gestión ({activeReports.length})
              </h3>
            </div>
            <button
              onClick={() => onNavigate('reportar')}
              className="text-xs font-bold text-[#006b21] hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {activeReports.slice(0, 2).map((r) => (
              <div
                key={r.id}
                onClick={() => onNavigate('reportar')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#f7fafc] border border-[#e2e8f0] hover:bg-[#f1f4f6] cursor-pointer transition-colors"
              >
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#181c1e]">
                    Ticket #{r.code} - {r.categoryLabel}
                  </span>
                  <span className="text-[11px] text-[#555f71] truncate max-w-[200px]">
                    {r.address}
                  </span>
                </div>
                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                  {r.statusLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eco Separation Guide / Tips */}
      <div className="bg-[#f7fafc] rounded-2xl border border-[#e2e8f0] p-4.5 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[#006b21]">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-bold text-sm text-[#181c1e]">
            Guía Ciudadana de Separación en Corrientes
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div className="bg-white p-3 rounded-xl border border-[#e2e8f0] flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 text-white flex items-center justify-center shrink-0 font-bold">
              ⬛
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#181c1e]">Bolsa Negra (Húmedos)</span>
              <span className="text-[#555f71] text-[11px] mt-0.5">
                Restos de comida, pañales, envoltorios sucios y residuos no reciclables.
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-[#e2e8f0] flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#006b21] text-white flex items-center justify-center shrink-0 font-bold">
              🟩
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-[#181c1e]">Bolsa Verde / Puntos Verdes</span>
              <span className="text-[#555f71] text-[11px] mt-0.5">
                Botellas plásticas secas, cartones limpios, latas de aluminio y vidrio.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
