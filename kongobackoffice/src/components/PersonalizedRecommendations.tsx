import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MapPin, Clock, Star, TrendingUp, Users, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface Recommendation {
  id: string;
  type: 'popular' | 'personal' | 'seasonal' | 'trending';
  title: string;
  description: string;
  route: {
    from: string;
    to: string;
    duration: string;
    price: number;
  };
  confidence: number;
  reasons: string[];
  savings?: number;
  popularity?: number;
}

interface PersonalizedRecommendationsProps {
  userHistory: any[];
  favoriteRoutes: any[];
  onRecommendationClick: (recommendation: Recommendation) => void;
  className?: string;
}

export function PersonalizedRecommendations({
  userHistory = [],
  favoriteRoutes = [],
  onRecommendationClick,
  className = ""
}: PersonalizedRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'popular' | 'personal' | 'seasonal' | 'trending'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Simulation des recommandations intelligentes
  useEffect(() => {
    const generateRecommendations = () => {
      const sampleRecommendations: Recommendation[] = [
        {
          id: '1',
          type: 'personal',
          title: 'Votre trajet habituel Kinshasa → Lubumbashi',
          description: 'Basé sur vos 3 voyages précédents sur cette route',
          route: {
            from: 'Kinshasa',
            to: 'Lubumbashi',
            duration: '16h 30min',
            price: 125000
          },
          confidence: 95,
          reasons: ['Voyage fréquent', 'Même période de l\'année', 'Prix préférentiel'],
          savings: 15000
        },
        {
          id: '2',
          type: 'trending',
          title: 'Destination tendance : Goma',
          description: 'Route très demandée cette semaine (+40% de réservations)',
          route: {
            from: 'Kinshasa',
            to: 'Goma',
            duration: '12h 15min',
            price: 98000
          },
          confidence: 82,
          reasons: ['Tendance populaire', 'Tarif avantageux', 'Météo favorable'],
          popularity: 87
        },
        {
          id: '3',
          type: 'seasonal',
          title: 'Escapade de saison : Bukavu',
          description: 'Idéal pour cette période de l\'année, climat agréable',
          route: {
            from: 'Kinshasa',
            to: 'Bukavu',
            duration: '14h 45min',
            price: 110000
          },
          confidence: 75,
          reasons: ['Saison optimale', 'Expérience touristique', 'Prix stable']
        },
        {
          id: '4',
          type: 'popular',
          title: 'Le plus populaire : Mbuji-Mayi',
          description: 'Route #1 des voyages d\'affaires, excellent service',
          route: {
            from: 'Kinshasa',
            to: 'Mbuji-Mayi',
            duration: '10h 20min',
            price: 85000
          },
          confidence: 88,
          reasons: ['Route populaire', 'Service premium', 'Ponctualité excellente'],
          popularity: 92
        }
      ];

      setTimeout(() => {
        setRecommendations(sampleRecommendations);
        setIsLoading(false);
      }, 1200);
    };

    generateRecommendations();
  }, [userHistory, favoriteRoutes]);

  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'personal':
        return <Star className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'popular':
        return <Users className="w-4 h-4" />;
      case 'seasonal':
        return <Zap className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'personal':
        return 'status-kongo';
      case 'trending':
        return 'status-success';
      case 'popular':
        return 'status-info';
      case 'seasonal':
        return 'status-warning';
      default:
        return 'status-info';
    }
  };

  const getTypeLabel = (type: Recommendation['type']) => {
    switch (type) {
      case 'personal':
        return 'Personnel';
      case 'trending':
        return 'Tendance';
      case 'popular':
        return 'Populaire';
      case 'seasonal':
        return 'Saisonnier';
      default:
        return 'Recommandé';
    }
  };

  const filteredRecommendations = activeFilter === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.type === activeFilter);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 bg-surface-tertiary rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-surface-tertiary rounded w-96 animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-surface-elevated border-border-primary">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="h-4 bg-surface-tertiary rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-surface-tertiary rounded w-full animate-pulse"></div>
                  <div className="h-3 bg-surface-tertiary rounded w-2/3 animate-pulse"></div>
                  <div className="h-10 bg-surface-tertiary rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec filtres */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-h2 text-kongo-black font-bold">
            Recommandations Personnalisées
          </h2>
          <p className="text-body-large text-secondary">
            Découvrez des trajets sélectionnés spécialement pour vous
          </p>
        </div>
        
        {/* Filtres */}
        <div className="flex flex-wrap gap-2">
          {(['all', 'personal', 'trending', 'popular', 'seasonal'] as const).map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className={`
                ${activeFilter === filter 
                  ? 'btn-secondary text-kongo-black' 
                  : 'btn-outline-lime'
                }
              `}
            >
              {filter === 'all' && <MapPin className="w-4 h-4 mr-2" />}
              {filter === 'personal' && <Star className="w-4 h-4 mr-2" />}
              {filter === 'trending' && <TrendingUp className="w-4 h-4 mr-2" />}
              {filter === 'popular' && <Users className="w-4 h-4 mr-2" />}
              {filter === 'seasonal' && <Zap className="w-4 h-4 mr-2" />}
              {filter === 'all' ? 'Toutes' : getTypeLabel(filter)}
              {filter === 'all' && ` (${recommendations.length})`}
            </Button>
          ))}
        </div>
      </div>

      {/* Liste des recommandations */}
      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {filteredRecommendations.map((recommendation) => (
            <motion.div
              key={recommendation.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="card-interactive bg-surface-elevated hover:border-kongo-lime group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge className={getTypeColor(recommendation.type)}>
                      {getTypeIcon(recommendation.type)}
                      <span className="ml-1">{getTypeLabel(recommendation.type)}</span>
                    </Badge>
                    
                    <div className="text-right">
                      <div className="text-body-small text-tertiary">
                        Pertinence
                      </div>
                      <div className="text-label text-kongo-lime-dark font-semibold">
                        {recommendation.confidence}%
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Titre et description */}
                  <div className="space-y-2">
                    <h3 className="text-h5 text-primary font-semibold group-hover:text-kongo-black transition-colors">
                      {recommendation.title}
                    </h3>
                    <p className="text-body-small text-secondary">
                      {recommendation.description}
                    </p>
                  </div>

                  {/* Détails du trajet */}
                  <div className="bg-surface-secondary rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-primary">
                        <MapPin className="w-4 h-4 text-kongo-lime-dark" />
                        <span className="text-label font-medium">
                          {recommendation.route.from} → {recommendation.route.to}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-tertiary">
                        <Clock className="w-4 h-4" />
                        <span className="text-body-small">
                          {recommendation.route.duration}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-h4 text-kongo-black font-bold">
                        {recommendation.route.price.toLocaleString('fr-FR')} CDF
                      </div>
                      {recommendation.savings && (
                        <div className="text-success text-body-small font-medium">
                          Économie : {recommendation.savings.toLocaleString('fr-FR')} CDF
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Raisons */}
                  <div className="space-y-2">
                    <div className="text-label-small text-tertiary">
                      Pourquoi cette recommandation ?
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recommendation.reasons.map((reason, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-surface-kongo-lime-light text-kongo-lime-dark text-xs"
                        >
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Métriques additionnelles */}
                  {recommendation.popularity && (
                    <div className="flex items-center justify-between text-body-small text-tertiary">
                      <span>Popularité cette semaine :</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-surface-tertiary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-kongo-lime transition-all duration-500"
                            style={{ width: `${recommendation.popularity}%` }}
                          />
                        </div>
                        <span className="text-kongo-lime-dark font-medium">
                          {recommendation.popularity}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action */}
                  <Button
                    onClick={() => onRecommendationClick(recommendation)}
                    className="btn-primary w-full group-hover:bg-kongo-black-hover"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Voir les détails
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-surface-kongo-lime-light rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-kongo-lime-dark" />
          </div>
          <h3 className="text-h4 text-primary font-semibold mb-2">
            Aucune recommandation trouvée
          </h3>
          <p className="text-body text-secondary">
            Effectuez quelques voyages pour recevoir des suggestions personnalisées.
          </p>
        </div>
      )}
    </div>
  );
}
