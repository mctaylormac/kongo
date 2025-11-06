import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, ArrowRight, Clock, MapPin, Users, Percent, 
  X, ChevronLeft, ChevronRight, ExternalLink, Heart,
  Award, Zap, TrendingUp, Shield
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

interface PromotionalContent {
  id: string;
  type: 'agency_highlight' | 'service_promotion' | 'partnership' | 'feature_spotlight';
  title: string;
  subtitle?: string;
  description: string;
  imageUrl: string;
  logoUrl?: string;
  badge?: {
    text: string;
    type: 'sponsored' | 'premium' | 'limited' | 'new' | 'popular';
  };
  offer?: {
    discount: number;
    originalPrice?: number;
    discountedPrice?: number;
    validUntil?: Date;
    promoCode?: string;
  };
  agency?: {
    name: string;
    rating: number;
    totalTrips: number;
    verified: boolean;
  };
  cta: {
    primary: { text: string; action: string };
    secondary?: { text: string; action: string };
  };
  metrics?: {
    label: string;
    value: string;
    icon: React.ReactNode;
  }[];
  priority: 'high' | 'medium' | 'low';
  placement: 'hero' | 'sidebar' | 'inline' | 'modal';
  isActive: boolean;
  expiresAt?: Date;
}

interface PromotionalBannerProps {
  content: PromotionalContent[];
  placement: 'hero' | 'sidebar' | 'inline' | 'modal';
  onAction: (contentId: string, action: string) => void;
  onDismiss?: (contentId: string) => void;
  autoRotate?: boolean;
  rotationInterval?: number;
  className?: string;
}

