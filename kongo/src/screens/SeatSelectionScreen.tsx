// [Agent Dev Mobile] - Action: Sélection Sièges White Mode - KonGO User App
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
import { supabase } from '../lib/supabase';
import { ArrowLeft, Star, Monitor, Smartphone, LayoutGrid } from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Seat {
  id: string;
  row: number;
  col: string;
  type: 'standard' | 'premium' | 'window';
  status: 'available' | 'occupied' | 'reserved' | 'selected';
}

function generateBusLayout(totalSeats: number, occupiedIds: string[], reservedIds: string[] = []): Seat[] {
  const seats: Seat[] = [];
  const columns = ['A', 'B', 'C', 'D'];
  const totalRows = Math.ceil(totalSeats / 4);
  let count = 0;

  for (let row = 1; row <= totalRows; row++) {
    for (const col of columns) {
      if (count >= totalSeats) break;
      const id = `${row}${col}`;
      const colIndex = columns.indexOf(col);
      const isWindow = colIndex === 0 || colIndex === 3;
      const isPremium = row <= 3;

      const isOccupied = occupiedIds.includes(id);
      const isReserved = !isOccupied && reservedIds.includes(id);

      seats.push({
        id,
        row,
        col,
        type: isPremium ? 'premium' : isWindow ? 'window' : 'standard',
        status: isOccupied ? 'occupied' : isReserved ? 'reserved' : 'available',
      });
      count++;
    }
  }
  return seats;
}

