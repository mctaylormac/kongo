import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  Users, 
  Bus, 
  MapPin, 
  Clock, 
  TrendingUp, 
  Star,
  Shield,
  Zap,
  Globe,
  Award
} from "lucide-react";

interface PlatformStatsProps {
  className?: string;
}

export function PlatformStats({ className = "" }: PlatformStatsProps) {
  const [stats, setStats] = useState({
    activeUsers: 12847,
    totalTrips: 256891,
    activeRoutes: 147,
    onTimePerformance: 94.2,
    customerSatisfaction: 4.8,
    partnerAgencies: 89,
    citiesCovered: 23,
    avgBookingTime: 2.3,
    securityScore: 99.1,
    platformUptime: 99.97
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simuler le chargement des données en temps réel
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    // Mise à jour périodique des statistiques
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeUsers: prev.activeUsers + Math.floor(Math.random() * 10 - 5),
        totalTrips: prev.totalTrips + Math.floor(Math.random() * 3),
        onTimePerformance: Math.min(100, prev.onTimePerformance + (Math.random() - 0.5) * 0.1)
      }));
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const statItems = [
    {
      title: "Utilisateurs Actifs",
      value: stats.activeUsers.toLocaleString(),
      icon: Users,
      trend: "+5.2%",
      color: "kongo-lime",
      description: "Dernières 24h",
      gradient: true
    },
    {
      title: "Trajets Effectués",
      value: stats.totalTrips.toLocaleString(),
      icon: Bus,
      trend: "+12.8%",
      color: "success",
      description: "Total historique",
      progress: 78
    },
    {
      title: "Routes Actives",
      value: stats.activeRoutes.toString(),
      icon: MapPin,
      trend: "+3.1%",
      color: "info",
      description: "Inter-provinciales",
      highlight: "Nouveau: Mbuji-Mayi"
    },
    {
      title: "Ponctualité",
      value: `${stats.onTimePerformance.toFixed(1)}%`,
      icon: Clock,
      trend: "stable",
      color: "success",
      description: "Performance moyenne",
      progress: stats.onTimePerformance
    },
    {
      title: "Satisfaction Client",
      value: `${stats.customerSatisfaction}/5`,
      icon: Star,
      trend: "+0.2",
      color: "warning",
      description: "Note moyenne",
      rating: true
    },
    {
      title: "Agences Partenaires",
      value: stats.partnerAgencies.toString(),
      icon: Globe,
      trend: "+7 ce mois",
      color: "kongo-black",
      description: "Réseau étendu",
      network: true
    },
    {
      title: "Villes Desservies",
      value: stats.citiesCovered.toString(),
      icon: MapPin,
      trend: "+2 nouvelles",
      color: "info",
      description: "Couverture nationale",
      coverage: 68
    },
    {
      title: "Temps de Réservation",
      value: `${stats.avgBookingTime}min`,
      icon: Zap,
      trend: "-15%",
      color: "success",
      description: "Moyenne optimisée",
      speed: true
    },
    {
      title: "Score Sécurité",
      value: `${stats.securityScore}%`,
      icon: Shield,
      trend: "excellent",
      color: "success",
      description: "Conformité SSL",
      security: true
    },
    {
      title: "Disponibilité",
      value: `${stats.platformUptime}%`,
      icon: Award,
      trend: "uptime",
      color: "kongo-lime",
      description: "Plateforme stable",
      uptime: true
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'kongo-lime':
        return {
          bg: 'bg-surface-kongo-lime-light',
          text: 'text-kongo-lime-dark',
          icon: 'text-kongo-lime',
          border: 'border-kongo-lime/20'
        };
      case 'kongo-black':
        return {
          bg: 'bg-kongo-black/5',
          text: 'text-kongo-black',
          icon: 'text-kongo-black',
          border: 'border-kongo-black/20'
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          icon: 'text-green-600',
          border: 'border-green-200'
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          icon: 'text-orange-600',
          border: 'border-orange-200'
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          icon: 'text-blue-600',
          border: 'border-blue-200'
        };
      default:
        return {
          bg: 'bg-surface-tertiary',
          text: 'text-secondary',
          icon: 'text-tertiary',
          border: 'border-primary'
        };
    }
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 ${className}`}>
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 bg-surface-tertiary rounded-lg"></div>
                <div className="w-16 h-4 bg-surface-tertiary rounded"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-20 h-8 bg-surface-tertiary rounded mb-2"></div>
              <div className="w-full h-3 bg-surface-tertiary rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête des statistiques */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h3 text-primary font-bold">Tableau de Bord KonGO</h2>
          <p className="text-body-small text-secondary">
            Statistiques en temps réel • Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <Badge className="status-kongo">
          <div className="w-2 h-2 bg-kongo-lime rounded-full mr-2 animate-pulse"></div>
          Données Live
        </Badge>
      </div>

      {/* Grille des métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {statItems.map((stat, index) => {
          const colors = getColorClasses(stat.color);
          const Icon = stat.icon;

          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card className={`card-interactive hover:${colors.border} group relative overflow-hidden`}>
                {/* Gradient de fond pour certaines cartes */}
                {stat.gradient && (
                  <div className="absolute inset-0 bg-gradient-to-br from-kongo-lime/5 via-transparent to-kongo-black/5"></div>
                )}
                
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${colors.bg} group-hover:scale-110 transition-transform duration-200`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    {stat.trend && (
                      <Badge variant="outline" className="text-xs">
                        {stat.trend.includes('+') || stat.trend.includes('-') ? (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        ) : null}
                        {stat.trend}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-label-small text-quaternary uppercase tracking-wide">
                    {stat.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="relative z-10">
                  <div className="space-y-3">
                    {/* Valeur principale */}
                    <div className="flex items-baseline space-x-2">
                      <span className={`text-h4 font-bold ${colors.text}`}>
                        {stat.value}
                      </span>
                      {stat.rating && (
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(stats.customerSatisfaction)
                                  ? 'text-orange-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Barre de progression */}
                    {stat.progress && (
                      <div className="space-y-1">
                        <Progress 
                          value={stat.progress} 
                          className="h-2"
                          style={{
                            backgroundColor: colors.bg
                          }}
                        />
                        <p className="text-body-xs text-quaternary">
                          {stat.progress.toFixed(0)}% de l'objectif
                        </p>
                      </div>
                    )}

                    {/* Description et indicateurs spéciaux */}
                    <div className="flex items-center justify-between">
                      <p className="text-body-small text-tertiary">
                        {stat.description}
                      </p>
                      
                      {/* Indicateurs spéciaux */}
                      {stat.highlight && (
                        <Badge className="status-info text-xs">
                          Nouveau
                        </Badge>
                      )}
                      
                      {stat.network && (
                        <div className="flex -space-x-1">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-4 h-4 bg-kongo-lime rounded-full border-2 border-white"
                            />
                          ))}
                          <div className="w-4 h-4 bg-surface-tertiary rounded-full border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-tertiary font-medium">+</span>
                          </div>
                        </div>
                      )}
                      
                      {stat.speed && (
                        <div className="flex items-center space-x-1">
                          <Zap className="w-3 h-3 text-kongo-lime" />
                          <span className="text-body-xs text-kongo-lime font-medium">Rapide</span>
                        </div>
                      )}
                      
                      {stat.security && (
                        <div className="flex items-center space-x-1">
                          <Shield className="w-3 h-3 text-green-600" />
                          <span className="text-body-xs text-green-600 font-medium">Sécurisé</span>
                        </div>
                      )}
                      
                      {stat.uptime && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-kongo-lime rounded-full animate-pulse"></div>
                          <span className="text-body-xs text-kongo-lime font-medium">Online</span>
                        </div>
                      )}
                    </div>

                    {/* Couverture géographique */}
                    {stat.coverage && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-body-xs">
                          <span className="text-tertiary">Couverture RDC</span>
                          <span className={colors.text}>{stat.coverage}%</span>
                        </div>
                        <Progress value={stat.coverage} className="h-1" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Alertes et notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Alerte de performance */}
        <Card className="bg-surface-kongo-lime-light border-kongo-lime/20">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-kongo-lime/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-kongo-lime-dark" />
              </div>
              <div>
                <p className="text-label font-semibold text-kongo-lime-dark">
                  Performance Exceptionnelle
                </p>
                <p className="text-body-small text-kongo-lime-dark/80">
                  +15% de réservations ce mois
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nouvelle fonctionnalité */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-label font-semibold text-blue-700">
                  IA Prédictive Activée
                </p>
                <p className="text-body-small text-blue-600">
                  Optimisation automatique des trajets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance planifiée */}
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-label font-semibold text-orange-700">
                  Maintenance Programmée
                </p>
                <p className="text-body-small text-orange-600">
                  Dimanche 3h-5h (amélioration UX)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}