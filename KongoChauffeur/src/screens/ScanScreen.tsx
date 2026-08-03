// [Agent Dev Mobile] - Action: Écran Scan & Validation Kongo Chauffeur
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, ActivityIndicator, Vibration, StatusBar
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '../lib/supabase';
import { TicketScan } from '../types';

interface ScanScreenProps {
  driverId: string;
}

type ScanState = 'idle' | 'scanning' | 'loading' | 'result';

type ScanResult = {
  status: 'valid' | 'already_scanned' | 'invalid' | 'offline';
  ticket?: Partial<TicketScan>;
  message: string;
};

export default function ScanScreen({ driverId }: ScanScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [validating, setValidating] = useState(false);
  const lastScannedRef = useRef<string>('');

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

    try {
      // Lookup booking by booking_code
      const { data: booking, error } = await supabase
        .from('bookings')
        .select(`
          id, booking_code, status, trip_id, user_id,
          profiles(full_name),
          trips(departure_time, origin:locations!origin_location_id(name), destination:locations!destination_location_id(name))
        `)
        .eq('booking_code', data)
        .single();

      if (error || !booking) {
        setResult({ status: 'invalid', message: 'Ticket introuvable ou code invalide.' });
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
        ticket_code: result.ticket.ticket_code,
        client_name: result.ticket.client_name || 'Client',
        route: result.ticket.route || '',
        departure_time: result.ticket.departure_time || new Date().toISOString(),
        scan_status: result.status === 'offline' ? 'pending_sync' : 'valid',
        scanned_at: new Date().toISOString(),
        driver_id: driverId,
      };

      const { error } = await supabase.from('ticket_scans').insert(scanPayload);

      if (error) throw error;

      Alert.alert('✅ Succès', 'Ticket validé avec succès !', [
        { text: 'Scanner suivant', onPress: resetScan }
      ]);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible d\'enregistrer la validation. Réessayez.');
    } finally {
      setValidating(false);
    }
  };

  const statusConfig = {
    valid: { bg: '#1A3A1A', border: '#2D7A2D', icon: '✅', label: 'TICKET VALIDE', color: '#4CAF50' },
    already_scanned: { bg: '#3A2A00', border: '#7A5A00', icon: '⚠️', label: 'DÉJÀ VALIDÉ', color: '#FFC107' },
    invalid: { bg: '#3A1010', border: '#7A2020', icon: '❌', label: 'TICKET INVALIDE', color: '#F44336' },
    offline: { bg: '#1A1A3A', border: '#2A2A7A', icon: '📶', label: 'HORS LIGNE', color: '#2196F3' },
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
                <Text style={styles.permissionIcon}>📷</Text>
                <Text style={styles.permissionText}>Accès à la caméra requis</Text>
                <TouchableOpacity style={styles.btnLime} onPress={requestPermission}>
                  <Text style={styles.btnLimeText}>Activer la caméra</Text>
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
          return (
            <View style={[styles.resultCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
              {/* Status badge */}
              <View style={styles.statusRow}>
                <Text style={styles.statusIcon}>{cfg.icon}</Text>
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
                      {confirmed && <Text style={styles.checkmark}>✓</Text>}
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
                      <Text style={styles.btnValidateText}>
                        {result.status === 'offline' ? '📶 Mettre en attente' : '✅ Valider le ticket'}
                      </Text>
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
  permissionIcon: { fontSize: 48, marginBottom: 16 },
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
  statusIcon: { fontSize: 24, marginRight: 10 },
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
  checkmark: { color: '#0A0A0A', fontWeight: '900', fontSize: 16 },
  checkboxLabel: { color: '#DDDDDD', fontSize: 14, flex: 1, lineHeight: 20 },
  btnValidate: { backgroundColor: '#C8E63C', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnDisabled: { opacity: 0.35 },
  btnValidateText: { color: '#0A0A0A', fontWeight: '800', fontSize: 15 },
  btnReset: { alignItems: 'center', paddingVertical: 10 },
  btnResetText: { color: '#888', fontSize: 13, fontWeight: '600' },
  btnLime: { backgroundColor: '#C8E63C', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnLimeText: { color: '#0A0A0A', fontWeight: '800', fontSize: 14 },
});
