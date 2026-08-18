// [Agent Dev Mobile] - Action: Écran Mes Billets avec Suivi Voyage - KonGO User App
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import {
  ArrowLeft,
  Ticket,
  Calendar,
  ChevronRight,
  Bus,
  Navigation,
} from 'lucide-react-native';

// Le suivi client s'ouvre uniquement apres le demarrage explicite par le chauffeur.
function isTripInProgress(booking: any): boolean {
  if (booking.status !== 'confirmed' && booking.status !== 'completed') return false;

  const tripStatus = booking.trips?.status;
  return tripStatus === 'in_progress' || tripStatus === 'departed';
}

export default function MyTicketsScreen({ navigation }: any) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userIdRef = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchBookings();
    }, [])
  );

  // ── Souscription Realtime : rafraîchir quand un voyage change de statut ──
  useEffect(() => {
    // Écouter les changements de statut sur la table trips
    const tripsChannel = supabase
      .channel('my-tickets-trips')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'trips',
        },
        (payload) => {
          const newStatus = (payload.new as any)?.status;
          // Rafraîchir si un voyage passe en cours ou se termine
          if (newStatus === 'in_progress' || newStatus === 'departed' || newStatus === 'completed' || newStatus === 'cancelled') {
            fetchBookings();
          }
        }
      )
      .subscribe();

    // Écouter les changements sur les bookings de l'utilisateur (ex: scan du ticket)
    const bookingsChannel = supabase
      .channel('my-tickets-bookings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
        },
        (payload) => {
          // Rafraîchir uniquement si c'est un booking de l'utilisateur courant
          const updatedUserId = (payload.new as any)?.user_id;
          if (updatedUserId && updatedUserId === userIdRef.current) {
            fetchBookings();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tripsChannel);
      supabase.removeChannel(bookingsChannel);
    };
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      userIdRef.current = user.id;

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          trips (
            *,
            agencies (name, logo_url),
            origin:locations!origin_location_id (name),
            destination:locations!destination_location_id (name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        Alert.alert('Erreur', 'Impossible de charger vos billets: ' + error.message);
        throw error;
      }
      setBookings(data || []);
    } catch (err: any) {
      console.error('Erreur chargement billets:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: '#E8F5E9', text: '#2E7D32', label: 'Confirmé' };
      case 'pending':   return { bg: '#FFF3E0', text: '#EF6C00', label: 'En attente' };
      case 'cancelled': return { bg: '#FFEBEE', text: '#C62828', label: 'Annulé' };
      case 'completed': return { bg: '#E8F5E9', text: '#2E7D32', label: 'Embarqué' };
      default:          return { bg: '#F5F5F5', text: '#666', label: status };
    }
  };

  const renderBooking = ({ item }: { item: any }) => {
    const trip   = item.trips;
    const status = getStatusStyle(item.status);
    const date   = trip?.departure_time ? new Date(trip.departure_time) : null;
    const inProgress = isTripInProgress(item);

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('Confirmation', {
            bookingRef: item.booking_code,
            trip,
            from:       trip?.origin?.name,
            to:         trip?.destination?.name,
            date:       date?.toLocaleDateString('fr-FR'),
            passengers: item.passenger_count || 1,
            seats:      item.seats,
            grandTotal: item.total_price,
            status:     item.status,
          })
        }
      >
        {/* ── En-tête sombre ── */}
        <View style={styles.cardHeaderDark}>
          <View style={styles.agencyInfoRow}>
            <View style={styles.logoBoxSmall}>
              <Bus size={14} color="#0A0A0F" />
            </View>
            <View>
              <Text style={styles.brandNameMini}>KonGO</Text>
              <Text style={styles.agencyNameDark}>{trip?.agencies?.name || 'KonGO Express'}</Text>
            </View>
          </View>
          <View style={styles.refBox}>
            {/* Badge EN COURS */}
            {inProgress && (
              <View style={styles.inProgressBadge}>
                <View style={styles.inProgressDot} />
                <Text style={styles.inProgressBadgeText}>EN COURS</Text>
              </View>
            )}
            <Text style={styles.refLabelMini}>RÉF</Text>
            <Text style={styles.bookingRefText}>{item.booking_code}</Text>
          </View>
        </View>

        {/* ── Corps ── */}
        <View style={styles.cardBody}>
          <View style={styles.routeRow}>
            <View style={styles.cityCol}>
              <Text style={styles.cityText}>{trip?.origin?.name}</Text>
              <Text style={styles.timeText}>
                {date?.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <View style={styles.pathCol}>
              <View style={styles.routeArrowSmall}>
                <ChevronRight size={16} color="#0A0A0F" />
              </View>
            </View>
            <View style={[styles.cityCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.cityText}>{trip?.destination?.name}</Text>
              <Text style={styles.timeText}>Arrivée prévue</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={14} color="#888" />
              <Text style={styles.metaText}>
                {date?.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ticket size={14} color="#888" />
              <Text style={styles.metaText}>{item.seats?.length || 1} Siège(s)</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: status.bg + '30', borderColor: status.bg }]}>
              <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
            </View>
          </View>
        </View>

        {/* ── Perforation ── */}
        <View style={styles.perforationRow}>
          <View style={styles.cutoutL} />
          <View style={styles.dashLine} />
          <View style={styles.cutoutR} />
        </View>

        {/* ── Footer avec boutons ── */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.priceLabel}>TOTAL PAYÉ</Text>
            <Text style={styles.priceValue}>{item.total_price?.toLocaleString('fr-FR')} CDF</Text>
          </View>

          {/* ── Boutons d'action ── */}
          <View style={styles.footerActions}>
            {/* Bouton "Suivre" visible seulement si voyage en cours */}
            {inProgress && (
              <TouchableOpacity
                style={styles.trackBtn}
                activeOpacity={0.8}
                onPress={() => {
                  navigation.navigate('LiveTrip', {
                    trip,
                    bookingCode: item.booking_code,
                  });
                }}
              >
                <Navigation size={13} color="#0A0A0F" />
                <Text style={styles.trackBtnText}>Suivre</Text>
              </TouchableOpacity>
            )}

            {/* Bouton "Voir le billet" */}
            <TouchableOpacity
              style={styles.viewBtn}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('Confirmation', {
                  bookingRef: item.booking_code,
                  trip,
                  from:       trip?.origin?.name,
                  to:         trip?.destination?.name,
                  date:       date?.toLocaleDateString('fr-FR'),
                  passengers: item.passenger_count || 1,
                  seats:      item.seats,
                  grandTotal: item.total_price,
                  status:     item.status,
                })
              }
            >
              <Text style={styles.viewBtnText}>Voir le billet</Text>
              <ChevronRight size={14} color="#0A0A0F" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#0A0A0A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes Voyages</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#9EBA15" />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBooking}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Ticket size={48} color="#DDD" />
              </View>
              <Text style={styles.emptyTitle}>Aucun billet trouvé</Text>
              <Text style={styles.emptySub}>
                Vos réservations apparaîtront ici une fois confirmées.
              </Text>
              <TouchableOpacity
                style={styles.bookNowBtn}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.bookNowText}>Rechercher un voyage</Text>
              </TouchableOpacity>
            </View>
          }
          onRefresh={fetchBookings}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#FFFFFF' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#F9F9F9',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#0A0A0A' },
  listContent: { padding: 16, paddingBottom: 40 },

  // Card
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },

  // Dark Header
  cardHeaderDark: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0A0A0F',
  },
  agencyInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBoxSmall: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#9EBA15',
    alignItems: 'center', justifyContent: 'center',
  },
  brandNameMini:  { color: '#FFF', fontSize: 12, fontWeight: '900' },
  agencyNameDark: { color: '#9EBA15', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  refBox: { alignItems: 'flex-end', gap: 4 },
  refLabelMini:   { color: 'rgba(255,255,255,0.4)', fontSize: 8, fontWeight: '900' },
  bookingRefText: { color: '#FFF', fontSize: 14, fontWeight: '900' },

  // Badge EN COURS
  inProgressBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#C8E63C',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, marginBottom: 4,
  },
  inProgressDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#0A0A0F',
  },
  inProgressBadgeText: {
    fontSize: 8, fontWeight: '900', color: '#0A0A0F', letterSpacing: 0.5,
  },

  // Body
  cardBody:  { padding: 20 },
  routeRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cityCol:   { flex: 1 },
  cityText:  { fontSize: 18, fontWeight: '900', color: '#0A0A0A' },
  timeText:  { fontSize: 12, color: '#666', fontWeight: '600', marginTop: 4 },
  pathCol:   { width: 40, alignItems: 'center' },
  routeArrowSmall: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#9EBA15', alignItems: 'center', justifyContent: 'center',
  },

  metaRow:     { flexDirection: 'row', alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F5F5F5' },
  metaItem:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText:    { fontSize: 12, color: '#888', fontWeight: '700' },
  metaDivider: { width: 1, height: 12, backgroundColor: '#EEE', marginHorizontal: 12 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, marginLeft: 'auto' },
  statusText:  { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },

  // Perforation
  perforationRow: { height: 20, flexDirection: 'row', alignItems: 'center' },
  cutoutL: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', marginLeft: -10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  dashLine: { flex: 1, height: 1, borderBottomWidth: 1, borderBottomColor: '#EEE', borderStyle: 'dashed', marginHorizontal: 4 },
  cutoutR: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF', marginRight: -10, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F9F9F9',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  priceLabel: { fontSize: 9, color: '#888', fontWeight: '900', marginBottom: 2 },
  priceValue: { fontSize: 18, fontWeight: '900', color: '#0A0A0A' },

  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  // Bouton Suivre
  trackBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#C8E63C',
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10,
  },
  trackBtnText: { fontSize: 11, fontWeight: '900', color: '#0A0A0F' },

  // Bouton Voir le billet
  viewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0F0F0',
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 10,
  },
  viewBtnText: { fontSize: 11, fontWeight: '900', color: '#0A0A0F' },

  // Empty state
  emptyContainer: { padding: 60, alignItems: 'center' },
  emptyIconBox: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#F9F9F9', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  emptyTitle:  { fontSize: 20, fontWeight: '900', color: '#0A0A0A', marginBottom: 8 },
  emptySub:    { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  bookNowBtn:  { backgroundColor: '#C8E63C', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, elevation: 2 },
  bookNowText: { fontSize: 15, fontWeight: '900', color: '#0A0A0A' },
});
