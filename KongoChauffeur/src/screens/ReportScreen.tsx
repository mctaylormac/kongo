// [Agent Dev Mobile] - Action: Écran Signalement de Problème - KonGO Chauffeur
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import {
  AlertTriangle,
  Check,
  FileText,
  Fuel,
  Route,
  Shield,
  Timer,
  User,
  Wrench,
} from 'lucide-react-native';

interface ReportScreenProps {
  driverId: string;
}

type Category = {
  id: string;
  icon: any;
  label: string;
  color: string;
};

const CATEGORIES: Category[] = [
  { id: 'breakdown',   icon: Wrench, label: 'Panne mécanique',   color: '#F44336' },
  { id: 'accident',    icon: AlertTriangle, label: 'Accident',           color: '#FF6B00' },
  { id: 'passenger',   icon: User, label: 'Incident passager',  color: '#FFC107' },
  { id: 'road',        icon: Route, label: 'Route barrée',       color: '#2196F3' },
  { id: 'delay',       icon: Timer, label: 'Retard important',   color: '#9C27B0' },
  { id: 'theft',       icon: Shield, label: 'Vol / Sécurité',     color: '#F44336' },
  { id: 'fuel',        icon: Fuel, label: 'Carburant insuffisant', color: '#FF9800' },
  { id: 'other',       icon: FileText, label: 'Autre',              color: '#607D8B' },
];

type Severity = 'low' | 'medium' | 'high' | 'critical';

