// [Agent Dev Mobile] - Action: Écran Profil White Mode - KonGO User App
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Ticket, 
  Star, 
  CreditCard, 
  MapPin, 
  Bell, 
  Globe, 
  MessageSquare, 
  FileText, 
  Lock, 
  Settings, 
  ChevronRight,
  ChevronDown,
  LogOut,
  User as UserIcon,
  Trash2,
  AlertTriangle,
  Edit3,
  Check,
  X
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useCountry, Country, DEFAULT_COUNTRIES } from '../context/CountryContext';
import { PhoneInput } from '../components/PhoneInput';

type MenuItem = {
  icon: any;
  label: string;
  color: string;
  badge?: string;
  value?: string;
  toggle?: boolean;
  enabled?: boolean;
};

type MenuSection = {
  section: string;
  items: MenuItem[];
};

const MENU_ITEMS: MenuSection[] = [
  { section: 'Mon compte', items: [
    { icon: Ticket, label: 'Mes voyages', badge: '2', color: '#9EBA15' },
    { icon: Star, label: 'Voyages favoris', color: '#9EBA15' },
  ]},
  { section: 'Préférences', items: [
    { icon: Bell, label: 'Notifications', color: '#444' },
    { icon: Globe, label: 'Langue', value: 'Français', color: '#444' },
  ]},
  { section: 'Support', items: [
    { icon: MessageSquare, label: 'Service client', color: '#666' },
    { icon: FileText, label: 'Légal', color: '#666' },
    { icon: Settings, label: 'Version', value: 'v1.0.0', color: '#666' },
  ]},
];

const DEFAULT_MOBILE_NOTIFICATIONS = [
  {
    id: 'mob-notif-1',
    title: 'Mise à jour des départs - Ligne Kinshasa/Matadi',
    content: 'En raison des travaux routiers, les départs de 14h00 de l\'agence Maji Express sont avancés de 15 minutes.',
    agency_name: 'Maji Express',
    published_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'mob-notif-2',
    title: 'Offre Spéciale Abonnés ⚡',
    content: 'Bénéficiez de 10% de réduction sur tous vos billets vers Lubumbashi ce week-end !',
    agency_name: 'Transco RDC',
    published_at: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'mob-notif-3',
    title: 'Nouveau Point de Ramassage à Brazzaville',
    content: 'Retrouvez nos nouveaux guichets au Port de Pointe-Noire et à la Gare Centrale de Brazzaville.',
    agency_name: 'Ocean du Congo',
    published_at: new Date(Date.now() - 86400000).toISOString(),
  }
];

