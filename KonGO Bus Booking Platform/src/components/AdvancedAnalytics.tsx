import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  MapPin,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Zap,
  Eye,
  Filter,
  Download,
  Share2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Star,
  Heart,
  MessageSquare,
  ShoppingCart,
  CreditCard,
  Percent,
  ThumbsUp,
  Award,
  Flag,
  Navigation,
  Route,
  Bus,
  Timer,
  Coins,
  Gauge,
  Signal,
  Wifi,
  Database,
  Server,
  Cloud,
  Shield,
  Lock,
  Unlock,
  Info,
  AlertCircle
} from "lucide-react";

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalTrips: number;
    revenue: number;
    growthRate: number;
    satisfaction: number;
  };
  realTime: {
    onlineUsers: number;
    activeBookings: number;
    serverLoad: number;
    responseTime: number;
    errorRate: number;
    networkStatus: 'excellent' | 'good' | 'fair' | 'poor';
  };
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
    labels: string[];
  };
  demographics: {
    ageGroups: { label: string; value: number; color: string }[];
    locations: { city: string; users: number; percentage: number }[];
    devices: { type: string; count: number; percentage: number }[];
  };
  performance: {
    routes: { route: string; bookings: number; revenue: number; satisfaction: number }[];
    agencies: { name: string; trips: number; rating: number; growth: number }[];
    timeSlots: { time: string; bookings: number; efficiency: number }[];
  };
  userBehavior: {
    sessionDuration: number;
    bounceRate: number;
    conversionRate: number;
    repeatCustomers: number;
    averageBookingValue: number;
    searchToBookRatio: number;
  };
  forecasts: {
    nextMonth: { bookings: number; revenue: number; confidence: number };
    nextQuarter: { bookings: number; revenue: number; confidence: number };
    seasonalTrends: { season: string; growth: number; confidence: number }[];
  };
}

interface AdvancedAnalyticsProps {
  className?: string;
  onExport?: (data: any) => void;
  onShare?: (insights: string[]) => void;
}

