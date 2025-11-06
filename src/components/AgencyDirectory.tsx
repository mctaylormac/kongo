import React, { useState, useMemo } from 'react';
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
import { toast } from 'sonner@2.0.3';

// Enhanced mock data avec notes et évaluations
const mockAgencies = [
  {
    id: '1',
    name: 'Express Premium',
    tier: 'platinum',
    rating: 4.8,
    reviewCount: 2450,
    totalTrips: 15250,
    founded: 2018,
    headquarters: 'Kinshasa',
    region: 'Kinshasa',
    operatingRoutes: ['Kinshasa-Lubumbashi', 'Kinshasa-Goma', 'Lubumbashi-Kolwezi', 'Kinshasa-Mbuji-Mayi'],
    popularRoutes: ['Kinshasa-Lubumbashi', 'Kinshasa-Goma'],
    phone: '+243 81 234 5678',
    email: 'contact@expresspremium.cd',
    website: 'www.expresspremium.cd',
    logo: '🏢',
    coverImage: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=400&fit=crop',
    description: 'Leader du transport premium en RDC avec des véhicules climatisés et un service 5 étoiles.',
    fullDescription: 'Express Premium révolutionne le transport interprovincial en RDC avec une flotte moderne de véhicules premium, un service client exceptionnel et des standards de sécurité internationaux.',
    amenities: ['Wi-Fi gratuit', 'Climatisation', 'Sièges inclinables', 'Collation incluse', 'Prises USB', 'Divertissement'],
    safetyRating: 5,
    onTimePercentage: 92,
    fleetSize: 45,
    activeVehicles: 32,
    certifications: ['ISO 9001:2015', 'Sécurité Transport RDC', 'Service Excellence'],
    awards: ['Meilleure Agence 2023', 'Prix Qualité Client'],
    establishedSince: '6 ans',
    monthlyTrips: 1200,
    specialties: ['Transport VIP', 'Voyages d\'affaires', 'Groupes'],
    operatingHours: '24/7',
    languages: ['Français', 'Lingala', 'Anglais'],
    paymentMethods: ['Cash', 'Mobile Money', 'Carte bancaire'],
    features: ['GPS Tracking', 'Assurance voyage', 'Support 24/7'],
    promotion: {
      active: true,
      text: '15% de réduction sur le premier voyage',
      code: 'WELCOME15'
    },
    isActive: true,
    isFeatured: true,
    isVerified: true,
    lastActive: '2 min',
    responseTime: '< 5 min',
    // Nouveaux champs pour les évaluations
    ratingBreakdown: {
      5: 72, // 72% de notes 5 étoiles
      4: 18,
      3: 7,
      2: 2,
      1: 1
    },
    averageRatings: {
      punctuality: 4.9,
      comfort: 4.7,
      safety: 4.8,
      value: 4.6,
      staff: 4.8
    },
    recentReviews: [
      {
        id: 'rev-1',
        userId: 'user-1',
        userName: 'Marie K.',
        userAvatar: '/api/placeholder/40/40',
        rating: 5,
        date: new Date('2024-01-20'),
        title: 'Service exceptionnel',
        comment: 'Voyage parfait de Kinshasa à Lubumbashi. Personnel très professionnel, véhicule impeccable et ponctualité respectée.',
        helpful: 24,
        categories: {
          punctuality: 5,
          comfort: 5,
          safety: 5,
          value: 4,
          staff: 5
        },
        verified: true,
        photos: ['/api/placeholder/300/200']
      },
      {
        id: 'rev-2',
        userId: 'user-2',
        userName: 'Jean-Paul M.',
        userAvatar: '/api/placeholder/40/40',
        rating: 4,
        date: new Date('2024-01-18'),
        title: 'Très bon service',
        comment: 'Confortable et sûr. Petit retard au départ mais rattrapé en route. Je recommande.',
        helpful: 12,
        categories: {
          punctuality: 4,
          comfort: 5,
          safety: 5,
          value: 4,
          staff: 4
        },
        verified: true
      }
    ]
  },
  {
    id: '2',
    name: 'Congo Voyages',
    tier: 'gold',
    rating: 4.5,
    reviewCount: 1890,
    totalTrips: 12980,
    founded: 2015,
    headquarters: 'Lubumbashi',
    region: 'Katanga',
    operatingRoutes: ['Lubumbashi-Kinshasa', 'Lubumbashi-Kolwezi', 'Lubumbashi-Kalemie', 'Lubumbashi-Likasi'],
    popularRoutes: ['Lubumbashi-Kinshasa', 'Lubumbashi-Kolwezi'],
    phone: '+243 82 345 6789',
    email: 'info@congovoyages.cd',
    website: 'www.congovoyages.cd',
    logo: '🚌',
    coverImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&h=400&fit=crop',
    description: 'Spécialiste des liaisons vers le Katanga avec une flotte moderne et fiable.',
    fullDescription: 'Congo Voyages connecte le Katanga au reste du pays avec une expertise locale inégalée et un service de qualité.',
    amenities: ['Climatisation', 'Sièges confortables', 'Service client 24/7', 'Bagages sécurisés'],
    safetyRating: 4,
    onTimePercentage: 88,
    fleetSize: 32,
    activeVehicles: 28,
    certifications: ['Transport Sécurisé', 'Licence Provinciale'],
    awards: ['Partenaire de Confiance'],
    establishedSince: '9 ans',
    monthlyTrips: 850,
    specialties: ['Transport régional', 'Marchandises'],
    operatingHours: '06:00 - 22:00',
    languages: ['Français', 'Swahili'],
    paymentMethods: ['Cash', 'Mobile Money'],
    features: ['Tracking GPS', 'Assurance'],
    promotion: {
      active: false,
      text: '',
      code: ''
    },
    isActive: true,
    isFeatured: false,
    isVerified: true,
    lastActive: '15 min',
    responseTime: '< 10 min',
    ratingBreakdown: {
      5: 58,
      4: 28,
      3: 10,
      2: 3,
      1: 1
    },
    averageRatings: {
      punctuality: 4.4,
      comfort: 4.3,
      safety: 4.6,
      value: 4.7,
      staff: 4.5
    },
    recentReviews: [
      {
        id: 'rev-3',
        userId: 'user-3',
        userName: 'Fatou D.',
        userAvatar: '/api/placeholder/40/40',
        rating: 5,
        date: new Date('2024-01-19'),
        title: 'Parfait pour Katanga',
        comment: 'Excellente connaissance des routes du Katanga. Voyage confortable et sécurisé.',
        helpful: 8,
        categories: {
          punctuality: 4,
          comfort: 4,
          safety: 5,
          value: 5,
          staff: 5
        },
        verified: true
      }
    ]
  },
  // ... autres agences avec structure similaire
];

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
  agency: typeof mockAgencies[0];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (review: Partial<AgencyReview>) => void;
}

