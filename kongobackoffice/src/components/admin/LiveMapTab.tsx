// [Agent Dev Web] - Action: LiveMapTab - Carte GPS temps réel des bus de l'agence
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Bus, RefreshCw, Wifi, WifiOff, Navigation, Clock, AlertTriangle, Layers, Radio } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

// Leaflet CSS import (via link tag to avoid bundler issues)
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// DRC bounds (approximate)
const DRC_CENTER: [number, number] = [-4.322447, 15.322144];
const DRC_ZOOM = 6;

interface BusLocation {
  id: string;
  bus_id: string;
  driver_id: string | null;
  agency_id: string | null;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  accuracy: number | null;
  trip_id: string | null;
  status: 'active' | 'idle' | 'offline';
  updated_at: string;
  buses?: { name: string; plate_number: string; type?: string };
  drivers?: { user_id: string; profiles?: { full_name: string } };
}

interface LiveMapTabProps {
  agencyId: string | null;
}

// Offset age display helper
function getUpdateAge(dateStr: string): { label: string; isStale: boolean } {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return { label: 'À l\'instant', isStale: false };
  if (secs < 60) return { label: `Il y a ${secs}s`, isStale: false };
  const mins = Math.floor(secs / 60);
  if (mins < 10) return { label: `Il y a ${mins} min`, isStale: false };
  if (mins < 60) return { label: `Il y a ${mins} min`, isStale: true };
  return { label: `Il y a ${Math.floor(mins / 60)}h`, isStale: true };
}

// Compass heading to label
function headingToLabel(h: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(h / 45) % 8] || '—';
}

