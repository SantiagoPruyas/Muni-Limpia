import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Bell,
  BellRing,
  Download,
  Share2,
  Route,
  SlidersHorizontal,
} from 'lucide-react';
import { ZoneLocation, FilterCategory } from '../types';
import { categoryMeta } from '../lib/categoryMeta';
import { DAY_NAMES, nextService } from '../data/schedule';

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

type DayFilter = 'hoy' | 'todos' | number;

const CATEGORIES: FilterCategory[] = ['todos', 'residuos-comunes', 'reciclables', 'poda-escombros'];

// id = índice de Date.getDay() (0 = domingo); la semana se muestra de lunes a domingo.
const WEEK = [1, 2, 3, 4, 5, 6, 0];

const pillClass = (active: boolean, padding = 'px-4') =>
  `h-11 ${padding} rounded-full text-sm font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors ${
    active
      ? 'bg-brand-600 text-white'
      : 'bg-surface-card text-ink-body border border-line hover:border-brand-500'
  }`;

/** Sin tildes ni mayúsculas: "camba" encuentra "Cambá Cuá". */
const foldText = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const statusChipClass = {
  'en-curso': 'bg-brand-600 text-white',
  hoy: 'bg-brand-soft text-brand-700',
  proximo: 'bg-surface-muted text-ink-muted',
};