export default function SeatSelectionScreen({ route, navigation }: any) {
  const { trip, from, to, date, passengers = 1 } = route?.params || {};

  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripInfo, setTripInfo] = useState<{ total_seats: number; price: number; handicap_seats: number } | null>(null);
  const [isHandicap, setIsHandicap] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!trip?.id) {
          const mockTotal = 45;
          setTripInfo({ total_seats: mockTotal, price: 25, handicap_seats: 0 });
          setSeats(generateBusLayout(mockTotal, []));
          return;
        }

        const { data: tripData } = await supabase
          .from('trips')
          .select('total_seats, price, handicap_seats')
          .eq('id', trip.id)
          .single();

        const totalSeats = tripData?.total_seats;
        const price = tripData?.price || 25;
        const handicapSeats = tripData?.handicap_seats || 0;
        setTripInfo({ total_seats: totalSeats, price, handicap_seats: handicapSeats });
        
        const occupiedIds: string[] = [];
        const reservedIds: string[] = [];

        // Fetch bookings for this trip
        const { data: tripBookings } = await supabase
          .from('bookings')
          .select('id, status, seats')
          .eq('trip_id', trip.id)
          .in('status', ['confirmed', 'paid', 'pending', 'success', 'completed']);

        if (tripBookings) {
          // Get IDs of bookings by status
          const confirmedBookingIds = tripBookings
            .filter(b => ['confirmed', 'paid', 'success', 'completed'].includes(b.status))
            .map(b => b.id);
          
          const pendingBookingIds = tripBookings
            .filter(b => b.status === 'pending')
            .map(b => b.id);

          // Fetch explicit seats for confirmed bookings
          if (confirmedBookingIds.length > 0) {
            const { data: sData } = await supabase
              .from('booking_seats')
              .select('seat_number')
              .in('booking_id', confirmedBookingIds);
            
            if (sData) sData.forEach(s => occupiedIds.push(s.seat_number));
          }

          // Fetch explicit seats for pending bookings
          if (pendingBookingIds.length > 0) {
            const { data: sData } = await supabase
              .from('booking_seats')
              .select('seat_number')
              .in('booking_id', pendingBookingIds);
            
            if (sData) sData.forEach(s => reservedIds.push(s.seat_number));
          }

          // Legacy fallback: check the seats array in bookings table
          tripBookings.forEach(booking => {
            if (Array.isArray(booking.seats)) {
              booking.seats.forEach((seat: any) => {
                const sId = typeof seat === 'string' ? seat : (seat?.id || seat?.seatNumber);
                if (sId) {
                  if (['confirmed', 'paid', 'success', 'completed'].includes(booking.status)) {
                    occupiedIds.push(sId);
                  } else if (booking.status === 'pending') {
                    reservedIds.push(sId);
                  }
                }
              });
            }
          });
        }

        const finalOccupied = [...new Set(occupiedIds)];
        const finalReserved = [...new Set(reservedIds)].filter(id => !finalOccupied.includes(id));
        
        setSeats(generateBusLayout(totalSeats, finalOccupied, finalReserved));
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trip?.id]);

  const toggleSeat = (seatId: string, status: Seat['status']) => {
    if (status === 'occupied' || status === 'reserved') return;
    if (selected.includes(seatId)) {
      setSelected(prev => prev.filter(s => s !== seatId));
    } else if (selected.length < passengers) {
      setSelected(prev => [...prev, seatId]);
    }
  };

  const totalPrice = selected.length * (tripInfo?.price || 0);
  const canContinue = selected.length === passengers;
  const totalRows = tripInfo ? Math.ceil(tripInfo.total_seats / 4) : 0;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9EBA15" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#0A0A0A" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Choisir vos sièges</Text>
          <Text style={styles.headerSub}>{from} → {to} · {trip?.agency}</Text>
        </View>
        <View style={styles.passengersPill}>
          <Text style={styles.passengersPillText}>{selected.length}/{passengers}</Text>
        </View>
        {(tripInfo?.handicap_seats ?? 0) > 0 && (
          <TouchableOpacity
            onPress={() => setIsHandicap(v => !v)}
            style={[styles.pmrBadge, isHandicap && styles.pmrBadgeActive]}
          >
            <Text style={[styles.pmrBadgeText, isHandicap && styles.pmrBadgeTextActive]}>♿ {tripInfo?.handicap_seats} PMR</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#F0F0F0', borderColor: '#DDD' }]} />
          <Text style={styles.statText}>Dispo</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#C8E63C', borderColor: '#C8E63C' }]} />
          <Text style={styles.statText}>Choisi</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#FFB84D', borderColor: '#FFB84D' }]} />
          <Text style={styles.statText}>Réservé</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: '#EEE', borderColor: '#EEE' }]} />
          <Text style={styles.statText}>Occupé</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Avant du bus */}
        <View style={styles.busFront}>
          <View style={styles.driverBox}>
            <LayoutGrid size={20} color="#666" />
          </View>
          <Text style={styles.busFrontLabel}>AVANT DU BUS</Text>
        </View>

        {/* Labels colonnes */}
        <View style={styles.colHeaderRow}>
          <View style={{ width: 24 }} />
          <Text style={styles.colHeader}>A</Text>
          <Text style={styles.colHeader}>B</Text>
          <View style={styles.aisle} />
          <Text style={styles.colHeader}>C</Text>
          <Text style={styles.colHeader}>D</Text>
        </View>

        {/* Grille */}
        {Array.from({ length: totalRows }, (_, rowIdx) => {
          const rowNum = rowIdx + 1;
          const rowSeats = seats.filter(s => s.row === rowNum);
          const colA = rowSeats.find(s => s.col === 'A');
          const colB = rowSeats.find(s => s.col === 'B');
          const colC = rowSeats.find(s => s.col === 'C');
          const colD = rowSeats.find(s => s.col === 'D');

          return (
            <View key={rowNum} style={styles.seatRow}>
              <Text style={styles.rowLabel}>{rowNum}</Text>
              
              {/* Left Group (A+B) */}
              <View style={styles.seatPair}>
                {[colA, colB].map((seat, i) => (
                  seat ? (
                    <TouchableOpacity
                      key={seat.id}
                      style={[
                        styles.seat,
                        seat.type === 'premium' && styles.seatPremium,
                        seat.status === 'occupied' && styles.seatOccupied,
                        seat.status === 'reserved' && styles.seatReserved,
                        selected.includes(seat.id) && styles.seatSelected,
                      ]}
                      onPress={() => toggleSeat(seat.id, seat.status)}
                      activeOpacity={(seat.status === 'occupied' || seat.status === 'reserved') ? 1 : 0.7}
                    >
                      <Text style={[
                        styles.seatLabel,
                        selected.includes(seat.id) && styles.seatLabelSelected,
                        seat.status === 'occupied' && styles.seatLabelOccupied,
                        seat.status === 'reserved' && styles.seatLabelReserved,
                      ]}>
                        {seat.status === 'occupied' ? '✕' : seat.status === 'reserved' ? 'R' : seat.id}
                      </Text>
                    </TouchableOpacity>
                  ) : <View key={i} style={styles.seatPlaceholder} />
                ))}
              </View>

              <View style={styles.aisle} />

              {/* Right Group (C+D) */}
              <View style={styles.seatPair}>
                {[colC, colD].map((seat, i) => (
                  seat ? (
                    <TouchableOpacity
                      key={seat.id}
                      style={[
                        styles.seat,
                        seat.type === 'premium' && styles.seatPremium,
                        seat.status === 'occupied' && styles.seatOccupied,
                        seat.status === 'reserved' && styles.seatReserved,
                        selected.includes(seat.id) && styles.seatSelected,
                      ]}
                      onPress={() => toggleSeat(seat.id, seat.status)}
                      activeOpacity={(seat.status === 'occupied' || seat.status === 'reserved') ? 1 : 0.7}
                    >
                      <Text style={[
                        styles.seatLabel,
                        selected.includes(seat.id) && styles.seatLabelSelected,
                        seat.status === 'occupied' && styles.seatLabelOccupied,
                        seat.status === 'reserved' && styles.seatLabelReserved,
                      ]}>
                        {seat.status === 'occupied' ? '✕' : seat.status === 'reserved' ? 'R' : seat.id}
                      </Text>
                    </TouchableOpacity>
                  ) : <View key={i} style={styles.seatPlaceholder} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Barre basse */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.selectedInfo}>{selected.length} place{selected.length > 1 ? 's' : ''}</Text>
          <Text style={styles.priceContainer}>
            <Text style={styles.totalPrice}>{totalPrice?.toLocaleString('fr-FR')} CDF</Text>
            <Text style={styles.totalPriceSub}> total</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          disabled={!canContinue}
          onPress={() => navigation.navigate('BookingExtras', {
            trip, from, to, date, passengers,
            seats: selected,
            totalPrice,
            isHandicap,
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, backgroundColor: '#F5F5F5', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEE' },
  headerTitle: { fontSize: 16, color: '#0A0A0A', fontWeight: '900' },
  headerSub: { fontSize: 11, color: '#666', marginTop: 2, fontWeight: '600' },
  passengersPill: { backgroundColor: '#F5FCC5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#E6EDA3' },
  passengersPillText: { fontSize: 12, color: '#6A7D0A', fontWeight: '800' },
  pmrBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE', marginLeft: 6 },
  pmrBadgeActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  pmrBadgeText: { fontSize: 11, color: '#1D4ED8', fontWeight: '800' },
  pmrBadgeTextActive: { color: '#FFFFFF' },
  statsBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingBottom: 20, gap: 20 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot: { width: 14, height: 14, borderRadius: 4, borderWidth: 1 },
  statText: { fontSize: 12, color: '#666', fontWeight: '600' },
  busFront: { alignItems: 'center', paddingVertical: 20 },
  driverBox: { width: 50, height: 35, backgroundColor: '#F5F5F5', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EEE' },
  busFrontLabel: { fontSize: 10, color: '#BBB', marginTop: 8, fontWeight: '800', letterSpacing: 2 },
  colHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  colHeader: { width: 42, textAlign: 'center', fontSize: 12, color: '#AAA', fontWeight: '800' },
  aisle: { width: 32 },
  seatRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  seatPair: { flexDirection: 'row', gap: 6 },
  rowLabel: { width: 30, fontSize: 10, color: '#CCC', fontWeight: '800', textAlign: 'left', marginRight: 4 },
  seat: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#EEE', alignItems: 'center', justifyContent: 'center' },
  seatPlaceholder: { width: 42, height: 42 },
  seatPremium: { borderColor: '#E6EDA3' },
  seatSelected: { backgroundColor: '#C8E63C', borderColor: '#C8E63C', elevation: 2 },
  seatOccupied: { backgroundColor: '#E0E0E0', borderColor: '#CCC', opacity: 0.8 },
  seatReserved: { backgroundColor: '#FFB84D', borderColor: '#FFB84D' },
  seatLabel: { fontSize: 9, color: '#666', fontWeight: '800' },
  seatLabelSelected: { color: '#0A0A0A' },
  seatLabelOccupied: { color: '#888' },
  seatLabelReserved: { color: '#FFFFFF' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#EEE',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 20, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 10
  },
  selectedInfo: { fontSize: 12, color: '#666', fontWeight: '600', marginBottom: 2 },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline' },
  totalPrice: { fontSize: 26, color: '#0A0A0A', fontWeight: '900' },
  totalPriceSub: { fontSize: 12, color: '#666', fontWeight: '600' },
  continueBtn: { backgroundColor: '#C8E63C', paddingHorizontal: 32, paddingVertical: 18, borderRadius: 18 },
  continueBtnDisabled: { backgroundColor: '#F5F5F5', opacity: 0.6 },
  continueBtnText: { fontSize: 16, color: '#0A0A0A', fontWeight: '900' },
});
