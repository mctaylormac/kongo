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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MapPin, Flag, Calendar, Users, Search, X, Bus } from 'lucide-react-native';
import { useCountry } from '../context/CountryContext';

const { width } = Dimensions.get('window');

export interface SearchLocationItem {
  id?: string;
  name: string;
  cityName?: string;
  type: 'city' | 'stop';
}

const FALLBACK_LOCATIONS: SearchLocationItem[] = [
  { name: 'Kinshasa', type: 'city' },
  { name: 'Lubumbashi', type: 'city' },
  { name: 'Goma', type: 'city' },
  { name: 'Bukavu', type: 'city' },
  { name: 'Matadi', type: 'city' },
  { name: 'Kisangani', type: 'city' },
  { name: 'Mbuji-Mayi', type: 'city' },
  { name: 'Kananga', type: 'city' },
  { name: 'Kolwezi', type: 'city' },
  { name: 'Likasi', type: 'city' },
  { name: 'Uvira', type: 'city' },
  { name: 'Bunia', type: 'city' },
  { id: 'stop-kin-1', name: 'Gare Centrale (Kinshasa)', cityName: 'Kinshasa', type: 'stop' },
  { id: 'stop-kin-2', name: 'Station Masina (Kinshasa)', cityName: 'Kinshasa', type: 'stop' },
  { id: 'stop-kin-3', name: 'Agence Ndjili (Kinshasa)', cityName: 'Kinshasa', type: 'stop' },
  { id: 'stop-lub-1', name: 'Gare Routière Lubumbashi', cityName: 'Lubumbashi', type: 'stop' },
  { id: 'stop-lub-2', name: 'Terminal Centre-Ville (Lubumbashi)', cityName: 'Lubumbashi', type: 'stop' },
  { id: 'stop-gom-1', name: 'Virunga Terminal (Goma)', cityName: 'Goma', type: 'stop' },
  { id: 'stop-mat-1', name: 'Port & Gare de Matadi', cityName: 'Matadi', type: 'stop' },
];

const STEPS = ['Recherche', 'Résultats', 'Sièges', 'Paiement', 'Billet'];

