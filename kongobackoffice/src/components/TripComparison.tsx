import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, Clock, Users, Wifi, Coffee, ChargingStation, 
  Shield, Star, Check, X, Plus, Minus, ArrowRight,
  TrendingUp, Award, AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";

interface TripOption {
  id: string;
  company: string;
  companyRating: number;
  route: {
    from: string;
    to: string;
    departure: string;
    arrival: string;
    duration: string;
  };
  price: {
    base: number;
    discounted?: number;
    currency: string;
  };
  amenities: {
    wifi: boolean;
    meals: boolean;
    ac: boolean;
    charging: boolean;
    entertainment: boolean;
    insurance: boolean;
    luggage: string;
  };
  comfort: {
    seatType: string;
    legRoom: string;
    recline: boolean;
  };
  availability: {
    seats: number;
    waitlist: number;
  };
  cancellation: {
    free: boolean;
    deadline: string;
    fee?: number;
  };
  highlights: string[];
  warnings?: string[];
  ecoScore: number;
  popularity: number;
}

interface TripComparisonProps {
  trips: TripOption[];
  onTripSelect: (trip: TripOption) => void;
  onAddToComparison: () => void;
  className?: string;
}

export function TripComparison({
  trips,
  onTripSelect,
  onAddToComparison,
  className = ""
}: TripComparisonProps) {
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState(false);
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'rating' | 'eco'>('price');

  // Fonction de tri
  const sortedTrips = [...trips].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return (a.price.discounted || a.price.base) - (b.price.discounted || b.price.base);
      case 'duration':
        return parseInt(a.route.duration) - parseInt(b.route.duration);
      case 'rating':
        return b.companyRating - a.companyRating;
      case 'eco':
        return b.ecoScore - a.ecoScore;
      default:
        return 0;
    }
  });

  const getAmenityIcon = (amenity: keyof TripOption['amenities']) => {
    switch (amenity) {
      case 'wifi':
        return <Wifi className="w-4 h-4" />;
      case 'meals':
        return <Coffee className="w-4 h-4" />;
      case 'charging':
        return <ChargingStation className="w-4 h-4" />;
      case 'insurance':
        return <Shield className="w-4 h-4" />;
      default:
        return <Check className="w-4 h-4" />;
    }
  };

  const getBestValueTrip = () => {
    return trips.reduce((best, current) => {
      const bestPrice = best.price.discounted || best.price.base;
      const currentPrice = current.price.discounted || current.price.base;
      const bestValue = (best.companyRating * 20) / bestPrice;
      const currentValue = (current.companyRating * 20) / currentPrice;
      return currentValue > bestValue ? current : best;
    });
  };

  const bestValue = getBestValueTrip();

  if (trips.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 bg-surface-kongo-lime-light rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-kongo-lime-dark" />
        </div>
        <h3 className="text-h4 text-primary font-semibold mb-2">
          Aucun trajet à comparer
        </h3>
        <p className="text-body text-secondary mb-6">
          Ajoutez des trajets pour commencer la comparaison.
        </p>
        <Button onClick={onAddToComparison} className="btn-secondary">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter des trajets
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec contrôles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-h2 text-kongo-black font-bold">
              Comparaison des Trajets
            </h2>
            <p className="text-body text-secondary">
              Comparez {trips.length} options côte à côte
            </p>
          </div>
          
          <Button onClick={onAddToComparison} variant="outline" className="btn-outline-lime">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un trajet
          </Button>
        </div>

        {/* Contrôles de tri et vue */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-label text-secondary">Trier par :</span>
            <div className="flex space-x-2">
              {([
                { key: 'price', label: 'Prix' },
                { key: 'duration', label: 'Durée' },
                { key: 'rating', label: 'Note' },
                { key: 'eco', label: 'Écologique' }
              ] as const).map(({ key, label }) => (
                <Button
                  key={key}
                  variant={sortBy === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy(key)}
                  className={sortBy === key ? 'btn-secondary' : 'btn-ghost'}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-body-small text-secondary">Détails avancés</span>
            <Switch
              checked={showAllFeatures}
              onCheckedChange={setShowAllFeatures}
            />
          </div>
        </div>
      </div>

      {/* Grille de comparaison */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {sortedTrips.map((trip, index) => {
            const isSelected = selectedTrip === trip.id;
            const isBestValue = trip.id === bestValue.id;
            const discountAmount = trip.price.base - (trip.price.discounted || trip.price.base);
            
            return (
              <motion.div
                key={trip.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`
                  card-interactive bg-surface-elevated transition-all duration-300 relative
                  ${isSelected ? 'ring-2 ring-kongo-lime border-kongo-lime' : 'hover:border-kongo-lime'}
                  ${isBestValue ? 'bg-surface-kongo-lime-light' : ''}
                `}>
                  {/* Badge "Meilleur rapport qualité-prix" */}
                  {isBestValue && (
                    <div className="absolute -top-3 left-4 z-10">
                      <Badge className="status-kongo">
                        <Award className="w-3 h-3 mr-1" />
                        Meilleur rapport
                      </Badge>
                    </div>
                  )}

                  {/* Badge de remise */}
                  {trip.price.discounted && (
                    <div className="absolute -top-3 right-4 z-10">
                      <Badge className="status-success">
                        -{((discountAmount / trip.price.base) * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-h5 text-primary font-semibold">
                            {trip.company}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-kongo-lime-dark fill-current" />
                            <span className="text-body-small text-secondary">
                              {trip.companyRating}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <Badge variant="outline" className="text-xs">
                            {trip.comfort.seatType}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${trip.ecoScore > 7 ? 'status-success' : 'status-warning'}`}
                          >
                            Éco {trip.ecoScore}/10
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4 text-kongo-lime-dark" />
                          <span className="text-body-small text-tertiary">
                            {trip.popularity}% populaire
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Horaires et durée */}
                    <div className="bg-surface-secondary rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-label-small text-tertiary">DÉPART</div>
                          <div className="text-h5 text-primary font-semibold">
                            {trip.route.departure}
                          </div>
                          <div className="text-body-small text-secondary">
                            {trip.route.from}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-center space-y-1">
                          <ArrowRight className="w-4 h-4 text-kongo-lime-dark" />
                          <div className="flex items-center space-x-1 text-tertiary">
                            <Clock className="w-3 h-3" />
                            <span className="text-body-xs">{trip.route.duration}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1 text-right">
                          <div className="text-label-small text-tertiary">ARRIVÉE</div>
                          <div className="text-h5 text-primary font-semibold">
                            {trip.route.arrival}
                          </div>
                          <div className="text-body-small text-secondary">
                            {trip.route.to}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Prix */}
                    <div className="space-y-2">
                      <div className="flex items-end justify-between">
                        <div>
                          {trip.price.discounted ? (
                            <div className="space-y-1">
                              <div className="text-body-small text-tertiary line-through">
                                {trip.price.base.toLocaleString('fr-FR')} CDF
                              </div>
                              <div className="text-h3 text-kongo-black font-bold">
                                {trip.price.discounted.toLocaleString('fr-FR')} CDF
                              </div>
                            </div>
                          ) : (
                            <div className="text-h3 text-kongo-black font-bold">
                              {trip.price.base.toLocaleString('fr-FR')} CDF
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right space-y-1">
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-kongo-lime-dark" />
                            <span className="text-body-small text-secondary">
                              {trip.availability.seats} places
                            </span>
                          </div>
                          {trip.availability.waitlist > 0 && (
                            <div className="text-body-xs text-warning">
                              {trip.availability.waitlist} en attente
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Équipements principaux */}
                    <div className="space-y-2">
                      <div className="text-label-small text-tertiary">ÉQUIPEMENTS</div>
                      <div className="grid grid-cols-4 gap-2">
                        {Object.entries(trip.amenities)
                          .filter(([key, value]) => typeof value === 'boolean' && value)
                          .slice(0, 4)
                          .map(([key]) => (
                            <div
                              key={key}
                              className="flex flex-col items-center space-y-1 p-2 bg-surface-kongo-lime-light rounded-lg"
                            >
                              {getAmenityIcon(key as keyof TripOption['amenities'])}
                              <span className="text-xs text-kongo-lime-dark font-medium capitalize">
                                {key === 'wifi' ? 'WiFi' : 
                                 key === 'meals' ? 'Repas' :
                                 key === 'charging' ? 'USB' :
                                 key === 'insurance' ? 'Assurance' : key}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Détails avancés (conditionnel) */}
                    <AnimatePresence>
                      {showAllFeatures && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4"
                        >
                          <Separator />
                          
                          {/* Confort */}
                          <div className="space-y-2">
                            <div className="text-label-small text-tertiary">CONFORT</div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-body-small">
                                <span className="text-secondary">Espace jambes :</span>
                                <span className="text-primary">{trip.comfort.legRoom}</span>
                              </div>
                              <div className="flex justify-between text-body-small">
                                <span className="text-secondary">Inclinable :</span>
                                <span className="text-primary">
                                  {trip.comfort.recline ? 'Oui' : 'Non'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Annulation */}
                          <div className="space-y-2">
                            <div className="text-label-small text-tertiary">ANNULATION</div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-body-small">
                                <span className="text-secondary">Gratuite jusqu'au :</span>
                                <span className="text-primary">{trip.cancellation.deadline}</span>
                              </div>
                              {trip.cancellation.fee && (
                                <div className="flex justify-between text-body-small">
                                  <span className="text-secondary">Frais après :</span>
                                  <span className="text-warning">
                                    {trip.cancellation.fee.toLocaleString('fr-FR')} CDF
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Points forts */}
                    {trip.highlights.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-label-small text-tertiary">POINTS FORTS</div>
                        <div className="space-y-1">
                          {trip.highlights.slice(0, 2).map((highlight, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                              <span className="text-body-small text-secondary">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Avertissements */}
                    {trip.warnings && trip.warnings.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-label-small text-warning">ATTENTION</div>
                        <div className="space-y-1">
                          {trip.warnings.slice(0, 1).map((warning, index) => (
                            <div key={index} className="flex items-start space-x-2">
                              <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                              <span className="text-body-small text-warning">{warning}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => {
                          setSelectedTrip(trip.id);
                          onTripSelect(trip);
                        }}
                        className={`
                          w-full transition-all duration-200
                          ${isSelected ? 'btn-secondary' : 'btn-primary'}
                        `}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Sélectionné
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Sélectionner
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full btn-ghost text-kongo-lime-dark hover:bg-surface-kongo-lime-light"
                      >
                        Voir plus de détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Résumé de la comparaison */}
      {selectedTrip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-kongo-lime-light border border-kongo-lime rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-h5 text-kongo-black font-semibold">
                Trajet sélectionné
              </h3>
              <p className="text-body text-kongo-lime-dark">
                {trips.find(t => t.id === selectedTrip)?.company} - {' '}
                {trips.find(t => t.id === selectedTrip)?.route.from} → {' '}
                {trips.find(t => t.id === selectedTrip)?.route.to}
              </p>
            </div>
            
            <Button
              onClick={() => {
                const trip = trips.find(t => t.id === selectedTrip);
                if (trip) onTripSelect(trip);
              }}
              className="btn-primary"
            >
              Continuer la réservation
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
