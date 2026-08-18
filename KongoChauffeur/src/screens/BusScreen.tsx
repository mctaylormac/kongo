import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, RefreshControl, StatusBar, Alert, Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { 
  Bus, 
  Calendar, 
  Users, 
  Clock, 
  CreditCard, 
  MapPin, 
  Play, 
  Square 
} from 'lucide-react-native';

interface BusScreenProps {
  driverId: string;
}

type TripStatus = 'scheduled' | 'in_progress' | 'departed' | 'completed' | 'cancelled';

const STATUS_CFG: Record<TripStatus, { label: string; color: string; bg: string }> = {
  scheduled:   { label: 'Programmé',   color: '#C8E63C', bg: '#2A3300' },
  in_progress: { label: 'En cours',    color: '#4CAF50', bg: '#1A3A1A' },
  departed:    { label: 'En route',     color: '#4CAF50', bg: '#1A3A1A' },
  completed:   { label: 'Terminé',     color: '#888888', bg: '#1A1A1A' },
  cancelled:   { label: 'Annulé',      color: '#F44336', bg: '#3A1010' },
};

const GPS_INTERVAL_MS = 1 * 60 * 1000; // 1 minutes
const GPS_TIME_INTERVAL_MS = 20 * 1000;
const GPS_DISTANCE_INTERVAL_M = 25;

