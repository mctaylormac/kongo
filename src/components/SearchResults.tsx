import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Slider } from "./ui/slider";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { PriceAlertWaitlist } from "./PriceAlertWaitlist";
import { RealTimeSeatAvailability } from "./RealTimeSeatAvailability";
import { RouteMap } from "./RouteMap";
import { InteractiveRouteMap } from "./InteractiveRouteMap";
import { 
  Clock, 
  Users, 
  Star, 
  MapPin, 
  Filter,
  SortAsc,
  Calendar,
  Zap,
  Shield,
  Wifi,
  Coffee,
  Smartphone,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Train,
  Bus
} from "lucide-react";

interface SearchResultsProps {
  searchParams: {
    from: string;
    to: string;
    date: string;
    passengers: number;
    transportType?: 'bus' | 'train' | 'all';
  } | null;
  onSelectTrip: (trip: any) => void;
}

export function SearchResults({ searchParams, onSelectTrip }: SearchResultsProps) {
  const [trips, setTrips] = useState<any[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("departure");
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [departureTimeRange, setDepartureTimeRange] = useState<string[]>([]);
  const [selectedTransportTypes, setSelectedTransportTypes] = useState<string[]>([]);

  // Provide default values if searchParams is null
  const defaultSearchParams = {
    from: "Kinshasa",
    to: "Lubumbashi", 
    date: new Date().toISOString().split('T')[0],
    passengers: 1,
    transportType: 'all' as 'bus' | 'train' | 'all'
  };

  const currentSearchParams = searchParams || defaultSearchParams;

  // Mock trip data - including trains and buses
  const mockTrips = [
    // Bus trips
    {
      id: 'trip1',
      company: 'Express Congo',
      route: `${currentSearchParams.from} → ${currentSearchParams.to}`,
      departure: '06:00',
      arrival: '22:00',
      duration: '16h',
      price: 125000,
      availableSeats: 12,
      totalSeats: 50,
      rating: 4.8,
      reviews: 234,
      amenities: ['wifi', 'ac', 'charging', 'meals'],
      vehicleType: 'bus' as const,
      busType: 'VIP',
      isPopular: true,
      stops: ['Kananga', 'Mbuji-Mayi'],
      features: ['Sièges inclinables', 'Climatisation', 'WiFi gratuit', 'Repas inclus']
    },
    {
      id: 'trip2',
      company: 'Trans-Katanga',
      route: `${currentSearchParams.from} → ${currentSearchParams.to}`,
      departure: '08:30',
      arrival: '01:30+1',
      duration: '17h',
      price: 98000,
      availableSeats: 8,
      totalSeats: 45,
      rating: 4.5,
      reviews: 189,
      amenities: ['ac', 'charging'],
      vehicleType: 'bus' as const,
      busType: 'Standard',
      isPopular: false,
      stops: ['Kolwezi'],
      features: ['Climatisation', 'Prises USB']
    },
    {
      id: 'trip3',
      company: 'Virunga Express',
      route: `${currentSearchParams.from} → ${currentSearchParams.to}`,
      departure: '14:00',
      arrival: '07:00+1',
      duration: '17h',
      price: 135000,
      availableSeats: 0,
      totalSeats: 52,
      rating: 4.9,
      reviews: 312,
      amenities: ['wifi', 'ac', 'charging', 'meals', 'entertainment'],
      vehicleType: 'bus' as const,
      busType: 'Luxury',
      isPopular: true,
      stops: ['Kananga'],
      features: ['Sièges couchettes', 'WiFi haut débit', 'Divertissement', 'Service premium']
    },
    {
      id: 'trip4',
      company: 'Congo Lines',
      route: `${currentSearchParams.from} → ${currentSearchParams.to}`,
      departure: '20:00',
      arrival: '13:00+1',
      duration: '17h',
      price: 110000,
      availableSeats: 25,
      totalSeats: 48,
      rating: 4.3,
      reviews: 156,
      amenities: ['ac', 'charging'],
      vehicleType: 'bus' as const,
      busType: 'Standard',
      isPopular: false,
      stops: ['Mbuji-Mayi', 'Kolwezi'],
      features: ['Climatisation', 'Prises électriques']
    },
    // Bus coastal route: Kinshasa → Matadi → Boma → Muanda
    {
      id: 'trip5',
      company: 'Atlantic Express',
      route: 'Kinshasa → Matadi → Boma → Muanda',
      departure: '05:30',
      arrival: '18:00',
      duration: '12h30',
      price: 85000,
      availableSeats: 18,
      totalSeats: 42,
      rating: 4.7,
      reviews: 187,
      amenities: ['wifi', 'ac', 'charging', 'meals'],
      vehicleType: 'bus' as const,
      busType: 'VIP Coastal',
      isPopular: true,
      stops: ['Matadi', 'Boma'],
      features: ['Panorama océanique', 'Guide touristique', 'Climatisation', 'WiFi gratuit', 'Collations locales'],
      isMultiLeg: true,
      legs: [
        {
          from: 'Kinshasa',
          to: 'Matadi',
          departure: '05:30',
          arrival: '09:45',
          duration: '4h15',
          distance: '365 km',
          highlights: ['Fleuve Congo', 'Paysages montagneux']
        },
        {
          from: 'Matadi',
          to: 'Boma',
          departure: '10:30',
          arrival: '13:15',
          duration: '2h45',
          distance: '135 km',
          highlights: ['Port historique', 'Architecture coloniale']
        },
        {
          from: 'Boma',
          to: 'Muanda',
          departure: '14:00',
          arrival: '18:00',
          duration: '4h',
          distance: '185 km',
          highlights: ['Côte atlantique', 'Plages naturelles', 'Terminal pétrolier']
        }
      ],
      description: 'Découvrez la route côtière du Kongo Central : de la capitale aux plages de l\'Atlantique en passant par les villes historiques de Matadi et Boma.',
      touristHighlights: [
        'Vue sur l\'océan Atlantique',
        'Port historique de Matadi',
        'Architecture coloniale de Boma',
        'Plages de Muanda',
        'Terminal pétrolier moderne'
      ]
    },
    
    // Trains ferroviaires RDC
    {
      id: 'train1',
      company: 'SNCC - Société Nationale des Chemins de fer du Congo',
      route: `${currentSearchParams.from} → ${currentSearchParams.to}`,
      departure: '07:00',
      arrival: '19:30',
      duration: '12h30',
      price: 95000,
      availableSeats: 24,
      totalSeats: 120,
      rating: 4.2,
      reviews: 89,
      amenities: ['ac', 'meals', 'sleeping', 'observation'],
      vehicleType: 'train' as const,
      trainType: 'Express Minier',
      trainClass: 'business' as const,
      isPopular: true,
      stops: ['Kananga', 'Mbuji-Mayi', 'Kamina'],
      features: ['Wagons-lits', 'Restaurant à bord', 'Observation panoramique', 'WiFi limité'],
      description: 'Train express moderne reliant les principales villes minières avec confort et ponctualité.',
      trainFeatures: [
        'Voiture-restaurant avec cuisine locale',
        'Compartiments couchettes climatisés', 
        'Wagon panoramique',
        'Arrêts dans les gares historiques'
      ]
    },
    {
      id: 'train2', 
      company: 'SNCC - Société Nationale des Chemins de fer du Congo',
      route: `${currentSearchParams.from} → ${currentSearchParams.to}`,
      departure: '15:00',
      arrival: '08:15+1',
      duration: '17h15',
      price: 75000,
      availableSeats: 45,
      totalSeats: 200,
      rating: 3.9,
      reviews: 156,
      amenities: ['meals', 'sleeping'],
      vehicleType: 'train' as const,
      trainType: 'Omnibus Regional',
      trainClass: 'economy' as const,
      isPopular: false,
      stops: ['Kikwit', 'Kananga', 'Mbuji-Mayi', 'Kamina', 'Kolwezi'],
      features: ['Couchettes économiques', 'Service de restauration', 'Transport de marchandises'],
      description: 'Train régional économique avec de nombreux arrêts, idéal pour découvrir les régions rurales.',
      trainFeatures: [
        'Tarifs économiques',
        'Découverte des paysages ruraux',
        'Arrêts fréquents dans les villages',
        'Transport possible de bagages volumineux'
      ]
    },
    {
      id: 'train3',
      company: 'Congo Rail Express',
      route: 'Kinshasa → Matadi',
      departure: '06:30',
      arrival: '10:45',
      duration: '4h15',
      price: 45000,
      availableSeats: 32,
      totalSeats: 80,
      rating: 4.6,
      reviews: 203,
      amenities: ['ac', 'wifi', 'charging', 'observation'],
      vehicleType: 'train' as const,
      trainType: 'Express Côtier',
      trainClass: 'business' as const,
      isPopular: true,
      stops: ['Kimpese'],
      features: ['Vue sur le fleuve Congo', 'WiFi haut débit', 'Climatisation', 'Prises électriques'],
      description: 'Liaison rapide vers le port de Matadi avec vues spectaculaires sur le fleuve Congo.',
      trainFeatures: [
        'Parcours le long du fleuve Congo',
        'Arrivée directe au port de Matadi',
        'Connexion WiFi stable',
        'Ponctualité garantie'
      ]
    },
    {
      id: 'train4',
      company: 'SNCC - Société Nationale des Chemins de fer du Congo',
      route: 'Kinshasa → Ilebo',
      departure: '08:00',
      arrival: '20:30',
      duration: '12h30',
      price: 68000,
      availableSeats: 28,
      totalSeats: 150,
      rating: 4.1,
      reviews: 124,
      amenities: ['meals', 'sleeping', 'charging'],
      vehicleType: 'train' as const,
      trainType: 'Express Kasaï',
      trainClass: 'economy' as const,
      isPopular: false,
      stops: ['Kenge', 'Kikwit', 'Tshikapa'],
      features: ['Traverse la province du Kasaï', 'Couchettes simples', 'Restauration à bord'],
      description: 'Liaison vers la région du Kasaï, porte d\'entrée vers les zones diamantifères.',
      trainFeatures: [
        'Accès aux régions diamantifères',
        'Découverte du Kasaï traditionnel',
        'Transport économique',
        'Connexion fluviale possible vers Kinshasa'
      ]
    }
  ];

  const companies = ['Express Congo', 'Trans-Katanga', 'Virunga Express', 'Congo Lines', 'Atlantic Express', 'SNCC - Société Nationale des Chemins de fer du Congo', 'Congo Rail Express'];
  const amenities = [
    { id: 'wifi', label: 'WiFi', icon: Wifi },
    { id: 'ac', label: 'Climatisation', icon: Zap },
    { id: 'charging', label: 'Prises USB', icon: Smartphone },
    { id: 'meals', label: 'Repas inclus', icon: Coffee },
    { id: 'entertainment', label: 'Divertissement', icon: Star },
    { id: 'sleeping', label: 'Couchettes', icon: Clock },
    { id: 'observation', label: 'Vue panoramique', icon: MapPin }
  ];

  const timeRanges = [
    { id: 'early', label: 'Matin (05:00 - 12:00)' },
    { id: 'afternoon', label: 'Après-midi (12:00 - 18:00)' },
    { id: 'evening', label: 'Soir (18:00 - 00:00)' },
    { id: 'night', label: 'Nuit (00:00 - 05:00)' }
  ];

  // Simulate loading and data fetch
  useEffect(() => {
    if (!searchParams) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      setTrips(mockTrips);
      setFilteredTrips(mockTrips);
      setPriceRange([Math.min(...mockTrips.map(t => t.price)), Math.max(...mockTrips.map(t => t.price))]);
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchParams]);

  // Listen for auto-show map event
  useEffect(() => {
    const handleAutoShowMap = () => {
      setShowMap(true);
    };

    window.addEventListener('auto-show-map', handleAutoShowMap);
    
    return () => {
      window.removeEventListener('auto-show-map', handleAutoShowMap);
    };
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...trips];

    // Price filter
    filtered = filtered.filter(trip => trip.price >= priceRange[0] && trip.price <= priceRange[1]);

    // Company filter
    if (selectedCompanies.length > 0) {
      filtered = filtered.filter(trip => selectedCompanies.includes(trip.company));
    }

    // Amenities filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(trip => 
        selectedAmenities.some(amenity => trip.amenities.includes(amenity))
      );
    }

    // Time range filter
    if (departureTimeRange.length > 0) {
      filtered = filtered.filter(trip => {
        const hour = parseInt(trip.departure.split(':')[0]);
        return departureTimeRange.some(range => {
          switch (range) {
            case 'early': return hour >= 5 && hour < 12;
            case 'afternoon': return hour >= 12 && hour < 18;
            case 'evening': return hour >= 18 && hour <= 23;
            case 'night': return hour >= 0 && hour < 5;
            default: return true;
          }
        });
      });
    }

    // Transport type filter
    if (selectedTransportTypes.length > 0) {
      filtered = filtered.filter(trip => selectedTransportTypes.includes(trip.vehicleType));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'departure': return a.departure.localeCompare(b.departure);
        case 'duration': return parseInt(a.duration) - parseInt(b.duration);
        case 'rating': return b.rating - a.rating;
        default: return 0;
      }
    });

    setFilteredTrips(filtered);
  }, [trips, priceRange, selectedCompanies, selectedAmenities, departureTimeRange, sortBy, selectedTransportTypes]);

  const getAmenityIcon = (amenityId: string) => {
    const amenity = amenities.find(a => a.id === amenityId);
    return amenity ? amenity.icon : Star;
  };

  // If searchParams is null, show a message to start a search
  if (!searchParams) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="text-6xl mb-6">🚌</div>
          <h2 className="text-3xl font-bold text-kongo-black mb-4">
            Commencez votre recherche
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Utilisez le formulaire de recherche pour trouver vos trajets
          </p>
          <Button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-kongo-lime text-kongo-black hover:bg-kongo-lime-hover"
          >
            Retour à la recherche
          </Button>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-kongo-lime border-t-transparent rounded-full mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-kongo-black mb-2">Recherche en cours...</h2>
            <p className="text-gray-600">Nous cherchons les meilleurs trajets pour vous</p>
          </div>
          
          {/* Loading skeletons */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-32" />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Search Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-kongo-black mb-2">
              {currentSearchParams.from} → {currentSearchParams.to}
            </h1>
            <div className="flex items-center space-x-4 text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{currentSearchParams.date}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{currentSearchParams.passengers} passager{currentSearchParams.passengers > 1 ? 's' : ''}</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                {filteredTrips.length} résultat{filteredTrips.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowMap(!showMap)}
              className={`transition-all duration-200 ${showMap ? 'bg-kongo-lime text-kongo-black border-kongo-lime shadow-kongo-lime' : 'hover:border-kongo-lime/50'}`}
            >
              <MapPin className="w-4 h-4 mr-2" />
              {showMap ? 'Masquer la carte' : 'Voir le trajet'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </Button>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SortAsc className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="departure">Heure de départ</SelectItem>
                <SelectItem value="price-low">Prix croissant</SelectItem>
                <SelectItem value="price-high">Prix décroissant</SelectItem>
                <SelectItem value="duration">Durée</SelectItem>
                <SelectItem value="rating">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Map View */}
        <AnimatePresence>
          {showMap && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
            >
              <InteractiveRouteMap 
                route={{
                  from: currentSearchParams.from,
                  to: currentSearchParams.to
                }}
                stops={['Kananga', 'Mbuji-Mayi', 'Kolwezi']}
                showHotels={true}
                showServices={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`lg:block ${showFilters ? 'block' : 'hidden'} space-y-6`}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Filtres</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPriceRange([Math.min(...trips.map(t => t.price)), Math.max(...trips.map(t => t.price))]);
                      setSelectedCompanies([]);
                      setSelectedAmenities([]);
                      setDepartureTimeRange([]);
                      setSelectedTransportTypes([]);
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Réinitialiser
                  </Button>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Prix (CDF)</h4>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={Math.max(...trips.map(t => t.price))}
                    min={Math.min(...trips.map(t => t.price))}
                    step={5000}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{priceRange[0].toLocaleString()}</span>
                    <span>{priceRange[1].toLocaleString()}</span>
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Transport Type */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Type de transport</h4>
                  <div className="space-y-2">
                    {[
                      { id: 'bus', label: 'Bus', icon: Bus },
                      { id: 'train', label: 'Train', icon: Train }
                    ].map((type) => {
                      const IconComponent = type.icon;
                      return (
                        <div key={type.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={type.id}
                            checked={selectedTransportTypes.includes(type.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTransportTypes([...selectedTransportTypes, type.id]);
                              } else {
                                setSelectedTransportTypes(selectedTransportTypes.filter(t => t !== type.id));
                              }
                            }}
                          />
                          <label htmlFor={type.id} className="text-sm cursor-pointer flex items-center space-x-1">
                            <IconComponent className="w-3 h-3" />
                            <span>{type.label}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Companies */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Compagnies</h4>
                  <div className="space-y-2">
                    {companies.map((company) => (
                      <div key={company} className="flex items-center space-x-2">
                        <Checkbox
                          id={company}
                          checked={selectedCompanies.includes(company)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCompanies([...selectedCompanies, company]);
                            } else {
                              setSelectedCompanies(selectedCompanies.filter(c => c !== company));
                            }
                          }}
                        />
                        <label htmlFor={company} className="text-sm cursor-pointer">
                          {company}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Departure Time */}
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Heure de départ</h4>
                  <div className="space-y-2">
                    {timeRanges.map((range) => (
                      <div key={range.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={range.id}
                          checked={departureTimeRange.includes(range.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setDepartureTimeRange([...departureTimeRange, range.id]);
                            } else {
                              setDepartureTimeRange(departureTimeRange.filter(t => t !== range.id));
                            }
                          }}
                        />
                        <label htmlFor={range.id} className="text-sm cursor-pointer">
                          {range.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Amenities */}
                <div>
                  <h4 className="font-medium mb-3">Équipements</h4>
                  <div className="space-y-2">
                    {amenities.map((amenity) => {
                      const IconComponent = amenity.icon;
                      return (
                        <div key={amenity.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={amenity.id}
                            checked={selectedAmenities.includes(amenity.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedAmenities([...selectedAmenities, amenity.id]);
                              } else {
                                setSelectedAmenities(selectedAmenities.filter(a => a !== amenity.id));
                              }
                            }}
                          />
                          <label htmlFor={amenity.id} className="text-sm cursor-pointer flex items-center space-x-1">
                            <IconComponent className="w-3 h-3" />
                            <span>{amenity.label}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results */}
          <div className="lg:col-span-3 space-y-4">
            <AnimatePresence>
              {filteredTrips.map((trip, index) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="group"
                >
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-transparent group-hover:border-l-kongo-lime">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Company & Route Info */}
                        <div className="lg:col-span-2">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-bold text-lg text-kongo-black">{trip.company}</h3>
                                {trip.vehicleType === 'train' ? (
                                  <Train className="w-5 h-5 text-kongo-lime" />
                                ) : (
                                  <Bus className="w-5 h-5 text-kongo-black" />
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary">
                                  {trip.vehicleType === 'train' ? trip.trainType : trip.busType}
                                </Badge>
                                {trip.trainClass && (
                                  <Badge variant="outline" className="text-xs">
                                    {trip.trainClass === 'economy' ? 'Économique' : 
                                     trip.trainClass === 'business' ? 'Affaires' : 'Première'}
                                  </Badge>
                                )}
                                {trip.isPopular && (
                                  <Badge className="bg-orange-100 text-orange-800">Populaire</Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium">{trip.rating}</span>
                                <span className="text-sm text-gray-500">({trip.reviews})</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-kongo-black">{trip.departure}</div>
                              <div className="text-sm text-gray-500">{trip.isMultiLeg ? trip.legs[0].from : currentSearchParams.from}</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="flex items-center justify-center mb-1">
                                <div className="h-px bg-gray-300 flex-1"></div>
                                <Clock className="w-4 h-4 mx-2 text-gray-400" />
                                <div className="h-px bg-gray-300 flex-1"></div>
                              </div>
                              <div className="text-sm font-medium text-gray-600">{trip.duration}</div>
                            </div>
                            
                            <div className="text-center">
                              <div className="text-2xl font-bold text-kongo-black">{trip.arrival}</div>
                              <div className="text-sm text-gray-500">{trip.isMultiLeg ? trip.legs[trip.legs.length - 1].to : currentSearchParams.to}</div>
                            </div>
                          </div>

                          {trip.stops.length > 0 && (
                            <div className="text-xs text-gray-500 mb-3">
                              Arrêts: {trip.stops.join(', ')}
                            </div>
                          )}

                          {/* Multi-leg trip details */}
                          {trip.isMultiLeg && trip.legs && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                              <div className="text-sm font-medium text-blue-900 mb-2 flex items-center">
                                <MapPin className="w-4 h-4 mr-1" />
                                Trajet multi-étapes vers la côte
                              </div>
                              <div className="space-y-2">
                                {trip.legs.map((leg: any, idx: number) => (
                                  <div key={idx} className="flex items-center justify-between text-xs">
                                    <span className="text-blue-800 font-medium">
                                      {leg.from} → {leg.to}
                                    </span>
                                    <span className="text-blue-600">
                                      {leg.departure} - {leg.arrival} ({leg.duration})
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {trip.touristHighlights && (
                                <div className="mt-2 text-xs text-blue-700">
                                  <strong>Points d'intérêt:</strong> {trip.touristHighlights.slice(0, 3).join(', ')}
                                  {trip.touristHighlights.length > 3 && '...'}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Train-specific features */}
                          {trip.vehicleType === 'train' && trip.trainFeatures && (
                            <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                              <div className="text-sm font-medium text-green-900 mb-2 flex items-center">
                                <Train className="w-4 h-4 mr-1" />
                                Spécificités ferroviaires
                              </div>
                              <div className="text-xs text-green-700">
                                {trip.trainFeatures.slice(0, 2).join(' • ')}
                                {trip.trainFeatures.length > 2 && '...'}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {trip.features.slice(0, 3).map((feature: string, idx: number) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {trip.features.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{trip.features.length - 3} autres
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Seat Availability */}
                        <div>
                          <RealTimeSeatAvailability
                            totalSeats={trip.totalSeats}
                            availableSeats={trip.availableSeats}
                            tripId={trip.id}
                            compact
                          />
                          
                          <div className="mt-3 space-y-2">
                            <PriceAlertWaitlist
                              tripRoute={trip.route}
                              currentPrice={`${trip.price.toLocaleString()} CDF`}
                              isFullyBooked={trip.availableSeats === 0}
                            />
                          </div>
                        </div>

                        {/* Price & Book */}
                        <div className="text-right lg:text-center">
                          <div className="mb-4">
                            <div className="text-3xl font-bold text-kongo-black mb-1">
                              {trip.price.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">CDF par personne</div>
                          </div>

                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={() => onSelectTrip(trip)}
                              disabled={trip.availableSeats === 0}
                              className="w-full bg-kongo-lime text-kongo-black hover:bg-kongo-lime-hover font-semibold"
                            >
                              {trip.availableSeats === 0 ? 'Complet' : 'Sélectionner'}
                            </Button>
                          </motion.div>

                          <div className="text-xs text-gray-500 mt-2">
                            Prix pour {currentSearchParams.passengers} passager{currentSearchParams.passengers > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredTrips.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">🚌</div>
                <h3 className="text-xl font-semibold text-kongo-black mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-600 mb-4">
                  Essayez d'ajuster vos filtres pour voir plus de trajets
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setPriceRange([Math.min(...trips.map(t => t.price)), Math.max(...trips.map(t => t.price))]);
                    setSelectedCompanies([]);
                    setSelectedAmenities([]);
                    setDepartureTimeRange([]);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}