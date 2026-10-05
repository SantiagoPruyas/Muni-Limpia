import type { ZoneLocation } from '../types';

export interface ServiceStatus {
  state: 'en-curso' | 'hoy' | 'proximo';
  /** Minutos hasta el próximo inicio; 0 si está en curso. */
  startsInMin: number;
  label: string;
  /** Solo Puntos Verdes. */
  openNow?: boolean;
  closesAt?: string;
}

export const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const MIN_PER_DAY = 24 * 60;

/** Horarios y fechas van en hora de Corrientes, abra la demo desde donde la abra. */
export const TIME_ZONE = 'America/Argentina/Cordoba';

const CLOCK_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
});
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Fecha y hora de pared en Corrientes. `day` como Date.getDay() (0 = domingo), `month` desde 0. */
export function cityClock(date: Date = new Date()) {
  const parts = Object.fromEntries(CLOCK_FORMAT.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month) - 1,
    date: Number(parts.day),
    day: WEEKDAYS.indexOf(parts.weekday),
    hours: Number(parts.hour),
    minutes: Number(parts.minute),
  };
}

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const formatDuration = (min: number) => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

/** Estado del servicio de una zona según el reloj. Pura: mismo `now`, mismo resultado. */
export function nextService(zone: ZoneLocation, now: Date = new Date()): ServiceStatus {
  const isGreenPoint = zone.type === 'Punto Verde';
  const start = toMinutes(zone.start);
  const end = toMinutes(zone.end);
  const duration = end > start ? end - start : end + MIN_PER_DAY - start;
  const clock = cityClock(now);
  const nowMin = clock.hours * 60 + clock.minutes;
  const today = clock.day;
  const greenPoint = (openNow: boolean) => (isGreenPoint ? { openNow, closesAt: zone.end } : {});

  // En curso: una ventana que empezó hoy, o ayer si cruza la medianoche.
  for (const daysBack of [0, 1]) {
    const day = (today - daysBack + 7) % 7;
    const startedAt = start - daysBack * MIN_PER_DAY;
    if (zone.days.includes(day) && nowMin >= startedAt && nowMin < startedAt + duration) {
      return {
        state: 'en-curso',
        startsInMin: 0,
        label: isGreenPoint ? 'Abierto ahora' : 'En curso',
        ...greenPoint(true),
      };
    }
  }

  for (let daysAhead = 0; daysAhead <= 7; daysAhead++) {
    const day = (today + daysAhead) % 7;
    const startsInMin = start + daysAhead * MIN_PER_DAY - nowMin;
    if (!zone.days.includes(day) || startsInMin <= 0) continue;

    if (daysAhead === 0) {
      return {
        state: 'hoy',
        startsInMin,
        label: isGreenPoint ? `Abre hoy ${zone.start}` : `Pasa en ${formatDuration(startsInMin)}`,
        ...greenPoint(false),
      };
    }
    const when = daysAhead === 1 ? 'Mañana' : DAY_NAMES[day];
    return {
      state: 'proximo',
      startsInMin,
      label: isGreenPoint ? `Abre ${when.toLowerCase()} ${zone.start}` : `${when} ${zone.start}`,
      ...greenPoint(false),
    };
  }

  return { state: 'proximo', startsInMin: Infinity, label: 'Sin servicio programado', ...greenPoint(false) };
}