export default function BusScreen({ driverId }: BusScreenProps) {
  const [bus, setBus]               = useState<any>(null);
  const [trip, setTrip]             = useState<any>(null);
  const [profile, setProfile]       = useState<any>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [lastPos, setLastPos]       = useState<{ lat: number; lng: number } | null>(null);
  const [trackingStatus, setTrackingStatus] = useState('');

  const [dbDriverId, setDbDriverId] = useState<string | null>(null);
  const locationSubRef = useRef<{ remove: () => void } | null>(null);
  const gpsIntervalRef = useRef<any>(null);

  // ── Fetch assignment ────────────────────────────────────────
  const fetchAssignment = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch Profile info first
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, phone_number, agency_id')
        .eq('id', driverId)
        .single();
      
      if (p) setProfile(p);

      // 2. Fetch Driver assignment and Bus details
      // Note: Relationship is profile.id -> drivers.user_id -> buses.id (via assigned_bus_id)
      const { data: drv } = await supabase
        .from('drivers')
        .select(`
          id, 
          assigned_bus_id,
          buses:buses(
            id, name, plate_number, capacity, type, status
          )
        `)
        .eq('user_id', driverId)
        .maybeSingle();

      if (drv?.id) setDbDriverId(drv.id);

      const assignedBus = drv?.buses;
      // In case the join name is different or multiple, we handle it
      const busData = Array.isArray(assignedBus) ? assignedBus[0] : assignedBus;
      
      setBus(busData || null);

      if (busData?.id) {
        // Cherche d'abord un voyage actif (scheduled, in_progress, departed)
        // Trie par departure_time DESC pour trouver le plus récent en priorité (gère les voyages oubliés)
        const { data: tripData, error: tripErr } = await supabase
          .from('trips')
          .select(`
            id, departure_time, status, price,
            origin:locations!origin_location_id(name),
            destination:locations!destination_location_id(name),
            bookings(id, passenger_count, status)
          `)
          .eq('bus_id', busData.id)
          .in('status', ['scheduled', 'in_progress', 'departed'])
          .order('departure_time', { ascending: false })  // Plus récent en premier
          .limit(1)
          .maybeSingle();

        if (tripErr) console.error("Trip Fetch Error:", tripErr);

        if (tripData) {
          // [Agent Dev Mobile] - Fetch des scans valides pour calculer les passagers à bord
          const { data: scansData } = await supabase
            .from('ticket_scans')
            .select('booking_id')
            .eq('trip_id', tripData.id)
            .eq('result', 'valid');
          
          const scannedBookingIds = new Set((scansData || []).map((s: any) => s.booking_id));

          setTrip({
            ...tripData,
            departure: tripData.departure_time,
            scannedBookingIds: scannedBookingIds
          });
          // Un voyage in_progress ou departed = suivi actif, même s'il date d'avant
          setIsTracking(tripData.status === 'in_progress' || tripData.status === 'departed');
        } else {
          setTrip(null);
          setIsTracking(false);
        }
      } else {
        setTrip(null);
        setIsTracking(false);
      }
    } catch (e) {
      console.error("Error fetching assignment:", e);
      setBus(null); 
      setTrip(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driverId]);

  useEffect(() => { fetchAssignment(); }, [fetchAssignment]);

  // ── Cleanup on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (locationSubRef.current) locationSubRef.current.remove();
      if (gpsIntervalRef.current) {
        clearInterval(gpsIntervalRef.current);
      }
    };
  }, []);

  // ── Send GPS position to Supabase ───────────────────────────
  const sendPosition = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setTrackingStatus('📍 Permission GPS refusée');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude, speed, heading, accuracy } = loc.coords;
      setLastPos({ lat: latitude, lng: longitude });

      if (!bus?.id || !dbDriverId) return;

      await supabase.from('bus_locations').upsert([{
        driver_id:   dbDriverId,
        bus_id:      bus.id,
        trip_id:     trip?.id || null,
        agency_id:   profile?.agency_id || null,
        latitude,
        longitude,
        speed:       speed ?? 0,
        heading:     heading ?? 0,
        accuracy:    accuracy ?? null,
        status:      'active',
        updated_at:  new Date().toISOString(),
      }], { onConflict: 'bus_id' });

      const now = new Date().toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' });
      setTrackingStatus(`✅ Envoyé à ${now}`);
    } catch (e: any) {
      setTrackingStatus(`⚠️ Erreur GPS: ${e.message}`);
    }
  }, [driverId, bus, trip, profile]);

  // ── Start tracking ──────────────────────────────────────────
  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Activez la localisation pour le suivi GPS.');
      return;
    }

    // Update trip status
    if (trip?.status === 'scheduled') {
      const { error: tripUpdateErr } = await supabase.from('trips').update({ status: 'in_progress' }).eq('id', trip.id);
      if (tripUpdateErr) {
        console.error('Erreur mise à jour statut voyage:', tripUpdateErr);
        Alert.alert(
          'Erreur',
          'Impossible de démarrer le voyage. Contactez votre responsable.\n\n' + tripUpdateErr.message
        );
        return;
      }
    }

    setIsTracking(true);
    setTrackingStatus('🛰 Suivi actif — envoi toutes les 5 min');

    // Send immediately then every 5 min
    await sendPosition();
    gpsIntervalRef.current = setInterval(sendPosition, GPS_INTERVAL_MS);

    fetchAssignment(true);
  };

  // ── Stop tracking ───────────────────────────────────────────
  const stopTracking = async () => {
    if (!trip?.id) {
      Alert.alert('Erreur', 'Aucun voyage actif à terminer.');
      return;
    }

    Alert.alert(
      'Terminer le voyage',
      `Terminer le voyage ${trip.origin?.name ?? ''} → ${trip.destination?.name ?? ''} ?\n\nLe suivi GPS sera arrêté et le voyage marqué comme complété.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: async () => {
            // 1. Arrêt immédiat du timer GPS (ne bloque pas)
            if (gpsIntervalRef.current) {
              clearInterval(gpsIntervalRef.current);
              gpsIntervalRef.current = null;
            }
            if (locationSubRef.current) {
              locationSubRef.current.remove();
              locationSubRef.current = null;
            }

            setTrackingStatus('⏳ Fermeture du voyage...');

            // 2. Position GPS finale (optionnel — ne bloque pas la fin du voyage)
            try {
              if (bus?.id && dbDriverId) {
                const loc = await Promise.race([
                  Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
                  new Promise<never>((_, reject) => setTimeout(() => reject(new Error('GPS timeout')), 5000)),
                ]);
                await supabase.from('bus_locations').upsert([{
                  driver_id:  dbDriverId,
                  bus_id:     bus.id,
                  trip_id:    trip.id,
                  agency_id:  profile?.agency_id || null,
                  latitude:   (loc as any).coords.latitude,
                  longitude:  (loc as any).coords.longitude,
                  status:     'idle',
                  updated_at: new Date().toISOString(),
                }], { onConflict: 'bus_id' });
              }
            } catch (gpsErr) {
              // GPS optionnel — on continue quand même
              console.warn('GPS final ignoré:', gpsErr);
            }

            // 3. Mise à jour du statut en base (critique — gérée séparément)
            const tripId = trip.id;
            const { error: updateErr } = await supabase
              .from('trips')
              .update({ status: 'completed' })
              .eq('id', tripId);

            if (updateErr) {
              console.error('Erreur mise à jour voyage:', updateErr);
              setTrackingStatus('❌ Erreur — réessayez');
              Alert.alert(
                'Erreur réseau',
                'Impossible de terminer le voyage. Vérifiez votre connexion et réessayez.\n\n' + updateErr.message,
                [{ text: 'OK' }]
              );
              return; // NE PAS réinitialiser l'état si ça a échoué
            }

            // 4. Succès — réinitialiser l'état local
            setIsTracking(false);
            setLastPos(null);
            setTrackingStatus('✅ Voyage terminé !');
            setTimeout(() => setTrackingStatus(''), 3000);
            fetchAssignment(true);
          },
        },
      ],
    );
  };

  // ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <ActivityIndicator color="#C8E63C" size="large" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  // [Agent Dev Mobile] - Le total doit inclure Confirmed (à venir) et Completed (déjà scannés)
  const validBookings = trip?.bookings?.filter((b: any) => b.status === 'confirmed' || b.status === 'completed') || [];
  const totalPassengers   = validBookings.reduce((s: number, b: any) => s + (b.passenger_count || 1), 0);
  const occupancyPct      = bus ? Math.round((totalPassengers / bus.capacity) * 100) : 0;
  
  // Les passagers scannés sont ceux dont le booking a été validé (completed ou présent dans ticket_scans)
  const scannedPassengers = validBookings
    .filter((b: any) => b.status === 'completed' || trip?.scannedBookingIds?.has(b.id))
    .reduce((s: number, b: any) => s + (b.passenger_count || 1), 0);
  const verifiedPct       = totalPassengers > 0 ? Math.round((scannedPassengers / totalPassengers) * 100) : 0;

  const statusCfg         = trip ? (STATUS_CFG[trip.status as TripStatus] || STATUS_CFG.scheduled) : null;
  const depDate           = trip ? new Date(trip.departure) : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAssignment(true)} tintColor="#C8E63C" />}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Bus</Text>
        <Text style={styles.headerSub}>Affectation en cours</Text>
      </View>

      {!bus ? (
        <View style={styles.emptyBox}>
          <Bus color="#666" size={56} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Aucun bus assigné</Text>
          <Text style={styles.emptySubtext}>Votre responsable n'a pas encore associé un bus à votre compte.</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => fetchAssignment(true)}>
            <Text style={styles.refreshBtnText}>Actualiser</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ── BUS CARD ── */}
          <View style={styles.busCard}>
            <View style={styles.busCardTop}>
              <View style={styles.busIconBox}>
                <Bus color="#C8E63C" size={26} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.busNumber}>{bus.name}</Text>
                <Text style={styles.busPlate}>{bus.plate_number}</Text>
              </View>
              <View style={[styles.busBadge, {
                backgroundColor: bus.status === 'active' ? '#1A3A1A' : '#3A1010',
                borderColor: bus.status === 'active' ? '#4CAF50' : '#F44336',
              }]}>
                <Text style={[styles.busBadgeText, { color: bus.status === 'active' ? '#4CAF50' : '#F44336' }]}>
                  {bus.status === 'active' ? '● Actif' : '● Inactif'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoGrid}>
              <InfoCell icon={Bus} label="Type"   value={bus.type || 'Standard'} />
              <InfoCell icon={Users} label="Capacité" value={`${bus.capacity} places`} />
            </View>

            {trip && (
              <View style={styles.gaugesContainer}>
                {/* ── Jauge 1: Places Vendues vs Capacité ── */}
                <View style={styles.occupancyBox}>
                  <View style={styles.occupancyTop}>
                    <Text style={styles.occupancyLabel}>Places Vendues</Text>
                    <Text style={styles.occupancyPct}>{totalPassengers} / {bus.capacity}</Text>
                  </View>
                  <View style={styles.occupancyBar}>
                    <View style={[styles.occupancyFill, {
                      width: `${Math.min(occupancyPct, 100)}%` as any,
                      backgroundColor: occupancyPct >= 90 ? '#F44336' : occupancyPct >= 70 ? '#FFC107' : '#C8E63C',
                    }]} />
                  </View>
                </View>

                {/* ── Jauge 2: Passagers Scannés (À bord) vs Vendues ── */}
                <View style={styles.occupancyBox}>
                  <View style={styles.occupancyTop}>
                    <Text style={styles.occupancyLabel}>Passagers Scannés (À bord)</Text>
                    <Text style={[styles.occupancyPct, { color: '#4CAF50' }]}>{scannedPassengers} / {totalPassengers}</Text>
                  </View>
                  <View style={styles.occupancyBar}>
                    <View style={[styles.occupancyFill, {
                      width: `${Math.min(verifiedPct, 100)}%` as any,
                      backgroundColor: '#4CAF50',
                    }]} />
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* ── TRIP CARD ── */}
          {!trip ? (
            <View style={styles.noTripBox}>
              <Calendar color="#666" size={40} style={{ marginBottom: 12 }} />
              <Text style={styles.noTripText}>Aucun voyage programmé</Text>
              <Text style={styles.noTripSub}>Votre prochain voyage apparaîtra ici.</Text>
            </View>
          ) : (
            <View style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripTitle}>Voyage</Text>
                {statusCfg && (
                  <View style={[styles.tripStatus, { backgroundColor: statusCfg.bg, borderColor: statusCfg.color }]}>
                    <Text style={[styles.tripStatusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
                  </View>
                )}
              </View>

              <View style={styles.routeRow}>
                <View style={styles.routeCity}>
                  <Text style={styles.routeCityName}>{trip.origin?.name || '—'}</Text>
                  <Text style={styles.routeCityLabel}>Départ</Text>
                </View>
                <Text style={styles.routeArrow}>→</Text>
                <View style={[styles.routeCity, { alignItems: 'flex-end' }]}>
                  <Text style={styles.routeCityName}>{trip.destination?.name || '—'}</Text>
                  <Text style={styles.routeCityLabel}>Arrivée</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoGrid}>
                <InfoCell icon={Calendar} label="Date"      value={depDate ? depDate.toLocaleDateString('fr-CD') : '—'} />
                <InfoCell icon={Clock} label="Heure"     value={depDate ? depDate.toLocaleTimeString('fr-CD', { hour: '2-digit', minute: '2-digit' }) : '—'} />
                <InfoCell icon={Users} label="Passagers" value={`${totalPassengers} confirmé(s)`} />
                <InfoCell icon={CreditCard} label="Prix/siège" value={`${(trip.price || 0).toLocaleString('fr-CD')} FC`} />
              </View>
 
              {/* ── GPS ACTION BUTTONS ── */}
              <View style={styles.gpsSection}>
                {/* Status bar */}
                {isTracking && (
                  <View style={styles.gpsStatusBar}>
                    <View style={styles.gpsDot} />
                    <Text style={styles.gpsStatusText}>
                      Suivi GPS actif · toutes les 5 min
                    </Text>
                  </View>
                )}
 
                {trackingStatus ? (
                  <Text style={styles.trackingMsg}>{trackingStatus}</Text>
                ) : null}
 
                {lastPos && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                    <MapPin color="#555" size={12} />
                    <Text style={styles.coordsText}>
                      {lastPos.lat.toFixed(5)}, {lastPos.lng.toFixed(5)}
                    </Text>
                  </View>
                )}
 
                {!isTracking ? (
                  /* DÉBUT DE VOYAGE */
                  <TouchableOpacity
                    style={styles.startBtn}
                    activeOpacity={0.85}
                    onPress={startTracking}
                  >
                    <Play color="#C8E63C" size={18} fill="#C8E63C" />
                    <Text style={styles.startBtnText}>Début du voyage</Text>
                  </TouchableOpacity>
                ) : (
                  /* FIN DE VOYAGE */
                  <TouchableOpacity
                    style={styles.stopBtn}
                    activeOpacity={0.85}
                    onPress={stopTracking}
                  >
                    <Square color="#F44336" size={16} fill="#F44336" />
                    <Text style={styles.stopBtnText}>Fin du voyage</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function InfoCell({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Icon color="#C8E63C" size={20} style={{ marginBottom: 6 }} />
      <Text style={styles.infoCellLabel}>{label}</Text>
      <Text style={styles.infoCellValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#0A0A0A' },
  content:         { padding: 16, paddingBottom: 40 },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A0A0A' },
  loadingText:     { color: '#888', marginTop: 12, fontSize: 14 },

  header:          { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', marginBottom: 20, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  headerTitle:     { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  headerSub:       { fontSize: 13, color: '#888', fontWeight: '600' },

  emptyBox:        { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyIcon:       { fontSize: 56, marginBottom: 16 },
  emptyTitle:      { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  emptySubtext:    { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  refreshBtn:      { backgroundColor: '#C8E63C', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  refreshBtnText:  { color: '#0A0A0A', fontWeight: '800', fontSize: 15 },

  busCard:         { backgroundColor: '#141414', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 16 },
  busCardTop:      { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  busIconBox:      { width: 52, height: 52, borderRadius: 16, backgroundColor: '#1E2A00', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C8E63C30' },
  busIcon:         { fontSize: 26 },
  busNumber:       { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  busPlate:        { fontSize: 14, color: '#C8E63C', fontWeight: '700', fontFamily: 'monospace', marginTop: 2 },
  busBadge:        { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1 },
  busBadgeText:    { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  divider:         { height: 1, backgroundColor: '#252525', marginVertical: 16 },

  infoGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoCell:        { flex: 1, minWidth: '40%', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2A2A2A' },
  infoCellIcon:    { fontSize: 18, marginBottom: 6 },
  infoCellLabel:   { fontSize: 10, color: '#666', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  infoCellValue:   { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  gaugesContainer: { marginTop: 4 },
  occupancyBox:    { marginTop: 16 },
  occupancyTop:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  occupancyLabel:  { fontSize: 11, color: '#888', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  occupancyPct:    { fontSize: 13, color: '#FFFFFF', fontWeight: '800' },
  occupancyBar:    { height: 8, backgroundColor: '#252525', borderRadius: 4, overflow: 'hidden' },
  occupancyFill:   { height: '100%', borderRadius: 4 },

  tripCard:        { backgroundColor: '#141414', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  tripHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  tripTitle:       { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  tripStatus:      { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  tripStatusText:  { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  routeRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  routeCity:       { flex: 1, alignItems: 'flex-start' },
  routeCityName:   { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  routeCityLabel:  { fontSize: 10, color: '#666', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  routeArrow:      { fontSize: 22, color: '#C8E63C', paddingHorizontal: 12 },

  noTripBox:       { backgroundColor: '#141414', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A' },
  noTripIcon:      { fontSize: 40, marginBottom: 12 },
  noTripText:      { fontSize: 16, fontWeight: '700', color: '#AAAAAA', marginBottom: 6 },
  noTripSub:       { fontSize: 13, color: '#666', textAlign: 'center' },

  // ── GPS Section
  gpsSection:      { marginTop: 20 },
  gpsStatusBar:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0D2200', borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#1A4400' },
  gpsDot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  gpsStatusText:   { fontSize: 12, color: '#4CAF50', fontWeight: '700' },
  trackingMsg:     { fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 8 },
  coordsText:      { fontSize: 11, color: '#555', textAlign: 'center', fontFamily: 'monospace', marginBottom: 8 },

  startBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1E2A00', borderRadius: 16, paddingVertical: 18, borderWidth: 2, borderColor: '#C8E63C' },
  startBtnIcon:    { fontSize: 20 },
  startBtnText:    { color: '#C8E63C', fontWeight: '900', fontSize: 16, letterSpacing: 0.3 },

  stopBtn:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#2A0000', borderRadius: 16, paddingVertical: 18, borderWidth: 2, borderColor: '#F44336' },
  stopBtnIcon:     { fontSize: 20 },
  stopBtnText:     { color: '#F44336', fontWeight: '900', fontSize: 16, letterSpacing: 0.3 },
});
