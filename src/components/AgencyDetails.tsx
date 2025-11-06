import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Star, Shield, Phone, Globe, Mail, MapPin, Calendar, 
  Users, Award, CheckCircle, Clock, Navigation, 
  MessageCircle, Zap, Wifi, Snowflake,
  Coffee, Music, ExternalLink, ChevronLeft, ChevronRight,
  Share2, Bookmark, Eye, Activity, TrendingUp, Heart,
  CreditCard, Bus, Gauge, Trophy, Target, BadgeCheck,
  Route, FileText, AlertCircle, Camera, Play, Pause,
  ZoomIn, Maximize2, Grid3X3, Filter, Tag, Image as ImageIcon
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';

interface Agency {
  id: string;
  name: string;
  tier: string;
  rating: number;
  totalTrips: number;
  founded: number;
  headquarters: string;
  operatingRoutes: string[];
  phone: string;
  email: string;
  website: string;
  logo: string;
  description: string;
  amenities: string[];
  safetyRating: number;
  onTimePercentage: number;
  fleetSize: number;
  certifications: string[];
  isActive: boolean;
}

interface AgencyDetailsProps {
  agency: Agency | null;
  isOpen: boolean;
  onClose: () => void;
}

// Données enrichies pour les détails de l'agence avec plus de réalisme
const getEnrichedAgencyData = (agency: Agency) => {
  const baseData = {
    ...agency,
    // Photos haute qualité de l'agence avec métadonnées enrichies
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1570125909517-53cb21c89ff2?w=1200&auto=format&fit=crop&q=80',
        title: 'Flotte moderne de bus',
        description: 'Notre dernière génération de véhicules équipés des dernières technologies',
        category: 'fleet',
        featured: true
      },
      {
        url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200&auto=format&fit=crop&q=80',
        title: 'Intérieur premium',
        description: 'Sièges confortables avec climatisation individuelle et WiFi',
        category: 'interior',
        featured: true
      },
      {
        url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&auto=format&fit=crop&q=80',
        title: 'Gare routière moderne',
        description: 'Installations modernes avec salle d\'attente climatisée',
        category: 'station',
        featured: false
      },
      {
        url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&auto=format&fit=crop&q=80',
        title: 'Équipe professionnelle',
        description: 'Personnel qualifié et formations régulières en sécurité',
        category: 'staff',
        featured: false
      },
      {
        url: 'https://images.unsplash.com/photo-1465447142348-e9952c393450?w=1200&auto=format&fit=crop&q=80',
        title: 'Bagages sécurisés',
        description: 'Système de stockage sécurisé avec étiquetage individuel',
        category: 'service',
        featured: false
      },
      {
        url: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&auto=format&fit=crop&q=80',
        title: 'Voyage panoramique',
        description: 'Découvrez les paysages magnifiques du Congo',
        category: 'scenery',
        featured: true
      },
      {
        url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=1200&auto=format&fit=crop&q=80',
        title: 'Centre de maintenance',
        description: 'Atelier technique pour maintenance préventive quotidienne',
        category: 'maintenance',
        featured: false
      },
      {
        url: 'https://images.unsplash.com/photo-1555399784-17946024ee05?w=1200&auto=format&fit=crop&q=80',
        title: 'Embarquement VIP',
        description: 'Service premium avec embarquement prioritaire',
        category: 'vip',
        featured: true
      }
    ],
    
    // Horaires d'ouverture détaillés
    businessHours: {
      'Lundi - Vendredi': '5:30 - 21:00',
      'Samedi': '6:00 - 20:00',
      'Dimanche': '7:00 - 19:00',
      'Jours fériés': '8:00 - 18:00'
    },
    
    // Avis clients récents avec plus de détails
    recentReviews: [
      {
        id: 1,
        name: 'Marie Kalala',
        rating: 5,
        comment: 'Service absolument exceptionnel ! Ponctualité irréprochable, confort optimal et personnel très professionnel. Les bus sont modernes avec Wi-Fi gratuit et climatisation parfaite. Voyage Kinshasa-Lubumbashi sans le moindre souci.',
        date: '2024-01-15',
        verified: true,
        route: 'Kinshasa → Lubumbashi',
        tripType: 'VIP'
      },
      {
        id: 2,
        name: 'Jean-Baptiste Mukendi',
        rating: 4,
        comment: 'Très satisfait de mon voyage. Personnel accueillant et serviable. Seul petit bémol : départ avec 20 minutes de retard, mais arrivée à l\'heure prévue grâce à la conduite professionnelle. Recommande sans hésiter.',
        date: '2024-01-12',
        verified: true,
        route: 'Goma → Kinshasa',
        tripType: 'Standard'
      },
      {
        id: 3,
        name: 'Claudine Tshisekedi',
        rating: 5,
        comment: 'Transport premium comme promis ! Sièges inclinables, collations incluses, et même un système de divertissement à bord. Le GPS tracking permet aux familles de suivre le voyage en temps réel. Innovation remarquable !',
        date: '2024-01-10',
        verified: true,
        route: 'Lubumbashi → Bukavu',
        tripType: 'Premium'
      },
      {
        id: 4,
        name: 'Patrick Mbuyi',
        rating: 4,
        comment: 'Bonne expérience globale. Prix compétitifs et service de qualité. Les véhicules sont bien entretenus et le trajet s\'est déroulé sans problème. Service client réactif via WhatsApp.',
        date: '2024-01-08',
        verified: false,
        route: 'Kananga → Mbuji-Mayi',
        tripType: 'Standard'
      }
    ],
    
    // Statistiques détaillées et métriques de performance
    performanceMetrics: {
      monthlyTrips: Math.max(45, Math.floor(agency.totalTrips / 12)),
      avgResponseTime: agency.tier === 'platinum' ? '8 min' : agency.tier === 'gold' ? '12 min' : '18 min',
      customerSatisfaction: Math.min(98, agency.rating * 20),
      repeatCustomers: agency.tier === 'platinum' ? 87 : agency.tier === 'gold' ? 76 : 65,
      carbonFootprintReduction: agency.tier === 'platinum' ? 18 : 12,
      digitalPaymentRate: agency.tier === 'platinum' ? 94 : 78,
      avgDelay: agency.onTimePercentage > 90 ? '8 min' : '15 min',
      modernFleetPercentage: agency.tier === 'platinum' ? 95 : agency.tier === 'gold' ? 85 : 70
    },
    
    // Services et équipements avancés
    premiumServices: [
      { 
        icon: Wifi, 
        name: 'Wi-Fi Haut Débit', 
        available: agency.amenities.includes('Wi-Fi'),
        description: 'Connexion internet gratuite durant tout le trajet'
      },
      { 
        icon: Snowflake, 
        name: 'Climatisation Premium', 
        available: agency.amenities.includes('Climatisation'),
        description: 'Système de climatisation individuel pour chaque siège'
      },
      { 
        icon: Coffee, 
        name: 'Restauration à Bord', 
        available: agency.amenities.includes('Collation'),
        description: 'Collations et boissons incluses selon la durée du voyage'
      },
      { 
        icon: Music, 
        name: 'Divertissement', 
        available: agency.amenities.includes('Musique'),
        description: 'Écrans individuels avec films, musique et jeux'
      },
      { 
        icon: Shield, 
        name: 'Assurance Tous Risques', 
        available: agency.amenities.includes('Assurance voyage'),
        description: 'Couverture complète passagers et bagages'
      },
      { 
        icon: Navigation, 
        name: 'Suivi GPS Temps Réel', 
        available: agency.amenities.includes('GPS tracking'),
        description: 'Localisation précise et partage avec les proches'
      },
      { 
        icon: CreditCard, 
        name: 'Paiement Mobile', 
        available: true,
        description: 'Mobile Money, cartes bancaires et paiement digital'
      },
      { 
        icon: BadgeCheck, 
        name: 'Personnel Certifié', 
        available: agency.tier !== 'bronze',
        description: 'Chauffeurs professionnels avec formation continue'
      }
    ],
    
    // Routes populaires avec détails
    popularRoutes: agency.operatingRoutes.slice(0, 6).map(route => {
      const [from, to] = route.split('-');
      return {
        id: route.replace('-', '_'),
        from: from?.trim() || 'N/A',
        to: to?.trim() || 'N/A',
        duration: Math.floor(Math.random() * 12) + 8 + 'h',
        frequency: Math.floor(Math.random() * 3) + 1,
        price: (Math.floor(Math.random() * 100) + 80) * 1000,
        popularity: Math.floor(Math.random() * 40) + 60
      };
    }),
    
    // Certifications et accréditations
    certifications: [
      ...agency.certifications,
      ...(agency.tier === 'platinum' ? ['ISO 9001:2015', 'Transport Excellence Award 2023'] : []),
      ...(agency.tier === 'gold' ? ['Service Quality Certification'] : [])
    ],
    
    // Informations de contact étendues
    contactInfo: {
      ...agency,
      address: `Avenue de la Révolution, Quartier Commercial, ${agency.headquarters}, République Démocratique du Congo`,
      coordinates: { lat: -4.4419, lng: 15.2663 },
      whatsapp: agency.phone.replace('+243', '+243 9'),
      socialMedia: {
        facebook: `facebook.com/${agency.name.toLowerCase().replace(/\s+/g, '')}`,
        twitter: `@${agency.name.toLowerCase().replace(/\s+/g, '')}`,
        instagram: `@${agency.name.toLowerCase().replace(/\s+/g, '')}_transport`
      }
    },
    
    // Indicateurs de performance avancés
    kpiMetrics: {
      safetyScore: Math.min(100, agency.safetyRating * 20),
      environmentScore: agency.tier === 'platinum' ? 92 : agency.tier === 'gold' ? 78 : 65,
      digitalScore: agency.tier === 'platinum' ? 95 : agency.tier === 'gold' ? 82 : 68,
      serviceScore: Math.min(100, agency.rating * 20)
    }
  };
  
  return baseData;
};

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'platinum': return 'bg-kongo-black text-on-black border-kongo-black';
    case 'gold': return 'bg-kongo-lime text-on-lime border-kongo-lime';
    case 'silver': return 'bg-surface-tertiary text-secondary border-border-secondary';
    case 'bronze': return 'bg-color-warning text-inverse border-color-warning';
    default: return 'bg-surface-secondary text-tertiary border-border-primary';
  }
};