export default function ProfileScreen({ navigation }: any) {
  const { selectedCountry, setSelectedCountry, countries } = useCountry();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [notif, setNotif] = useState(true);
  const [bookingCount, setBookingCount] = useState(0);
  const [cityCount, setCityCount] = useState(0);

  // ── Édition du profil ──────────────────────────────────────────────
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editCountry, setEditCountry] = useState<Country>(selectedCountry);
  const [editCity, setEditCity] = useState('');
  const [editPhoneCode, setEditPhoneCode] = useState(selectedCountry.phone_code || '+243');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showCountryPickerModal, setShowCountryPickerModal] = useState(false);
  const [showCityPickerModal, setShowCityPickerModal] = useState(false);

  // ── Notifications ──────────────────────────────────────────────────
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [userNotifications, setUserNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const fetchPublishedNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('published_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setUserNotifications(data);
      } else {
        setUserNotifications(DEFAULT_MOBILE_NOTIFICATIONS);
      }
    } catch {
      setUserNotifications(DEFAULT_MOBILE_NOTIFICATIONS);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // ── Suppression de compte ──────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserStats(session.user.id);
        populateProfileForm(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserStats(session.user.id);
        populateProfileForm(session.user);
      } else { 
        setBookingCount(0); 
        setCityCount(0); 
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const populateProfileForm = (user: any) => {
    const meta = user.user_metadata || {};
    if (meta.full_name) setEditFullName(meta.full_name);
    if (meta.city) setEditCity(meta.city);
    if (meta.phone_code) setEditPhoneCode(meta.phone_code);
    if (meta.phone_number) setEditPhoneNumber(meta.phone_number);
    if (meta.country_code || meta.country) {
      const found = countries.find(c => c.code === meta.country_code || c.name === meta.country);
      if (found) setEditCountry(found);
    }
  };

  // Charger les villes selon le pays sélectionné dans le formulaire d'édition
  useEffect(() => {
    const fetchCitiesForCountry = async () => {
      if (!editCountry) return;
      setLoadingCities(true);
      try {
        let query = supabase.from('cities').select('name, country_id').eq('is_active', true);
        if (editCountry.id) {
          query = query.eq('country_id', editCountry.id);
        }
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          setAvailableCities(data.map((c: any) => c.name));
        } else {
          // Fallback par pays
          if (editCountry.code === 'RDC' || editCountry.phone_code === '+243') {
            setAvailableCities(['Kinshasa', 'Lubumbashi', 'Goma', 'Bukavu', 'Matadi', 'Kisangani', 'Mbuji-Mayi', 'Kananga']);
          } else if (editCountry.code === 'CG' || editCountry.phone_code === '+242') {
            setAvailableCities(['Brazzaville', 'Pointe-Noire', 'Dolisie', 'Nkayi', 'Ouesso']);
          } else if (editCountry.code === 'CM' || editCountry.phone_code === '+237') {
            setAvailableCities(['Douala', 'Yaoundé', 'Garoua', 'Bamenda', 'Maroua', 'Bafoussam']);
          } else if (editCountry.code === 'CI' || editCountry.phone_code === '+225') {
            setAvailableCities(['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Korhogo']);
          } else {
            setAvailableCities(['Libreville', 'Port-Gentil', 'Franceville']);
          }
        }
      } catch {
        setAvailableCities(['Kinshasa', 'Lubumbashi', 'Goma']);
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCitiesForCountry();
  }, [editCountry]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const fullPhone = `${editPhoneCode}${editPhoneNumber.replace(/\s+/g, '')}`;
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: editFullName,
          country: editCountry.name,
          country_code: editCountry.code,
          city: editCity,
          phone_code: editPhoneCode,
          phone_number: editPhoneNumber,
          phone: fullPhone,
        }
      });

      if (error) throw error;

      // Mettre à jour le pays sélectionné au niveau global dans l'app
      setSelectedCountry(editCountry);
      setShowEditProfileModal(false);
      Alert.alert('Succès ⚡', 'Votre profil a été mis à jour avec succès.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message || 'Impossible de mettre à jour le profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      // Total bookings
      const { count } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      if (count !== null) setBookingCount(count);

      // Distinct destination cities via trip join
      const { data: bookingData } = await supabase
        .from('bookings')
        .select('trips(destination:locations!destination_location_id(name))')
        .eq('user_id', userId);
      if (bookingData) {
        const cities = new Set(
          bookingData
            .map((b: any) => b.trips?.destination?.name)
            .filter(Boolean)
        );
        setCityCount(cities.size);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ── Suppression de compte via Edge Function ───────────────────────────────
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        Alert.alert('Session expirée', 'Veuillez vous reconnecter.');
        return;
      }
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-user-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reason: deleteReason.trim() || null }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Erreur de suppression');
      setShowDeleteModal(false);
      await supabase.auth.signOut();
      Alert.alert(
        'Compte supprimé',
        'Votre compte et toutes vos données ont été supprimés définitivement. Merci d\'avoir utilisé KonGO.',
        [{ text: 'OK' }]
      );
    } catch (err: any) {
      Alert.alert('Erreur', err.message ?? 'Impossible de supprimer le compte.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C8E63C" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {session ? (
          <>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {session.user?.user_metadata?.full_name?.slice(0, 2).toUpperCase() || 'KG'}
                  </Text>
                </View>
                <View style={styles.avatarOnline} />
              </View>
              <Text style={styles.profileName}>{session.user?.user_metadata?.full_name || 'Utilisateur KonGO'}</Text>
              <Text style={styles.profileEmail}>{session.user?.email}</Text>
              <View style={styles.profileBadge}>
                <Text style={styles.profileBadgeText}>⚡ Voyageur Régulier</Text>
              </View>

              <TouchableOpacity 
                style={styles.editProfileBtn} 
                onPress={() => setShowEditProfileModal(true)}
                activeOpacity={0.8}
              >
                <Edit3 size={14} color="#0F172A" style={{ marginRight: 6 }} />
                <Text style={styles.editProfileBtnText}>Modifier mon profil</Text>
              </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{bookingCount}</Text>
                <Text style={styles.statLabel}>Voyages</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{cityCount}</Text>
                <Text style={styles.statLabel}>Villes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{bookingCount > 0 ? '⭐' : '—'}</Text>
                <Text style={styles.statLabel}>Fidélité</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.authPrompt}>
            <View style={styles.authPromptIconBox}>
              <UserIcon size={32} color="#9EBA15" />
            </View>
            <Text style={styles.authPromptTitle}>Votre voyage commence ici</Text>
            <Text style={styles.authPromptSub}>Connectez-vous pour gérer vos billets et profiter d'une expérience personnalisée sur KonGO.</Text>
            <TouchableOpacity 
              style={styles.loginBtnPrimary} 
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginBtnPrimaryText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.registerBtnSecondary} 
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.registerBtnSecondaryText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Sections */}
        {MENU_ITEMS.map((section) => (
          <View key={section.section} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.section}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <View key={item.label}>
                    <TouchableOpacity 
                      style={styles.menuItem} 
                      activeOpacity={item.toggle ? 1 : 0.7}
                      onPress={() => {
                        console.log('Menu item pressed:', item.label);
                        if (item.label === 'Mes voyages') {
                          if (!session) {
                            console.log('No session, navigating to Login');
                            navigation.navigate('Login');
                          } else {
                            console.log('Session found, navigating to MyTickets');
                            navigation.navigate('MyTickets');
                          }
                        } else if (item.label === 'Notifications') {
                          setShowNotificationsModal(true);
                          fetchPublishedNotifications();
                        }
                      }}
                    >
                      <View style={[styles.menuIconBox, { backgroundColor: (item.color as string) + '15' }]}>
                        <Icon size={18} color={item.color as string} />
                      </View>
                      <Text style={styles.menuItemLabel}>{item.label}</Text>
                      <View style={styles.menuItemRight}>
                        {item.label === 'Mes voyages' && bookingCount > 0 && session && (
                          <View style={styles.badge}><Text style={styles.badgeText}>{bookingCount}</Text></View>
                        )}
                        {item.label !== 'Mes voyages' && item.badge && session && (
                          <View style={styles.badge}><Text style={styles.badgeText}>{item.badge}</Text></View>
                        )}
                        {item.value && (
                          <Text style={styles.menuItemValue}>{item.value}</Text>
                        )}
                        {item.toggle ? (
                          <Switch
                            value={item.label === 'Notifications' ? notif : false}
                            onValueChange={item.label === 'Notifications' ? setNotif : undefined}
                            trackColor={{ false: '#EEE', true: '#C8E63C' }}
                            thumbColor="#FFFFFF"
                          />
                        ) : !item.value && (
                          <ChevronRight size={18} color="#CCC" />
                        )}
                      </View>
                    </TouchableOpacity>
                    {idx < section.items.length - 1 && <View style={styles.menuDivider} />}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {session && (
          <TouchableOpacity 
            style={styles.logoutBtn} 
            activeOpacity={0.8}
            onPress={handleLogout}
          >
            <LogOut size={18} color="#FF4444" />
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        )}

        {/* Bouton Supprimer le compte */}
        {session && (
          <TouchableOpacity
            style={styles.deleteAccountBtn}
            activeOpacity={0.8}
            onPress={() => { setDeleteReason(''); setShowDeleteModal(true); }}
          >
            <Trash2 size={16} color="#CC0000" />
            <Text style={styles.deleteAccountText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>KonGO Mobile v1.0.0</Text>
      </ScrollView>

      {/* ── Modal Suppression de compte ── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => !isDeletingAccount && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* En-tête */}
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <AlertTriangle size={24} color="#CC0000" />
              </View>
              <Text style={styles.modalTitle}>Supprimer mon compte</Text>
            </View>

            <View style={styles.warningBox}>
              <Text style={styles.warningTitle}>Ce qui sera supprimé définitivement :</Text>
              {['Votre profil et informations', 'Votre historique de réservations', 'Vos avis sur les agences', 'Vos points de fidélité'].map((item) => (
                <Text key={item} style={styles.warningItem}>• {item}</Text>
              ))}
            </View>

            <Text style={styles.inputLabel}>Raison (optionnel)</Text>
            <TextInput
              style={styles.textArea}
              value={deleteReason}
              onChangeText={setDeleteReason}
              placeholder="Pourquoi souhaitez-vous supprimer votre compte ?"
              placeholderTextColor="#AAA"
              multiline
              numberOfLines={3}
              editable={!isDeletingAccount}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalDeleteBtn, isDeletingAccount && { opacity: 0.6 }]}
                onPress={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalDeleteText}>Supprimer</Text>
                )}
              </TouchableOpacity>
            </View>
        </View>
      </Modal>

      {/* ── Modal Édition du Profil ── */}
      <Modal
        visible={showEditProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => !savingProfile && setShowEditProfileModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.editProfileCard}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>Modifier mon profil</Text>
                <TouchableOpacity 
                  onPress={() => setShowEditProfileModal(false)}
                  disabled={savingProfile}
                  style={styles.closeIconBtn}
                >
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
                {/* Nom complet */}
                <Text style={styles.formFieldLabel}>Nom complet</Text>
                <TextInput
                  style={styles.formTextInput}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Votre nom et prénom"
                  placeholderTextColor="#94A3B8"
                />

                {/* Pays */}
                <Text style={styles.formFieldLabel}>Pays de résidence</Text>
                <TouchableOpacity 
                  style={styles.selectPickerBtn}
                  onPress={() => setShowCountryPickerModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>{editCountry.flag_emoji}</Text>
                  <Text style={styles.selectPickerValue}>{editCountry.name}</Text>
                  <Text style={styles.selectPickerCode}>{editCountry.code}</Text>
                  <ChevronDown size={16} color="#64748B" />
                </TouchableOpacity>

                {/* Ville (filtrée selon le pays) */}
                <Text style={styles.formFieldLabel}>Ville de résidence</Text>
                <TouchableOpacity 
                  style={styles.selectPickerBtn}
                  onPress={() => setShowCityPickerModal(true)}
                  activeOpacity={0.7}
                >
                  <MapPin size={16} color="#7A960C" style={{ marginRight: 8 }} />
                  <Text style={[styles.selectPickerValue, !editCity && { color: '#94A3B8' }]}>
                    {editCity || 'Sélectionner votre ville'}
                  </Text>
                  <ChevronDown size={16} color="#64748B" />
                </TouchableOpacity>

                {/* Numéro de Téléphone avec indicatif séparé */}
                <PhoneInput
                  label="Numéro de téléphone"
                  phoneCode={editPhoneCode}
                  onPhoneCodeChange={(code, country) => {
                    setEditPhoneCode(code);
                    if (country) setEditCountry(country);
                  }}
                  phoneNumber={editPhoneNumber}
                  onPhoneNumberChange={setEditPhoneNumber}
                  placeholder="812 345 678"
                />
              </ScrollView>

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowEditProfileModal(false)}
                  disabled={savingProfile}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveProfileBtn, savingProfile && { opacity: 0.6 }]}
                  onPress={handleSaveProfile}
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <ActivityIndicator color="#0F172A" size="small" />
                  ) : (
                    <Text style={styles.saveProfileText}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Sub-modal Choix de Pays ── */}
      <Modal visible={showCountryPickerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.editProfileCard, { maxHeight: '60%' }]}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Sélectionner un Pays</Text>
              <TouchableOpacity onPress={() => setShowCountryPickerModal(false)} style={styles.closeIconBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countries}
              keyExtractor={item => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryItemRow, editCountry.code === item.code && styles.countryItemSelectedRow]}
                  onPress={() => {
                    setEditCountry(item);
                    setEditPhoneCode(item.phone_code);
                    setEditCity('');
                    setShowCountryPickerModal(false);
                  }}
                >
                  <Text style={{ fontSize: 22, marginRight: 10 }}>{item.flag_emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: '#64748B' }}>Indicatif: {item.phone_code}</Text>
                  </View>
                  {editCountry.code === item.code && <Check size={18} color="#7A960C" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* ── Sub-modal Choix de Ville ── */}
      <Modal visible={showCityPickerModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.editProfileCard, { maxHeight: '60%' }]}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Villes ({editCountry.name})</Text>
              <TouchableOpacity onPress={() => setShowCityPickerModal(false)} style={styles.closeIconBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
            {loadingCities ? (
              <ActivityIndicator color="#9EBA15" size="large" style={{ padding: 20 }} />
            ) : (
              <FlatList
                data={availableCities}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.countryItemRow, editCity === item && styles.countryItemSelectedRow]}
                    onPress={() => {
                      setEditCity(item);
                      setShowCityPickerModal(false);
                    }}
                  >
                    <MapPin size={16} color="#7A960C" style={{ marginRight: 10 }} />
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{item}</Text>
                    {editCity === item && <Check size={18} color="#7A960C" />}
                  </TouchableOpacity>
                )}
              />
            )}
      {/* ── Modal Liste des Notifications ── */}
      <Modal
        visible={showNotificationsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNotificationsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editProfileCard, { maxHeight: '82%' }]}>
            <View style={styles.editModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F2F9E8', alignItems: 'center', justifyContent: 'center' }}>
                  <Bell size={20} color="#7A960C" />
                </View>
                <View>
                  <Text style={styles.editModalTitle}>Notifications & Alertes</Text>
                  <Text style={{ fontSize: 12, color: '#64748B' }}>Messages et communications des agences</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowNotificationsModal(false)} style={styles.closeIconBtn}>
                <X size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {loadingNotifications ? (
              <ActivityIndicator color="#9EBA15" size="large" style={{ padding: 30 }} />
            ) : (
              <FlatList
                data={userNotifications}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Bell size={40} color="#CBD5E1" style={{ marginBottom: 10 }} />
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>Aucune notification</Text>
                    <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 }}>
                      Vous n'avez pas encore reçu de message des agences.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const pubDate = new Date(item.published_at);
                  const formattedDate = isNaN(pubDate.getTime())
                    ? item.published_at
                    : pubDate.toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      });

                  return (
                    <View style={styles.notifCardItem}>
                      <View style={styles.notifCardHeader}>
                        <View style={styles.agencyBadgePill}>
                          <Text style={styles.agencyBadgePillText}>🏢 {item.agency_name || 'KonGO Platform'}</Text>
                        </View>
                        <Text style={styles.notifDateText}>{formattedDate}</Text>
                      </View>
                      
                      <Text style={styles.notifTitleText}>{item.title}</Text>
                      <Text style={styles.notifContentText}>{item.content}</Text>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  profileHeader: { alignItems: 'center', paddingTop: 20, paddingBottom: 24, paddingHorizontal: 24 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F9FCC5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#C8E63C' },
  avatarText: { fontSize: 32, fontWeight: '900', color: '#9EBA15' },
  avatarOnline: { position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#00E676', borderWidth: 3, borderColor: '#FFFFFF' },
  profileName: { fontSize: 24, color: '#0A0A0A', fontWeight: '900', marginBottom: 4 },
  profileEmail: { fontSize: 14, color: '#666', fontWeight: '500', marginBottom: 16 },
  profileBadge: { backgroundColor: '#F9FCC5', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 20, borderWidth: 1, borderColor: '#E6EDA3' },
  profileBadgeText: { fontSize: 12, color: '#6A7D0A', fontWeight: '700' },
  statsRow: { flexDirection: 'row', backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#EEE', marginBottom: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  statCard: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, color: '#0A0A0A', fontWeight: '900' },
  statLabel: { fontSize: 12, color: '#666', fontWeight: '600', marginTop: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#EEE' },
  authPrompt: {
    backgroundColor: '#F9F9F9',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
  },
  authPromptIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F9FCC5', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  authPromptTitle: { fontSize: 20, color: '#0A0A0A', fontWeight: '900', marginBottom: 8, textAlign: 'center' },
  authPromptSub: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  loginBtnPrimary: { backgroundColor: '#C8E63C', width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 12, elevation: 2 },
  loginBtnPrimaryText: { color: '#0A0A0A', fontSize: 16, fontWeight: '900' },
  registerBtnSecondary: { backgroundColor: '#FFFFFF', width: '100%', paddingVertical: 18, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  registerBtnSecondaryText: { color: '#0A0A0A', fontSize: 16, fontWeight: '700' },
  menuSection: { marginTop: 32, paddingHorizontal: 20 },
  menuSectionTitle: { fontSize: 12, color: '#AAA', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, marginLeft: 4 },
  menuCard: { backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20 },
  menuIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  menuItemLabel: { flex: 1, fontSize: 15, color: '#0A0A0A', fontWeight: '700' },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuItemValue: { fontSize: 14, color: '#999', fontWeight: '600' },
  badge: { backgroundColor: '#C8E63C', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, color: '#0A0A0A', fontWeight: '900' },
  menuDivider: { height: 1, backgroundColor: '#F5F5F5', marginLeft: 68 },
  logoutBtn: { marginHorizontal: 20, marginTop: 40, flexDirection: 'row', backgroundColor: '#FFF5F5', borderRadius: 20, padding: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFE0E0', gap: 10 },
  logoutText: { fontSize: 16, color: '#FF4444', fontWeight: '800' },
  deleteAccountBtn: { marginHorizontal: 20, marginTop: 12, flexDirection: 'row', backgroundColor: '#FFF0F0', borderRadius: 20, padding: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFD0D0', gap: 8 },
  deleteAccountText: { fontSize: 14, color: '#CC0000', fontWeight: '700' },
  version: { textAlign: 'center', color: '#CCC', fontSize: 12, fontWeight: '600', marginTop: 32, marginBottom: 10 },
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 28, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  modalIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0A0A0A', flex: 1 },
  warningBox: { backgroundColor: '#FFF5F5', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FFD0D0' },
  warningTitle: { fontSize: 13, fontWeight: '800', color: '#CC0000', marginBottom: 8 },
  warningItem: { fontSize: 13, color: '#991B1B', marginBottom: 4 },
  inputLabel: { fontSize: 11, fontWeight: '700', color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  textArea: { backgroundColor: '#F9F9F9', borderWidth: 1, borderColor: '#DDD', borderRadius: 16, padding: 12, fontSize: 14, color: '#333', marginBottom: 20, minHeight: 80, textAlignVertical: 'top' },
  confirmInstruction: { fontSize: 14, color: '#444', marginBottom: 16, lineHeight: 22 },
  confirmInput: { borderWidth: 2, borderColor: '#FFB0B0', borderRadius: 16, padding: 14, fontSize: 16, fontWeight: '900', textAlign: 'center', letterSpacing: 4, color: '#CC0000', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 16, padding: 16, alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '700', color: '#666' },
  modalNextBtn: { flex: 1, backgroundColor: '#CC0000', borderRadius: 16, padding: 16, alignItems: 'center' },
  modalNextText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  modalDeleteBtn: { flex: 1, backgroundColor: '#CC0000', borderRadius: 16, padding: 16, alignItems: 'center' },
  modalDeleteText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  // Edit Profile Styles
  editProfileBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginTop: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  editProfileBtnText: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  editProfileCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === 'ios' ? 34 : 24, width: '100%' },
  editModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  editModalTitle: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  closeIconBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  formFieldLabel: { fontSize: 11, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 },
  formTextInput: { backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 14 },
  selectPickerBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
  selectPickerValue: { flex: 1, fontSize: 15, fontWeight: '700', color: '#0F172A' },
  selectPickerCode: { fontSize: 12, fontWeight: '800', color: '#7A960C', backgroundColor: '#F2F9E8', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 },
  saveProfileBtn: { flex: 1, backgroundColor: '#C8E63C', borderRadius: 16, padding: 16, alignItems: 'center' },
  saveProfileText: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  countryItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12 },
  countryItemSelectedRow: { backgroundColor: '#F2F9E8' },
  // Notification Styles
  notifCardItem: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  notifCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  agencyBadgePill: { backgroundColor: '#0F172A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  agencyBadgePillText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  notifDateText: { fontSize: 11, fontWeight: '600', color: '#64748B' },
  notifTitleText: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginBottom: 4 },
  notifContentText: { fontSize: 13, color: '#334155', lineHeight: 20 },
});
