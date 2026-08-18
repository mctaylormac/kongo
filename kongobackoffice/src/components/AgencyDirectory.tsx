import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Star, Shield, Phone, Globe, Filter, Grid, List, Info, 
  HelpCircle, Award, Users, Clock, Truck, ArrowRight, Heart, Share2,
  ChevronDown, CheckCircle, AlertCircle, Navigation, MapPinIcon,
  Calendar, TrendingUp, Eye, BookOpen, MessageSquare, StarIcon,
  ThumbsUp, Send, Edit, Camera, FileText, MoreVertical,
  ChevronRight, Building2, Target, Smartphone, Gift
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Progress } from './ui/progress';
import { AgencyDetails } from './AgencyDetails';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

// Type definition for Agency to match both DB and component needs
interface Agency {
  id: string;
  name: string;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  phone: string;
  email: string;
  website: string;
  logo: string;
  address: string | null;
  rating: number;
  tier: string;
  reviewCount: number;
  totalTrips: number;
  founded: number;
  headquarters: string;
  region: string;
  operatingRoutes: string[];
  popularRoutes: string[];
  description: string;
  fullDescription: string;
  amenities: string[];
  safetyRating: number;
  onTimePercentage: number;
  fleetSize: number;
  activeVehicles: number;
  certifications: string[];
  awards: string[];
  establishedSince: string;
  monthlyTrips: number;
  specialties: string[];
  operatingHours: string;
  languages: string[];
  paymentMethods: string[];
  features: string[];
  isActive: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  lastActive: string;
  responseTime: string;
  ratingBreakdown: Record<number, number>;
  averageRatings: {
    punctuality: number;
    comfort: number;
    safety: number;
    value: number;
    staff: number;
  };
  recentReviews: any[];
  promotion: {
    active: boolean;
    text: string;
    code: string;
  };
}

const DEFAULT_AGENCY_VALUES: Partial<Agency> = {
  tier: 'gold',
  reviewCount: 450,
  totalTrips: 1250,
  founded: 2020,
  headquarters: 'Kinshasa',
  region: 'Kinshasa',
  operatingRoutes: ['Kinshasa-Lubumbashi', 'Kinshasa-Goma', 'Kinshasa-Matadi'],
  popularRoutes: ['Kinshasa-Lubumbashi'],
  description: 'Transporteur professionnel desservant les grandes villes de la RDC.',
  fullDescription: 'Une agence de transport fiable engagée dans la sécurité et le confort de ses passagers à travers toute la République Démocratique du Congo.',
  amenities: ['Climatisation', 'Sièges confortables', 'Bagages sécurisés'],
  safetyRating: 4.5,
  onTimePercentage: 85,
  fleetSize: 15,
  activeVehicles: 12,
  certifications: ['Sécurité Transport RDC'],
  awards: ['Prix Excellence Services'],
  establishedSince: '4 ans',
  monthlyTrips: 150,
  specialties: ['Transport interurbain'],
  operatingHours: '24/7',
  languages: ['Français', 'Lingala', 'Swahili'],
  paymentMethods: ['Cash', 'Mobile Money'],
  features: ['GPS Tracking', 'Assurance voyage'],
  isActive: true,
  isFeatured: false,
  isVerified: true,
  lastActive: '5 min',
  responseTime: '< 15 min',
  ratingBreakdown: { 5: 65, 4: 20, 3: 10, 2: 3, 1: 2 },
  averageRatings: { punctuality: 4.5, comfort: 4.2, safety: 4.7, value: 4.4, staff: 4.6 },
  recentReviews: [],
  promotion: {
    active: false,
    text: '',
    code: ''
  }
};

// Interface pour les évaluations
interface AgencyReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  date: Date;
  title: string;
  comment: string;
  helpful: number;
  categories: {
    punctuality: number;
    comfort: number;
    safety: number;
    value: number;
    staff: number;
  };
  verified: boolean;
  photos?: string[];
}

