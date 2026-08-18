// [Agent Dev Mobile] - Action: Écran de Recherche - KonGO User App
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MapPin, Flag, Calendar, Users } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const FALLBACK_CITIES = [
  'Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Goma', 'Bukavu', 'Kisangani',
  'Kananga', 'Matadi', 'Likasi', 'Kolwezi', 'Uvira', 'Bunia'
];

const STEPS = ['Recherche', 'Résultats', 'Sièges', 'Paiement', 'Billet'];

const InputField = ({ label, value, onPress, icon: Icon, highlight }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.inputField, highlight && styles.inputFieldHighlight]} activeOpacity={0.75}>
    <View style={styles.inputIconContainer}>
      <Icon size={20} color="#9EBA15" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Text style={[styles.inputValue, !value && styles.inputPlaceholder]}>
        {value || `Sélectionner ${label.toLowerCase()}`}
      </Text>
    </View>
    <Text style={styles.inputChevron}>›</Text>
  </TouchableOpacity>
);

export default function SearchScreen({ navigation }: any) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [dateLabel, setDateLabel] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [modal, setModal] = useState<'from' | 'to' | 'date' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [cities, setCities] = useState<string[]>(FALLBACK_CITIES);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        // 1. Charger d'abord les villes actives depuis la table 'cities' de Supabase
        const { data: cData, error: cErr } = await supabase
          .from('cities')
          .select('name')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (!cErr && cData && cData.length > 0) {
          setCities([...new Set(cData.map((l: any) => l.name))]);
          return;
        }

        // 2. Fallback table 'locations'
        const { data, error } = await supabase
          .from('locations')
          .select('name')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          setCities([...new Set(data.map((l: any) => l.name))]);
        }
      } catch {
        // keep fallback
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  const filteredCities = cities.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase()));

  const canSearch = from && to && from !== to;

  const selectCity = (city: string) => {
    if (modal === 'from') setFrom(city);
    if (modal === 'to') setTo(city);
    setModal(null);
    setCityQuery('');
  };

  const handleSearch = () => {
    if (!canSearch) return;
    navigation.navigate('Results', { 
      from, 
      to, 
      dateLabel: dateLabel || "Aujourd'hui", 
      selectedDate: selectedDate || new Date().toISOString().split('T')[0],
      passengers 
    });
  };

  const today = new Date().toLocaleDateString('fr-CD', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Stepper */}
      <View style={styles.stepper}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
              <Text style={[styles.stepNum, i === 0 && styles.stepNumActive]}>{i + 1}</Text>
            </View>
            {i < STEPS.length - 1 && <View style={[styles.stepLine, i === 0 && styles.stepLineActive]} />}
          </View>
        ))}
      </View>
      <View style={styles.stepLabels}>
        {STEPS.map((s, i) => (
          <Text key={s} style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{s}</Text>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Rechercher un trajet</Text>
        <Text style={styles.screenSubtitle}>Trouvez le meilleur bus pour votre voyage</Text>

        <View style={styles.card}>
          {/* Departure / Arrival */}
          <InputField label="Départ" value={from} icon={MapPin} onPress={() => setModal('from')} highlight={!from} />
          
          <View style={styles.swapContainer}>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.swapBtn} onPress={() => { const t = from; setFrom(to); setTo(t); }}>
              <Text style={styles.swapIcon}>⇅</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
          </View>

          <InputField label="Arrivée" value={to} icon={Flag} onPress={() => setModal('to')} highlight={!to} />
          
          <View style={styles.separator} />

          <InputField 
            label="Date de départ" 
            value={dateLabel || today} 
            icon={Calendar} 
            onPress={() => Platform.OS === 'web' ? setModal('date') : setShowDatePicker(true)} 
          />
          
          <View style={styles.separator} />

          {/* Passengers */}
          <View style={styles.inputField}>
            <View style={styles.inputIconContainer}>
              <Users size={20} color="#9EBA15" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Passagers</Text>
              <Text style={styles.inputValue}>{passengers} passager{passengers > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.passengerControls}>
              <TouchableOpacity style={styles.passengerBtn} onPress={() => setPassengers(p => Math.max(1, p - 1))}>
                <Text style={styles.passengerBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.passengerCount}>{passengers}</Text>
              <TouchableOpacity style={styles.passengerBtn} onPress={() => setPassengers(p => Math.min(6, p + 1))}>
                <Text style={styles.passengerBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          style={[styles.searchBtn, !canSearch && styles.searchBtnDisabled]}
          onPress={handleSearch}
          activeOpacity={canSearch ? 0.8 : 1}
        >
          <Text style={styles.searchBtnText}>
            {canSearch ? `🔍  Rechercher ${from} → ${to}` : 'Compléter les champs pour rechercher'}
          </Text>
        </TouchableOpacity>

        {/* Quick routes */}
        <Text style={styles.quickTitle}>Recherches rapides</Text>
        <View style={styles.quickGrid}>
          {[['Kinshasa', 'Lubumbashi'], ['Goma', 'Bukavu'], ['Kinshasa', 'Matadi']].map(([f, t]) => (
            <TouchableOpacity
              key={f + t}
              style={styles.quickBadge}
              onPress={() => { setFrom(f); setTo(t); }}
              activeOpacity={0.7}
            >
              <Text style={styles.quickBadgeText}>{f} → {t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Picker Modal (City & Date) */}
      <Modal visible={modal !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>
              {modal === 'from' ? 'Ville de départ' : modal === 'to' ? 'Ville d\'arrivée' : 'Choisir la date'}
            </Text>
            
            {(modal === 'from' || modal === 'to') ? (
              <>
                <TextInput
                  style={styles.modalSearch}
                  placeholder="Rechercher une ville..."
                  placeholderTextColor="#666"
                  value={cityQuery}
                  onChangeText={setCityQuery}
                  autoFocus
                />
                {loadingCities ? (
                  <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                    <ActivityIndicator color="#C8E63C" />
                    <Text style={{ marginTop: 8, color: '#999', fontSize: 12 }}>Chargement des villes...</Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredCities}
                    keyExtractor={c => c}
                    renderItem={({ item }) => (
                      <TouchableOpacity style={styles.cityItem} onPress={() => selectCity(item)}>
                        <MapPin size={18} color="#9EBA15" style={{ marginRight: 12 }} />
                        <Text style={styles.cityItemText}>{item}</Text>
                      </TouchableOpacity>
                    )}
                    ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#EEE' }} />}
                    ListEmptyComponent={<Text style={{ color: '#AAA', padding: 16, textAlign: 'center' }}>Aucune ville trouvée</Text>}
                  />
                )}
              </>
            ) : (
              <ScrollView>
                {[0, 1, 2, 3, 4, 5, 6, 7].map(offset => {
                  const d = new Date();
                  d.setDate(d.getDate() + offset);
                  const label = offset === 0 ? "Aujourd'hui" : offset === 1 ? "Demain" : d.toLocaleDateString('fr-CD', { weekday: 'long', day: 'numeric', month: 'long' });
                  const dateValue = d.toISOString().split('T')[0];
                  return (
                    <TouchableOpacity 
                      key={dateValue} 
                      style={styles.cityItem} 
                      onPress={() => { 
                        setDateLabel(label); 
                        setSelectedDate(dateValue);
                        setModal(null); 
                      }}
                    >
                      <Calendar size={18} color="#9EBA15" style={{ marginRight: 12 }} />
                      <Text style={styles.cityItemText}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            
            <TouchableOpacity style={styles.modalClose} onPress={() => { setModal(null); setCityQuery(''); }}>
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Selecteur de Date Natif (Mobile) */}
      {showDatePicker && Platform.OS === 'android' && (
        <DateTimePicker
          value={selectedDate ? new Date(selectedDate) : new Date()}
          mode="date"
          display="default"
          minimumDate={new Date()}
          onChange={(event: any, date?: Date) => {
            setShowDatePicker(false);
            if (event.type === 'set' && date) {
              setSelectedDate(date.toISOString().split('T')[0]);
              setDateLabel(date.toLocaleDateString('fr-CD', { weekday: 'long', day: 'numeric', month: 'long' }));
            }
          }}
        />
      )}
      {Platform.OS === 'ios' && showDatePicker && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { paddingBottom: 40 }]}>
              <View style={styles.modalHandle} />
              <DateTimePicker
                value={selectedDate ? new Date(selectedDate) : new Date()}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={(event: any, date?: Date) => {
                  if (date) {
                    setSelectedDate(date.toISOString().split('T')[0]);
                    setDateLabel(date.toLocaleDateString('fr-CD', { weekday: 'long', day: 'numeric', month: 'long' }));
                  }
                }}
              />
              <TouchableOpacity 
                style={styles.searchBtn} 
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.searchBtnText}>Confirmer la date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  stepper: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: '#C8E63C', borderColor: '#C8E63C' },
  stepNum: { fontSize: 10, color: '#999', fontWeight: '800' },
  stepNumActive: { color: '#0A0A0A' },
  stepLine: { flex: 1, height: 1.5, backgroundColor: '#EEE' },
  stepLineActive: { backgroundColor: '#C8E63C' },
  stepLabels: { flexDirection: 'row', paddingHorizontal: 12, marginTop: 6 },
  stepLabel: { flex: 1, fontSize: 8, color: '#888', textAlign: 'center', fontWeight: '700' },
  stepLabelActive: { color: '#9EBA15' },
  screenTitle: { fontSize: 24, color: '#0A0A0A', fontWeight: '900', marginBottom: 4 },
  screenSubtitle: { fontSize: 13, color: '#666', marginBottom: 24, fontWeight: '500' },
  card: { backgroundColor: '#F9F9F9', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
  inputField: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  inputFieldHighlight: { backgroundColor: '#F0F9E6' },
  inputIcon: { fontSize: 18, marginRight: 14 },
  inputIconContainer: { marginRight: 14, width: 24, alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 10, color: '#666', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputValue: { fontSize: 15, color: '#0A0A0A', fontWeight: '700', marginTop: 2 },
  inputPlaceholder: { color: '#AAA' },
  inputChevron: { fontSize: 22, color: '#9EBA15' },
  swapContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18 },
  divider: { flex: 1, height: 1, backgroundColor: '#EEE' },
  swapBtn: { width: 34, height: 34, backgroundColor: '#FFF', borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginHorizontal: 10, borderWidth: 1, borderColor: '#DDD', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 },
  swapIcon: { fontSize: 16, color: '#9EBA15' },
  separator: { height: 1, backgroundColor: '#EEE', marginHorizontal: 18 },
  passengerControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passengerBtn: { width: 30, height: 30, backgroundColor: '#EEE', borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  passengerBtnText: { fontSize: 16, color: '#9EBA15', fontWeight: '800', lineHeight: 18 },
  passengerCount: { fontSize: 16, color: '#0A0A0A', fontWeight: '800', minWidth: 20, textAlign: 'center' },
  searchBtn: { backgroundColor: '#C8E63C', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 20, elevation: 3, shadowColor: '#9EBA15', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4 },
  searchBtnDisabled: { backgroundColor: '#EEE' },
  searchBtnText: { fontSize: 15, color: '#0A0A0A', fontWeight: '900' },
  quickTitle: { fontSize: 13, color: '#666', fontWeight: '700', marginTop: 28, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBadge: { backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: '#EEE' },
  quickBadgeText: { fontSize: 12, color: '#9EBA15', fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '75%' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, color: '#0A0A0A', fontWeight: '900', marginBottom: 16 },
  modalSearch: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, color: '#0A0A0A', fontSize: 14, marginBottom: 12, borderWidth: 1, borderColor: '#EEE' },
  cityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  cityItemIcon: { fontSize: 16 },
  cityItemText: { fontSize: 15, color: '#0A0A0A', fontWeight: '600' },
  modalClose: { marginTop: 16, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 16, alignItems: 'center' },
  modalCloseText: { color: '#666', fontWeight: '700', fontSize: 14 },
});
