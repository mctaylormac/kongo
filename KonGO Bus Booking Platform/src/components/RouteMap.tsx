import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { 
  MapPin, 
  Navigation, 
  Clock, 
  Users, 
  Zap,
  Route,
  Maximize2,
  Minimize2,
  Layers,
  Filter,
  RefreshCw
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface RouteMapProps {
  selectedRoute?: {
    from: string;
    to: string;
  };
  showFilters?: boolean;
  fullscreen?: boolean;
}

export function RouteMap({ selectedRoute, showFilters = true, fullscreen = false }: RouteMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(fullscreen);
  const [mapView, setMapView] = useState<'routes' | 'live' | 'stations'>('routes');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [animatingBuses, setAnimatingBuses] = useState<any[]>([]);

  // Major cities in DRC with approximate coordinates (scaled for SVG)
  const cities = {
    'kinshasa': { x: 180, y: 380, name: 'Kinshasa', region: 'Kinshasa', population: '17M' },
    'lubumbashi': { x: 520, y: 550, name: 'Lubumbashi', region: 'Haut-Katanga', population: '2.5M' },
    'goma': { x: 580, y: 250, name: 'Goma', region: 'Nord-Kivu', population: '2M' },
    'bukavu': { x: 570, y: 320, name: 'Bukavu', region: 'Sud-Kivu', population: '1.2M' },
    'kananga': { x: 400, y: 420, name: 'Kananga', region: 'Kasaï-Central', population: '1.8M' },
    'mbuji-mayi': { x: 450, y: 430, name: 'Mbuji-Mayi', region: 'Kasaï-Oriental', population: '3.5M' },
    'kisangani': { x: 480, y: 220, name: 'Kisangani', region: 'Tshopo', population: '1.6M' },
    'kolwezi': { x: 500, y: 580, name: 'Kolwezi', region: 'Lualaba', population: '745K' }
  };

  // Popular routes with traffic data
  const routes = [
    {
      id: 'kinshasa-lubumbashi',
      from: 'kinshasa',
      to: 'lubumbashi',
      distance: '1,845 km',
      duration: '16-18h',
      frequency: 'Daily',
      traffic: 'high',
      price: '125,000 CDF',
      companies: ['Express Congo', 'Trans-Katanga', 'Virunga Express'],
      path: 'M180,380 Q350,420 400,420 Q450,450 520,550'
    },
    {
      id: 'kinshasa-goma',
      from: 'kinshasa',
      to: 'goma',
      distance: '1,240 km',
      duration: '12-14h',
      frequency: 'Daily',
      traffic: 'high',
      price: '95,000 CDF',
      companies: ['Kivu Transport', 'Congo Express'],
      path: 'M180,380 Q300,280 480,220 Q530,235 580,250'
    },
    {
      id: 'lubumbashi-bukavu',
      from: 'lubumbashi',
      to: 'bukavu',
      distance: '890 km',
      duration: '8-10h',
      frequency: '3x/week',
      traffic: 'medium',
      price: '75,000 CDF',
      companies: ['Katanga Express', 'Kivu Lines'],
      path: 'M520,550 Q540,450 550,380 Q560,350 570,320'
    },
    {
      id: 'kinshasa-kananga',
      from: 'kinshasa',
      to: 'kananga',
      distance: '730 km',
      duration: '6-8h',
      frequency: 'Daily',
      traffic: 'medium',
      price: '65,000 CDF',
      companies: ['Kasaï Transport', 'Central Express'],
      path: 'M180,380 Q290,390 400,420'
    },
    {
      id: 'kananga-mbuji-mayi',
      from: 'kananga',
      to: 'mbuji-mayi',
      distance: '180 km',
      duration: '2-3h',
      frequency: 'Daily',
      traffic: 'low',
      price: '25,000 CDF',
      companies: ['Diamond Express', 'Kasaï Lines'],
      path: 'M400,420 Q425,425 450,430'
    }
  ];

  // Simulate live buses
  useEffect(() => {
    const buses = [
      { 
        id: 'bus1', 
        route: 'kinshasa-lubumbashi', 
        progress: 0.3, 
        company: 'Express Congo',
        status: 'En route',
        eta: '12h 30min',
        passengers: 45
      },
      { 
        id: 'bus2', 
        route: 'kinshasa-goma', 
        progress: 0.7, 
        company: 'Kivu Transport',
        status: 'En route',
        eta: '3h 45min',
        passengers: 38
      },
      { 
        id: 'bus3', 
        route: 'lubumbashi-bukavu', 
        progress: 0.1, 
        company: 'Katanga Express',
        status: 'Départ imminent',
        eta: '8h 15min',
        passengers: 28
      }
    ];

    setAnimatingBuses(buses);

    const interval = setInterval(() => {
      setAnimatingBuses(prev => 
        prev.map(bus => ({
          ...bus,
          progress: (bus.progress + 0.01) % 1
        }))
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const getRouteByCity = (cityId: string) => {
    return routes.filter(route => route.from === cityId || route.to === cityId);
  };

  const getTrafficColor = (traffic: string) => {
    switch (traffic) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getBusPosition = (routeId: string, progress: number) => {
    const route = routes.find(r => r.id === routeId);
    if (!route) return { x: 0, y: 0 };

    const fromCity = cities[route.from as keyof typeof cities];
    const toCity = cities[route.to as keyof typeof cities];
    
    return {
      x: fromCity.x + (toCity.x - fromCity.x) * progress,
      y: fromCity.y + (toCity.y - fromCity.y) * progress
    };
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'relative'}`}>
      <Card className={`${isFullscreen ? 'h-full border-0 rounded-none' : 'h-[600px]'} overflow-hidden`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CardTitle className="flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-kongo-lime" />
                <span>Carte des trajets - RDC</span>
              </CardTitle>
              {selectedRoute && (
                <Badge className="bg-kongo-lime/10 text-kongo-black border-kongo-lime">
                  {cities[selectedRoute.from as keyof typeof cities]?.name} → {cities[selectedRoute.to as keyof typeof cities]?.name}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {showFilters && (
                <Select value={mapView} onValueChange={setMapView as any}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routes">Routes</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="stations">Stations</SelectItem>
                  </SelectContent>
                </Select>
              )}
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </motion.div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-full">
          <div className="relative h-full bg-gradient-to-br from-blue-50 to-green-50">
            {/* DRC Map SVG */}
            <svg
              viewBox="0 0 700 700"
              className="w-full h-full"
              style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)' }}
            >
              {/* DRC Country Border (Simplified) */}
              <path
                d="M100,200 Q150,150 200,180 Q300,160 400,200 Q500,180 580,220 Q620,250 640,300 Q650,400 620,500 Q580,580 500,600 Q400,620 300,600 Q200,580 150,550 Q100,500 80,400 Q90,300 100,200 Z"
                fill="#e6f3ff"
                stroke="#cbd5e1"
                strokeWidth="2"
                opacity="0.3"
              />

              {/* Rivers (Congo River system) */}
              <path
                d="M180,380 Q250,350 320,360 Q400,350 480,340 Q540,330 580,300"
                stroke="#3b82f6"
                strokeWidth="3"
                fill="none"
                opacity="0.4"
                strokeDasharray="5,5"
              />

              {/* Routes */}
              <AnimatePresence>
                {routes.map((route, index) => {
                  const isSelected = selectedRoute && 
                    (route.from === selectedRoute.from && route.to === selectedRoute.to) ||
                    (route.to === selectedRoute.from && route.from === selectedRoute.to);
                  
                  return (
                    <motion.g key={route.id}>
                      {/* Route Path */}
                      <motion.path
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ 
                          pathLength: 1, 
                          opacity: mapView === 'routes' || isSelected ? 0.8 : 0.3 
                        }}
                        transition={{ delay: index * 0.2, duration: 1.5 }}
                        d={route.path}
                        stroke={isSelected ? '#bfeb30' : getTrafficColor(route.traffic)}
                        strokeWidth={isSelected ? 4 : 3}
                        fill="none"
                        strokeLinecap="round"
                        style={{
                          filter: isSelected ? 'drop-shadow(0 0 8px rgba(191, 235, 48, 0.6))' : 'none'
                        }}
                      />
                      
                      {/* Traffic Flow Animation */}
                      {mapView === 'routes' && (
                        <motion.circle
                          r="3"
                          fill={getTrafficColor(route.traffic)}
                          opacity="0.7"
                        >
                          <animateMotion
                            dur="4s"
                            repeatCount="indefinite"
                            path={route.path}
                          />
                        </motion.circle>
                      )}
                    </motion.g>
                  );
                })}
              </AnimatePresence>

              {/* Live Buses */}
              {mapView === 'live' && (
                <AnimatePresence>
                  {animatingBuses.map((bus) => {
                    const position = getBusPosition(bus.route, bus.progress);
                    return (
                      <motion.g
                        key={bus.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <motion.circle
                          cx={position.x}
                          cy={position.y}
                          r="8"
                          fill="#bfeb30"
                          stroke="#101820"
                          strokeWidth="2"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [1, 0.7, 1]
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        
                        {/* Bus Icon */}
                        <text
                          x={position.x}
                          y={position.y + 2}
                          textAnchor="middle"
                          fontSize="8"
                          fill="#101820"
                        >
                          🚌
                        </text>
                      </motion.g>
                    );
                  })}
                </AnimatePresence>
              )}

              {/* Cities */}
              <AnimatePresence>
                {Object.entries(cities).map(([id, city], index) => {
                  const cityRoutes = getRouteByCity(id);
                  const isOriginOrDestination = selectedRoute && 
                    (id === selectedRoute.from || id === selectedRoute.to);
                  
                  return (
                    <motion.g
                      key={id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1, type: "spring", bounce: 0.4 }}
                      onHoverStart={() => setSelectedCity(id)}
                      onHoverEnd={() => setSelectedCity(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* City Circle */}
                      <motion.circle
                        cx={city.x}
                        cy={city.y}
                        r={isOriginOrDestination ? 12 : selectedCity === id ? 10 : 8}
                        fill={isOriginOrDestination ? '#bfeb30' : '#101820'}
                        stroke="#ffffff"
                        strokeWidth="3"
                        animate={{
                          scale: selectedCity === id ? 1.2 : 1,
                          r: isOriginOrDestination ? 12 : 8
                        }}
                        whileHover={{ scale: 1.3 }}
                        style={{
                          filter: isOriginOrDestination ? 'drop-shadow(0 0 12px rgba(191, 235, 48, 0.8))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                        }}
                      />
                      
                      {/* City Icon */}
                      <text
                        x={city.x}
                        y={city.y + 2}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#ffffff"
                      >
                        🏙️
                      </text>
                      
                      {/* City Label */}
                      <text
                        x={city.x}
                        y={city.y - 20}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill="#101820"
                        style={{ textShadow: '1px 1px 2px rgba(255,255,255,0.8)' }}
                      >
                        {city.name}
                      </text>
                      
                      {/* Route Count Badge */}
                      {cityRoutes.length > 0 && (
                        <circle
                          cx={city.x + 12}
                          cy={city.y - 12}
                          r="8"
                          fill="#ef4444"
                          stroke="#ffffff"
                          strokeWidth="2"
                        />
                      )}
                      
                      {cityRoutes.length > 0 && (
                        <text
                          x={city.x + 12}
                          y={city.y - 8}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="bold"
                          fill="#ffffff"
                        >
                          {cityRoutes.length}
                        </text>
                      )}
                    </motion.g>
                  );
                })}
              </AnimatePresence>

              {/* Legend */}
              <g transform="translate(20, 20)">
                <rect width="180" height="120" fill="rgba(255, 255, 255, 0.9)" rx="8" stroke="#e5e7eb" />
                <text x="10" y="20" fontSize="12" fontWeight="bold" fill="#101820">Légende</text>
                
                <circle cx="20" cy="35" r="4" fill="#ef4444" />
                <text x="30" y="39" fontSize="10" fill="#101820">Trafic élevé</text>
                
                <circle cx="20" cy="50" r="4" fill="#f59e0b" />
                <text x="30" y="54" fontSize="10" fill="#101820">Trafic moyen</text>
                
                <circle cx="20" cy="65" r="4" fill="#10b981" />
                <text x="30" y="69" fontSize="10" fill="#101820">Trafic faible</text>
                
                <circle cx="20" cy="80" r="6" fill="#bfeb30" stroke="#101820" strokeWidth="2" />
                <text x="35" y="85" fontSize="10" fill="#101820">Ville sélectionnée</text>
                
                {mapView === 'live' && (
                  <>
                    <circle cx="20" cy="95" r="4" fill="#bfeb30" />
                    <text x="30" y="99" fontSize="10" fill="#101820">Bus en temps réel</text>
                  </>
                )}
              </g>

              {/* Route Info Panel */}
              {selectedCity && (
                <AnimatePresence>
                  <motion.g
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <rect
                      x="500"
                      y="20"
                      width="180"
                      height="auto"
                      fill="rgba(255, 255, 255, 0.95)"
                      rx="8"
                      stroke="#e5e7eb"
                    />
                    
                    <text x="515" y="40" fontSize="14" fontWeight="bold" fill="#101820">
                      {cities[selectedCity as keyof typeof cities]?.name}
                    </text>
                    
                    <text x="515" y="55" fontSize="11" fill="#6b7280">
                      {cities[selectedCity as keyof typeof cities]?.region}
                    </text>
                    
                    <text x="515" y="70" fontSize="11" fill="#6b7280">
                      Pop: {cities[selectedCity as keyof typeof cities]?.population}
                    </text>
                    
                    <text x="515" y="90" fontSize="12" fontWeight="medium" fill="#101820">
                      Routes disponibles: {getRouteByCity(selectedCity).length}
                    </text>
                  </motion.g>
                </AnimatePresence>
              )}
            </svg>

            {/* Live Buses Info Panel */}
            {mapView === 'live' && (
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 border shadow-lg">
                  <h4 className="font-semibold mb-3 flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-kongo-lime" />
                    <span>Bus en temps réel</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      {animatingBuses.length} actifs
                    </Badge>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-32 overflow-y-auto">
                    {animatingBuses.map((bus) => {
                      const route = routes.find(r => r.id === bus.route);
                      if (!route) return null;
                      
                      return (
                        <motion.div
                          key={bus.id}
                          whileHover={{ scale: 1.02 }}
                          className="bg-gray-50 rounded p-3 text-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{bus.company}</span>
                            <Badge variant="secondary" className="text-xs">
                              {bus.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <div>Route: {cities[route.from as keyof typeof cities]?.name} → {cities[route.to as keyof typeof cities]?.name}</div>
                            <div>ETA: {bus.eta}</div>
                            <div>Passagers: {bus.passengers}/50</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
