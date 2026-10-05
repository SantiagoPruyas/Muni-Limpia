export type NavTab = 'inicio' | 'mapa' | 'horarios' | 'reportar';

export type FilterCategory = 'todos' | 'residuos-comunes' | 'reciclables' | 'poda-escombros' | 'puntos-verdes';

export interface RouteStop {
  id: string;
  name: string;
  time: string;
  done: boolean;
  isCurrent?: boolean;
}

export type ZoneShift = 'Matutino' | 'Vespertino' | 'Nocturno';

export interface ZoneFilters {
  category: FilterCategory;
  neighborhood: string;
  shift: ZoneShift | 'todos';
}

export interface ZoneLocation {
  id: string;
  name: string;
  subtitle: string;
  type: 'Residuos Comunes' | 'Reciclables' | 'Poda y Escombros' | 'Punto Verde';
  status: 'EN CAMINO' | 'EN CURSO' | 'PROGRAMADO' | 'FINALIZADO';
  address: string;
  neighborhood: string;
  /** Días de servicio (0 = domingo). */
  days: number[];
  /** Inicio y fin de la ventana, "HH:MM". Si end < start, la ventana cruza la medianoche. */
  start: string;
  end: string;
  /** Solo para mostrar: deben coincidir con days / start / end. */
  frequency: string;
  timeWindow: string;
  shift: ZoneShift;
  truckNumber?: string;
  truckDriver?: string;
  truckCapacity?: string;
  description: string;
  coordinates: { lat: number; lng: number };
  mapPosition: { x: number; y: number };
  category: FilterCategory;
  materialsAccepted?: string[];
  stops?: RouteStop[];
}

export interface IncidentReport {
  id: string;
  code: string;
  category: 'microbasural' | 'contenedor_lleno' | 'poda_escombros' | 'animal_muerto' | 'falta_recoleccion' | 'otro';
  categoryLabel: string;
  title: string;
  description: string;
  address: string;
  neighborhood: string;
  photoUrl?: string;
  status: 'enviado' | 'en_revision' | 'cuadrilla_asignada' | 'resuelto';
  statusLabel: string;
  /** Fecha ISO. Se formatea al mostrar con formatReportDate. */
  createdAt: string;
  estimatedResolution?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'truck_nearby' | 'schedule_change' | 'report_update' | 'eco_tip';
  zoneId?: string;
}

export interface UserProfile {
  name: string;
  email: string;
  neighborhood: string;
  address: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}
