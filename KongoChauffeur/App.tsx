// [Agent Dev Mobile] - Action: Root App avec navigation 4 onglets - KonGO Chauffeur
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from './src/lib/supabase';
import LoginScreen   from './src/screens/LoginScreen';
import BusScreen     from './src/screens/BusScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ReportScreen  from './src/screens/ReportScreen';
import ScanScreen    from './src/screens/ScanScreen';

import { Bus, ClipboardList, AlertTriangle, Scan } from 'lucide-react-native';

type AppTab = 'bus' | 'scan' | 'history' | 'report';

const TABS: { id: AppTab; icon: any; label: string }[] = [
  { id: 'bus',     icon: Bus,           label: 'Mon Bus'    },
  { id: 'scan',    icon: Scan,          label: 'Scanner'    },
  { id: 'history', icon: ClipboardList, label: 'Historique' },
  { id: 'report',  icon: AlertTriangle, label: 'Signaler'   },
];

export default function App() {
  const [session,   setSession]   = useState<any>(null);
  const [driverId,  setDriverId]  = useState('');
  const [activeTab, setActiveTab] = useState<AppTab>('bus');

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
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

        {/* ── TOP BAR ── */}
        <View style={styles.topBar}>
          <View style={styles.topBarLeft}>
            <View style={styles.logoSmall}>
              <Text style={styles.logoSmallText}>K</Text>
            </View>
            <View>
              <Text style={styles.topBarTitle}>KonGO Chauffeur</Text>
              <Text style={styles.topBarSub}>Tableau de bord</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        {/* ── CONTENT ── */}
        <View style={styles.content}>
          {activeTab === 'bus'      && <BusScreen     driverId={driverId} />}
          {activeTab === 'scan'     && <ScanScreen    driverId={driverId} />}
          {activeTab === 'history'  && <HistoryScreen driverId={driverId} />}
          {activeTab === 'report'   && <ReportScreen  driverId={driverId} />}
        </View>

        {/* ── BOTTOM TAB BAR ── */}
        <View style={styles.tabBar}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.8}
              >
                <tab.icon color={active ? '#C8E63C' : '#666'} size={24} strokeWidth={active ? 2.5 : 2} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {/* Active indicator dot */}
                {active && <View style={styles.tabDot} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#0A0A0A' },

  // Top bar
  topBar:         {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  topBarLeft:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoSmall:      {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#C8E63C', alignItems: 'center', justifyContent: 'center',
  },
  logoSmallText:  { fontSize: 18, fontWeight: '900', color: '#0A0A0A' },
  topBarTitle:    { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  topBarSub:      { fontSize: 10, color: '#666', fontWeight: '600', marginTop: 1 },
  logoutBtn:      { backgroundColor: '#1A1A1A', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#2A2A2A' },
  logoutText:     { color: '#888', fontSize: 12, fontWeight: '600' },

  content:        { flex: 1 },

  // Tab bar
  tabBar:         {
    flexDirection: 'row', backgroundColor: '#111',
    borderTopWidth: 1, borderTopColor: '#1A1A1A',
    paddingBottom: 4,
  },
  tab:            {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 3,
  },
  tabActive:      { borderTopWidth: 2, borderTopColor: '#C8E63C', marginTop: -1 },
  tabIcon:        { fontSize: 20 },
  tabLabel:       { fontSize: 10, color: '#666', fontWeight: '600' },
  tabLabelActive: { color: '#C8E63C', fontWeight: '800' },
  tabDot:         {
    position: 'absolute', bottom: 2,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: '#C8E63C',
  },
});