export const SchedulesScreen: React.FC<SchedulesScreenProps> = ({
  zones,
  activeCategory,
  onSelectCategory,
  onClearFilters,
  activeFilterCount,
  onSelectZone,
  onOpenRouteDetails,
  onToggleReminder,
  onExportSchedule,
  onShare,
  activeReminders,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDay, setSelectedDay] = useState<DayFilter>('hoy');

  const today = new Date().getDay();
  const day = selectedDay === 'hoy' ? today : selectedDay;
  // Filtros del mapa que esta pantalla no muestra: barrio y turno (la categoría se ve en las píldoras).
  const hiddenFilterCount = activeFilterCount - (activeCategory === 'todos' ? 0 : 1);

  const query = foldText(searchFilter.trim());
  const filteredZones = zones.filter((zone) => {
    const matchesSearch =
      foldText(zone.name).includes(query) ||
      foldText(zone.neighborhood).includes(query) ||
      foldText(zone.address).includes(query);
    const matchesDay = day === 'todos' || zone.days.includes(day);
    return matchesSearch && matchesDay;
  });

  const dayLabel =
    selectedDay === 'hoy'
      ? `Hoy, ${DAY_NAMES[today].toLowerCase()}`
      : day === 'todos'
        ? 'Toda la semana'
        : DAY_NAMES[day];

  return (
    <div id="schedules-screen" className="flex-1 w-full max-w-2xl mx-auto px-4 pt-4 pb-24 flex flex-col gap-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">Horarios y recorridos</h1>
        <p className="text-sm text-ink-muted">Cronograma oficial de recolección de la Ciudad de Corrientes</p>
      </div>

      <label className="bg-surface-card h-12 rounded-control flex items-center px-3.5 gap-2.5 border border-line focus-within:border-brand-500">
        <Search className="w-5 h-5 text-ink-muted shrink-0" aria-hidden="true" />
        <input
          type="search"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Buscá por barrio, calle o zona"
          aria-label="Buscar por barrio, calle o zona"
          className="bg-transparent border-none outline-none w-full text-base text-ink placeholder:text-ink-muted"
        />
      </label>

      {hiddenFilterCount > 0 && (
        <div
          id="schedules-inherited-filters"
          className="flex items-center gap-2 bg-brand-soft rounded-control pl-3.5 pr-1 py-1 text-sm text-ink-body"
        >
          <SlidersHorizontal className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            {hiddenFilterCount === 1 ? '1 filtro del mapa activo' : `${hiddenFilterCount} filtros del mapa activos`}{' '}
            <span className="text-ink-muted">(barrio o turno)</span>
          </span>
          <button
            onClick={onClearFilters}
            className="h-11 px-3 rounded-control text-sm font-semibold text-brand-600 hover:bg-surface-card"
          >
            Limpiar
          </button>
        </div>
      )}

      <div role="group" aria-label="Servicio" className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
        {CATEGORIES.map((category) => {
          const meta = categoryMeta[category];
          const active = activeCategory === category;
          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              aria-pressed={active}
              className={pillClass(active)}
            >
              {category !== 'todos' && (
                <meta.Icon
                  className="w-4 h-4"
                  style={active ? undefined : { color: `var(--color-${meta.colorToken})` }}
                  aria-hidden="true"
                />
              )}
              {meta.label}
            </button>
          );
        })}
      </div>

      <div role="group" aria-label="Día" className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-4 px-4">
        <button
          onClick={() => setSelectedDay('hoy')}
          aria-pressed={selectedDay === 'hoy'}
          aria-label={`Hoy, ${DAY_NAMES[today]}`}
          className={pillClass(selectedDay === 'hoy')}
        >
          Hoy
        </button>
        {WEEK.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            aria-pressed={selectedDay === d}
            aria-label={DAY_NAMES[d]}
            className={`${pillClass(selectedDay === d, 'px-3')} min-w-11 justify-center`}
          >
            {DAY_NAMES[d].slice(0, 3)}
          </button>
        ))}
        <button
          onClick={() => setSelectedDay('todos')}
          aria-pressed={selectedDay === 'todos'}
          className={pillClass(selectedDay === 'todos')}
        >
          Toda la semana
        </button>
      </div>

      <p className="text-sm text-ink-muted" aria-live="polite">
        {dayLabel} · {filteredZones.length === 1 ? '1 servicio' : `${filteredZones.length} servicios`}
      </p>

      <div className="flex flex-col gap-3">
        {filteredZones.length === 0 ? (
          <div className="bg-surface-card rounded-card p-8 border border-line text-center flex flex-col items-center gap-2">
            <Calendar className="w-10 h-10 text-ink-muted" aria-hidden="true" />
            <span className="font-semibold text-base text-ink">Sin resultados</span>
            <span className="text-sm text-ink-muted">No hay servicios que coincidan con la búsqueda y los filtros.</span>
            <button
              id="schedules-empty-clear-filters"
              onClick={() => {
                onClearFilters();
                setSelectedDay('todos');
                setSearchFilter('');
              }}
              className="mt-2 h-11 px-4 rounded-control bg-surface-muted text-sm text-brand-600 font-semibold hover:bg-brand-soft"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          filteredZones.map((zone) => {
            const isReminderActive = activeReminders.includes(zone.id);
            const meta = categoryMeta[zone.category];
            const service = nextService(zone);
            const isGreenPoint = zone.type === 'Punto Verde';
            const statusLabel = service.state === 'hoy' && !isGreenPoint ? `Hoy ${zone.start}` : service.label;

            // Tarjeta con "stretched button": el título cubre la tarjeta (after:inset-0) y las acciones quedan encima (z-10).
            return (
              <article
                key={zone.id}
                id={`schedule-card-${zone.id}`}
                className="relative bg-surface-card rounded-card border border-line p-4 shadow-elev-1 hover:border-brand-500 transition-colors flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                      <meta.Icon
                        className="w-4 h-4 shrink-0"
                        style={{ color: `var(--color-${meta.colorToken})` }}
                        aria-hidden="true"
                      />
                      <span>
                        {isGreenPoint ? zone.type : meta.label} · {zone.shift}
                      </span>
                    </div>
                    <h3 className="mt-1">
                      <button
                        onClick={() => onSelectZone(zone)}
                        className="font-display text-[17px] leading-6 font-bold text-ink text-left after:absolute after:inset-0 after:rounded-card"
                      >
                        {zone.name}
                        <span className="sr-only">, ver en el mapa</span>
                      </button>
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-ink-muted">
                      <MapPin className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
                      <span className="truncate">{zone.neighborhood}</span>
                    </div>
                  </div>

                  <div className="relative z-10 flex gap-1 -mr-1.5 -mt-1.5">
                    <button
                      onClick={() => onExportSchedule(zone)}
                      aria-label={`Descargar horario de ${zone.name}`}
                      title="Descargar horario"
                      className="w-11 h-11 rounded-control text-ink-muted hover:bg-surface-muted hover:text-brand-600 flex items-center justify-center transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => onShare(zone)}
                      aria-label={`Compartir ${zone.name}`}
                      title="Compartir"
                      className="w-11 h-11 rounded-control text-ink-muted hover:bg-surface-muted hover:text-brand-600 flex items-center justify-center transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tabular-nums ${statusChipClass[service.state]}`}
                  >
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    {statusLabel}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-2 bg-surface rounded-control p-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-ink-muted">Días</dt>
                    <dd className="font-semibold text-ink">{zone.frequency}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-ink-muted">Horario</dt>
                    <dd className="font-semibold text-ink tabular-nums">{zone.timeWindow}</dd>
                  </div>
                </dl>

                {zone.materialsAccepted && zone.materialsAccepted.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5" aria-label="Materiales que recibe">
                    {zone.materialsAccepted.map((mat) => (
                      <li key={mat} className="px-2.5 py-1 bg-brand-soft text-brand-700 rounded-full text-xs font-medium">
                        {mat}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="relative z-10 flex items-center gap-2 pt-3 border-t border-line">
                  <button
                    onClick={() => onToggleReminder(zone)}
                    aria-label={isReminderActive ? `Aviso activado para ${zone.name}` : `Avisame cuando pase por ${zone.name}`}
                    className={`flex-1 h-12 rounded-control text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                      isReminderActive
                        ? 'bg-brand-soft text-brand-700 border border-brand-500/40'
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                    }`}
                  >
                    {isReminderActive ? (
                      <>
                        <BellRing className="w-4 h-4" aria-hidden="true" />
                        Aviso activado
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4" aria-hidden="true" />
                        Avisame
                      </>
                    )}
                  </button>

                  {!isGreenPoint && (
                    <button
                      onClick={() => onOpenRouteDetails(zone)}
                      aria-label={`Ver recorrido de ${zone.name}`}
                      className="flex-1 h-12 rounded-control bg-surface-muted hover:bg-brand-soft text-brand-600 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Route className="w-4 h-4" aria-hidden="true" />
                      Ver recorrido
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
