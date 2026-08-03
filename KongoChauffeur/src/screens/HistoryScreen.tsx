// [Agent Dev Mobile] - Action: Écran Historique Kongo Chauffeur
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, StatusBar
} from 'react-native';
import { supabase } from '../lib/supabase';

interface HistoryScreenProps {
  driverId: string;
}

type FilterType = 'today' | 'week' | 'all';

type ScanRecord = {
  id: string;
  ticket_code: string;
  client_name: string;
  route: string;
  scanned_at: string;
  scan_status: 'valid' | 'already_scanned' | 'invalid' | 'pending_sync';
};

const STATUS_CONFIG = {
  valid: { label: 'Validé', color: '#4CAF50', bg: '#1A3A1A' },
  already_scanned: { label: 'Déjà validé', color: '#FFC107', bg: '#3A2A00' },
  invalid: { label: 'Refusé', color: '#F44336', bg: '#3A1010' },
  pending_sync: { label: 'En attente sync', color: '#2196F3', bg: '#1A1A3A' },
};

export default function HistoryScreen({ driverId }: HistoryScreenProps) {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [filter, setFilter] = useState<FilterType>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchScans = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      let query = supabase
        .from('ticket_scans')
        .select('id, ticket_code, client_name, route, scanned_at, scan_status')
        .eq('driver_id', driverId)
        .order('scanned_at', { ascending: false });

      const now = new Date();
      if (filter === 'today') {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        query = query.gte('scanned_at', startOfDay.toISOString());
      } else if (filter === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - 7);
        query = query.gte('scanned_at', startOfWeek.toISOString());
      }

      const { data, error } = await query.limit(100);
      if (!error) setScans(data || []);
    } catch (e) {
      setScans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [driverId, filter]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const stats = {
    total: scans.length,
    valid: scans.filter(s => s.scan_status === 'valid').length,
    refused: scans.filter(s => s.scan_status === 'invalid').length,
    pending: scans.filter(s => s.scan_status === 'pending_sync').length,
  };

  const renderScan = ({ item }: { item: ScanRecord }) => {
    const cfg = STATUS_CONFIG[item.scan_status] || STATUS_CONFIG.invalid;
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
        <Text style={styles.time}>
          🕐 {new Date(item.scanned_at).toLocaleString('fr-CD', { dateStyle: 'short', timeStyle: 'short' })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Historique</Text>
        <Text style={styles.headerSub}>{stats.total} scan{stats.total !== 1 ? 's' : ''}</Text>
      </View>

      {/* Stats summary */}
      <View style={styles.statsRow}>
        {[
          { label: 'Validés', value: stats.valid, color: '#4CAF50' },
          { label: 'Refusés', value: stats.refused, color: '#F44336' },
          { label: 'En attente', value: stats.pending, color: '#2196F3' },
        ].map(s => (
          <View key={s.label} style={styles.statBox}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(['today', 'week', 'all'] as FilterType[]).map(f => {
          const labels = { today: "Aujourd'hui", week: 'Semaine', all: 'Tous' };
          return (
            <TouchableOpacity
              key={f}
              style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {labels[f]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#C8E63C" size="large" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <FlatList
          data={scans}
          renderItem={renderScan}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchScans(true)}
              tintColor="#C8E63C"
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>Aucun scan trouvé</Text>
              <Text style={styles.emptySubtext}>Tirez vers le bas pour actualiser</Text>
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
  header: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 13, color: '#888', fontWeight: '600' },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 16,
    gap: 10,
  },
  statBox: {
    flex: 1, backgroundColor: '#1A1A1A', borderRadius: 12,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A',
  },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 2, fontWeight: '600' },
  filters: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 4,
  },
  filterBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 20,
    backgroundColor: '#1A1A1A', alignItems: 'center',
    borderWidth: 1, borderColor: '#2A2A2A',
  },
  filterBtnActive: { backgroundColor: '#C8E63C20', borderColor: '#C8E63C' },
  filterText: { color: '#888', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#C8E63C', fontWeight: '800' },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#1A1A1A', borderRadius: 14, padding: 16,
    borderLeftWidth: 4, borderTopColor: '#2A2A2A',
    borderRightColor: '#2A2A2A', borderBottomColor: '#2A2A2A',
    borderTopWidth: 1, borderRightWidth: 1, borderBottomWidth: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  ticketCode: { fontSize: 15, fontWeight: '800', color: '#C8E63C', fontFamily: 'monospace', marginBottom: 2 },
  clientName: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', marginBottom: 2 },
  route: { fontSize: 12, color: '#888' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, marginLeft: 10 },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  time: { fontSize: 12, color: '#666', fontWeight: '500' },
  loadingText: { color: '#888', marginTop: 12, fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#AAAAAA', fontSize: 16, fontWeight: '700' },
  emptySubtext: { color: '#666', fontSize: 13, marginTop: 6 },
});
