// [Agent Dev Mobile] - Action: Écran Agences White Mode - KonGO User App
import React, { useState, useEffect } from 'react';
import { Star, ShieldCheck, Search } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import AgencyReviewsModal from '../components/AgencyReviewsModal';

import { useCountry } from '../context/CountryContext';

function AgencyCard({
  agency,
  navigation,
  onOpenReviews,
}: {
  agency: any;
  navigation: any;
  onOpenReviews: (agency: any) => void;
}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <View style={styles.logoBox}>
          <Image 
            source={agency.logo_url ? { uri: agency.logo_url } : require('../../assets/logo.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        </View>
        <View style={styles.cardInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.agencyName}>{agency.name}</Text>
            {agency.rating >= 4.5 && <ShieldCheck size={14} color="#9EBA15" fill="#C8E63C44" />}
          </View>
          <TouchableOpacity
            style={styles.ratingRow}
            onPress={() => onOpenReviews(agency)}
          >
            <Star size={12} color="#9EBA15" fill="#C8E63C" />
            <Text style={styles.ratingNum}>{agency.rating || '0.0'}</Text>
            <Text style={styles.tripCount}> · Voir les avis 💬</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.description}>
        {agency.address || `Agence de transport partenaire KonGO. Qualité et confort garantis.`}
      </Text>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.reviewsBtn}
          onPress={() => onOpenReviews(agency)}
        >
          <Text style={styles.reviewsBtnText}>💬 Avis</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Results', { 
            agencyId: agency.id, 
            agencyName: agency.name,
            passengers: 1 
          })}
        >
          <Text style={styles.actionBtnText}>Trajets</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function AgenciesScreen({ navigation }: any) {
  const { selectedCountry } = useCountry();
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Modal Avis d'Agence
  const [selectedAgency, setSelectedAgency] = useState<any | null>(null);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);

  const handleOpenReviews = (agency: any) => {
    setSelectedAgency(agency);
    setReviewsModalVisible(true);
  };

  useEffect(() => {
    const fetchAgencies = async () => {
      setLoading(true);
      try {
        let queryDB = supabase.from('agencies').select('*');
        if (selectedCountry?.name) {
          // Filtrer si colonne country disponible ou garder toutes si colonne nulle
          queryDB = queryDB.or(`country.eq.${selectedCountry.name},country.is.null,country.eq.${selectedCountry.code}`);
        }
        const { data, error } = await queryDB.order('name');
        if (!error && data) setAgencies(data);
      } catch (err) {
        console.error('Erreur chargement agences:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAgencies();
  }, [selectedCountry]);

  const filtered = agencies.filter(a =>
    a.name.toLowerCase().includes(query.toLowerCase()) ||
    (a.address && a.address.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.topBar}>
        <View>
          <Text style={styles.pageTitle}>Nos Agences</Text>
          <Text style={styles.pageSubtitle}>
            {selectedCountry.flag_emoji} {selectedCountry.name} ({filtered.length} partenaires)
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Search size={18} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Filtrer par agence ou ville..."
          placeholderTextColor="#AAA"
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={{ color: '#999', fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        renderItem={({ item }) => (
          <AgencyCard
            agency={item}
            navigation={navigation}
            onOpenReviews={handleOpenReviews}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100, gap: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucune agence trouvée</Text>
          </View>
        }
      />

      {/* Modal Notation & Avis */}
      <AgencyReviewsModal
        visible={reviewsModalVisible}
        onClose={() => setReviewsModalVisible(false)}
        agencyId={selectedAgency?.id || null}
        agencyName={selectedAgency?.name || null}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  pageTitle: { fontSize: 26, color: '#0A0A0A', fontWeight: '900' },
  pageSubtitle: { fontSize: 13, color: '#666', fontWeight: '600', marginTop: 4 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 16, marginHorizontal: 16, padding: 14, marginVertical: 12, borderWidth: 1, borderColor: '#EEE', gap: 10 },
  searchInput: { flex: 1, color: '#0A0A0A', fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#EEE', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  cardHeader: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  logoBox: { width: 56, height: 56, backgroundColor: '#F9F9F9', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEE' },
  logo: { width: 48, height: 48 },
  cardInfo: { flex: 1, justifyContent: 'center' },
  agencyName: { fontSize: 18, color: '#0A0A0A', fontWeight: '900' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  ratingNum: { fontSize: 13, color: '#9EBA15', fontWeight: '800' },
  tripCount: { fontSize: 12, color: '#888', fontWeight: '600' },
  description: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 16 },
  routesRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  routesBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  routeBadge: { backgroundColor: '#F9FCC5', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E6EDA3' },
  routeBadgeMore: { backgroundColor: '#F5F5F5', borderColor: '#EEE' },
  routeBadgeText: { fontSize: 11, color: '#6A7D0A', fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F5F5F5', paddingTop: 16 },
  classesRow: { flexDirection: 'row', gap: 12 },
  classText: { fontSize: 12, color: '#999', fontWeight: '800' },
  classTextVip: { color: '#9EBA15' },
  reviewsBtn: { backgroundColor: '#F5F5F5', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  reviewsBtnText: { fontSize: 13, color: '#444', fontWeight: '800' },
  actionBtn: { backgroundColor: '#C8E63C', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  actionBtnText: { fontSize: 13, color: '#0A0A0A', fontWeight: '900' },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyText: { fontSize: 15, color: '#AAA', fontWeight: '600' },
});
