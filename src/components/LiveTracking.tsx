import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Users, 
  Wifi, 
  Thermometer,
  Fuel,
  Phone,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Download
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface LiveTrackingProps {
  tripId: string;
  busInfo: {
    plateNumber: string;
    driverName: string;
    driverPhone: string;
    model: string;
    capacity: number;
    amenities: string[];
  };
  route: {
    from: string;
    to: string;
    totalDistance: number;
    estimatedDuration: string;
    stops: Array<{
      id: string;
      name: string;
      arrivalTime: string;
      isCompleted: boolean;
      isCurrent: boolean;
      delayMinutes?: number;
    }>;
  };
  onEmergencyContact: () => void;
}

interface BusStatus {
  currentLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  speed: number;
  direction: string;
  progress: number;
  nextStop: string;
  eta: string;
  delay: number;
  fuel: number;
  temperature: number;
  wifiStatus: boolean;
  passengerCount: number;
  lastUpdate: Date;
}

export function LiveTracking({ tripId, busInfo, route, onEmergencyContact }: LiveTrackingProps) {
  const [busStatus, setBusStatus] = useState<BusStatus>({
    currentLocation: {
      lat: -4.4419,
      lng: 15.2663,
      address: "Avenue de la Libération, Kinshasa"
    },
    speed: 65,
    direction: "Sud-Est",
    progress: 34,
    nextStop: "Kikwit",
    eta: "14:45",
    delay: -5,
    fuel: 78,
    temperature: 22,
    wifiStatus: true,
    passengerCount: 28,
    lastUpdate: new Date()
  });

  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [weatherInfo, setWeatherInfo] = useState({
    condition: "Ensoleillé",
    temperature: 28,
    icon: "☀️"
  });

  // Simulate real-time updates
  useEffect(() => {
    if (!isAutoRefresh) return;

    const interval = setInterval(() => {
      setBusStatus(prev => ({
        ...prev,
        speed: Math.max(0, prev.speed + (Math.random() - 0.5) * 10),
        progress: Math.min(100, prev.progress + Math.random() * 2),
        fuel: Math.max(0, prev.fuel - Math.random() * 0.5),
        lastUpdate: new Date()
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleShareLocation = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Position de mon bus KonGO',
        text: `Je voyage actuellement de ${route.from} vers ${route.to}. Position actuelle: ${busStatus.currentLocation.address}`,
        url: `https://maps.google.com/?q=${busStatus.currentLocation.lat},${busStatus.currentLocation.lng}`
      });
    } else {
      navigator.clipboard.writeText(`Position bus KonGO: ${busStatus.currentLocation.address} - https://maps.google.com/?q=${busStatus.currentLocation.lat},${busStatus.currentLocation.lng}`);
      toast.success("📍 Lien de localisation copié");
    }
  };

  const handleDownloadMap = () => {
    toast.success("🗺️ Carte hors ligne téléchargée");
  };

  const getStatusColor = () => {
    if (busStatus.delay > 15) return 'text-error';
    if (busStatus.delay > 0) return 'text-warning';
    return 'text-success';
  };

  const getStatusBadge = () => {
    if (busStatus.delay > 15) return 'status-error';
    if (busStatus.delay > 0) return 'status-warning';
    return 'status-success';
  };

  return (
    <div className="min-h-screen bg-surface-primary py-20">
      <div className="container-professional">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-h2 text-kongo-black mb-2">Suivi en Temps Réel</h1>
              <div className="flex items-center space-x-4">
                <span className="text-body text-secondary">Voyage ID: {tripId}</span>
                <Badge className={getStatusBadge()}>
                  {busStatus.delay > 0 ? `+${busStatus.delay}min` : busStatus.delay < 0 ? `${busStatus.delay}min` : 'À l\'heure'}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={`btn-ghost ${isAutoRefresh ? 'text-success' : 'text-tertiary'}`}
              >
                {isAutoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="ml-2 text-body-small">{isAutoRefresh ? 'Pause' : 'Reprendre'}</span>
              </Button>
              
              <Button
                onClick={() => {
                  setBusStatus(prev => ({ ...prev, lastUpdate: new Date() }));
                  toast.success("🔄 Position mise à jour");
                }}
                className="btn-ghost"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-body-small text-tertiary">
            Dernière mise à jour: {busStatus.lastUpdate.toLocaleTimeString('fr-FR')}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Map Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Map Container */}
            <div className="card-elevated p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-h4 text-primary">Localisation GPS</h3>
                <div className="flex items-center space-x-2">
                  <Button onClick={handleShareLocation} className="btn-ghost p-2">
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button onClick={handleDownloadMap} className="btn-ghost p-2">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Mock Map */}
              <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-96 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-opacity-20 bg-kongo-lime">
                  <div className="absolute top-4 left-4 bg-surface-elevated rounded-lg p-3 shadow-md">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                      <span className="text-body-small font-medium">Position actuelle</span>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-4 right-4 bg-surface-elevated rounded-lg p-3 shadow-md">
                    <div className="text-body-small text-secondary">
                      {weatherInfo.icon} {weatherInfo.condition} {weatherInfo.temperature}°C
                    </div>
                  </div>
                </div>
                
                {/* Bus Icon */}
                <motion.div
                  animate={{ 
                    x: [0, 20, -10, 15, 0],
                    y: [0, -5, 10, -15, 0]
                  }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="relative"
                >
                  <div className="w-16 h-16 bg-kongo-black rounded-lg flex items-center justify-center shadow-lg">
                    <span className="text-2xl">🚌</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full flex items-center justify-center">
                    <Navigation className="w-3 h-3 text-white" />
                  </div>
                </motion.div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-quaternary">
                    <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-body-small">Carte interactive disponible dans l'app mobile</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-surface-kongo-lime-light rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-kongo-lime-dark" />
                  <div>
                    <div className="text-body font-medium text-kongo-black">Position actuelle</div>
                    <div className="text-body-small text-kongo-lime-dark">{busStatus.currentLocation.address}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Route Progress */}
            <div className="card-elevated p-6">
              <h3 className="text-h4 text-primary mb-6">Progression du Trajet</h3>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-body-small text-secondary">Progression globale</span>
                  <span className="text-body-small font-medium text-primary">{busStatus.progress.toFixed(1)}%</span>
                </div>
                <Progress value={busStatus.progress} className="h-3" />
              </div>

              <div className="space-y-4">
                {route.stops.map((stop, index) => (
                  <motion.div
                    key={stop.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center space-x-4 p-4 rounded-lg ${
                      stop.isCompleted ? 'bg-success-light' :
                      stop.isCurrent ? 'bg-surface-kongo-lime-light border border-kongo-lime' :
                      'bg-surface-tertiary'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      stop.isCompleted ? 'bg-success text-white' :
                      stop.isCurrent ? 'bg-kongo-lime text-kongo-black' :
                      'bg-surface-secondary text-tertiary'
                    }`}>
                      {stop.isCompleted ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : stop.isCurrent ? (
                        <Navigation className="w-4 h-4" />
                      ) : (
                        <span className="text-body-small font-medium">{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-body font-medium ${
                          stop.isCurrent ? 'text-kongo-black' : 'text-primary'
                        }`}>
                          {stop.name}
                        </span>
                        <span className={`text-body-small ${
                          stop.isCurrent ? 'text-kongo-lime-dark' : 'text-secondary'
                        }`}>
                          {stop.arrivalTime}
                        </span>
                      </div>
                      
                      {stop.delayMinutes && (
                        <div className="flex items-center mt-1">
                          <Clock className="w-3 h-3 text-warning mr-1" />
                          <span className="text-caption text-warning">
                            +{stop.delayMinutes}min de retard
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            
            {/* Bus Status */}
            <div className="card-elevated p-6">
              <h3 className="text-h4 text-primary mb-4">État du Bus</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Navigation className="w-4 h-4 text-kongo-lime-dark" />
                    <span className="text-body-small text-secondary">Vitesse</span>
                  </div>
                  <span className="text-body font-medium text-primary">{busStatus.speed.toFixed(0)} km/h</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-kongo-lime-dark" />
                    <span className="text-body-small text-secondary">Prochaine arrivée</span>
                  </div>
                  <span className={`text-body font-medium ${getStatusColor()}`}>{busStatus.eta}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Fuel className="w-4 h-4 text-kongo-lime-dark" />
                    <span className="text-body-small text-secondary">Carburant</span>
                  </div>
                  <span className="text-body font-medium text-primary">{busStatus.fuel.toFixed(0)}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-4 h-4 text-kongo-lime-dark" />
                    <span className="text-body-small text-secondary">Température</span>
                  </div>
                  <span className="text-body font-medium text-primary">{busStatus.temperature}°C</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-4 h-4 text-kongo-lime-dark" />
                    <span className="text-body-small text-secondary">WiFi</span>
                  </div>
                  <Badge className={busStatus.wifiStatus ? 'status-success' : 'status-error'}>
                    {busStatus.wifiStatus ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-kongo-lime-dark" />
                    <span className="text-body-small text-secondary">Passagers</span>
                  </div>
                  <span className="text-body font-medium text-primary">{busStatus.passengerCount}/{busInfo.capacity}</span>
                </div>
              </div>
            </div>

            {/* Driver Info */}
            <div className="card-elevated p-6">
              <h3 className="text-h4 text-primary mb-4">Informations Chauffeur</h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-body-small text-secondary block">Nom</span>
                  <span className="text-body font-medium text-primary">{busInfo.driverName}</span>
                </div>
                
                <div>
                  <span className="text-body-small text-secondary block">Véhicule</span>
                  <span className="text-body font-medium text-primary">{busInfo.model}</span>
                  <span className="text-body-small text-tertiary block">{busInfo.plateNumber}</span>
                </div>
                
                <Button
                  onClick={() => window.open(`tel:${busInfo.driverPhone}`, '_self')}
                  className="btn-outline-lime w-full"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Contacter le Chauffeur
                </Button>
              </div>
            </div>

            {/* Emergency */}
            <div className="card-elevated p-6 border-l-4 border-l-error">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-error" />
                <h3 className="text-h5 text-error font-semibold">Urgence</h3>
              </div>
              
              <p className="text-body-small text-secondary mb-4">
                En cas d'urgence pendant le voyage, contactez immédiatement nos équipes.
              </p>
              
              <div className="space-y-2">
                <Button
                  onClick={onEmergencyContact}
                  className="btn-accent w-full"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Appel d'Urgence 24/7
                </Button>
                
                <Button
                  onClick={() => {
                    navigator.geolocation.getCurrentPosition((position) => {
                      toast.success("📍 Position d'urgence partagée avec KonGO");
                    });
                  }}
                  className="btn-ghost w-full text-error border border-error-light"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Partager Ma Position
                </Button>
              </div>
            </div>

            {/* Amenities */}
            <div className="card-elevated p-6">
              <h3 className="text-h4 text-primary mb-4">Équipements</h3>
              
              <div className="flex flex-wrap gap-2">
                {busInfo.amenities.map((amenity) => (
                  <Badge key={amenity} className="status-kongo">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}