export type NavTab = 'inicio' | 'mapa' | 'horarios' | 'reportar';

export type FilterCategory = 'todos' | 'residuos-comunes' | 'reciclables' | 'poda-escombros' | 'puntos-verdes';

export interface RouteStop {
  id: string;
  name: string;
  time: string;
  done: boolean;
  isCurrent?: boolean;
}

export interface ZoneLocation {
  id: string;
  name: string;
  subtitle: string;
  type: 'Residuos Comunes' | 'Reciclables' | 'Poda y Escombros' | 'Punto Verde';
  status: 'EN CAMINO' | 'EN CURSO' | 'PROGRAMADO' | 'FINALIZADO';
  remainingTime?: string;
  address: string;
  neighborhood: string;
  frequency: string;
  timeWindow: string;
  shift: 'Matutino' | 'Vespertino' | 'Nocturno';
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
  createdAt: string;
  estimatedResolution?: string;
  syncedToDrive?: boolean;
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
  driveSyncEnabled: boolean;
  googleAccountConnected: boolean;
}
