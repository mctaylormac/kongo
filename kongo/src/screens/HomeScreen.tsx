// [Agent Dev Mobile] - Action: Écran d'Accueil (Home) - KonGO User App
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  Animated,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const AGENCIES = [
  { id: 1, name: 'Agence A', logo: require('../../assets/logo1.png'), rating: 4.8, trips: 120 },
  { id: 2, name: 'Agence B', logo: require('../../assets/logo2.png'), rating: 4.6, trips: 85 },
  { id: 3, name: 'Agence C', logo: require('../../assets/logo3.png'), rating: 4.9, trips: 210 },
];

const POPULAR_ROUTES = [
  { from: 'Kinshasa', to: 'Lubumbashi', price: '150.000 CDF', duration: '30h' },
  { from: 'Kinshasa', to: 'Mbuji-Mayi', price: '80.000 CDF', duration: '18h' },
  { from: 'Goma', to: 'Bukavu', price: '25.000 CDF', duration: '3h' },
];

import { supabase } from '../lib/supabase';

// ─── Slides promotionnels KINTU ───
const KINTU_SLIDES = [
  {
    id: 'hotel',
    title: 'Hôtels de luxe',
    subtitle: 'Réservez les meilleurs hôtels du Congo',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80',
    gradient: '#1a1a2e',
  },
  {
    id: 'resto',
    title: 'Restaurants d\'exception',
    subtitle: 'Découvrez la gastronomie locale et internationale',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80',
    gradient: '#16213e',
  },
  {
    id: 'lounge',
    title: 'Lounges & Bars',
    subtitle: 'Les spots branchés pour vos soirées',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=600&q=80',
    gradient: '#0f3460',
  },
  {
    id: 'hospital',
    title: 'Centres de santé',
    subtitle: 'Trouvez les hôpitaux et cliniques près de vous',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80',
    gradient: '#1b4332',
  },
  {
    id: 'more',
    title: 'Et tant d\'autres...',
    subtitle: 'Hôtels, restos, sites, loisirs \u2014 tout est sur KINTU',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&q=80',
    gradient: '#2d1b69',
  },
];

