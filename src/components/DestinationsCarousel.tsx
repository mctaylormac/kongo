import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Star,
  Heart,
  ArrowRight,
  Plane,
  Users
} from "lucide-react";

interface Destination {
  id: string;
  from: string;
  to: string;
  price: number;
  currency: string;
  duration: string;
  distance: string;
  image: string;
  popular: boolean;
  discount?: number;
  features: string[];
  rating: number;
  nextDeparture: string;
}

interface DestinationsCarouselProps {
  favoriteRoutes: any[];
}

export function DestinationsCarousel({ favoriteRoutes }: DestinationsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const destinations: Destination[] = [
    {
      id: "1",
      from: "Kinshasa",
      to: "Lubumbashi",
      price: 125000,
      currency: "CDF",
      duration: "16h",
      distance: "1,200km",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      popular: true,
      discount: 15,
      features: ["WiFi", "Climatisation", "Repas"],
      rating: 4.8,
      nextDeparture: "Aujourd'hui 14:00"
    },
    {
      id: "2",
      from: "Kinshasa",
      to: "Goma",
      price: 95000,
      currency: "CDF",
      duration: "12h",
      distance: "850km",
      image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=300&fit=crop",
      popular: true,
      features: ["WiFi", "Climatisation"],
      rating: 4.6,
      nextDeparture: "Demain 08:00"
    },
    {
      id: "3",
      from: "Lubumbashi",
      to: "Kolwezi",
      price: 45000,
      currency: "CDF",
      duration: "4h",
      distance: "220km",
      image: "https://images.unsplash.com/photo-1558618288-fbd25c85cd64?w=400&h=300&fit=crop",
      popular: false,
      features: ["Climatisation"],
      rating: 4.3,
      nextDeparture: "Aujourd'hui 16:30"
    },
    {
      id: "4",
      from: "Kinshasa",
      to: "Matadi",
      price: 35000,
      currency: "CDF",
      duration: "5h",
      distance: "350km",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      popular: false,
      features: ["WiFi", "Climatisation", "Toilettes"],
      rating: 4.5,
      nextDeparture: "Aujourd'hui 10:00"
    },
    {
      id: "5",
      from: "Goma",
      to: "Bukavu",
      price: 25000,
      currency: "CDF",
      duration: "3h",
      distance: "180km",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
      popular: true,
      features: ["Climatisation", "Vue panoramique"],
      rating: 4.7,
      nextDeparture: "Demain 07:00"
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % destinations.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, destinations.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % destinations.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + destinations.length) % destinations.length);
    setIsAutoPlaying(false);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: currency === 'CDF' ? 'CDF' : 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const getVisibleDestinations = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      const index = (currentIndex + i) % destinations.length;
      visible.push({ ...destinations[index], displayIndex: i });
    }
    return visible;
  };

  return (
    <section className="py-24 bg-surface-secondary relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${encodeURIComponent('101820').slice(1)}' fill-opacity='0.1'%3E%3Cpath d='M20 20h60v60H20z' fill='none' stroke='%23${encodeURIComponent('bfeb30').slice(1)}' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="container-professional relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-6"
        >
          <Badge className="status-kongo mx-auto px-6 py-3">
            <Plane className="w-4 h-4 mr-2" />
            <span className="text-body-small font-semibold">DESTINATIONS POPULAIRES</span>
          </Badge>
          
          <h2 className="text-display-2 text-kongo-black leading-tight">
            Explorez le
            <span className="block text-kongo-lime">Congo avec KonGO</span>
          </h2>
          
          <p className="text-body-large text-secondary max-w-2xl mx-auto leading-relaxed">
            Découvrez nos routes les plus demandées avec des tarifs préférentiels et un service de qualité garantie.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 flex justify-between z-20 pointer-events-none">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevSlide}
              className="w-12 h-12 bg-surface-elevated border border-border-primary rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all pointer-events-auto"
              aria-label="Destination précédente"
            >
              <ChevronLeft className="w-5 h-5 text-kongo-black" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextSlide}
              className="w-12 h-12 bg-surface-elevated border border-border-primary rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all pointer-events-auto"
              aria-label="Destination suivante"
            >
              <ChevronRight className="w-5 h-5 text-kongo-black" />
            </motion.button>
          </div>

          {/* Carousel Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-8">
            <AnimatePresence mode="wait">
              {getVisibleDestinations().map((destination, index) => (
                <motion.div
                  key={`${destination.id}-${currentIndex}`}
                  initial={{ opacity: 0, x: 50 * (index + 1), scale: 0.9 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0, 
                    scale: index === 1 ? 1.05 : 1,
                    zIndex: index === 1 ? 10 : 1
                  }}
                  exit={{ opacity: 0, x: -50, scale: 0.9 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: "easeOut",
                    delay: index * 0.1 
                  }}
                  className="relative"
                >
                  <Card className={`card-interactive h-full overflow-hidden ${
                    index === 1 ? 'ring-2 ring-kongo-lime shadow-kongo-lime' : ''
                  }`}>
                    {/* Image Section */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={destination.image}
                        alt={`${destination.from} vers ${destination.to}`}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                      
                      {/* Overlay Badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                        {destination.popular && (
                          <Badge className="status-kongo">
                            <Star className="w-3 h-3 mr-1" />
                            Populaire
                          </Badge>
                        )}
                        
                        {destination.discount && (
                          <Badge className="bg-error text-white border-error">
                            -{destination.discount}%
                          </Badge>
                        )}
                      </div>

                      {/* Favorite Button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-3 right-3 w-8 h-8 bg-surface-elevated rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all"
                      >
                        <Heart className="w-4 h-4 text-quaternary hover:text-error" />
                      </motion.button>
                    </div>

                    <CardContent className="p-6 space-y-4">
                      {/* Route Header */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-h4 text-kongo-black font-semibold">
                            {destination.from}
                          </h3>
                          <ArrowRight className="w-5 h-5 text-kongo-lime" />
                          <h3 className="text-h4 text-kongo-black font-semibold">
                            {destination.to}
                          </h3>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-body-small text-secondary">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{destination.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{destination.distance}</span>
                          </div>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex flex-wrap gap-2">
                        {destination.features.slice(0, 3).map((feature, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-surface-tertiary text-caption text-tertiary rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      {/* Rating and Next Departure */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-warning fill-current" />
                            <span className="text-body-small font-medium">{destination.rating}</span>
                            <span className="text-body-small text-secondary">(45+ avis)</span>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-h5 text-kongo-black font-bold">
                              {formatPrice(destination.price, destination.currency)}
                            </div>
                            {destination.discount && (
                              <div className="text-caption text-tertiary line-through">
                                {formatPrice(destination.price * (1 + destination.discount / 100), destination.currency)}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-body-small text-success">
                          <Users className="w-4 h-4 inline mr-1" />
                          {destination.nextDeparture}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button className="btn-primary w-full">
                        Réserver Maintenant
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center space-x-2 mt-8">
            {destinations.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setIsAutoPlaying(false);
                }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-kongo-lime scale-125' 
                    : 'bg-surface-tertiary hover:bg-kongo-lime/50'
                }`}
                aria-label={`Aller à la destination ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mt-16"
        >
          <div className="space-y-6">
            <h3 className="text-h3 text-kongo-black">
              Votre destination n'est pas listée ?
            </h3>
            
            <p className="text-body text-secondary max-w-2xl mx-auto">
              Explorez toutes nos destinations disponibles ou contactez-nous pour des trajets personnalisés.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-secondary px-8 py-4">
                Voir Toutes les Destinations
              </Button>
              
              <Button className="btn-outline px-8 py-4">
                Demander un Trajet Personnalisé
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}