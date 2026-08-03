import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, MapPin, Users, Trophy, Shield, Clock, 
  ArrowRight, ChevronLeft, ChevronRight, TrendingUp,
  Award, CheckCircle, Heart, Phone, MessageCircle
} from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

interface SponsoredAgency {
  id: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  coverImage: string;
  sponsored: boolean;
  verified: boolean;
  premium: boolean;
  metrics: {
    rating: number;
    totalReviews: number;
    totalTrips: number;
    onTimePercentage: number;
    experienceYears: number;
  };
  routes: {
    popular: string[];
    total: number;
  };
  features: string[];
  specialOffers: {
    title: string;
    discount: number;
    validUntil: Date;
    code?: string;
  }[];
  contact: {
    phone: string;
    whatsapp?: string;
  };
  highlights: {
    icon: React.ReactNode;
    label: string;
    value: string;
  }[];
  sponsorshipType: 'premium' | 'featured' | 'top_choice';
  placement: number; // Order in carousel
}

interface SponsoredAgencyCarouselProps {
  agencies: SponsoredAgency[];
  onAgencySelect: (agency: SponsoredAgency) => void;
  onContactAgency: (agencyId: string, method: 'phone' | 'whatsapp' | 'message') => void;
  onViewOffer: (agencyId: string, offerId: string) => void;
  autoPlay?: boolean;
  className?: string;
}