const getTierIcon = (tier: string) => {
  switch (tier) {
    case 'platinum': return '💎';
    case 'gold': return '🏆';
    case 'silver': return '🥈';
    case 'bronze': return '🥉';
    default: return '📋';
  }
};

const getTierGradient = (tier: string) => {
  switch (tier) {
    case 'platinum': return 'from-kongo-black via-kongo-black-light to-kongo-black-lighter';
    case 'gold': return 'from-kongo-lime-darker via-kongo-lime to-kongo-lime-light';
    case 'silver': return 'from-gray-600 via-gray-500 to-gray-400';
    case 'bronze': return 'from-color-warning via-color-warning-light to-yellow-300';
    default: return 'from-gray-700 via-gray-600 to-gray-500';
  }
};

const getAmenityIcon = (amenity: string) => {
  switch (amenity.toLowerCase()) {
    case 'wi-fi': return <Wifi className="w-4 h-4 text-blue-600" />;
    case 'climatisation': return <Snowflake className="w-4 h-4 text-blue-500" />;
    case 'collation': case 'repas inclus': case 'restauration': return <Coffee className="w-4 h-4 text-amber-600" />;
    case 'musique': case 'divertissement': return <Music className="w-4 h-4 text-purple-600" />;
    case 'assurance voyage': return <Shield className="w-4 h-4 text-green-600" />;
    case 'gps tracking': case 'suivi gps': return <Navigation className="w-4 h-4 text-blue-600" />;
    case 'paiement mobile': return <CreditCard className="w-4 h-4 text-green-600" />;
    default: return <CheckCircle className="w-4 h-4 text-green-600" />;
  }
};