const SEVERITY: { id: Severity; label: string; color: string; bg: string }[] = [
  { id: 'low',      label: 'Faible',    color: '#4CAF50', bg: '#1A3A1A' },
  { id: 'medium',   label: 'Moyen',     color: '#FFC107', bg: '#3A2A00' },
  { id: 'high',     label: 'Élevé',     color: '#FF9800', bg: '#3A2000' },
  { id: 'critical', label: 'Critique',  color: '#F44336', bg: '#3A1010' },
];
export default function ReportScreen({ driverId }: ReportScreenProps) {
  const [category, setCategory]   = useState<string>('');
  const [severity, setSeverity]   = useState<Severity>('medium');
  const [location, setLocation]   = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);
  const [agencyId, setAgencyId]   = useState<string | null>(null);

  // Fetch agency_id once on mount
  React.useEffect(() => {
    supabase.from('profiles').select('agency_id').eq('id', driverId).single()
      .then(({ data }) => { if (data) setAgencyId(data.agency_id); });
  }, [driverId]);

  const handleSend = async () => {
    if (!category) {
      Alert.alert('Catégorie manquante', 'Veuillez sélectionner une catégorie.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Description manquante', 'Veuillez décrire le problème.');
      return;
    }

    setSending(true);
    try {
      // Ensure we have the agency_id before sending
      let finalAgencyId = agencyId;
      if (!finalAgencyId) {
        console.log("AgencyId missing in state, fetching from profile...");
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('agency_id')
          .eq('id', driverId)
          .single();
        
        if (profileError) {
          console.error("Error fetching profile agency_id:", profileError);
        } else if (profile) {
          finalAgencyId = profile.agency_id;
          setAgencyId(finalAgencyId);
        }
      }

      console.log("Sending report with agency_id:", finalAgencyId);

      const { error } = await supabase.from('driver_reports').insert([{
        driver_id: driverId,
        agency_id: finalAgencyId, // Ensure this is definitely populated
        category,
        severity,
        location: location.trim() || null,
        description: description.trim(),
        status: 'pending',
        created_at: new Date().toISOString(),
      }]);

      if (error) throw error;
      setSent(true);
    } catch (e: any) {
      console.error("Report submission failed:", e);
      Alert.alert(
        'Erreur d\'envoi',
        e.message || 'Impossible d\'envoyer le signalement. Réessayez.',
      );
    } finally {
      setSending(false);
    }
  };

  const handleReset = () => {
    setCategory('');
    setSeverity('medium');
    setLocation('');
    setDescription('');
    setSent(false);
  };

  /* ── SUCCESS STATE ── */
  if (sent) {
    return (
      <View style={styles.centerFull}>
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />
        <View style={styles.successCircle}>
          <Check color="#4CAF50" size={40} strokeWidth={3} style={styles.successChk} />
        </View>
        <Text style={styles.successTitle}>Signalement envoyé !</Text>
        <Text style={styles.successSub}>
          Votre responsable a été notifié et traitera votre signalement dès que possible.
        </Text>
        <TouchableOpacity style={styles.newReportBtn} onPress={handleReset} activeOpacity={0.85}>
          <Text style={styles.newReportText}>Nouveau signalement</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selectedCat = CATEGORIES.find(c => c.id === category);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar barStyle="light-content" backgroundColor="#0A0A0A" />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Signalement</Text>
          <Text style={styles.headerSub}>Incident ou problème</Text>
        </View>

        {/* ── CATEGORY ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Type de problème</Text>
          <View style={styles.catGrid}>
            {CATEGORIES.map(cat => {
              const active = category === cat.id;
              const CatIcon = cat.icon;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catBtn,
                    active && { borderColor: cat.color, backgroundColor: `${cat.color}18` },
                  ]}
                  onPress={() => setCategory(cat.id)}
                  activeOpacity={0.8}
                >
                  <CatIcon
                    style={styles.catIcon}
                    color={active ? cat.color : '#7A7A7A'}
                    size={22}
                    strokeWidth={2.2}
                  />
                  <Text style={[styles.catLabel, active && { color: cat.color, fontWeight: '800' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── SEVERITY ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Niveau de gravité</Text>
          <View style={styles.severityRow}>
            {SEVERITY.map(sev => {
              const active = severity === sev.id;
              return (
                <TouchableOpacity
                  key={sev.id}
                  style={[
                    styles.sevBtn,
                    active && { backgroundColor: sev.bg, borderColor: sev.color },
                  ]}
                  onPress={() => setSeverity(sev.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sevText, active && { color: sev.color, fontWeight: '800' }]}>
                    {sev.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── LOCATION ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Localisation <Text style={styles.optional}>(facultatif)</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: PK 47, Route Kinshasa-Matadi..."
            placeholderTextColor="#555"
            value={location}
            onChangeText={setLocation}
            returnKeyType="next"
          />
        </View>

        {/* ── DESCRIPTION ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description du problème</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="Décrivez clairement ce qui s'est passé..."
            placeholderTextColor="#555"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            returnKeyType="done"
          />
          <Text style={styles.charCount}>{description.length} caractères</Text>
        </View>

        {/* ── PREVIEW CHIP ── */}
        {selectedCat && (
          <View style={[styles.previewChip, { borderColor: selectedCat.color }]}>
            <selectedCat.icon
              style={styles.previewIcon}
              color={selectedCat.color}
              size={26}
              strokeWidth={2.3}
            />
            <View>
              <Text style={[styles.previewLabel, { color: selectedCat.color }]}>{selectedCat.label}</Text>
              <Text style={styles.previewSeverity}>
                Gravité : {SEVERITY.find(s => s.id === severity)?.label}
              </Text>
            </View>
          </View>
        )}

        {/* ── SEND BUTTON ── */}
        <TouchableOpacity
          style={[styles.sendBtn, (sending || !category || !description.trim()) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={sending || !category || !description.trim()}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <View style={styles.sendBtnContent}>
              <AlertTriangle color="#0A0A0A" size={18} strokeWidth={2.5} />
              <Text style={styles.sendBtnText}>Envoyer le signalement</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Ce signalement sera immédiatement transmis à votre responsable d'agence.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#0A0A0A' },
  content:          { padding: 16, paddingBottom: 40 },
  centerFull:       { flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center', padding: 32 },

  // Success
  successCircle:    { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1A3A1A', borderWidth: 2, borderColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successChk:       {},
  successTitle:     { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginBottom: 12 },
  successSub:       { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  newReportBtn:     { backgroundColor: '#C8E63C', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, width: '100%', alignItems: 'center' },
  newReportText:    { color: '#0A0A0A', fontWeight: '800', fontSize: 15 },

  // Header
  header:           { paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1A1A1A', marginBottom: 24, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  headerTitle:      { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  headerSub:        { fontSize: 13, color: '#888', fontWeight: '600' },

  // Section
  section:          { marginBottom: 24 },
  sectionLabel:     { fontSize: 11, color: '#888', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },
  optional:         { color: '#555', fontWeight: '600' },

  // Categories
  catGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catBtn:           { width: '47%', backgroundColor: '#141414', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#2A2A2A', gap: 8 },
  catIcon:          { marginBottom: 2 },
  catLabel:         { fontSize: 12, color: '#AAAAAA', fontWeight: '600', textAlign: 'center' },

  // Severity
  severityRow:      { flexDirection: 'row', gap: 8 },
  sevBtn:           { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#141414', alignItems: 'center', borderWidth: 1.5, borderColor: '#2A2A2A' },
  sevText:          { fontSize: 12, color: '#888', fontWeight: '600' },

  // Inputs
  input:            { backgroundColor: '#141414', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, color: '#FFFFFF', fontSize: 15, borderWidth: 1, borderColor: '#2A2A2A' },
  textarea:         { height: 130, paddingTop: 14 },
  charCount:        { fontSize: 11, color: '#444', textAlign: 'right', marginTop: 6 },

  // Preview
  previewChip:      { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#141414', borderRadius: 14, padding: 16, borderWidth: 1.5, marginBottom: 16 },
  previewIcon:      {},
  previewLabel:     { fontSize: 15, fontWeight: '800' },
  previewSeverity:  { fontSize: 12, color: '#888', marginTop: 2 },

  // Send
  sendBtn:          { backgroundColor: '#C8E63C', borderRadius: 14, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  sendBtnDisabled:  { opacity: 0.35 },
  sendBtnContent:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sendBtnText:      { color: '#0A0A0A', fontWeight: '900', fontSize: 16, letterSpacing: 0.3 },
  disclaimer:       { fontSize: 11, color: '#444', textAlign: 'center', lineHeight: 16 },
});
