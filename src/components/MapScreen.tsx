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
  Calendar,
  Clock,
  Bell,
  Share2,
  Navigation,
  Truck,
  Info,
  CheckCircle2,
  X,
  Layers,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Sparkles,
  ChevronUp,
  EyeOff,
  type LucideIcon
} from 'lucide-react';
import { ZoneLocation, FilterCategory } from '../types';
import { categoryMeta } from '../lib/categoryMeta';
import { CORRIENTES_ZONES } from '../data/corrientesData';
import { nextService } from '../data/schedule';

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

export const MapScreen: React.FC<MapScreenProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  activeCategory,
  onSelectCategory,
  onClearFilters,
  onOpenRouteDetails,
  onOpenFilter,
  onShare,
  onToggleReminder,
  activeReminders,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showLiveTruck, setShowLiveTruck] = useState(true);
  const [mapLayerType, setMapLayerType] = useState<'streets' | 'satellite'>('streets');
  const [userGpsLocation, setUserGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  
  // Controls visibility of the bottom collection sheet modal
  // Default is false so streets are completely visible without obstruction
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Map DOM and Leaflet References
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const truckMarkerRef = useRef<L.Marker | null>(null);

  const currentActiveZone = selectedZone || zones[0];
  const isReminderActive = currentActiveZone ? activeReminders.includes(currentActiveZone.id) : false;
  // La hoja solo se muestra si la zona seleccionada pasa el filtro actual.
  const showSheet = isSheetOpen && !!currentActiveZone && zones.some((z) => z.id === currentActiveZone.id);
  const sheetMeta = categoryMeta[currentActiveZone?.category ?? 'todos'];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultLat = selectedZone?.coordinates?.lat || -27.4698;
    const defaultLng = selectedZone?.coordinates?.lng || -58.8341;

    // Create Leaflet map instance
    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 15,
      zoomControl: false,
    });

    // Layer group for pins
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;

    // Route Polyline (Green dashed line representing collection path)
    const polyline = L.polyline(JUNIN_ROUTE_COORDS, {
      className: 'route-line',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineCap: 'round',
    }).addTo(map);
    routePolylineRef.current = polyline;

    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Clicking anywhere on the empty map dismisses the info sheet so user can explore streets with full view
    map.on('click', () => {
      setIsSheetOpen(false);
      setShowSearchSuggestions(false);
    });

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
      const isSelected = selectedZone?.id === zone.id;
      const meta = categoryMeta[zone.category];
      const color = `var(--color-${meta.colorToken})`;

      const pinIconHtml = `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
          ${
            isSelected && isSheetOpen
              ? `<div class="absolute w-12 h-12 rounded-full animate-ping opacity-25" style="background-color: ${color};"></div>`
              : ''
          }
          <div class="relative w-8 h-8 rounded-full shadow-lg flex items-center justify-center border-2 border-white transition-transform duration-200 group-hover:scale-110" style="background-color: ${color};">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${PIN_GLYPHS.get(meta.Icon) ?? ''}</svg>
          </div>
          <div class="absolute top-full mt-1 px-2 py-0.5 rounded shadow text-xs font-bold whitespace-nowrap bg-surface-card text-ink border border-line opacity-90 group-hover:opacity-100 ${
            isSelected && isSheetOpen ? 'ring-2 ring-brand-500 scale-105 opacity-100' : ''
          }">
            ${zone.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: pinIconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([zone.coordinates.lat, zone.coordinates.lng], {
        icon: customIcon,
      });

      // Clicking a pin selects the zone and opens the details sheet
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectZone(zone);
        setIsSheetOpen(true);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([zone.coordinates.lat, zone.coordinates.lng], 16, {
            duration: 0.6,
          });
        }
      });

      markersLayerGroupRef.current?.addLayer(marker);
    });
  }, [zones, selectedZone, isSheetOpen]);

  // Center map when selected zone changes externally
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedZone?.coordinates) return;
    mapInstanceRef.current.flyTo(
      [selectedZone.coordinates.lat, selectedZone.coordinates.lng],
      15.5,
      { duration: 0.7 }
    );
  }, [selectedZone]);

  // Animated Live Truck along polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !showLiveTruck) {
      if (truckMarkerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(truckMarkerRef.current);
        truckMarkerRef.current = null;
      }
      return;
    }

    let progress = 0.45;

    const truckIconHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div class="w-9 h-9 bg-brand-600 rounded-full shadow-elev-2 flex items-center justify-center border-2 border-white text-white animate-bounce">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path>
          </svg>
        </div>
        <div class="absolute -bottom-5 bg-brand-600 text-white text-xs font-extrabold px-1.5 py-0.5 rounded-full shadow-lg whitespace-nowrap">
          Móvil #14 (En vivo)
        </div>
      </div>
    `;

    const truckIcon = L.divIcon({
      className: 'custom-truck-pin',
      html: truckIconHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
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
    const truckMarker = L.marker(initialPos, { icon: truckIcon }).addTo(mapInstanceRef.current);
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
  }, [showLiveTruck, isMapReady]);

  // Voice search simulation
  const handleVoiceSearch = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      setSearchQuery('Calle Junín 1200, Corrientes');
      // Busca en todas las zonas: si el filtro la oculta, App lo limpia al seleccionarla.
      const found = CORRIENTES_ZONES.find((z) => z.id === 'junin-1200');
      if (found) {
        onSelectZone(found);
        setIsSheetOpen(true);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([found.coordinates.lat, found.coordinates.lng], 16.5);
        }
      }
    }, 1500);
  };

  // Center on user GPS
  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserGpsLocation(coords);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([coords.lat, coords.lng], 16);
          }
        },
        () => {
          const fallback = { lat: -27.4698, lng: -58.8341 };
          setUserGpsLocation(fallback);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([fallback.lat, fallback.lng], 16);
          }
        }
      );
    } else {
      const fallback = { lat: -27.4698, lng: -58.8341 };
      setUserGpsLocation(fallback);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([fallback.lat, fallback.lng], 16);
      }
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([-27.4698, -58.8341], 15);
    }
  };

  return (
    <div id="map-screen" className="relative w-full h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-surface-muted">
      {/* Top Search & Filter Floating Header */}
      <div className="absolute top-0 inset-x-0 z-20 pt-3 px-4 max-w-md mx-auto flex flex-col gap-2 pointer-events-auto">
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface-card h-12 rounded-2xl shadow-md flex items-center px-3.5 gap-2 border border-line relative">
            <Search className="w-4 h-4 text-ink-body shrink-0" />
            <input
              id="map-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchSuggestions(true);
              }}
              onFocus={() => setShowSearchSuggestions(true)}
              placeholder="Buscar calle o barrio en Corrientes..."
              className="bg-transparent border-none outline-none w-full text-sm text-ink placeholder:text-ink-muted/70 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchSuggestions(false);
                }}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              id="btn-voice-search"
              onClick={handleVoiceSearch}
              aria-label="Búsqueda por voz"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'hover:bg-surface-muted text-ink-body'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-open-filter"
            onClick={onOpenFilter}
            aria-label="Filtros avanzados"
            className="w-12 h-12 bg-surface-card rounded-2xl shadow-md flex items-center justify-center border border-line text-brand-600 hover:bg-surface-muted transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {showSearchSuggestions && searchQuery.trim().length > 0 && (
          <div className="bg-surface-card rounded-2xl shadow-elev-3 border border-line p-1.5 flex flex-col gap-1 max-h-52 overflow-y-auto">
            {zones
              .filter(
                (z) =>
                  z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  z.neighborhood.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  z.address.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((z) => (
                <button
                  key={z.id}
                  onClick={() => {
                    setSearchQuery(z.name);
                    onSelectZone(z);
                    setIsSheetOpen(true);
                    setShowSearchSuggestions(false);
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo([z.coordinates.lat, z.coordinates.lng], 16.5);
                    }
                  }}
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-muted text-left transition-colors"
                >
                  <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-ink">{z.name}</span>
                    <span className="text-xs text-ink-muted">
                      {z.neighborhood} • {z.type}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        )}

        {/* Horizontal Filter Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          <button
            id="filter-todos"
            onClick={() => onSelectCategory('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-all ${
              activeCategory ==='todos'
                ? 'bg-brand-600 text-white'
                : 'bg-white/95 backdrop-blur text-ink-body border border-line hover:bg-surface-muted'
            }`}
          >
            Todos
          </button>

          <button
            id="filter-residuos-comunes"
            onClick={() => onSelectCategory('residuos-comunes')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-all ${
              activeCategory ==='residuos-comunes'
                ? 'bg-brand-600 text-white'
                : 'bg-white/95 backdrop-blur text-ink-body border border-line hover:bg-surface-muted'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Residuos Comunes
          </button>

          <button
            id="filter-reciclables"
            onClick={() => onSelectCategory('reciclables')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-all ${
              activeCategory ==='reciclables'
                ? 'bg-brand-600 text-white'
                : 'bg-white/95 backdrop-blur text-ink-body border border-line hover:bg-surface-muted'
            }`}
          >
            <Recycle className="w-3.5 h-3.5" />
            Reciclables
          </button>

          <button
            id="filter-poda"
            onClick={() => onSelectCategory('poda-escombros')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-all ${
              activeCategory ==='poda-escombros'
                ? 'bg-brand-600 text-white'
                : 'bg-white/95 backdrop-blur text-ink-body border border-line hover:bg-surface-muted'
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            Poda y Escombros
          </button>
        </div>
      </div>

      {/* Main Interactive Leaflet Map Container */}
      <div
        id="leaflet-map-container"
        ref={mapContainerRef}
        className="w-full h-full z-0 cursor-grab active:cursor-grabbing outline-none"
      />

      {/* Map Layer Switcher & Quick Navigation Control (Top Right) */}
      <div className="absolute top-28 right-3.5 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Layer Mode Toggle */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-line p-1 flex flex-col gap-1">
          <button
            onClick={() => setMapLayerType('streets')}
            title="Mapa de Calles"
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              mapLayerType === 'streets'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-ink-muted hover:bg-surface-muted'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Calles</span>
          </button>

          <button
            onClick={() => setMapLayerType('satellite')}
            title="Vista Satelital"
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              mapLayerType === 'satellite'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-ink-muted hover:bg-surface-muted'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Satélite</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-line flex flex-col overflow-hidden">
          <button
            onClick={handleZoomIn}
            aria-label="Acercar mapa"
            className="w-9 h-9 flex items-center justify-center text-ink hover:bg-surface-muted active:bg-line transition-colors border-b border-line"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            aria-label="Alejar mapa"
            className="w-9 h-9 flex items-center justify-center text-ink hover:bg-surface-muted active:bg-line transition-colors border-b border-line"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCenter}
            title="Centrar en Corrientes"
            className="w-9 h-9 flex items-center justify-center text-brand-600 hover:bg-surface-muted active:bg-line transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Action Controls on Bottom Right */}
      {/* If sheet is open, they float above the sheet; if sheet is closed, they rest cleanly at the bottom */}
      <div
        className={`absolute right-3.5 z-20 flex flex-col gap-2 pointer-events-auto transition-all duration-300 ${
          showSheet ? 'bottom-[275px] sm:bottom-[285px]' : 'bottom-20'
        }`}
      >
        {/* GPS My Location */}
        <button
          id="btn-my-location"
          onClick={handleLocateUser}
          aria-label="Mi Ubicación"
          className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-center border border-line text-brand-600 hover:bg-surface-muted transition-transform active:scale-95 group relative"
        >
          <Navigation className="w-4 h-4 rotate-45" />
          <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 bg-ink text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
            Mi Ubicación
          </div>
        </button>

        {/* Live Truck Tracking Toggle */}
        <button
          id="btn-live-truck-toggle"
          onClick={() => setShowLiveTruck(!showLiveTruck)}
          aria-label="Rastreo de camión en vivo"
          className={`w-11 h-11 rounded-2xl shadow-elev-2 flex items-center justify-center text-white transition-all active:scale-95 relative group ${
            showLiveTruck ? 'bg-brand-600 hover:bg-brand-700' : 'bg-ink-muted hover:bg-ink-body'
          }`}
        >
          <Truck className="w-4 h-4" />
          <div className="absolute -top-1 -right-1 bg-danger text-white text-xs font-bold px-1 py-0.2 rounded-full shadow whitespace-nowrap">
            {showLiveTruck ? 'GPS' : 'OFF'}
          </div>
          <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 bg-ink text-white px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
            {showLiveTruck ? 'Pausar camión' : 'Ver camión recolector'}
          </div>
        </button>
      </div>

      {/* Floating Bottom Bar when no card is open: allows exploring streets freely without obstruction */}
      {!showSheet && (
        <div className="absolute bottom-20 inset-x-4 max-w-sm mx-auto z-20 pointer-events-auto flex items-center justify-center animate-fadeIn">
          <button
            id={zones.length === 0 ? 'map-empty-clear-filters' : undefined}
            onClick={() => {
              if (zones.length === 0) {
                onClearFilters();
              } else if (currentActiveZone) {
                setIsSheetOpen(true);
              }
            }}
            className="bg-white/95 backdrop-blur-md shadow-lg border border-line px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-ink hover:bg-surface-card active:scale-98 transition-all"
          >
            {zones.length === 0 ? (
              <span>Sin resultados · Limpiar filtros</span>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-brand-600 animate-pulse"></span>
                <span>Toca un punto o busca una calle para ver horarios</span>
                <ChevronUp className="w-4 h-4 text-ink-muted" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Bottom Sheet Card: Only rendered when a point is clicked or opened */}
      {showSheet && (
        <div className="absolute bottom-2 inset-x-4 max-w-md mx-auto z-30 pb-16 pointer-events-auto animate-slideUp">
          {currentActiveZone.id === 'junin-1200' ? (
            /* SCREENSHOT 1: Calle Junín 1200 Card */
            <div
              id="sheet-junin-card"
              className="bg-surface-card rounded-3xl shadow-elev-3 border border-line p-4 sm:p-5 flex flex-col gap-3.5 transition-all relative"
            >
              {/* Close Button on top-right */}
              <button
                onClick={() => setIsSheetOpen(false)}
                title="Cerrar y ver mapa completo"
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-surface-muted hover:bg-line text-ink-muted flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Drag Indicator to dismiss */}
              <div
                onClick={() => setIsSheetOpen(false)}
                className="w-10 h-1 bg-line rounded-full mx-auto -mt-1 cursor-pointer hover:bg-line-strong"
                title="Cerrar panel"
              ></div>

              {/* Status Header with nextService badge */}
              <div className="flex items-start justify-between pr-8">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-surface-muted text-brand-600 font-bold text-xs rounded tracking-wide">
                      {currentActiveZone.status}
                    </span>
                    <span className="text-xs text-ink-muted font-medium">
                      • {currentActiveZone.type}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-ink mt-1">
                    {currentActiveZone.name}
                  </h2>
                  <p className="text-xs text-ink-muted">{currentActiveZone.subtitle}</p>
                </div>

                {/* Green Remaining Time Box */}
                <div className="bg-brand-600 text-white px-2.5 py-1.5 rounded-2xl shadow flex flex-col items-center justify-center leading-none min-w-[64px]">
                  <span className="text-xs font-bold">{nextService(currentActiveZone).label}</span>
                </div>
              </div>

              {/* Frequency & Time Window Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-surface border border-line rounded-2xl p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-brand-600 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs text-ink-muted font-semibold">Frecuencia</span>
                  </div>
                  <span className="text-sm font-bold text-ink">
                    {currentActiveZone.frequency}
                  </span>
                </div>

                <div className="bg-surface border border-line rounded-2xl p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-brand-600 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs text-ink-muted font-semibold">Ventana</span>
                  </div>
                  <span className="text-sm font-bold text-ink">
                    {currentActiveZone.timeWindow}
                  </span>
                </div>
              </div>

              {/* Action Buttons: Avisarme + Share */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  id="btn-avisarme-junin"
                  onClick={() => onToggleReminder(currentActiveZone)}
                  className={`flex-1 h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 ${
                    isReminderActive
                      ? 'bg-brand-700 text-white ring-2 ring-brand-accent'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {isReminderActive ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Recordatorio Activado
                    </>
                  ) : (
                    <>
                      <Bell className="w-4 h-4" />
                      Avisarme
                    </>
                  )}
                </button>

                <button
                  id="btn-share-junin"
                  onClick={() => onShare(currentActiveZone)}
                  aria-label="Compartir información de zona"
                  className="w-12 h-12 bg-surface-muted hover:bg-brand-500/15 rounded-2xl flex items-center justify-center text-ink transition-colors shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* SCREENSHOT 2: Zona Centro / Punto Verde Card */
            <div
              id="sheet-zonacentro-card"
              className="bg-surface-card rounded-3xl shadow-elev-3 border border-line p-4 sm:p-5 flex flex-col gap-3.5 transition-all relative"
            >
              {/* Close Button on top-right */}
              <button
                onClick={() => setIsSheetOpen(false)}
                title="Cerrar y ver mapa completo"
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-surface-muted hover:bg-line text-ink-muted flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Drag Indicator */}
              <div
                onClick={() => setIsSheetOpen(false)}
                className="w-10 h-1 bg-line rounded-full mx-auto -mt-1 cursor-pointer hover:bg-line-strong"
                title="Cerrar panel"
              ></div>

              {/* Header with Category Icon */}
              <div className="flex items-start justify-between pr-8">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-surface-muted text-brand-600 font-bold text-xs rounded tracking-wide">
                      {currentActiveZone.status}
                    </span>
                    <span className="text-xs text-ink-muted font-medium">
                      • {currentActiveZone.type}
                    </span>
                  </div>
                  <h2 className="font-display text-xl font-bold text-ink mt-1">
                    {currentActiveZone.name}
                  </h2>
                  <p className="text-xs text-ink-muted mt-0.5">{currentActiveZone.subtitle}</p>
                </div>

                <div
                  className="w-10 h-10 bg-surface-muted rounded-2xl flex items-center justify-center shrink-0"
                  style={{ color: `var(--color-${sheetMeta.colorToken})` }}
                  title={sheetMeta.label}
                >
                  <sheetMeta.Icon className="w-5 h-5" />
                </div>
              </div>

              {/* Details Box with Dividers */}
              <div className="bg-surface border border-line rounded-2xl p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-ink-muted font-semibold uppercase">Días</span>
                    <span className="text-xs font-semibold text-ink">
                      {currentActiveZone.frequency}
                    </span>
                  </div>
                </div>

                <div className="h-px w-full bg-line" />

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs text-ink-muted font-semibold uppercase">Horario</span>
                    <span className="text-xs font-semibold text-ink">
                      {currentActiveZone.timeWindow}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action: Ver Detalles de Ruta + Share */}
              <div className="flex items-center gap-2">
                <button
                  id="btn-ver-detalles-ruta"
                  onClick={() => onOpenRouteDetails(currentActiveZone)}
                  className="flex-1 h-12 bg-surface-muted hover:bg-brand-500/15 text-brand-600 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Info className="w-4 h-4" />
                  Ver Detalles de Ruta
                </button>

                <button
                  id="btn-share-zonacentro"
                  onClick={() => onShare(currentActiveZone)}
                  aria-label="Compartir"
                  className="w-12 h-12 bg-surface-muted hover:bg-brand-500/15 rounded-2xl flex items-center justify-center text-ink transition-colors shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
