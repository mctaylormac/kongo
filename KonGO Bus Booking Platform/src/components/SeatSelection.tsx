import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { InteractiveRouteMap } from "./InteractiveRouteMap";
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  Clock, 
  CreditCard,
  UserCheck,
  UserX,
  Accessibility,
  User,
  Wifi,
  Coffee,
  Zap,
  Shield,
  Info,
  CheckCircle2,
  AlertCircle,
  Star,
  Train,
  Bus,
  Bed,
  Eye,
  Utensils
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

interface SeatSelectionProps {
  trip: any;
  passengers: number;
  onContinue: (seats: any[]) => void;
  onBack: () => void;
  preferences: any;
}

interface Seat {
  id: string;
  row: number;
  column: string;
  type: "standard" | "premium" | "window" | "aisle" | "disabled" | "couchette";
  status: "available" | "selected" | "occupied" | "reserved";
  price: number;
  features: string[];
  wagon?: number;
  compartment?: number;
}

interface TrainWagon {
  id: number;
  name: string;
  type: "economy" | "business" | "sleeper" | "family" | "observation";
  description: string;
  capacity: number;
  layout: "2+2" | "2+1" | "compartment";
}

export function SeatSelection({ trip, passengers, onContinue, onBack, preferences }: SeatSelectionProps) {
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const [seatLayout, setSeatLayout] = useState<Seat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWagon, setSelectedWagon] = useState<number>(1);
  const [wagons, setWagons] = useState<TrainWagon[]>([]);
  const [dbOccupiedSeats, setDbOccupiedSeats] = useState<string[]>([]);
  
  const isTrainTrip = trip?.vehicleType === 'train' || trip?.trainType;

  // Fetch real occupied seats from DB
  useEffect(() => {
    if (!trip?.id) return;
    
    const fetchOccupiedSeats = async () => {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('seats')
          .eq('trip_id', trip.id)
          .in('status', ['confirmed', 'paid', 'pending']);
          
        if (error) throw error;
        
        const occupiedIds: string[] = [];
        if (data) {
          data.forEach(booking => {
            if (Array.isArray(booking.seats)) {
              booking.seats.forEach((seat: any) => {
                if (typeof seat === 'string') occupiedIds.push(seat);
                else if (seat && seat.id) occupiedIds.push(seat.id);
                else if (seat && seat.seatNumber) occupiedIds.push(seat.seatNumber);
              });
            }
          });
        }
        setDbOccupiedSeats(occupiedIds);
      } catch (err) {
        console.error('Error fetching seats', err);
      }
    };
    
    fetchOccupiedSeats();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`seats_updates_${trip.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bookings', filter: `trip_id=eq.${trip.id}` },
        () => fetchOccupiedSeats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trip?.id]);

  // Generate seat layout based on vehicle type
  useEffect(() => {
    const generateLayout = () => {
      if (isTrainTrip) {
        generateTrainLayout();
      } else {
        generateBusLayout();
      }
    };

    const generateBusLayout = () => {
      const seats: Seat[] = [];
      const totalRows = 14;
      const columns = ['A', 'B', 'C', 'D'];
      
      for (let row = 1; row <= totalRows; row++) {
        for (let colIndex = 0; colIndex < 4; colIndex++) {
          const column = columns[colIndex];
          const isWindow = colIndex === 0 || colIndex === 3;
          const isPremium = row <= 3;
          const isDisabled = row === 1 && column === 'A';
          const seatId = `${row}${column}`;
          const isOccupied = dbOccupiedSeats.includes(seatId);
          const isReserved = false;
          
          seats.push({
            id: seatId,
            row,
            column,
            type: isDisabled ? 'disabled' : isPremium ? 'premium' : isWindow ? 'window' : 'standard',
            status: isOccupied ? 'occupied' : isReserved ? 'reserved' : 'available',
            price: isPremium ? trip.price * 1.3 : trip.price,
            features: [
              ...(isPremium ? ['Espace extra', 'Priorité embarquement'] : []),
              ...(isWindow ? ['Vue panoramique'] : []),
              ...(isDisabled ? ['Accessible PMR'] : []),
              'WiFi gratuit', 'Prise USB'
            ]
          });
        }
      }
      
      setSeatLayout(seats);
      setIsLoading(false);
    };

    const generateTrainLayout = () => {
      const trainClass = trip?.trainClass || 'economy';
      let trainWagons: TrainWagon[] = [];
      
      if (trainClass === 'business' || trainClass === 'first') {
        trainWagons = [
          {
            id: 1,
            name: "Wagon 1 - Affaires",
            type: "business",
            description: "Sièges inclinables, service premium",
            capacity: 24,
            layout: "2+1"
          },
          {
            id: 2,
            name: "Wagon 2 - Couchettes",
            type: "sleeper",
            description: "Compartiments 4 couchettes avec lavabo",
            capacity: 16,
            layout: "compartment"
          },
          {
            id: 3,
            name: "Wagon 3 - Observation",
            type: "observation",
            description: "Vue panoramique, sièges rotatifs",
            capacity: 20,
            layout: "2+2"
          }
        ];
      } else {
        trainWagons = [
          {
            id: 1,
            name: "Wagon 1 - Économique",
            type: "economy",
            description: "Sièges standard, climatisation",
            capacity: 40,
            layout: "2+2"
          },
          {
            id: 2,
            name: "Wagon 2 - Couchettes",
            type: "sleeper",
            description: "Couchettes économiques",
            capacity: 24,
            layout: "compartment"
          },
          {
            id: 3,
            name: "Wagon 3 - Familles",
            type: "family",
            description: "Espace familles, tables communes",
            capacity: 32,
            layout: "2+2"
          }
        ];
      }
      
      setWagons(trainWagons);
      generateWagonSeats(selectedWagon, trainWagons[selectedWagon - 1]);
    };

    const generateWagonSeats = (wagonNumber: number, wagon: TrainWagon) => {
      const seats: Seat[] = [];
      
      if (wagon.layout === "compartment") {
        // Compartments with couchettes
        const compartments = Math.floor(wagon.capacity / 4);
        
        for (let comp = 1; comp <= compartments; comp++) {
          const positions = ['1H', '1B', '2H', '2B']; // High/Low beds, 2 levels
          
          for (let pos = 0; pos < 4; pos++) {
            const seatId = `W${wagonNumber}C${comp}${positions[pos]}`;
            const isOccupied = dbOccupiedSeats.includes(seatId);
            const isReserved = false;
            
            seats.push({
              id: seatId,
              row: comp,
              column: positions[pos],
              type: "couchette",
              status: isOccupied ? "occupied" : isReserved ? "reserved" : "available",
              price: wagon.type === "sleeper" ? trip.price * 1.2 : trip.price * 0.9,
              wagon: wagonNumber,
              compartment: comp,
              features: [
                "Couchette",
                "Prise électrique",
                "Rangement personnel",
                ...(positions[pos].includes('H') ? ["Couchette haute"] : ["Couchette basse"])
              ]
            });
          }
        }
      } else {
        // Regular seating
        let columns: string[] = [];
        let seatsPerRow = 0;
        
        switch (wagon.layout) {
          case "2+1":
            columns = ['A', 'B', 'D'];
            seatsPerRow = 3;
            break;
          case "2+2":
            columns = ['A', 'B', 'C', 'D'];
            seatsPerRow = 4;
            break;
          default:
            columns = ['A', 'B', 'C', 'D'];
            seatsPerRow = 4;
        }
        
        const totalRows = Math.ceil(wagon.capacity / seatsPerRow);
        
        for (let row = 1; row <= totalRows; row++) {
          for (let colIndex = 0; colIndex < columns.length; colIndex++) {
            const column = columns[colIndex];
            const isWindow = (colIndex === 0 || colIndex === columns.length - 1);
            const isPremium = wagon.type === "business" || wagon.type === "observation";
            const isDisabled = row === 1 && column === 'A';
            const seatId = `W${wagonNumber}${row}${column}`;
            const isOccupied = dbOccupiedSeats.includes(seatId);
            const isReserved = false;
            
            seats.push({
              id: seatId,
              row,
              column,
              type: isDisabled ? "disabled" : 
                    isPremium ? "premium" : 
                    isWindow ? "window" : "standard",
              status: isOccupied ? "occupied" : isReserved ? "reserved" : "available",
              price: isPremium ? trip.price * 1.4 : trip.price,
              wagon: wagonNumber,
              features: [
                ...(isPremium ? ["Siège inclinable", "Espace extra"] : []),
                ...(isWindow ? ["Vue panoramique"] : []),
                ...(isDisabled ? ["Accessible PMR"] : []),
                ...(wagon.type === "observation" ? ["Siège rotatif", "Table pliable"] : []),
                "Prise électrique",
                "Climatisation"
              ]
            });
          }
        }
      }
      
      setSeatLayout(seats);
      setIsLoading(false);
    };

    const timer = setTimeout(generateLayout, 1000);
    return () => clearTimeout(timer);
  }, [trip, isTrainTrip, selectedWagon, dbOccupiedSeats]);

  // Update seats when wagon changes
  useEffect(() => {
    if (isTrainTrip && wagons.length > 0 && selectedWagon <= wagons.length) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        const wagon = wagons[selectedWagon - 1];
        generateWagonSeats(selectedWagon, wagon);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedWagon]);

  const generateWagonSeats = (wagonNumber: number, wagon: TrainWagon) => {
    const seats: Seat[] = [];
    
    if (wagon.layout === "compartment") {
      const compartments = Math.floor(wagon.capacity / 4);
      
      for (let comp = 1; comp <= compartments; comp++) {
        const positions = ['1H', '1B', '2H', '2B'];
        
        for (let pos = 0; pos < 4; pos++) {
          const seatId = `W${wagonNumber}C${comp}${positions[pos]}`;
          const isOccupied = dbOccupiedSeats.includes(seatId);
          const isReserved = false;
          
          seats.push({
            id: seatId,
            row: comp,
            column: positions[pos],
            type: "couchette",
            status: isOccupied ? "occupied" : isReserved ? "reserved" : "available",
            price: trip.price * 1.2,
            wagon: wagonNumber,
            compartment: comp,
            features: [
              "Couchette",
              "Prise électrique",
              "Rangement personnel",
              ...(positions[pos].includes('H') ? ["Couchette haute"] : ["Couchette basse"])
            ]
          });
        }
      }
    } else {
      let columns: string[] = [];
      let seatsPerRow = 0;
      
      switch (wagon.layout) {
        case "2+1":
          columns = ['A', 'B', 'D'];
          seatsPerRow = 3;
          break;
        default:
          columns = ['A', 'B', 'C', 'D'];
          seatsPerRow = 4;
      }
      
      const totalRows = Math.ceil(wagon.capacity / seatsPerRow);
      
      for (let row = 1; row <= totalRows; row++) {
        for (let colIndex = 0; colIndex < columns.length; colIndex++) {
          const column = columns[colIndex];
          const isWindow = (colIndex === 0 || colIndex === columns.length - 1);
          const isPremium = wagon.type === "business" || wagon.type === "observation";
          const isDisabled = row === 1 && column === 'A';
          const seatId = `W${wagonNumber}${row}${column}`;
          const isOccupied = dbOccupiedSeats.includes(seatId);
          const isReserved = false;
          
          seats.push({
            id: seatId,
            row,
            column,
            type: isDisabled ? "disabled" : isPremium ? "premium" : isWindow ? "window" : "standard",
            status: isOccupied ? "occupied" : isReserved ? "reserved" : "available",
            price: isPremium ? trip.price * 1.4 : trip.price,
            wagon: wagonNumber,
            features: [
              ...(isPremium ? ["Siège inclinable", "Espace extra"] : []),
              ...(isWindow ? ["Vue panoramique"] : []),
              ...(isDisabled ? ["Accessible PMR"] : []),
              "Prise électrique",
              "Climatisation"
            ]
          });
        }
      }
    }
    
    setSeatLayout(seats);
    setIsLoading(false);
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'occupied' || seat.status === 'reserved') {
      const seatName = seat.type === 'couchette' ? `Compartiment ${seat.compartment}-${seat.column}` : `${seat.row}${seat.column}`;
      toast.warning(`${isTrainTrip ? 'Place' : 'Siège'} non disponible`, {
        description: `${seatName} est ${seat.status === 'occupied' ? 'occupé' : 'réservé'}`
      });
      return;
    }

    if (selectedSeats.find(s => s.id === seat.id)) {
      setSelectedSeats(prev => prev.filter(s => s.id !== seat.id));
      const seatName = seat.type === 'couchette' ? `Compartiment ${seat.compartment}-${seat.column}` : `${seat.row}${seat.column}`;
      toast.info(`${seatName} désélectionné`);
    } else {
      // [Agent Dev Web] - Action: Suppression limite fixe passagers, max = capacité totale disponible
      const maxSeats = seatLayout.filter(s => s.status === 'available').length;
      if (selectedSeats.length >= maxSeats) {
        toast.warning('Tous les sièges disponibles sont sélectionnés', {
          description: `${maxSeats} ${isTrainTrip ? 'places' : 'sièges'} disponibles au total`
        });
        return;
      }
      
      setSelectedSeats(prev => [...prev, seat]);
      const seatName = seat.type === 'couchette' ? `Compartiment ${seat.compartment}-${seat.column}` : `${seat.row}${seat.column}`;
      toast.success(`${seatName} sélectionné - ${formatPrice(seat.price)} (${selectedSeats.length + 1} au total)`);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'currency',
      currency: 'CDF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getTotalPrice = () => selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  const getSeatIcon = (seat: Seat) => {
    if (seat.type === 'disabled') return Accessibility;
    if (seat.type === 'couchette') return Bed;
    if (seat.type === 'premium') return Star;
    return User;
  };

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.find(s => s.id === seat.id)) {
      return 'text-on-lime bg-kongo-lime border-kongo-lime';
    }
    
    switch (seat.status) {
      case 'occupied': return 'text-error bg-error/10 border-error cursor-not-allowed';
      case 'reserved': return 'text-warning bg-warning/10 border-warning cursor-not-allowed';
      default:
        switch (seat.type) {
          case 'premium': return 'text-info bg-info/10 border-info hover:bg-info/20 cursor-pointer';
          case 'disabled': return 'text-success bg-success/10 border-success hover:bg-success/20 cursor-pointer';
          case 'couchette': return 'text-kongo-lime-dark bg-kongo-lime/10 border-kongo-lime hover:bg-kongo-lime/20 cursor-pointer';
          default: return 'text-secondary bg-surface-elevated border-border-primary hover:bg-surface-hover hover:border-kongo-lime/50 cursor-pointer';
        }
    }
  };

  const seatTypes = [
    { type: 'available', label: 'Disponible', color: 'bg-surface-elevated border-border-primary', icon: User },
    { type: 'premium', label: isTrainTrip ? 'Premium/Affaires' : 'Premium', color: 'bg-info/10 border-info', icon: Star },
    { type: 'selected', label: 'Sélectionné', color: 'bg-kongo-lime border-kongo-lime', icon: CheckCircle2 },
    { type: 'occupied', label: 'Occupé', color: 'bg-error/10 border-error', icon: UserX },
    { type: 'reserved', label: 'Réservé', color: 'bg-warning/10 border-warning', icon: AlertCircle },
    { type: 'disabled', label: 'PMR', color: 'bg-success/10 border-success', icon: Accessibility },
    ...(isTrainTrip ? [
      { type: 'couchette', label: 'Couchette', color: 'bg-kongo-lime/10 border-kongo-lime', icon: Bed }
    ] : [])
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-secondary">
        <div className="container-professional py-8">
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 border-4 border-kongo-lime border-t-transparent rounded-full mx-auto"
              />
              <div>
                <h3 className="text-h4 text-kongo-black mb-2">
                  Chargement de la carte des {isTrainTrip ? 'places' : 'sièges'}
                </h3>
                <p className="text-body-small text-secondary">
                  Préparation de votre sélection{isTrainTrip ? ' de wagon et places' : ''}...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentWagon = isTrainTrip ? wagons[selectedWagon - 1] : null;

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="container-professional py-8 space-y-8">
        
        {/* Trip Summary Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="card-elevated">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-kongo-black rounded-xl flex items-center justify-center">
                    {isTrainTrip ? <Train className="w-6 h-6 text-on-black" /> : <Bus className="w-6 h-6 text-on-black" />}
                  </div>
                    <div>
                      <h1 className="text-h3 text-kongo-black font-semibold">
                        {trip?.from} → {trip?.to}
                      </h1>
                      <div className="flex items-center space-x-4 text-body-small text-secondary">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{trip?.departure} • {trip?.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{passengers} passager{passengers > 1 ? 's' : ''}</span>
                      </div>
                      {isTrainTrip && (
                        <div className="flex items-center space-x-1">
                          <Train className="w-4 h-4" />
                          <span>{trip?.trainType || 'Express'}</span>
                        </div>
                      )}
                    </div>
                    {(trip?.departureAddress || trip?.arrivalAddress) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div className="rounded-lg border border-border-primary bg-surface-secondary px-3 py-2">
                          <div className="text-caption text-tertiary">Adresse arrêt départ</div>
                          <div className="text-body-small text-kongo-black font-medium mt-1">
                            {trip?.departureAddress || 'Non renseignée'}
                          </div>
                        </div>
                        <div className="rounded-lg border border-border-primary bg-surface-secondary px-3 py-2">
                          <div className="text-caption text-tertiary">Adresse arrêt terminus</div>
                          <div className="text-body-small text-kongo-black font-medium mt-1">
                            {trip?.arrivalAddress || 'Non renseignée'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-body-small text-secondary">À partir de</div>
                  <div className="text-h4 text-kongo-black font-bold">{formatPrice(trip?.price || 0)}</div>
                  <Badge className="status-success mt-1">
                    {trip?.seatsAvailable || 25} {isTrainTrip ? 'places' : 'sièges'} disponibles
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Wagon Selection for Trains */}
        {isTrainTrip && wagons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-h4 text-kongo-black flex items-center">
                  <Train className="w-5 h-5 mr-2" />
                  Choisissez votre wagon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {wagons.map((wagon) => (
                    <motion.div
                      key={wagon.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedWagon === wagon.id 
                            ? 'border-kongo-lime bg-surface-kongo-lime-light ring-2 ring-kongo-lime ring-opacity-20' 
                            : 'hover:border-kongo-lime/50'
                        }`}
                        onClick={() => setSelectedWagon(wagon.id)}
                      >
                        <CardContent className="p-4">
                          <div className="text-center space-y-2">
                            <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
                              wagon.type === 'business' ? 'bg-info/20 text-info' :
                              wagon.type === 'sleeper' ? 'bg-kongo-lime/20 text-kongo-lime-dark' :
                              wagon.type === 'observation' ? 'bg-warning/20 text-warning' :
                              'bg-surface-tertiary text-secondary'
                            }`}>
                              {wagon.type === 'sleeper' ? <Bed className="w-4 h-4" /> :
                               wagon.type === 'business' ? <Star className="w-4 h-4" /> :
                               wagon.type === 'observation' ? <Eye className="w-4 h-4" /> :
                               <User className="w-4 h-4" />}
                            </div>
                            <div className="text-label font-semibold text-kongo-black">
                              {wagon.name}
                            </div>
                            <div className="text-body-xs text-secondary line-clamp-2">
                              {wagon.description}
                            </div>
                            <Badge className={
                              wagon.type === 'business' ? 'status-info' :
                              wagon.type === 'sleeper' ? 'status-kongo' :
                              'status-success'
                            }>
                              {wagon.capacity} places
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Seat Map */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="xl:col-span-2"
          >
            <Card className="card-elevated">
              <CardHeader className="border-b border-border-primary">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-h4 text-kongo-black">
                    {isTrainTrip && currentWagon ? currentWagon.name : `Sélectionnez vos ${isTrainTrip ? 'places' : 'sièges'}`}
                  </CardTitle>
                  <Button
                    onClick={() => setShowLegend(!showLegend)}
                    className="btn-ghost text-body-small"
                  >
                    <Info className="w-4 h-4 mr-2" />
                    Légende
                  </Button>
                </div>
                
                {/* Legend */}
                <AnimatePresence>
                  {showLegend && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pt-4 border-t border-border-primary mt-4"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {seatTypes.map((type) => {
                          const IconComponent = type.icon;
                          return (
                            <div key={type.type} className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${type.color}`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <span className="text-body-small text-secondary">{type.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardHeader>
              
              <CardContent className="p-8">
                <div className="max-w-2xl mx-auto">
                  {/* Wagon info for trains */}
                  {isTrainTrip && currentWagon && (
                    <div className="text-center mb-6 p-4 bg-surface-kongo-lime-light rounded-lg border border-kongo-lime/20">
                      <div className="text-caption text-kongo-lime-dark font-bold mb-1">
                        {currentWagon.name.toUpperCase()}
                      </div>
                      <div className="text-body-small text-secondary">
                        {currentWagon.description} • Configuration {currentWagon.layout}
                      </div>
                    </div>
                  )}

                  {/* Driver area for buses */}
                  {!isTrainTrip && (
                    <div className="bg-surface-tertiary rounded-t-2xl p-4 mb-6 text-center">
                      <div className="w-8 h-8 bg-kongo-black rounded-full mx-auto mb-2 flex items-center justify-center">
                        <User className="w-4 h-4 text-on-black" />
                      </div>
                      <div className="text-caption text-tertiary">CHAUFFEUR</div>
                    </div>
                  )}

                  {/* Seat Grid */}
                  <div className="space-y-3">
                    {isTrainTrip && currentWagon?.layout === "compartment" ? (
                      // Compartment layout for trains
                      <div className="space-y-6">
                        <div className="text-center text-caption text-tertiary">
                          COMPARTIMENTS • 4 COUCHETTES PAR COMPARTIMENT
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          {Array.from({ length: Math.floor(currentWagon.capacity / 4) }, (_, compIndex) => {
                            const compNumber = compIndex + 1;
                            const compSeats = seatLayout.filter(seat => seat.compartment === compNumber);
                            
                            return (
                              <div key={compNumber} className="border border-border-secondary rounded-lg p-4">
                                <div className="text-center text-body-small font-medium text-secondary mb-3">
                                  Compartiment {compNumber}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  {compSeats.map(seat => {
                                    const IconComponent = getSeatIcon(seat);
                                    const isHovered = hoveredSeat === seat.id;
                                    
                                    return (
                                      <motion.button
                                        key={seat.id}
                                        onClick={() => handleSeatClick(seat)}
                                        onMouseEnter={() => setHoveredSeat(seat.id)}
                                        onMouseLeave={() => setHoveredSeat(null)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={`w-12 h-8 rounded border-2 flex items-center justify-center text-xs
                                          transition-all duration-200 relative ${getSeatColor(seat)}
                                          ${isHovered ? 'ring-2 ring-kongo-lime ring-opacity-50' : ''}`}
                                        disabled={seat.status === 'occupied' || seat.status === 'reserved'}
                                      >
                                        <IconComponent className="w-3 h-3" />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-surface-elevated rounded-full border border-border-primary flex items-center justify-center">
                                          <span style={{ fontSize: '8px', lineHeight: 1 }}>{seat.column}</span>
                                        </div>
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      // Regular seating layout
                      Array.from({ length: Math.max(1, Math.ceil(seatLayout.length / 4)) }, (_, rowIndex) => {
                        const rowNumber = rowIndex + 1;
                        const rowSeats = seatLayout.filter(seat => seat.row === rowNumber);
                        
                        if (rowSeats.length === 0) return null;
                        
                        return (
                          <div key={rowNumber} className="flex items-center justify-center space-x-3">
                            <div className="w-6 text-center text-body-small font-medium text-secondary">
                              {rowNumber}
                            </div>
                            
                            <div className="flex space-x-2">
                              {rowSeats.filter(seat => ['A', 'B'].includes(seat.column)).map(seat => {
                                const IconComponent = getSeatIcon(seat);
                                const isHovered = hoveredSeat === seat.id;
                                const isSelected = selectedSeats.find(s => s.id === seat.id);
                                
                                return (
                                  <motion.button
                                    key={seat.id}
                                    onClick={() => handleSeatClick(seat)}
                                    onMouseEnter={() => setHoveredSeat(seat.id)}
                                    onMouseLeave={() => setHoveredSeat(null)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center
                                      transition-all duration-200 relative ${getSeatColor(seat)}
                                      ${isHovered ? 'ring-2 ring-kongo-lime ring-opacity-50' : ''}`}
                                    disabled={seat.status === 'occupied' || seat.status === 'reserved'}
                                  >
                                    <IconComponent className="w-4 h-4" />
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-surface-elevated rounded-full border border-border-primary flex items-center justify-center">
                                      <span className="text-caption leading-none">{seat.column}</span>
                                    </div>
                                    {seat.type === 'premium' && !isSelected && (
                                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-info rounded-full flex items-center justify-center">
                                        <Star className="w-2 h-2 text-white" />
                                      </div>
                                    )}
                                  </motion.button>
                                );
                              })}
                            </div>
                            
                            <div className="w-8 flex-shrink-0 text-center">
                              <div className="w-full h-px bg-border-primary"></div>
                            </div>
                            
                            <div className="flex space-x-2">
                              {rowSeats.filter(seat => ['C', 'D'].includes(seat.column)).map(seat => {
                                const IconComponent = getSeatIcon(seat);
                                const isHovered = hoveredSeat === seat.id;
                                const isSelected = selectedSeats.find(s => s.id === seat.id);
                                
                                return (
                                  <motion.button
                                    key={seat.id}
                                    onClick={() => handleSeatClick(seat)}
                                    onMouseEnter={() => setHoveredSeat(seat.id)}
                                    onMouseLeave={() => setHoveredSeat(null)}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center
                                      transition-all duration-200 relative ${getSeatColor(seat)}
                                      ${isHovered ? 'ring-2 ring-kongo-lime ring-opacity-50' : ''}`}
                                    disabled={seat.status === 'occupied' || seat.status === 'reserved'}
                                  >
                                    <IconComponent className="w-4 h-4" />
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-surface-elevated rounded-full border border-border-primary flex items-center justify-center">
                                      <span className="text-caption leading-none">{seat.column}</span>
                                    </div>
                                    {seat.type === 'premium' && !isSelected && (
                                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-info rounded-full flex items-center justify-center">
                                        <Star className="w-2 h-2 text-white" />
                                      </div>
                                    )}
                                  </motion.button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  
                  {/* Vehicle features */}
                  <div className="mt-6 pt-6 border-t border-border-primary">
                    <div className="text-caption text-tertiary mb-3 text-center">
                      ÉQUIPEMENTS DU {isTrainTrip ? 'TRAIN' : 'BUS'}
                    </div>
                    <div className="flex justify-center space-x-4">
                      {(isTrainTrip ? [
                        { icon: Wifi, label: "WiFi limité" },
                        { icon: Utensils, label: "Restaurant" },
                        { icon: Bed, label: "Couchettes" },
                        { icon: Zap, label: "Prises électriques" }
                      ] : [
                        { icon: Wifi, label: "WiFi gratuit" },
                        { icon: Coffee, label: "Collation" },
                        { icon: Zap, label: "Prises USB" },
                        { icon: Shield, label: "Climatisation" }
                      ]).map((feature, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          <feature.icon className="w-4 h-4 text-success" />
                          <span className="text-body-xs text-secondary">{feature.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Interactive Route Map - Moved strictly below seat selection */}
            <Card className="card-elevated mt-8">
              <CardContent className="p-4">
                <div className="mb-3">
                  <h4 className="text-body font-semibold text-kongo-black mb-1">Votre Trajet</h4>
                  <p className="text-body-small text-secondary">
                    Parcours {trip?.from} → {trip?.to}
                  </p>
                </div>
                {(trip?.departureAddress || trip?.arrivalAddress) && (
                  <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-border-primary bg-surface-secondary px-3 py-2">
                      <div className="text-caption text-tertiary">Adresse arrêt départ</div>
                      <div className="text-body-small text-kongo-black font-medium mt-1">
                        {trip?.departureAddress || 'Non renseignée'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border-primary bg-surface-secondary px-3 py-2">
                      <div className="text-caption text-tertiary">Adresse arrêt terminus</div>
                      <div className="text-body-small text-kongo-black font-medium mt-1">
                        {trip?.arrivalAddress || 'Non renseignée'}
                      </div>
                    </div>
                  </div>
                )}
                <InteractiveRouteMap 
                  route={{ from: trip?.from || '', to: trip?.to || '' }}
                  stops={trip?.stops || ['Kananga', 'Mbuji-Mayi']}
                  showHotels={false}
                  showServices={true}
                />
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Selection Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Hovered seat details */}
            {hoveredSeat && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="card-interactive border-kongo-lime/30">
                  <CardContent className="p-4">
                    {(() => {
                      const seat = seatLayout.find(s => s.id === hoveredSeat);
                      if (!seat) return null;
                      
                      return (
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-h6 text-kongo-black font-semibold flex-1 leading-tight">
                              {seat.type === 'couchette' 
                                ? `Compartiment ${seat.compartment} - ${seat.column}`
                                : `${isTrainTrip ? 'Place' : 'Siège'} ${seat.row}${seat.column}`
                              }
                            </div>
                            <Badge className={`shrink-0 ${
                              seat.type === 'premium' ? 'status-info' : 
                              seat.type === 'couchette' ? 'status-kongo' : 
                              'status-success'
                            }`}>
                              {seat.type === 'couchette' ? 'Couchette' : 
                               seat.type === 'premium' ? 'Premium' : 'Standard'}
                            </Badge>
                          </div>
                          
                          <div className="text-h5 text-kongo-black font-bold">
                            {formatPrice(seat.price)}
                          </div>
                          
                          {seat.features.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-caption text-tertiary">AVANTAGES</div>
                              {seat.features.map((feature, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <CheckCircle2 className="w-3 h-3 text-success" />
                                  <span className="text-body-xs text-secondary">{feature}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </motion.div>
            )}
            
            {/* Selected seats summary */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-h5 text-kongo-black flex items-center flex-wrap gap-2">
                  <div className="flex items-center">
                    <UserCheck className="w-5 h-5 mr-2 shrink-0" />
                    {isTrainTrip ? 'Places' : 'Sièges'} sélectionnés 
                  </div>
                  <Badge className="status-kongo shrink-0">
                    {selectedSeats.length}/{passengers}
                  </Badge>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {selectedSeats.length === 0 ? (
                  <div className="text-center py-8">
                    {isTrainTrip ? <Train className="w-12 h-12 text-quaternary mx-auto mb-3" /> : <User className="w-12 h-12 text-quaternary mx-auto mb-3" />}
                    <div className="text-body-small text-secondary">
                      Sélectionnez les {isTrainTrip ? 'places' : 'sièges'} pour continuer
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedSeats.map((seat, index) => (
                      <motion.div
                        key={seat.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-3 bg-surface-kongo-lime-light rounded-lg border border-kongo-lime/30"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-kongo-lime rounded-lg flex items-center justify-center">
                            {seat.type === 'couchette' ? <Bed className="w-4 h-4 text-kongo-black" /> : <User className="w-4 h-4 text-kongo-black" />}
                          </div>
                          <div>
                            <div className="text-body font-medium text-kongo-black">
                              {seat.type === 'couchette' 
                                ? `Compartiment ${seat.compartment} - ${seat.column}`
                                : `${isTrainTrip ? 'Place' : 'Siège'} ${seat.row}${seat.column}`
                              }
                            </div>
                            <div className="text-body-small text-kongo-lime-dark">
                              {currentWagon?.name || ''} • {seat.type === 'couchette' ? 'Couchette' : 
                               seat.type === 'premium' ? 'Premium' : 'Standard'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-body font-semibold text-kongo-black">
                            {formatPrice(seat.price)}
                          </div>
                          <button
                            onClick={() => handleSeatClick(seat)}
                            className="text-body-small text-kongo-lime-dark hover:text-error transition-colors"
                          >
                            Retirer
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                
                {selectedSeats.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-body">
                        <span className="text-secondary">Sous-total</span>
                        <span className="text-kongo-black font-medium">{formatPrice(getTotalPrice())}</span>
                      </div>
                      <div className="flex items-center justify-between text-body">
                        <span className="text-secondary">Frais de service</span>
                        <span className="text-kongo-black font-medium">{formatPrice(getTotalPrice() * 0.03)}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between text-h5 font-bold">
                        <span className="text-kongo-black">Total</span>
                        <span className="text-kongo-black">{formatPrice(getTotalPrice() * 1.03)}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Action buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => onContinue(selectedSeats)}
                disabled={selectedSeats.length === 0}
                className="btn-primary w-full h-12"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {/* [Agent Dev Web] - Action: Bouton adapté pour groupes 30+ */}
                {selectedSeats.length === 0
                  ? `Sélectionnez au moins 1 ${isTrainTrip ? 'place' : 'siège'}`
                  : `Procéder au Paiement (${selectedSeats.length} ${isTrainTrip ? 'place' : 'siège'}${selectedSeats.length > 1 ? 's' : ''})`}
              </Button>
              
              <Button
                onClick={onBack}
                className="btn-ghost w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la recherche
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
