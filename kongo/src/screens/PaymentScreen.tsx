// [Agent Dev Mobile] - Action: Écran Paiement White Mode - KonGO User App
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Wallet, Smartphone, Landmark, Check } from 'lucide-react-native';

const PAYMENT_METHODS = [
  { id: 'm_pesa', name: 'M-Pesa', icon: <Smartphone size={24} color="#E4001C" />, desc: 'Vodacom RDC' },
  { id: 'orange_money', name: 'Orange Money', icon: <Smartphone size={24} color="#FF6600" />, desc: 'Orange RDC' },
  { id: 'airtel_money', name: 'Airtel Money', icon: <Smartphone size={24} color="#ED1C24" />, desc: 'Airtel RDC' },
  { id: 'cash_agency', name: 'Cash l\'Agence', icon: <Landmark size={24} color="#666" />, desc: 'Payer au guichet' },
];

export default function PaymentScreen({ route, navigation }: any) {
  const { trip, from, to, date, passengers, seats, grandTotal, extras, isHandicap } = route?.params || {};
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [methods, setMethods] = useState(PAYMENT_METHODS);

  React.useEffect(() => {
    const fetchMethods = async () => {
      try {
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          const mapped = data.map((pm: any) => {
            const code = (pm.code || '').toLowerCase();
            let icon = <Smartphone size={24} color="#9EBA15" />;
            if (code.includes('card') || code.includes('visa') || code.includes('mastercard')) {
              icon = <Wallet size={24} color="#2196F3" />;
            } else if (code.includes('bank') || code.includes('cash') || code.includes('guichet')) {
              icon = <Landmark size={24} color="#666" />;
            } else if (code.includes('orange')) {
              icon = <Smartphone size={24} color="#FF6600" />;
            } else if (code.includes('airtel')) {
              icon = <Smartphone size={24} color="#ED1C24" />;
            } else if (code.includes('mpesa')) {
              icon = <Smartphone size={24} color="#E4001C" />;
            }

            return {
              id: pm.code || pm.id,
              name: pm.name,
              icon,
              desc: pm.provider ? `${pm.provider} (${pm.instructions || 'Paiement sécurisé'})` : (pm.instructions || 'Paiement')
            };
          });
          setMethods(mapped);
          if (mapped.length > 0) {
            setSelectedMethod(mapped[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching db payment methods in app:', err);
      }
    };
    fetchMethods();
  }, []);

  const handlePayment = async () => {
    if (selectedMethod !== 'cash_agency' && phone.length < 9) {
      Alert.alert('Erreur', 'Veuillez entrer un numéro valide.');
      return;
    }
    
    setProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
         Alert.alert('Session expirée', 'Veuillez vous reconnecter pour réserver.');
         navigation.navigate('Login');
         return;
      }
      const user = userData.user;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();

      const bookingCode = `KG-${Math.floor(Math.random() * 900000 + 100000)}`;
      const passengersNum = Number(passengers) || 1;
      
      const passenger_details = Array.from({ length: passengersNum }).map((_, i) => ({
        full_name: i === 0 ? (profile?.full_name || 'Passager Principal') : `Passager ${i + 1}`,
        seat_label: (seats && seats[i]) ? String(seats[i]) : '-',
        price: grandTotal / passengersNum
      }));

      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          user_id: user.id,
          trip_id: trip.id,
          status: selectedMethod === 'cash_agency' ? 'pending' : 'confirmed',
          booking_code: bookingCode,
          total_price: grandTotal,
          seats: seats || [],
          currency: 'CDF',
          payment_status: selectedMethod === 'cash_agency' ? 'pending' : 'paid',
          payment_method: selectedMethod,
          passenger_count: passengersNum,
          passenger_details: passenger_details,
          baggage_info: [],
          baggage_fee: 0,
          is_handicap: !!isHandicap,
        }])
        .select();

      if (bookingError) throw bookingError;
      const booking = bookings?.[0];

      if (booking && seats && seats.length > 0) {
        const seatPrice = grandTotal / passengersNum;
        const seatRecords = seats.map((s: string) => ({
          booking_id: booking.id,
          seat_number: s,
          price: seatPrice,
          seat_type: 'standard' // Default type
        }));
        
        const { error: seatsError } = await supabase
          .from('booking_seats')
          .insert(seatRecords);
          
        if (seatsError) {
          console.error('Error inserting booking_seats:', seatsError);
        } else {
          console.log('Successfully reserved seats:', seats.length);
        }
      }

      // Decrement handicap seats if PMR booking
      if (isHandicap && (trip?.handicap_seats ?? 0) > 0) {
        await supabase
          .from('trips')
          .update({ handicap_seats: Math.max(0, (trip.handicap_seats ?? 0) - (seats?.length || 1)) })
          .eq('id', trip.id);
      }

      navigation.navigate('Confirmation', {
        trip, from, to, date, passengers, seats, grandTotal, extras,
        paymentMethod: selectedMethod,
        phone,
        bookingRef: bookingCode,
        isHandicap,
      });
    } catch (err: any) {
      console.error('Payment/Booking error:', err);
      Alert.alert('Erreur', 'Impossible de valider la réservation: ' + (err.message || 'Erreur inconnue'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <ArrowLeft size={20} color="#0A0A0A" />
            </TouchableOpacity>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.headerTitle}>Paiement</Text>
              <Text style={styles.headerSub}>{from} → {to}</Text>
            </View>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            contentContainerStyle={{ padding: 16, paddingBottom: 160 }}
            keyboardShouldPersistTaps="handled"
          >

            {/* Amount Card */}
            <View style={styles.amountCard}>
              <Text style={styles.amountLabel}>À PAYER</Text>
              <Text style={styles.amountValue}>{grandTotal?.toLocaleString('fr-CD')} CDF</Text>
              <View style={styles.amountBadge}>
                <Text style={styles.amountBadgeText}>{passengers} Passager{passengers > 1 ? 's' : ''}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Moyen de paiement</Text>
            {methods.map(method => {
              const isActive = selectedMethod === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.methodCard, isActive && styles.methodCardActive]}
                  onPress={() => {
                    Keyboard.dismiss();
                    setSelectedMethod(method.id);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.methodIconBox, isActive && styles.methodIconBoxActive]}>
                    {method.icon}
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.methodName, isActive && styles.methodNameActive]}>{method.name}</Text>
                    <Text style={styles.methodDesc}>{method.desc}</Text>
                  </View>
                  <View style={[styles.methodRadio, isActive && styles.methodRadioActive]}>
                    {isActive && <Check size={12} color="#FFFFFF" strokeWidth={4} />}
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Phone Input Card */}
            {selectedMethod !== 'cash_agency' && (
              <View style={styles.phoneCard}>
                <Text style={styles.phoneLabel}>Numéro de téléphone</Text>
                <View style={styles.phoneInputRow}>
                  <Text style={styles.phonePrefix}>+243</Text>
                  <TextInput
                    style={styles.phoneNumber}
                    placeholder="000 000 000"
                    placeholderTextColor="#AAA"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    autoFocus={false}
                    maxLength={10}
                  />
                  <TouchableOpacity 
                    style={styles.okBtn} 
                    onPress={() => Keyboard.dismiss()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.okBtnText}>OK</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.phoneHint}>Une demande de confirmation apparaîtra sur votre téléphone.</Text>
              </View>
            )}

            {selectedMethod === 'cash_agency' && (
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>📍 Veuillez vous rendre à une agence KonGO pour régler le montant et valider votre réservation.</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.payBtn, processing && styles.payBtnDisabled]}
          onPress={handlePayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <Text style={styles.payBtnText}>
              {selectedMethod === 'cash_agency' ? 'Réserver sans payer' : `Payer ${grandTotal?.toLocaleString('fr-CD')} CDF`}
            </Text>
          )}
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
  amountCard: { backgroundColor: '#F9F9F9', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#EEE', marginBottom: 24 },
  amountLabel: { fontSize: 12, color: '#9EBA15', fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  amountValue: { fontSize: 48, color: '#0A0A0A', fontWeight: '900', marginBottom: 12 },
  amountBadge: { backgroundColor: '#FFFFFF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
  amountBadgeText: { fontSize: 12, color: '#666', fontWeight: '700' },
  sectionTitle: { fontSize: 14, color: '#0A0A0A', fontWeight: '900', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  methodCard: { 
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
  methodCardActive: { 
    borderColor: '#9EBA15', 
    borderWidth: 2,
    backgroundColor: '#FAFCED',
    shadowColor: '#9EBA15',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4
  },
  methodIconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: '#F5F5F5', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE'
  },
  methodIconBoxActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#9EBA15'
  },
  methodName: { fontSize: 15, color: '#0A0A0A', fontWeight: '800' },
  methodNameActive: { fontWeight: '900' },
  methodDesc: { fontSize: 12, color: '#666', marginTop: 2, fontWeight: '500' },
  methodRadio: { 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    borderWidth: 2, 
    borderColor: '#D1D1D6', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#FFFFFF' 
  },
  methodRadioActive: { 
    borderColor: '#9EBA15', 
    backgroundColor: '#9EBA15' 
  },
  phoneCard: { backgroundColor: '#F9F9F9', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#E5E5EA', marginTop: 8 },
  phoneLabel: { fontSize: 12, color: '#0A0A0A', fontWeight: '800', marginBottom: 12, textTransform: 'uppercase' },
  phoneInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E5EA', paddingHorizontal: 16, paddingVertical: 14 },
  phonePrefix: { fontSize: 16, color: '#0A0A0A', fontWeight: '900', marginRight: 10 },
  phoneNumber: { flex: 1, fontSize: 18, color: '#0A0A0A', fontWeight: '900' },
  okBtn: { backgroundColor: '#9EBA15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginLeft: 8, alignItems: 'center', justifyContent: 'center' },
  okBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  phoneHint: { fontSize: 11, color: '#666', marginTop: 10, fontWeight: '500', textAlign: 'center' },
  infoCard: { backgroundColor: '#F5F5F5', borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#E5E5EA', marginTop: 16 },
  infoText: { fontSize: 13, color: '#666', lineHeight: 20, fontWeight: '500' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EEE', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10 },
  payBtn: { backgroundColor: '#C8E63C', paddingVertical: 20, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  payBtnDisabled: { opacity: 0.7 },
  payBtnText: { fontSize: 16, color: '#0A0A0A', fontWeight: '900' },
});