// Composant modal de notation
function AgencyRatingModal({ agency, isOpen, onClose, onSubmit }: RatingModalProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState({
    punctuality: 0,
    comfort: 0,
    safety: 0,
    value: 0,
    staff: 0
  });
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  const categories = [
    { key: 'punctuality', label: 'Ponctualité', icon: '⏰' },
    { key: 'comfort', label: 'Confort', icon: '💺' },
    { key: 'safety', label: 'Sécurité', icon: '🛡️' },
    { key: 'value', label: 'Rapport qualité/prix', icon: '💰' },
    { key: 'staff', label: 'Personnel', icon: '👥' }
  ];

  const handleCategoryRating = (category: string, rating: number) => {
    setCategoryRatings(prev => ({ ...prev, [category]: rating }));
  };

  const handleSubmit = () => {
    if (overallRating === 0) {
      toast.error("Veuillez donner une note globale");
      return;
    }
    if (!title.trim()) {
      toast.error("Veuillez ajouter un titre à votre avis");
      return;
    }
    if (!comment.trim()) {
      toast.error("Veuillez ajouter un commentaire");
      return;
    }

    const review: Partial<AgencyReview> = {
      rating: overallRating,
      title: title.trim(),
      comment: comment.trim(),
      categories: categoryRatings,
      date: new Date(),
      verified: true,
      helpful: 0
    };

    onSubmit(review);
    onClose();
    
    toast.success("🎉 Évaluation publiée avec succès !", {
      description: "Merci pour votre retour, cela aide les autres voyageurs"
    });

    // Reset form
    setOverallRating(0);
    setHoveredRating(0);
    setCategoryRatings({ punctuality: 0, comfort: 0, safety: 0, value: 0, staff: 0 });
    setTitle('');
    setComment('');
    setPhotos([]);
  };

  const renderStars = (rating: number, onRate?: (rating: number) => void, hoverable = false) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate?.(star)}
            onMouseEnter={() => hoverable && setHoveredRating(star)}
            onMouseLeave={() => hoverable && setHoveredRating(0)}
            className={`transition-all duration-150 ${onRate ? 'cursor-pointer hover:scale-110' : ''}`}
            disabled={!onRate}
          >
            <StarIcon
              className={`w-8 h-8 transition-colors ${
                star <= (hoverable ? (hoveredRating || rating) : rating)
                  ? 'text-kongo-lime fill-kongo-lime'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-h3 text-kongo-black">
            ⭐ Évaluez {agency.name}
          </DialogTitle>
          <DialogDescription className="text-body text-secondary">
            Votre avis aide des milliers de voyageurs à faire le bon choix
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {/* Note globale */}
          <div className="text-center space-y-4">
            <h3 className="text-h5 text-primary font-semibold">Note globale</h3>
            <div className="flex justify-center">
              {renderStars(overallRating, setOverallRating, true)}
            </div>
            <p className="text-body-small text-secondary">
              {overallRating === 0 && "Cliquez pour noter"}
              {overallRating === 1 && "Très décevant"}
              {overallRating === 2 && "Décevant"}
              {overallRating === 3 && "Correct"}
              {overallRating === 4 && "Très bien"}
              {overallRating === 5 && "Excellent"}
            </p>
          </div>

          <Separator />

          {/* Notes par catégorie */}
          <div className="space-y-6">
            <h3 className="text-h6 text-primary font-semibold">Évaluez chaque aspect</h3>
            {categories.map((category) => (
              <div key={category.key} className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.icon}</span>
                  <span className="text-label text-primary font-medium">{category.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleCategoryRating(category.key, star)}
                      className="transition-all duration-150 cursor-pointer hover:scale-110"
                    >
                      <StarIcon
                        className={`w-6 h-6 transition-colors ${
                          star <= categoryRatings[category.key as keyof typeof categoryRatings]
                            ? 'text-kongo-lime fill-kongo-lime'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Titre et commentaire */}
          <div className="space-y-4">
            <div>
              <label className="text-label text-primary font-medium block mb-2">
                Titre de votre avis
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Résumez votre expérience en quelques mots"
                className="h-12"
                maxLength={100}
              />
            </div>

            <div>
              <label className="text-label text-primary font-medium block mb-2">
                Votre commentaire détaillé
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Partagez votre expérience : ponctualité, confort, personnel, propreté..."
                rows={5}
                className="resize-none"
                maxLength={500}
              />
              <div className="flex justify-between mt-2">
                <span className="text-body-xs text-tertiary">
                  Aidez les autres voyageurs avec un avis constructif
                </span>
                <span className="text-body-xs text-secondary">
                  {comment.length}/500
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-border-primary">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="btn-ghost"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              className="btn-primary"
              disabled={overallRating === 0 || !title.trim() || !comment.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Publier mon avis
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Composant d'affichage des évaluations
function AgencyReviews({ agency }: { agency: typeof mockAgencies[0] }) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [filterRating, setFilterRating] = useState(0);

  const filteredReviews = agency.recentReviews?.filter(review => 
    filterRating === 0 || review.rating === filterRating
  ) || [];

  const displayedReviews = showAllReviews ? filteredReviews : filteredReviews.slice(0, 3);

  const renderStars = (rating: number) => (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? 'text-kongo-lime fill-kongo-lime' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Statistiques des notes */}
      <div className="bg-surface-secondary p-6 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Note moyenne */}
          <div className="text-center">
            <div className="text-display-1 text-kongo-black font-bold mb-2">
              {agency.rating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-3">
              {renderStars(Math.round(agency.rating))}
            </div>
            <p className="text-body text-secondary">
              Basé sur {agency.reviewCount.toLocaleString()} avis
            </p>
          </div>

          {/* Répartition des notes */}
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((stars) => (
              <div key={stars} className="flex items-center space-x-3">
                <span className="text-body-small text-secondary font-medium w-8">
                  {stars}★
                </span>
                <div className="flex-1 bg-surface-primary rounded-full h-2">
                  <div 
                    className="bg-kongo-lime h-2 rounded-full transition-all duration-500"
                    style={{ width: `${agency.ratingBreakdown?.[stars as keyof typeof agency.ratingBreakdown] || 0}%` }}
                  />
                </div>
                <span className="text-body-small text-secondary w-12">
                  {agency.ratingBreakdown?.[stars as keyof typeof agency.ratingBreakdown] || 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes détaillées par catégorie */}
        {agency.averageRatings && (
          <div className="mt-8 pt-6 border-t border-border-primary">
            <h4 className="text-h6 text-primary font-semibold mb-4">Évaluations détaillées</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { key: 'punctuality', label: 'Ponctualité', icon: '⏰' },
                { key: 'comfort', label: 'Confort', icon: '💺' },
                { key: 'safety', label: 'Sécurité', icon: '🛡️' },
                { key: 'value', label: 'Prix', icon: '💰' },
                { key: 'staff', label: 'Personnel', icon: '👥' }
              ].map((category) => (
                <div key={category.key} className="text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <div className="text-h6 text-kongo-black font-bold">
                    {agency.averageRatings[category.key as keyof typeof agency.averageRatings].toFixed(1)}
                  </div>
                  <div className="text-body-xs text-secondary">{category.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filtres des avis */}
      <div className="flex items-center justify-between">
        <h3 className="text-h5 text-primary font-semibold">
          Avis des voyageurs ({filteredReviews.length})
        </h3>
        <div className="flex items-center space-x-2">
          <Select value={filterRating.toString()} onValueChange={(value) => setFilterRating(Number(value))}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par note" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Toutes les notes</SelectItem>
              {[5, 4, 3, 2, 1].map((rating) => (
                <SelectItem key={rating} value={rating.toString()}>
                  {rating} étoile{rating > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="space-y-6">
        {displayedReviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-elevated p-6 rounded-xl border border-border-primary"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-kongo-lime to-kongo-lime-light rounded-full flex items-center justify-center font-bold text-kongo-black">
                {review.userName.charAt(0)}
              </div>

              <div className="flex-1 space-y-3">
                {/* En-tête de l'avis */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-label text-primary font-semibold">
                        {review.userName}
                      </span>
                      {review.verified && (
                        <Badge className="status-kongo">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Voyage vérifié
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-3 mt-1">
                      {renderStars(review.rating)}
                      <span className="text-body-small text-secondary">
                        {review.date.toLocaleDateString('fr-FR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-body-small text-secondary">
                      {review.helpful} 👍
                    </span>
                    <Button size="sm" variant="ghost" className="text-secondary hover:text-primary">
                      <ThumbsUp className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Contenu de l'avis */}
                <div>
                  <h4 className="text-label text-primary font-semibold mb-2">
                    {review.title}
                  </h4>
                  <p className="text-body text-secondary leading-relaxed">
                    {review.comment}
                  </p>
                </div>

                {/* Notes détaillées */}
                <div className="flex flex-wrap gap-3 pt-3 border-t border-border-primary">
                  {[
                    { key: 'punctuality', label: 'Ponctualité', icon: '⏰' },
                    { key: 'comfort', label: 'Confort', icon: '💺' },
                    { key: 'safety', label: 'Sécurité', icon: '🛡️' },
                    { key: 'value', label: 'Prix', icon: '💰' },
                    { key: 'staff', label: 'Personnel', icon: '👥' }
                  ].map((category) => (
                    <div key={category.key} className="flex items-center space-x-2 bg-surface-secondary px-3 py-1 rounded-full">
                      <span className="text-sm">{category.icon}</span>
                      <span className="text-body-xs text-secondary">{category.label}</span>
                      <div className="flex items-center">
                        {renderStars(review.categories[category.key as keyof typeof review.categories])}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Photos si disponibles */}
                {review.photos && review.photos.length > 0 && (
                  <div className="flex space-x-2 pt-3">
                    {review.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-border-primary"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bouton voir plus */}
      {filteredReviews.length > 3 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="btn-outline-lime"
          >
            {showAllReviews ? 'Voir moins' : `Voir tous les avis (${filteredReviews.length})`}
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showAllReviews ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      )}
    </div>
  );
}

const provincesList = [
  'Toutes',
  'Kinshasa',
  'Katanga', 
  'Nord-Kivu',
  'Sud-Kivu',
  'Kasaï-Oriental',
  'Kasaï-Occidental',
  'Équateur',
  'Bas-Congo',
  'Orientale',
  'Bandundu',
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
  { value: 'punctuality', label: 'Ponctualité', icon: '⏰' },
  { value: 'fleet', label: 'Taille de flotte', icon: '🚛' }
];

export function AgencyDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [minRating, setMinRating] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('rating');
  const [selectedAgency, setSelectedAgency] = useState<typeof mockAgencies[0] | null>(null);
  const [showAgencyDetails, setShowAgencyDetails] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [favoriteAgencies, setFavoriteAgencies] = useState<string[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [agencyToRate, setAgencyToRate] = useState<typeof mockAgencies[0] | null>(null);

  // Filtrage et tri des agences avec filtre de note
  const filteredAndSortedAgencies = useMemo(() => {
    let filtered = mockAgencies.filter(agency => {
      const matchesSearch = agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agency.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agency.headquarters.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agency.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agency.operatingRoutes.some(route => route.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesProvince = selectedProvince === 'all' || 
                             agency.region.toLowerCase().includes(selectedProvince.toLowerCase()) ||
                             selectedProvince === 'Toutes';
      
      const matchesTier = selectedTier === 'all' || agency.tier === selectedTier;
      const matchesRating = agency.rating >= minRating;
      const matchesFeatured = !showFeaturedOnly || agency.isFeatured;
      
      return matchesSearch && matchesProvince && matchesTier && matchesRating && matchesFeatured && agency.isActive;
    });

    // Tri des agences
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'founded':
          return b.founded - a.founded;
        case 'trips':
          return b.totalTrips - a.totalTrips;
        case 'punctuality':
          return b.onTimePercentage - a.onTimePercentage;
        case 'fleet':
          return b.fleetSize - a.fleetSize;
        default:
          return 0;
      }
    });

    // Mettre les agences featured en premier
    if (sortBy === 'rating') {
      filtered.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.rating - a.rating;
      });
    }

    return filtered;
  }, [searchTerm, selectedProvince, selectedTier, minRating, sortBy, showFeaturedOnly]);

  // Statistiques générales
  const stats = useMemo(() => {
    const activeAgencies = mockAgencies.filter(a => a.isActive);
    return {
      totalAgencies: activeAgencies.length,
      avgRating: (activeAgencies.reduce((sum, a) => sum + a.rating, 0) / activeAgencies.length).toFixed(1),
      totalTrips: activeAgencies.reduce((sum, a) => sum + a.totalTrips, 0),
      avgPunctuality: Math.round(activeAgencies.reduce((sum, a) => sum + a.onTimePercentage, 0) / activeAgencies.length)
    };
  }, []);

  const getTierConfig = (tier: string) => {
    const config = tiersList.find(t => t.value === tier) || tiersList[0];
    return {
      ...config,
      bgClass: tier === 'platinum' ? 'bg-gray-800 text-white' :
              tier === 'gold' ? 'bg-yellow-500 text-white' :
              tier === 'silver' ? 'bg-gray-400 text-white' :
              tier === 'bronze' ? 'bg-orange-600 text-white' :
              'bg-gray-200 text-gray-800'
    };
  };

  const handleAgencyClick = (agency: typeof mockAgencies[0]) => {
    setSelectedAgency(agency);
    setShowAgencyDetails(true);
  };

  const handleCloseDetails = () => {
    setShowAgencyDetails(false);
    setSelectedAgency(null);
  };

  const toggleFavorite = (agencyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavoriteAgencies(prev => 
      prev.includes(agencyId) 
        ? prev.filter(id => id !== agencyId)
        : [...prev, agencyId]
    );
  };

  const handleRateAgency = (agency: typeof mockAgencies[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setAgencyToRate(agency);
    setShowRatingModal(true);
  };

  const handleSubmitRating = (review: Partial<AgencyReview>) => {
    // Dans une vraie application, ceci serait envoyé à l'API
    console.log('Nouvelle évaluation:', review);
    toast.success("Merci pour votre évaluation !", {
      description: "Votre avis aide la communauté KonGO"
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    return (
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`${sizeClass} transition-colors ${
              star <= rating ? 'text-kongo-lime fill-kongo-lime' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-body-small text-kongo-black font-semibold">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-surface-primary">
        <div className="container-professional py-8 sm:py-12">
          
          {/* Enhanced Header avec statistiques */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center space-x-2 bg-surface-kongo-lime-light px-4 py-2 rounded-full mb-6">
              <div className="w-2 h-2 bg-kongo-lime rounded-full animate-pulse"></div>
              <span className="text-caption text-kongo-lime-dark font-semibold">
                {stats.totalAgencies} AGENCES CERTIFIÉES ⭐
              </span>
            </div>

            <h1 className="text-display-1 text-kongo-black mb-4">
              Réseau d'Agences
              <span className="text-kongo-lime"> Évaluées</span>
            </h1>

            <p className="text-body-large text-secondary max-w-3xl mx-auto mb-8">
              Découvrez nos partenaires de confiance évalués par la communauté KonGO. 
              Qualité garantie, notes vérifiées.
            </p>
            
            {/* Métriques générales */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
              <div className="bg-surface-elevated p-4 rounded-lg border border-border-primary">
                <div className="text-h3 text-kongo-black font-bold">{stats.totalAgencies}</div>
                <div className="text-body-small text-secondary">Agences Partenaires</div>
              </div>
              <div className="bg-surface-elevated p-4 rounded-lg border border-border-primary">
                <div className="text-h3 text-kongo-lime-dark font-bold">{stats.avgRating} ⭐</div>
                <div className="text-body-small text-secondary">Note Moyenne</div>
              </div>
              <div className="bg-surface-elevated p-4 rounded-lg border border-border-primary">
                <div className="text-h3 text-kongo-black font-bold">{(stats.totalTrips / 1000).toFixed(0)}K+</div>
                <div className="text-body-small text-secondary">Voyages Notés</div>
              </div>
              <div className="bg-surface-elevated p-4 rounded-lg border border-border-primary">
                <div className="text-h3 text-color-success font-bold">{stats.avgPunctuality}%</div>
                <div className="text-body-small text-secondary">Satisfaction</div>
              </div>
            </div>
          </motion.div>

          {/* Filtres avec filtre de note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="card-elevated p-6 mb-8"
          >
            <div className="space-y-6">
              {/* Barre de recherche principale */}
              <div>
                <label className="text-label text-primary font-medium block mb-3">
                  🔍 Rechercher une agence
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-quaternary" />
                  <Input
                    type="text"
                    placeholder="Nom d'agence, ville, route (ex: Express, Kinshasa, Lubumbashi)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-14 text-body border-border-secondary focus:border-kongo-lime focus:ring-2 focus:ring-kongo-lime/20 rounded-lg"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-quaternary hover:text-primary"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Filtres en ligne avec filtre de note */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="text-label text-primary font-medium block mb-2">
                    📍 Région
                  </label>
                  <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger className="h-12 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime">
                      <SelectValue placeholder="Toutes les régions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les régions</SelectItem>
                      {provincesList.filter(p => p !== 'Toutes').map((province) => (
                        <SelectItem key={province} value={province.toLowerCase()}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-label text-primary font-medium block mb-2">
                    🏆 Niveau de Service
                  </label>
                  <Select value={selectedTier} onValueChange={setSelectedTier}>
                    <SelectTrigger className="h-12 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime">
                      <SelectValue placeholder="Tous les niveaux" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiersList.map((tier) => (
                        <SelectItem key={tier.value} value={tier.value}>
                          <div className="flex items-center space-x-2">
                            <span>{tier.icon}</span>
                            <span>{tier.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Nouveau filtre de note */}
                <div>
                  <label className="text-label text-primary font-medium block mb-2">
                    ⭐ Note minimum
                  </label>
                  <Select value={minRating.toString()} onValueChange={(value) => setMinRating(Number(value))}>
                    <SelectTrigger className="h-12 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime">
                      <SelectValue placeholder="Toutes les notes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Toutes les notes</SelectItem>
                      <SelectItem value="4.5">4.5+ ⭐⭐⭐⭐⭐</SelectItem>
                      <SelectItem value="4.0">4.0+ ⭐⭐⭐⭐</SelectItem>
                      <SelectItem value="3.5">3.5+ ⭐⭐⭐</SelectItem>
                      <SelectItem value="3.0">3.0+ ⭐⭐</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-label text-primary font-medium block mb-2">
                    📊 Trier par
                  </label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-12 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime">
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center space-x-2">
                            <span>{option.icon}</span>
                            <span>{option.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-label text-primary font-medium block mb-2">
                    👁️ Affichage
                  </label>
                  <div className="flex space-x-2 h-12">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="flex-1 h-full btn-ghost"
                    >
                      <Grid className="w-4 h-4 mr-2" />
                      Grille
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="flex-1 h-full btn-ghost"
                    >
                      <List className="w-4 h-4 mr-2" />
                      Liste
                    </Button>
                  </div>
                </div>
              </div>

              {/* Résultats et options */}
              <div className="flex items-center justify-between pt-4 border-t border-border-primary">
                <div className="flex items-center space-x-4">
                  <span className="text-body text-secondary">
                    <strong>{filteredAndSortedAgencies.length}</strong> agence{filteredAndSortedAgencies.length > 1 ? 's' : ''} trouvée{filteredAndSortedAgencies.length > 1 ? 's' : ''}
                  </span>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showFeaturedOnly}
                      onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                      className="rounded border-border-secondary text-kongo-lime focus:ring-kongo-lime"
                    />
                    <span className="text-body-small text-secondary">
                      ⭐ Partenaires premium uniquement
                    </span>
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge className="status-success">
                    <div className="w-2 h-2 bg-color-success rounded-full animate-pulse mr-2"></div>
                    {mockAgencies.filter(a => a.isActive).length} en ligne
                  </Badge>
                  
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-5 h-5 text-quaternary hover:text-kongo-lime cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-body-small">
                        Cliquez sur une agence pour voir tous ses détails, évaluations clients et effectuer une réservation directe.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Affichage des agences avec notes */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${viewMode}-${filteredAndSortedAgencies.length}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
                : "space-y-4"}
            >
              {filteredAndSortedAgencies.map((agency, index) => (
                <motion.div
                  key={agency.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card 
                    className="card-interactive group relative overflow-hidden cursor-pointer"
                    onClick={() => handleAgencyClick(agency)}
                  >
                    {/* Image de couverture */}
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={agency.coverImage} 
                        alt={agency.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Badges superposés */}
                      <div className="absolute top-4 left-4 flex flex-col space-y-2">
                        {agency.isFeatured && (
                          <Badge className="status-kongo">
                            <Star className="w-3 h-3 mr-1 fill-current" />
                            Partenaire Premium
                          </Badge>
                        )}
                        {agency.isVerified && (
                          <Badge className="status-success">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Vérifié
                          </Badge>
                        )}
                      </div>

                      {/* Actions rapides */}
                      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                          onClick={(e) => toggleFavorite(agency.id, e)}
                        >
                          <Heart 
                            className={`w-4 h-4 ${
                              favoriteAgencies.includes(agency.id) 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-white'
                            }`} 
                          />
                        </Button>
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
                          {agency.logo}
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
                        
                        <Badge className={`${getTierConfig(agency.tier).bgClass} font-semibold`}>
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
                            <Badge className="status-kongo text-xs">
                              +{agency.operatingRoutes.length - 2} autres
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Promotion si active */}
                      {agency.promotion.active && (
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
          {filteredAndSortedAgencies.length === 0 && (
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