import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
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
  EyeOff
} from 'lucide-react';
import { ZoneLocation, FilterCategory } from '../types';

interface MapScreenProps {
  zones: ZoneLocation[];
  selectedZone: ZoneLocation | null;
  onSelectZone: (zone: ZoneLocation | null) => void;
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

export const MapScreen: React.FC<MapScreenProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  onOpenRouteDetails,
  onOpenFilter,
  onShare,
  onToggleReminder,
  activeReminders,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('todos');
  const [isListening, setIsListening] = useState(false);
  const [showLiveTruck, setShowLiveTruck] = useState(true);
  const [mapLayerType, setMapLayerType] = useState<'streets' | 'satellite' | 'vector'>('streets');
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

  // Filtered zones
  const filteredZones = zones.filter((zone) => {
    if (activeFilter === 'todos') return true;
    return zone.category === activeFilter;
  });

  const currentActiveZone = selectedZone || zones[0];
  const isReminderActive = currentActiveZone ? activeReminders.includes(currentActiveZone.id) : false;

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
      attributionControl: false,
    });

    // Add Tile Layer (CartoDB Voyager - high contrast, clear street names)
    const initialTileUrl =
      mapLayerType === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(initialTileUrl, {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer group for pins
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;

    // Route Polyline (Green dashed line representing collection path)
    const polyline = L.polyline(JUNIN_ROUTE_COORDS, {
      color: '#006b21',
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

  // Update Tile Layer when layer type changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    let url = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (mapLayerType === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    } else if (mapLayerType === 'vector') {
      url = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    const newLayer = L.tileLayer(url, { maxZoom: 19, subdomains: 'abcd' }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [mapLayerType]);

  // Update Markers whenever filtered zones or selected zone changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerGroupRef.current) return;

    markersLayerGroupRef.current.clearLayers();

    filteredZones.forEach((zone) => {
      const isSelected = selectedZone?.id === zone.id;
      const isRecycle = zone.category === 'reciclables' || zone.category === 'puntos-verdes';
      const isPoda = zone.category === 'poda-escombros';

      const bgColor = isRecycle ? '#059669' : isPoda ? '#d97706' : '#006b21';
      const pinIconHtml = `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
          ${
            isSelected && isSheetOpen
              ? `<div class="absolute w-12 h-12 rounded-full animate-ping" style="background-color: ${bgColor}40;"></div>`
              : ''
          }
          <div class="relative w-8 h-8 rounded-full shadow-lg flex items-center justify-center border-2 border-white transition-transform duration-200 group-hover:scale-110" style="background-color: ${bgColor};">
            ${
              isRecycle
                ? `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>`
                : isPoda
                ? `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>`
                : `<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`
            }
          </div>
          <div class="absolute top-full mt-1 px-2 py-0.5 rounded shadow text-[10px] font-bold whitespace-nowrap bg-white text-[#181c1e] border border-[#e2e8f0] opacity-90 group-hover:opacity-100 ${
            isSelected && isSheetOpen ? 'ring-2 ring-[#006b21] scale-105 opacity-100' : ''
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
  }, [filteredZones, selectedZone, isSheetOpen]);

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
        <div class="w-9 h-9 bg-[#006b21] rounded-full shadow-2xl flex items-center justify-center border-2 border-white text-white animate-bounce">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path>
          </svg>
        </div>
        <div class="absolute -bottom-5 bg-[#006b21] text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full shadow-lg whitespace-nowrap">
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
      const found = zones.find((z) => z.id === 'junin-1200') || zones[0];
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
    <div id="map-screen" className="relative w-full h-[calc(100vh-4rem)] flex flex-col overflow-hidden bg-[#e2ecd8]">
      {/* Top Search & Filter Floating Header */}
      <div className="absolute top-0 inset-x-0 z-20 pt-3 px-4 max-w-md mx-auto flex flex-col gap-2 pointer-events-auto">
        {/* Search Bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-white h-12 rounded-2xl shadow-md flex items-center px-3.5 gap-2 border border-[#e2e8f0] relative">
            <Search className="w-4 h-4 text-[#3e4a3c] shrink-0" />
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
              className="bg-transparent border-none outline-none w-full text-sm text-[#181c1e] placeholder:text-[#555f71]/70 font-medium font-['Public_Sans',sans-serif]"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchSuggestions(false);
                }}
                className="text-[#555f71] hover:text-[#181c1e] p-1"
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
                  : 'hover:bg-[#ebeef0] text-[#3e4a3c]'
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <button
            id="btn-open-filter"
            onClick={onOpenFilter}
            aria-label="Filtros avanzados"
            className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center border border-[#e2e8f0] text-[#006b21] hover:bg-[#f1f4f6] transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {showSearchSuggestions && searchQuery.trim().length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] p-1.5 flex flex-col gap-1 max-h-52 overflow-y-auto">
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
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#f1f4f6] text-left transition-colors"
                >
                  <MapPin className="w-4 h-4 text-[#006b21] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#181c1e]">{z.name}</span>
                    <span className="text-[11px] text-[#555f71]">
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
            onClick={() => setActiveFilter('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-all ${
              activeFilter === 'todos'
                ? 'bg-[#006b21] text-white'
                : 'bg-white/95 backdrop-blur text-[#3e4a3c] border border-[#e2e8f0] hover:bg-[#f1f4f6]'
            }`}
          >
            Todos
          </button>

          <button
            id="filter-residuos-comunes"
            onClick={() => setActiveFilter('residuos-comunes')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-all ${
              activeFilter === 'residuos-comunes'
                ? 'bg-[#006b21] text-white'
                : 'bg-white/95 backdrop-blur text-[#3e4a3c] border border-[#e2e8f0] hover:bg-[#f1f4f6]'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Residuos Comunes
          </button>

          <button
            id="filter-reciclables"
            onClick={() => setActiveFilter('reciclables')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-all ${
              activeFilter === 'reciclables'
                ? 'bg-[#006b21] text-white'
                : 'bg-white/95 backdrop-blur text-[#3e4a3c] border border-[#e2e8f0] hover:bg-[#f1f4f6]'
            }`}
          >
            <Recycle className="w-3.5 h-3.5" />
            Reciclables
          </button>

          <button
            id="filter-poda"
            onClick={() => setActiveFilter('poda-escombros')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm flex items-center gap-1.5 transition-all ${
              activeFilter === 'poda-escombros'
                ? 'bg-[#006b21] text-white'
                : 'bg-white/95 backdrop-blur text-[#3e4a3c] border border-[#e2e8f0] hover:bg-[#f1f4f6]'
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
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-[#e2e8f0] p-1 flex flex-col gap-1">
          <button
            onClick={() => setMapLayerType('streets')}
            title="Mapa de Calles"
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              mapLayerType === 'streets'
                ? 'bg-[#006b21] text-white shadow-sm'
                : 'text-[#555f71] hover:bg-[#f1f4f6]'
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
                ? 'bg-[#006b21] text-white shadow-sm'
                : 'text-[#555f71] hover:bg-[#f1f4f6]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Satélite</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-[#e2e8f0] flex flex-col overflow-hidden">
          <button
            onClick={handleZoomIn}
            aria-label="Acercar mapa"
            className="w-9 h-9 flex items-center justify-center text-[#181c1e] hover:bg-[#f1f4f6] active:bg-[#e2e8f0] transition-colors border-b border-[#e2e8f0]"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            aria-label="Alejar mapa"
            className="w-9 h-9 flex items-center justify-center text-[#181c1e] hover:bg-[#f1f4f6] active:bg-[#e2e8f0] transition-colors border-b border-[#e2e8f0]"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetCenter}
            title="Centrar en Corrientes"
            className="w-9 h-9 flex items-center justify-center text-[#006b21] hover:bg-[#f1f4f6] active:bg-[#e2e8f0] transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Floating Action Controls on Bottom Right */}
      {/* If sheet is open, they float above the sheet; if sheet is closed, they rest cleanly at the bottom */}
      <div
        className={`absolute right-3.5 z-20 flex flex-col gap-2 pointer-events-auto transition-all duration-300 ${
          isSheetOpen ? 'bottom-[275px] sm:bottom-[285px]' : 'bottom-20'
        }`}
      >
        {/* GPS My Location */}
        <button
          id="btn-my-location"
          onClick={handleLocateUser}
          aria-label="Mi Ubicación"
          className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg flex items-center justify-center border border-[#e2e8f0] text-[#006b21] hover:bg-[#f1f4f6] transition-transform active:scale-95 group relative"
        >
          <Navigation className="w-4 h-4 rotate-45" />
          <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 bg-[#181c1e] text-white px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
            Mi Ubicación
          </div>
        </button>

        {/* Live Truck Tracking Toggle */}
        <button
          id="btn-live-truck-toggle"
          onClick={() => setShowLiveTruck(!showLiveTruck)}
          aria-label="Rastreo de camión en vivo"
          className={`w-11 h-11 rounded-2xl shadow-xl flex items-center justify-center text-white transition-all active:scale-95 relative group ${
            showLiveTruck ? 'bg-[#006b21] hover:bg-[#00872c]' : 'bg-[#555f71] hover:bg-[#3e4a3c]'
          }`}
        >
          <Truck className="w-4 h-4" />
          <div className="absolute -top-1 -right-1 bg-[#DC2626] text-white text-[8px] font-bold px-1 py-0.2 rounded-full shadow whitespace-nowrap">
            {showLiveTruck ? 'GPS' : 'OFF'}
          </div>
          <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 bg-[#181c1e] text-white px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow">
            {showLiveTruck ? 'Pausar camión' : 'Ver camión recolector'}
          </div>
        </button>
      </div>

      {/* Floating Bottom Bar when no card is open: allows exploring streets freely without obstruction */}
      {!isSheetOpen && (
        <div className="absolute bottom-20 inset-x-4 max-w-sm mx-auto z-20 pointer-events-auto flex items-center justify-center animate-fadeIn">
          <button
            onClick={() => {
              if (currentActiveZone) {
                setIsSheetOpen(true);
              }
            }}
            className="bg-white/95 backdrop-blur-md shadow-lg border border-[#e2e8f0] px-4 py-2 rounded-full flex items-center gap-2 text-xs font-bold text-[#181c1e] hover:bg-white active:scale-98 transition-all"
          >
            <span className="w-2 h-2 rounded-full bg-[#006b21] animate-pulse"></span>
            <span>Toca un punto o busca una calle para ver horarios</span>
            <ChevronUp className="w-4 h-4 text-[#555f71]" />
          </button>
        </div>
      )}

      {/* Bottom Sheet Card: Only rendered when a point is clicked or opened */}
      {isSheetOpen && currentActiveZone && (
        <div className="absolute bottom-2 inset-x-4 max-w-md mx-auto z-30 pb-16 pointer-events-auto animate-slideUp">
          {currentActiveZone.id === 'junin-1200' ? (
            /* SCREENSHOT 1: Calle Junín 1200 Card */
            <div
              id="sheet-junin-card"
              className="bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] p-4 sm:p-5 flex flex-col gap-3.5 transition-all relative"
            >
              {/* Close Button on top-right */}
              <button
                onClick={() => setIsSheetOpen(false)}
                title="Cerrar y ver mapa completo"
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#f1f4f6] hover:bg-[#e2e8f0] text-[#555f71] flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Drag Indicator to dismiss */}
              <div
                onClick={() => setIsSheetOpen(false)}
                className="w-10 h-1 bg-[#e0e3e5] rounded-full mx-auto -mt-1 cursor-pointer hover:bg-[#bdcab8]"
                title="Cerrar panel"
              ></div>

              {/* Status Header with "FALTAN 2h 45m" Badge */}
              <div className="flex items-start justify-between pr-8">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-[#f1f4f6] text-[#006b21] font-bold text-[11px] rounded tracking-wide">
                      {currentActiveZone.status}
                    </span>
                    <span className="text-xs text-[#555f71] font-medium">
                      • {currentActiveZone.type}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#181c1e] mt-1 font-['Public_Sans',sans-serif]">
                    {currentActiveZone.name}
                  </h2>
                  <p className="text-xs text-[#555f71]">{currentActiveZone.subtitle}</p>
                </div>

                {/* Green Remaining Time Box */}
                <div className="bg-[#006b21] text-white px-2.5 py-1.5 rounded-2xl shadow flex flex-col items-center justify-center leading-none min-w-[64px]">
                  <span className="text-[9px] tracking-wider font-extrabold opacity-80 mb-0.5">
                    FALTAN
                  </span>
                  <span className="text-base font-black">2h</span>
                  <span className="text-xs font-bold">45m</span>
                </div>
              </div>

              {/* Frequency & Time Window Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-[#f7fafc] border border-[#e2e8f0] rounded-2xl p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-[#006b21] mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[11px] text-[#555f71] font-semibold">Frecuencia</span>
                  </div>
                  <span className="text-sm font-bold text-[#181c1e]">
                    {currentActiveZone.frequency}
                  </span>
                </div>

                <div className="bg-[#f7fafc] border border-[#e2e8f0] rounded-2xl p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 text-[#006b21] mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-[11px] text-[#555f71] font-semibold">Ventana</span>
                  </div>
                  <span className="text-sm font-bold text-[#181c1e]">
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
                      ? 'bg-[#059669] text-white ring-2 ring-[#81fc89]'
                      : 'bg-[#006b21] text-white hover:bg-[#00872c]'
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
                  className="w-12 h-12 bg-[#f1f4f6] hover:bg-[#e5e9eb] rounded-2xl flex items-center justify-center text-[#181c1e] transition-colors shrink-0"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* SCREENSHOT 2: Zona Centro / Punto Verde Card */
            <div
              id="sheet-zonacentro-card"
              className="bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] p-4 sm:p-5 flex flex-col gap-3.5 transition-all relative"
            >
              {/* Close Button on top-right */}
              <button
                onClick={() => setIsSheetOpen(false)}
                title="Cerrar y ver mapa completo"
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#f1f4f6] hover:bg-[#e2e8f0] text-[#555f71] flex items-center justify-center transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Drag Indicator */}
              <div
                onClick={() => setIsSheetOpen(false)}
                className="w-10 h-1 bg-[#e0e3e5] rounded-full mx-auto -mt-1 cursor-pointer hover:bg-[#bdcab8]"
                title="Cerrar panel"
              ></div>

              {/* Header with Category Icon */}
              <div className="flex items-start justify-between pr-8">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-[#f1f4f6] text-[#006b21] font-bold text-[10px] rounded tracking-wide">
                      {currentActiveZone.status}
                    </span>
                    <span className="text-xs text-[#555f71] font-medium">
                      • {currentActiveZone.type}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#181c1e] font-['Public_Sans',sans-serif] mt-1">
                    {currentActiveZone.name}
                  </h2>
                  <p className="text-xs text-[#555f71] mt-0.5">{currentActiveZone.subtitle}</p>
                </div>

                <div className="w-10 h-10 bg-[#f1f4f6] rounded-2xl flex items-center justify-center text-[#006b21] shrink-0">
                  {currentActiveZone.category === 'reciclables' || currentActiveZone.category === 'puntos-verdes' ? (
                    <Recycle className="w-5 h-5" />
                  ) : currentActiveZone.category === 'poda-escombros' ? (
                    <Trees className="w-5 h-5" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* Details Box with Dividers */}
              <div className="bg-[#f7fafc] border border-[#e2e8f0] rounded-2xl p-3.5 flex flex-col gap-2.5">
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-[#006b21] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#555f71] font-semibold uppercase">Días</span>
                    <span className="text-xs font-semibold text-[#181c1e]">
                      {currentActiveZone.frequency}
                    </span>
                  </div>
                </div>

                <div className="h-px w-full bg-[#e2e8f0]" />

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#006b21] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#555f71] font-semibold uppercase">Horario</span>
                    <span className="text-xs font-semibold text-[#181c1e]">
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
                  className="flex-1 h-12 bg-[#ebeef0] hover:bg-[#e0e3e5] text-[#006b21] font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 active:scale-98"
                >
                  <Info className="w-4 h-4" />
                  Ver Detalles de Ruta
                </button>

                <button
                  id="btn-share-zonacentro"
                  onClick={() => onShare(currentActiveZone)}
                  aria-label="Compartir"
                  className="w-12 h-12 bg-[#f1f4f6] hover:bg-[#e5e9eb] rounded-2xl flex items-center justify-center text-[#181c1e] transition-colors shrink-0"
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
