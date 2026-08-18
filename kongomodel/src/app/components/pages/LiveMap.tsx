import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Bus, Navigation, Search, RotateCw, Radio, MapPin,
  Clock, AlertCircle, CheckCircle2, Wrench, Users, WifiOff
} from "../../../lib/icons";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { supabase } from "../../../lib/supabase";
import { useAppState } from "../../../hooks/useAppState";
import { toast } from "sonner";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getUpdateAge(dateStr: string | null): { label: string; isStale: boolean } {
  if (!dateStr) return { label: 'Inconnu', isStale: true };
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 10) return { label: 'Ã€ l\'instant', isStale: false };
  if (secs < 60) return { label: `Il y a ${secs}s`, isStale: false };
  const mins = Math.floor(secs / 60);
  if (mins < 10) return { label: `Il y a ${mins} min`, isStale: false };
  if (mins < 60) return { label: `Il y a ${mins} min`, isStale: true };
  return { label: `Il y a ${Math.floor(mins / 60)}h`, isStale: true };
}

function headingToLabel(h: number | null): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round((h || 0) / 45) % 8] || 'â€”';
}

const DEFAULT_CENTER: [number, number] = [-4.4419, 15.2663];

// Leaflet CSS import
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: any; hex: string }> = {
  "on-trip":     { label: "En Voyage",    color: "text-[#34C759]", bg: "bg-[#34C759]/10",  icon: Navigation, hex: "#34C759" },
  "active":      { label: "Disponible",   color: "text-[#007AFF]", bg: "bg-[#007AFF]/10",  icon: CheckCircle2, hex: "#007AFF" },
  "maintenance": { label: "Maintenance",  color: "text-[#FF9500]", bg: "bg-[#FF9500]/10",  icon: Wrench, hex: "#FF9500" },
  "inactive":    { label: "Inactif",      color: "text-[#86868B]", bg: "bg-[#86868B]/10",  icon: Bus, hex: "#86868B" },
};

