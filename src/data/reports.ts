import { AlertTriangle, ClipboardList, Package, Trash2, Trees, Truck, type LucideIcon } from 'lucide-react';
import { IncidentReport } from '../types';
import { cityClock } from './schedule';

/** Única tabla de categorías de reclamo: la usan el formulario y los datos seed. */
export const REPORT_CATEGORIES: {
  id: IncidentReport['category'];
  label: string;
  desc: string;
  Icon: LucideIcon;
}[] = [
  { id: 'microbasural', label: 'Microbasural', desc: 'Basura acumulada en esquinas o terrenos', Icon: Trash2 },
  { id: 'contenedor_lleno', label: 'Contenedor lleno o roto', desc: 'Contenedor sin capacidad o con daños', Icon: Package },
  { id: 'poda_escombros', label: 'Poda y escombros', desc: 'Ramas voluminosas u obras sin retiro', Icon: Trees },
  { id: 'animal_muerto', label: 'Animal en la vía pública', desc: 'Retiro urgente bromatológico', Icon: AlertTriangle },
  { id: 'falta_recoleccion', label: 'Falta de recolección', desc: 'El camión no pasó en su horario habitual', Icon: Truck },
  { id: 'otro', label: 'Otro reclamo', desc: 'Cuestiones generales de higiene urbana', Icon: ClipboardList },
];

/** Pasos del stepper del historial, en orden. */
export const REPORT_STATUS_STEPS: { id: IncidentReport['status']; label: string }[] = [
  { id: 'enviado', label: 'Enviado' },
  { id: 'en_revision', label: 'En revisión' },
  { id: 'cuadrilla_asignada', label: 'Cuadrilla asignada' },
  { id: 'resuelto', label: 'Resuelto' },
];

export const reportCategoryLabel = (id: IncidentReport['category']) =>
  REPORT_CATEGORIES.find((c) => c.id === id)?.label ?? 'Reclamo';

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** "Hoy 08:15" si es del día, si no "25 ago 10:30". En hora de Corrientes. */
export function formatReportDate(iso: string, now: Date = new Date()): string {
  const d = cityClock(new Date(iso));
  const n = cityClock(now);
  const time = `${String(d.hours).padStart(2, '0')}:${String(d.minutes).padStart(2, '0')}`;
  if (d.year === n.year && d.month === n.month && d.date === n.date) return `Hoy ${time}`;
  return `${d.date} ${MONTHS[d.month]} ${time}`;
}
