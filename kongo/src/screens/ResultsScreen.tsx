// [Agent Dev Mobile] - Action: Écran résultats de recherche - KonGO User App
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Bus, Wifi, Zap, Smartphone, Coffee, ChevronRight, ArrowLeft, Star } from 'lucide-react-native';
import AgencyReviewsModal from '../components/AgencyReviewsModal';

const AMENITY_ICONS: Record<string, any> = { 
  wifi: Wifi, 
  usb: Smartphone, 
  ac: Zap, 
  meal: Coffee 
};

export default function ResultsScreen({ route, navigation }: any) {
  const { from, to, dateLabel, selectedDate, passengers, agencyId, agencyName } = route?.params || {};
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States pour la note et avis
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);
  const [avgRating, setAvgRating] = useState<number>(4.8);
  const [reviewsCount, setReviewsCount] = useState<number>(0);

  useEffect(() => {
    fetchResults();
  }, [from, to, selectedDate]);

  useEffect(() => {
    const targetId = agencyId || (results.length > 0 ? results[0].agency_id : null);
    if (targetId) {
      fetchAgencyScore(targetId);
    }
  }, [agencyId, results]);

  const fetchAgencyScore = async (targetAgencyId: string) => {
    try {
      const { data, error } = await supabase
        .from('agency_reviews')
        .select('rating')
        .eq('agency_id', targetAgencyId);

      if (!error && data && data.length > 0) {
        const sum = data.reduce((acc, curr) => acc + (Number(curr.rating) || 5), 0);
        const avg = parseFloat((sum / data.length).toFixed(1));
        setAvgRating(avg);
        setReviewsCount(data.length);
      }
    } catch (err) {
      console.error('Fetch agency score error:', err);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const targetDate = selectedDate;

      let query = supabase
        .from('trips')
        .select(`
          *,
          agencies(name, rating, logo_url),
          origin:locations!origin_location_id!inner(name),
          destination:locations!destination_location_id!inner(name)
        `)
        .eq('status', 'scheduled');

      if (agencyId) {
        query = query.eq('agency_id', agencyId);
      }
      if (from) {
        query = query.ilike('origin.name', `%${from}%`);
      }
      if (to) {
        query = query.ilike('destination.name', `%${to}%`);
      }
      
      if (selectedDate) {
        query = query.gte('departure_time', `${selectedDate}T00:00:00`)
                     .lt('departure_time', `${selectedDate}T23:59:59`);
      } else {
        query = query.gte('departure_time', new Date().toISOString());
      }

      const { data, error } = await query.order('departure_time', { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map(item => ({
        id: item.id,
        agency: item.agencies?.name || 'KonGO Express',
        logo: item.agencies?.logo_url ? { uri: item.agencies.logo_url } : require('../../assets/logo1.png'),
        departure: item.departure_time ? new Date(item.departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '08:00',
        arrival: item.arrival_time ? new Date(item.arrival_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '14:00',
        duration: item.duration || '6h00',
        class: item.bus_type || 'Standard',
        price: item.price,
        amenities: item.amenities || ['wifi', 'ac'],
        seats: item.seats_available,
        originName: item.origin?.name || from,
        destName: item.destination?.name || to,
        date: item.departure_time ? new Date(item.departure_time).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '',
        promoAlert: item.is_popular,
        agency_id: item.agency_id,
        handicap_seats: item.handicap_seats || 0,
      }));

      setResults(mapped);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header : résumé trajet & bouton note et avis */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0A0A0A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={styles.routeSummary}>
            <Text style={styles.routeCity}>{from || agencyName || 'Trajets'}</Text>
            {to && (
              <>
                <Text style={styles.routeArrow}>→</Text>
                <Text style={styles.routeCity}>{to}</Text>
              </>
            )}
          </View>
          <Text style={styles.routeMeta}>
            {dateLabel || 'Voyages disponibles'} · {passengers || 1} passager{(passengers || 1) > 1 ? 's' : ''}
          </Text>
        </View>

        {/* Bouton Note et Avis au coin droit en haut */}
        <TouchableOpacity
          style={styles.reviewHeaderBtn}
          onPress={() => setReviewsModalVisible(true)}
          activeOpacity={0.8}
        >
          <Star size={14} color="#9EBA15" fill="#C8E63C" />
          <Text style={styles.reviewHeaderScore}>{avgRating}</Text>
          <Text style={styles.reviewHeaderText}>Avis</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.resultCount}>
        {loading ? 'Recherche...' : `${results.length} bus disponibles`}
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#9EBA15" />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun trajet trouvé pour cette sélection.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.busCard} 
              activeOpacity={0.95}
              onPress={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                  Alert.alert(
                    'Connexion requise',
                    'Veuillez vous connecter pour réserver votre siège.',
                    [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Se connecter', onPress: () => navigation.navigate('Login') }
                    ]
                  );
                  return;
                }
                navigation.navigate('SeatSelection', {
                  trip: item,
                  from: item.originName,
                  to: item.destName,
                  date: dateLabel || item.date,
                  passengers: passengers || 1,
                });
              }}
            >
              {item.promoAlert && (
                <View style={styles.promoBanner}>
                  <Text style={styles.promoBannerText}>🔥 Alerte Prix — Offre limitée</Text>
                </View>
              )}
              <View style={styles.busCardTop}>
                <View style={styles.agencyLogoBox}>
                  <Image source={item.logo} style={styles.agencyLogo} resizeMode="contain" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.agencyName}>{item.agency}</Text>
                  <View style={[styles.classBadge, item.class === 'VIP' && styles.vip, item.class === 'Business' && styles.biz]}>
                    <Text style={[styles.classBadgeText, item.class === 'VIP' && styles.vipText, item.class === 'Business' && styles.bizText]}>{item.class}</Text>
                  </View>
                </View>
                <View>
                  <Text style={styles.price}>{item.price?.toLocaleString('fr-FR')} CDF</Text>
                  <Text style={styles.perSeat}>/ siège</Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timePart}>
                  <Text style={styles.time}>{item.departure}</Text>
                  <Text style={styles.timeCity}>{item.originName}</Text>
                </View>
                <View style={styles.durationPart}>
                  <View style={styles.durationLine} />
                  <Text style={styles.duration}>{item.duration}</Text>
                  <Text style={styles.tripDate}>{item.date}</Text>
                </View>
                <View style={[styles.timePart, { alignItems: 'flex-end' }]}>
                  <Text style={styles.time}>{item.arrival}</Text>
                  <Text style={styles.timeCity}>{item.destName}</Text>
                </View>
              </View>

              <View style={styles.bottomRow}>
                <View style={styles.amenitiesRow}>
                  {item.amenities.map((a: string) => {
                    const Icon = AMENITY_ICONS[a];
                    return Icon ? <Icon key={a} size={14} color="#666" style={{ marginRight: 4 }} /> : null;
                  })}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {item.handicap_seats > 0 && (
                    <View style={styles.pmrBadge}>
                      <Text style={styles.pmrBadgeText}>♿ {item.handicap_seats}</Text>
                    </View>
                  )}
                  <View style={styles.seatsInfo}>
                    <Text style={styles.seatsText}>{item.seats} places</Text>
                  </View>
                  <View style={styles.ctaBtn}>
                    <Text style={styles.ctaBtnText}>Choisir</Text>
                    <ChevronRight size={14} color="#0A0A0A" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal des notes et avis de l'agence */}
      <AgencyReviewsModal
        visible={reviewsModalVisible}
        onClose={() => setReviewsModalVisible(false)}
        agencyId={agencyId || (results.length > 0 ? results[0].agency_id : null)}
        agencyName={agencyName || (results.length > 0 ? results[0].agency : 'Agence')}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 38, height: 38, backgroundColor: '#F5F5F5', borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEE' },
  routeSummary: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  routeCity: { fontSize: 16, color: '#0A0A0A', fontWeight: '900' },
  routeArrow: { fontSize: 14, color: '#9EBA15' },
  routeMeta: { fontSize: 12, color: '#666', marginTop: 2, fontWeight: '600' },
  reviewHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5FCC5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E6EDA3',
    gap: 4,
  },
  reviewHeaderScore: {
    fontSize: 13,
    fontWeight: '900',
    color: '#6A7D0A',
  },
  reviewHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0A0A0A',
  },
  resultCount: { fontSize: 12, color: '#9EBA15', fontWeight: '800', paddingHorizontal: 16, marginBottom: 8 },
  busCard: { backgroundColor: '#F9F9F9', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE', marginBottom: 4 },
  promoBanner: { backgroundColor: '#F5FCC5', padding: 10, borderBottomWidth: 1, borderBottomColor: '#E6EDA3' },
  promoBannerText: { fontSize: 11, color: '#6A7D0A', fontWeight: '800', textAlign: 'center' },
  busCardTop: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  agencyLogoBox: { width: 48, height: 48, backgroundColor: '#FFFFFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
  agencyLogo: { width: 40, height: 40 },
  agencyName: { fontSize: 15, color: '#0A0A0A', fontWeight: '800', marginBottom: 4 },
  classBadge: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, backgroundColor: '#EEE', alignSelf: 'flex-start' },
  classBadgeText: { fontSize: 10, color: '#666', fontWeight: '800' },
  vip: { backgroundColor: '#F5FCC5' },
  vipText: { color: '#6A7D0A' },
  biz: { backgroundColor: '#E1F5FE' },
  bizText: { color: '#0288D1' },
  price: { fontSize: 20, color: '#0A0A0A', fontWeight: '900', textAlign: 'right' },
  perSeat: { fontSize: 10, color: '#888', textAlign: 'right', fontWeight: '600' },
  timeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16 },
  timePart: { flex: 1 },
  time: { fontSize: 20, color: '#0A0A0A', fontWeight: '900' },
  timeCity: { fontSize: 11, color: '#666', marginTop: 2, fontWeight: '600' },
  durationPart: { flex: 1, alignItems: 'center' },
  durationLine: { width: '80%', height: 1.5, backgroundColor: '#EEE', marginBottom: 6 },
  duration: { fontSize: 11, color: '#888', fontWeight: '700' },
  tripDate: { fontSize: 10, color: '#9EBA15', fontWeight: '800', marginTop: 4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEE' },
  amenitiesRow: { flexDirection: 'row', alignItems: 'center' },
  seatsInfo: { backgroundColor: '#F5FCC5', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  seatsText: { fontSize: 10, color: '#6A7D0A', fontWeight: '800' },
  pmrBadge: { backgroundColor: '#EFF6FF', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 8, borderWidth: 1, borderColor: '#BFDBFE' },
  pmrBadgeText: { fontSize: 10, color: '#1D4ED8', fontWeight: '800' },
  ctaBtn: { backgroundColor: '#C8E63C', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 4 },
  ctaBtnText: { fontSize: 11, color: '#0A0A0A', fontWeight: '900' },
  emptyContainer: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#888', textAlign: 'center' },
});
