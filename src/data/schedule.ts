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

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const formatDuration = (min: number) => {
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
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const today = now.getDay();
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
