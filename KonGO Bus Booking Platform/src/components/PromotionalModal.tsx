import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Clock, Star, Gift, Zap, ArrowRight, Calendar,
  Percent, Users, MapPin, CheckCircle, AlertCircle,
  Sparkles, TrendingUp, Award
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";

interface PromotionalModalContent {
  id: string;
  type: 'flash_sale' | 'new_feature' | 'loyalty_reward' | 'partnership' | 'seasonal';
  priority: 'high' | 'medium' | 'low';
  title: string;
  subtitle?: string;
  description: string;
  visualContent: {
    type: 'image' | 'animation' | 'gradient';
    src?: string;
    gradientFrom?: string;
    gradientTo?: string;
  };
  offer?: {
    discount: number;
    originalPrice?: number;
    discountedPrice?: number;
    promoCode?: string;
    minimumSpend?: number;
    maxUses?: number;
    usedCount?: number;
  };
  timing: {
    expiresAt?: Date;
    startsAt?: Date;
    urgency: 'low' | 'medium' | 'high' | 'critical';
  };
  targets: {
    newUsers?: boolean;
    returningUsers?: boolean;
    premiumUsers?: boolean;
    routes?: string[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
  };
  actions: {
    primary: { text: string; action: string; style?: 'primary' | 'secondary' | 'accent' };
    secondary?: { text: string; action: string };
    dismiss?: { text: string; remindLater?: boolean };
  };
  features?: {
    icon: React.ReactNode;
    text: string;
  }[];
  testimonial?: {
    text: string;
    author: string;
    rating: number;
    avatar?: string;
  };
  stats?: {
    label: string;
    value: string;
    change?: number;
  }[];
  isActive: boolean;
  maxDismissals: number;
}

interface PromotionalModalProps {
  content: PromotionalModalContent[];
  userProfile: {
    isNewUser: boolean;
    isPremium: boolean;
    favoriteRoutes: string[];
    dismissedPromotions: string[];
    dismissCount: Record<string, number>;
  };
  onAction: (contentId: string, action: string) => void;
  onDismiss: (contentId: string, remindLater?: boolean) => void;
  triggerConditions?: {
    pageViews?: number;
    timeOnSite?: number;
    searchCount?: number;
    scrollPercentage?: number;
  };
  className?: string;
}

export function PromotionalModal({
  content,
  userProfile,
  onAction,
  onDismiss,
  triggerConditions = {},
  className = ""
}: PromotionalModalProps) {
  const [currentPromotion, setCurrentPromotion] = useState<PromotionalModalContent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [hasTriggered, setHasTriggered] = useState(false);

  // Filter and prioritize promotions
  const eligiblePromotions = content.filter(promo => {
    // Check if active
    if (!promo.isActive) return false;
    
    // Check if not dismissed too many times
    const dismissCount = userProfile.dismissCount[promo.id] || 0;
    if (dismissCount >= promo.maxDismissals) return false;
    
    // Check if not in dismissed list (for this session)
    if (userProfile.dismissedPromotions.includes(promo.id)) return false;
    
    // Check timing
    const now = new Date();
    if (promo.timing.startsAt && now < promo.timing.startsAt) return false;
    if (promo.timing.expiresAt && now > promo.timing.expiresAt) return false;
    
    // Check user targeting
    if (promo.targets.newUsers && !userProfile.isNewUser) return false;
    if (promo.targets.returningUsers && userProfile.isNewUser) return false;
    if (promo.targets.premiumUsers && !userProfile.isPremium) return false;
    
    // Check route targeting
    if (promo.targets.routes && promo.targets.routes.length > 0) {
      const hasMatchingRoute = promo.targets.routes.some(route => 
        userProfile.favoriteRoutes.includes(route)
      );
      if (!hasMatchingRoute) return false;
    }
    
    // Check time of day targeting
    if (promo.targets.timeOfDay) {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      if (promo.targets.timeOfDay !== timeOfDay) return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort by priority and urgency
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    
    if (a.priority !== b.priority) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    
    return urgencyOrder[b.timing.urgency] - urgencyOrder[a.timing.urgency];
  });

  // Trigger logic based on conditions
  useEffect(() => {
    if (hasTriggered || eligiblePromotions.length === 0) return;

    const checkTriggerConditions = () => {
      let shouldTrigger = false;

      // Immediate trigger for critical promotions
      if (eligiblePromotions.some(p => p.timing.urgency === 'critical')) {
        shouldTrigger = true;
      }
      
      // Time-based trigger
      if (triggerConditions.timeOnSite && triggerConditions.timeOnSite > 30000) {
        shouldTrigger = true;
      }
      
      // Action-based trigger
      if (triggerConditions.searchCount && triggerConditions.searchCount >= 3) {
        shouldTrigger = true;
      }
      
      // Scroll-based trigger
      if (triggerConditions.scrollPercentage && triggerConditions.scrollPercentage > 70) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        setCurrentPromotion(eligiblePromotions[0]);
        setIsVisible(true);
        setHasTriggered(true);
      }
    };

    // Delay initial check
    const timer = setTimeout(checkTriggerConditions, 2000);
    return () => clearTimeout(timer);
  }, [triggerConditions, eligiblePromotions, hasTriggered]);

  // Update countdown timer
  useEffect(() => {
    if (!currentPromotion?.timing.expiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = currentPromotion.timing.expiresAt!.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining('Expiré');
        return;
      }
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (days > 0) {
        setTimeRemaining(`${days}j ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [currentPromotion]);

  const handleDismiss = (remindLater?: boolean) => {
    if (currentPromotion) {
      onDismiss(currentPromotion.id, remindLater);
      setIsVisible(false);
      setCurrentPromotion(null);
    }
  };

  const handleAction = (action: string) => {
    if (currentPromotion) {
      onAction(currentPromotion.id, action);
      setIsVisible(false);
      setCurrentPromotion(null);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical':
        return 'text-error';
      case 'high':
        return 'text-warning';
      case 'medium':
        return 'text-kongo-lime-dark';
      default:
        return 'text-info';
    }
  };

  const getOfferBadge = (offer: any) => {
    if (offer.maxUses && offer.usedCount) {
      const remaining = offer.maxUses - offer.usedCount;
      const percentage = (remaining / offer.maxUses) * 100;
      
      if (percentage <= 10) {
        return (
          <Badge className="status-error animate-pulse">
            <AlertCircle className="w-3 h-3 mr-1" />
            Plus que {remaining} places !
          </Badge>
        );
      } else if (percentage <= 30) {
        return (
          <Badge className="status-warning">
            <Users className="w-3 h-3 mr-1" />
            {remaining} places restantes
          </Badge>
        );
      }
    }
    
    return (
      <Badge className="status-success">
        <Gift className="w-3 h-3 mr-1" />
        Offre Spéciale
      </Badge>
    );
  };

  if (!currentPromotion || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-surface-overlay backdrop-blur-sm"
          onClick={() => handleDismiss()}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden ${className}`}
        >
          <Card className="bg-surface-elevated border-border-primary shadow-2xl">
            <div className="relative overflow-hidden">
              {/* Visual Content */}
              <div className="relative h-64 overflow-hidden">
                {currentPromotion.visualContent.type === 'image' && currentPromotion.visualContent.src ? (
                  <ImageWithFallback
                    src={currentPromotion.visualContent.src}
                    alt={currentPromotion.title}
                    className="w-full h-full object-cover"
                  />
                ) : currentPromotion.visualContent.type === 'gradient' ? (
                  <div
                    className="w-full h-full"
                    style={{
                      background: `linear-gradient(135deg, ${currentPromotion.visualContent.gradientFrom || '#101820'}, ${currentPromotion.visualContent.gradientTo || '#bfeb30'})`
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-kongo-black via-kongo-black-light to-kongo-lime flex items-center justify-center">
                    <Sparkles className="w-24 h-24 text-kongo-lime animate-pulse" />
                  </div>
                )}
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-kongo-black/80 via-kongo-black/40 to-transparent" />
                
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss()}
                  className="absolute top-4 right-4 bg-surface-elevated/20 backdrop-blur-sm text-on-black hover:bg-surface-elevated/30"
                >
                  <X className="w-4 h-4" />
                </Button>
                
                {/* Urgency Badge */}
                {currentPromotion.timing.urgency !== 'low' && (
                  <div className="absolute top-4 left-4">
                    <Badge className={`${
                      currentPromotion.timing.urgency === 'critical' ? 'status-error animate-pulse' :
                      currentPromotion.timing.urgency === 'high' ? 'status-warning' :
                      'status-info'
                    }`}>
                      {currentPromotion.timing.urgency === 'critical' && <AlertCircle className="w-3 h-3 mr-1" />}
                      {currentPromotion.timing.urgency === 'high' && <Clock className="w-3 h-3 mr-1" />}
                      {currentPromotion.timing.urgency === 'medium' && <Zap className="w-3 h-3 mr-1" />}
                      {currentPromotion.timing.urgency === 'critical' ? 'Urgent !' :
                       currentPromotion.timing.urgency === 'high' ? 'Limité' :
                       'Spécial'}
                    </Badge>
                  </div>
                )}
                
                {/* Timer */}
                {currentPromotion.timing.expiresAt && timeRemaining !== 'Expiré' && (
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-surface-elevated/90 backdrop-blur-sm rounded-lg px-3 py-2">
                      <div className="flex items-center space-x-2">
                        <Clock className={`w-4 h-4 ${getUrgencyColor(currentPromotion.timing.urgency)}`} />
                        <div>
                          <div className="text-body-xs text-tertiary">Expire dans</div>
                          <div className={`text-label font-bold ${getUrgencyColor(currentPromotion.timing.urgency)}`}>
                            {timeRemaining}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <CardContent className="p-8 space-y-6">
                {/* Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      {currentPromotion.offer && getOfferBadge(currentPromotion.offer)}
                    </div>
                    
                    {currentPromotion.type === 'loyalty_reward' && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">
                        <Award className="w-3 h-3 mr-1" />
                        Récompense Fidélité
                      </Badge>
                    )}
                  </div>
                  
                  <h2 className="text-h2 text-kongo-black font-bold">
                    {currentPromotion.title}
                  </h2>
                  
                  {currentPromotion.subtitle && (
                    <p className="text-h5 text-kongo-lime-dark font-medium">
                      {currentPromotion.subtitle}
                    </p>
                  )}
                  
                  <p className="text-body text-secondary">
                    {currentPromotion.description}
                  </p>
                </div>

                {/* Offer Details */}
                {currentPromotion.offer && (
                  <div className="bg-surface-kongo-lime-light rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-kongo-lime rounded-full flex items-center justify-center">
                          <Percent className="w-6 h-6 text-kongo-black" />
                        </div>
                        <div>
                          <div className="text-h3 text-kongo-black font-bold">
                            -{currentPromotion.offer.discount}%
                          </div>
                          <div className="text-body-small text-kongo-lime-dark">
                            de réduction
                          </div>
                        </div>
                      </div>
                      
                      {currentPromotion.offer.originalPrice && currentPromotion.offer.discountedPrice && (
                        <div className="text-right">
                          <div className="text-body-small text-tertiary line-through">
                            {currentPromotion.offer.originalPrice.toLocaleString()} CDF
                          </div>
                          <div className="text-h4 text-kongo-black font-bold">
                            {currentPromotion.offer.discountedPrice.toLocaleString()} CDF
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {currentPromotion.offer.promoCode && (
                      <div className="flex items-center justify-between bg-kongo-lime/20 rounded-lg p-3">
                        <div>
                          <div className="text-label-small text-kongo-lime-dark">CODE PROMO</div>
                          <code className="text-h6 text-kongo-black font-bold">
                            {currentPromotion.offer.promoCode}
                          </code>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(currentPromotion.offer!.promoCode!);
                          }}
                          className="btn-primary"
                        >
                          Copier
                        </Button>
                      </div>
                    )}
                    
                    {currentPromotion.offer.minimumSpend && (
                      <div className="text-body-small text-kongo-lime-dark">
                        * Achat minimum : {currentPromotion.offer.minimumSpend.toLocaleString()} CDF
                      </div>
                    )}
                  </div>
                )}

                {/* Features */}
                {currentPromotion.features && (
                  <div className="space-y-3">
                    <h4 className="text-h6 text-primary font-medium">Avantages inclus :</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {currentPromotion.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-surface-kongo-lime-light rounded-lg flex items-center justify-center">
                            <div className="text-kongo-lime-dark">
                              {feature.icon}
                            </div>
                          </div>
                          <span className="text-body-small text-secondary">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                {currentPromotion.stats && (
                  <div className="grid grid-cols-3 gap-4">
                    {currentPromotion.stats.map((stat, index) => (
                      <div key={index} className="text-center p-3 bg-surface-secondary rounded-lg">
                        <div className="text-h5 text-primary font-bold">
                          {stat.value}
                        </div>
                        <div className="text-body-xs text-tertiary">
                          {stat.label}
                        </div>
                        {stat.change && (
                          <div className={`text-body-xs ${stat.change > 0 ? 'text-success' : 'text-error'}`}>
                            {stat.change > 0 ? '+' : ''}{stat.change}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Testimonial */}
                {currentPromotion.testimonial && (
                  <div className="bg-surface-secondary rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      {currentPromotion.testimonial.avatar && (
                        <ImageWithFallback
                          src={currentPromotion.testimonial.avatar}
                          alt={currentPromotion.testimonial.author}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < currentPromotion.testimonial!.rating
                                  ? 'text-kongo-lime fill-current'
                                  : 'text-border-secondary'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-body-small text-secondary italic mb-2">
                          "{currentPromotion.testimonial.text}"
                        </p>
                        <div className="text-body-xs text-tertiary">
                          — {currentPromotion.testimonial.author}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleAction(currentPromotion.actions.primary.action)}
                    className={`
                      flex-1
                      ${currentPromotion.actions.primary.style === 'secondary' ? 'btn-secondary' :
                        currentPromotion.actions.primary.style === 'accent' ? 'btn-accent' :
                        'btn-primary'}
                    `}
                  >
                    {currentPromotion.actions.primary.text}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  {currentPromotion.actions.secondary && (
                    <Button
                      variant="outline"
                      onClick={() => handleAction(currentPromotion.actions.secondary!.action)}
                      className="btn-outline flex-1"
                    >
                      {currentPromotion.actions.secondary.text}
                    </Button>
                  )}
                </div>

                {/* Dismiss Options */}
                {currentPromotion.actions.dismiss && (
                  <div className="flex justify-center space-x-4 pt-2 border-t border-border-secondary">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss()}
                      className="btn-ghost text-tertiary"
                    >
                      {currentPromotion.actions.dismiss.text}
                    </Button>
                    
                    {currentPromotion.actions.dismiss.remindLater && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismiss(true)}
                        className="btn-ghost text-tertiary"
                      >
                        Me rappeler plus tard
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
