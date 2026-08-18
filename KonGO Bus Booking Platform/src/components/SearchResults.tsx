import { useState, useEffect } from "react";
import { toast } from "sonner";
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
import { InteractiveRouteMap } from "./InteractiveRouteMap";
import { supabase } from "../lib/supabase";
import {
  Clock,
  Users,
  Star,
  MapPin,
  Filter,
  SortAsc,
  Search,
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
    departureStopId?: string;
    arrivalStopId?: string;
  } | null;
  onSelectTrip: (trip: any) => void;
  onSearch?: (params: any) => void;
  userRole?: string;
  onNavigateToLogin?: () => void;
}

export function SearchResults({ searchParams, onSelectTrip, onSearch, userRole, onNavigateToLogin }: SearchResultsProps) {
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
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedServiceLevel, setSelectedServiceLevel] = useState("all");
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [formFrom, setFormFrom] = useState("");
  const [formTo, setFormTo] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formPassengers, setFormPassengers] = useState("1");
  const [formTransportType, setFormTransportType] = useState<'bus' | 'train' | 'all'>("all");
  const [formError, setFormError] = useState<string | null>(null);
  const [departureStops, setDepartureStops] = useState<any[]>([]);
  const [arrivalStops, setArrivalStops] = useState<any[]>([]);
  const [selectedDepartureStop, setSelectedDepartureStop] = useState<string>("all");
  const [selectedArrivalStop, setSelectedArrivalStop] = useState<string>("all");

  // Provide default values if searchParams is null
  const defaultSearchParams = {
    from: "Kinshasa",
    to: "Lubumbashi",
    date: new Date().toISOString().split('T')[0],
    passengers: 1,
    transportType: 'all' as 'bus' | 'train' | 'all',
    departureStopId: 'all',
    arrivalStopId: 'all'
  };

  const currentSearchParams = searchParams || defaultSearchParams;
  const isCatalogMode = !searchParams || (!searchParams.from && !searchParams.to);

  // Liste dynamique des compagnies extraite des trajets chargés
  const companies = [...new Set(trips.map(t => t.company))].filter(Boolean);
  const regions = [...new Set(trips.flatMap(t => [t.from, t.to]).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b))
  );
  const locationOptions = [...new Set([
    ...regions,
    currentSearchParams.from,
    currentSearchParams.to
  ].filter(Boolean))];
  const serviceLevels = [
    { id: "all", label: "Tous les niveaux" },
    { id: "standard", label: "Standard" },
    { id: "comfort", label: "Confort" },
    { id: "premium", label: "Premium" }
  ];
  const amenitiesList = [
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

  // Chargement depuis Supabase
  useEffect(() => {
    fetchTrips();
  }, [searchParams]);

  useEffect(() => {
    if (searchParams) {
      setFormFrom(searchParams.from || "");
      setFormTo(searchParams.to || "");
      setFormDate(searchParams.date || new Date().toISOString().split('T')[0]);
      setFormPassengers(String(searchParams.passengers || 1));
      setFormTransportType(searchParams.transportType || "all");
      setSelectedDepartureStop(searchParams.departureStopId || "all");
      setSelectedArrivalStop(searchParams.arrivalStopId || "all");
    } else {
      setFormFrom("");
      setFormTo("");
      setFormDate(new Date().toISOString().split('T')[0]);
      setFormPassengers("1");
      setFormTransportType("all");
      setSelectedDepartureStop("all");
      setSelectedArrivalStop("all");
    }

    if (searchParams?.transportType && searchParams.transportType !== "all") {
      setSelectedTransportTypes([searchParams.transportType]);
    } else {
      setSelectedTransportTypes([]);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchStops = async (city: string, setStops: (s: any[]) => void) => {
      if (!city) {
        setStops([]);
        return;
      }
      const { data } = await supabase.from('stops').select('*').ilike('city_name', `%${city}%`);
      setStops(data || []);
    };
    setSelectedDepartureStop("all");
    fetchStops(formFrom, setDepartureStops);
  }, [formFrom]);

  useEffect(() => {
    const fetchStops = async (city: string, setStops: (s: any[]) => void) => {
      if (!city) {
        setStops([]);
        return;
      }
      const { data } = await supabase.from('stops').select('*').ilike('city_name', `%${city}%`);
      setStops(data || []);
    };
    setSelectedArrivalStop("all");
    fetchStops(formTo, setArrivalStops);
  }, [formTo]);

  const resetSidebarFilters = () => {
    if (trips.length > 0) {
      const minPrice = Math.min(...trips.map(t => t.price));
      const maxPrice = Math.max(...trips.map(t => t.price));
      setPriceRange([minPrice, maxPrice]);
    } else {
      setPriceRange([0, 200000]);
    }
    setSelectedRegion("all");
    setSelectedServiceLevel("all");
    setPremiumOnly(false);
    setMinRating(0);
    setSelectedCompanies([]);
    setSelectedAmenities([]);
    setDepartureTimeRange([]);
    setSelectedTransportTypes([]);
  };

  const handleResetSearch = () => {
    setFormFrom("");
    setFormTo("");
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPassengers("1");
    setFormTransportType("all");
    setSelectedDepartureStop("all");
    setSelectedArrivalStop("all");
    setFormError(null);
    setShowMap(false);
    resetSidebarFilters();
    onSearch?.({
      from: "",
      to: "",
      date: "",
      passengers: 1,
      transportType: "all",
      departureStopId: "all",
      arrivalStopId: "all"
    });
  };

  const handleSearchSubmit = () => {
    if (!onSearch) return;

    const trimmedFrom = formFrom.trim();
    const trimmedTo = formTo.trim();

    if (!trimmedFrom || !trimmedTo) {
      setFormError("Veuillez sélectionner une ville de départ et d'arrivée.");
      return;
    }

    if (trimmedFrom.toLowerCase() === trimmedTo.toLowerCase()) {
      setFormError("La ville de départ et d'arrivée doivent être différentes.");
      return;
    }

    setFormError(null);
    onSearch({
      from: trimmedFrom,
      to: trimmedTo,
      date: formDate || new Date().toISOString().split('T')[0],
      passengers: Math.max(1, parseInt(formPassengers, 10) || 1),
      transportType: formTransportType,
      departureStopId: selectedDepartureStop,
      arrivalStopId: selectedArrivalStop
    });
    
    resetSidebarFilters();
  };

  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const hasSearchParams = Boolean(searchParams);
      const fromCity = hasSearchParams ? searchParams!.from.trim() : "";
      const toCity = hasSearchParams ? searchParams!.to.trim() : "";
      const travelDate = hasSearchParams ? searchParams!.date : "";
      const departureStopId = hasSearchParams ? (searchParams!.departureStopId || "all") : "all";
      const arrivalStopId = hasSearchParams ? (searchParams!.arrivalStopId || "all") : "all";

      let query = supabase
        .from('trips')
        .select(`
          *,
          agencies(name, rating),
          origin:locations!origin_location_id(id, name),
          destination:locations!destination_location_id(id, name)
        `)
        .eq('status', 'scheduled');

      let dateToCompare = new Date();
      if (travelDate) {
        dateToCompare = new Date(travelDate);
      }
      dateToCompare.setHours(0, 0, 0, 0);

      query = query.gte('departure_time', dateToCompare.toISOString());

      if (departureStopId !== 'all') {
        query = query.eq('departure_stop_id', departureStopId);
      }
      if (arrivalStopId !== 'all') {
        query = query.eq('arrival_stop_id', arrivalStopId);
      }

      query = query.order('departure_time', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      const normalizedFrom = fromCity.toLowerCase();
      const normalizedTo = toCity.toLowerCase();

      const cityFilteredTrips = (data || []).filter(trip => {
        const originName = (trip.origin?.name || '').toLowerCase();
        const destName = (trip.destination?.name || '').toLowerCase();
        const matchesFrom = !normalizedFrom || originName.includes(normalizedFrom);
        const matchesTo = !normalizedTo || destName.includes(normalizedTo);
        return matchesFrom && matchesTo;
      });

      const mappedTrips = cityFilteredTrips.map(trip => {
        const depTime = trip.departure_time ? new Date(trip.departure_time) : new Date();
        const arrTime = trip.arrival_time ? new Date(trip.arrival_time) : new Date();
        const isInvalidDep = isNaN(depTime.getTime());
        const isInvalidArr = isNaN(arrTime.getTime());
        const effectiveDep = isInvalidDep ? new Date() : depTime;
        const effectiveArr = isInvalidArr ? new Date(effectiveDep.getTime() + 12 * 60 * 60 * 1000) : arrTime;
        const durationHours = Math.round((effectiveArr.getTime() - effectiveDep.getTime()) / (1000 * 60 * 60));

        const originName = trip.origin?.name || fromCity || 'Inconnu';
        const destName = trip.destination?.name || toCity || 'Inconnu';

        const amenityLabels: Record<string, string> = {
          wifi: 'WiFi gratuit', ac: 'Climatisation', charging: 'Prises USB',
          meals: 'Repas inclus', sleeping: 'Couchettes', observation: 'Vue panoramique', pillow: 'Oreillers'
        };

        return {
          id: trip.id,
          company: trip.agencies?.name || 'Inconnu',
          from: originName,
          to: destName,
          route: `${originName} → ${destName}`,
          dateLabel: effectiveDep.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
          departure: effectiveDep.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          arrival: effectiveArr.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          duration: trip.duration || `${durationHours}h`,
          departureAddress: trip.departure_address || '',
          arrivalAddress: trip.arrival_address || '',
          price: Number(trip.price),
          availableSeats: trip.seats_available,
          totalSeats: trip.total_seats,
          rating: Number(trip.agencies?.rating) || 4.0,
          reviews: Math.floor(Math.random() * 200) + 50,
          amenities: trip.amenities || [],
          vehicleType: (trip.vehicle_type || 'bus') as 'bus' | 'train',
          busType: trip.bus_type || 'Standard',
          operator: trip.agencies?.name || 'KonGO Express',
          isPopular: trip.is_popular || false,
          stops: trip.stops || [],
          agency_id: trip.agency_id,
          amenitiesLabels: (trip.amenities || []).map((a: string) => amenityLabels[a] || a.charAt(0).toUpperCase() + a.slice(1))
        };
      });

      setTrips(mappedTrips);
      setFilteredTrips(mappedTrips);
      if (mappedTrips.length > 0) {
        const prices = mappedTrips.map(t => t.price);
        setPriceRange([Math.min(...prices), Math.max(...prices)]);
      } else {
        setPriceRange([0, 200000]);
      }
    } catch (error: any) {
      console.error('Erreur lors de la récupération des trajets:', error.message);
      setTrips([]);
      setFilteredTrips([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getServiceLevel = (trip: any) => {
    const busType = String(trip.busType || "").toLowerCase();
    const trainClass = String(trip.trainClass || "").toLowerCase();
    if (trainClass === "business" || trainClass === "first") return "premium";
    if (busType.includes("vip") || busType.includes("premium") || busType.includes("lux")) return "premium";
    if (busType.includes("comfort")) return "comfort";
    return "standard";
  };

  useEffect(() => {
    let filtered = [...trips];
    filtered = filtered.filter(trip => trip.price >= priceRange[0] && trip.price <= priceRange[1]);
    if (selectedRegion !== "all") {
      filtered = filtered.filter(trip => {
        const from = String(trip.from || "").toLowerCase();
        const to = String(trip.to || "").toLowerCase();
        const region = selectedRegion.toLowerCase();
        return from.includes(region) || to.includes(region);
      });
    }
    if (selectedServiceLevel !== "all") {
      filtered = filtered.filter(trip => getServiceLevel(trip) === selectedServiceLevel);
    }
    if (premiumOnly) {
      filtered = filtered.filter(trip => trip.isPopular || trip.rating >= 4.5 || getServiceLevel(trip) === "premium");
    }
    if (minRating > 0) {
      filtered = filtered.filter(trip => trip.rating >= minRating);
    }
    if (selectedCompanies.length > 0) {
      filtered = filtered.filter(trip => selectedCompanies.includes(trip.company));
    }
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(trip =>
        selectedAmenities.some(amenity => trip.amenities.includes(amenity))
      );
    }
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
    if (selectedTransportTypes.length > 0) {
      filtered = filtered.filter(trip => selectedTransportTypes.includes(trip.vehicleType));
    }
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
  }, [trips, priceRange, selectedRegion, selectedServiceLevel, premiumOnly, minRating, selectedCompanies, selectedAmenities, departureTimeRange, sortBy, selectedTransportTypes]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="text-center">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-kongo-lime border-t-transparent rounded-full mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-kongo-black mb-2">Recherche en cours...</h2>
            <p className="text-gray-600">Nous cherchons les meilleurs trajets pour vous</p>
          </div>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Search Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-kongo-black mb-2">
              {isCatalogMode ? "Tous les voyages" : `${currentSearchParams.from} → ${currentSearchParams.to}`}
            </h1>
            <div className="flex items-center space-x-4 text-gray-600">
              {!isCatalogMode && (
                <>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{currentSearchParams.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{currentSearchParams.passengers} passager{currentSearchParams.passengers > 1 ? 's' : ''}</span>
                  </div>
                </>
              )}
              <Badge className="bg-blue-100 text-blue-800">
                {filteredTrips.length} voyage{filteredTrips.length > 1 ? 's' : ''}
              </Badge>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!isCatalogMode && (
              <Button
                variant="outline"
                onClick={() => setShowMap(!showMap)}
                className={`transition-all duration-200 ${showMap ? 'bg-kongo-lime text-kongo-black border-kongo-lime shadow-kongo-lime' : 'hover:border-kongo-lime/50'}`}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {showMap ? 'Masquer la carte' : 'Voir le trajet'}
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
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

        {/* Search Form (Home Filters) */}
        <Card className="border border-kongo-lime/20 bg-surface-elevated">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h2 className="text-xl text-kongo-black font-semibold">Recherche rapide</h2>
                <p className="text-sm text-gray-500">Affinez vos critères comme sur la page d'accueil.</p>
              </div>
              <Badge className="bg-kongo-lime/20 text-kongo-lime-dark border-kongo-lime/30">Filtres Accueil</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-kongo-black flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">Départ</span>
                </label>
                <Select value={formFrom} onValueChange={(value: string) => { setFormFrom(value); setFormError(null); }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Départ" /></SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((loc) => (<SelectItem key={loc} value={loc}>{loc}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-kongo-black flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span className="font-semibold">Arrivée</span>
                </label>
                <Select value={formTo} onValueChange={(value: string) => { setFormTo(value); setFormError(null); }}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Arrivée" /></SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((loc) => (<SelectItem key={loc} value={loc}>{loc}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-kongo-black flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">Date</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => { setFormDate(e.target.value); setFormError(null); }}
                  className="h-12 w-full rounded-md border border-gray-200 bg-white px-3 focus:border-kongo-lime focus:ring-2 focus:ring-kongo-lime/20 outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-kongo-black flex items-center space-x-2">
                  <Users className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold">Passagers</span>
                </label>
                <Select value={formPassengers} onValueChange={(value: string) => { setFormPassengers(value); setFormError(null); }}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[...Array(6)].map((_, i) => (<SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1} {i === 0 ? 'passager' : 'passagers'}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-kongo-black flex items-center space-x-2">
                  <Train className="w-4 h-4 text-kongo-lime-dark" />
                  <span className="font-semibold">Transport</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['bus', 'train', 'all'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setFormTransportType(opt as any); setFormError(null); }}
                      className={`h-12 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${formTransportType === opt ? 'border-kongo-lime bg-kongo-lime/10 text-kongo-lime-dark' : 'border-gray-200 hover:border-kongo-lime/50 bg-white'}`}
                    >
                      {opt === 'bus' ? <Bus className="w-4 h-4" /> : opt === 'train' ? <Train className="w-4 h-4" /> : <RefreshCw className="w-3 h-3" />}
                      <span className="text-[10px] uppercase font-bold">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-kongo-black flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-green-600/50" />
                  <span className="font-semibold text-xs">Arrêt de départ (Optionnel)</span>
                </label>
                <Select value={selectedDepartureStop} onValueChange={setSelectedDepartureStop}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Tous les arrêts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les arrêts</SelectItem>
                    {departureStops.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-kongo-black flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-red-600/50" />
                  <span className="font-semibold text-xs">Arrêt d'arrivée (Optionnel)</span>
                </label>
                <Select value={selectedArrivalStop} onValueChange={setSelectedArrivalStop}>
                  <SelectTrigger className="h-10 text-xs">
                    <SelectValue placeholder="Tous les arrêts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les arrêts</SelectItem>
                    {arrivalStops.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formError && <div className="text-sm text-red-600">{formError}</div>}
            <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={handleResetSearch}>Réinitialiser</Button>
              <Button onClick={handleSearchSubmit} className="bg-kongo-lime text-kongo-black hover:bg-kongo-lime-hover font-bold px-8">
                <Search className="w-4 h-4 mr-2" /> Rechercher
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Map View */}
        <AnimatePresence>
          {showMap && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.5 }}>
              <InteractiveRouteMap
                route={{ from: currentSearchParams.from, to: currentSearchParams.to }}
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
                  <Button variant="ghost" size="sm" onClick={handleResetSearch}><RefreshCw className="w-4 h-4 mr-1" />Réinitialiser</Button>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Région</h4>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger><SelectValue placeholder="Toutes les régions" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les régions</SelectItem>
                        {regions.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Niveau de service</h4>
                    <Select value={selectedServiceLevel} onValueChange={setSelectedServiceLevel}>
                      <SelectTrigger><SelectValue placeholder="Tous les niveaux" /></SelectTrigger>
                      <SelectContent>{serviceLevels.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Note minimum</h4>
                    <Select value={minRating.toString()} onValueChange={(v: string) => setMinRating(Number(v))}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Toutes les notes</SelectItem>
                        <SelectItem value="3.5">3.5+</SelectItem>
                        <SelectItem value="4.0">4.0+</SelectItem>
                        <SelectItem value="4.5">4.5+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      className="border-2 border-gray-400 data-[state=checked]:border-kongo-black"
                      id="prem"
                      checked={premiumOnly}
                      onCheckedChange={(c: boolean) => setPremiumOnly(!!c)}
                    />
                    <label htmlFor="prem" className="text-sm">Premium uniquement</label>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Prix (CDF)</h4>
                    <Slider value={priceRange} onValueChange={setPriceRange} max={200000} step={5000} className="mb-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{priceRange[0].toLocaleString()}</span>
                      <span>{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Heure de départ</h4>
                    <div className="space-y-2">
                      {timeRanges.map((range) => (
                        <div key={range.id} className="flex items-center space-x-2">
                          <Checkbox
                            className="border-2 border-gray-400 data-[state=checked]:border-kongo-black"
                            id={`time-${range.id}`}
                            checked={departureTimeRange.includes(range.id)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setDepartureTimeRange([...departureTimeRange, range.id]);
                              } else {
                                setDepartureTimeRange(departureTimeRange.filter((item) => item !== range.id));
                              }
                            }}
                          />
                          <label htmlFor={`time-${range.id}`} className="text-sm">{range.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Compagnies</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {companies.length === 0 ? (
                        <p className="text-sm text-gray-500">Aucune compagnie disponible</p>
                      ) : companies.map((company) => (
                        <div key={company} className="flex items-center space-x-2">
                          <Checkbox
                            className="border-2 border-gray-400 data-[state=checked]:border-kongo-black"
                            id={`company-${company}`}
                            checked={selectedCompanies.includes(company)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedCompanies([...selectedCompanies, company]);
                              } else {
                                setSelectedCompanies(selectedCompanies.filter((item) => item !== company));
                              }
                            }}
                          />
                          <label htmlFor={`company-${company}`} className="text-sm">{company}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Équipements du bus</h4>
                    <div className="space-y-2">
                      {amenitiesList.map((amenity) => (
                        <div key={amenity.id} className="flex items-center space-x-2">
                          <Checkbox
                            className="border-2 border-gray-400 data-[state=checked]:border-kongo-black"
                            id={`amenity-${amenity.id}`}
                            checked={selectedAmenities.includes(amenity.id)}
                            onCheckedChange={(checked: boolean) => {
                              if (checked) {
                                setSelectedAmenities([...selectedAmenities, amenity.id]);
                              } else {
                                setSelectedAmenities(selectedAmenities.filter((item) => item !== amenity.id));
                              }
                            }}
                          />
                          <label htmlFor={`amenity-${amenity.id}`} className="text-sm flex items-center space-x-2">
                            <amenity.icon className="w-3.5 h-3.5 text-gray-500" />
                            <span>{amenity.label}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results List */}
          <div className="lg:col-span-3 space-y-4">
            <AnimatePresence>
              {filteredTrips.map((trip, idx) => (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group"
                >
                  <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-transparent group-hover:border-l-kongo-lime overflow-hidden">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Section 1: Itinéraire et détails (Col 1-7) */}
                        <div className="min-w-0 lg:col-span-7">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-bold text-xl text-kongo-black">{trip.company}</h3>
                            {trip.vehicleType === 'train' ? <Train className="w-5 h-5 text-gray-400" /> : <Bus className="w-5 h-5 text-gray-400" />}
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-6">
                            <Badge className="bg-kongo-lime text-kongo-black font-bold text-xs hover:bg-kongo-lime rounded-sm px-2 py-0.5">{trip.busType}</Badge>
                            {trip.isPopular && <Badge className="bg-orange-100 text-orange-700 font-bold text-xs border-none hover:bg-orange-100 rounded-sm px-2 py-0.5">Populaire</Badge>}
                          </div>

                          <div className="flex items-center space-x-4 mb-4">
                            <div className="text-left">
                              <div className="text-xs text-kongo-lime-dark font-bold mb-1 truncate max-w-[120px] uppercase tracking-wide">{trip.dateLabel}</div>
                              <div className="text-4xl font-extrabold text-kongo-black leading-none mb-1">{trip.departure}</div>
                              <div className="text-sm text-gray-500 font-medium">{trip.from}</div>
                            </div>
                            
                            <div className="flex-1 flex flex-col items-center justify-center relative min-w-[80px]">
                              <div className="flex items-center w-full pt-4 relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center bg-white px-2 z-10 text-gray-400">
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span className="text-xs font-bold">{trip.duration}</span>
                                </div>
                                <div className="h-[2px] bg-gray-200 flex-1"></div>
                                <div className="h-[2px] bg-gray-200 flex-1"></div>
                              </div>
                            </div>

                            <div className="text-left">
                              <div className="text-xs text-transparent font-bold mb-1 uppercase tracking-wide cursor-default pointer-events-none select-none">Jour J</div>
                              <div className="text-4xl font-extrabold text-kongo-black leading-none mb-1">{trip.arrival}</div>
                              <div className="text-sm text-gray-500 font-medium">{trip.to}</div>
                            </div>
                          </div>

                          <div className="text-sm text-gray-500 mb-6 font-medium">
                            {(trip.stops && trip.stops.length > 0) ? (
                              <span>Arrêts: {trip.stops.join(', ')}</span>
                            ) : (
                              <span>Trajet direct</span>
                            )}
                          </div>

                          {/* Detail trajet simulé */}
                          <div className="mb-6 border-l-2 border-blue-100 pl-4 py-1">
                            <div className="flex items-center space-x-2 mb-3">
                              <MapPin className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-bold text-blue-900">Trajet multi-étapes</span>
                            </div>
                            <div className="space-y-2 text-xs text-blue-800/80 mb-3">
                              <div className="flex justify-between max-w-sm">
                                <span>{trip.from} → Matadi</span>
                                <span className="font-medium text-gray-500">05:30 - 09:45</span>
                              </div>
                              <div className="flex justify-between max-w-sm">
                                <span>Matadi → Boma</span>
                                <span className="font-medium text-gray-500">10:30 - 13:15</span>
                              </div>
                            </div>
                            <div className="text-xs text-blue-800/60 leading-relaxed max-w-md">
                              <span className="font-semibold text-blue-900/80">Points d'intérêt: </span>
                              Vue panoramique sur le fleuve, pont Maréchal.
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 font-medium">
                            {trip.amenitiesLabels?.slice(0, 4).map((f, i) => (
                              <span key={i} className="bg-gray-50 px-2 py-1 rounded-md">{f}</span>
                            ))}
                            {trip.amenitiesLabels && trip.amenitiesLabels.length > 4 && (
                              <span className="font-bold text-gray-400">+{trip.amenitiesLabels.length - 4} autres</span>
                            )}
                          </div>
                        </div>

                        {/* Section 2: Info & Alertes (Col 8-9) */}
                        <div className="lg:col-span-2 flex flex-col pt-2 lg:pl-6 lg:border-l border-gray-100 space-y-4">
                           <div className="flex items-center space-x-1.5">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-lg text-kongo-black">{trip.rating}</span>
                            <span className="text-xs text-gray-400">({trip.reviews})</span>
                          </div>

                          <div className={'flex items-center space-x-1.5 font-bold text-xs ' + (trip.availableSeats > 10 ? 'text-green-600' : trip.availableSeats > 0 ? 'text-yellow-600' : 'text-red-600')}>
                             <div className={'w-2 h-2 rounded-full animate-pulse ' + (trip.availableSeats > 10 ? 'bg-green-600' : trip.availableSeats > 0 ? 'bg-yellow-600' : 'bg-red-600')} />
                             <span>{trip.availableSeats} places</span>
                          </div>
                           
                          <Button variant="outline" className="w-full border-green-200 text-green-700 bg-green-50/50 hover:bg-green-100 hover:text-green-800 rounded-lg h-9 shadow-sm font-semibold text-xs justify-start px-3">
                             <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                             Alerte prix
                          </Button>

                          <div className="w-full border border-gray-100 rounded-lg p-3 bg-gray-50 flex flex-col relative mt-2">
                             <div className="flex items-start space-x-2">
                               <div className="pt-0.5"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></div>
                               <div>
                                 <p className="text-[11px] font-bold text-kongo-black leading-tight mb-2">Alerte active</p>
                                 <p className="text-[9px] text-gray-500 uppercase leading-snug mb-2">Si prix &lt; {(trip.price * 0.9).toLocaleString()} CDF</p>
                                 <div className="inline-block border border-green-500 text-green-600 rounded bg-white px-1.5 py-0.5 text-[9px] font-bold">ACTIF</div>
                               </div>
                             </div>
                          </div>
                        </div>

                        {/* Section 3: Prix et Action (Col 10-12) */}
                        <div className="lg:col-span-3 flex flex-col justify-between pt-2 lg:pl-6 lg:border-l border-gray-100 min-h-full">
                          <div className="text-right">
                            <div className="text-4xl font-black text-kongo-black tracking-tight mb-1">
                              {trip.price.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">
                              CDF / personne
                            </div>
                          </div>

                          <div className="mt-8 text-right flex flex-col items-end">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (userRole === 'guest' || !userRole) {
                                  toast.error("Connexion requise", {
                                    description: "Vous devez être connecté.",
                                  });
                                  return;
                                }
                                onSelectTrip(trip);
                              }}
                              disabled={trip.availableSeats === 0}
                              className={'w-full h-12 rounded-xl font-black text-base transition-all shadow-sm ' + (trip.availableSeats === 0 ? 'bg-gray-100 text-gray-400' : 'bg-kongo-lime text-kongo-black hover:bg-[#aedf25] hover:scale-[1.02]')}
                            >
                              {trip.availableSeats === 0 ? 'Complet' : 'Sélectionner'}
                            </Button>
                            <div className="mt-2 text-[11px] text-gray-400 font-medium text-center w-full">
                              Pour {currentSearchParams.passengers} passager{currentSearchParams.passengers > 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredTrips.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <div className="text-5xl mb-4">🚍</div>
                <h3 className="text-xl font-bold text-gray-400">Aucun trajet trouvé</h3>
                <p className="text-gray-400 mt-2">Essayez de modifier vos filtres ou de faire une nouvelle recherche.</p>
                <Button variant="link" onClick={handleResetSearch} className="mt-4 text-kongo-lime-dark font-bold underline">Voir tout le catalogue</Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