export function PromotionalBanner({
  content,
  placement,
  onAction,
  onDismiss,
  autoRotate = true,
  rotationInterval = 8000,
  className = ""
}: PromotionalBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dismissedItems, setDismissedItems] = useState<string[]>([]);

  // Filter active content for current placement
  const activeContent = content.filter(item => 
    item.isActive && 
    item.placement === placement &&
    !dismissedItems.includes(item.id) &&
    (!item.expiresAt || new Date() < item.expiresAt)
  ).sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  const currentItem = activeContent[currentIndex];

  // Auto-rotation logic
  useEffect(() => {
    if (!autoRotate || activeContent.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeContent.length);
    }, rotationInterval);

    return () => clearInterval(timer);
  }, [autoRotate, activeContent.length, isPaused, rotationInterval]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeContent.length);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + activeContent.length) % activeContent.length);
  };

  const handleDismiss = (itemId: string) => {
    setDismissedItems(prev => [...prev, itemId]);
    onDismiss?.(itemId);
    
    // Adjust current index if needed
    if (currentIndex >= activeContent.length - 1) {
      setCurrentIndex(0);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'sponsored':
        return 'bg-kongo-lime text-kongo-black border-kongo-lime';
      case 'premium':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500';
      case 'limited':
        return 'status-error animate-pulse';
      case 'new':
        return 'status-success';
      case 'popular':
        return 'status-info';
      default:
        return 'status-kongo';
    }
  };

  const formatTimeRemaining = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expiré';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (!currentItem || activeContent.length === 0) {
    return null;
  }

  // Hero Banner Style
  if (placement === 'hero') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden ${className}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative bg-gradient-to-br from-kongo-black via-kongo-black-light to-kongo-black-lighter rounded-2xl overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0 opacity-30">
            <ImageWithFallback
              src={currentItem.imageUrl}
              alt={currentItem.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-kongo-black/80 via-kongo-black/60 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                {/* Badge */}
                {currentItem.badge && (
                  <div className="flex items-center space-x-3">
                    <Badge className={`${getBadgeStyle(currentItem.badge.type)} text-sm`}>
                      {currentItem.badge.type === 'sponsored' && <Star className="w-4 h-4 mr-1" />}
                      {currentItem.badge.type === 'premium' && <Award className="w-4 h-4 mr-1" />}
                      {currentItem.badge.type === 'limited' && <Clock className="w-4 h-4 mr-1" />}
                      {currentItem.badge.type === 'new' && <Zap className="w-4 h-4 mr-1" />}
                      {currentItem.badge.type === 'popular' && <TrendingUp className="w-4 h-4 mr-1" />}
                      {currentItem.badge.text}
                    </Badge>
                    
                    {currentItem.expiresAt && (
                      <Badge className="status-warning">
                        <Clock className="w-3 h-3 mr-1" />
                        Expire dans {formatTimeRemaining(currentItem.expiresAt)}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Title and Description */}
                <div className="space-y-4">
                  <div>
                    <h2 className="text-h1 text-on-black font-bold mb-2">
                      {currentItem.title}
                    </h2>
                    {currentItem.subtitle && (
                      <p className="text-h5 text-kongo-lime font-medium">
                        {currentItem.subtitle}
                      </p>
                    )}
                  </div>
                  
                  <p className="text-body-large text-on-black opacity-90 max-w-lg">
                    {currentItem.description}
                  </p>
                </div>

                {/* Agency Info */}
                {currentItem.agency && (
                  <div className="flex items-center space-x-4 p-4 bg-surface-elevated/10 rounded-lg backdrop-blur-sm">
                    {currentItem.logoUrl && (
                      <ImageWithFallback
                        src={currentItem.logoUrl}
                        alt={currentItem.agency.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-label text-on-black font-semibold">
                          {currentItem.agency.name}
                        </h4>
                        {currentItem.agency.verified && (
                          <Shield className="w-4 h-4 text-kongo-lime" />
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-body-small text-on-black opacity-75">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-kongo-lime fill-current" />
                          <span>{currentItem.agency.rating}/5</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{currentItem.agency.totalTrips.toLocaleString()} voyages</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Offer Info */}
                {currentItem.offer && (
                  <div className="bg-kongo-lime/20 border border-kongo-lime rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Percent className="w-5 h-5 text-kongo-lime" />
                        <span className="text-h4 text-kongo-lime font-bold">
                          -{currentItem.offer.discount}%
                        </span>
                      </div>
                      
                      {currentItem.offer.originalPrice && currentItem.offer.discountedPrice && (
                        <div className="text-right">
                          <div className="text-body-small text-on-black opacity-60 line-through">
                            {currentItem.offer.originalPrice.toLocaleString()} CDF
                          </div>
                          <div className="text-h5 text-kongo-lime font-bold">
                            {currentItem.offer.discountedPrice.toLocaleString()} CDF
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {currentItem.offer.promoCode && (
                      <div className="mt-3 pt-3 border-t border-kongo-lime/30">
                        <div className="flex items-center justify-between">
                          <span className="text-body-small text-on-black opacity-75">
                            Code promo :
                          </span>
                          <div className="flex items-center space-x-2">
                            <code className="px-2 py-1 bg-kongo-lime text-kongo-black rounded text-label font-bold">
                              {currentItem.offer.promoCode}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(currentItem.offer!.promoCode!);
                                // Show toast
                              }}
                              className="text-kongo-lime hover:bg-kongo-lime/20"
                            >
                              Copier
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Metrics */}
                {currentItem.metrics && (
                  <div className="grid grid-cols-3 gap-4">
                    {currentItem.metrics.map((metric, index) => (
                      <div key={index} className="text-center p-3 bg-surface-elevated/10 rounded-lg backdrop-blur-sm">
                        <div className="flex justify-center mb-2 text-kongo-lime">
                          {metric.icon}
                        </div>
                        <div className="text-h5 text-on-black font-bold">
                          {metric.value}
                        </div>
                        <div className="text-body-xs text-on-black opacity-75">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => onAction(currentItem.id, currentItem.cta.primary.action)}
                    className="btn-secondary flex-1"
                  >
                    {currentItem.cta.primary.text}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  {currentItem.cta.secondary && (
                    <Button
                      onClick={() => onAction(currentItem.id, currentItem.cta.secondary!.action)}
                      variant="outline"
                      className="btn-outline flex-1 border-on-black text-on-black hover:bg-on-black hover:text-kongo-black"
                    >
                      {currentItem.cta.secondary.text}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Visual Elements */}
              <div className="hidden lg:flex justify-center">
                <div className="relative">
                  <ImageWithFallback
                    src={currentItem.imageUrl}
                    alt={currentItem.title}
                    className="w-80 h-80 object-cover rounded-2xl shadow-2xl"
                  />
                  
                  {currentItem.logoUrl && (
                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-surface-elevated rounded-xl shadow-lg flex items-center justify-center">
                      <ImageWithFallback
                        src={currentItem.logoUrl}
                        alt="Logo"
                        className="w-12 h-12 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          {activeContent.length > 1 && (
            <div className="absolute bottom-4 right-4 flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handlePrevious}
                className="bg-surface-elevated/20 backdrop-blur-sm text-on-black hover:bg-surface-elevated/30"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex space-x-1">
                {activeContent.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex ? 'bg-kongo-lime' : 'bg-on-black/30'
                    }`}
                  />
                ))}
              </div>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={handleNext}
                className="bg-surface-elevated/20 backdrop-blur-sm text-on-black hover:bg-surface-elevated/30"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Dismiss Button */}
          {onDismiss && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDismiss(currentItem.id)}
              className="absolute top-4 right-4 bg-surface-elevated/20 backdrop-blur-sm text-on-black hover:bg-surface-elevated/30"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  // Sidebar Banner Style
  if (placement === 'sidebar') {
    return (
      <Card className="card-elevated overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            {/* Header Image */}
            <div className="relative h-32 overflow-hidden">
              <ImageWithFallback
                src={currentItem.imageUrl}
                alt={currentItem.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-kongo-black/60 to-transparent"></div>
              
              {/* Badge */}
              {currentItem.badge && (
                <Badge className={`absolute top-3 left-3 ${getBadgeStyle(currentItem.badge.type)}`}>
                  {currentItem.badge.text}
                </Badge>
              )}
              
              {/* Dismiss */}
              {onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDismiss(currentItem.id)}
                  className="absolute top-3 right-3 bg-surface-elevated/20 backdrop-blur-sm"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              <div>
                <h3 className="text-h6 text-primary font-semibold line-clamp-2">
                  {currentItem.title}
                </h3>
                <p className="text-body-small text-secondary line-clamp-2 mt-1">
                  {currentItem.description}
                </p>
              </div>

              {/* Agency */}
              {currentItem.agency && (
                <div className="flex items-center space-x-2">
                  {currentItem.logoUrl && (
                    <ImageWithFallback
                      src={currentItem.logoUrl}
                      alt={currentItem.agency.name}
                      className="w-6 h-6 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-label-small text-secondary truncate">
                      {currentItem.agency.name}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-kongo-lime fill-current" />
                      <span className="text-body-xs text-tertiary">
                        {currentItem.agency.rating}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Offer */}
              {currentItem.offer && (
                <div className="bg-surface-kongo-lime-light rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Percent className="w-4 h-4 text-kongo-lime-dark" />
                      <span className="text-label text-kongo-lime-dark font-bold">
                        -{currentItem.offer.discount}%
                      </span>
                    </div>
                    
                    {currentItem.expiresAt && (
                      <div className="text-body-xs text-kongo-lime-dark">
                        {formatTimeRemaining(currentItem.expiresAt)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action */}
              <Button
                onClick={() => onAction(currentItem.id, currentItem.cta.primary.action)}
                size="sm"
                className="btn-primary w-full"
              >
                {currentItem.cta.primary.text}
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Inline Banner Style
  if (placement === 'inline') {
    return (
      <Card className="card-interactive overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            {/* Image */}
            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
              <ImageWithFallback
                src={currentItem.imageUrl}
                alt={currentItem.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {currentItem.badge && (
                    <Badge className={`${getBadgeStyle(currentItem.badge.type)} mb-2`}>
                      {currentItem.badge.text}
                    </Badge>
                  )}
                  
                  <h3 className="text-h6 text-primary font-semibold line-clamp-1 mb-1">
                    {currentItem.title}
                  </h3>
                  
                  <p className="text-body-small text-secondary line-clamp-2">
                    {currentItem.description}
                  </p>
                  
                  {currentItem.offer && (
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge className="status-success">
                        -{currentItem.offer.discount}%
                      </Badge>
                      {currentItem.expiresAt && (
                        <span className="text-body-xs text-tertiary">
                          Expire dans {formatTimeRemaining(currentItem.expiresAt)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                {onDismiss && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(currentItem.id)}
                    className="flex-shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Action */}
            <Button
              onClick={() => onAction(currentItem.id, currentItem.cta.primary.action)}
              size="sm"
              className="btn-primary flex-shrink-0"
            >
              {currentItem.cta.primary.text}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}