const InputField = ({ label, value, onPress, icon: Icon, highlight }: any) => (
  <TouchableOpacity onPress={onPress} style={[styles.inputField, highlight && styles.inputFieldHighlight]} activeOpacity={0.75}>
    <View style={styles.inputIconContainer}>
      <Icon size={20} color="#7A960C" />
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
  const { selectedCountry } = useCountry();
  const [from, setFrom] = useState('');
  const [fromStopId, setFromStopId] = useState<string | null>(null);
  const [to, setTo] = useState('');
  const [toStopId, setToStopId] = useState<string | null>(null);
  const [dateLabel, setDateLabel] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [modal, setModal] = useState<'from' | 'to' | 'date' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cityQuery, setCityQuery] = useState('');
  const [locationTab, setLocationTab] = useState<'all' | 'city' | 'stop'>('all');
  const [locations, setLocations] = useState<SearchLocationItem[]>(FALLBACK_LOCATIONS);
  const [loadingLocations, setLoadingLocations] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        let cityItems: SearchLocationItem[] = [];
        let stopItems: SearchLocationItem[] = [];

        // 1. Charger les villes du pays sélectionné
        let cityQueryDB = supabase.from('cities').select('name, country_id').eq('is_active', true);
        if (selectedCountry?.id) {
          cityQueryDB = cityQueryDB.eq('country_id', selectedCountry.id);
        }
        const { data: cData, error: cErr } = await cityQueryDB.order('name', { ascending: true });

        if (!cErr && cData && cData.length > 0) {
          cityItems = cData.map((l: any) => ({ name: l.name, type: 'city' }));
        } else {
          const { data: locData } = await supabase
            .from('locations')
            .select('name')
            .order('name', { ascending: true });

          if (locData && locData.length > 0) {
            cityItems = locData.map((l: any) => ({ name: l.name, type: 'city' }));
          }
        }

        // 2. Charger les arrêts
        const { data: stopsData } = await supabase
          .from('stops')
          .select('id, name, city_name')
          .order('name', { ascending: true });

        if (stopsData && stopsData.length > 0) {
          stopItems = stopsData.map((s: any) => ({
            id: s.id,
            name: s.city_name ? `${s.name} (${s.city_name})` : s.name,
            cityName: s.city_name,
            type: 'stop',
          }));
        }

        let fallbackFiltered = FALLBACK_LOCATIONS;
        if (selectedCountry?.code === 'CG' || selectedCountry?.phone_code === '+242') {
          fallbackFiltered = [
            { name: 'Brazzaville', type: 'city' },
            { name: 'Pointe-Noire', type: 'city' },
            { name: 'Dolisie', type: 'city' },
            { id: 'stop-cg-1', name: 'Gare Routière Brazzaville', cityName: 'Brazzaville', type: 'stop' },
            { id: 'stop-cg-2', name: 'Port de Pointe-Noire', cityName: 'Pointe-Noire', type: 'stop' },
          ];
        } else if (selectedCountry?.code === 'CM' || selectedCountry?.phone_code === '+237') {
          fallbackFiltered = [
            { name: 'Douala', type: 'city' },
            { name: 'Yaoundé', type: 'city' },
            { name: 'Garoua', type: 'city' },
            { id: 'stop-cm-1', name: 'Gare Voyageurs Yaoundé', cityName: 'Yaoundé', type: 'stop' },
            { id: 'stop-cm-2', name: 'Agence Akwa (Douala)', cityName: 'Douala', type: 'stop' },
          ];
        } else if (selectedCountry?.code === 'CI' || selectedCountry?.phone_code === '+225') {
          fallbackFiltered = [
            { name: 'Abidjan', type: 'city' },
            { name: 'Bouaké', type: 'city' },
            { name: 'Yamoussoukro', type: 'city' },
            { id: 'stop-ci-1', name: 'Gare Adjamé (Abidjan)', cityName: 'Abidjan', type: 'stop' },
          ];
        }

        const combined = [
          ...(cityItems.length > 0 ? cityItems : fallbackFiltered.filter(x => x.type === 'city')),
          ...(stopItems.length > 0 ? stopItems : fallbackFiltered.filter(x => x.type === 'stop')),
        ];

        setLocations(combined);
      } catch {
        setLocations(FALLBACK_LOCATIONS);
      } finally {
        setLoadingLocations(false);
      }
    };
    fetchLocations();
  }, [selectedCountry]);

  const filteredLocations = locations.filter(loc => {
    const matchesTab = locationTab === 'all' || loc.type === locationTab;
    const matchesQuery = loc.name.toLowerCase().includes(cityQuery.toLowerCase()) ||
                         (loc.cityName && loc.cityName.toLowerCase().includes(cityQuery.toLowerCase()));
    return matchesTab && matchesQuery;
  });

  const canSearch = from && to && from !== to;

  const selectLocationItem = (item: SearchLocationItem) => {
    if (modal === 'from') {
      setFrom(item.name);
      setFromStopId(item.type === 'stop' ? item.id || item.name : null);
    }
    if (modal === 'to') {
      setTo(item.name);
      setToStopId(item.type === 'stop' ? item.id || item.name : null);
    }
    setModal(null);
    setCityQuery('');
  };

  const handleSearch = () => {
    if (!canSearch) return;
    navigation.navigate('Results', { 
      from, 
      to, 
      fromStopId,
      toStopId,
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
      <Modal 
        visible={modal !== null} 
        animationType="slide" 
        transparent
        onRequestClose={() => { setModal(null); setCityQuery(''); }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboardAvoiding}
            >
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <View style={styles.modalHandle} />
                  <View style={styles.modalTitleRow}>
                    <Text style={styles.modalTitle}>
                      {modal === 'from' ? 'Départ' : modal === 'to' ? 'Arrivée' : 'Choisir la date'}
                    </Text>
                    <TouchableOpacity 
                      style={styles.modalCloseIconBtn} 
                      onPress={() => { setModal(null); setCityQuery(''); }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {(modal === 'from' || modal === 'to') ? (
                  <View style={styles.modalBody}>
                    {/* Search box */}
                    <View style={styles.searchBoxContainer}>
                      <Search size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                      <TextInput
                        style={styles.modalSearchInput}
                        placeholder="Rechercher une ville, un arrêt, une gare..."
                        placeholderTextColor="#94A3B8"
                        value={cityQuery}
                        onChangeText={setCityQuery}
                        autoFocus
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                      />
                    </View>

                    {/* Filter Tabs: Toutes / Villes / Arrêts */}
                    <View style={styles.tabFilterRow}>
                      <TouchableOpacity 
                        style={[styles.tabFilterPill, locationTab === 'all' && styles.tabFilterPillActive]} 
                        onPress={() => setLocationTab('all')}
                      >
                        <Text style={[styles.tabFilterText, locationTab === 'all' && styles.tabFilterTextActive]}>Toutes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.tabFilterPill, locationTab === 'city' && styles.tabFilterPillActive]} 
                        onPress={() => setLocationTab('city')}
                      >
                        <MapPin size={12} color={locationTab === 'city' ? '#0F172A' : '#64748B'} style={{ marginRight: 4 }} />
                        <Text style={[styles.tabFilterText, locationTab === 'city' && styles.tabFilterTextActive]}>Villes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.tabFilterPill, locationTab === 'stop' && styles.tabFilterPillActive]} 
                        onPress={() => setLocationTab('stop')}
                      >
                        <Bus size={12} color={locationTab === 'stop' ? '#0F172A' : '#64748B'} style={{ marginRight: 4 }} />
                        <Text style={[styles.tabFilterText, locationTab === 'stop' && styles.tabFilterTextActive]}>Arrêts & Gares</Text>
                      </TouchableOpacity>
                    </View>

                    {loadingLocations ? (
                      <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                        <ActivityIndicator color="#9EBA15" size="large" />
                        <Text style={{ marginTop: 10, color: '#64748B', fontSize: 13, fontWeight: '500' }}>Chargement des lieux...</Text>
                      </View>
                    ) : (
                      <FlatList
                        data={filteredLocations}
                        keyExtractor={(item, index) => item.id || item.name + index}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        renderItem={({ item }) => {
                          const isSelected = (modal === 'from' && from === item.name) || (modal === 'to' && to === item.name);
                          const isStop = item.type === 'stop';
                          return (
                            <TouchableOpacity 
                              style={[styles.cityItem, isSelected && styles.cityItemSelected]} 
                              onPress={() => selectLocationItem(item)}
                              activeOpacity={0.7}
                            >
                              <View style={[
                                styles.cityIconBadge, 
                                isStop && styles.stopIconBadge,
                                isSelected && styles.cityIconBadgeSelected
                              ]}>
                                {isStop ? (
                                  <Bus size={17} color={isSelected ? '#FFFFFF' : '#2563EB'} />
                                ) : (
                                  <MapPin size={17} color={isSelected ? '#FFFFFF' : '#7A960C'} />
                                )}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.cityItemText, isSelected && styles.cityItemTextSelected]}>{item.name}</Text>
                                <Text style={styles.citySubText}>
                                  {isStop ? `Arrêt / Gare • ${item.cityName || 'Réseau KonGO'}` : 'Ville principale'}
                                </Text>
                              </View>
                              {isSelected && <Text style={styles.cityCheckmark}>✓</Text>}
                            </TouchableOpacity>
                          );
                        }}
                        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />}
                        ListEmptyComponent={
                          <View style={{ padding: 24, alignItems: 'center' }}>
                            <Text style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center', fontWeight: '500' }}>
                              Aucun lieu trouvé pour "{cityQuery}"
                            </Text>
                          </View>
                        }
                      />
                    )}
                  </View>
                ) : (
                  <View style={styles.modalBody}>
                    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                      {[0, 1, 2, 3, 4, 5, 6, 7].map(offset => {
                        const d = new Date();
                        d.setDate(d.getDate() + offset);
                        const label = offset === 0 ? "Aujourd'hui" : offset === 1 ? "Demain" : d.toLocaleDateString('fr-CD', { weekday: 'long', day: 'numeric', month: 'long' });
                        const dateValue = d.toISOString().split('T')[0];
                        const isSelected = selectedDate === dateValue;
                        return (
                          <TouchableOpacity 
                            key={dateValue} 
                            style={[styles.cityItem, isSelected && styles.cityItemSelected]} 
                            onPress={() => { 
                              setDateLabel(label); 
                              setSelectedDate(dateValue);
                              setModal(null); 
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.cityIconBadge, isSelected && styles.cityIconBadgeSelected]}>
                              <Calendar size={18} color={isSelected ? '#FFFFFF' : '#7A960C'} />
                            </View>
                            <Text style={[styles.cityItemText, isSelected && styles.cityItemTextSelected]}>{label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  inputField: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFFFFF' },
  inputFieldHighlight: { backgroundColor: '#FAFCF5' },
  inputIcon: { fontSize: 18, marginRight: 14 },
  inputIconContainer: { marginRight: 14, width: 38, height: 38, borderRadius: 19, backgroundColor: '#F2F9E8', alignItems: 'center', justifyContent: 'center' },
  inputLabel: { fontSize: 10, color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  inputValue: { fontSize: 15, color: '#0F172A', fontWeight: '700', marginTop: 2 },
  inputPlaceholder: { color: '#2D3748', fontWeight: '600' },
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
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  modalKeyboardAvoiding: { width: '100%', maxHeight: '90%', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 34 : 20, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 12 },
  modalHeader: { alignItems: 'center', marginBottom: 12 },
  modalHandle: { width: 38, height: 4, backgroundColor: '#CBD5E1', borderRadius: 2, marginBottom: 14 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 4 },
  modalTitle: { fontSize: 18, color: '#0F172A', fontWeight: '900' },
  modalCloseIconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalBody: { flexShrink: 1, maxHeight: 420 },
  searchBoxContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 6, marginBottom: 14 },
  modalSearchInput: { flex: 1, fontSize: 15, color: '#0F172A', fontWeight: '600' },
  tabFilterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabFilterPill: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#F1F5F9' },
  tabFilterPillActive: { backgroundColor: '#C8E63C' },
  tabFilterText: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  tabFilterTextActive: { color: '#0F172A', fontWeight: '800' },
  cityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12 },
  cityItemSelected: { backgroundColor: '#F2F9E8' },
  cityIconBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stopIconBadge: { backgroundColor: '#EFF6FF' },
  cityIconBadgeSelected: { backgroundColor: '#9EBA15' },
  cityItemText: { fontSize: 15, color: '#334155', fontWeight: '600' },
  cityItemTextSelected: { color: '#0F172A', fontWeight: '800' },
  citySubText: { fontSize: 11, color: '#94A3B8', marginTop: 2, fontWeight: '500' },
  cityCheckmark: { fontSize: 16, color: '#7A960C', fontWeight: '800', marginLeft: 8 },
});