export function LiveMapTab({ agencyId }: LiveMapTabProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [busLocations, setBusLocations] = useState<BusLocation[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapStyle, setMapStyle] = useState<'street' | 'satellite'>('street');
  const channelRef = useRef<any>(null);

  // Inject Leaflet CSS once
  useEffect(() => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
  }, []);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || leafletMapRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // Fix default icon path issue with Vite
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: DRC_CENTER,
        zoom: DRC_ZOOM,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);

      leafletMapRef.current = map;
      setMapReady(true);
    };

    initMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Create bus icon with direction indicator
  const createBusIcon = useCallback(async (loc: BusLocation) => {
    const L = (await import('leaflet')).default;
    const isStale = Date.now() - new Date(loc.updated_at).getTime() > 10 * 60 * 1000;
    const color = isStale ? '#6b7280' : loc.status === 'active' ? '#22c55e' : '#f59e0b';
    const rotation = loc.heading || 0;

    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
        <defs>
          <filter id="shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        <!-- Pin body -->
        <ellipse cx="20" cy="20" rx="18" ry="18" fill="${color}" filter="url(#shadow)"/>
        <ellipse cx="20" cy="20" rx="18" ry="18" fill="none" stroke="white" stroke-width="2"/>
        <!-- Bus icon -->
        <rect x="12" y="13" width="16" height="12" rx="2" fill="white"/>
        <rect x="13" y="11" width="14" height="4" rx="1" fill="white" opacity="0.8"/>
        <rect x="14" y="15" width="4" height="3" rx="0.5" fill="${color}"/>
        <rect x="22" y="15" width="4" height="3" rx="0.5" fill="${color}"/>
        <!-- Wheels -->
        <circle cx="15" cy="25" r="2" fill="white"/>
        <circle cx="25" cy="25" r="2" fill="white"/>
        <!-- Direction arrow -->
        <polygon points="20,2 24,10 20,8 16,10" fill="${color}" stroke="white" stroke-width="1" transform="rotate(${rotation}, 20, 20)"/>
        <!-- Pulse for active -->
        ${!isStale ? '<circle cx="20" cy="20" r="18" fill="none" stroke="' + color + '" stroke-width="2" opacity="0.4"/>' : ''}
      </svg>`;

    return L.divIcon({
      html: svgIcon,
      className: '',
      iconSize: [40, 48],
      iconAnchor: [20, 48],
      popupAnchor: [0, -50],
    });
  }, []);

  // Update map markers when locations change
  const updateMapMarkers = useCallback(async (locations: BusLocation[]) => {
    if (!leafletMapRef.current || !mapReady) return;
    const L = (await import('leaflet')).default;

    // Remove markers for buses no longer present
    const currentIds = new Set(locations.map(l => l.bus_id));
    Object.keys(markersRef.current).forEach(busId => {
      if (!currentIds.has(busId)) {
        markersRef.current[busId].remove();
        delete markersRef.current[busId];
      }
    });

    for (const loc of locations) {
      const icon = await createBusIcon(loc);
      const busName = loc.buses?.name || 'Bus';
      const plateNumber = loc.buses?.plate_number || '';
      const { label: ageLabel } = getUpdateAge(loc.updated_at);

      const popupContent = `
        <div style="font-family: system-ui; min-width: 200px; padding: 4px;">
          <div style="font-weight: 900; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">${busName}</div>
          <div style="font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 8px;">${plateNumber}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
            <div><span style="color: #9ca3af">Vitesse</span><br><strong>${Math.round(loc.speed || 0)} km/h</strong></div>
            <div><span style="color: #9ca3af">Cap</span><br><strong>${headingToLabel(loc.heading)}</strong></div>
            <div><span style="color: #9ca3af">Statut</span><br><strong style="color: ${loc.status === 'active' ? '#22c55e' : '#f59e0b'}">${loc.status}</strong></div>
            <div><span style="color: #9ca3af">Mise à jour</span><br><strong>${ageLabel}</strong></div>
          </div>
        </div>`;

      if (markersRef.current[loc.bus_id]) {
        markersRef.current[loc.bus_id]
          .setLatLng([loc.latitude, loc.longitude])
          .setIcon(icon)
          .bindPopup(popupContent);
      } else {
        const marker = L.marker([loc.latitude, loc.longitude], { icon })
          .addTo(leafletMapRef.current)
          .bindPopup(popupContent);
        marker.on('click', () => setSelectedBus(loc));
        markersRef.current[loc.bus_id] = marker;
      }
    }

    // Auto-fit bounds if buses present
    if (locations.length > 0 && Object.keys(markersRef.current).length > 0) {
      const group = L.featureGroup(Object.values(markersRef.current));
      if (locations.length === 1) {
        leafletMapRef.current.setView([locations[0].latitude, locations[0].longitude], 12);
      } else {
        leafletMapRef.current.fitBounds(group.getBounds().pad(0.3));
      }
    }
  }, [mapReady, createBusIcon]);

  // Fetch bus locations from Supabase
  const fetchLocations = useCallback(async () => {
    if (!agencyId) { setIsLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('bus_locations')
        .select(`
          *,
          buses(name, plate_number, type)
        `)
        .eq('agency_id', agencyId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      const locs = (data || []) as BusLocation[];
      setBusLocations(locs);
      await updateMapMarkers(locs);
    } catch (e: any) {
      console.error('GPS fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [agencyId, updateMapMarkers]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!agencyId) return;

    fetchLocations();

    const channel = supabase
      .channel(`bus-locations-${agencyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bus_locations',
          filter: `agency_id=eq.${agencyId}`,
        },
        (payload) => {
          setIsConnected(true);
          fetchLocations();
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            toast.info('📍 Position GPS mise à jour', { duration: 2000 });
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId, fetchLocations]);

  // Re-render markers when locations or map readiness changes
  useEffect(() => {
    if (mapReady && busLocations.length > 0) {
      updateMapMarkers(busLocations);
    }
  }, [mapReady, busLocations, updateMapMarkers]);

  // Center map on selected bus
  const centerOnBus = useCallback((loc: BusLocation) => {
    if (!leafletMapRef.current) return;
    leafletMapRef.current.setView([loc.latitude, loc.longitude], 14, { animate: true });
    markersRef.current[loc.bus_id]?.openPopup();
    setSelectedBus(loc);
  }, []);

  const activeBuses = busLocations.filter(l => {
    const mins = (Date.now() - new Date(l.updated_at).getTime()) / 60000;
    return mins < 5;
  });

  const staleBuses = busLocations.filter(l => {
    const mins = (Date.now() - new Date(l.updated_at).getTime()) / 60000;
    return mins >= 5;
  });

  return (
    <div className="space-y-6">
      {/* Header compact */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shadow-md">
            <Navigation className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-[14px] font-black text-slate-900 tracking-tight uppercase leading-none">Carte GPS Live</h2>
            <p className="text-[7px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Suivi temps réel de la flotte
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Connection indicator */}
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[7px] font-black uppercase tracking-widest ${
            isConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            {isConnected
              ? <><Radio className="w-2.5 h-2.5 animate-pulse" /> Connecté</>
              : <><WifiOff className="w-2.5 h-2.5" /> Déconnecté</>
            }
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-lg text-[7px] font-black uppercase tracking-widest text-slate-700">
            <Bus className="w-2.5 h-2.5 text-emerald-500" />
            {activeBuses.length} actifs / {busLocations.length} total
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchLocations}
            className="h-6 px-2 text-[7px] font-black uppercase tracking-widest border-slate-200"
          >
            <RefreshCw className="w-2.5 h-2.5 mr-1" /> Actualiser
          </Button>
        </div>
      </div>

      {/* Main Layout: Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map Container */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm relative" style={{ minHeight: '320px' }}>
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-[1000] flex items-center justify-center rounded-xl">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Chargement...</p>
              </div>
            </div>
          )}

          {/* No GPS data yet */}
          {!isLoading && busLocations.length === 0 && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-8 text-center max-w-sm shadow-xl pointer-events-auto mx-4">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Aucune position GPS</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Les chauffeurs doivent activer le partage de position depuis leur tableau de bord pour apparaître sur cette carte.
                </p>
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">
                    ⚠️ Assurez-vous que les chauffeurs ont lancé la navigation
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Leaflet Map */}
          <div ref={mapRef} className="w-full h-full" style={{ minHeight: '320px' }} />
        </div>

        {/* Sidebar - Bus List */}
        <div className="space-y-4">
          {/* Active buses */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Bus Actifs</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="space-y-2">
              {activeBuses.length === 0 ? (
                <p className="text-[8px] text-slate-400 font-bold text-center py-4">Aucun bus en ligne</p>
              ) : (
                activeBuses.map(loc => {
                  const { label: ageLabel } = getUpdateAge(loc.updated_at);
                  return (
                    <motion.button
                      key={loc.bus_id}
                      whileHover={{ x: 2 }}
                      onClick={() => centerOnBus(loc)}
                      className={`w-full text-left p-2 rounded-lg border transition-all ${
                        selectedBus?.bus_id === loc.bus_id
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedBus?.bus_id === loc.bus_id ? 'bg-white/10' : 'bg-white border border-slate-200'
                        }`}>
                          <Bus className={`w-3.5 h-3.5 ${selectedBus?.bus_id === loc.bus_id ? 'text-emerald-400' : 'text-slate-400'}`} />
                        </div>
                        <div className="overflow-hidden flex-1 min-w-0">
                          <p className={`text-[9px] font-black uppercase truncate ${
                            selectedBus?.bus_id === loc.bus_id ? 'text-white' : 'text-slate-900'
                          }`}>{loc.buses?.name || 'Bus'}</p>
                          <p className={`text-[7px] font-bold truncate ${
                            selectedBus?.bus_id === loc.bus_id ? 'text-slate-400' : 'text-slate-500'
                          }`}>{loc.buses?.plate_number} • {Math.round(loc.speed || 0)} km/h</p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-[7px] font-black text-emerald-400 uppercase">Live</span>
                          <span className={`text-[7px] font-bold ${selectedBus?.bus_id === loc.bus_id ? 'text-slate-400' : 'text-slate-400'}`}>{ageLabel}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>

          {/* Stale / Offline buses */}
          {staleBuses.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Hors connexion</h3>
                <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
              </div>
              <div className="space-y-2">
                {staleBuses.map(loc => {
                  const { label: ageLabel } = getUpdateAge(loc.updated_at);
                  return (
                    <motion.button
                      key={loc.bus_id}
                      onClick={() => centerOnBus(loc)}
                      className="w-full text-left p-2 rounded-lg border bg-slate-50 border-slate-200 hover:border-amber-200 hover:bg-amber-50 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-slate-200 shrink-0">
                          <Bus className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                        <div className="overflow-hidden flex-1">
                          <p className="text-[9px] font-black uppercase truncate text-slate-600">{loc.buses?.name || 'Bus'}</p>
                          <p className="text-[7px] font-bold text-amber-600 truncate">{ageLabel}</p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Bus Detail */}
          <AnimatePresence>
            {selectedBus && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-slate-900 rounded-xl p-5 shadow-xl"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Détail Bus</h3>
                  <button
                    onClick={() => setSelectedBus(null)}
                    className="text-slate-600 hover:text-white transition-colors text-[8px] font-black"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-[13px] font-black text-white uppercase tracking-tight">{selectedBus.buses?.name}</p>
                    <p className="text-[7px] font-bold text-slate-400 uppercase">{selectedBus.buses?.plate_number}</p>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div>
                      <p className="text-slate-500 font-bold uppercase text-[7px] tracking-widest mb-0.5">Vitesse</p>
                      <p className="text-white font-black">{Math.round(selectedBus.speed || 0)} km/h</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold uppercase text-[7px] tracking-widest mb-0.5">Direction</p>
                      <p className="text-white font-black">{headingToLabel(selectedBus.heading)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold uppercase text-[7px] tracking-widest mb-0.5">Position</p>
                      <p className="text-white font-black font-mono text-[7px]">{selectedBus.latitude.toFixed(4)}, {selectedBus.longitude.toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold uppercase text-[7px] tracking-widest mb-0.5">Statut</p>
                      <p className={`font-black capitalize ${selectedBus.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>{selectedBus.status}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <h3 className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Légende</h3>
            <div className="space-y-1.5 text-[8px] font-bold text-slate-600">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span>Bus actif (&lt; 5 min)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span>Bus ralenti / idle</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                <span>Hors ligne / perdu</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