// â”€â”€â”€ Custom icon logic â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const createBusIcon = async (bus: any) => {
  const L = (await import('leaflet')).default;
  const isStale = bus.loc_updated_at ? (Date.now() - new Date(bus.loc_updated_at).getTime() > 10 * 60 * 1000) : true;
  let color = STATUS_META[bus.status]?.hex || "#007AFF";
  if (isStale && bus.latitude) color = "#86868B"; // Stale positions turn gray-ish

  const html = `<div style="background:${color};color:white;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.25);border:3px solid white;transform: rotate(${bus.heading || 0}deg);">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(-${bus.heading || 0}deg);">
      <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
      <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
      <circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>
    </svg>
  </div>`;

  return L.divIcon({
    html,
    className: "custom-bus-marker",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18],
  });
};

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function LiveMap() {
  const { userRole, agencyId } = useAppState();

  const [allBuses, setAllBuses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  
  // Realtime & map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});
  const [mapReady, setMapReady] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
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
    if (!mapContainerRef.current || leafletMapRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapContainerRef.current!, {
        center: DEFAULT_CENTER,
        zoom: 11,
      });

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

  // â”€â”€â”€ Fetch buses with trip info and live locations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchData = useCallback(async () => {
    try {
      // 1. Query buses simply (no nested joins to avoid PostgREST errors)
      let busesQuery = supabase
        .from("buses")
        .select("id, name, plate_number, capacity, type, status, agency_id");

      // 2. Query GPS locations
      let locsQuery = supabase.from("bus_locations").select("*");

      // 3. Query active trips separately
      let tripsQuery = supabase
        .from("trips")
        .select(`
          id,
          bus_id,
          departure_time,
          status,
          driver_id,
          origin:locations!origin_location_id(name),
          destination:locations!destination_location_id(name),
          driver:profiles!driver_id(full_name)
        `)
        .in("status", ["scheduled", "in_progress", "departed", "full"]);

      if (userRole !== "superuser" && agencyId) {
        busesQuery = busesQuery.eq("agency_id", agencyId);
        locsQuery  = locsQuery.eq("agency_id", agencyId);
        tripsQuery = tripsQuery.eq("agency_id", agencyId);
      }

      const [busesRes, locsRes, tripsRes] = await Promise.all([
        busesQuery,
        locsQuery,
        tripsQuery,
      ]);

      if (busesRes.error) throw busesRes.error;
      if (locsRes.error)  throw locsRes.error;
      if (tripsRes.error) console.warn("Trips fetch warning:", tripsRes.error);

      // Build lookup maps
      const locsByBusId = (locsRes.data || []).reduce((acc: any, loc: any) => {
        acc[loc.bus_id] = loc;
        return acc;
      }, {} as Record<string, any>);

      const tripsByBusId = (tripsRes.data || []).reduce((acc: any, trip: any) => {
        if (trip.bus_id && !acc[trip.bus_id]) acc[trip.bus_id] = trip;
        return acc;
      }, {} as Record<string, any>);

      // Merge into enriched bus objects
      const enriched = (busesRes.data || []).map((bus: any) => {
        const loc        = locsByBusId[bus.id];
        const activeTrip = tripsByBusId[bus.id] || null;

        // Derive effective status: any bus with an active trip is "on-trip".
        // The trips query already excludes completed/cancelled, so any result = bus in use.
        const effectiveStatus = activeTrip ? "on-trip" : bus.status;

        return {
          ...bus,
          status:         effectiveStatus,   // override with derived value
          matricule:      bus.plate_number,
          activeTrip,
          profiles:       activeTrip?.driver || null,
          latitude:       loc?.latitude   || null,
          longitude:      loc?.longitude  || null,
          speed:          loc?.speed      || 0,
          heading:        loc?.heading    || 0,
          loc_updated_at: loc?.updated_at || null,
        };
      });

      setAllBuses(enriched);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("LiveMap fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userRole, agencyId]);

  // Update map markers whenever mapReady or filtered data changes
  const updateMapMarkers = useCallback(async (busesToDisplay: any[]) => {
    if (!leafletMapRef.current || !mapReady) return;
    const L = (await import('leaflet')).default;

    // Remove markers for buses no longer present
    const currentIds = new Set(busesToDisplay.map(b => b.id));
    Object.keys(markersRef.current).forEach(busId => {
      if (!currentIds.has(busId)) {
        markersRef.current[busId].remove();
        delete markersRef.current[busId];
      }
    });

    for (const bus of busesToDisplay) {
      const lat = bus.latitude || (DEFAULT_CENTER[0] + (Math.random() - 0.5) * 0.15);
      const lng = bus.longitude || (DEFAULT_CENTER[1] + (Math.random() - 0.5) * 0.15);

      const icon = await createBusIcon(bus);
      const meta = STATUS_META[bus.status] || STATUS_META["active"];

      const departureTimeHtml = bus.activeTrip?.departure_time ? `
        <p style="color:#86868B; margin-top:2px; display:flex; align-items:center; gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          DÃ©part : ${new Date(bus.activeTrip.departure_time).toLocaleTimeString("fr-CD", { hour: "2-digit", minute: "2-digit" })}
        </p>
      ` : '';

      const tripHtml = bus.activeTrip ? `
        <div style="padding-top:8px; border-top:1px solid rgba(0,0,0,0.05); font-size:12px; color:#1D1D1F; margin-bottom:8px;">
          <p style="font-weight:600; color:#007AFF;">
            ${bus.activeTrip.origin?.name} â†’ ${bus.activeTrip.destination?.name}
          </p>
          ${departureTimeHtml}
        </div>
      ` : '';

      const driverHtml = bus.profiles?.full_name ? `
        <p style="font-size:12px; color:#86868B; display:flex; align-items:center; gap:4px;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          ${bus.profiles.full_name}
        </p>
      ` : '';

      const mockWarningHtml = !bus.latitude ? `
        <p style="font-size:10px; color:#FF9500; font-style:italic; margin-top:8px;">
          âš  Position approximative (GPS non transmis)
        </p>
      ` : '';

      const popupContent = `
        <div style="font-family: system-ui; min-width: 200px; padding: 4px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <strong style="color:#1D1D1F; font-size:15px; font-weight:bold;">${bus.name}</strong>
            <span style="font-size:10px; font-weight:bold; padding:2px 8px; border-radius:9999px; background-color:${meta.hex}1A; color:${meta.hex};">
              ${meta.label}
            </span>
          </div>
          <span style="display:block; color:#86868B; font-size:12px; font-family:monospace; margin-bottom:8px;">${bus.matricule}</span>
          
          ${tripHtml}

          <div style="padding-top:8px; border-top:1px solid rgba(0,0,0,0.05); display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11px; margin-bottom:8px;">
            <div>
              <span style="color:#86868B;">Vitesse</span><br>
              <strong style="color:#1D1D1F;">${Math.round(bus.speed || 0)} km/h</strong>
            </div>
            <div>
              <span style="color:#86868B;">Cap</span><br>
              <strong style="color:#1D1D1F;">${headingToLabel(bus.heading)}</strong>
            </div>
            <div style="grid-column: span 2;">
              <span style="color:#86868B;">Mise Ã  jour</span><br>
              <strong style="color:#1D1D1F;">${getUpdateAge(bus.loc_updated_at).label}</strong>
            </div>
          </div>
          
          ${driverHtml}
          ${mockWarningHtml}
        </div>
      `;

      if (markersRef.current[bus.id]) {
        markersRef.current[bus.id]
          .setLatLng([lat, lng])
          .setIcon(icon)
          .setPopupContent(popupContent);
      } else {
        const marker = L.marker([lat, lng], { icon })
          .addTo(leafletMapRef.current)
          .bindPopup(popupContent, {
            className: 'custom-leaflet-popup',
            minWidth: 200
          });
        marker.on('click', () => setSelectedBusId(bus.id));
        markersRef.current[bus.id] = marker;
      }
    }

  }, [mapReady]);

  // Center map on selected bus
  const centerOnBus = useCallback((bus: any) => {
    if (!leafletMapRef.current || !bus) return;
    const lat = bus.latitude || (DEFAULT_CENTER[0] + (Math.random() - 0.5) * 0.15);
    const lng = bus.longitude || (DEFAULT_CENTER[1] + (Math.random() - 0.5) * 0.15);
    leafletMapRef.current.setView([lat, lng], 14, { animate: true });
    markersRef.current[bus.id]?.openPopup();
    setSelectedBusId(bus.id);
  }, []);

  // â”€â”€â”€ Realtime subscription on buses and locations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    fetchData();

    // Use kongobackoffice logic: channel for locations with proper connection status
    const channelLocs = supabase
      .channel("bus-locations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "bus_locations" }, (payload) => {
        setIsConnected(true);
        fetchData();
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
           // Optional toast if needed
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    const channelBuses = supabase
      .channel("buses-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "buses" }, () => {
        fetchData();
      })
      .subscribe();

    channelRef.current = channelLocs;

    return () => { 
      supabase.removeChannel(channelBuses);
      supabase.removeChannel(channelLocs);
    };
  }, [fetchData]);

  // â”€â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const filtered = allBuses.filter(bus => {
    const matchSearch =
      bus.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.matricule?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === "all" || bus.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Re-render markers when filtered locations or map readiness changes
  useEffect(() => {
    if (mapReady && filtered.length > 0) {
      updateMapMarkers(filtered);
    } else if (mapReady && filtered.length === 0) {
      // Clear all markers if filtered is empty
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
    }
  }, [mapReady, filtered, updateMapMarkers]);

  // Auto-fit bounds on initial load if we have data
  useEffect(() => {
    if (mapReady && filtered.length > 0 && leafletMapRef.current) {
      const L = window.L;
      if (!L) return;
      const valid = filtered.filter(b => b.latitude && b.longitude);
      if (valid.length > 0) {
        const bounds = L.latLngBounds(valid.map(b => [b.latitude, b.longitude]));
        leafletMapRef.current.fitBounds(bounds, { padding: [40, 40] });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady]); 

  const enVoyage = allBuses.filter(b => b.status === "on-trip");
  const actifs   = allBuses.filter(b => b.status === "active");
  const mainten  = allBuses.filter(b => b.status === "maintenance");

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-[32px] font-bold text-[#1D1D1F] tracking-tight">Suivi GPS</h1>
          <p className="text-[15px] text-[#86868B] mt-1">
            Localisation en temps rÃ©el de la flotte
            {lastUpdated && (
              <span className="ml-2 text-[12px] text-[#34C759]">
                Â· Mis Ã  jour {lastUpdated.toLocaleTimeString("fr-CD", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Connection indicator */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-bold ${
            isConnected
              ? 'bg-[#34C759]/10 border-[#34C759]/20 text-[#34C759]'
              : 'bg-[#FF9500]/10 border-[#FF9500]/20 text-[#FF9500]'
          }`}>
            {isConnected
              ? <><Radio className="w-3.5 h-3.5 animate-pulse" /> ConnectÃ©</>
              : <><WifiOff className="w-3.5 h-3.5" /> DÃ©connectÃ©</>
            }
          </div>

          <button
            onClick={() => { setIsLoading(true); fetchData(); }}
            className="w-10 h-10 flex items-center justify-center bg-white border border-black/5 rounded-xl hover:bg-black/5 transition-all"
          >
            <RotateCw className={`w-5 h-5 text-[#86868B] ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868B]" />
            <input
              type="text"
              placeholder="Rechercher un bus..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-11 pl-10 pr-4 bg-white border border-black/5 rounded-xl text-[14px] w-[200px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-11 px-4 bg-white border border-black/5 rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
          >
            <option value="all">Toute la flotte</option>
            <option value="on-trip">En Voyage</option>
            <option value="active">Disponibles</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "En Voyage",  count: enVoyage.length, color: "text-[#34C759]", bg: "bg-[#34C759]/10", icon: Navigation, filter: "on-trip" },
          { label: "Disponibles",count: actifs.length,   color: "text-[#007AFF]", bg: "bg-[#007AFF]/10", icon: CheckCircle2, filter: "active" },
          { label: "Maintenance",count: mainten.length,  color: "text-[#FF9500]", bg: "bg-[#FF9500]/10", icon: Wrench, filter: "maintenance" },
        ].map(k => (
          <button
            key={k.label}
            onClick={() => setStatusFilter(statusFilter === k.filter ? "all" : k.filter)}
            className={`flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${statusFilter === k.filter ? "border-black/20 shadow-sm" : "border-transparent bg-white hover:border-black/10"}`}
          >
            <div className={`w-10 h-10 ${k.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <div>
              <p className="text-[12px] text-[#86868B] font-medium">{k.label}</p>
              <p className={`text-[22px] font-black ${k.color}`}>{k.count}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Main: Sidebar + Map */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-5 min-h-0">
        {/* Sidebar */}
        <Card className="lg:col-span-1 flex flex-col min-h-0 overflow-hidden">
          <CardHeader className="pb-3 shrink-0">
            <CardTitle className="text-[15px]">Flotte ({filtered.length})</CardTitle>
            <CardDescription className="text-[12px]">
              {statusFilter === "all" ? "Tous les statuts" : STATUS_META[statusFilter]?.label || statusFilter}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-[#86868B]">
                <Bus className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-[13px] italic">Aucun bus trouvÃ©</p>
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {filtered.map(bus => {
                  const meta = STATUS_META[bus.status] || STATUS_META["Actif"];
                  const Icon = meta.icon;
                  const isSelected = selectedBusId === bus.id;
                  return (
                    <button
                      key={bus.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedBusId(null);
                        } else {
                          centerOnBus(bus);
                        }
                      }}
                      className={`w-full p-4 flex items-center gap-3 hover:bg-black/5 transition-all text-left group ${isSelected ? "bg-black/[0.04]" : ""}`}
                    >
                      <div className={`w-10 h-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon className={`w-5 h-5 ${meta.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[#1D1D1F] truncate">{bus.name}</p>
                        <p className="text-[11px] text-[#86868B] font-mono truncate">{bus.matricule}</p>
                        {bus.activeTrip && (
                          <p className="text-[11px] text-[#007AFF] mt-0.5 truncate">
                            {bus.activeTrip.origin?.name} â†’ {bus.activeTrip.destination?.name}
                          </p>
                        )}
                        {bus.profiles?.full_name && (
                          <p className="text-[11px] text-[#86868B] truncate flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 shrink-0" /> {bus.profiles.full_name}
                          </p>
                        )}
                      </div>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${bus.status === "on-trip" ? "bg-[#34C759] animate-pulse" : bus.status === "maintenance" ? "bg-[#FF9500]" : bus.status === "inactive" ? "bg-[#86868B]" : "bg-[#007AFF]"}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Map */}
        <Card className="lg:col-span-3 overflow-hidden border-0 shadow-xl relative z-0">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-[1000] flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span className="text-[12px] font-bold text-[#1D1D1F]">Chargement de la carte...</span>
              </div>
            </div>
          )}

          <div className="absolute inset-0">
             {/* Leaflet Map Target */}
             <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 0 }} />
          </div>

          {/* LÃ©gende flottante */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-white/90 backdrop-blur-md rounded-full shadow-xl border border-white/80 flex items-center gap-6 z-[1000] pointer-events-none">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#34C759] animate-pulse" />
              <span className="text-[11px] font-bold text-[#1D1D1F]">En Voyage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#007AFF]" />
              <span className="text-[11px] font-bold text-[#1D1D1F]">Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF9500]" />
              <span className="text-[11px] font-bold text-[#1D1D1F]">Maintenance</span>
            </div>
          </div>
        </Card>
      </div>

      <style>{`
        /* Global override for Leaflet popups to match UI styling */
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          padding: 0;
          border: 1px solid rgba(0,0,0,0.05);
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 12px;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: white;
          border: 1px solid rgba(0,0,0,0.05);
        }
      `}</style>
    </div>
  );
}