export default function HomeScreen({ navigation }: any) {
  const [agencies, setAgencies] = React.useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideInterval = useRef<any>(null);

  // ─── Auto-rotation des slides KINTU ───
  useEffect(() => {
    slideInterval.current = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setActiveSlide(prev => (prev + 1) % KINTU_SLIDES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);

    return () => {
      if (slideInterval.current) clearInterval(slideInterval.current);
    };
  }, [fadeAnim]);

  const goToSlide = useCallback((index: number) => {
    if (slideInterval.current) clearInterval(slideInterval.current);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setActiveSlide(index);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    // Restart interval
    slideInterval.current = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setActiveSlide(prev => (prev + 1) % KINTU_SLIDES.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);
  }, [fadeAnim]);

  React.useEffect(() => {
    async function fetchAgencies() {
      // Try trusted agencies first, fall back to all agencies
      const { data: trusted } = await supabase
        .from('agencies')
        .select('id, name, logo_url, rating')
        .eq('is_trusted', true)
        .limit(5);

      if (trusted && trusted.length > 0) {
        setAgencies(trusted);
      } else {
        // Fallback: show any active agencies
        const { data: all } = await supabase
          .from('agencies')
          .select('id, name, logo_url, rating')
          .limit(5);
        if (all) setAgencies(all);
      }
    }
    fetchAgencies();
  }, []);

  const POPULAR_ROUTES = [
    { from: 'Kinshasa', to: 'Lubumbashi', price: '150.000 CDF', duration: '30h' },
    { from: 'Kinshasa', to: 'Mbuji-Mayi', price: '80.000 CDF', duration: '18h' },
    { from: 'Goma', to: 'Bukavu', price: '25.000 CDF', duration: '3h' },
  ];

  const currentSlide = KINTU_SLIDES[activeSlide];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bienvenue 👋</Text>
            <Text style={styles.tagline}>Où allez-vous aujourd'hui ?</Text>
          </View>
          <Image source={require('../../assets/ICONE.png')} style={styles.headerLogo} resizeMode="contain" />
        </View>

        {/* Hero Search CTA */}
        <TouchableOpacity style={styles.heroCTA} onPress={() => navigation.navigate('Search')} activeOpacity={0.85}>
          <View style={styles.heroCTAInner}>
            <Text style={styles.heroCTALabel}>🔍 Rechercher un trajet</Text>
            <Text style={styles.heroCTASubLabel}>De • Vers • Date • Passagers</Text>
          </View>
          <View style={styles.heroCTAArrow}>
            <Text style={styles.heroCTAArrowText}>→</Text>
          </View>
        </TouchableOpacity>

        {/* Trajets populaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trajets Populaires</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 24 }}>
            {POPULAR_ROUTES.map((route, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.routeCard}
                onPress={() => navigation.navigate('Search')}
                activeOpacity={0.8}
              >
                <View style={styles.routeCardHeader}>
                  <Text style={styles.routeFrom}>{route.from}</Text>
                  <Text style={styles.routeArrow}>→</Text>
                  <Text style={styles.routeTo}>{route.to}</Text>
                </View>
                <View style={styles.routeCardFooter}>
                  <Text style={styles.routePrice}>{route.price}</Text>
                  <Text style={styles.routeDuration}>{route.duration}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Agences de confiance */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Agences de Confiance</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Agencies')}>
              <Text style={styles.seeAll}>Voir tout</Text>
            </TouchableOpacity>
          </View>
          {agencies.length > 0 ? agencies.map((agency) => (
            <TouchableOpacity key={agency.id} style={styles.agencyRow} activeOpacity={0.8} onPress={() => navigation.navigate('Agencies')}>
              <View style={styles.agencyLogoBox}>
                <Image 
                  source={agency.logo_url ? { uri: agency.logo_url } : require('../../assets/logo.png')} 
                  style={styles.agencyLogo} 
                  resizeMode="contain" 
                />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.agencyName}>{agency.name}</Text>
                <Text style={styles.agencyMeta}>⭐ {agency.rating || '0.0'}  ·  En ligne</Text>
              </View>
              <Text style={styles.agencyChevron}>›</Text>
            </TouchableOpacity>
          )) : (
            <View style={{ paddingVertical: 20, paddingRight: 24 }}>
                <Text style={{ color: '#AAA', fontSize: 13, fontWeight: '500', textAlign: 'center' }}>
                   Aucune agence de confiance sélectionnée par l'administrateur.
                </Text>
            </View>
          )}
        </View>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoBannerContent}>
            <Text style={styles.promoTitle}>🎫 Première réservation</Text>
            <Text style={styles.promoSubtitle}>Profitez d'une réduction sur votre 1ère réservation via l'app KonGO.</Text>
            <TouchableOpacity style={styles.promoBtn} onPress={() => navigation.navigate('Search')}>
              <Text style={styles.promoBtnText}>Réserver maintenant</Text>
            </TouchableOpacity>
          </View>
          <Image source={require('../../assets/logo.png')} style={styles.promoBannerLogo} resizeMode="contain" />
        </View>

        {/* ════ Carousel KINTU Services ════ */}
        <View style={styles.kintuSection}>
          <View style={styles.kintuHeaderRow}>
            <Text style={styles.kintuSectionTitle}>Découvrez aussi sur KINTU</Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://kintou.app')}>
              <Text style={styles.kintuLink}>Voir KINTU ›</Text>
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.kintuCard, { opacity: fadeAnim }]}>
            <Image
              source={{ uri: currentSlide.image }}
              style={styles.kintuCardImage}
              resizeMode="cover"
            />
            <View style={[styles.kintuCardOverlay, { backgroundColor: currentSlide.gradient }]} />
            <View style={styles.kintuCardContent}>
              <View style={styles.kintuBadge}>
                <Text style={styles.kintuBadgeText}>KINTU</Text>
              </View>
              <Text style={styles.kintuCardTitle}>{currentSlide.title}</Text>
              <Text style={styles.kintuCardSubtitle}>{currentSlide.subtitle}</Text>
            </View>
          </Animated.View>

          {/* Indicateurs (dots) */}
          <View style={styles.kintuDots}>
            {KINTU_SLIDES.map((slide, idx) => (
              <TouchableOpacity
                key={slide.id}
                onPress={() => goToSlide(idx)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.kintuDot,
                    idx === activeSlide && styles.kintuDotActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 13, color: '#666', fontWeight: '600', letterSpacing: 0.5 },
  tagline: { fontSize: 22, color: '#0A0A0A', fontWeight: '900', marginTop: 2 },
  headerLogo: { width: 42, height: 42 },
  heroCTA: {
    marginHorizontal: 24, marginTop: 16, marginBottom: 8,
    backgroundColor: '#C8E63C', borderRadius: 18, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 4, shadowColor: '#9EBA15', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6
  },
  heroCTAInner: { flex: 1 },
  heroCTALabel: { fontSize: 16, fontWeight: '900', color: '#0A0A0A' },
  heroCTASubLabel: { fontSize: 11, color: '#3a4a00', marginTop: 3, fontWeight: '600' },
  heroCTAArrow: { width: 36, height: 36, backgroundColor: '#0A0A0A', borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroCTAArrowText: { color: '#C8E63C', fontSize: 18, fontWeight: '800' },
  section: { marginTop: 28, paddingLeft: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24, marginBottom: 14 },
  sectionTitle: { fontSize: 18, color: '#0A0A0A', fontWeight: '900', letterSpacing: 0.3 },
  seeAll: { fontSize: 12, color: '#9EBA15', fontWeight: '800' },
  routeCard: {
    backgroundColor: '#F9F9F9', borderRadius: 16, padding: 16, width: width * 0.55,
    borderWidth: 1, borderColor: '#EEE',
  },
  routeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeFrom: { fontSize: 13, color: '#0A0A0A', fontWeight: '800', flex: 1 },
  routeArrow: { fontSize: 13, color: '#9EBA15', fontWeight: '800' },
  routeTo: { fontSize: 13, color: '#9EBA15', fontWeight: '800', flex: 1, textAlign: 'right' },
  routeCardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  routePrice: { fontSize: 15, color: '#0A0A0A', fontWeight: '900' },
  routeDuration: { fontSize: 11, color: '#888', fontWeight: '600' },
  agencyRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginRight: 24, marginBottom: 10,
    borderWidth: 1, borderColor: '#EEE', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3
  },
  agencyLogoBox: { width: 52, height: 52, backgroundColor: '#F9F9F9', borderRadius: 12, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#EEE' },
  agencyLogo: { width: 44, height: 44 },
  agencyName: { fontSize: 15, color: '#0A0A0A', fontWeight: '800' },
  agencyMeta: { fontSize: 12, color: '#666', marginTop: 3, fontWeight: '600' },
  agencyChevron: { fontSize: 22, color: '#9EBA15', fontWeight: '300' },
  promoBanner: {
    marginHorizontal: 24, marginTop: 28, backgroundColor: '#F5FCC5',
    borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E6EDA3',
  },
  promoBannerContent: { flex: 1 },
  promoTitle: { fontSize: 16, color: '#6A7D0A', fontWeight: '900', marginBottom: 6 },
  promoSubtitle: { fontSize: 12, color: '#666', lineHeight: 17, marginBottom: 14, fontWeight: '500' },
  promoBtn: { backgroundColor: '#0A0A0A', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  promoBtnText: { fontSize: 12, color: '#C8E63C', fontWeight: '900' },
  promoBannerLogo: { width: 64, height: 64, marginLeft: 12, opacity: 0.1, tintColor: '#000' },

  // ─── KINTU Carousel ───
  kintuSection: {
    marginHorizontal: 24,
    marginTop: 28,
    marginBottom: 8,
  },
  kintuHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  kintuSectionTitle: {
    fontSize: 18,
    color: '#0A0A0A',
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  kintuLink: {
    fontSize: 12,
    color: '#9EBA15',
    fontWeight: '800',
  },
  kintuCard: {
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  kintuCardImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  kintuCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  kintuCardContent: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 20,
  },
  kintuBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#C8E63C',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  kintuBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0A0A0F',
    letterSpacing: 1,
  },
  kintuCardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  kintuCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    lineHeight: 18,
  },
  kintuDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  kintuDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDD',
  },
  kintuDotActive: {
    width: 24,
    backgroundColor: '#9EBA15',
    borderRadius: 4,
  },
});
