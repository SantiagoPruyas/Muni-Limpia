import { IncidentReport } from '../types';

/** Badge de estado de reclamo: lo comparten Inicio y Reportar para que el color coincida. */
export const reportStatusBadge: Record<IncidentReport['status'], string> = {
  enviado: 'bg-info/10 text-info',
  en_revision: 'bg-surface-muted text-ink-body',
  cuadrilla_asignada: 'bg-warning/10 text-warning',
  resuelto: 'bg-success/10 text-success',
};