export function AgencyDetails({ agency, isOpen, onClose }: AgencyDetailsProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGalleryView, setIsGalleryView] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPhotoCategory, setSelectedPhotoCategory] = useState<string>('all');
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (isOpen && agency) {
      // Simuler le comptage des vues avec progression réaliste
      setViewCount(prev => prev + 1);
      
      // Vérifier si l'agence est dans les favoris
      const savedBookmarks = localStorage.getItem('kongo-bookmarked-agencies');
      if (savedBookmarks) {
        const bookmarks = JSON.parse(savedBookmarks);
        setIsBookmarked(bookmarks.includes(agency.id));
      }

      // Auto-rotation des photos avec nombre correct
      const interval = setInterval(() => {
        if (!isPlaying) {
          setActivePhotoIndex(prev => (prev + 1) % 8);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isOpen, agency, isPlaying]);

  if (!agency) return null;

  const enrichedAgency = getEnrichedAgencyData(agency);

  const handleContactAction = (type: 'phone' | 'email' | 'website' | 'whatsapp') => {
    switch (type) {
      case 'phone':
        window.open(`tel:${agency.phone}`, '_self');
        break;
      case 'email':
        window.open(`mailto:${agency.email}`, '_self');
        break;
      case 'website':
        window.open(`https://${agency.website}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/${enrichedAgency.contactInfo.whatsapp.replace(/\s+/g, '')}`, '_blank');
        break;
    }
  };

  const handleBookingAction = () => {
    // Déclencher l'événement de recherche avec cette agence
    const searchEvent = new CustomEvent('agency-booking', {
      detail: { 
        agencyId: agency.id,
        agencyName: agency.name,
        routes: agency.operatingRoutes 
      }
    });
    window.dispatchEvent(searchEvent);
    onClose();
  };

  const handleBookmarkToggle = () => {
    const savedBookmarks = localStorage.getItem('kongo-bookmarked-agencies');
    let bookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : [];
    
    if (isBookmarked) {
      bookmarks = bookmarks.filter((id: string) => id !== agency.id);
    } else {
      bookmarks.push(agency.id);
    }
    
    localStorage.setItem('kongo-bookmarked-agencies', JSON.stringify(bookmarks));
    setIsBookmarked(!isBookmarked);
  };

  const handleShareAgency = async () => {
    const shareData = {
      title: `${agency.name} - Transport Premium RDC | KonGO`,
      text: `Découvrez ${agency.name}, agence de transport ${agency.tier} avec ${agency.rating}⭐ de satisfaction client`,
      url: `${window.location.origin}/?agency=${agency.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        navigator.clipboard.writeText(shareData.url);
      }
    } else {
      navigator.clipboard.writeText(shareData.url);
    }
  };

  const nextPhoto = () => {
    setIsPlaying(true);
    setActivePhotoIndex((prev) => 
      prev === enrichedAgency.photos.length - 1 ? 0 : prev + 1
    );
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const prevPhoto = () => {
    setIsPlaying(true);
    setActivePhotoIndex((prev) => 
      prev === 0 ? enrichedAgency.photos.length - 1 : prev - 1
    );
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const filteredPhotos = enrichedAgency.photos.filter(photo => 
    selectedPhotoCategory === 'all' || photo.category === selectedPhotoCategory
  );

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] lg:max-w-7xl max-h-[98vh] overflow-hidden p-0 bg-surface-primary border-2 border-border-primary shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle className="text-h4 text-kongo-black font-semibold">
              Détails de l'agence {agency.name}
            </DialogTitle>
            <DialogDescription className="text-body-small text-secondary">
              Informations complètes sur l'agence {agency.name} : services, performance, avis clients et réservation
            </DialogDescription>
          </DialogHeader>
          
          <div className="relative">
            {/* Header avec photos et superposition professionnelle */}
            <div className={`relative h-96 bg-gradient-to-br ${getTierGradient(agency.tier)} overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40"></div>
              
              {/* Carousel de photos amélioré */}
              <div className="relative h-full group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePhotoIndex}
                    className="relative w-full h-full"
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.7, ease: "easeInOut" }}
                  >
                    <img
                      src={enrichedAgency.photos[activePhotoIndex].url}
                      alt={enrichedAgency.photos[activePhotoIndex].title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </motion.div>
                </AnimatePresence>
                
                {/* Contrôles de navigation améliorés */}
                <Button
                  onClick={prevPhoto}
                  variant="ghost"
                  size="icon"
                  className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm border border-white/20"
                  aria-label="Photo précédente"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                
                <Button
                  onClick={nextPhoto}
                  variant="ghost"
                  size="icon"
                  className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm border border-white/20"
                  aria-label="Photo suivante"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
                
                {/* Indicateurs de photos professionnels */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {enrichedAgency.photos.map((_, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setActivePhotoIndex(index)}
                          className={`w-3 h-3 rounded-full transition-all duration-300 hover:scale-125 ${
                            index === activePhotoIndex 
                              ? 'bg-kongo-lime shadow-kongo-lime ring-2 ring-kongo-lime/50' 
                              : 'bg-white/60 hover:bg-white/80 backdrop-blur-sm'
                          }`}
                          aria-label={`Photo ${index + 1}`}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="bg-kongo-black text-on-black">
                        {enrichedAgency.photos[index].title}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>

                {/* Lecture automatique toggle et contrôles galerie */}
                <div className="absolute bottom-8 right-8 flex space-x-3">
                  {/* Vue galerie toggle */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setIsGalleryView(!isGalleryView)}
                        variant="ghost"
                        size="icon"
                        className={`backdrop-blur-sm border border-white/20 transition-all duration-300 ${
                          isGalleryView
                            ? 'bg-kongo-lime text-on-lime hover:bg-kongo-lime-hover'
                            : 'bg-black/40 hover:bg-black/60 text-white'
                        }`}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-kongo-black text-on-black">
                      {isGalleryView ? 'Vue carrousel' : 'Vue galerie'}
                    </TooltipContent>
                  </Tooltip>

                  {/* Plein écran */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setIsFullscreen(true)}
                        variant="ghost"
                        size="icon"
                        className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border border-white/20"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-kongo-black text-on-black">
                      Plein écran
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => setIsPlaying(!isPlaying)}
                        variant="ghost"
                        size="icon"
                        className="bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm border border-white/20"
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-kongo-black text-on-black">
                      {isPlaying ? 'Pause auto' : 'Lecture auto'}
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Métadonnées de la photo active */}
                <motion.div
                  className="absolute bottom-20 left-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-h6 text-white font-semibold mb-1">
                          {enrichedAgency.photos[activePhotoIndex].title}
                        </h3>
                        <p className="text-body-small text-gray-200 leading-relaxed">
                          {enrichedAgency.photos[activePhotoIndex].description}
                        </p>
                      </div>
                      <Badge
                        className={`ml-4 flex-shrink-0 ${
                          enrichedAgency.photos[activePhotoIndex].featured
                            ? 'bg-kongo-lime text-on-lime'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {enrichedAgency.photos[activePhotoIndex].category}
                      </Badge>
                    </div>
                  </div>
                </motion.div>

                {/* Vue galerie overlay */}
                <AnimatePresence>
                  {isGalleryView && (
                    <motion.div
                      className="absolute inset-0 bg-black/90 backdrop-blur-md z-10 p-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="h-full flex flex-col">
                        {/* Header galerie */}
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <Button
                              onClick={() => setIsGalleryView(false)}
                              variant="ghost"
                              size="icon"
                              className="bg-white/10 hover:bg-white/20 text-white"
                            >
                              <X className="h-5 w-5" />
                            </Button>
                            <div>
                              <h3 className="text-h5 text-white font-semibold">
                                Galerie photos - {agency.name}
                              </h3>
                              <p className="text-body-small text-gray-300">
                                {enrichedAgency.photos.length} photos disponibles
                              </p>
                            </div>
                          </div>
                          
                          {/* Filtres par catégorie */}
                          <div className="flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-gray-300" />
                            <select
                              value={selectedPhotoCategory}
                              onChange={(e) => setSelectedPhotoCategory(e.target.value)}
                              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm backdrop-blur-sm"
                            >
                              <option value="all">Toutes les photos</option>
                              <option value="fleet">Flotte</option>
                              <option value="interior">Intérieur</option>
                              <option value="station">Gare</option>
                              <option value="staff">Équipe</option>
                              <option value="service">Services</option>
                              <option value="scenery">Paysages</option>
                              <option value="maintenance">Maintenance</option>
                              <option value="vip">VIP</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Grille de photos */}
                        <ScrollArea className="flex-1">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredPhotos.map((photo, index) => (
                              <motion.div
                                key={index}
                                className="relative group cursor-pointer"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                onClick={() => {
                                  setActivePhotoIndex(enrichedAgency.photos.findIndex(p => p.url === photo.url));
                                  setIsGalleryView(false);
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <div className="aspect-video rounded-lg overflow-hidden bg-gray-800">
                                  <img
                                    src={photo.url}
                                    alt={photo.title}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                  
                                  {/* Overlay d'informations */}
                                  <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                    <h4 className="text-white font-medium text-sm truncate">
                                      {photo.title}
                                    </h4>
                                    <div className="flex items-center justify-between mt-1">
                                      <Badge
                                        className={`text-xs ${
                                          photo.featured
                                            ? 'bg-kongo-lime text-on-lime'
                                            : 'bg-white/20 text-white'
                                        }`}
                                      >
                                        {photo.category}
                                      </Badge>
                                      {photo.featured && (
                                        <Star className="w-3 h-3 text-kongo-lime fill-current" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Fullscreen overlay */}
                <AnimatePresence>
                  {isFullscreen && (
                    <motion.div
                      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsFullscreen(false)}
                    >
                      <div className="relative max-w-7xl max-h-full p-8">
                        <img
                          src={enrichedAgency.photos[activePhotoIndex].url}
                          alt={enrichedAgency.photos[activePhotoIndex].title}
                          className="max-w-full max-h-full object-contain"
                        />
                        <Button
                          onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                        
                        {/* Navigation en plein écran */}
                        <Button
                          onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                          variant="ghost"
                          size="icon"
                          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </Button>
                        
                        <Button
                          onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                          variant="ghost"
                          size="icon"
                          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </Button>
                        
                        {/* Informations photo en plein écran */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 text-center">
                            <h3 className="text-white font-semibold mb-2">
                              {enrichedAgency.photos[activePhotoIndex].title}
                            </h3>
                            <p className="text-gray-300 text-sm">
                              {enrichedAgency.photos[activePhotoIndex].description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions de la barre supérieure */}
              <div className="absolute top-6 right-6 flex space-x-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleShareAgency}
                      variant="ghost"
                      size="icon"
                      className="bg-black/30 hover:bg-kongo-lime hover:text-on-lime text-white transition-all duration-300 backdrop-blur-sm border border-white/20"
                      aria-label="Partager cette agence"
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-kongo-black text-on-black">
                    Partager l'agence
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleBookmarkToggle}
                      variant="ghost"
                      size="icon"
                      className={`transition-all duration-300 backdrop-blur-sm border border-white/20 ${
                        isBookmarked 
                          ? 'bg-kongo-lime text-on-lime hover:bg-kongo-lime-hover'
                          : 'bg-black/30 hover:bg-kongo-lime hover:text-on-lime text-white'
                      }`}
                      aria-label={isBookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-kongo-black text-on-black">
                    {isBookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onClose}
                      variant="ghost"
                      size="icon"
                      className="bg-black/30 hover:bg-color-error hover:text-inverse text-white transition-all duration-300 backdrop-blur-sm border border-white/20"
                      aria-label="Fermer"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-kongo-black text-on-black">
                    Fermer
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Informations principales en overlay - Design professionnel */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-8">
                <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between space-y-6 xl:space-y-0">
                  <div className="flex items-start space-x-6">
                    <motion.div 
                      className="text-7xl lg:text-8xl filter drop-shadow-2xl"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
                    >
                      {agency.logo}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4 mb-4">
                        <motion.h1 
                          className="text-h2 lg:text-display-2 text-white font-bold leading-tight"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3, duration: 0.6 }}
                        >
                          {agency.name}
                        </motion.h1>
                        <Badge className={`${getTierColor(agency.tier)} text-sm font-semibold border-2 px-4 py-2 shadow-lg`}>
                          {getTierIcon(agency.tier)} {agency.tier.charAt(0).toUpperCase() + agency.tier.slice(1)}
                        </Badge>
                        {agency.isActive && (
                          <Badge className="status-success px-3 py-1">
                            <Activity className="w-3 h-3 mr-1 animate-pulse" />
                            En Ligne
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
                          <MapPin className="w-5 h-5 text-kongo-lime flex-shrink-0" />
                          <span className="text-body-large font-semibold text-white truncate">{agency.headquarters}</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
                          <Star className="w-5 h-5 text-yellow-400 fill-current flex-shrink-0" />
                          <span className="text-body-large font-bold text-white">{agency.rating}</span>
                          <span className="text-body text-gray-200">({agency.totalTrips.toLocaleString()})</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
                          <Calendar className="w-5 h-5 text-kongo-lime flex-shrink-0" />
                          <span className="text-body-large font-semibold text-white">Depuis {agency.founded}</span>
                        </div>
                        <div className="flex items-center space-x-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
                          <Shield className="w-5 h-5 text-green-400 flex-shrink-0" />
                          <span className="text-body-large font-semibold text-white">{agency.onTimePercentage}% Ponctuel</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6 bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-gray-300" />
                          <span className="text-body-small text-gray-200 font-medium">{(viewCount + 1247).toLocaleString()} vues</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Bus className="w-4 h-4 text-gray-300" />
                          <span className="text-body-small text-gray-200 font-medium">{agency.fleetSize} véhicules</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Route className="w-4 h-4 text-gray-300" />
                          <span className="text-body-small text-gray-200 font-medium">{agency.operatingRoutes.length} destinations</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4 text-red-400" />
                          <span className="text-body-small text-gray-200 font-medium">{enrichedAgency.performanceMetrics.repeatCustomers}% fidèles</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions rapides améliorées */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                    <Button 
                      onClick={handleBookingAction}
                      className="btn-secondary px-8 py-4 text-base font-semibold shadow-kongo-lime hover:shadow-kongo-lime/50 transition-all duration-300"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Réserver Maintenant
                    </Button>
                    <Button 
                      onClick={() => handleContactAction('whatsapp')}
                      variant="outline" 
                      className="bg-green-600 border-green-500 text-white hover:bg-green-700 hover:border-green-600 px-8 py-4 text-base backdrop-blur-sm shadow-lg"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      WhatsApp
                    </Button>
                    <Button 
                      onClick={() => handleContactAction('phone')}
                      variant="outline" 
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:border-white/50 px-8 py-4 text-base backdrop-blur-sm"
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      Appeler
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu principal avec tabs améliorés */}
            <ScrollArea className="h-[calc(98vh-400px)]">
              <div className="p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-5 mb-8 h-14 bg-surface-secondary border border-border-primary shadow-sm">
                    <TabsTrigger value="overview" className="text-body font-medium data-[state=active]:bg-kongo-lime data-[state=active]:text-on-lime transition-all duration-200">
                      <Award className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Aperçu</span>
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="text-body font-medium data-[state=active]:bg-kongo-lime data-[state=active]:text-on-lime transition-all duration-200">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Performance</span>
                    </TabsTrigger>
                    <TabsTrigger value="services" className="text-body font-medium data-[state=active]:bg-kongo-lime data-[state=active]:text-on-lime transition-all duration-200">
                      <Shield className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Services</span>
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="text-body font-medium data-[state=active]:bg-kongo-lime data-[state=active]:text-on-lime transition-all duration-200">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Avis</span>
                    </TabsTrigger>
                    <TabsTrigger value="contact" className="text-body font-medium data-[state=active]:bg-kongo-lime data-[state=active]:text-on-lime transition-all duration-200">
                      <Phone className="w-4 h-4 mr-2" />
                      <span className="hidden sm:inline">Contact</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview">
                    <Card className="card-elevated">
                      <CardHeader>
                        <CardTitle className="text-h4 text-kongo-black flex items-center font-semibold">
                          <Award className="w-6 h-6 mr-3 text-kongo-lime" />
                          À propos de {agency.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-body-large text-kongo-black leading-relaxed mb-6">
                          {agency.description}
                        </p>
                        
                        {/* Statistiques détaillées */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-6 bg-surface-kongo-lime-light rounded-xl border border-kongo-lime/20">
                            <div className="text-h3 text-kongo-black font-bold">
                              {enrichedAgency.performanceMetrics.monthlyTrips}
                            </div>
                            <div className="text-body-small text-kongo-black font-medium">Voyages/mois</div>
                          </div>
                          
                          <div className="text-center p-6 bg-surface-secondary rounded-xl border border-border-primary">
                            <div className="text-h3 text-kongo-black font-bold">
                              {enrichedAgency.performanceMetrics.customerSatisfaction}%
                            </div>
                            <div className="text-body-small text-kongo-black font-medium">Satisfaction</div>
                          </div>
                          
                          <div className="text-center p-6 bg-surface-secondary rounded-xl border border-border-primary">
                            <div className="text-h3 text-kongo-black font-bold">
                              {enrichedAgency.performanceMetrics.avgResponseTime}
                            </div>
                            <div className="text-body-small text-kongo-black font-medium">Réponse moy.</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="performance">
                    <Card className="card-elevated">
                      <CardHeader>
                        <CardTitle className="text-h4 text-kongo-black flex items-center font-semibold">
                          <TrendingUp className="w-6 h-6 mr-3 text-kongo-lime" />
                          Performance de l'agence
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-surface-kongo-lime-light rounded-xl border border-kongo-lime/20">
                            <div className="text-h3 text-kongo-black font-bold">
                              {enrichedAgency.kpiMetrics.serviceScore}%
                            </div>
                            <div className="text-body-small text-kongo-black font-medium">Satisfaction client</div>
                            <div className="mt-4">
                              <Progress value={enrichedAgency.kpiMetrics.serviceScore} className="h-2 bg-kongo-lime/30" />
                            </div>
                          </div>
                          
                          <div className="p-6 bg-surface-kongo-lime-light rounded-xl border border-kongo-lime/20">
                            <div className="text-h3 text-kongo-black font-bold">
                              {enrichedAgency.kpiMetrics.safetyScore}%
                            </div>
                            <div className="text-body-small text-kongo-black font-medium">Sécurité</div>
                            <div className="mt-4">
                              <Progress value={enrichedAgency.kpiMetrics.safetyScore} className="h-2 bg-kongo-lime/30" />
                            </div>
                          </div>
                          
                          <div className="p-6 bg-surface-kongo-lime-light rounded-xl border border-kongo-lime/20">
                            <div className="text-h3 text-kongo-black font-bold">
                              {enrichedAgency.kpiMetrics.environmentScore}%
                            </div>
                            <div className="text-body-small text-kongo-black font-medium">Environnement</div>
                            <div className="mt-4">
                              <Progress value={enrichedAgency.kpiMetrics.environmentScore} className="h-2 bg-kongo-lime/30" />
                            </div>
                          </div>
                          
                          <div className="p-6 bg-surface-kongo-lime-light rounded-xl border border-kongo-lime/20">
                            <div className="text-h3 text-kongo-black font-bold">
                              {enrichedAgency.kpiMetrics.digitalScore}%
                            </div>
                            <div className="text-body-small text-kongo-black font-medium">Digital</div>
                            <div className="mt-4">
                              <Progress value={enrichedAgency.kpiMetrics.digitalScore} className="h-2 bg-kongo-lime/30" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="services">
                    <Card className="card-elevated">
                      <CardHeader>
                        <CardTitle className="text-h4 text-kongo-black flex items-center font-semibold">
                          <Shield className="w-6 h-6 mr-3 text-kongo-lime" />
                          Services disponibles
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {agency.amenities.map((amenity, index) => (
                            <motion.div 
                              key={index} 
                              className="flex items-center space-x-3 p-4 bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors duration-200"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              {getAmenityIcon(amenity)}
                              <span className="text-body text-kongo-black font-medium">{amenity}</span>
                            </motion.div>
                          ))}
                        </div>
                        
                        {/* Services premium additionnels */}
                        <Separator className="my-6" />
                        <div className="space-y-4">
                          <h4 className="text-h5 text-kongo-black font-semibold">Services Premium</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {enrichedAgency.premiumServices.map((service, index) => (
                              <motion.div
                                key={index}
                                className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                                  service.available 
                                    ? 'bg-surface-kongo-lime-light border-kongo-lime/30 hover:border-kongo-lime/50' 
                                    : 'bg-surface-tertiary border-border-secondary opacity-60'
                                }`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <div className={`p-2 rounded-lg ${service.available ? 'bg-white/80' : 'bg-gray-300'}`}>
                                  <service.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="text-label font-semibold text-kongo-black">{service.name}</span>
                                    {service.available && (
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                    )}
                                  </div>
                                  <p className="text-body-small text-secondary leading-relaxed">
                                    {service.description}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="reviews">
                    <Card className="card-elevated">
                      <CardHeader>
                        <CardTitle className="text-h4 text-kongo-black flex items-center font-semibold">
                          <MessageCircle className="w-6 h-6 mr-3 text-kongo-lime" />
                          Avis des voyageurs
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {enrichedAgency.recentReviews.map((review) => (
                            <motion.div 
                              key={review.id} 
                              className="border-b border-border-primary pb-6 last:border-b-0"
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: review.id * 0.1 }}
                            >
                              <div className="flex items-start space-x-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarFallback className="bg-kongo-lime text-kongo-black">
                                    {review.name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-body-large font-semibold text-kongo-black">{review.name}</span>
                                    {review.verified && (
                                      <Badge className="status-success text-xs">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Vérifié
                                      </Badge>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      {review.tripType}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-1 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${
                                          i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="text-body-small text-secondary ml-2">{review.date}</span>
                                    <span className="text-body-small text-secondary">•</span>
                                    <span className="text-body-small text-secondary">{review.route}</span>
                                  </div>
                                  <p className="text-body text-kongo-black leading-relaxed">{review.comment}</p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="contact">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <Card className="card-elevated">
                        <CardHeader>
                          <CardTitle className="text-h4 text-kongo-black font-semibold flex items-center">
                            <Phone className="w-6 h-6 mr-3 text-kongo-lime" />
                            Informations de contact
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <motion.div 
                            className="flex items-center space-x-4 p-4 bg-surface-secondary rounded-xl hover:bg-surface-tertiary transition-colors duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="p-3 bg-kongo-lime rounded-lg">
                              <Phone className="w-6 h-6 text-on-lime" />
                            </div>
                            <div className="flex-1">
                              <div className="text-label font-semibold text-kongo-black">Téléphone</div>
                              <div className="text-body text-secondary">{agency.phone}</div>
                            </div>
                            <Button onClick={() => handleContactAction('phone')} className="btn-primary">
                              Appeler
                            </Button>
                          </motion.div>
                          
                          <motion.div 
                            className="flex items-center space-x-4 p-4 bg-surface-secondary rounded-xl hover:bg-surface-tertiary transition-colors duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="p-3 bg-color-info rounded-lg">
                              <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="text-label font-semibold text-kongo-black">Email</div>
                              <div className="text-body text-secondary">{agency.email}</div>
                            </div>
                            <Button onClick={() => handleContactAction('email')} variant="outline">
                              Écrire
                            </Button>
                          </motion.div>
                          
                          <motion.div 
                            className="flex items-center space-x-4 p-4 bg-surface-secondary rounded-xl hover:bg-surface-tertiary transition-colors duration-200"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="p-3 bg-color-success rounded-lg">
                              <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="text-label font-semibold text-kongo-black">Site web</div>
                              <div className="text-body text-secondary">{agency.website}</div>
                            </div>
                            <Button onClick={() => handleContactAction('website')} variant="outline">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Visiter
                            </Button>
                          </motion.div>

                          {/* Horaires d'ouverture */}
                          <div className="p-4 bg-surface-secondary rounded-xl">
                            <h4 className="text-label font-semibold text-kongo-black mb-3 flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-kongo-lime" />
                              Horaires d'ouverture
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(enrichedAgency.businessHours).map(([day, hours]) => (
                                <div key={day} className="flex items-center justify-between">
                                  <span className="text-body text-kongo-black">{day}</span>
                                  <span className="text-body font-medium text-secondary">{hours}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="card-kongo">
                        <CardHeader>
                          <CardTitle className="text-h4 text-on-black font-semibold flex items-center">
                            <Zap className="w-6 h-6 mr-3 text-kongo-lime" />
                            Actions rapides
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <motion.div 
                            className="p-6 bg-kongo-lime rounded-xl text-center cursor-pointer hover:bg-kongo-lime-hover transition-colors duration-200" 
                            onClick={handleBookingAction}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Calendar className="w-8 h-8 text-on-lime mx-auto mb-3" />
                            <div className="text-h5 text-on-lime font-bold mb-2">Réserver un voyage</div>
                            <div className="text-body-small text-on-lime opacity-90">
                              Accédez directement à la recherche avec cette agence
                            </div>
                          </motion.div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <motion.div 
                              className="p-4 bg-kongo-black-light rounded-lg text-center cursor-pointer hover:bg-kongo-black transition-colors duration-200" 
                              onClick={handleShareAgency}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Share2 className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
                              <div className="text-body-small text-on-black font-medium">Partager</div>
                            </motion.div>
                            
                            <motion.div 
                              className="p-4 bg-kongo-black-light rounded-lg text-center cursor-pointer hover:bg-kongo-black transition-colors duration-200" 
                              onClick={handleBookmarkToggle}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Bookmark className={`w-6 h-6 mx-auto mb-2 ${isBookmarked ? 'text-kongo-lime fill-current' : 'text-on-black'}`} />
                              <div className="text-body-small text-on-black font-medium">
                                {isBookmarked ? 'Favori' : 'Sauver'}
                              </div>
                            </motion.div>
                          </div>

                          {/* Routes populaires */}
                          <div className="space-y-3">
                            <h4 className="text-label font-semibold text-on-black">Routes populaires</h4>
                            <div className="space-y-2">
                              {enrichedAgency.popularRoutes.slice(0, 3).map((route, index) => (
                                <motion.div
                                  key={route.id}
                                  className="flex items-center justify-between p-3 bg-kongo-black-light rounded-lg hover:bg-kongo-black transition-colors duration-200"
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <div className="flex items-center space-x-2">
                                    <Navigation className="w-4 h-4 text-kongo-lime" />
                                    <span className="text-body-small text-on-black font-medium">
                                      {route.from} → {route.to}
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {route.duration}
                                  </Badge>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}