export function SponsoredAgencyCarousel({
  agencies,
  onAgencySelect,
  onContactAgency,
  onViewOffer,
  autoPlay = true,
  className = ""
}: SponsoredAgencyCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Sort agencies by sponsorship priority
  const sortedAgencies = [...agencies].sort((a, b) => {
    const typeOrder = { premium: 3, featured: 2, top_choice: 1 };
    if (a.sponsorshipType !== b.sponsorshipType) {
      return typeOrder[b.sponsorshipType] - typeOrder[a.sponsorshipType];
    }
    return a.placement - b.placement;
  });

  const premiumAgencies = sortedAgencies.filter(a => a.premium);
  const featuredAgencies = sortedAgencies.filter(a => a.sponsored && !a.premium);

  // Auto-play functionality
  useEffect(() => {
    if (!autoPlay || isHovering || sortedAgencies.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % sortedAgencies.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay, isHovering, sortedAgencies.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % sortedAgencies.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + sortedAgencies.length) % sortedAgencies.length);
  };

  const toggleFavorite = (agencyId: string) => {
    setFavorites(prev => 
      prev.includes(agencyId) 
        ? prev.filter(id => id !== agencyId)
        : [...prev, agencyId]
    );
  };

  const getSponsorshipBadge = (agency: SponsoredAgency) => {
    if (agency.premium) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500 badge-contrast backdrop-blur-sm">
          <Award className="w-3 h-3 mr-1" />
          Partenaire Premium
        </Badge>
      );
    }
    if (agency.sponsorshipType === 'featured') {
      return (
        <Badge className="status-kongo badge-contrast backdrop-blur-sm">
          <Star className="w-3 h-3 mr-1" />
          Agence Vedette
        </Badge>
      );
    }
    if (agency.sponsorshipType === 'top_choice') {
      return (
        <Badge className="status-info badge-contrast backdrop-blur-sm">
          <Trophy className="w-3 h-3 mr-1" />
          Choix Recommandé
        </Badge>
      );
    }
    return null;
  };

  const formatTimeRemaining = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expiré';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}j`;
    return `${hours}h`;
  };

  if (sortedAgencies.length === 0) {
    return null;
  }

  return (
    <div 
      className={`space-y-6 ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-h2 text-kongo-black font-bold">
            Agences Partenaires Certifiées
          </h2>
          <p className="text-body text-secondary">
            Découvrez nos partenaires de confiance pour voyager en toute sérénité
          </p>
        </div>
        
        {/* Navigation Controls */}
        {sortedAgencies.length > 1 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              className="btn-outline-lime"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex space-x-1">
              {sortedAgencies.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-kongo-lime' : 'bg-border-secondary'
                  }`}
                />
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="btn-outline-lime"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Premium Agencies Showcase */}
      {premiumAgencies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-h4 text-primary font-semibold">
              Partenaires Premium
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumAgencies.slice(0, 3).map((agency) => (
              <motion.div
                key={agency.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group"
              >
                <Card className="card-interactive overflow-hidden h-full">
                  <div className="relative">
                    {/* Cover Image */}
                    <div className="relative h-48 overflow-hidden">
                      <ImageWithFallback
                        src={agency.coverImage}
                        alt={agency.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-kongo-black/80 via-kongo-black/40 to-transparent"></div>
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex flex-col space-y-2">
                        {getSponsorshipBadge(agency)}
                        {agency.verified && (
                          <Badge className="status-success badge-contrast backdrop-blur-sm">
                            <Shield className="w-3 h-3 mr-1" />
                            Vérifié
                          </Badge>
                        )}
                      </div>
                      
                      {/* Favorite */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleFavorite(agency.id)}
                        className="absolute top-3 right-3 bg-surface-elevated/20 backdrop-blur-sm hover:bg-surface-elevated/30"
                      >
                        <Heart 
                          className={`w-4 h-4 ${
                            favorites.includes(agency.id) 
                              ? 'text-error fill-current' 
                              : 'text-on-black'
                          }`} 
                        />
                      </Button>
                      
                      {/* Logo */}
                      <div className="absolute bottom-3 left-3">
                        <div className="w-12 h-12 bg-surface-elevated rounded-lg shadow-lg flex items-center justify-center">
                          <ImageWithFallback
                            src={agency.logo}
                            alt={`${agency.name} logo`}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <CardContent className="p-6 space-y-4">
                      {/* Agency Info */}
                      <div className="space-y-2">
                        <h3 className="text-h5 text-primary font-semibold group-hover:text-kongo-black transition-colors">
                          {agency.name}
                        </h3>
                        <p className="text-body-small text-kongo-lime-dark font-medium">
                          {agency.tagline}
                        </p>
                        <p className="text-body-small text-secondary line-clamp-2">
                          {agency.description}
                        </p>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-surface-secondary rounded-lg">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Star className="w-4 h-4 text-kongo-lime fill-current" />
                            <span className="text-h6 text-primary font-bold">
                              {agency.metrics.rating}
                            </span>
                          </div>
                          <div className="text-body-xs text-tertiary">
                            {agency.metrics.totalReviews} avis
                          </div>
                        </div>
                        
                        <div className="text-center p-3 bg-surface-secondary rounded-lg">
                          <div className="text-h6 text-primary font-bold mb-1">
                            {agency.metrics.onTimePercentage}%
                          </div>
                          <div className="text-body-xs text-tertiary">
                            Ponctualité
                          </div>
                        </div>
                      </div>

                      {/* Routes */}
                      <div className="space-y-2">
                        <div className="text-label-small text-tertiary">ROUTES POPULAIRES</div>
                        <div className="flex flex-wrap gap-1">
                          {agency.routes.popular.slice(0, 3).map((route, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {route}
                            </Badge>
                          ))}
                          {agency.routes.total > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{agency.routes.total - 3} autres
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Special Offers */}
                      {agency.specialOffers.length > 0 && (
                        <div className="bg-surface-kongo-lime-light rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-4 h-4 text-kongo-lime-dark" />
                              <span className="text-label text-kongo-lime-dark font-semibold">
                                Offre Spéciale
                              </span>
                            </div>
                            <Badge className="status-warning">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatTimeRemaining(agency.specialOffers[0].validUntil)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-h6 text-kongo-black font-bold">
                                -{agency.specialOffers[0].discount}%
                              </div>
                              <div className="text-body-xs text-kongo-lime-dark">
                                {agency.specialOffers[0].title}
                              </div>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => onViewOffer(agency.id, agency.specialOffers[0].title)}
                              className="btn-primary text-xs"
                            >
                              Voir l'offre
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => onAgencySelect(agency)}
                          className="btn-primary flex-1"
                        >
                          Réserver
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onContactAgency(agency.id, 'phone')}
                          className="btn-outline-lime"
                        >
                          <Phone className="w-4 h-4" />
                        </Button>
                        
                        {agency.contact.whatsapp && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onContactAgency(agency.id, 'whatsapp')}
                            className="btn-outline text-success border-success hover:bg-success hover:text-white"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Agencies Carousel */}
      {featuredAgencies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-kongo-lime" />
            <h3 className="text-h4 text-primary font-semibold">
              Agences Vedettes
            </h3>
          </div>
          
          <div 
            ref={carouselRef}
            className="overflow-hidden"
          >
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / Math.min(featuredAgencies.length, 3))}%)`
              }}
            >
              {featuredAgencies.map((agency) => (
                <div
                  key={agency.id}
                  className="w-full md:w-1/2 lg:w-1/3 flex-shrink-0 px-3"
                >
                  <Card className="card-interactive overflow-hidden h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Logo */}
                        <div className="w-16 h-16 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                          <ImageWithFallback
                            src={agency.logo}
                            alt={`${agency.name} logo`}
                            className="w-12 h-12 object-contain"
                          />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-h6 text-primary font-semibold truncate">
                                {agency.name}
                              </h4>
                              {agency.verified && (
                                <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                              )}
                            </div>
                            
                            {getSponsorshipBadge(agency)}
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-kongo-lime fill-current" />
                              <span className="text-body-small text-primary font-medium">
                                {agency.metrics.rating}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4 text-secondary" />
                              <span className="text-body-small text-secondary">
                                {agency.metrics.totalTrips.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => onAgencySelect(agency)}
                            className="btn-primary w-full"
                          >
                            Voir les trajets
                            <ArrowRight className="w-3 h-3 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* View All Link */}
      <div className="text-center pt-4">
        <Button
          variant="outline"
          onClick={() => {
            // Navigate to full agency directory
          }}
          className="btn-outline-lime"
        >
          Voir toutes les agences partenaires
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
