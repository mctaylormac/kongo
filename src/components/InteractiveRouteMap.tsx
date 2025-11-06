import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { 
  MapPin, 
  Hotel, 
  Coffee, 
  Fuel, 
  Utensils,
  Clock,
  Star,
  Navigation,
  Maximize2,
  Minimize2,
  X,
  Info,
  Phone,
  Wifi,
  Car,
  Bed,
  ShoppingBag,
  Hospital,
  Route,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface InteractiveRouteMapProps {
  route: {
    from: string;
    to: string;
    fromCoords?: [number, number];
    toCoords?: [number, number];
  };
  stops?: string[];
  showHotels?: boolean;
  showServices?: boolean;
  className?: string;
  compact?: boolean;
}

interface MapPoint {
  id: string;
  type: "city" | "stop" | "hotel" | "restaurant" | "fuel" | "service";
  name: string;
  location: [number, number]; // [x, y] percentage coordinates
  description?: string;
  rating?: number;
  price?: string;
  amenities?: string[];
  phone?: string;
  distance?: string;
  duration?: string;
}

export function InteractiveRouteMap({ 
  route, 
  stops = [], 
  showHotels = true, 
  showServices = true,
  className = "",
  compact = false
}: InteractiveRouteMapProps) {
  // Safety check for route prop
  if (!route || !route.from || !route.to) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <MapPin className="w-8 h-8 text-quaternary mx-auto mb-2" />
        <p className="text-body-small text-secondary">
          Informations de trajet non disponibles
        </p>
      </div>
    );
  }
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([]);

  // Generate realistic map data for DRC routes
  useEffect(() => {
    if (!route || !route.from || !route.to) {
      setMapPoints([]);
      return;
    }

    const generateMapPoints = () => {
      const points: MapPoint[] = [];
      
      // Main cities
      points.push({
        id: "start",
        type: "city",
        name: route.from,
        location: [10, 80],
        description: `Point de départ - ${route.from}`,
      });

      points.push({
        id: "end", 
        type: "city",
        name: route.to,
        location: [90, 20],
        description: `Destination - ${route.to}`,
      });

      // Intermediate stops based on route
      const fromCity = route.from?.toLowerCase() || "";
      const toCity = route.to?.toLowerCase() || "";
      
      if (fromCity === "kinshasa" && toCity === "lubumbashi") {
        points.push(
          {
            id: "kananga",
            type: "stop",
            name: "Kananga",
            location: [35, 60],
            description: "Arrêt principal - 30 minutes",
            duration: "30 min",
            distance: "450 km"
          },
          {
            id: "mbuji-mayi",
            type: "stop", 
            name: "Mbuji-Mayi",
            location: [60, 45],
            description: "Arrêt repas - 45 minutes",
            duration: "45 min",
            distance: "750 km"
          },
          {
            id: "kolwezi",
            type: "stop",
            name: "Kolwezi",
            location: [78, 35],
            description: "Dernier arrêt - 20 minutes",
            duration: "20 min", 
            distance: "1100 km"
          }
        );

        if (showHotels) {
          points.push(
            {
              id: "hotel-kananga-1",
              type: "hotel",
              name: "Hôtel Kasai Palace",
              location: [33, 58],
              description: "Hôtel 4 étoiles au cœur de Kananga",
              rating: 4.2,
              price: "45,000 CDF/nuit",
              amenities: ["WiFi", "Restaurant", "Parking", "Climatisation"],
              phone: "+243 123 456 789"
            },
            {
              id: "hotel-mbuji-1",
              type: "hotel", 
              name: "Lodge Diamant",
              location: [62, 43],
              description: "Lodge moderne avec vue sur la ville",
              rating: 4.0,
              price: "38,000 CDF/nuit",
              amenities: ["WiFi", "Petit-déjeuner", "Parking"],
              phone: "+243 987 654 321"
            },
            {
              id: "hotel-kolwezi-1",
              type: "hotel",
              name: "Kolwezi Inn",
              location: [76, 33],
              description: "Hôtel d'affaires proche de la gare",
              rating: 3.8,
              price: "32,000 CDF/nuit",
              amenities: ["WiFi", "Restaurant", "Business Center"],
              phone: "+243 555 123 456"
            }
          );
        }

        if (showServices) {
          points.push(
            {
              id: "restaurant-kananga",
              type: "restaurant",
              name: "Restaurant Maman Ngozi",
              location: [37, 62],
              description: "Cuisine congolaise authentique",
              rating: 4.5,
              price: "8,000-15,000 CDF",
              amenities: ["Terrasse", "Plats locaux", "Takeaway"]
            },
            {
              id: "fuel-mbuji",
              type: "fuel",
              name: "Station Total Mbuji-Mayi",
              location: [58, 47],
              description: "Station-service 24h/24 avec boutique",
              amenities: ["Carburant", "Boutique", "WC", "WiFi"]
            },
            {
              id: "service-kolwezi",
              type: "service",
              name: "Centre Commercial Kolwezi",
              location: [80, 37],
              description: "Shopping et services avant Lubumbashi",
              amenities: ["Shopping", "Pharmacie", "Banque", "Restaurants"]
            }
          );
        }
      }

      // Coastal route: Kinshasa → Matadi → Boma → Muanda
      if ((fromCity === "kinshasa" && toCity === "muanda") || 
          route.from === "Kinshasa" && route.to === "Muanda") {
        // Recreate points for coastal route
        points.length = 0;
        
        points.push({
          id: "kinshasa",
          type: "city",
          name: "Kinshasa",
          location: [15, 75],
          description: "Capital de la RDC - Point de départ",
        });

        points.push({
          id: "matadi",
          type: "stop",
          name: "Matadi",
          location: [25, 65],
          description: "Port principal du Congo - Arrêt 45 minutes",
          duration: "45 min",
          distance: "365 km"
        });

        points.push({
          id: "boma",
          type: "stop", 
          name: "Boma",
          location: [35, 50],
          description: "Première capitale du Congo - Arrêt 30 minutes",
          duration: "30 min",
          distance: "500 km"
        });

        points.push({
          id: "muanda",
          type: "city",
          name: "Muanda",
          location: [50, 30],
          description: "Terminal côtier - Destination finale",
        });

        if (showHotels) {
          points.push(
            {
              id: "hotel-matadi-1",
              type: "hotel",
              name: "Hôtel Métropole Matadi",
              location: [23, 63],
              description: "Hôtel historique avec vue sur le fleuve Congo",
              rating: 4.1,
              price: "42,000 CDF/nuit",
              amenities: ["WiFi", "Restaurant", "Vue fleuve", "Climatisation"],
              phone: "+243 123 789 456"
            },
            {
              id: "hotel-boma-1",
              type: "hotel", 
              name: "Lodge Colonial Boma",
              location: [37, 48],
              description: "Charme colonial au cœur de l'histoire",
              rating: 3.9,
              price: "35,000 CDF/nuit",
              amenities: ["WiFi", "Restaurant", "Architecture coloniale", "Parking"],
              phone: "+243 987 321 654"
            },
            {
              id: "hotel-muanda-1",
              type: "hotel",
              name: "Atlantic Beach Resort",
              location: [52, 28],
              description: "Resort face à l'océan Atlantique",
              rating: 4.5,
              price: "65,000 CDF/nuit",
              amenities: ["WiFi", "Plage privée", "Restaurant", "Piscine", "Spa"],
              phone: "+243 555 987 321"
            }
          );
        }

        if (showServices) {
          points.push(
            {
              id: "restaurant-matadi",
              type: "restaurant",
              name: "Restaurant Fleuve Congo",
              location: [27, 67],
              description: "Spécialités de poisson du fleuve",
              rating: 4.3,
              price: "12,000-20,000 CDF",
              amenities: ["Terrasse", "Poissons frais", "Vue fleuve"]
            },
            {
              id: "fuel-boma",
              type: "fuel",
              name: "Station Shell Boma",
              location: [33, 52],
              description: "Station moderne avec services complets",
              amenities: ["Carburant", "Boutique", "Mécanique", "WiFi"]
            },
            {
              id: "service-muanda",
              type: "service",
              name: "Port Terminal Muanda",
              location: [48, 32],
              description: "Terminal pétrolier et services portuaires",
              amenities: ["Terminal pétrolier", "Banque", "Change", "Télécommunications"]
            }
          );
        }
      }

      // Add more routes logic here for other city pairs
      setMapPoints(points);
    };

    generateMapPoints();
  }, [route, showHotels, showServices]);

  const getPointIcon = (type: string) => {
    switch (type) {
      case "city": return MapPin;
      case "stop": return Navigation;
      case "hotel": return Hotel;
      case "restaurant": return Utensils;
      case "fuel": return Fuel;
      case "service": return ShoppingBag;
      default: return MapPin;
    }
  };

  const getPointColor = (type: string) => {
    switch (type) {
      case "city": return "text-kongo-black bg-kongo-lime";
      case "stop": return "text-white bg-info";
      case "hotel": return "text-white bg-success";
      case "restaurant": return "text-white bg-warning";
      case "fuel": return "text-white bg-error";
      case "service": return "text-white bg-kongo-black";
      default: return "text-secondary bg-surface-elevated";
    }
  };

  const pointTypes = [
    { type: "city", label: "Villes", icon: MapPin, color: "text-kongo-black bg-kongo-lime" },
    { type: "stop", label: "Arrêts", icon: Navigation, color: "text-white bg-info" },
    { type: "hotel", label: "Hôtels", icon: Hotel, color: "text-white bg-success" },
    { type: "restaurant", label: "Restaurants", icon: Utensils, color: "text-white bg-warning" },
    { type: "fuel", label: "Carburant", icon: Fuel, color: "text-white bg-error" },
    { type: "service", label: "Services", icon: ShoppingBag, color: "text-white bg-kongo-black" }
  ];

  const handlePointClick = (point: MapPoint) => {
    setSelectedPoint(point);
    toast.info(`${point.name} sélectionné`, {
      description: point.description
    });
  };

  const handleHotelContact = (point: MapPoint) => {
    if (point.phone) {
      window.open(`tel:${point.phone}`, '_self');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const mapContent = (
    <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden">
      {/* Map SVG */}
      <div className="relative w-full" style={{ aspectRatio: compact ? "16/9" : "4/3" }}>
        <svg 
          className="w-full h-full" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background */}
          <defs>
            <pattern id="mapGrid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e0e7ff" strokeWidth="0.5"/>
            </pattern>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--kongo-black)" />
              <stop offset="100%" stopColor="var(--kongo-lime)" />
            </linearGradient>
          </defs>
          
          <rect width="100" height="100" fill="url(#mapGrid)" />
          
          {/* Route line - Dynamic based on route */}
          <path
            d={route.from === "Kinshasa" && (route.to === "Muanda" || mapPoints.some(p => p.name === "Muanda")) 
              ? `M 15 75 Q 20 70, 25 65 Q 30 58, 35 50 Q 42 40, 50 30`
              : `M 10 80 Q 30 70, 35 60 Q 50 50, 60 45 Q 75 35, 90 20`}
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="1.5"
            strokeDasharray="2,1"
            className="animate-pulse"
          />

          {/* Map points */}
          {mapPoints && mapPoints.length > 0 && mapPoints.map((point) => {
            if (!point || !point.location || point.location.length < 2) {
              return null;
            }
            
            const IconComponent = getPointIcon(point.type);
            return (
              <g key={point.id}>
                <circle
                  cx={point.location[0]}
                  cy={point.location[1]}
                  r="3"
                  className={`${getPointColor(point.type)} cursor-pointer transition-all duration-200 hover:scale-110`}
                  onClick={() => handlePointClick(point)}
                />
                <foreignObject
                  x={point.location[0] - 1}
                  y={point.location[1] - 1}
                  width="2"
                  height="2"
                  className="pointer-events-none"
                >
                  <IconComponent className="w-2 h-2 text-white" />
                </foreignObject>
                
                {/* Point label */}
                <text
                  x={point.location[0]}
                  y={point.location[1] - 4}
                  textAnchor="middle"
                  className="fill-kongo-black text-xs font-medium pointer-events-none"
                  style={{ fontSize: compact ? '2px' : '1.5px' }}
                >
                  {point.name}
                </text>
              </g>
            );
          })}

          {/* Distance indicators - Dynamic based on route */}
          {route.from === "Kinshasa" && (route.to === "Muanda" || mapPoints.some(p => p.name === "Muanda")) ? (
            <>
              <text x="20" y="70" className="fill-gray-600 text-xs" style={{ fontSize: '1.2px' }}>
                365 km
              </text>
              <text x="30" y="58" className="fill-gray-600 text-xs" style={{ fontSize: '1.2px' }}>
                500 km
              </text>
              <text x="42" y="40" className="fill-gray-600 text-xs" style={{ fontSize: '1.2px' }}>
                685 km
              </text>
            </>
          ) : (
            <>
              <text x="25" y="75" className="fill-gray-600 text-xs" style={{ fontSize: '1.2px' }}>
                450 km
              </text>
              <text x="50" y="55" className="fill-gray-600 text-xs" style={{ fontSize: '1.2px' }}>
                750 km
              </text>
              <text x="75" y="35" className="fill-gray-600 text-xs" style={{ fontSize: '1.2px' }}>
                1100 km
              </text>
            </>
          )}
        </svg>

        {/* Interactive overlays */}
        <div className="absolute inset-0">
          {mapPoints && mapPoints.length > 0 && mapPoints.map((point) => {
            if (!point || !point.location || point.location.length < 2) {
              return null;
            }
            
            return (
              <motion.button
                key={`overlay-${point.id}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handlePointClick(point)}
                className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full border-2 border-white shadow-lg transition-all duration-200"
                style={{
                  left: `${point.location[0]}%`,
                  top: `${point.location[1]}%`,
                }}
              >
                <div className={`w-full h-full rounded-full flex items-center justify-center ${getPointColor(point.type)}`}>
                  {React.createElement(getPointIcon(point.type), { 
                    className: "w-3 h-3" 
                  })}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h4 className="text-h6 text-kongo-black font-semibold">Carte du trajet</h4>
          <Button
            onClick={toggleFullscreen}
            className="btn-ghost p-2"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        {mapContent}
        
        {/* Fullscreen modal */}
        <AnimatePresence>
          {isFullscreen && route && route.from && route.to && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-surface-overlay z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-surface-elevated rounded-xl p-6 max-w-6xl w-full max-h-full overflow-auto relative"
              >
                <Button
                  onClick={toggleFullscreen}
                  className="btn-ghost absolute top-4 right-4 z-10"
                >
                  <X className="w-6 h-6" />
                </Button>
                <div className="pt-12">
                  <InteractiveRouteMap
                    route={route}
                    stops={stops}
                    showHotels={showHotels}
                    showServices={showServices}
                    compact={false}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-h4 text-kongo-black flex items-center">
                <Route className="w-6 h-6 mr-3 text-kongo-lime" />
                Carte du Trajet
              </CardTitle>
              <div className="text-body-small text-secondary mt-1">
                {route.from} → {route.to}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowLegend(!showLegend)}
                className="btn-ghost text-body-small"
              >
                <Info className="w-4 h-4 mr-2" />
                {showLegend ? 'Masquer' : 'Afficher'} la légende
              </Button>
              
              {isFullscreen && (
                <Button
                  onClick={toggleFullscreen}
                  className="btn-ghost"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Legend */}
          <AnimatePresence>
            {showLegend && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-surface-secondary p-4 rounded-lg"
              >
                <h5 className="text-label text-kongo-black mb-3 flex items-center">
                  <Navigation className="w-4 h-4 mr-2" />
                  Légende de la carte
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pointTypes.map((type) => (
                    <div key={type.type} className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${type.color}`}>
                        <type.icon className="w-3 h-3" />
                      </div>
                      <span className="text-body-small text-secondary">{type.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Map */}
            <div className="xl:col-span-2">
              {mapContent}
            </div>

            {/* Point details */}
            <div className="space-y-4">
              <h5 className="text-h6 text-kongo-black font-semibold">
                {selectedPoint ? selectedPoint.name : 'Sélectionnez un point'}
              </h5>

              {selectedPoint ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <Card className="bg-surface-tertiary">
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getPointColor(selectedPoint.type)}`}>
                          {React.createElement(getPointIcon(selectedPoint.type), { 
                            className: "w-5 h-5" 
                          })}
                        </div>
                        <div className="flex-1">
                          <h6 className="text-body font-semibold text-kongo-black">
                            {selectedPoint.name}
                          </h6>
                          <p className="text-body-small text-secondary">
                            {selectedPoint.description}
                          </p>
                        </div>
                      </div>

                      {selectedPoint.rating && (
                        <div className="flex items-center space-x-1 mt-3">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(selectedPoint.rating!) 
                                    ? 'text-warning fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-body-small text-secondary">
                            ({selectedPoint.rating}/5)
                          </span>
                        </div>
                      )}

                      {selectedPoint.price && (
                        <div className="mt-3">
                          <div className="text-body font-semibold text-kongo-black">
                            {selectedPoint.price}
                          </div>
                        </div>
                      )}

                      {selectedPoint.duration && (
                        <div className="flex items-center space-x-4 mt-3 text-body-small text-secondary">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{selectedPoint.duration}</span>
                          </div>
                          {selectedPoint.distance && (
                            <div className="flex items-center space-x-1">
                              <Navigation className="w-4 h-4" />
                              <span>{selectedPoint.distance}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedPoint.amenities && selectedPoint.amenities.length > 0 && (
                        <div className="mt-4">
                          <div className="text-label-small text-tertiary mb-2">SERVICES</div>
                          <div className="flex flex-wrap gap-2">
                            {selectedPoint.amenities.map((amenity, index) => (
                              <Badge key={index} className="status-info text-caption">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedPoint.phone && (
                        <div className="mt-4 pt-4 border-t border-border-primary">
                          <Button
                            onClick={() => handleHotelContact(selectedPoint)}
                            className="btn-secondary w-full"
                          >
                            <Phone className="w-4 h-4 mr-2" />
                            Contacter
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-quaternary mx-auto mb-3" />
                  <p className="text-body-small text-secondary">
                    Cliquez sur un point de la carte pour voir les détails
                  </p>
                </div>
              )}

              {/* Quick stats */}
              <Card className="bg-surface-kongo-lime-light border-kongo-lime/30">
                <CardContent className="p-4">
                  <h6 className="text-label text-kongo-lime-dark mb-3 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Informations du trajet
                  </h6>
                  <div className="space-y-2 text-body-small">
                    <div className="flex justify-between">
                      <span className="text-kongo-lime-dark">Distance totale</span>
                      <span className="text-kongo-black font-semibold">~1,200 km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-kongo-lime-dark">Durée estimée</span>
                      <span className="text-kongo-black font-semibold">16h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-kongo-lime-dark">Arrêts prévus</span>
                      <span className="text-kongo-black font-semibold">{mapPoints.filter(p => p.type === 'stop').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-kongo-lime-dark">Hôtels à proximité</span>
                      <span className="text-kongo-black font-semibold">{mapPoints.filter(p => p.type === 'hotel').length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}