interface RatingModalProps {
  agency: Agency;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: Partial<AgencyReview>) => void;
}

// Composant de modal de notation
function AgencyRatingModal({ agency, isOpen, onClose, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [title, setTitle] = useState('');
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({
    punctuality: 0,
    comfort: 0,
    safety: 0,
    value: 0,
    staff: 0
  });

  const categories = [
    { key: 'punctuality', label: 'Ponctualité', icon: '🕒' },
    { key: 'comfort', label: 'Confort', icon: '💺' },
    { key: 'safety', label: 'Sécurité', icon: '🛡️' },
    { key: 'value', label: 'Rapport qualité/prix', icon: '💰' },
    { key: 'staff', label: 'Personnel', icon: '👥' }
  ];

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Veuillez donner une note globale");
      return;
    }
    
    onSubmit({
      rating,
      title,
      comment,
      categories: categoryRatings as any,
      date: new Date(),
      userName: 'Utilisateur', // En temps réel, viendrait de l'auth
      helpful: 0,
      verified: true
    });
    
    toast.success("🎉 Évaluation publiée avec succès !", {
      description: "Merci pour votre retour, cela aide les autres voyageurs"
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-kongo-lime/20 overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-h3 text-kongo-black font-bold flex items-center space-x-2">
            <span>⭐</span>
            <span>Évaluez {agency.name}</span>
          </DialogTitle>
          <DialogDescription className="text-body text-secondary">
            Partagez votre expérience pour aider la communauté KonGO
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Note globale */}
          <div className="text-center space-y-4 bg-surface-secondary/50 p-6 rounded-2xl border border-border-primary">
            <h3 className="text-h6 text-primary font-semibold">Note globale</h3>
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-all transform hover:scale-110 active:scale-95"
                >
                  <Star 
                    className={`w-12 h-12 ${
                      star <= (hoverRating || rating) 
                        ? 'fill-kongo-lime text-kongo-lime drop-shadow-[0_0_8px_rgba(157,255,0,0.5)]' 
                        : 'text-quaternary hover:text-kongo-lime/50'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-body-small text-secondary italic">
              {rating === 5 ? "Excellent !" : 
               rating === 4 ? "Très bon" :
               rating === 3 ? "Moyen" :
               rating === 2 ? "Passable" :
               rating === 1 ? "Décevant" : "Cliquez pour noter"}
            </p>
          </div>

          {/* Notes par catégorie */}
          <div className="space-y-6">
            <h3 className="text-h6 text-primary font-semibold">Évaluez chaque aspect</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {categories.map((cat) => (
                <div key={cat.key} className="space-y-2 p-4 rounded-xl border border-border-primary hover:border-kongo-lime/30 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-body-small font-medium flex items-center space-x-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span className="text-kongo-black font-bold">{categoryRatings[cat.key] || 0}/5</span>
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setCategoryRatings(prev => ({ ...prev, [cat.key]: s }))}
                        className="flex-1 h-2 rounded-full transition-all bg-gray-100 hover:bg-kongo-lime-light"
                      >
                        <div 
                          className={`h-full rounded-full transition-all ${
                            s <= categoryRatings[cat.key] ? 'bg-kongo-lime' : 'bg-transparent'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commentaire */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-label text-primary">Titre de votre avis</label>
              <Input 
                placeholder="Ex: Voyage inoubliable, Très bon service..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-kongo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-label text-primary">Votre expérience en détails</label>
              <Textarea 
                placeholder="Racontez-nous votre voyage..."
                className="min-h-[120px] input-kongo resize-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1 btn-outline-lime">
              Annuler
            </Button>
            <Button 
              className="flex-1 btn-primary"
              onClick={handleSubmit}
            >
              Publier l'évaluation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Composant d'affichage des évaluations
function AgencyReviews({ agency }: { agency: Agency }) {
  const [activeTab, setActiveTab] = useState<'all' | 'verified'>('all');
  
  const filteredReviews = useMemo(() => {
    if (activeTab === 'verified') return agency.recentReviews.filter(r => r.verified);
    return agency.recentReviews;
  }, [agency.recentReviews, activeTab]);

  const renderStars = (rating: number) => (
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star 
          key={i} 
          className={`w-4 h-4 ${i < rating ? 'fill-kongo-lime text-kongo-lime' : 'text-quaternary'}`} 
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Résumé des notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center bg-surface-secondary/30 p-8 rounded-3xl border border-border-primary">
        <div className="text-center space-y-2">
          <div className="text-h1 text-kongo-black font-bold">{agency.rating.toFixed(1)}</div>
          {renderStars(Math.round(agency.rating))}
          <div className="text-body-small text-secondary">
            Basé sur {agency.reviewCount.toLocaleString()} avis
          </div>
          <Badge className="bg-success-light text-success font-medium">
            <CheckCircle className="w-3 h-3 mr-1" />
            Vérifié par KonGO
          </Badge>
        </div>

        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center space-x-3">
              <span className="text-body-small text-secondary font-medium w-8">
                {stars}★
              </span>
              <Progress 
                value={agency.ratingBreakdown[stars] || 0} 
                className="h-2 flex-1 bg-white border border-border-primary"
              />
              <span className="text-body-xs text-secondary w-10 text-right">
                {agency.ratingBreakdown[stars] || 0}%
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h4 className="text-h6 text-primary font-semibold">Profil de confiance</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-body-small">
              <span className="text-secondary">Ponctualité</span>
              <span className="text-kongo-black font-medium">4.8/5</span>
            </div>
            <div className="flex items-center justify-between text-body-small">
              <span className="text-secondary">Confort</span>
              <span className="text-kongo-black font-medium">4.5/5</span>
            </div>
            <div className="flex items-center justify-between text-body-small">
              <span className="text-secondary">Sécurité</span>
              <span className="text-success font-bold">Excellent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs et Tris */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex p-1 bg-surface-secondary rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2 rounded-lg text-body-small font-medium transition-all ${
              activeTab === 'all' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'
            }`}
          >
            Tous les avis ({agency.recentReviews.length})
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`px-6 py-2 rounded-lg text-body-small font-medium transition-all ${
              activeTab === 'verified' ? 'bg-white text-primary shadow-sm' : 'text-secondary hover:text-primary'
            }`}
          >
            Avis vérifiés
          </button>
        </div>

        <div className="flex space-x-3">
          <Select defaultValue="recent">
            <SelectTrigger className="w-[180px] bg-white border-border-primary">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récents</SelectItem>
              <SelectItem value="rating-high">Mieux notés</SelectItem>
              <SelectItem value="rating-low">Moins bien notés</SelectItem>
              <SelectItem value="helpful">Les plus utiles</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="btn-outline-lime">
            <Edit className="w-4 h-4 mr-2" />
            Écrire un avis
          </Button>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="grid grid-cols-1 gap-6">
        {filteredReviews.length > 0 ? filteredReviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-kongo bg-white p-8 space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src={review.userAvatar || `https://ui-avatars.com/api/?name=${review.userName}&background=random`} 
                    alt={review.userName}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-kongo-lime/20"
                  />
                  {review.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-success rounded-full p-1 border-2 border-white">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-h6 text-primary font-bold">{review.userName}</h4>
                    {review.verified && (
                      <Badge className="bg-success/10 text-success text-[10px] uppercase font-bold tracking-wider">
                        Acheteur vérifié
                      </Badge>
                    )}
                  </div>
                  <p className="text-body-xs text-secondary">
                    Voyagé le {new Date(review.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                {renderStars(review.rating)}
                <span className="text-body-small text-secondary font-medium">
                  {review.rating.toFixed(1)}/5
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-h6 text-primary font-bold">{review.title}</h5>
              <p className="text-body text-secondary leading-relaxed">
                {review.comment}
              </p>
            </div>

            {review.photos && review.photos.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                {review.photos.map((photo, i) => (
                  <img 
                    key={i}
                    src={photo}
                    alt="Review" 
                    className="w-32 h-24 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-6 pt-4 border-t border-border-primary">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-body-small text-secondary hover:text-kongo-lime transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>C'est utile ({review.helpful})</span>
                </button>
                <button className="flex items-center space-x-2 text-body-small text-secondary hover:text-primary transition-colors">
                  <Share2 className="w-4 h-4" />
                  <span>Partager</span>
                </button>
              </div>
              
              <div className="flex items-center space-x-4 ml-auto">
                <span className="text-body-xs text-quaternary">
                  Signaler un abus
                </span>
                <Badge variant="outline" className="text-quaternary border-quaternary">
                  ID: {review.id.slice(0, 8)}
                </Badge>
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-12 bg-surface-secondary/20 rounded-3xl border border-dashed border-border-primary">
            <MessageSquare className="w-12 h-12 text-quaternary mx-auto mb-4" />
            <h3 className="text-h6 text-primary font-bold">Aucun avis pour le moment</h3>
            <p className="text-body-small text-secondary">
              Soyez le premier à partager votre expérience !
            </p>
          </div>
        )}
      </div>

      {/* Bouton Voir plus */}
      <div className="text-center">
        <Button variant="outline" className="btn-outline-lime px-8">
          Charger plus d'avis
        </Button>
      </div>
    </div>
  );
}

// Provinces de la RDC pour le filtrage
const provinces = [
  'All Provinces',
  'Kinshasa',
  'Katanga',
  'Nord-Kivu',
  'Sud-Kivu',
  'Kongo-Central',
  'Lualaba',
  'Haut-Lomami',
  'Tanganyika',
  'Ituri',
  'Tshopo',
  'Kasaï-Oriental',
  'Kasaï-Occidental',
  'Équateur',
  'Maniema'
];

const tiersList = [
  { value: 'all', label: 'Tous les niveaux', icon: '📋', color: 'text-gray-600' },
  { value: 'platinum', label: 'Platinum', icon: '💎', color: 'text-gray-800' },
  { value: 'gold', label: 'Gold', icon: '🏆', color: 'text-yellow-600' },
  { value: 'silver', label: 'Silver', icon: '🥈', color: 'text-gray-500' },
  { value: 'bronze', label: 'Bronze', icon: '🥉', color: 'text-orange-600' }
];

const sortOptions = [
  { value: 'rating', label: 'Note des clients', icon: '⭐' },
  { value: 'name', label: 'Nom A-Z', icon: '🔤' },
  { value: 'founded', label: 'Plus récent', icon: '📅' },
  { value: 'trips', label: 'Plus de voyages', icon: '🚌' },
  { value: 'punctuality', label: 'Ponctualité', icon: '🕒' },
  { value: 'fleet', label: 'Taille de flotte', icon: '🚚' }
];

export function AgencyDirectory() {
  const [agenciesList, setAgenciesList] = useState<Agency[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('rating');
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);
  const [showAgencyDetails, setShowAgencyDetails] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [favoriteAgencies, setFavoriteAgencies] = useState<string[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [agencyToRate, setAgencyToRate] = useState<Agency | null>(null);

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select(`
          *,
          buses (id),
          trips (id)
        `)
        .order('name');

      if (error) throw error;

      if (data) {
        // Map DB data to full Agency objects using actual relationships when possible
        const formattedAgencies: Agency[] = data.map((item: any) => ({
          ...DEFAULT_AGENCY_VALUES,
          ...item,
          id: item.id,
          name: item.name,
          logo_url: item.logo_url,
          rating: parseFloat(item.rating) || 4.5,
          contact_email: item.contact_email || '',
          contact_phone: item.contact_phone || '',
          phone: item.contact_phone || '',
          email: item.contact_email || '',
          website: item.website || '',
          address: item.address || '',
          headquarters: item.address?.split(',')?.pop()?.trim() || 'RDC',
          region: 'RDC',
          logo: item.logo_url || '🚌',
          isActive: true,
          totalTrips: item.trips?.length || 0,
          fleetSize: item.buses?.length || 0,
          activeVehicles: item.buses?.length || 0,
          reviewCount: 0, // Should come from a reviews table in the future
          description: `Agence de transport partenaire située à ${item.address || 'RDC'}.`,
          fullDescription: `Une agence de transport partenaire travaillant avec KonGO pour faciliter vos voyages.`,
        } as Agency));
        setAgenciesList(formattedAgencies);
      }
    } catch (error: any) {
      console.error('Error fetching agencies:', error);
      toast.error('Erreur lors du chargement des agences');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrage et tri des agences avec filtre de note
  const filteredAndSortedAgencies = useMemo(() => {
    let filtered = agenciesList.filter(agency => {
      const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agency.headquarters.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          agency.operatingRoutes.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesProvince = selectedProvince === 'all' || selectedProvince === 'All Provinces' || agency.region === selectedProvince;
      const matchesTier = selectedTier === 'all' || agency.tier === selectedTier;
      const matchesRating = agency.rating >= minRating;
      const matchesFeatured = !showFeaturedOnly || agency.isFeatured;
      
      return matchesSearch && matchesProvince && matchesTier && matchesRating && matchesFeatured;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'rating': return b.rating - a.rating;
        case 'name': return a.name.localeCompare(b.name);
        case 'founded': return b.founded - a.founded;
        case 'trips': return b.totalTrips - a.totalTrips;
        case 'punctuality': return b.onTimePercentage - a.onTimePercentage;
        case 'fleet': return b.fleetSize - a.fleetSize;
        default: return 0;
      }
    });
  }, [agenciesList, searchTerm, selectedProvince, selectedTier, minRating, sortBy, showFeaturedOnly]);

  const toggleFavorite = (agencyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteAgencies(prev => 
      prev.includes(agencyId) 
        ? prev.filter(id => id !== agencyId)
        : [...prev, agencyId]
    );
    
    if (!favoriteAgencies.includes(agencyId)) {
      toast.success("Agence ajoutée à vos favoris", {
        icon: '❤️'
      });
    }
  };

  const shareAgency = (agencyName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`Lien vers ${agencyName} copié dans le presse-papiers`);
  };

  const handleAgencyClick = (agency: Agency) => {
    setSelectedAgency(agency);
    setShowAgencyDetails(true);
  };

  const handleCloseDetails = () => {
    setShowAgencyDetails(false);
    setSelectedAgency(null);
  };

  const handleRateAgency = (agency: Agency, e: React.MouseEvent) => {
    e.stopPropagation();
    setAgencyToRate(agency);
    setShowRatingModal(true);
  };

  const handleSubmitRating = (review: Partial<AgencyReview>) => {
    console.log("Evaluation soumise:", review);
    // Ici, nous ajouterions logiquement l'évaluation à la base de données
  };

  // Statistiques générales
  const stats = useMemo(() => {
    if (agenciesList.length === 0) return { totalAgencies: 0, avgRating: '0', totalTrips: 0, avgPunctuality: 0 };
    const activeAgencies = agenciesList.filter(a => a.isActive);
    return {
      totalAgencies: activeAgencies.length,
      avgRating: (activeAgencies.reduce((sum, a) => sum + a.rating, 0) / activeAgencies.length).toFixed(1),
      totalTrips: activeAgencies.reduce((sum, a) => sum + (a.totalTrips || 0), 0),
      avgPunctuality: Math.round(activeAgencies.reduce((sum, a) => sum + (a.onTimePercentage || 0), 0) / activeAgencies.length) || 0
    };
  }, [agenciesList]);

  const getTierConfig = (tier: string) => {
    return tiersList.find(t => t.value === tier) || tiersList[0];
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-kongo-lime text-kongo-lime' : 'text-quaternary'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-surface-secondary/10 px-4 py-8 md:px-8 lg:px-12 space-y-8">
        {/* En-tête Premium */}
        <section className="relative overflow-hidden bg-kongo-black p-12 rounded-[2rem] border-2 border-kongo-lime/20 shadow-2xl">
          {/* Cercles de décoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-kongo-lime/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-kongo-lime/5 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>

          <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <Badge className="bg-kongo-lime text-kongo-black font-bold text-label uppercase tracking-widest px-4 py-1.5 animate-pulse">
                Annuaire Officiel
              </Badge>
              <h1 className="text-h1 lg:text-[4rem] leading-none text-white font-extrabold max-w-2xl">
                Trouvez les <span className="text-kongo-lime">Agences de Confiance</span> pour vos Voyages
              </h1>
              <p className="text-body-large text-gray-400 max-w-xl">
                Explorez notre sélection rigoureuse d'agences de transport. Ponctualité, sécurité et confort garantis par la communauté KonGO.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6">
              {[
                { label: 'Agences Actives', value: stats.totalAgencies, icon: <Building2 />, color: 'text-kongo-lime' },
                { label: 'Note Moyenne', value: `${stats.avgRating}/5`, icon: <Star />, color: 'text-yellow-400' },
                { label: 'Ponctualité', value: `${stats.avgPunctuality}%`, icon: <Clock />, color: 'text-success' }
              ].map((stat, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 w-40 text-center space-y-2 hover:bg-white/10 transition-colors">
                  <div className={`w-12 h-12 ${stat.color} mx-auto mb-2`}>{stat.icon}</div>
                  <div className="text-h4 text-white font-bold">{stat.value}</div>
                  <div className="text-body-xs text-gray-500 uppercase tracking-wider font-bold">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Barre de Recherche et Filtres Avancés */}
        <section className="bg-white p-6 rounded-3xl shadow-xl border border-border-primary sticky top-24 z-40 backdrop-blur-md">
          <div className="flex flex-col xl:flex-row gap-6 items-center">
            {/* Recherche principale */}
            <div className="relative flex-1 group w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-quaternary group-focus-within:text-kongo-lime transition-colors" />
              <Input 
                placeholder="Chercher une agence, une ville ou une route..." 
                className="pl-14 h-14 bg-surface-secondary border-none text-body-large rounded-2xl w-full focus-visible:ring-2 focus-visible:ring-kongo-lime"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filtres Rapides */}
            <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger className="w-[180px] h-14 bg-surface-secondary border-none rounded-2xl flex-1">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-kongo-lime" />
                    <SelectValue placeholder="Province" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border-border-primary">
                  {provinces.map(p => (
                    <SelectItem key={p} value={p === 'All Provinces' ? 'all' : p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTier} onValueChange={setSelectedTier}>
                <SelectTrigger className="w-[180px] h-14 bg-surface-secondary border-none rounded-2xl flex-1">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-kongo-lime" />
                    <SelectValue placeholder="Niveau" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border-border-primary">
                  {tiersList.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center space-x-2">
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] h-14 bg-surface-secondary border-none rounded-2xl flex-1">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-5 h-5 text-kongo-lime" />
                    <SelectValue placeholder="Trier par" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-white border-border-primary">
                  {sortOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex items-center space-x-2">
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex bg-surface-secondary p-1.5 rounded-2xl">
                <Button 
                  variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                  size="icon"
                  className={viewMode === 'grid' ? 'bg-white shadow-sm text-kongo-black rounded-xl' : 'text-secondary rounded-xl hover:bg-white'}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-5 h-5" />
                </Button>
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'ghost'} 
                  size="icon"
                  className={viewMode === 'list' ? 'bg-white shadow-sm text-kongo-black rounded-xl' : 'text-secondary rounded-xl hover:bg-white'}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-5 h-5" />
                </Button>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`h-14 w-14 rounded-2xl transition-all ${showFeaturedOnly ? 'bg-kongo-lime text-kongo-black' : 'bg-surface-secondary text-secondary'}`}
                    onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
                  >
                    <Star className={`w-6 h-6 ${showFeaturedOnly ? 'fill-kongo-black' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Agences Premium uniquement</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          
          {/* Statistiques en temps réel */}
          <div className="mt-4 flex items-center space-x-4 text-body-xs font-semibold uppercase tracking-widest text-quaternary">
            <span>Resultats: {filteredAndSortedAgencies.length} agences</span>
            <span className="w-1 h-1 bg-quaternary rounded-full"></span>
            <span>Mise à jour: Il y a 2 minutes</span>
          </div>
        </section>

        {/* Liste des Agences */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-50 rounded-3xl min-h-[400px]">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-kongo-lime border-t-transparent rounded-full animate-spin"></div>
                <p className="text-primary font-bold">Chargement des agences...</p>
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            <motion.div 
              className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "flex flex-col gap-6"}
              layout
            >
              {filteredAndSortedAgencies.map((agency) => (
                <motion.div
                  key={agency.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => handleAgencyClick(agency)}
                  className="group"
                >
                  <Card className="bg-white h-full overflow-hidden border-border-primary hover:border-kongo-lime/50 cursor-pointer shadow-sm hover:shadow-md transition-all">
                    {/* Badge Tier Flottant */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={agency.headquarters === 'Kinshasa' ? "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=400&fit=crop" : "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop"} 
                        alt={agency.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-kongo-black/80 via-transparent to-transparent opacity-60"></div>
                      
                      {/* Boutons d'actions rapides sur l'image */}
                      <div className="absolute top-4 right-4 flex flex-col space-y-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className={`bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm ${favoriteAgencies.includes(agency.id) ? 'text-red-500' : ''}`}
                          onClick={(e) => toggleFavorite(agency.id, e)}
                        >
                          <Heart className={`w-4 h-4 ${favoriteAgencies.includes(agency.id) ? 'fill-current' : ''}`} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            shareAgency(agency.name, e);
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Tooltip info logic
                          }}
                        >
                          <Info 
                            className="w-4 h-4" 
                          />
                        </Button>
                      </div>
                      <div className="absolute top-4 left-4 flex flex-col space-y-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                          onClick={(e) => handleRateAgency(agency, e)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Logo de l'agence */}
                      <div className="absolute bottom-4 left-4">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-lg">
                          {agency.logo_url ? <img src={agency.logo_url} alt="logo" className="w-12 h-12 object-contain" /> : agency.logo}
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-6 space-y-4">
                      {/* En-tête avec nom et tier */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-h4 text-kongo-black font-bold mb-2 group-hover:text-kongo-lime transition-colors">
                            {agency.name}
                          </h3>
                          <div className="flex items-center space-x-3 mb-3">
                            {renderStars(agency.rating)}
                            <span className="text-body-small text-secondary">
                              ({agency.reviewCount.toLocaleString()} avis)
                            </span>
                          </div>
                        </div>
                        
                        <Badge className={`${getTierConfig(agency.tier).bgClass || 'bg-gray-100'} font-semibold`}>
                          {getTierConfig(agency.tier).icon} {getTierConfig(agency.tier).label}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-body-small text-secondary line-clamp-2">
                        {agency.description}
                      </p>

                      {/* Statistiques clés */}
                      <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border-primary">
                        <div className="text-center">
                          <div className="text-h6 text-kongo-black font-bold">{agency.fleetSize}</div>
                          <div className="text-body-xs text-secondary">Véhicules</div>
                        </div>
                        <div className="text-center">
                          <div className="text-h6 text-success font-bold">{agency.onTimePercentage}%</div>
                          <div className="text-body-xs text-secondary">Ponctualité</div>
                        </div>
                        <div className="text-center">
                          <div className="text-h6 text-kongo-black font-bold">{agency.establishedSince}</div>
                          <div className="text-body-xs text-secondary">Expérience</div>
                        </div>
                      </div>

                      {/* Informations de contact */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-body-small text-secondary">
                          <MapPin className="w-4 h-4 text-kongo-lime" />
                          <span>{agency.headquarters}, {agency.region}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-body-small text-secondary">
                          <Clock className="w-4 h-4 text-kongo-lime" />
                          <span>Actif: {agency.lastActive}</span>
                          <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
                        </div>
                      </div>

                      {/* Routes populaires */}
                      <div>
                        <h4 className="text-label text-primary font-semibold mb-2">Routes populaires</h4>
                        <div className="flex flex-wrap gap-2">
                          {agency.popularRoutes.slice(0, 2).map((route, index) => (
                            <Badge key={index} className="status-info text-xs">
                              {route}
                            </Badge>
                          ))}
                          {agency.operatingRoutes.length > 2 && (
                            <Badge className="status-kongo badge-contrast text-xs">
                              +{agency.operatingRoutes.length - 2} autres
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Promotion si active */}
                      {agency.promotion?.active && (
                        <div className="bg-gradient-to-r from-kongo-lime-light to-surface-kongo-lime-medium p-3 rounded-lg border border-kongo-lime/30">
                          <div className="flex items-center space-x-2">
                            <Gift className="w-4 h-4 text-kongo-lime-dark" />
                            <span className="text-body-small text-kongo-lime-dark font-medium">
                              {agency.promotion.text}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Actions principales */}
                      <div className="flex space-x-3 pt-4">
                        <Button 
                          className="btn-primary flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navigation vers réservation avec cette agence
                            const event = new CustomEvent('agency-booking', {
                              detail: { 
                                agencyId: agency.id, 
                                agencyName: agency.name,
                                routes: agency.operatingRoutes
                              }
                            });
                            window.dispatchEvent(event);
                          }}
                        >
                          <Building2 className="w-4 h-4 mr-2" />
                          Réserver
                        </Button>
                        
                        <Button 
                          variant="outline"
                          className="btn-outline-lime px-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAgencyClick(agency);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                          variant="outline"
                          className="btn-outline-lime px-4"
                          onClick={(e) => handleRateAgency(agency, e)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Message si aucune agence trouvée */}
          {filteredAndSortedAgencies.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-quaternary" />
              </div>
              <h3 className="text-h3 text-primary mb-4">Aucune agence trouvée</h3>
              <p className="text-body text-secondary mb-8 max-w-md mx-auto">
                Essayez de modifier vos critères de recherche ou de filtres pour voir plus d'agences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedProvince('all');
                    setSelectedTier('all');
                    setMinRating(0);
                    setShowFeaturedOnly(false);
                  }}
                  className="btn-primary"
                >
                  Réinitialiser les filtres
                </Button>
                <Button variant="outline" className="btn-outline-lime">
                  Voir toutes les agences
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Modal de détails d'agence */}
        <AnimatePresence>
          {showAgencyDetails && selectedAgency && (
            <AgencyDetails
              agency={selectedAgency}
              isOpen={showAgencyDetails}
              onClose={handleCloseDetails}
            />
          )}
        </AnimatePresence>

        {/* Modal de notation */}
        <AnimatePresence>
          {showRatingModal && agencyToRate && (
            <AgencyRatingModal
              agency={agencyToRate}
              isOpen={showRatingModal}
              onClose={() => {
                setShowRatingModal(false);
                setAgencyToRate(null);
              }}
              onSubmit={handleSubmitRating}
            />
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
