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
import { categoryMeta } from '../lib/categoryMeta';

interface SchedulesScreenProps {
  /** Ya filtradas por App (mismo filtro que el mapa). */
  zones: ZoneLocation[];
  activeCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  onSelectZone: (zone: ZoneLocation) => void;
  onOpenRouteDetails: (zone: ZoneLocation) => void;
  onToggleReminder: (zone: ZoneLocation) => void;
  onExportSchedule: (zone: ZoneLocation) => void;
  onShare: (zone: ZoneLocation) => void;
  activeReminders: string[];
}

export const SchedulesScreen: React.FC<SchedulesScreenProps> = ({
  zones,
  activeCategory,
  onSelectCategory,
  onClearFilters,
  onSelectZone,
  onOpenRouteDetails,
  onToggleReminder,
  onExportSchedule,
  onShare,
  activeReminders,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDay, setSelectedDay] = useState<number | 'todos'>('todos');

  // id = índice de Date.getDay() (0 = domingo); la semana se muestra de lunes a domingo.
  const daysOfWeek: { id: number | 'todos'; label: string }[] = [
    { id: 'todos', label: 'Toda la semana' },
    { id: 1, label: 'Lunes' },
    { id: 2, label: 'Martes' },
    { id: 3, label: 'Miércoles' },
    { id: 4, label: 'Jueves' },
    { id: 5, label: 'Viernes' },
    { id: 6, label: 'Sábado' },
    { id: 0, label: 'Domingo' },
  ];

  const filteredZones = zones.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      zone.neighborhood.toLowerCase().includes(searchFilter.toLowerCase()) ||
      zone.address.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesDay = selectedDay === 'todos' || zone.days.includes(selectedDay);

    return matchesSearch && matchesDay;
  });

  return (
    <div id="schedules-screen" className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24 flex flex-col gap-4">
      {/* Header title */}
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">
          Horarios y Rutas
        </h1>
        <p className="text-xs text-ink-muted">
          Cronograma oficial de recolección de la Ciudad de Corrientes
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-surface-card h-12 rounded-xl shadow-sm flex items-center px-3.5 gap-2.5 border border-line">
        <Search className="w-4 h-4 text-ink-muted" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Filtrar por barrio, calle o zona..."
          className="bg-transparent border-none outline-none w-full text-sm text-ink placeholder:text-ink-muted/60 font-medium"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
        <button
          onClick={() => onSelectCategory('todos')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeCategory ==='todos'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-surface-card text-ink-body border border-line'
          }`}
        >
          Todos los servicios
        </button>
        <button
          onClick={() => onSelectCategory('residuos-comunes')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeCategory ==='residuos-comunes'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-surface-card text-ink-body border border-line'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          Residuos Comunes
        </button>
        <button
          onClick={() => onSelectCategory('reciclables')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeCategory ==='reciclables'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-surface-card text-ink-body border border-line'
          }`}
        >
          <Recycle className="w-3.5 h-3.5" />
          Reciclables
        </button>
        <button
          onClick={() => onSelectCategory('poda-escombros')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            activeCategory ==='poda-escombros'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-surface-card text-ink-body border border-line'
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
                ? 'bg-ink text-white font-bold'
                : 'bg-surface-muted text-ink-muted hover:bg-brand-500/15'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Schedules List Cards */}
      <div className="flex flex-col gap-3.5 mt-1">
        {filteredZones.length === 0 ? (
          <div className="bg-surface-card rounded-2xl p-8 border border-line text-center flex flex-col items-center justify-center gap-2">
            <Calendar className="w-10 h-10 text-ink-muted/40" />
            <span className="font-bold text-sm text-ink">
              Sin resultados
            </span>
            <button
              id="schedules-empty-clear-filters"
              onClick={() => {
                onClearFilters();
                setSelectedDay('todos');
                setSearchFilter('');
              }}
              className="mt-2 text-xs text-brand-600 font-bold underline"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          filteredZones.map((zone) => {
            const isReminderActive = activeReminders.includes(zone.id);
            const meta = categoryMeta[zone.category];

            return (
              <div
                key={zone.id}
                id={`schedule-card-${zone.id}`}
                className="bg-surface-card rounded-2xl border border-line p-4.5 shadow-sm hover:shadow-md transition-all flex flex-col gap-3.5"
              >
                {/* Card Top Header */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-surface-muted text-brand-600 font-bold text-xs rounded uppercase tracking-wider">
                        {zone.shift}
                      </span>
                      <span className="text-xs font-semibold text-ink-muted">
                        • {zone.type}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-ink mt-1">
                      {zone.name}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-ink-muted">
                      <MapPin className="w-3.5 h-3.5 text-brand-600" />
                      <span>{zone.neighborhood}</span>
                    </div>
                  </div>

                  <div
                    className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center"
                    style={{ color: `var(--color-${meta.colorToken})` }}
                    title={meta.label}
                  >
                    <meta.Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Info Grid (Days + Window) */}
                <div className="grid grid-cols-2 gap-2 bg-surface border border-line rounded-xl p-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-brand-600 mb-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold text-ink-muted uppercase">Frecuencia</span>
                    </div>
                    <span className="text-xs font-bold text-ink">{zone.frequency}</span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-brand-600 mb-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold text-ink-muted uppercase">Ventana Horaria</span>
                    </div>
                    <span className="text-xs font-bold text-ink">{zone.timeWindow}</span>
                  </div>
                </div>

                {/* Accepted Materials Chips */}
                {zone.materialsAccepted && zone.materialsAccepted.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {zone.materialsAccepted.map((mat, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-surface-muted text-ink-body rounded text-xs font-medium"
                      >
                        {mat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2 pt-1 border-t border-line/60">
                  {/* Avisarme button */}
                  <button
                    onClick={() => onToggleReminder(zone)}
                    className={`flex-1 h-12 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isReminderActive
                        ? 'bg-brand-700 text-white'
                        : 'bg-brand-600 text-white hover:bg-brand-700'
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
                    className="h-12 px-3 bg-surface-muted hover:bg-brand-500/15 text-ink rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5 text-brand-600" />
                    <span className="hidden sm:inline">Ruta</span>
                  </button>

                  {/* Google Drive Export button */}
                  <button
                    onClick={() => onExportSchedule(zone)}
                    title="Descargar horario"
                    className="h-12 w-12 bg-surface-muted hover:bg-brand-500/15 text-ink rounded-xl flex items-center justify-center transition-colors"
                  >
                    <DownloadCloud className="w-4 h-4 text-brand-600" />
                  </button>

                  {/* Share button */}
                  <button
                    onClick={() => onShare(zone)}
                    title="Compartir"
                    className="h-12 w-12 bg-surface-muted hover:bg-brand-500/15 text-ink rounded-xl flex items-center justify-center transition-colors"
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
