// [Agent Dev Mobile] - Action: Root App avec navigation Kongo Chauffeur
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { supabase } from './src/lib/supabase';
import LoginScreen from './src/screens/LoginScreen';
import ScanScreen from './src/screens/ScanScreen';
import HistoryScreen from './src/screens/HistoryScreen';

type AppTab = 'scan' | 'history';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [driverId, setDriverId] = useState('');
  const [activeTab, setActiveTab] = useState<AppTab>('scan');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) setDriverId(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) setDriverId(session.user.id);
      else setDriverId('');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (!session) {
    return <LoginScreen onLoginSuccess={() => {}} />;
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <View style={styles.logoSmall}>
            <Text style={styles.logoSmallText}>K</Text>
          </View>
          <Text style={styles.topBarTitle}>KonGO Chauffeur</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'scan' && <ScanScreen driverId={driverId} />}
        {activeTab === 'history' && <HistoryScreen driverId={driverId} />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scan' && styles.tabActive]}
          onPress={() => setActiveTab('scan')}
          activeOpacity={0.8}
        >
          <Text style={styles.tabIcon}>📷</Text>
          <Text style={[styles.tabLabel, activeTab === 'scan' && styles.tabLabelActive]}>
            Scanner
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.8}
        >
          <Text style={styles.tabIcon}>📋</Text>
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>
            Historique
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0A' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  topBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoSmall: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#C8E63C', alignItems: 'center', justifyContent: 'center',
  },
  logoSmallText: { fontSize: 16, fontWeight: '900', color: '#0A0A0A' },
  topBarTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  logoutBtn: { backgroundColor: '#1A1A1A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  logoutText: { color: '#888', fontSize: 12, fontWeight: '600' },
  content: { flex: 1 },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#111',
    borderTopWidth: 1, borderTopColor: '#1A1A1A',
  },
  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 4,
  },
  tabActive: { borderTopWidth: 2, borderTopColor: '#C8E63C', marginTop: -1 },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 11, color: '#666', fontWeight: '600' },
  tabLabelActive: { color: '#C8E63C', fontWeight: '800' },
});
