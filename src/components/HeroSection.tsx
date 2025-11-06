import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { 
  MapPin, 
  Calendar, 
  Users, 
  ArrowLeftRight, 
  Search,
  Shield,
  Clock,
  Award,
  TrendingUp,
  CheckCircle,
  Star,
  ArrowRight,
  Phone,
  Sparkles,
  Zap,
  Train,
  Bus
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner@2.0.3";

interface HeroSectionProps {
  onSearch?: (searchParams: any) => void;
}

export function HeroSection({ onSearch }: HeroSectionProps) {
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [transportType, setTransportType] = useState("all");
  const [isSearching, setIsSearching] = useState(false);

  const trustIndicators = [
    { 
      icon: Shield, 
      text: "Paiements 100% Sécurisés", 
      detail: "SSL & Chiffrement Bancaire",
      color: "text-success" 
    },
    { 
      icon: Clock, 
      text: "Ponctualité Garantie", 
      detail: "98% de nos bus partent à l'heure",
      color: "text-info" 
    },
    { 
      icon: Award, 
      text: "Service Primé", 
      detail: "Meilleur Transport RDC 2024",
      color: "text-kongo-lime-dark" 
    }
  ];

  const stats = [
    { number: "2M+", label: "Passagers Transportés", sublabel: "Depuis 2020" },
    { number: "50+", label: "Destinations", sublabel: "À travers la RDC" },
    { number: "99.2%", label: "Satisfaction Client", sublabel: "Note moyenne" },
    { number: "24/7", label: "Support Client", sublabel: "Toujours disponible" }
  ];

  const quickRoutes = [
    {
      from: "Kinshasa", to: "Lubumbashi", 
      price: "125,000 CDF", duration: "16h", 
      fromValue: "kinshasa", toValue: "lubumbashi",
      discount: "15%", popular: true
    },
    {
      from: "Kinshasa", to: "Goma", 
      price: "95,000 CDF", duration: "12h", 
      fromValue: "kinshasa", toValue: "goma",
      discount: "10%", popular: true
    },
    {
      from: "Lubumbashi", to: "Bukavu", 
      price: "85,000 CDF", duration: "10h", 
      fromValue: "lubumbashi", toValue: "bukavu",
      discount: "5%", popular: false
    }
  ];

  useEffect(() => {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDepartureDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  const handleSearch = async () => {
    if (!fromLocation || !toLocation) {
      toast.error("Veuillez sélectionner les villes de départ et d'arrivée", {
        description: "Ces informations sont nécessaires pour votre recherche",
        action: {
          label: "Guide",
          onClick: () => {
            toast.info("💡 Guide rapide", {
              description: "1) Choisissez votre ville de départ\n2) Sélectionnez votre destination\n3) Cliquez sur Rechercher"
            });
          }
        }
      });
      return;
    }

    if (fromLocation === toLocation) {
      toast.error("La ville de départ et d'arrivée ne peuvent pas être identiques", {
        description: "Choisissez deux villes différentes pour votre voyage"
      });
      return;
    }

    setIsSearching(true);
    
    // Show progress toast
    toast.loading("Recherche en cours...", {
      id: 'search-progress',
      description: `${fromLocation.charAt(0).toUpperCase() + fromLocation.slice(1)} → ${toLocation.charAt(0).toUpperCase() + toLocation.slice(1)}`
    });
    
    // Simulate search delay with realistic progress
    await new Promise(resolve => {
      setTimeout(() => {
        toast.loading("Analyse des disponibilités...", { id: 'search-progress' });
      }, 500);
      
      setTimeout(() => {
        toast.loading("Comparaison des prix...", { id: 'search-progress' });
      }, 1000);
      
      setTimeout(resolve, 1500);
    });
    
    const searchParams = {
      from: fromLocation.charAt(0).toUpperCase() + fromLocation.slice(1),
      to: toLocation.charAt(0).toUpperCase() + toLocation.slice(1),
      date: departureDate,
      passengers: parseInt(passengers),
      transportType: transportType as 'bus' | 'train' | 'all'
    };
    
    // Success message
    toast.success("Résultats trouvés !", {
      id: 'search-progress',
      description: `${searchParams.passengers} passager${searchParams.passengers > 1 ? 's' : ''} • ${searchParams.date}`,
      action: {
        label: "Filtres",
        onClick: () => {
          toast.info("🔍 Filtres disponibles", {
            description: "Prix, horaires, équipements et plus encore"
          });
        }
      }
    });
    
    setIsSearching(false);
    onSearch?.(searchParams);
  };

  const swapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const handleQuickSearch = (route: any) => {
    setFromLocation(route.fromValue);
    setToLocation(route.toValue);
    
    // Trigger quick search event
    const quickSearchEvent = new CustomEvent('quick-search', {
      detail: { from: route.from, to: route.to }
    });
    window.dispatchEvent(quickSearchEvent);
    
    toast.success(`Route ${route.from} → ${route.to} sélectionnée`, {
      description: `Prix à partir de ${route.price}`,
      action: {
        label: "Rechercher",
        onClick: () => {
          const searchParams = {
            from: route.from,
            to: route.to,
            date: departureDate,
            passengers: parseInt(passengers)
          };
          onSearch?.(searchParams);
        }
      }
    });
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <section className="relative bg-gradient-kongo-subtle min-h-screen flex items-center pt-32 pb-20 overflow-hidden">
      {/* Background Pattern with KonGO Brand */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${encodeURIComponent('bfeb30').slice(1)}' fill-opacity='0.6'%3E%3Ccircle cx='5' cy='5' r='1'/%3E%3Ccircle cx='55' cy='55' r='1'/%3E%3Cpath d='M10 10h40v40H10z' fill='none' stroke='%23${encodeURIComponent('101820').slice(1)}' stroke-width='0.5' stroke-opacity='0.3'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Animated KonGO Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 0.4, 0],
              scale: [0, 1, 0],
              y: [0, -100, -200]
            }}
            transition={{
              duration: 6,
              delay: i * 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
            className="absolute w-3 h-3 bg-kongo-lime rounded-full shadow-kongo-lime"
            style={{
              left: `${10 + i * 12}%`,
              bottom: '15%'
            }}
          />
        ))}
      </div>

      <div className="container-professional relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            {/* Trust Badge with KonGO Branding */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center"
            >
              <Badge className="status-kongo px-6 py-3 text-body-small">
                <Sparkles className="w-4 h-4 mr-2" />
                Plateforme de Transport N°1 en RDC
                <Zap className="w-4 h-4 ml-2" />
              </Badge>
            </motion.div>

            {/* Main Heading with KonGO Colors */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="space-y-6"
            >
              <h1 className="text-display-1 leading-tight">
                Voyagez à travers le{" "}
                <span className="text-kongo-black font-extrabold">Congo</span>{" "}
                <br />
                avec{" "}
                <span className="relative inline-block">
                  <span className="text-kongo-lime font-extrabold">KonGO</span>
                  <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 1.2, duration: 0.8 }}
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-kongo-lime rounded-full"
                  />
                </span>
              </h1>
              
              <p className="text-body-large text-secondary max-w-xl leading-relaxed">
                La première plateforme professionnelle de réservation de bus en République Démocratique du Congo.{" "}
                <span className="text-kongo-black font-semibold">Sécurisé</span>,{" "}
                <span className="text-kongo-black font-semibold">fiable</span> et{" "}
                <span className="text-kongo-black font-semibold">accessible 24h/7j</span>.
              </p>
            </motion.div>

            {/* Trust Indicators avec KonGO Styling */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {trustIndicators.map((indicator, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-start space-x-3 p-4 bg-surface-elevated rounded-xl border border-border-primary hover:border-kongo-lime/30 hover:shadow-kongo-lime/20 hover:shadow-md transition-all duration-300"
                >
                  <div className="p-2 rounded-lg bg-surface-kongo-lime-light border border-kongo-lime/20">
                    <indicator.icon className={`w-5 h-5 ${indicator.color}`} />
                  </div>
                  <div>
                    <div className="text-body-small text-kongo-black font-semibold">
                      {indicator.text}
                    </div>
                    <div className="text-caption text-tertiary">
                      {indicator.detail}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Buttons avec KonGO Styling */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  className="btn-primary flex items-center justify-center px-8 py-4 shadow-kongo-black hover:shadow-lg text-h6"
                  onClick={() => {
                    document.getElementById('search-form')?.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'center'
                    });
                  }}
                >
                  <Search className="w-5 h-5 mr-3" />
                  Réserver Maintenant
                  <ArrowRight className="w-4 h-4 ml-3" />
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  className="btn-outline-lime flex items-center justify-center px-8 py-4 text-h6"
                  onClick={() => {
                    window.open('tel:+243123456789', '_self');
                  }}
                >
                  <Phone className="w-5 h-5 mr-3" />
                  Appeler Maintenant
                </Button>
              </motion.div>
            </motion.div>

            {/* Demo Button - Access to Seat Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="pt-6 border-t border-kongo-lime/20"
            >
              <div className="text-center">
                <p className="text-body-small text-secondary mb-4">
                  🎭 <span className="font-semibold">Démo Développeur</span> - Accès direct aux fonctionnalités
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      className="btn-secondary flex items-center justify-center px-6 py-3 text-body"
                      onClick={() => {
                        // Create mock data for seat selection demo
                        const mockSearchParams = {
                          from: "Kinshasa",
                          to: "Lubumbashi", 
                          date: new Date().toISOString().split('T')[0],
                          passengers: 2,
                          transportType: 'bus' as 'bus' | 'train' | 'all'
                        };
                        
                        const mockTrip = {
                          id: "demo-trip-1",
                          operator: "KonGO Premium",
                          from: "Kinshasa", 
                          to: "Lubumbashi",
                          departure: "14:00",
                          arrival: "06:00+1", 
                          duration: "16h",
                          price: 125000,
                          currency: "CDF",
                          amenities: ["WiFi", "Climatisation", "Repas", "Toilettes"],
                          seatsAvailable: 28,
                          vehicleType: "bus",
                          busType: "Luxury Coach",
                          date: mockSearchParams.date
                        };
                        
                        // Call onSearch with mock data and navigate to seats
                        onSearch?.(mockSearchParams);
                        
                        // Set mock trip and navigate to seat selection after a short delay
                        setTimeout(() => {
                          // This would normally be handled by the parent App component
                          // For demo purposes, we'll trigger a custom event
                          const event = new CustomEvent('demo-seat-selection', {
                            detail: { trip: mockTrip, searchParams: mockSearchParams }
                          });
                          window.dispatchEvent(event);
                        }, 100);
                      }}
                    >
                      🚌 Voir la Carte des Sièges (Bus)
                    </Button>
                  </motion.div>
                  
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button 
                      className="btn-outline-lime flex items-center justify-center px-6 py-3 text-body"
                      onClick={() => {
                        // Create mock data for train seat selection demo
                        const mockSearchParams = {
                          from: "Kinshasa",
                          to: "Lubumbashi", 
                          date: new Date().toISOString().split('T')[0],
                          passengers: 2,
                          transportType: 'train' as 'bus' | 'train' | 'all'
                        };
                        
                        const mockTrip = {
                          id: "demo-train-1",
                          operator: "SNCC - Société Nationale des Chemins de fer du Congo",
                          from: "Kinshasa", 
                          to: "Lubumbashi",
                          departure: "07:00",
                          arrival: "19:30", 
                          duration: "12h30",
                          price: 95000,
                          currency: "CDF",
                          amenities: ["ac", "meals", "sleeping", "observation"],
                          seatsAvailable: 24,
                          vehicleType: "train",
                          trainType: "Express Minier",
                          trainClass: "business",
                          date: mockSearchParams.date
                        };
                        
                        // Call onSearch with mock data and navigate to seats
                        onSearch?.(mockSearchParams);
                        
                        // Set mock trip and navigate to seat selection after a short delay
                        setTimeout(() => {
                          // This would normally be handled by the parent App component
                          // For demo purposes, we'll trigger a custom event
                          const event = new CustomEvent('demo-seat-selection', {
                            detail: { trip: mockTrip, searchParams: mockSearchParams }
                          });
                          window.dispatchEvent(event);
                        }, 100);
                      }}
                    >
                      🚂 Voir la Carte des Places (Train)
                    </Button>
                  </motion.div>

                </div>
              </div>
            </motion.div>

            {/* Stats avec KonGO Branding */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8 border-t border-kongo-lime/20"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 rounded-lg hover:bg-surface-kongo-lime-light transition-all duration-300"
                >
                  <div className="text-h3 text-kongo-black font-bold">
                    {stat.number}
                  </div>
                  <div className="text-body-small text-primary font-medium">
                    {stat.label}
                  </div>
                  <div className="text-caption text-tertiary">
                    {stat.sublabel}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Column - Search Form avec KonGO Styling */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            <Card 
              id="search-form" 
              className="card-elevated bg-surface-elevated p-8 shadow-2xl border border-kongo-lime/10 hover:border-kongo-lime/30 hover:shadow-kongo-lime/10 transition-all duration-300"
            >
              <CardContent className="p-0 space-y-8">
                {/* Form Header avec KonGO Branding */}
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center space-x-2 bg-surface-kongo-lime-light px-4 py-2 rounded-full">
                    <div className="w-2 h-2 bg-kongo-lime rounded-full animate-pulse" />
                    <span className="text-caption text-kongo-lime-dark font-bold">RÉSERVATION EN DIRECT</span>
                  </div>
                  
                  <h3 className="text-h3 text-kongo-black">
                    Réservez Votre Voyage
                  </h3>
                  <p className="text-body-small text-secondary">
                    Recherchez et réservez vos billets en quelques clics
                  </p>
                  
                  <div className="flex items-center justify-center space-x-3">
                    <Badge className="status-success">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Temps Réel
                    </Badge>
                    <Badge className="status-info">
                      <Shield className="w-3 h-3 mr-1" />
                      Sécurisé
                    </Badge>
                    <Badge className="status-kongo">
                      <Star className="w-3 h-3 mr-1" />
                      KonGO
                    </Badge>
                  </div>
                </div>

                {/* Search Form */}
                <div className="space-y-6">
                  {/* From/To Locations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                    <div className="space-y-2">
                      <label className="text-label text-kongo-black flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-success" />
                        <span className="font-semibold">Ville de départ</span>
                      </label>
                      <Select value={fromLocation} onValueChange={setFromLocation}>
                        <SelectTrigger className="h-12 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime/20 bg-surface-primary">
                          <SelectValue placeholder="Sélectionnez votre départ" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kinshasa">Kinshasa</SelectItem>
                          <SelectItem value="lubumbashi">Lubumbashi</SelectItem>
                          <SelectItem value="goma">Goma</SelectItem>
                          <SelectItem value="bukavu">Bukavu</SelectItem>
                          <SelectItem value="kananga">Kananga</SelectItem>
                          <SelectItem value="mbuji-mayi">Mbuji-Mayi</SelectItem>
                          <SelectItem value="kisangani">Kisangani</SelectItem>
                          <SelectItem value="kolwezi">Kolwezi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-label text-kongo-black flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-error" />
                        <span className="font-semibold">Ville d'arrivée</span>
                      </label>
                      <Select value={toLocation} onValueChange={setToLocation}>
                        <SelectTrigger className="h-12 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime/20 bg-surface-primary">
                          <SelectValue placeholder="Sélectionnez votre destination" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kinshasa">Kinshasa</SelectItem>
                          <SelectItem value="lubumbashi">Lubumbashi</SelectItem>
                          <SelectItem value="goma">Goma</SelectItem>
                          <SelectItem value="bukavu">Bukavu</SelectItem>
                          <SelectItem value="kananga">Kananga</SelectItem>
                          <SelectItem value="mbuji-mayi">Mbuji-Mayi</SelectItem>
                          <SelectItem value="kisangani">Kisangani</SelectItem>
                          <SelectItem value="kolwezi">Kolwezi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Swap Button avec KonGO Styling */}
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={swapLocations}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-kongo-lime text-kongo-black rounded-full flex items-center justify-center z-10 shadow-kongo-lime hover:bg-kongo-lime-hover hover:shadow-lg transition-all duration-300"
                      disabled={!fromLocation && !toLocation}
                    >
                      <ArrowLeftRight className="w-5 h-5 font-bold" />
                    </motion.button>
                  </div>

                  {/* Transport Type */}
                  <div className="space-y-2">
                    <label className="text-label text-kongo-black flex items-center space-x-2">
                      <Train className="w-4 h-4 text-kongo-lime-dark" />
                      <span className="font-semibold">Type de transport</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTransportType("bus")}
                        className={`h-12 rounded-lg border-2 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                          transportType === "bus" 
                            ? 'border-kongo-lime bg-surface-kongo-lime-light text-kongo-lime-dark' 
                            : 'border-border-secondary hover:border-kongo-lime/50 bg-surface-primary'
                        }`}
                      >
                        <Bus className="w-4 h-4" />
                        <span className="text-caption font-medium">Bus</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTransportType("train")}
                        className={`h-12 rounded-lg border-2 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                          transportType === "train" 
                            ? 'border-kongo-lime bg-surface-kongo-lime-light text-kongo-lime-dark' 
                            : 'border-border-secondary hover:border-kongo-lime/50 bg-surface-primary'
                        }`}
                      >
                        <Train className="w-4 h-4" />
                        <span className="text-caption font-medium">Train</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setTransportType("all")}
                        className={`h-12 rounded-lg border-2 flex flex-col items-center justify-center space-y-1 transition-all duration-200 ${
                          transportType === "all" 
                            ? 'border-kongo-lime bg-surface-kongo-lime-light text-kongo-lime-dark' 
                            : 'border-border-secondary hover:border-kongo-lime/50 bg-surface-primary'
                        }`}
                      >
                        <div className="flex items-center space-x-1">
                          <Bus className="w-3 h-3" />
                          <Train className="w-3 h-3" />
                        </div>
                        <span className="text-caption font-medium">Tous</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* Date and Passengers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-label text-kongo-black flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-info" />
                        <span className="font-semibold">Date de départ</span>
                      </label>
                      <Input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="h-12 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime/20 bg-surface-primary"
                        min={today}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-label text-kongo-black flex items-center space-x-2">
                        <Users className="w-4 h-4 text-warning" />
                        <span className="font-semibold">Passagers</span>
                      </label>
                      <Select value={passengers} onValueChange={setPassengers}>
                        <SelectTrigger className="h-12 border-border-secondary focus:border-kongo-lime focus:ring-kongo-lime/20 bg-surface-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(6)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1} {i === 0 ? 'passager' : 'passagers'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Search Button avec KonGO Styling */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="btn-primary w-full h-16 text-h6 shadow-kongo-black hover:shadow-xl"
                    >
                      {isSearching ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          <Search className="w-6 h-6 mr-3" />
                          <span className="font-bold">Rechercher des Trajets</span>
                          <TrendingUp className="w-5 h-5 ml-3" />
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Quick Routes avec KonGO Branding */}
                  <div className="pt-6 border-t border-kongo-lime/20">
                    <h4 className="text-label text-kongo-black mb-4 flex items-center font-semibold">
                      <Star className="w-4 h-4 mr-2 text-kongo-lime" />
                      Routes Populaires KonGO
                    </h4>
                    <div className="space-y-3">
                      {quickRoutes.map((route, index) => (
                        <motion.button
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 1 + index * 0.1 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          onClick={() => handleQuickSearch(route)}
                          className="w-full text-left p-4 rounded-lg border border-border-primary hover:border-kongo-lime hover:shadow-kongo-lime/20 hover:shadow-md transition-all bg-surface-secondary hover:bg-surface-kongo-lime-light group duration-300"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="text-body text-kongo-black font-semibold group-hover:text-kongo-black transition-colors">
                                {route.from} → {route.to}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className="status-info text-caption">
                                  {route.duration}
                                </Badge>
                                {route.popular && (
                                  <Badge className="status-kongo text-caption">
                                    Populaire
                                  </Badge>
                                )}
                                {route.discount && (
                                  <Badge className="status-success text-caption">
                                    -{route.discount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-body text-kongo-black font-bold">
                                {route.price}
                              </div>
                              <div className="text-caption text-tertiary">
                                par personne
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Support Notice avec KonGO Branding */}
                  <div className="bg-surface-kongo-lime-light p-6 rounded-xl border border-kongo-lime/20">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-kongo-lime rounded-lg">
                        <Phone className="w-5 h-5 text-kongo-black" />
                      </div>
                      <div>
                        <div className="text-body-small text-kongo-black font-semibold">
                          Besoin d'aide pour votre réservation ?
                        </div>
                        <div className="text-caption text-secondary">
                          Notre équipe KonGO est disponible 24h/7j au{" "}
                          <span className="text-kongo-black font-bold">+243 123 456 789</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}