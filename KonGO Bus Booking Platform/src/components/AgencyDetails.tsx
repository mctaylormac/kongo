import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import {
  X, Star, Shield, Phone, Globe, Mail, MapPin, Calendar,
  Users, Award, CheckCircle, Clock, Navigation,
  MessageCircle, Zap, Wifi, Snowflake,
  Coffee, Music, ExternalLink, ChevronLeft, ChevronRight,
  Share2, Bookmark, Eye, Activity, TrendingUp, Heart,
  CreditCard, Bus, Gauge, Trophy, Target, BadgeCheck,
  Route, FileText, AlertCircle, Camera, Play, Pause,
  ZoomIn, Maximize2, Grid3X3, Filter, Tag, Image as ImageIcon,
  Pencil, Trash2
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

    businessHours: {
      'Lundi - Vendredi': '5:30 - 21:00',
      'Samedi': '6:00 - 20:00',
      'Dimanche': '7:00 - 19:00',
      'Jours fériés': '8:00 - 18:00'
    },

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
        name: 'Jean Kabasubabu',
        rating: 4,
        comment: 'Très satisfait de mon voyage. Personnel accueillant et serviable. Seul petit bémol : départ avec 20 minutes de retard, mais arrivée à l\'heure prévue grâce à la conduite professionnelle.',
        date: '2024-01-12',
        verified: true,
        route: 'Goma → Kinshasa',
        tripType: 'Standard'
      },
      {
        id: 3,
        name: 'Claudine Tshisekedi',
        rating: 5,
        comment: 'Transport premium comme promis ! Sièges inclinables, collations incluses, et même un système de divertissement à bord. Le GPS tracking permet aux familles de suivre le voyage en temps réel.',
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

    certifications: [
      ...agency.certifications,
      ...(agency.tier === 'platinum' ? ['ISO 9001:2015', 'Transport Excellence Award 2023'] : []),
      ...(agency.tier === 'gold' ? ['Service Quality Certification'] : [])
    ],

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

  // ── Gestion dynamique des avis & de la note ──────────────────────────────
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number>(agency?.rating || 4.8);
  const [totalReviewsCount, setTotalReviewsCount] = useState<number>(0);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(true);

  // ── Utilisateur connecté ──────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Formulaire d'ajout d'un avis
  const [showAddReviewForm, setShowAddReviewForm] = useState<boolean>(false);
  const [newAuthorName, setNewAuthorName] = useState<string>("");
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newComment, setNewComment] = useState<string>("");
  const [newRoute, setNewRoute] = useState<string>("Kinshasa → Lubumbashi");
  const [newTripType, setNewTripType] = useState<string>("VIP");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // ── Édition / Suppression d'un avis existant ─────────────────────────────
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(5);
  const [editHoverRating, setEditHoverRating] = useState<number>(0);
  const [editComment, setEditComment] = useState<string>("");
  const [editRoute, setEditRoute] = useState<string>("");
  const [editTripType, setEditTripType] = useState<string>("VIP");
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // ── enrichedAgency est calculé ici (avant le early return) ───────────────
  // On le mémoïse pour avoir une référence stable
  const enrichedAgency = React.useMemo(
    () => (agency ? getEnrichedAgencyData(agency) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [agency?.id]
  );

  // ── Chargement des avis depuis Supabase ─────────────────────────────────
  const fetchReviews = useCallback(async () => {
    if (!agency?.id || !enrichedAgency) return;
    setLoadingReviews(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.full_name) {
          setNewAuthorName(profile.full_name);
        } else if (user.email) {
          setNewAuthorName(user.email.split('@')[0]);
        }
      }

      const { data, error } = await supabase
        .from('agency_reviews')
        .select('*')
        .eq('agency_id', agency.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setReviewsList(data);
        const sum = data.reduce((acc: number, curr: any) => acc + (Number(curr.rating) || 5), 0);
        const avg = (sum / data.length).toFixed(1);
        setAvgRating(parseFloat(avg));
        setTotalReviewsCount(data.length);
      } else {
        setReviewsList(enrichedAgency.recentReviews);
        setAvgRating(agency.rating || 4.8);
        setTotalReviewsCount(enrichedAgency.recentReviews.length);
      }
    } catch (err) {
      console.error("Error fetching agency reviews:", err);
      if (enrichedAgency) {
        setReviewsList(enrichedAgency.recentReviews);
        setAvgRating(agency.rating || 4.8);
        setTotalReviewsCount(enrichedAgency.recentReviews.length);
      }
    } finally {
      setLoadingReviews(false);
    }
  // enrichedAgency est stable grâce au useMemo ci-dessus
  }, [agency?.id, agency?.rating, enrichedAgency]);

  useEffect(() => {
    if (isOpen && agency) {
      fetchReviews();

      setViewCount(prev => prev + 1);

      const savedBookmarks = localStorage.getItem('kongo-bookmarked-agencies');
      if (savedBookmarks) {
        const bookmarks = JSON.parse(savedBookmarks);
        setIsBookmarked(bookmarks.includes(agency.id));
      }

      const interval = setInterval(() => {
        if (!isPlaying) {
          setActivePhotoIndex(prev => (prev + 1) % 8);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isOpen, agency, isPlaying, fetchReviews]);

  // ── Basculer le formulaire d'avis avec vérification d'authentification ────
  const handleToggleAddReview = () => {
    if (!currentUser) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.user) {
          toast.error("Connexion requise : Veuillez vous connecter à votre compte pour laisser une note et un avis.");
        } else {
          setCurrentUser(session.user);
          setShowAddReviewForm(prev => !prev);
        }
      });
      return;
    }
    setShowAddReviewForm(prev => !prev);
  };

  // ── Soumission d'un nouvel avis (Strictement authentifié) ─────────────────
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Vous devez être connecté à votre compte pour publier un avis.");
      return;
    }
    if (!newAuthorName.trim() || !newComment.trim()) {
      toast.error("Veuillez renseigner votre commentaire.");
      return;
    }
    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('agency_reviews').insert({
        agency_id: agency.id,
        user_id: user.id,
        author_name: newAuthorName.trim(),
        rating: newRating,
        comment: newComment.trim(),
        route: newRoute || "Kinshasa → Lubumbashi",
        trip_type: newTripType || "VIP",
        verified: true,
      });

      if (error) throw error;

      toast.success("Votre avis a été publié avec succès ! Merci pour votre évaluation.");
      setNewComment("");
      setShowAddReviewForm(false);
      await fetchReviews();
    } catch (err: any) {
      toast.error("Erreur lors de la publication de l'avis : " + err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Ouvrir le formulaire d'édition d'un avis ─────────────────────────────
  const handleEditReview = (review: any) => {
    setEditingReviewId(review.id);
    setEditRating(Number(review.rating) || 5);
    setEditComment(review.comment || "");
    setEditRoute(review.route || "");
    setEditTripType(review.trip_type || "VIP");
    setShowAddReviewForm(false); // ferme le formulaire d'ajout si ouvert
  };

  // ── Sauvegarder les modifications d'un avis ──────────────────────────────
  const handleUpdateReview = async (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Vous devez être connecté pour modifier un avis.");
      return;
    }
    if (!editComment.trim()) {
      toast.error("Le commentaire ne peut pas être vide.");
      return;
    }
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('agency_reviews')
        .update({
          rating: editRating,
          comment: editComment.trim(),
          route: editRoute || "Kinshasa → Lubumbashi",
          trip_type: editTripType || "VIP",
        })
        .eq('id', reviewId)
        .eq('user_id', user.id); // sécurité : seul l'auteur peut modifier

      if (error) throw error;

      toast.success("Votre avis a été mis à jour avec succès !");
      setEditingReviewId(null);
      await fetchReviews();
    } catch (err: any) {
      toast.error("Erreur lors de la mise à jour : " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Supprimer un avis ────────────────────────────────────────────────────
  const handleDeleteReview = async (reviewId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Vous devez être connecté pour supprimer un avis.");
      return;
    }
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre avis ? Cette action est irréversible.")) return;
    setDeletingReviewId(reviewId);
    try {
      const { error } = await supabase
        .from('agency_reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', user.id); // sécurité : seul l'auteur peut supprimer

      if (error) throw error;

      toast.success("Votre avis a été supprimé.");
      await fetchReviews();
    } catch (err: any) {
      toast.error("Erreur lors de la suppression : " + err.message);
    } finally {
      setDeletingReviewId(null);
    }
  };

  // ── Early return APRÈS tous les hooks (règle des hooks React) ────────────
  if (!agency || !enrichedAgency) return null;

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
            <div className={`relative h-96 bg-gradient-to-br ${getTierGradient(agency.tier)} overflow-hidden`}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40"></div>

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

                <div className="absolute top-6 right-6 z-20">
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="icon"
                    className="bg-black/30 hover:bg-[#FF3B30] text-white transition-all duration-300 backdrop-blur-sm border border-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-8 backdrop-blur-sm">
                  <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between space-y-6 xl:space-y-0">
                    <div className="flex items-start space-x-6">
                      <div className="text-6xl lg:text-7xl filter drop-shadow-2xl">
                        {agency.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4 mb-4">
                          <h1 className="text-3xl lg:text-4xl text-white font-bold leading-tight">
                            {agency.name}
                          </h1>
                          <Badge className={`${getTierColor(agency.tier)} text-sm font-semibold border-2 px-4 py-1.5 shadow-lg`}>
                            {getTierIcon(agency.tier)} {agency.tier.charAt(0).toUpperCase() + agency.tier.slice(1)}
                          </Badge>
                          {agency.isActive && (
                            <Badge className="bg-[#5CB338] text-white px-3 py-1">
                              En Ligne
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-2">
                          <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md rounded-lg px-3 py-2">
                            <MapPin className="w-5 h-5 text-[#5CB338]" />
                            <span className="text-sm font-semibold text-white truncate">{agency.headquarters}</span>
                          </div>
                          <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md rounded-lg px-3 py-2">
                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            <span className="text-sm font-bold text-white">{avgRating}</span>
                            <span className="text-xs text-white/80">({totalReviewsCount} avis)</span>
                          </div>
                          <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md rounded-lg px-3 py-2">
                            <Calendar className="w-5 h-5 text-[#5CB338]" />
                            <span className="text-sm font-semibold text-white">Depuis {agency.founded}</span>
                          </div>
                          <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-md rounded-lg px-3 py-2">
                            <Shield className="w-5 h-5 text-green-400" />
                            <span className="text-sm font-semibold text-white">{agency.onTimePercentage}% Ponctuel</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[calc(98vh-400px)]">
              <div className="p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 mb-8 h-auto p-2 bg-gray-100 border-2 border-gray-300 rounded-2xl shadow-inner gap-2">
                    <TabsTrigger
                      value="overview"
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-sm sm:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl"
                    >
                      <Award className="w-5 h-5 shrink-0" />
                      <span>Aperçu</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="performance"
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-sm sm:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl"
                    >
                      <TrendingUp className="w-5 h-5 shrink-0" />
                      <span>Performance</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="services"
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-sm sm:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl"
                    >
                      <Shield className="w-5 h-5 shrink-0" />
                      <span>Services</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="reviews"
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-sm sm:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl"
                    >
                      <MessageCircle className="w-5 h-5 shrink-0" />
                      <span>Avis ({totalReviewsCount})</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="contact"
                      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-sm sm:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl"
                    >
                      <Phone className="w-5 h-5 shrink-0" />
                      <span>Contact</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <Card className="card-elevated">
                      <CardHeader>
                        <CardTitle className="text-h4 text-kongo-black flex items-center font-semibold">
                          <Award className="w-6 h-6 mr-3 text-[#5CB338]" />
                          À propos de {agency.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-body-large text-kongo-black leading-relaxed mb-6">
                          {agency.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-6 bg-surface-secondary rounded-xl border border-border-primary">
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
                          <TrendingUp className="w-6 h-6 mr-3 text-[#5CB338]" />
                          Performance de l'agence
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-surface-secondary rounded-xl border border-border-primary">
                            <div className="text-h3 text-kongo-black font-bold">
                              {enrichedAgency.kpiMetrics.serviceScore}%
                            </div>
                            <div className="text-body-small text-kongo-black font-medium">Satisfaction client</div>
                          </div>

                          <div className="p-6 bg-surface-secondary rounded-xl border border-border-primary">
                            <div className="text-h3 text-kongo-black font-bold">
                              {enrichedAgency.kpiMetrics.safetyScore}%
                            </div>
                            <div className="text-body-small text-kongo-black font-medium">Sécurité</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="services">
                    <Card className="card-elevated">
                      <CardHeader>
                        <CardTitle className="text-h4 text-kongo-black flex items-center font-semibold">
                          <Shield className="w-6 h-6 mr-3 text-[#5CB338]" />
                          Services disponibles
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {agency.amenities.map((amenity, index) => (
                            <div key={index} className="flex items-center space-x-3 p-4 bg-surface-secondary rounded-lg">
                              {getAmenityIcon(amenity)}
                              <span className="text-body text-kongo-black font-medium">{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="reviews">
                    <Card className="card-elevated">
                      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <CardTitle className="text-h4 text-kongo-black flex items-center font-semibold">
                            <MessageCircle className="w-6 h-6 mr-3 text-[#5CB338]" />
                            Avis des voyageurs
                          </CardTitle>
                          <p className="text-sm text-gray-500 mt-1">
                            Note globale : <span className="font-bold text-[#1D1D1F] text-base">{avgRating} / 5</span> ({totalReviewsCount} avis publiés)
                          </p>
                        </div>
                        <Button
                          onClick={handleToggleAddReview}
                          style={
                            showAddReviewForm
                              ? { backgroundColor: '#1D1D1F', color: '#C8E63C', borderColor: '#C8E63C' }
                              : { backgroundColor: '#16A34A', color: '#FFFFFF', borderColor: '#15803D' }
                          }
                          className={
                            showAddReviewForm
                              ? "bg-[#1D1D1F] text-[#C8E63C] hover:bg-black border-2 border-[#C8E63C] text-base font-extrabold px-6 py-3.5 rounded-2xl shadow-lg flex items-center gap-2"
                              : "bg-[#16A34A] text-white hover:bg-[#15803D] border-2 border-[#15803D] text-base sm:text-lg font-black px-7 py-3.5 rounded-2xl shadow-xl flex items-center gap-2"
                          }
                        >
                          {showAddReviewForm ? (
                            <>
                              <X className="w-5 h-5 text-[#C8E63C]" />
                              <span className="text-[#C8E63C] font-extrabold text-base">Fermer le formulaire</span>
                            </>
                          ) : (
                            <>
                              <Pencil className="w-5 h-5 text-white" />
                              <span className="text-white font-black text-base sm:text-lg">✍️ Laisser un avis</span>
                            </>
                          )}
                        </Button>
                      </CardHeader>
                      <CardContent>
                        {/* Banner non connecté */}
                        {!currentUser && (
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-4 mb-6 text-amber-900 shadow-sm">
                            <div className="flex items-center gap-3">
                              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                              <p className="text-xs font-semibold">
                                Seuls les voyageurs possédant un compte et connectés peuvent évaluer et publier un avis sur cette agence.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Formulaire d'ajout d'avis */}
                        {showAddReviewForm && (
                          <motion.form
                            onSubmit={handleSubmitReview}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-6 bg-surface-secondary rounded-2xl border border-black/10 space-y-4 mb-8 shadow-sm"
                          >
                            <h4 className="text-base font-bold text-kongo-black flex items-center gap-2">
                              <Star className="w-5 h-5 text-yellow-500 fill-current" />
                              Publier votre avis sur {agency.name}
                            </h4>

                            <div className="flex items-center gap-3 py-1">
                              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Note globale :</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    type="button"
                                    key={star}
                                    onClick={() => setNewRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 focus:outline-none transition-transform hover:scale-125"
                                  >
                                    <Star
                                      className={`w-7 h-7 ${
                                        star <= (hoverRating || newRating)
                                          ? "text-yellow-500 fill-current"
                                          : "text-gray-300"
                                      }`}
                                    />
                                  </button>
                                ))}
                                <span className="ml-2 font-bold text-sm text-kongo-black">{newRating} / 5</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Votre Nom / Pseudo *</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="Ex: Marie Kalala"
                                  value={newAuthorName}
                                  onChange={(e) => setNewAuthorName(e.target.value)}
                                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#5CB338]"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Trajet effectué</label>
                                <input
                                  type="text"
                                  placeholder="Ex: Kinshasa → Lubumbashi"
                                  value={newRoute}
                                  onChange={(e) => setNewRoute(e.target.value)}
                                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#5CB338]"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Type de voyage</label>
                              <select
                                value={newTripType}
                                onChange={(e) => setNewTripType(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#5CB338]"
                              >
                                <option value="VIP">VIP</option>
                                <option value="Standard">Standard</option>
                                <option value="Premium">Premium</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Votre commentaire *</label>
                              <textarea
                                required
                                rows={3}
                                placeholder="Partagez votre expérience : ponctualité, confort du véhicule, accueil..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#5CB338]"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowAddReviewForm(false)}
                                className="rounded-2xl border-2 border-gray-400 text-gray-800 text-base font-bold px-6 py-3.5 hover:bg-gray-100"
                              >
                                Annuler
                              </Button>
                              <Button
                                type="submit"
                                disabled={submittingReview}
                                style={{ backgroundColor: '#1D1D1F', color: '#C8E63C', borderColor: '#C8E63C' }}
                                className="bg-[#1D1D1F] text-[#C8E63C] hover:bg-black border-2 border-[#C8E63C] text-base sm:text-lg font-black rounded-2xl px-8 py-3.5 shadow-xl flex items-center justify-center gap-2"
                              >
                                {submittingReview ? (
                                  <span className="text-[#C8E63C] font-extrabold">Publication en cours...</span>
                                ) : (
                                  <>
                                    <Zap className="w-5 h-5 text-[#C8E63C] fill-current" />
                                    <span className="text-[#C8E63C] font-black text-base sm:text-lg">Envoyer mon avis</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </motion.form>
                        )}

                        {/* Liste des avis */}
                        {loadingReviews ? (
                          <div className="py-12 text-center text-gray-400 text-sm animate-pulse">
                            Chargement des avis...
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {reviewsList.map((review, index) => {
                              const isOwner = currentUser && review.user_id === currentUser.id;
                              const isEditing = editingReviewId === review.id;

                              return (
                                <motion.div
                                  key={review.id || index}
                                  className="border-b border-border-primary pb-6 last:border-b-0"
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  {/* ── Formulaire d'édition inline ── */}
                                  {isEditing ? (
                                    <motion.form
                                      onSubmit={(e) => handleUpdateReview(e, review.id)}
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      className="p-5 bg-surface-secondary rounded-2xl border border-[#5CB338]/30 space-y-4 shadow-sm"
                                    >
                                      <h4 className="text-sm font-bold text-kongo-black flex items-center gap-2">
                                        <Pencil className="w-4 h-4 text-[#5CB338]" />
                                        Modifier votre avis
                                      </h4>
                                      {/* Note étoiles */}
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Note :</span>
                                        <div className="flex items-center gap-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                              type="button"
                                              key={star}
                                              onClick={() => setEditRating(star)}
                                              onMouseEnter={() => setEditHoverRating(star)}
                                              onMouseLeave={() => setEditHoverRating(0)}
                                              className="p-0.5 focus:outline-none transition-transform hover:scale-125"
                                            >
                                              <Star
                                                className={`w-6 h-6 ${
                                                  star <= (editHoverRating || editRating)
                                                    ? "text-yellow-500 fill-current"
                                                    : "text-gray-300"
                                                }`}
                                              />
                                            </button>
                                          ))}
                                          <span className="ml-1 font-bold text-sm text-kongo-black">{editRating}/5</span>
                                        </div>
                                      </div>
                                      {/* Route & type */}
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                          type="text"
                                          value={editRoute}
                                          onChange={(e) => setEditRoute(e.target.value)}
                                          placeholder="Trajet effectué"
                                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#5CB338]"
                                        />
                                        <select
                                          value={editTripType}
                                          onChange={(e) => setEditTripType(e.target.value)}
                                          className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#5CB338]"
                                        >
                                          <option value="VIP">VIP</option>
                                          <option value="Standard">Standard</option>
                                          <option value="Premium">Premium</option>
                                        </select>
                                      </div>
                                      {/* Commentaire */}
                                      <textarea
                                        required
                                        rows={3}
                                        value={editComment}
                                        onChange={(e) => setEditComment(e.target.value)}
                                        placeholder="Votre commentaire..."
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-[#5CB338]"
                                      />
                                      <div className="flex justify-end gap-3">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => setEditingReviewId(null)}
                                          className="rounded-xl text-sm"
                                        >
                                          Annuler
                                        </Button>
                                        <Button
                                          type="submit"
                                          disabled={savingEdit}
                                          className="bg-[#5CB338] text-white hover:bg-[#4ea22e] font-bold rounded-xl px-5 text-sm"
                                        >
                                          {savingEdit ? "Enregistrement..." : "Sauvegarder"}
                                        </Button>
                                      </div>
                                    </motion.form>
                                  ) : (
                                    /* ── Affichage normal de l'avis ── */
                                    <div className="flex items-start space-x-4">
                                      <Avatar className="w-12 h-12">
                                        <AvatarFallback className="bg-[#5CB338] text-white font-bold">
                                          {(review.author_name || review.name || "A").charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <span className="text-body-large font-semibold text-kongo-black">
                                              {review.author_name || review.name}
                                            </span>
                                            {(review.verified || review.is_verified) && (
                                              <Badge className="status-success text-xs">
                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                Vérifié
                                              </Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                              {review.trip_type || review.tripType || "Standard"}
                                            </Badge>
                                          </div>
                                          {/* Boutons modifier / supprimer (auteur seulement) */}
                                          {isOwner && review.user_id && (
                                            <div className="flex items-center gap-2">
                                              <button
                                                onClick={() => handleEditReview(review)}
                                                className="flex items-center gap-1 text-xs font-semibold text-[#5CB338] hover:text-[#4ea22e] transition-colors px-2 py-1 rounded-lg hover:bg-[#5CB338]/10"
                                              >
                                                <Pencil className="w-3.5 h-3.5" />
                                                Modifier
                                              </button>
                                              <button
                                                onClick={() => handleDeleteReview(review.id)}
                                                disabled={deletingReviewId === review.id}
                                                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                {deletingReviewId === review.id ? "..." : "Supprimer"}
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex items-center space-x-1 mb-3">
                                          {[...Array(5)].map((_, i) => (
                                            <Star
                                              key={i}
                                              className={`w-4 h-4 ${
                                                i < Math.round(Number(review.rating))
                                                  ? 'text-yellow-500 fill-current'
                                                  : 'text-gray-300'
                                              }`}
                                            />
                                          ))}
                                          <span className="text-body-small text-secondary ml-2">
                                            {review.created_at
                                              ? new Date(review.created_at).toLocaleDateString('fr-FR')
                                              : (review.date || 'Récents')}
                                          </span>
                                          <span className="text-body-small text-secondary">•</span>
                                          <span className="text-body-small text-secondary">{review.route}</span>
                                        </div>
                                        <p className="text-body text-kongo-black leading-relaxed">{review.comment}</p>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="contact">
                    <Card className="card-elevated">
                      <CardHeader>
                        <CardTitle className="text-h4 text-kongo-black font-semibold flex items-center">
                          <Phone className="w-6 h-6 mr-3 text-[#5CB338]" />
                          Informations de contact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-surface-secondary rounded-xl">
                          <div className="text-label font-semibold text-kongo-black">Téléphone</div>
                          <div className="text-body text-secondary">{agency.phone}</div>
                        </div>
                        <div className="p-4 bg-surface-secondary rounded-xl">
                          <div className="text-label font-semibold text-kongo-black">Email</div>
                          <div className="text-body text-secondary">{agency.email}</div>
                        </div>
                      </CardContent>
                    </Card>
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
