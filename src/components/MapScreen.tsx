import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  Mic,
  SlidersHorizontal,
  Trash2,
  Recycle,
  Trees,
  MapPin,
  Navigation,
  Truck,
  X,
  Map as MapIcon,
  Satellite,
  ZoomIn,
  ZoomOut,
  Crosshair,
  type LucideIcon
} from 'lucide-react';
import { ZoneLocation, FilterCategory } from '../types';
import { categoryMeta } from '../lib/categoryMeta';
import { CORRIENTES_ZONES } from '../data/corrientesData';
import { MapZoneSheet } from './MapZoneSheet';

interface MapScreenProps {
  /** Ya filtradas por App (filtro único). */
  zones: ZoneLocation[];
  selectedZone: ZoneLocation | null;
  onSelectZone: (zone: ZoneLocation) => void;
  activeCategory: FilterCategory;
  onSelectCategory: (category: FilterCategory) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  onOpenRouteDetails: (zone: ZoneLocation) => void;
  onOpenFilter: () => void;
  onShare: (zone: ZoneLocation) => void;
  onToggleReminder: (zone: ZoneLocation) => void;
  activeReminders: string[];
  /** Abre la hoja de `selectedZone` al montar o al pasar a true (p.ej. desde Horarios o una notificación). */
  sheetOpenOnMount?: boolean;
}

// Coordinates of Corrientes Collection Route (Calle Junín and Casco Histórico)
const JUNIN_ROUTE_COORDS: [number, number][] = [
  [-27.4645, -58.8378], // Plaza 25 de Mayo
  [-27.4658, -58.8365], // 25 de Mayo & Salta
  [-27.4668, -58.8352], // San Juan & Pellegrini
  [-27.4678, -58.8340], // Peatonal Junín & San Lorenzo
  [-27.4682, -58.8328], // Junín & Santa Fe
  [-27.4698, -58.8341], // Junín 1200 (Mendoza y Córdoba)
  [-27.4710, -58.8315], // Junín & Catamarca
  [-27.4725, -58.8290], // Plaza Cabral (Santa Fe e Yrigoyen)
  [-27.4760, -58.8280], // Av. 3 de Abril & Santa Fe
];
const ROUTE_ZONE_ID = 'junin-1200';
const CITY_CENTER: [number, number] = [-27.4698, -58.8341];

const SELECT_ZOOM = 16;
/** Desde este zoom todos los pins llevan etiqueta; antes, solo el seleccionado. */
const LABEL_ZOOM = 16;

const TILE_LAYERS: Record<'streets' | 'satellite', { url: string; subdomains: string; attribution: string }> = {
  // Esri World Street Map - no API key required (CARTO/OSM block localhost)
  streets: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    subdomains: '',
    attribution: 'Tiles &copy; Esri',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    subdomains: '',
    attribution: 'Tiles &copy; Esri',
  },
};

// Glifos de lucide (los mismos paths que categoryMeta.Icon) para los pins, que Leaflet recibe como HTML.
const PIN_GLYPHS = new Map<LucideIcon, string>([
  [Trash2, '<path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>'],
  [Recycle, '<path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/><path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12"/><path d="m14 16-3 3 3 3"/><path d="M8.293 13.596 7.196 9.5 3.1 10.598"/><path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843"/><path d="m13.378 9.633 4.096 1.098 1.097-4.096"/>'],
  [Trees, '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"/>'],
]);
const TRUCK_GLYPH = '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>';
const SVG_ATTRS = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true"';

// Misma forma para todas las categorías: solo cambian el color y el glifo.
const pinHtml = (zone: ZoneLocation, selected: boolean, showLabel: boolean) => {
  const meta = categoryMeta[zone.category];
  const color = `var(--color-${meta.colorToken})`;
  return `
    <div class="relative w-11 h-11 flex items-center justify-center">
      ${selected ? `<span class="absolute w-12 h-12 rounded-full opacity-25" style="background-color: ${color};"></span>` : ''}
      <span class="relative ${selected ? 'w-10 h-10' : 'w-8 h-8'} rounded-full border-2 border-white shadow-elev-2 flex items-center justify-center text-white" style="background-color: ${color};">
        <svg class="${selected ? 'w-5 h-5' : 'w-4 h-4'}" ${SVG_ATTRS}>${PIN_GLYPHS.get(meta.Icon) ?? ''}</svg>
      </span>
      ${
        showLabel
          ? `<span class="absolute top-full -mt-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-surface-card text-ink text-xs font-semibold whitespace-nowrap shadow-elev-1 border border-line">${zone.name}</span>`
          : ''
      }
    </div>
  `;
};

