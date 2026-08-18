// [Agent Dev Mobile] - Action: Historique avec Scans et Signalements - KonGO Chauffeur
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Clock, Calendar, ClipboardList, AlertTriangle } from 'lucide-react-native';

interface HistoryScreenProps {
  driverId: string;
}

type TabType = 'scans' | 'reports';
type ScanFilter = 'today' | 'week' | 'all';

type ScanRecord = {
  id: string;
  ticket_code: string;
  client_name: string;
  route: string;
  scanned_at: string;
  scan_status: 'valid' | 'already_scanned' | 'invalid' | 'pending_sync';
};

type ReportRecord = {
  id: string;
  category: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
};

const SCAN_STATUS_CFG = {
  valid: { label: 'Validé', color: '#4CAF50', bg: '#1A3A1A' },
  already_scanned: { label: 'Déjà validé', color: '#FFC107', bg: '#3A2A00' },
  invalid: { label: 'Refusé', color: '#F44336', bg: '#3A1010' },
  pending_sync: { label: 'En attente sync', color: '#2196F3', bg: '#1A1A3A' },
};

const REPORT_STATUS_CFG: any = {
  pending: { label: 'En attente', color: '#FFC107', bg: '#3A2A00' },
  resolved: { label: 'Résolu', color: '#4CAF50', bg: '#1A3A1A' },
  archived: { label: 'Archivé', color: '#888', bg: '#1A1A1A' },
};

const SEVERITY_CFG: any = {
  low: { label: 'Faible', color: '#4CAF50' },
  medium: { label: 'Moyen', color: '#FFC107' },
  high: { label: 'Élevé', color: '#FF9800' },
  critical: { label: 'Critique', color: '#F44336' },
};

export default function HistoryScreen({ driverId }: HistoryScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('scans');
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [scanFilter, setScanFilter] = useState<ScanFilter>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      if (activeTab === 'scans') {
        let query = supabase
          .from('ticket_scans')
          .select('id, ticket_code, client_name, route, scanned_at, scan_status')
          .eq('driver_id', driverId)
          .order('scanned_at', { ascending: false });

        if (scanFilter === 'today') {
          const start = new Date(); start.setHours(0,0,0,0);
          query = query.gte('scanned_at', start.toISOString());
        } else if (scanFilter === 'week') {
          const start = new Date(); start.setDate(start.getDate() - 7);
          query = query.gte('scanned_at', start.toISOString());
        }
        const { data } = await query.limit(100);
        setScans(data || []);
      } else {
        const { data } = await supabase
          .from('driver_reports')
          .select('*')
          .eq('driver_id', driverId)
          .order('created_at', { ascending: false });
        setReports(data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driverId, activeTab, scanFilter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const stats = {
    valid: scans.filter(s => s.scan_status === 'valid').length,
    reports: reports.length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
  };

  const renderScan = ({ item }: { item: ScanRecord }) => {
    const cfg = SCAN_STATUS_CFG[item.scan_status] || SCAN_STATUS_CFG.invalid;
    return (
      <View style={[styles.card, { borderLeftColor: cfg.color }]}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.ticketCode}>{item.ticket_code}</Text>
            <Text style={styles.clientName}>{item.client_name}</Text>
            <Text style={styles.route}>{item.route}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: cfg.bg, borderColor: cfg.color }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Clock size={12} color="#555" />
          <Text style={styles.time}>
            {new Date(item.scanned_at).toLocaleString('fr-CD', { dateStyle: 'short', timeStyle: 'short' })}
          </Text>
        </View>
      </View>
    );
  };

  const renderReport = ({ item }: { item: ReportRecord }) => {
    const sCfg = REPORT_STATUS_CFG[item.status] || REPORT_STATUS_CFG.pending;
    const vCfg = SEVERITY_CFG[item.severity] || SEVERITY_CFG.medium;
    return (
      <View style={[styles.card, { borderLeftColor: vCfg.color }]}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.catLabel, { color: vCfg.color }]}>{item.category.toUpperCase()}</Text>
            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: sCfg.bg, borderColor: sCfg.color }]}>
            <Text style={[styles.badgeText, { color: sCfg.color }]}>{sCfg.label}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Calendar size={12} color="#555" />
          <Text style={styles.time}>
            {new Date(item.created_at).toLocaleString('fr-CD', { dateStyle: 'short', timeStyle: 'short' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header with Segment Control */}
      <View style={styles.header}>
        <View style={styles.segmentControl}>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'scans' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('scans')}
          >
            <Text style={[styles.segmentText, activeTab === 'scans' && styles.segmentTextActive]}>Scans</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segmentBtn, activeTab === 'reports' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('reports')}
          >
            <Text style={[styles.segmentText, activeTab === 'reports' && styles.segmentTextActive]}>Signalements</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scans specific subheader */}
      {activeTab === 'scans' && (
        <View style={styles.filters}>
          {(['today', 'week', 'all'] as ScanFilter[]).map(f => {
            const labels = { today: "Aujourd'hui", week: '7j', all: 'Tous' };
            return (
              <TouchableOpacity
                key={f}
                style={[styles.filterBtn, scanFilter === f && styles.filterBtnActive]}
                onPress={() => setScanFilter(f)}
              >
                <Text style={[styles.filterText, scanFilter === f && styles.filterTextActive]}>
                  {labels[f]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#C8E63C" size="large" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={activeTab === 'scans' ? (scans as any[]) : (reports as any[])}
          renderItem={activeTab === 'scans' ? (renderScan as any) : (renderReport as any)}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchHistory(true)} tintColor="#C8E63C" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              {activeTab === 'scans' ? (
                <ClipboardList color="#333" size={48} style={{ marginBottom: 16 }} />
              ) : (
                <AlertTriangle color="#333" size={48} style={{ marginBottom: 16 }} />
              )}
              <Text style={styles.emptyText}>Aucun {activeTab === 'scans' ? 'scan' : 'signalement'} trouvé</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  segmentControl: { flexDirection: 'row', backgroundColor: '#1A1A1A', borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  segmentBtnActive: { backgroundColor: '#C8E63C' },
  segmentText: { color: '#888', fontWeight: '700', fontSize: 13 },
  segmentTextActive: { color: '#0A0A0A' },

  filters: { flexDirection: 'row', padding: 12, gap: 8, paddingHorizontal: 16 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 20, backgroundColor: '#141414', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  filterBtnActive: { borderColor: '#C8E63C', backgroundColor: '#C8E63C15' },
  filterText: { color: '#666', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#C8E63C', fontWeight: '800' },

  list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#141414', borderRadius: 14, padding: 16, borderLeftWidth: 4, borderWidth: 1, borderColor: '#222' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  ticketCode: { fontSize: 15, fontWeight: '800', color: '#C8E63C', fontFamily: 'monospace' },
  clientName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginTop: 2 },
  route: { fontSize: 12, color: '#888', marginTop: 2 },
  catLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  description: { fontSize: 13, color: '#DDD', lineHeight: 18 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, marginLeft: 10 },
  badgeText: { fontSize: 10, fontWeight: '900' },
  time: { fontSize: 11, color: '#555', fontWeight: '600' },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#666', fontSize: 15, fontWeight: '700' },
});
