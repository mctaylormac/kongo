// [Agent Dev Mobile] - Action: Écran Extras de Réservation White Mode - KonGO User App
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Check } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

// Removed static EXTRAS constant as we now fetch from database

export default function BookingExtrasScreen({ route, navigation }: any) {
  const { trip, from, to, date, passengers, seats, totalPrice, isHandicap } = route?.params || {};
  const [extras, setExtras] = useState<any[]>([]);
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchExtras() {
      if (!trip?.agency_id) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('extra_services')
          .select('*')
          .eq('agency_id', trip.agency_id)
          .eq('is_active', true)
          .order('category');

        if (error) throw error;
        setExtras(data || []);
      } catch (err) {
        console.error('Error fetching extras:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchExtras();
  }, [trip?.agency_id]);

  const toggleExtra = (extra: any) => {
    setSelectedExtras(prev =>
      prev.some(e => e.id === extra.id) 
        ? prev.filter(e => e.id !== extra.id) 
        : [...prev, extra]
    );
  };

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);

  const grandTotal = totalPrice + extrasTotal;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0A0A0A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Options</Text>
          <Text style={styles.headerSub}>{from} → {to}</Text>
        </View>
      </View>

      {/* Recap */}
      <View style={styles.recapCard}>
        <Text style={styles.recapTitle}>Votre trajet</Text>
        <View style={styles.recapRow}>
          <Text style={styles.recapLabel}>{trip?.agencies?.name || trip?.agency || 'KonGO Express'}</Text>
          <Text style={styles.recapValue}>{totalPrice?.toLocaleString('fr-CD')} CDF</Text>
        </View>
        <Text style={styles.recapSubLabel}>Sièges: {Array.isArray(seats) ? seats.join(', ') : 'Par défaut'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 160 }}>
        <Text style={styles.sectionTitle}>Personnalisez votre voyage</Text>

        {isLoading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color="#C8E63C" size="large" />
            <Text style={{ marginTop: 10, color: '#666', fontWeight: '800', textTransform: 'uppercase', fontSize: 10 }}>Chargement des options...</Text>
          </View>
        ) : extras.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: 'center', opacity: 0.5 }}>
            <Text style={{ color: '#666', fontWeight: '800', textTransform: 'uppercase', fontSize: 10 }}>Aucun extra disponible</Text>
          </View>
        ) : (
          extras.map((extra) => {
            const isSelected = selectedExtras.some(e => e.id === extra.id);
            const icon = extra.category === 'baggage' ? '🧳' : 
                         extra.category === 'insurance' ? '🛡️' : 
                         extra.category === 'meal' ? '🍱' : 
                         extra.category === 'wifi' ? '📶' : '✨';
            
            return (
              <TouchableOpacity
                key={extra.id}
                style={[styles.extraCard, isSelected && styles.extraCardSelected]}
                activeOpacity={0.85}
                onPress={() => toggleExtra(extra)}
              >
                <View style={[styles.extraIconBox, isSelected && styles.extraIconBoxSelected]}>
                  <Text style={styles.extraIcon}>{extra.icon || icon}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[styles.extraTitle, isSelected && styles.extraTitleSelected]}>{extra.title}</Text>
                  <Text style={styles.extraDesc}>{extra.description || extra.desc}</Text>
                  {extra.category === 'baggage' && extra.min_weight !== undefined && (
                    <Text style={{ fontSize: 9, color: '#9EBA15', fontWeight: '900', marginTop: 2, textTransform: 'uppercase' }}>
                      Poids: {extra.min_weight}-{extra.max_weight || '∞'}kg
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.extraPrice, isSelected && styles.extraPriceSelected]}>+{extra.price?.toLocaleString('fr-CD')} CDF</Text>
                  <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Check size={12} color="#0A0A0A" strokeWidth={4} />}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Bottom bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>{grandTotal?.toLocaleString('fr-CD')} CDF</Text>
        </View>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={() => navigation.navigate('Payment', {
            trip, from, to, date, passengers, seats, totalPrice, extras: selectedExtras, grandTotal, isHandicap,
          })}
        >
          <Text style={styles.continueBtnText}>Suivant</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, backgroundColor: '#F5F5F5', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEE' },
  headerTitle: { fontSize: 18, color: '#0A0A0A', fontWeight: '900' },
  headerSub: { fontSize: 12, color: '#666', marginTop: 2, fontWeight: '600' },
  recapCard: { backgroundColor: '#F9F9F9', marginHorizontal: 16, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#EEE', marginBottom: 20 },
  recapTitle: { fontSize: 12, color: '#9EBA15', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  recapLabel: { fontSize: 16, color: '#0A0A0A', fontWeight: '800' },
  recapValue: { fontSize: 20, color: '#0A0A0A', fontWeight: '900' },
  recapSubLabel: { fontSize: 12, color: '#666', marginTop: 4, fontWeight: '500' },
  sectionTitle: { fontSize: 16, color: '#0A0A0A', fontWeight: '900', marginBottom: 16 },
  extraCard: { 
    backgroundColor: '#FFFFFF', 
    borderRadius: 20, 
    padding: 16, 
    borderWidth: 1.5, 
    borderColor: '#E5E5EA', 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.03, 
    shadowRadius: 10,
    elevation: 2 
  },
  extraCardSelected: { 
    borderColor: '#C8E63C', 
    borderWidth: 2,
    backgroundColor: '#F9FFD115',
    shadowColor: '#C8E63C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4
  },
  extraIconBox: { 
    width: 50, 
    height: 50, 
    borderRadius: 16, 
    backgroundColor: '#F5F5F5', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE'
  },
  extraIconBoxSelected: { 
    backgroundColor: '#C8E63C33',
    borderColor: '#C8E63C'
  },
  extraIcon: { fontSize: 24 },
  extraTitle: { fontSize: 15, color: '#0A0A0A', fontWeight: '800', marginBottom: 4 },
  extraTitleSelected: { color: '#0A0A0A', fontWeight: '900' },
  extraDesc: { fontSize: 12, color: '#666', fontWeight: '500', width: '90%' },
  extraPrice: { fontSize: 16, color: '#666', fontWeight: '900', marginBottom: 8 },
  extraPriceSelected: { color: '#9EBA15' },
  checkbox: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    borderWidth: 2, 
    borderColor: '#D1D1D6', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  checkboxSelected: { 
    backgroundColor: '#C8E63C', 
    borderColor: '#C8E63C' 
  },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EEE', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  totalLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 2 },
  totalAmount: { fontSize: 26, color: '#0A0A0A', fontWeight: '900' },
  continueBtn: { backgroundColor: '#C8E63C', paddingHorizontal: 36, paddingVertical: 18, borderRadius: 18 },
  continueBtnText: { fontSize: 16, color: '#0A0A0A', fontWeight: '900' },
});