const TRUCK_ICON_HTML = `
  <div class="relative w-11 h-11 flex items-center justify-center">
    <span class="absolute inset-1 rounded-full bg-brand-500 opacity-40 animate-ping"></span>
    <span class="relative w-9 h-9 rounded-full bg-brand-600 border-2 border-white shadow-elev-2 flex items-center justify-center text-white">
      <svg class="w-4 h-4" ${SVG_ATTRS}>${TRUCK_GLYPH}</svg>
    </span>
    <span class="absolute top-full mt-0.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-brand-600 text-white text-xs font-semibold whitespace-nowrap shadow-elev-1">Móvil #14 · En vivo</span>
  </div>
`;

const CATEGORY_PILLS: Array<{ id: string; category: FilterCategory }> = [
  { id: 'filter-todos', category: 'todos' },
  { id: 'filter-residuos-comunes', category: 'residuos-comunes' },
  { id: 'filter-reciclables', category: 'reciclables' },
  { id: 'filter-poda', category: 'poda-escombros' },
];

// La píldora de ayuda se oculta tras la primera interacción, también al volver a la pestaña.
let mapHintDismissed = false;

const floatingButton = 'w-11 h-11 rounded-control shadow-elev-2 border border-line flex items-center justify-center transition-colors';

export const MapScreen: React.FC<MapScreenProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  activeCategory,
  onSelectCategory,
  onClearFilters,
  activeFilterCount,
  onOpenRouteDetails,
  onOpenFilter,
  onShare,
  onToggleReminder,
  activeReminders,
  sheetOpenOnMount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showLiveTruck, setShowLiveTruck] = useState(true);
  const [mapLayerType, setMapLayerType] = useState<'streets' | 'satellite'>('streets');
  const [userGpsLocation, setUserGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [showHint, setShowHint] = useState(!mapHintDismissed);

  // Cerrada por defecto para ver las calles sin obstrucción
  const [isSheetOpen, setIsSheetOpen] = useState(sheetOpenOnMount ?? false);

  // Map DOM and Leaflet References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);
  // Para calcular el área visible del mapa entre los controles de arriba y la hoja
  const topOverlayRef = useRef<HTMLDivElement | null>(null);
  const bottomStackRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const prevSelectedIdRef = useRef(selectedZone?.id);

  // La hoja solo se muestra si la zona seleccionada pasa el filtro actual.
  const showSheet = isSheetOpen && !!selectedZone && zones.some((z) => z.id === selectedZone.id);
  const isReminderActive = selectedZone ? activeReminders.includes(selectedZone.id) : false;
  // El recorrido es el de Junín: él y el camión que lo sigue se ocultan si el filtro excluye esa zona.
  const showRoute = zones.some((z) => z.id === ROUTE_ZONE_ID);
  const isRouteHighlighted = showSheet && selectedZone?.id === ROUTE_ZONE_ID;
  // Filtros del modal (barrio, turno): la categoría ya se ve en las píldoras.
  const modalFilterCount = activeFilterCount - (activeCategory === 'todos' ? 0 : 1);

  const dismissHint = () => {
    mapHintDismissed = true;
    setShowHint(false);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: selectedZone ? [selectedZone.coordinates.lat, selectedZone.coordinates.lng] : CITY_CENTER,
      zoom: 15,
      zoomControl: false,
    });

    // Layer group for pins
    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    // Recorrido de recolección; su visibilidad y estilo los maneja un effect.
    routePolylineRef.current = L.polyline(JUNIN_ROUTE_COORDS, {
      className: 'route-line',
      lineCap: 'round',
    });

    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Tocar el mapa vacío cierra la hoja para explorar las calles
    map.on('click', () => {
      setIsSheetOpen(false);
      setShowSearchSuggestions(false);
    });
    map.on('dragstart zoomstart', dismissHint);
    map.on('zoomend', () => setShowAllLabels(map.getZoom() >= LABEL_ZOOM));

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Set Tile Layer on mount and when layer type changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const { url, subdomains, attribution } = TILE_LAYERS[mapLayerType];
    const newLayer = L.tileLayer(url, { maxZoom: 19, subdomains, attribution }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapLayerType, isMapReady]);

  // Update Markers whenever filtered zones or selected zone changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current) return;

    markersLayerGroupRef.current.clearLayers();

    zones.forEach((zone) => {
      const isSelected = showSheet && selectedZone?.id === zone.id;

      const marker = L.marker([zone.coordinates.lat, zone.coordinates.lng], {
        icon: L.divIcon({
          className: 'map-zone-pin',
          html: pinHtml(zone, isSelected, isSelected || showAllLabels),
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        }),
        title: zone.name,
        zIndexOffset: isSelected ? 1000 : 0,
        riseOnHover: true,
      });

      // Seleccionar abre la hoja; el flyTo lo hace un único effect.
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectZone(zone);
        setIsSheetOpen(true);
      });

      markersLayerGroupRef.current?.addLayer(marker);
    });
  }, [zones, selectedZone?.id, showSheet, showAllLabels, isMapReady]);

  // Con el mapa ya montado (p.ej. una notificación), seleccionar otra zona o que App pida la hoja la abre.
  useEffect(() => {
    const changed = prevSelectedIdRef.current !== selectedZone?.id;
    prevSelectedIdRef.current = selectedZone?.id;
    if (changed || sheetOpenOnMount) setIsSheetOpen(true);
  }, [selectedZone?.id, sheetOpenOnMount]);

  // Si el filtro oculta la zona de la hoja, la hoja se cierra (y no reaparece al limpiar).
  useEffect(() => {
    if (selectedZone && !zones.some((z) => z.id === selectedZone.id)) setIsSheetOpen(false);
  }, [zones]);

  useEffect(() => {
    if (showSheet) dismissHint();
  }, [showSheet]);

  // Un solo flyTo por selección, con el pin centrado en el área visible arriba de la hoja.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !showSheet || !selectedZone || !topOverlayRef.current || !bottomStackRef.current || !sheetRef.current) return;

    const zoom = Math.max(map.getZoom(), SELECT_ZOOM);
    // offsetTop/offsetHeight ignoran el transform de la animación de entrada de la hoja.
    const visibleTop = topOverlayRef.current.offsetTop + topOverlayRef.current.offsetHeight;
    const visibleBottom = bottomStackRef.current.offsetTop + sheetRef.current.offsetTop;
    const offsetY = map.getSize().y / 2 - (visibleTop + visibleBottom) / 2;
    const pinPoint = map.project([selectedZone.coordinates.lat, selectedZone.coordinates.lng], zoom);
    map.flyTo(map.unproject(pinPoint.add([0, offsetY]), zoom), zoom, { duration: 0.6 });
  }, [selectedZone?.id, showSheet]);

  // Polilínea: oculta sin zonas de recolección, resaltada con Junín seleccionada.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const line = routePolylineRef.current;
    if (!map || !line) return;
    if (!showRoute) {
      line.remove();
      return;
    }
    line.addTo(map);
    line.setStyle(
      isRouteHighlighted
        ? { weight: 6, opacity: 1, dashArray: undefined }
        : { weight: 4, opacity: 0.6, dashArray: '8, 8' }
    );
  }, [showRoute, isRouteHighlighted, isMapReady]);

  // Animated Live Truck along polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !showLiveTruck || !showRoute) {
      if (truckMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(truckMarkerRef.current);
        truckMarkerRef.current = null;
      }
      return;
    }

    let progress = 0.45;

    const truckIcon = L.divIcon({
      className: 'map-truck-pin',
      html: TRUCK_ICON_HTML,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    const getCoordAtProgress = (p: number): [number, number] => {
      const totalPoints = JUNIN_ROUTE_COORDS.length;
      const indexFloat = p * (totalPoints - 1);
      const index = Math.floor(indexFloat);
      const remainder = indexFloat - index;

      if (index >= totalPoints - 1) return JUNIN_ROUTE_COORDS[totalPoints - 1];

      const p1 = JUNIN_ROUTE_COORDS[index];
      const p2 = JUNIN_ROUTE_COORDS[index + 1];

      return [p1[0] + (p2[0] - p1[0]) * remainder, p1[1] + (p2[1] - p1[1]) * remainder];
    };

    const initialPos = getCoordAtProgress(progress);
    const truckMarker = L.marker(initialPos, { icon: truckIcon, interactive: false, keyboard: false }).addTo(
      mapInstanceRef.current
    );
    truckMarkerRef.current = truckMarker;

    const interval = setInterval(() => {
      progress += 0.012;
      if (progress > 1) progress = 0.05;
      const newPos = getCoordAtProgress(progress);
      truckMarker.setLatLng(newPos);
    }, 1200);

    return () => {
      clearInterval(interval);
      if (truckMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(truckMarkerRef.current);
        truckMarkerRef.current = null;
      }
    };
  }, [showLiveTruck, showRoute, isMapReady]);

  // Voice search simulation
  const handleVoiceSearch = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setSearchQuery('Calle Junín 1200, Corrientes');
      // Busca en todas las zonas: si el filtro la oculta, App lo limpia al seleccionarla.
      const found = CORRIENTES_ZONES.find((z) => z.id === ROUTE_ZONE_ID);
      if (found) {
        onSelectZone(found);
        setIsSheetOpen(true);
      }
    }, 1500);
  };

  // Center on user GPS
  const handleLocateUser = () => {
    const flyToUser = (coords: { lat: number; lng: number }) => {
      setUserGpsLocation(coords);
      mapInstanceRef.current?.flyTo([coords.lat, coords.lng], SELECT_ZOOM);
    };
    const fallback = { lat: CITY_CENTER[0], lng: CITY_CENTER[1] };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => flyToUser({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => flyToUser(fallback)
      );
    } else {
      flyToUser(fallback);
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetCenter = () => {
    mapInstanceRef.current?.flyTo(CITY_CENTER, 15);
  };

  const suggestions = zones.filter(
    (z) =>
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // Alto: viewport menos header y bottom nav (64px cada uno, +1px del borde de la nav) y el
    // safe area de la nav, así la atribución de Leaflet queda arriba de la nav.
    <div
      id="map-screen"
      className="relative w-full h-[calc(100dvh-8rem-1px-env(safe-area-inset-bottom,0px))] overflow-hidden bg-surface-muted"
    >
      {/* Main Interactive Leaflet Map Container */}
      <div
        id="leaflet-map-container"
        ref={mapContainerRef}
        className="w-full h-full z-0 cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Top Search & Filter Floating Header */}
      <div ref={topOverlayRef} className="absolute top-0 inset-x-0 z-30 pt-3 px-4 max-w-md mx-auto flex flex-col gap-2">
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface-card h-12 rounded-card shadow-elev-2 flex items-center pl-3.5 pr-1 gap-2 border border-line">
            <Search className="w-4 h-4 text-ink-muted shrink-0" />
            <input
              id="map-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              placeholder="Buscar calle o barrio"
              aria-label="Buscar calle o barrio"
              className="bg-transparent border-none outline-none w-full min-w-0 text-base text-ink placeholder:text-ink-muted"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchSuggestions(false);
                }}
                aria-label="Borrar búsqueda"
                className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              id="btn-voice-search"
              onClick={handleVoiceSearch}
              aria-label={isListening ? 'Escuchando…' : 'Búsqueda por voz'}
              className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center transition-colors ${
                isListening ? 'bg-danger text-white' : 'hover:bg-surface-muted text-ink-body'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-open-filter"
            onClick={onOpenFilter}
            aria-label="Filtros avanzados"
            className="w-12 h-12 bg-surface-card rounded-card shadow-elev-2 flex items-center justify-center border border-line text-brand-600 hover:bg-surface-muted transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {showSearchSuggestions && searchQuery.trim().length > 0 && (
          <div className="bg-surface-card rounded-card shadow-elev-3 border border-line p-1.5 flex flex-col gap-1 max-h-52 overflow-y-auto">
            {suggestions.length === 0 && (
              <p className="px-2.5 py-2 text-sm text-ink-muted">No encontramos esa calle o barrio.</p>
            )}
            {suggestions.map((z) => (
              <button
                key={z.id}
                onClick={() => {
                  setSearchQuery(z.name);
                  onSelectZone(z);
                  setIsSheetOpen(true);
                  setShowSearchSuggestions(false);
                }}
                className="flex items-center gap-2.5 p-2.5 rounded-control hover:bg-surface-muted text-left transition-colors"
              >
                <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-ink">{z.name}</span>
                  <span className="text-xs text-ink-muted">
                    {z.neighborhood} · {z.type}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Category pills (+ chip de filtros del modal) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {modalFilterCount > 0 && (
            <button
              id="map-active-filters-chip"
              onClick={onClearFilters}
              className="h-9 px-3 rounded-full text-sm font-semibold whitespace-nowrap shadow-elev-1 flex items-center gap-1.5 bg-brand-soft text-brand-700 border border-brand-500"
            >
              {activeFilterCount} {activeFilterCount === 1 ? 'filtro' : 'filtros'} · Limpiar
              <X className="w-4 h-4" />
            </button>
          )}
          {CATEGORY_PILLS.map(({ id, category }) => {
            const { label, Icon } = categoryMeta[category];
            const isActive = activeCategory === category;
            return (
              <button
                key={id}
                id={id}
                onClick={() => onSelectCategory(category)}
                aria-pressed={isActive}
                className={`h-9 px-3.5 rounded-full text-sm font-semibold whitespace-nowrap shadow-elev-1 flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-card text-ink-body border border-line hover:bg-surface-muted'
                }`}
              >
                {category !== 'todos' && <Icon className="w-4 h-4" />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Capas y zoom (arriba a la derecha). Con la hoja abierta se ocultan para no chocar con GPS y camión. */}
      {!showSheet && (
        <div className="absolute top-[7.5rem] right-4 z-10 flex flex-col gap-2">
          <div className="bg-surface-card rounded-card shadow-elev-2 border border-line p-1 flex flex-col gap-1">
            <button
              onClick={() => setMapLayerType('streets')}
              aria-label="Mapa de calles"
              aria-pressed={mapLayerType === 'streets'}
              title="Mapa de calles"
              className={`w-11 h-11 rounded-control flex items-center justify-center transition-colors ${
                mapLayerType === 'streets' ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-surface-muted'
              }`}
            >
              <MapIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMapLayerType('satellite')}
              aria-label="Vista satelital"
              aria-pressed={mapLayerType === 'satellite'}
              title="Vista satelital"
              className={`w-11 h-11 rounded-control flex items-center justify-center transition-colors ${
                mapLayerType === 'satellite' ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-surface-muted'
              }`}
            >
              <Satellite className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-surface-card rounded-card shadow-elev-2 border border-line flex flex-col overflow-hidden">
            <button
              onClick={handleZoomIn}
              aria-label="Acercar mapa"
              className="w-11 h-11 flex items-center justify-center text-ink hover:bg-surface-muted active:bg-line transition-colors border-b border-line"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomOut}
              aria-label="Alejar mapa"
              className="w-11 h-11 flex items-center justify-center text-ink hover:bg-surface-muted active:bg-line transition-colors border-b border-line"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleResetCenter}
              aria-label="Centrar en Corrientes"
              title="Centrar en Corrientes"
              className="w-11 h-11 flex items-center justify-center text-brand-600 hover:bg-surface-muted active:bg-line transition-colors"
            >
              <Crosshair className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Botones flotantes + hoja en el mismo contenedor: los botones siempre quedan arriba de la hoja. */}
      <div
        ref={bottomStackRef}
        className="absolute inset-x-4 bottom-6 z-20 max-w-md mx-auto flex flex-col gap-3 pointer-events-none"
      >
        <div className="self-end flex flex-col gap-2 pointer-events-auto">
          <button
            id="btn-my-location"
            onClick={handleLocateUser}
            aria-label="Mi ubicación"
            title="Mi ubicación"
            className={`${floatingButton} bg-surface-card text-brand-600 hover:bg-surface-muted`}
          >
            <Navigation className="w-5 h-5" />
          </button>

          <button
            id="btn-live-truck-toggle"
            onClick={() => setShowLiveTruck(!showLiveTruck)}
            disabled={!showRoute}
            aria-label="Camión en vivo"
            aria-pressed={showLiveTruck}
            title={!showRoute ? 'Sin recorridos en el filtro actual' : showLiveTruck ? 'Ocultar camión' : 'Ver camión en vivo'}
            className={`${floatingButton} disabled:opacity-50 disabled:cursor-not-allowed ${
              showLiveTruck && showRoute
                ? 'bg-brand-600 text-white border-brand-600 hover:bg-brand-700'
                : 'bg-surface-card text-ink-muted hover:bg-surface-muted'
            }`}
          >
            <Truck className="w-5 h-5" />
          </button>
        </div>

        {showSheet && selectedZone ? (
          <div ref={sheetRef} className="pointer-events-auto">
            <MapZoneSheet
              zone={selectedZone}
              isReminderActive={isReminderActive}
              onClose={() => setIsSheetOpen(false)}
              onToggleReminder={onToggleReminder}
              onOpenRouteDetails={onOpenRouteDetails}
              onShare={onShare}
            />
          </div>
        ) : zones.length === 0 ? (
          <button
            id="map-empty-clear-filters"
            onClick={onClearFilters}
            className="self-center pointer-events-auto h-11 px-4 rounded-full bg-surface-card shadow-elev-2 border border-line text-sm font-semibold text-ink hover:bg-surface-muted transition-colors"
          >
            Sin resultados · Limpiar filtros
          </button>
        ) : (
          showHint && (
            <p
              id="map-hint"
              className="self-center px-4 py-2 rounded-full bg-surface-card/95 shadow-elev-2 border border-line text-sm font-semibold text-ink animate-fadeIn"
            >
              Tocá un punto para ver horarios
            </p>
          )
        )}
      </div>
    </div>
  );
};
