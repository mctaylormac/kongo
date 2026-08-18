// [Agent Dev Mobile] - Action: Suivi Voyage avec MapView Google Maps - KonGO User App
// Pattern inspiré de KINTU mobile : PROVIDER_GOOGLE + validation GPS + fallback propre
import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Linking,
  Alert,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Navigation,
  MapPin,
  Bus,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  ChevronRight,
  Maximize2,
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';

// ─── Import conditionnel react-native-maps (pattern Kintu) ────────────────────
// Sur web, MapView n'est pas disponible — on affiche un fallback
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps;
  Marker = Maps.Marker || (Maps.default && Maps.default.Marker);
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE || (Maps.default && Maps.default.PROVIDER_GOOGLE);
} catch (_) {
  // Web / environnement sans support natif
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 280;

// ─── Types ────────────────────────────────────────────────────────────────────
type BusLocation = {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  status: 'active' | 'idle' | string;
  updated_at: string;
};

type TripInfo = {
  id: string;
  departure_time: string;
  origin: { name: string };
  destination: { name: string };
  agencies: { name: string };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isValidCoord(lat: any, lng: any): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

function headingToLabel(h: number | null): string {
  if (h === null || h === undefined) return '—';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(h / 45) % 8] || '—';
}

function formatSpeed(mps: number | null): string {
  if (mps === null || mps === undefined) return '—';
  return `${Math.round(mps * 3.6)} km/h`;
}

function isStale(updatedAt: string): boolean {
  return Date.now() - new Date(updatedAt).getTime() > 10 * 60 * 1000;
}

function timeSince(updatedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(updatedAt).getTime()) / 1000);
  if (diff < 60) return `il y a ${diff}s`;
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
  return `il y a ${Math.floor(diff / 3600)}h`;
}

