import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Bell,
  CheckCircle2,
  DownloadCloud,
  Share2,
  Trash2,
  Recycle,
  Trees,
  Info,
  ChevronRight
} from 'lucide-react';
import { ZoneLocation, FilterCategory } from '../types';

interface SchedulesScreenProps {
  zones: ZoneLocation[];
  onSelectZone: (zone: ZoneLocation) => void;
  onOpenRouteDetails: (zone: ZoneLocation) => void;
  onToggleReminder: (zone: ZoneLocation) => void;
  onExportSchedule: (zone: ZoneLocation) => void;
  onShare: (zone: ZoneLocation) => void;
  activeReminders: string[];
}

export const SchedulesScreen: React.FC<SchedulesScreenProps> = ({
  zones,
  onSelectZone,
  onOpenRouteDetails,
  onToggleReminder,
  onExportSchedule,
  onShare,
  activeReminders,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('todos');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('todos');

  const daysOfWeek = [
    { id: 'todos', label: 'Toda la semana' },
    { id: 'lun', label: 'Lunes' },
    { id: 'mar', label: 'Martes' },
    { id: 'mie', label: 'Miércoles' },
    { id: 'jue', label: 'Jueves' },
    { id: 'vie', label: 'Viernes' },
    { id: 'sab', label: 'Sábado' },
  ];

  const filteredZones = zones.filter((zone) => {
    const matchesCategory =
      selectedCategory === 'todos' || zone.category === selectedCategory;
    const matchesSearch =
      zone.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      zone.neighborhood.toLowerCase().includes(searchFilter.toLowerCase()) ||
      zone.address.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesDay =
      selectedDay === 'todos' ||
      zone.frequency.toLowerCase().includes(selectedDay.toLowerCase()) ||
      zone.frequency.toLowerCase().includes('lunes a sábados') ||
      zone.frequency.toLowerCase().includes('todos los días');

    return matchesCategory && matchesSearch && matchesDay;
  });

  return (
    <div id="schedules-screen" className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24 flex flex-col gap-4">
      {/* Header title */}
      <div>
        <h1 className="text-2xl font-black text-[#181c1e] tracking-tight">
          Horarios y Rutas
        </h1>
        <p className="text-xs text-[#555f71]">
          Cronograma oficial de recolección de la Ciudad de Corrientes
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white h-12 rounded-xl shadow-sm flex items-center px-3.5 gap-2.5 border border-[#e2e8f0]">
        <Search className="w-4 h-4 text-[#555f71]" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filtrar por barrio, calle o zona..."
          className="bg-transparent border-none outline-none w-full text-sm text-[#181c1e] placeholder:text-[#555f71]/60 font-medium"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        <button
          onClick={() => setSelectedCategory('todos')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            selectedCategory === 'todos'
              ? 'bg-[#006b21] text-white shadow-sm'
              : 'bg-white text-[#3e4a3c] border border-[#e2e8f0]'
          }`}
        >
          Todos los servicios
        </button>
        <button
          onClick={() => setSelectedCategory('residuos-comunes')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedCategory === 'residuos-comunes'
              ? 'bg-[#006b21] text-white shadow-sm'
              : 'bg-white text-[#3e4a3c] border border-[#e2e8f0]'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Residuos Comunes
        </button>
        <button
          onClick={() => setSelectedCategory('reciclables')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedCategory === 'reciclables'
              ? 'bg-[#006b21] text-white shadow-sm'
              : 'bg-white text-[#3e4a3c] border border-[#e2e8f0]'
          }`}
        >
          <Recycle className="w-3.5 h-3.5" />
          Reciclables
        </button>
        <button
          onClick={() => setSelectedCategory('poda-escombros')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selectedCategory === 'poda-escombros'
              ? 'bg-[#006b21] text-white shadow-sm'
              : 'bg-white text-[#3e4a3c] border border-[#e2e8f0]'
          }`}
        >
          <Trees className="w-3.5 h-3.5" />
          Poda y Escombros
        </button>
      </div>

      {/* Days Filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 text-xs font-medium">
        {daysOfWeek.map((day) => (
          <button
            key={day.id}
            onClick={() => setSelectedDay(day.id)}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              selectedDay === day.id
                ? 'bg-[#181c1e] text-white font-bold'
                : 'bg-[#f1f4f6] text-[#555f71] hover:bg-[#e5e9eb]'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Schedules List Cards */}
      <div className="flex flex-col gap-3.5 mt-1">
        {filteredZones.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-[#e2e8f0] text-center flex flex-col items-center justify-center gap-2">
            <Calendar className="w-10 h-10 text-[#555f71]/40" />
            <span className="font-bold text-sm text-[#181c1e]">
              No se encontraron cronogramas para los filtros seleccionados
            </span>
            <button
              onClick={() => {
                setSelectedCategory('todos');
                setSelectedDay('todos');
                setSearchFilter('');
              }}
              className="mt-2 text-xs text-[#006b21] font-bold underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          filteredZones.map((zone) => {
            const isReminderActive = activeReminders.includes(zone.id);

            return (
              <div
                key={zone.id}
                id={`schedule-card-${zone.id}`}
                className="bg-white rounded-2xl border border-[#e2e8f0] p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3.5"
              >
                {/* Card Top Header */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-[#f1f4f6] text-[#006b21] font-bold text-[10px] rounded uppercase tracking-wider">
                        {zone.shift}
                      </span>
                      <span className="text-xs font-semibold text-[#555f71]">
                        • {zone.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#181c1e] mt-1 font-['Public_Sans',sans-serif]">
                      {zone.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-[#555f71]">
                      <MapPin className="w-3.5 h-3.5 text-[#006b21]" />
                      <span>{zone.neighborhood}</span>
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-[#f1f4f6] flex items-center justify-center text-[#006b21]">
                    {zone.category === 'reciclables' || zone.category === 'puntos-verdes' ? (
                      <Recycle className="w-5 h-5" />
                    ) : zone.category === 'poda-escombros' ? (
                      <Trees className="w-5 h-5" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Info Grid (Days + Window) */}
                <div className="grid grid-cols-2 gap-2 bg-[#f7fafc] border border-[#e2e8f0] rounded-xl p-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-[#006b21] mb-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold text-[#555f71] uppercase">Frecuencia</span>
                    </div>
                    <span className="text-xs font-bold text-[#181c1e]">{zone.frequency}</span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-[#006b21] mb-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold text-[#555f71] uppercase">Ventana Horaria</span>
                    </div>
                    <span className="text-xs font-bold text-[#181c1e]">{zone.timeWindow}</span>
                  </div>
                </div>

                {/* Accepted Materials Chips */}
                {zone.materialsAccepted && zone.materialsAccepted.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {zone.materialsAccepted.map((mat, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-[#f1f4f6] text-[#3e4a3c] rounded text-[10px] font-medium"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#e2e8f0]/60">
                  {/* Avisarme button */}
                  <button
                    onClick={() => onToggleReminder(zone)}
                    className={`flex-1 h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isReminderActive
                        ? 'bg-[#059669] text-white'
                        : 'bg-[#006b21] text-white hover:bg-[#00872c]'
                    }`}
                  >
                    {isReminderActive ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Alarma Activada
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5" />
                        Avisarme
                      </>
                    )}
                  </button>

                  {/* Route details button */}
                  <button
                    onClick={() => onOpenRouteDetails(zone)}
                    className="h-10 px-3 bg-[#f1f4f6] hover:bg-[#e5e9eb] text-[#181c1e] rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5 text-[#006b21]" />
                    <span className="hidden sm:inline">Ruta</span>
                  </button>

                  {/* Google Drive Export button */}
                  <button
                    onClick={() => onExportSchedule(zone)}
                    title="Exportar a Google Drive"
                    className="h-10 w-10 bg-[#f1f4f6] hover:bg-[#e5e9eb] text-[#181c1e] rounded-xl flex items-center justify-center transition-colors"
                  >
                    <DownloadCloud className="w-4 h-4 text-[#006b21]" />
                  </button>

                  {/* Share button */}
                  <button
                    onClick={() => onShare(zone)}
                    title="Compartir"
                    className="h-10 w-10 bg-[#f1f4f6] hover:bg-[#e5e9eb] text-[#181c1e] rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
