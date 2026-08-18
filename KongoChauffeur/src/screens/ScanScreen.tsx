// [Agent Dev Mobile] - Action: Écran Scan & Validation Kongo Chauffeur
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator, Vibration, StatusBar, Platform, TextInput
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../lib/supabase';
import { TicketScan } from '../types';
import {
  Ban,
  Camera,
  Check,
  CircleCheck,
  TriangleAlert,
  WifiOff,
  XCircle,
} from 'lucide-react-native';

interface ScanScreenProps {
  driverId: string;
}

type ScanState = 'idle' | 'scanning' | 'loading' | 'result';

type ScanResult = {
  status: 'valid' | 'already_scanned' | 'invalid' | 'offline' | 'wrong_trip';
  ticket?: Partial<TicketScan>;
  message: string;
};

export default function ScanScreen({ driverId }: ScanScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [validating, setValidating] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [driverTripId, setDriverTripId] = useState<string | null>(null);
  const lastScannedRef = useRef<string>('');

  // Fetch the driver's currently active trip on mount
  useEffect(() => {
    const fetchDriverTrip = async () => {
      try {
        const { data: drv } = await supabase
          .from('drivers')
          .select('assigned_bus_id')
          .eq('user_id', driverId)
          .maybeSingle();

        if (!drv?.assigned_bus_id) return;

        const { data: tripData } = await supabase
          .from('trips')
          .select('id')
          .eq('bus_id', drv.assigned_bus_id)
          .in('status', ['scheduled', 'in_progress'])
          .order('departure_time', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (tripData?.id) setDriverTripId(tripData.id);
      } catch (e) {
        console.error('fetchDriverTrip error:', e);
      }
    };
    fetchDriverTrip();
  }, [driverId]);

  const handleManualSearch = () => {
    if (!manualCode.trim()) return;
    lastScannedRef.current = ''; // Clear to allow searching the same code if previously scanned
    handleBarCodeScanned({ data: manualCode.trim().toUpperCase() });
  };

  const resetScan = () => {
    setScanState('idle');
    setResult(null);
    setConfirmed(false);
    lastScannedRef.current = '';
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (lastScannedRef.current === data || scanState === 'loading' || scanState === 'result') return;
    lastScannedRef.current = data;
    setScanState('loading');
    Vibration.vibrate(100);

    const cleanedData = data.replace(/^TICKET-/, '');
    
    try {
      // Lookup booking by booking_code
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          id, booking_code, status, trip_id, user_id,
          profiles!user_id(full_name),
          trips(departure_time, origin:locations!origin_location_id(name), destination:locations!destination_location_id(name))
        `)
        .eq('booking_code', cleanedData)
        .single();

      if (error || !booking) {
        setResult({ status: 'invalid', message: 'Ticket introuvable ou code invalide.' });
        setScanState('result');
        return;
      }

      // ── SECURITY: Verify ticket belongs to THIS driver's trip ──
      if (!driverTripId) {
        setResult({
          status: 'invalid',
          message: "Impossible de vérifier votre voyage actif. Vérifiez votre affectation dans l'onglet Bus.",
        });
        setScanState('result');
        return;
      }

      if (booking.trip_id !== driverTripId) {
        setResult({
          status: 'wrong_trip',
          message: "Ce ticket ne correspond pas à votre voyage. Vous ne pouvez valider que les tickets de votre propre trajet.",
          ticket: {
            ticket_code: booking.booking_code,
            route: `${(booking as any).trips?.origin?.name} → ${(booking as any).trips?.destination?.name}`,
            departure_time: (booking as any).trips?.departure_time,
          },
        });
        setScanState('result');
        return;
      }

      // Check if already scanned (validated)
      const { data: existingScan } = await supabase
        .from('ticket_scans')
        .select('id')
        .eq('booking_id', booking.id)
        .eq('scan_status', 'valid')
        .single();

      if (existingScan) {
        setResult({
          status: 'already_scanned',
          message: 'Ce ticket a déjà été validé.',
          ticket: {
            ticket_code: booking.booking_code,
            client_name: (booking as any).profiles?.full_name || 'Client',
            route: `${(booking as any).trips?.origin?.name} → ${(booking as any).trips?.destination?.name}`,
            departure_time: (booking as any).trips?.departure_time,
          }
        });
        setScanState('result');
        return;
      }

      setResult({
        status: 'valid',
        message: 'Ticket valide. Confirmez la validation.',
        ticket: {
          id: booking.id,
          ticket_code: booking.booking_code,
          client_name: (booking as any).profiles?.full_name || 'Client',
          route: `${(booking as any).trips?.origin?.name} → ${(booking as any).trips?.destination?.name}`,
          departure_time: (booking as any).trips?.departure_time,
          booking_id: booking.id,
          trip_id: booking.trip_id,
        }
      });
      setScanState('result');
    } catch (e) {
      // Offline mode - queue locally
      setResult({
        status: 'offline',
        message: 'Réseau indisponible. Validation mise en attente.',
        ticket: { ticket_code: data }
      });
      setScanState('result');
    }
  };

  const handleValidate = async () => {
    if (!confirmed || !result?.ticket) return;
    setValidating(true);

    try {
      const scanPayload = {
        booking_id: result.ticket.booking_id,
        trip_id: result.ticket.trip_id,
        driver_id: driverId,
        ticket_code: result.ticket.ticket_code,
        booking_code: result.ticket.ticket_code, // Alias for web compatibility
        client_name: result.ticket.client_name || 'Client',
        route: result.ticket.route || '',
        departure_time: result.ticket.departure_time || new Date().toISOString(),
        scan_status: result.status === 'offline' ? 'pending_sync' : 'valid',
        result: result.status === 'offline' ? 'pending' : 'valid', // Alias for web compatibility
        scanned_at: new Date().toISOString(),
      };

      console.log('Sending scan payload:', scanPayload);
      const { error } = await supabase.from('ticket_scans').insert([scanPayload]);

      if (error) throw error;

      // 2. Mark booking as completed (parity with web)
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', result.ticket.booking_id);

      if (bookingError) console.warn('Booking status update failed:', bookingError);

      Alert.alert('Succès', 'Ticket validé avec succès !', [
        { text: 'Scanner suivant', onPress: resetScan }
      ], { cancelable: false });
    } catch (e: any) {
      console.error('Validation Insert Error:', e);
      Alert.alert('Erreur', `Impossible d'enregistrer la validation: ${e.message || 'Erreur réseau'}`);
    } finally {
      setValidating(false);
    }
  };

  const statusConfig: Record<ScanResult['status'], { bg: string; border: string; icon: any; label: string; color: string }> = {
    valid:          { bg: '#1A3A1A', border: '#2D7A2D', icon: CircleCheck, label: 'TICKET VALIDE',    color: '#4CAF50' },
    already_scanned:{ bg: '#3A2A00', border: '#7A5A00', icon: TriangleAlert, label: 'DÉJÀ VALIDÉ',      color: '#FFC107' },
    invalid:        { bg: '#3A1010', border: '#7A2020', icon: XCircle, label: 'TICKET INVALIDE',  color: '#F44336' },
    offline:        { bg: '#1A1A3A', border: '#2A2A7A', icon: WifiOff, label: 'HORS LIGNE',       color: '#2196F3' },
    wrong_trip:     { bg: '#3A1A00', border: '#7A4A00', icon: Ban, label: 'MAUVAIS VOYAGE',   color: '#FF6D00' },
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#C8E63C" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scanner un Ticket</Text>
        {scanState !== 'idle' && (
          <TouchableOpacity onPress={resetScan} style={styles.resetBtn}>
            <Text style={styles.resetBtnText}>Nouveau scan</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Camera Zone */}
        {scanState === 'idle' || scanState === 'scanning' ? (
          <View style={styles.cameraContainer}>
            {!permission.granted ? (
              <View style={styles.permissionBox}>
                <Camera color="#888" size={48} style={styles.permissionIcon} />
                <Text style={styles.permissionText}>Accès à la caméra requis</Text>
                <TouchableOpacity style={styles.btnLime} onPress={requestPermission}>
                  <Text style={styles.btnLimeText}>Continuer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cameraWrapper}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={handleBarCodeScanned}
                  barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128'] }}
                />
                {/* Scan overlay */}
                <View style={styles.scanOverlay}>
                  <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                  </View>
                </View>
                <Text style={styles.scanHint}>Pointez vers le QR Code / code-barres</Text>
              </View>
            )}

            {/* Manual Entry Form */}
            <View style={styles.manualEntryContainer}>
              <Text style={styles.manualEntryLabel}>Ou saisissez le code manuellement</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: KGO123456"
                  placeholderTextColor="#666"
                  value={manualCode}
                  onChangeText={setManualCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={[styles.searchBtn, !manualCode.trim() && styles.searchBtnDisabled]} 
                  onPress={handleManualSearch}
                  disabled={!manualCode.trim()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.searchBtnText}>Chercher</Text>
                </TouchableOpacity>
              </View>
            </View>

          </View>
        ) : null}

        {/* Loading */}
        {scanState === 'loading' && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#C8E63C" size="large" />
            <Text style={styles.loadingText}>Vérification du ticket...</Text>
          </View>
        )}

        {/* Result */}
        {scanState === 'result' && result && (() => {
          const cfg = statusConfig[result.status];
          const StatusIcon = cfg.icon;
          return (
            <View style={[styles.resultCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              {/* Status badge */}
              <View style={styles.statusRow}>
                <StatusIcon color={cfg.color} size={23} style={styles.statusIcon} />
                <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
              </View>

              <Text style={styles.resultMessage}>{result.message}</Text>

              {result.ticket && (
                <View style={styles.ticketInfo}>
                  <TicketRow label="Code" value={result.ticket.ticket_code || '-'} mono />
                  {result.ticket.client_name && <TicketRow label="Client" value={result.ticket.client_name} />}
                  {result.ticket.route && <TicketRow label="Trajet" value={result.ticket.route} />}
                  {result.ticket.departure_time && (
                    <TicketRow
                      label="Départ"
                      value={new Date(result.ticket.departure_time).toLocaleString('fr-CD', {
                        dateStyle: 'short', timeStyle: 'short'
                      })}
                    />
                  )}
                </View>
              )}

              {/* Confirmation checkbox — only for valid & offline */}
              {(result.status === 'valid' || result.status === 'offline') && (
                <>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setConfirmed(!confirmed)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
                      {confirmed && <Check color="#0A0A0A" size={16} strokeWidth={3} />}
                    </View>
                    <Text style={styles.checkboxLabel}>
                      Je confirme la validation de ce ticket
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnValidate, !confirmed && styles.btnDisabled]}
                    onPress={handleValidate}
                    disabled={!confirmed || validating}
                    activeOpacity={0.85}
                  >
                    {validating ? (
                      <ActivityIndicator color="#0A0A0A" />
                    ) : (
                      <View style={styles.btnValidateContent}>
                        {result.status === 'offline' ? (
                          <WifiOff color="#0A0A0A" size={16} strokeWidth={2.7} />
                        ) : (
                          <CircleCheck color="#0A0A0A" size={16} strokeWidth={2.7} />
                        )}
                        <Text style={styles.btnValidateText}>
                          {result.status === 'offline' ? 'Mettre en attente' : 'Valider le ticket'}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity onPress={resetScan} style={styles.btnReset}>
                <Text style={styles.btnResetText}>Scanner un autre ticket</Text>
              </TouchableOpacity>
            </View>
          );
        })()}
      </ScrollView>
    </View>
  );
}

function TicketRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.ticketRow}>
      <Text style={styles.ticketLabel}>{label}</Text>
      <Text style={[styles.ticketValue, mono && styles.ticketValueMono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  resetBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  resetBtnText: { color: '#C8E63C', fontSize: 12, fontWeight: '700' },
  scroll: { padding: 20, paddingBottom: 40 },
  cameraContainer: { borderRadius: 20, overflow: 'hidden', marginBottom: 16 },
  permissionBox: {
    backgroundColor: '#1A1A1A', borderRadius: 20, padding: 40,
    alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A',
  },
  permissionIcon: { marginBottom: 16 },
  permissionText: { color: '#AAAAAA', fontSize: 15, marginBottom: 24, textAlign: 'center' },
  cameraWrapper: { position: 'relative', height: 320, borderRadius: 20, overflow: 'hidden' },
  camera: { flex: 1 },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  scanFrame: { width: 200, height: 200, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#C8E63C', borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint: { position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center', color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  loadingBox: { alignItems: 'center', padding: 60, backgroundColor: '#1A1A1A', borderRadius: 20 },
  loadingText: { color: '#AAAAAA', fontSize: 15, marginTop: 16 },
  resultCard: { borderRadius: 20, padding: 20, borderWidth: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusIcon: { marginRight: 10 },
  statusLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  resultMessage: { color: '#CCCCCC', fontSize: 14, marginBottom: 20 },
  ticketInfo: { backgroundColor: '#0A0A0A88', borderRadius: 12, padding: 16, marginBottom: 20 },
  ticketRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  ticketLabel: { color: '#888', fontSize: 12, fontWeight: '600' },
  ticketValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '700', flex: 1, textAlign: 'right' },
  ticketValueMono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#C8E63C' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  checkbox: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 2,
    borderColor: '#555', alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#C8E63C', borderColor: '#C8E63C' },
  checkboxLabel: { color: '#DDDDDD', fontSize: 14, flex: 1, lineHeight: 20 },
  btnValidate: { backgroundColor: '#C8E63C', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnDisabled: { opacity: 0.35 },
  btnValidateContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnValidateText: { color: '#0A0A0A', fontWeight: '800', fontSize: 15 },
  btnReset: { alignItems: 'center', paddingVertical: 10 },
  btnResetText: { color: '#888', fontSize: 13, fontWeight: '600' },
  btnLime: { backgroundColor: '#C8E63C', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnLimeText: { color: '#0A0A0A', fontWeight: '800', fontSize: 14 },
  manualEntryContainer: { marginTop: 24, paddingHorizontal: 4 },
  manualEntryLabel: { color: '#888', fontSize: 13, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  inputRow: { flexDirection: 'row', gap: 12 },
  input: { flex: 1, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#333', borderRadius: 12, color: '#FFFFFF', paddingHorizontal: 16, height: 50, fontSize: 16, fontWeight: '700' },
  searchBtn: { backgroundColor: '#C8E63C', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', height: 50 },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: { color: '#0A0A0A', fontSize: 14, fontWeight: '800' },
});
