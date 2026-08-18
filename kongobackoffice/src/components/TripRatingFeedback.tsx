import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star,
  MessageSquare,
  Truck,
  Building2,
  Clock,
  Shield,
  Zap,
  Camera,
  Send,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Label } from "./ui/label";
import { toast } from "sonner";

interface TripData {
  id: string;
  from: string;
  to: string;
  date: string;
  agency: {
    id: string;
    name: string;
    logo?: string;
  };
  driver: {
    id: string;
    name: string;
    photo?: string;
    experience?: string;
  };
  vehicle: {
    number: string;
    type: string;
  };
  duration: string;
  price: number;
  status: 'completed' | 'in-progress' | 'cancelled';
}

interface RatingCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  rating: number;
}

interface TripRatingFeedbackProps {
  trip: TripData;
  onSubmit?: (feedback: {
    agencyRating: number;
    driverRating: number;
    categories: RatingCategory[];
    comment: string;
    wouldRecommend: boolean;
    photos?: File[];
  }) => void;
  onClose?: () => void;
  initialRatings?: {
    agency?: number;
    driver?: number;
    categories?: { [key: string]: number };
    comment?: string;
  };
  isReadOnly?: boolean;
  className?: string;
}

export function TripRatingFeedback({
  trip,
  onSubmit,
  onClose,
  initialRatings,
  isReadOnly = false,
  className = ""
}: TripRatingFeedbackProps) {
  const [agencyRating, setAgencyRating] = useState(initialRatings?.agency || 0);
  const [driverRating, setDriverRating] = useState(initialRatings?.driver || 0);
  const [comment, setComment] = useState(initialRatings?.comment || "");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<{ type: string; rating: number } | null>(null);

  const [categories, setCategories] = useState<RatingCategory[]>([
    {
      id: 'punctuality',
      label: 'Ponctualité',
      icon: Clock,
      description: 'Respect des horaires de départ et arrivée',
      rating: initialRatings?.categories?.punctuality || 0
    },
    {
      id: 'comfort',
      label: 'Confort',
      icon: Shield,
      description: 'Qualité des sièges et du véhicule',
      rating: initialRatings?.categories?.comfort || 0
    },
    {
      id: 'safety',
      label: 'Sécurité',
      icon: Shield,
      description: 'Conduite sécurisée et respect du code',
      rating: initialRatings?.categories?.safety || 0
    },
    {
      id: 'service',
      label: 'Service',
      icon: Zap,
      description: 'Qualité de l\'accueil et du service',
      rating: initialRatings?.categories?.service || 0
    }
  ]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + photos.length > 5) {
      toast.warning("Maximum 5 photos autorisées");
      return;
    }
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const updateCategoryRating = (categoryId: string, rating: number) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, rating } : cat
    ));
  };

  const getStarColor = (type: string, index: number, currentRating: number) => {
    const rating = hoveredStar?.type === type ? hoveredStar.rating : currentRating;
    return index <= rating ? "text-kongo-lime" : "text-gray-300";
  };

  const getRatingLabel = (rating: number) => {
    if (rating === 0) return "Non évalué";
    if (rating <= 1) return "Très décevant";
    if (rating <= 2) return "Décevant";
    if (rating <= 3) return "Correct";
    if (rating <= 4) return "Bon";
    return "Excellent";
  };

  const handleSubmit = async () => {
    if (agencyRating === 0 || driverRating === 0) {
      toast.error("Veuillez évaluer l'agence et le chauffeur");
      return;
    }

    if (wouldRecommend === null) {
      toast.error("Veuillez indiquer si vous recommanderiez ce service");
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulation API

      onSubmit?.({
        agencyRating,
        driverRating,
        categories,
        comment,
        wouldRecommend,
        photos
      });

      setIsSubmitted(true);
      
      toast.success("🙏 Merci pour votre évaluation !", {
        description: "Votre retour nous aide à améliorer nos services",
        duration: 5000,
        action: {
          label: "Voir mes voyages",
          onClick: () => {
            // Navigation vers dashboard
          }
        }
      });

      // Auto-close after success
      setTimeout(() => {
        onClose?.();
      }, 3000);

    } catch (error) {
      toast.error("Erreur lors de l'envoi de l'évaluation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-surface-elevated rounded-lg border border-border-primary p-8 text-center ${className}`}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-kongo-lime rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-8 h-8 text-kongo-black" />
        </motion.div>
        
        <h3 className="text-h3 text-kongo-black mb-4">Évaluation envoyée !</h3>
        <p className="text-body text-secondary mb-6">
          Merci pour votre retour. Votre avis nous aide à améliorer l'expérience KonGO.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => {
              // Share experience logic
              toast.success("Partage en cours...");
            }}
            className="btn-outline-lime"
          >
            Partager mon expérience
          </Button>
          <Button onClick={onClose} className="btn-primary">
            Terminer
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-surface-elevated rounded-lg border border-border-primary ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b border-border-primary">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-kongo-lime rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-kongo-black" />
            </div>
            <div>
              <h2 className="text-h4 text-kongo-black">Évaluez votre voyage</h2>
              <p className="text-body-small text-secondary">
                Votre avis compte pour améliorer nos services
              </p>
            </div>
          </div>
          {onClose && (
            <Button onClick={onClose} variant="ghost" size="sm">
              ✕
            </Button>
          )}
        </div>

        {/* Trip Summary */}
        <div className="bg-surface-secondary rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-label text-primary font-semibold">
                {trip.from} → {trip.to}
              </p>
              <p className="text-body-small text-secondary">
                {trip.date} • {trip.duration} • Véhicule {trip.vehicle.number}
              </p>
            </div>
            <Badge className="status-success">
              Voyage terminé
            </Badge>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Agency Rating */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-kongo-black" />
            <div>
              <h3 className="text-h5 text-kongo-black">Évaluez l'agence</h3>
              <p className="text-body-small text-secondary">{trip.agency.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => !isReadOnly && setAgencyRating(star)}
                  onMouseEnter={() => !isReadOnly && setHoveredStar({ type: 'agency', rating: star })}
                  onMouseLeave={() => setHoveredStar(null)}
                  disabled={isReadOnly}
                  className="p-1 disabled:cursor-default"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${getStarColor('agency', star, agencyRating)} 
                      ${star <= agencyRating ? 'fill-current' : ''}`}
                  />
                </button>
              ))}
            </div>
            <span className="text-body-small text-secondary">
              {getRatingLabel(agencyRating)}
            </span>
          </div>
        </div>

        {/* Driver Rating */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-kongo-black" />
            <div>
              <h3 className="text-h5 text-kongo-black">Évaluez le chauffeur</h3>
              <p className="text-body-small text-secondary">
                {trip.driver.name} {trip.driver.experience && `• ${trip.driver.experience}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => !isReadOnly && setDriverRating(star)}
                  onMouseEnter={() => !isReadOnly && setHoveredStar({ type: 'driver', rating: star })}
                  onMouseLeave={() => setHoveredStar(null)}
                  disabled={isReadOnly}
                  className="p-1 disabled:cursor-default"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${getStarColor('driver', star, driverRating)} 
                      ${star <= driverRating ? 'fill-current' : ''}`}
                  />
                </button>
              ))}
            </div>
            <span className="text-body-small text-secondary">
              {getRatingLabel(driverRating)}
            </span>
          </div>
        </div>

        <Separator />

        {/* Detailed Categories */}
        <div className="space-y-6">
          <h3 className="text-h5 text-kongo-black">Évaluation détaillée</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            {categories.map((category) => {
              const IconComponent = category.icon;
              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-4 h-4 text-kongo-black" />
                    <div>
                      <p className="text-label text-primary">{category.label}</p>
                      <p className="text-body-xs text-tertiary">{category.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => !isReadOnly && updateCategoryRating(category.id, star)}
                        onMouseEnter={() => !isReadOnly && setHoveredStar({ type: category.id, rating: star })}
                        onMouseLeave={() => setHoveredStar(null)}
                        disabled={isReadOnly}
                        className="p-1 disabled:cursor-default"
                      >
                        <Star
                          className={`w-4 h-4 transition-colors ${getStarColor(category.id, star, category.rating)} 
                            ${star <= category.rating ? 'fill-current' : ''}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Recommendation */}
        {!isReadOnly && (
          <div className="space-y-4">
            <h3 className="text-h5 text-kongo-black">Recommandation</h3>
            <p className="text-body-small text-secondary">
              Recommanderiez-vous ce service à vos proches ?
            </p>
            
            <div className="flex gap-4">
              <button
                onClick={() => setWouldRecommend(true)}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-all
                  ${wouldRecommend === true 
                    ? 'border-kongo-lime bg-surface-kongo-lime-light text-kongo-lime-dark' 
                    : 'border-border-secondary hover:border-kongo-lime'
                  }`}
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="text-label">Oui, je recommande</span>
              </button>
              
              <button
                onClick={() => setWouldRecommend(false)}
                className={`flex items-center gap-3 p-4 rounded-lg border transition-all
                  ${wouldRecommend === false 
                    ? 'border-color-error bg-color-error-light text-color-error' 
                    : 'border-border-secondary hover:border-color-error'
                  }`}
              >
                <ThumbsDown className="w-5 h-5" />
                <span className="text-label">Non recommandé</span>
              </button>
            </div>
          </div>
        )}

        {/* Comment Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-h5 text-kongo-black">Commentaire</h3>
            <p className="text-body-small text-secondary">
              Partagez votre expérience pour aider d'autres voyageurs
            </p>
          </div>
          
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Décrivez votre expérience de voyage..."
            className="min-h-[120px] resize-none"
            maxLength={500}
            disabled={isReadOnly}
          />
          
          <div className="flex justify-between items-center">
            <span className="text-body-xs text-tertiary">
              {comment.length}/500 caractères
            </span>
            
            {!isReadOnly && (
              <div className="flex items-center gap-2">
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-3 py-1 border border-border-secondary rounded-lg hover:border-kongo-lime transition-colors">
                    <Camera className="w-4 h-4" />
                    <span className="text-body-small">Ajouter photos</span>
                  </div>
                </Label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Photo Preview */}
        {photos.length > 0 && (
          <div className="space-y-3">
            <p className="text-label text-primary">Photos ajoutées ({photos.length}/5)</p>
            <div className="flex gap-3 flex-wrap">
              {photos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Photo ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-border-primary"
                  />
                  {!isReadOnly && (
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-color-error text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Actions */}
        {!isReadOnly && (
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border-primary">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || agencyRating === 0 || driverRating === 0}
              className="btn-primary flex-1"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer l'évaluation
                </>
              )}
            </Button>
            
            {onClose && (
              <Button onClick={onClose} variant="outline" className="btn-outline">
                Plus tard
              </Button>
            )}
          </div>
        )}

        {/* Read-only footer */}
        {isReadOnly && (
          <div className="pt-6 border-t border-border-primary">
            <p className="text-body-small text-center text-secondary">
              Évaluation soumise le {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Hook pour récupérer les évaluations
export function useTripsForRating() {
  const [tripsToRate, setTripsToRate] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTripsToRate = async () => {
    setLoading(true);
    try {
      // Simulation API - trips completed but not rated
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTrips: TripData[] = [
        {
          id: '1',
          from: 'Kinshasa',
          to: 'Lubumbashi',
          date: '2024-01-15',
          agency: {
            id: 'ag1',
            name: 'Voyages Modernes RDC'
          },
          driver: {
            id: 'dr1',
            name: 'Patrick Kabongo',
            experience: '8 ans d\'expérience'
          },
          vehicle: {
            number: 'KN-2024',
            type: 'Bus VIP'
          },
          duration: '16h',
          price: 125000,
          status: 'completed'
        }
      ];
      
      setTripsToRate(mockTrips);
    } catch (error) {
      console.error('Error fetching trips to rate:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    tripsToRate,
    loading,
    fetchTripsToRate
  };
}