export function AdvancedAnalytics({ 
  className = "", 
  onExport,
  onShare 
}: AdvancedAnalyticsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    overview: {
      totalUsers: 45672,
      activeUsers: 12847,
      totalTrips: 256891,
      revenue: 18420000, // CDF
      growthRate: 12.8,
      satisfaction: 4.7
    },
    realTime: {
      onlineUsers: 1247,
      activeBookings: 89,
      serverLoad: 67,
      responseTime: 245, // ms
      errorRate: 0.12,
      networkStatus: 'excellent'
    },
    trends: {
      daily: [120, 132, 101, 134, 90, 230, 210, 189, 234, 156, 178, 198, 234, 156],
      weekly: [1200, 1350, 1100, 1580, 1200, 1680, 1450],
      monthly: [8900, 9200, 8500, 9800, 10200, 11500, 10800, 12100, 11900, 12800, 13200, 13800],
      labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
    },
    demographics: {
      ageGroups: [
        { label: '18-25', value: 25, color: 'bg-blue-500' },
        { label: '26-35', value: 35, color: 'bg-kongo-lime' },
        { label: '36-45', value: 22, color: 'bg-purple-500' },
        { label: '46-55', value: 12, color: 'bg-orange-500' },
        { label: '55+', value: 6, color: 'bg-gray-500' }
      ],
      locations: [
        { city: 'Kinshasa', users: 18500, percentage: 42.3 },
        { city: 'Lubumbashi', users: 12800, percentage: 29.2 },
        { city: 'Goma', users: 6200, percentage: 14.1 },
        { city: 'Kisangani', users: 4100, percentage: 9.4 },
        { city: 'Autres', users: 2072, percentage: 5.0 }
      ],
      devices: [
        { type: 'Mobile', count: 32450, percentage: 71.2 },
        { type: 'Desktop', count: 10200, percentage: 22.4 },
        { type: 'Tablet', count: 2920, percentage: 6.4 }
      ]
    },
    performance: {
      routes: [
        { route: 'Kinshasa → Lubumbashi', bookings: 15620, revenue: 3900000, satisfaction: 4.8 },
        { route: 'Kinshasa → Goma', bookings: 12400, revenue: 2480000, satisfaction: 4.6 },
        { route: 'Lubumbashi → Kisangani', bookings: 8900, revenue: 1780000, satisfaction: 4.7 },
        { route: 'Goma → Bukavu', bookings: 6700, revenue: 1005000, satisfaction: 4.5 },
        { route: 'Kinshasa → Matadi', bookings: 5400, revenue: 810000, satisfaction: 4.4 }
      ],
      agencies: [
        { name: 'Trans-Congo Express', trips: 4200, rating: 4.8, growth: 15.2 },
        { name: 'Kivu Transport', trips: 3800, rating: 4.6, growth: 12.8 },
        { name: 'Express Kasai', trips: 3200, rating: 4.5, growth: 8.9 },
        { name: 'Voyageur Moderne', trips: 2900, rating: 4.7, growth: 18.5 },
        { name: 'Congo Bus Line', trips: 2600, rating: 4.4, growth: 6.2 }
      ],
      timeSlots: [
        { time: '06:00-09:00', bookings: 8900, efficiency: 92 },
        { time: '09:00-12:00', bookings: 6700, efficiency: 88 },
        { time: '12:00-15:00', bookings: 4200, efficiency: 85 },
        { time: '15:00-18:00', bookings: 7800, efficiency: 90 },
        { time: '18:00-21:00', bookings: 5400, efficiency: 87 },
        { time: '21:00-06:00', bookings: 2100, efficiency: 95 }
      ]
    },
    userBehavior: {
      sessionDuration: 8.4, // minutes
      bounceRate: 23.5, // percentage
      conversionRate: 12.8, // percentage
      repeatCustomers: 67.2, // percentage
      averageBookingValue: 85000, // CDF
      searchToBookRatio: 4.2 // searches per booking
    },
    forecasts: {
      nextMonth: { bookings: 14500, revenue: 3625000, confidence: 87 },
      nextQuarter: { bookings: 42000, revenue: 10500000, confidence: 78 },
      seasonalTrends: [
        { season: 'Saison sèche', growth: 18.5, confidence: 85 },
        { season: 'Saison des pluies', growth: -8.2, confidence: 82 },
        { season: 'Fin d\'année', growth: 35.7, confidence: 92 }
      ]
    }
  });

  // Auto-refresh des données
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // Simuler des changements mineurs dans les données temps réel
      setAnalyticsData(prev => ({
        ...prev,
        realTime: {
          ...prev.realTime,
          onlineUsers: prev.realTime.onlineUsers + Math.floor(Math.random() * 20 - 10),
          activeBookings: Math.max(0, prev.realTime.activeBookings + Math.floor(Math.random() * 6 - 3)),
          serverLoad: Math.max(0, Math.min(100, prev.realTime.serverLoad + Math.floor(Math.random() * 6 - 3))),
          responseTime: Math.max(100, prev.realTime.responseTime + Math.floor(Math.random() * 20 - 10))
        }
      }));
    }, 30000); // Mise à jour toutes les 30 secondes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const refreshData = async () => {
    setIsLoading(true);
    // Simuler une requête API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLastUpdated(new Date());
    setIsLoading(false);
    toast.success("Données actualisées", {
      description: "Toutes les métriques ont été mises à jour"
    });
  };

  const exportData = () => {
    const dataToExport = {
      exportDate: new Date().toISOString(),
      timeRange,
      data: analyticsData
    };
    
    onExport?.(dataToExport);
    
    // Create and download JSON file
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `kongo-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success("📊 Données exportées", {
      description: "Fichier téléchargé avec succès"
    });
  };

  const shareInsights = () => {
    const insights = [
      `Croissance de ${analyticsData.overview.growthRate}% sur la période`,
      `${analyticsData.realTime.onlineUsers} utilisateurs actifs en temps réel`,
      `Taux de satisfaction de ${analyticsData.overview.satisfaction}/5`,
      `Route la plus populaire: ${analyticsData.performance.routes[0].route}`
    ];
    
    onShare?.(insights);
    
    const shareText = `📈 KonGO Analytics:\n${insights.join('\n')}\n\n#KonGO #Analytics #Transport`;
    
    if (navigator.share) {
      navigator.share({
        title: 'KonGO Analytics Insights',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("📋 Insights copiés", {
        description: "Partagez ces données avec votre équipe"
      });
    }
  };

  const getNetworkStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-orange-600 bg-orange-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const formatCurrency = (amount: number) => {
    return `${(amount / 1000).toFixed(0)}k CDF`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header avec contrôles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-4 lg:space-y-0"
      >
        <div>
          <h1 className="text-h2 font-bold text-primary">Analytiques Avancées</h1>
          <p className="text-body text-secondary">
            Données en temps réel • Dernière mise à jour : {lastUpdated.toLocaleTimeString('fr-FR')}
          </p>
        </div>

        {/* Contrôles */}
        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">24h</SelectItem>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">3 mois</SelectItem>
              <SelectItem value="365d">1 an</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outline"
            size="sm"
            className={autoRefresh ? 'btn-outline-lime' : 'btn-ghost'}
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-refresh
          </Button>

          <Button
            onClick={refreshData}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="btn-ghost"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>

          <Button
            onClick={exportData}
            variant="outline"
            size="sm"
            className="btn-ghost"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>

          <Button
            onClick={shareInsights}
            size="sm"
            className="btn-secondary"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Partager
          </Button>
        </div>
      </motion.div>

      {/* Métriques temps réel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-kongo-black to-kongo-black-light p-6 rounded-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-kongo-lime rounded-lg">
              <Activity className="w-6 h-6 text-kongo-black" />
            </div>
            <div>
              <h2 className="text-h4 font-bold text-on-black">État du Système</h2>
              <p className="text-body-small text-on-black opacity-80">Temps réel</p>
            </div>
          </div>
          
          <Badge className={`${getNetworkStatusColor(analyticsData.realTime.networkStatus)} border-0`}>
            <Signal className="w-3 h-3 mr-1" />
            {analyticsData.realTime.networkStatus}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
            <div className="text-h4 text-on-black font-bold">
              {analyticsData.realTime.onlineUsers.toLocaleString()}
            </div>
            <div className="text-body-small text-on-black opacity-80">En ligne</div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 text-center">
            <ShoppingCart className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
            <div className="text-h4 text-on-black font-bold">
              {analyticsData.realTime.activeBookings}
            </div>
            <div className="text-body-small text-on-black opacity-80">Réservations</div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 text-center">
            <Server className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
            <div className="text-h4 text-on-black font-bold">
              {analyticsData.realTime.serverLoad}%
            </div>
            <div className="text-body-small text-on-black opacity-80">Charge serveur</div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 text-center">
            <Timer className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
            <div className="text-h4 text-on-black font-bold">
              {analyticsData.realTime.responseTime}ms
            </div>
            <div className="text-body-small text-on-black opacity-80">Temps réponse</div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 text-center">
            <AlertTriangle className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
            <div className="text-h4 text-on-black font-bold">
              {analyticsData.realTime.errorRate}%
            </div>
            <div className="text-body-small text-on-black opacity-80">Taux d'erreur</div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 text-center">
            <Shield className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
            <div className="text-h4 text-on-black font-bold">99.9%</div>
            <div className="text-body-small text-on-black opacity-80">Disponibilité</div>
          </div>
        </div>
      </motion.div>

      {/* Navigation par onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 bg-surface-secondary">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Utilisateurs</span>
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Comportement</span>
          </TabsTrigger>
          <TabsTrigger value="forecasts" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Prévisions</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Alertes</span>
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs principaux */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-kongo-black" />
                    <span>Utilisateurs Total</span>
                  </div>
                  {getTrendIcon(analyticsData.overview.growthRate)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-h2 font-bold text-kongo-black">
                    {analyticsData.overview.totalUsers.toLocaleString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-body-small text-secondary">Actifs:</span>
                    <Badge className="status-success">
                      {analyticsData.overview.activeUsers.toLocaleString()}
                    </Badge>
                  </div>
                  <div className="text-body-small text-success">
                    +{formatPercentage(analyticsData.overview.growthRate)} ce mois
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bus className="w-5 h-5 text-kongo-black" />
                    <span>Voyages Total</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-h2 font-bold text-kongo-black">
                    {analyticsData.overview.totalTrips.toLocaleString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-body-small text-secondary">Ce mois:</span>
                    <Badge className="status-info">
                      {(analyticsData.overview.totalTrips * 0.08).toFixed(0)}
                    </Badge>
                  </div>
                  <div className="text-body-small text-success">
                    +15.2% vs mois dernier
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-kongo-black" />
                    <span>Revenus</span>
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-h2 font-bold text-kongo-black">
                    {formatCurrency(analyticsData.overview.revenue)}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-body-small text-secondary">Mensuel:</span>
                    <Badge className="status-kongo">
                      {formatCurrency(analyticsData.overview.revenue * 0.085)}
                    </Badge>
                  </div>
                  <div className="text-body-small text-success">
                    +{formatPercentage(analyticsData.overview.growthRate)} ce mois
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tendances et satisfaction */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="w-5 h-5 text-kongo-black" />
                  <span>Tendances ({timeRange})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-border-secondary rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-quaternary mx-auto mb-2" />
                    <p className="text-body text-secondary">Graphique des tendances</p>
                    <p className="text-body-small text-quaternary">
                      {analyticsData.trends.daily.length} points de données
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-kongo-black" />
                  <span>Satisfaction Client</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-h1 font-bold text-kongo-black mb-2">
                    {analyticsData.overview.satisfaction}/5
                  </div>
                  <div className="flex justify-center space-x-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-6 h-6 ${
                          i < Math.floor(analyticsData.overview.satisfaction)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <Progress 
                    value={(analyticsData.overview.satisfaction / 5) * 100} 
                    className="h-3"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-body-small">Très satisfait</span>
                    <span className="text-body-small font-semibold">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-small">Satisfait</span>
                    <span className="text-body-small font-semibold">23%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-small">Neutre</span>
                    <span className="text-body-small font-semibold">7%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-small">Insatisfait</span>
                    <span className="text-body-small font-semibold">2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Routes */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Route className="w-5 h-5 text-kongo-black" />
                  <span>Routes les Plus Populaires</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.performance.routes.map((route, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-kongo-lime/20 text-kongo-lime-dark rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-label font-medium">{route.route}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-body-small text-secondary">
                            {route.bookings} réservations
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-body-xs">{route.satisfaction}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-body-small font-semibold text-kongo-black">
                        {formatCurrency(route.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Agencies */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="w-5 h-5 text-kongo-black" />
                  <span>Agences Performantes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.performance.agencies.map((agency, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-label font-medium">{agency.name}</p>
                        <div className="flex items-center space-x-2">
                          <span className="text-body-small text-secondary">
                            {agency.trips} trajets
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span className="text-body-xs">{agency.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(agency.growth)}
                        <span className="text-body-small font-semibold">
                          {formatPercentage(Math.abs(agency.growth))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Time Slots Performance */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-kongo-black" />
                <span>Performance par Créneau Horaire</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsData.performance.timeSlots.map((slot, index) => (
                  <div key={index} className="p-4 border border-border-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-label font-medium">{slot.time}</h4>
                      <Badge className={`text-xs ${
                        slot.efficiency >= 90 ? 'status-success' :
                        slot.efficiency >= 85 ? 'status-warning' :
                        'status-error'
                      }`}>
                        {slot.efficiency}%
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-body-small text-secondary">Réservations</span>
                        <span className="text-body-small font-semibold">{slot.bookings}</span>
                      </div>
                      <Progress value={slot.efficiency} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Utilisateurs */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Demographics */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-kongo-black" />
                  <span>Groupes d'âge</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.demographics.ageGroups.map((group, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-label">{group.label}</span>
                      <span className="text-body-small font-semibold">{group.value}%</span>
                    </div>
                    <div className="w-full bg-surface-tertiary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${group.color}`}
                        style={{ width: `${group.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Locations */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-kongo-black" />
                  <span>Répartition Géographique</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analyticsData.demographics.locations.map((location, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="text-label font-medium">{location.city}</p>
                      <p className="text-body-small text-secondary">
                        {location.users.toLocaleString()} utilisateurs
                      </p>
                    </div>
                    <Badge className="status-info">
                      {formatPercentage(location.percentage)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Devices */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-kongo-black" />
                  <span>Appareils Utilisés</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.demographics.devices.map((device, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-surface-secondary rounded-lg">
                        {device.type === 'Mobile' && <Smartphone className="w-4 h-4" />}
                        {device.type === 'Desktop' && <Monitor className="w-4 h-4" />}
                        {device.type === 'Tablet' && <Tablet className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-label font-medium">{device.type}</p>
                        <p className="text-body-small text-secondary">
                          {device.count.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <Badge className="status-kongo">
                      {formatPercentage(device.percentage)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Comportement utilisateur */}
        <TabsContent value="behavior" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-kongo-black" />
                  <span>Durée de Session</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-h2 font-bold text-kongo-black mb-2">
                  {analyticsData.userBehavior.sessionDuration} min
                </div>
                <p className="text-body-small text-success">+12% vs période précédente</p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-kongo-black" />
                  <span>Taux de Conversion</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-h2 font-bold text-kongo-black mb-2">
                  {formatPercentage(analyticsData.userBehavior.conversionRate)}
                </div>
                <Progress value={analyticsData.userBehavior.conversionRate} className="h-3 mb-2" />
                <p className="text-body-small text-success">+2.3% vs période précédente</p>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-kongo-black" />
                  <span>Clients Fidèles</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-h2 font-bold text-kongo-black mb-2">
                  {formatPercentage(analyticsData.userBehavior.repeatCustomers)}
                </div>
                <p className="text-body-small text-success">+8.5% vs période précédente</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-kongo-black" />
                  <span>Valeur Moyenne par Réservation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-h2 font-bold text-kongo-black mb-4">
                  {formatCurrency(analyticsData.userBehavior.averageBookingValue)}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-body-small">Économique</span>
                    <span className="text-body-small font-semibold">45k CDF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-small">Confort</span>
                    <span className="text-body-small font-semibold">85k CDF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-small">Premium</span>
                    <span className="text-body-small font-semibold">125k CDF</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-kongo-black" />
                  <span>Ratio Recherche/Réservation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-h2 font-bold text-kongo-black">
                    {analyticsData.userBehavior.searchToBookRatio}:1
                  </div>
                  <p className="text-body-small text-secondary">
                    recherches par réservation
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-body-small">Recherches totales</span>
                    <span className="text-body-small font-semibold">1.2M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-body-small">Conversions</span>
                    <span className="text-body-small font-semibold">285k</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Prévisions */}
        <TabsContent value="forecasts" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-kongo-black" />
                  <span>Prévisions Court Terme</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-label font-semibold mb-3">Mois Prochain</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-surface-secondary rounded-lg">
                      <div className="text-h4 font-bold text-kongo-black">
                        {analyticsData.forecasts.nextMonth.bookings.toLocaleString()}
                      </div>
                      <div className="text-body-small text-secondary">Réservations</div>
                    </div>
                    <div className="text-center p-3 bg-surface-secondary rounded-lg">
                      <div className="text-h4 font-bold text-kongo-black">
                        {formatCurrency(analyticsData.forecasts.nextMonth.revenue)}
                      </div>
                      <div className="text-body-small text-secondary">Revenus</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-center">
                    <Badge className="status-success">
                      <Gauge className="w-3 h-3 mr-1" />
                      {analyticsData.forecasts.nextMonth.confidence}% confiance
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-label font-semibold mb-3">Trimestre Prochain</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-surface-secondary rounded-lg">
                      <div className="text-h4 font-bold text-kongo-black">
                        {analyticsData.forecasts.nextQuarter.bookings.toLocaleString()}
                      </div>
                      <div className="text-body-small text-secondary">Réservations</div>
                    </div>
                    <div className="text-center p-3 bg-surface-secondary rounded-lg">
                      <div className="text-h4 font-bold text-kongo-black">
                        {formatCurrency(analyticsData.forecasts.nextQuarter.revenue)}
                      </div>
                      <div className="text-body-small text-secondary">Revenus</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-center">
                    <Badge className="status-warning">
                      <Gauge className="w-3 h-3 mr-1" />
                      {analyticsData.forecasts.nextQuarter.confidence}% confiance
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-kongo-black" />
                  <span>Tendances Saisonnières</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.forecasts.seasonalTrends.map((trend, index) => (
                  <div key={index} className="p-4 border border-border-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-label font-medium">{trend.season}</h4>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(trend.growth)}
                        <span className={`text-body-small font-semibold ${
                          trend.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(Math.abs(trend.growth))}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-body-small text-secondary">Prévision de croissance</span>
                      <Badge className={`text-xs ${
                        trend.confidence >= 85 ? 'status-success' :
                        trend.confidence >= 75 ? 'status-warning' :
                        'status-error'
                      }`}>
                        {trend.confidence}% fiable
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alertes */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="card-elevated border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Alertes Critiques</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-label font-medium text-red-700">Pic de charge serveur</span>
                  </div>
                  <p className="text-body-small text-red-600">
                    Utilisation CPU à 89% - Surveillance recommandée
                  </p>
                </div>

                <div className="p-3 bg-red-100 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span className="text-label font-medium text-red-700">Baisse conversion</span>
                  </div>
                  <p className="text-body-small text-red-600">
                    Taux de conversion -5% sur les dernières 2h
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-orange-700">
                  <Info className="w-5 h-5" />
                  <span>Alertes d'Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-orange-100 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Info className="w-4 h-4 text-orange-600" />
                    <span className="text-label font-medium text-orange-700">Nouveau record</span>
                  </div>
                  <p className="text-body-small text-orange-600">
                    1,500 utilisateurs simultanés - Record journalier
                  </p>
                </div>

                <div className="p-3 bg-orange-100 border border-orange-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-1">
                    <Info className="w-4 h-4 text-orange-600" />
                    <span className="text-label font-medium text-orange-700">Maintenance prévue</span>
                  </div>
                  <p className="text-body-small text-orange-600">
                    Mise à jour système dimanche 03h-05h
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="card-elevated border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                <span>Performance Excellente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-h4 font-bold text-green-700">99.9%</div>
                  <div className="text-body-small text-green-600">Disponibilité</div>
                </div>
                <div className="text-center">
                  <div className="text-h4 font-bold text-green-700">4.8/5</div>
                  <div className="text-body-small text-green-600">Satisfaction</div>
                </div>
                <div className="text-center">
                  <div className="text-h4 font-bold text-green-700">0.1%</div>
                  <div className="text-body-small text-green-600">Taux d'erreur</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