// ─── Composant Principal ───────────────────────────────────────────────────────
export default function LiveTripScreen({ navigation, route }: any) {
  const rawParams = route?.params || {};
  const rawTrip = rawParams.trip;
  const trip = Array.isArray(rawTrip) ? rawTrip[0] : rawTrip;
  const bookingCode = rawParams.bookingCode;

  const [busLocation, setBusLocation] = useState<BusLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);

  const mapRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── Animation de pulsation du point Live ──
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.5, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // ── Chargement initial de la position ──
  const fetchBusLocation = useCallback(async () => {
    if (!trip?.id) return;
    try {
      const { data, error } = await supabase
        .from('bus_locations')
        .select('latitude, longitude, speed, heading, status, updated_at')
        .eq('trip_id', trip.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setBusLocation(data as BusLocation);
        setLastRefresh(
          new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
        // Centrer la caméra sur le bus
        if (mapRef.current && isValidCoord(data.latitude, data.longitude)) {
          mapRef.current.animateToRegion(
            {
              latitude: data.latitude,
              longitude: data.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            },
            600
          );
        }
      }
    } catch (err) {
      console.error('Erreur position bus:', err);
    } finally {
      setLoading(false);
    }
  }, [trip?.id]);

  // ── Souscription Supabase Realtime ──
  useEffect(() => {
    fetchBusLocation();
    if (!trip?.id) return;

    const channel = supabase
      .channel(`live-trip-${trip.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bus_locations',
          filter: `trip_id=eq.${trip.id}`,
        },
        (payload) => {
          setIsConnected(true);
          const newData = payload.new as BusLocation;
          if (newData && isValidCoord(newData.latitude, newData.longitude)) {
            setBusLocation(newData);
            setLastRefresh(
              new Date().toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })
            );
            // Animer la caméra vers la nouvelle position
            if (mapRef.current) {
              mapRef.current.animateToRegion(
                {
                  latitude: newData.latitude,
                  longitude: newData.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                },
                800
              );
            }
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => { supabase.removeChannel(channel); };
  }, [trip?.id, fetchBusLocation]);

  // ── Navigation Google Maps ──
  const openGoogleMaps = () => {
    if (!busLocation) {
      Alert.alert('Position indisponible', 'Le bus n\'est pas encore localisé.');
      return;
    }
    const { latitude, longitude } = busLocation;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`geo:${latitude},${longitude}?q=${latitude},${longitude}`).catch(() =>
        Alert.alert('Erreur', 'Impossible d\'ouvrir Google Maps.')
      );
    });
  };

  const openDestination = () => {
    const dest = trip?.destination?.name;
    if (!dest) return;
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest + ', Congo')}`
    );
  };

  // ─── Valeurs dérivées ───────────────────────────────────────────────────────
  const hasGPS = !!(busLocation && isValidCoord(busLocation.latitude, busLocation.longitude));
  const stale  = busLocation ? isStale(busLocation.updated_at) : false;
  // Désactivé temporairement pour éviter le crash natif de react-native-maps sur l'appareil
  const canUseNativeMap = false;

  const initialRegion = hasGPS
    ? {
        latitude: busLocation!.latitude,
        longitude: busLocation!.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        // Centré sur Kinshasa par défaut si pas de GPS
        latitude: -4.3276,
        longitude: 15.3136,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

  const departureDate = trip?.departure_time ? new Date(trip.departure_time) : null;

  // ─── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color="#0A0A0A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Suivi du Voyage</Text>
          <Text style={styles.headerSub}>{bookingCode}</Text>
        </View>
        <View style={[styles.connBadge, { backgroundColor: isConnected ? '#E8F5E9' : '#FFF3E0' }]}>
          {isConnected
            ? <Wifi size={13} color="#2E7D32" />
            : <WifiOff size={13} color="#EF6C00" />}
          <Text style={[styles.connText, { color: isConnected ? '#2E7D32' : '#EF6C00' }]}>
            {isConnected ? 'LIVE' : 'OFF'}
          </Text>
        </View>
      </View>

      {/* ── Barre de Route ── */}
      <View style={styles.routeBar}>
        <View style={styles.routeCity}>
          <Text style={styles.routeCityLabel}>DÉPART</Text>
          <Text style={styles.routeCityName} numberOfLines={1}>{trip?.origin?.name || '—'}</Text>
          <Text style={styles.routeCityTime}>
            {departureDate && !isNaN(departureDate.getTime())
              ? departureDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
              : '—'}
          </Text>
        </View>
        <View style={styles.routeArrow}>
          <View style={styles.routeLine} />
          <View style={styles.routeDot}>
            <Bus size={12} color="#FFF" />
          </View>
          <View style={styles.routeLine} />
        </View>
        <View style={[styles.routeCity, { alignItems: 'flex-end' }]}>
          <Text style={styles.routeCityLabel}>DESTINATION</Text>
          <Text style={[styles.routeCityName, { textAlign: 'right' }]} numberOfLines={1}>
            {trip?.destination?.name || '—'}
          </Text>
          <Text style={styles.routeCityTime}>Arrivée prévue</Text>
        </View>
      </View>

      {/* ══════════════ CARTE ══════════════ */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color="#9EBA15" />
            <Text style={styles.mapPlaceholderText}>Localisation du bus...</Text>
          </View>
        ) : (canUseNativeMap && MapView) ? (
          <>
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={initialRegion}
              showsUserLocation={false}
              showsMyLocationButton={false}
              showsCompass={false}
              toolbarEnabled={false}
            >
              {/* ── Marqueur Bus (position temps réel) ── */}
              {hasGPS && Marker && (
                <Marker
                  coordinate={{
                    latitude: busLocation!.latitude,
                    longitude: busLocation!.longitude,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  flat
                >
                  <View style={styles.busMarker}>
                    <Bus size={16} color="#0A0A0F" />
                  </View>
                </Marker>
              )}
            </MapView>

            {/* Overlay statut sur la carte */}
            <View style={styles.mapOverlayBadge}>
              <Animated.View
                style={[
                  styles.mapDotOuter,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: stale ? '#FFE0B2' : hasGPS ? '#C8E63C' : '#EEE',
                    opacity: 0.4,
                  },
                ]}
              />
              <View
                style={[
                  styles.mapDotInner,
                  { backgroundColor: stale ? '#EF6C00' : hasGPS ? '#9EBA15' : '#CCC' },
                ]}
              />
              <Text style={styles.mapOverlayText}>
                {!hasGPS ? 'Sans signal' : stale ? 'Signal faible' : 'En route'}
              </Text>
            </View>

            {/* Bouton ouvrir Maps externe */}
            <TouchableOpacity style={styles.mapExtBtn} onPress={openGoogleMaps}>
              <Maximize2 size={14} color="#0A0A0F" />
            </TouchableOpacity>
          </>
        ) : (
          /* Fallback si Maps pas disponible (ou désactivé pour éviter le crash natif) */
          <View style={styles.mapFallback}>
            <MapPin size={40} color={hasGPS ? "#9EBA15" : "#AAA"} />
            <Text style={styles.mapFallbackTitle}>
              {hasGPS ? "Suivi GPS en Cours" : "En attente du bus"}
            </Text>
            <Text style={styles.mapFallbackSub}>
              {hasGPS
                ? "La position en temps réel de votre bus est active. Appuyez ci-dessous pour le suivre directement sur la carte Google Maps."
                : "Dès que le chauffeur aura démarré le voyage, vous pourrez suivre sa position en temps réel ici."}
            </Text>
            {hasGPS && (
              <TouchableOpacity style={styles.openMapsBtn} onPress={openGoogleMaps} activeOpacity={0.85}>
                <Navigation size={16} color="#0A0A0F" />
                <Text style={styles.openMapsBtnText}>Suivre sur Google Maps</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ══════════════ PANNEAU BAS ══════════════ */}
      <View style={styles.bottomPanel}>

        {/* Métriques */}
        {hasGPS && (
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>VITESSE</Text>
              <Text style={styles.metricValue}>{formatSpeed(busLocation?.speed ?? null)}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>CAP</Text>
              <Text style={styles.metricValue}>{headingToLabel(busLocation?.heading ?? null)}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>STATUT</Text>
              <Text style={[
                styles.metricValue,
                { color: busLocation?.status === 'active' ? '#9EBA15' : '#888' },
              ]}>
                {busLocation?.status === 'active' ? 'En route' : 'Arrêté'}
              </Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>SYNC</Text>
              <View style={styles.syncRow}>
                <TouchableOpacity onPress={fetchBusLocation}>
                  <RefreshCw size={12} color="#9EBA15" />
                </TouchableOpacity>
                <Text style={styles.metricValue}>{lastRefresh || '—'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Alerte signal faible */}
        {stale && hasGPS && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>
              ⚠️ Signal GPS non reçu depuis +10 min. Données peut-être obsolètes.
            </Text>
          </View>
        )}

        {/* Pas de GPS */}
        {!hasGPS && !loading && (
          <View style={styles.noGpsRow}>
            <Text style={styles.noGpsText}>Aucune position disponible pour ce trajet.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchBusLocation}>
              <RefreshCw size={14} color="#9EBA15" />
              <Text style={styles.retryText}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Boutons de navigation */}
        <View style={styles.actionsRow}>
          {hasGPS && (
            <TouchableOpacity style={styles.primaryBtn} onPress={openGoogleMaps} activeOpacity={0.85}>
              <Navigation size={16} color="#0A0A0F" />
              <Text style={styles.primaryBtnText}>Rejoindre le bus</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.secondaryBtn, !hasGPS && { flex: 1 }]}
            onPress={openDestination}
            activeOpacity={0.85}
          >
            <MapPin size={16} color="#0A0A0F" />
            <Text style={styles.secondaryBtnText}>Voir destination</Text>
          </TouchableOpacity>
        </View>

        {/* Agence */}
        <View style={styles.agencyRow}>
          <View style={styles.agencyIcon}>
            <Bus size={14} color="#0A0A0F" />
          </View>
          <Text style={styles.agencyName}>{trip?.agencies?.name || 'KonGO Express'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F8F8F8' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  headerCenter:  { flex: 1 },
  headerTitle:   { fontSize: 17, fontWeight: '900', color: '#0A0A0A' },
  headerSub:     { fontSize: 10, color: '#999', fontWeight: '700', marginTop: 1 },
  connBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  connText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },

  // Route bar
  routeBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0A0A0F',
    paddingVertical: 14, paddingHorizontal: 20,
  },
  routeCity:      { flex: 1 },
  routeCityLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  routeCityName:  { color: '#FFF', fontSize: 14, fontWeight: '900', marginTop: 3 },
  routeCityTime:  { color: '#9EBA15', fontSize: 10, fontWeight: '700', marginTop: 3 },
  routeArrow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  routeLine:      { width: 20, height: 1.5, backgroundColor: 'rgba(255,255,255,0.15)' },
  routeDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#9EBA15', alignItems: 'center', justifyContent: 'center', marginHorizontal: 4,
  },

  // Map
  mapContainer: { height: MAP_HEIGHT, backgroundColor: '#E5E5E5' },
  map:          { ...StyleSheet.absoluteFillObject },
  mapPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12,
    backgroundColor: '#F0F0F0',
  },
  mapPlaceholderText: { color: '#888', fontSize: 13, fontWeight: '600' },

  // Map overlays
  mapOverlayBadge: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    elevation: 4,
  },
  mapDotOuter:  { position: 'absolute', width: 16, height: 16, borderRadius: 8 },
  mapDotInner:  { width: 8, height: 8, borderRadius: 4 },
  mapOverlayText: { fontSize: 11, fontWeight: '800', color: '#0A0A0A', marginLeft: 14 },
  mapExtBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center', elevation: 4,
  },

  // Map fallback
  mapFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#FAFAF9', paddingHorizontal: 28,
  },
  mapFallbackTitle: { fontSize: 16, color: '#0A0A0F', fontWeight: '900', textAlign: 'center' },
  mapFallbackSub: { fontSize: 12, color: '#666', fontWeight: '500', textAlign: 'center', lineHeight: 18, marginBottom: 6 },
  openMapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#C8E63C', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 12,
    elevation: 2,
  },
  openMapsBtnText: { fontSize: 13, fontWeight: '900', color: '#0A0A0F' },

  // Bus marker
  busMarker: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#C8E63C',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#FFF',
    elevation: 4,
  },

  // Bottom panel
  bottomPanel: {
    flex: 1, backgroundColor: '#FFF',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    marginTop: -20, paddingTop: 20,
    paddingHorizontal: 16, elevation: 8,
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F9F9F9', borderRadius: 14, padding: 14, marginBottom: 12,
  },
  metricItem:    { flex: 1, alignItems: 'center' },
  metricLabel:   { fontSize: 8, color: '#AAA', fontWeight: '900', letterSpacing: 0.8, marginBottom: 3 },
  metricValue:   { fontSize: 12, fontWeight: '900', color: '#0A0A0A' },
  metricDivider: { width: 1, height: 28, backgroundColor: '#EEE' },
  syncRow:       { flexDirection: 'row', alignItems: 'center', gap: 4 },

  // Alert
  alertBanner: {
    backgroundColor: '#FFF8E1', borderRadius: 12, padding: 12, marginBottom: 12,
    borderLeftWidth: 3, borderLeftColor: '#FFC107',
  },
  alertText: { fontSize: 12, color: '#795548', fontWeight: '600', lineHeight: 18 },

  // No GPS
  noGpsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  noGpsText: { flex: 1, fontSize: 12, color: '#888', fontWeight: '600' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  retryText: { fontSize: 12, fontWeight: '800', color: '#9EBA15' },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  primaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#C8E63C', paddingVertical: 14, borderRadius: 14,
  },
  primaryBtnText: { fontSize: 13, fontWeight: '900', color: '#0A0A0F' },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F0F0F0', paddingVertical: 14, borderRadius: 14,
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '900', color: '#0A0A0F' },

  // Agency
  agencyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 4 },
  agencyIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#F5FCC5', alignItems: 'center', justifyContent: 'center',
  },
  agencyName: { fontSize: 13, fontWeight: '800', color: '#555' },
});
