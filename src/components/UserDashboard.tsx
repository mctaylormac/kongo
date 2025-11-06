import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { toast } from "sonner@2.0.3";
import { auth } from "../lib/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Import des nouveaux composants avancés
import { PlatformStats } from "./PlatformStats";
import { UserPreferencesManager } from "./UserPreferencesManager";
import { AdvancedChatSystem } from "./AdvancedChatSystem";
import { GamificationSystem } from "./GamificationSystem";
import { TripRatingFeedback, useTripsForRating } from "./TripRatingFeedback";

import {
  User,
  MapPin,
  Calendar,
  CreditCard,
  Star,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Heart,
  Gift,
  Settings,
  Bell,
  HelpCircle,
  Download,
  Share2,
  Edit,
  Eye,
  MoreVertical,
  Phone,
  Mail,
  Shield,
  Zap,
  Trophy,
  Target,
  BarChart3,
  Globe,
  MessageCircle,
  RefreshCw,
  Plus,
  Filter,
  Search,
  BookOpen,
  Smartphone,
  Headphones,
  Crown,
  Award,
  Gem,
  Flame,
  Users,
  Camera,
  FileText,
  Archive,
  Calendar as CalendarIcon,
  Coins,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Rocket,
  ThumbsUp,
  ThumbsDown,
  Send,
  MessageSquare,
  StarIcon,
  Building2,
  Truck
} from "lucide-react";

interface UserDashboardProps {
  onPageChange?: (page: string) => void;
  onSearch?: (searchData: any) => void;
  favoriteRoutes?: any[];
  bookingHistory?: any[];
  className?: string;
}

interface TripRating {
  id: string;
  tripId: string;
  agencyRating: number;
  driverRating: number;
  overallRating: number;
  comment: string;
  categories: {
    punctuality: number;
    comfort: number;
    safety: number;
    service: number;
  };
  date: Date;
  wouldRecommend: boolean;
  helpful?: number;
  photos?: string[];
}

interface Trip {
  id: string;
  from: string;
  to: string;
  date: string;
  agency: {
    id: string;
    name: string;
    logo?: string;
  };
  driver: {
    id: string;
    name: string;
    photo?: string;
    experience?: string;
  };
  vehicle: {
    number: string;
    type: string;
  };
  duration: string;
  price: number;
  status: 'completed' | 'in-progress' | 'cancelled';
  rating?: TripRating;
}

export function UserDashboard({ 
  onPageChange, 
  onSearch, 
  favoriteRoutes = [], 
  bookingHistory = [],
  className = "" 
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedTripToRate, setSelectedTripToRate] = useState<Trip | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [userRatings, setUserRatings] = useState<TripRating[]>([]);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [ratingFilter, setRatingFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  const { tripsToRate, loading: loadingTrips, fetchTripsToRate } = useTripsForRating();
  
  // Mock completed trips with ratings
  const [completedTrips] = useState<Trip[]>([
    {
      id: 'trip-1',
      from: 'Kinshasa',
      to: 'Lubumbashi',
      date: '2024-01-15',
      agency: { id: 'ag1', name: 'Express Congo' },
      driver: { id: 'dr1', name: 'Patrick Mukendi', experience: '5 ans' },
      vehicle: { number: 'KN-2024', type: 'Bus VIP' },
      duration: '16h',
      price: 125000,
      status: 'completed',
      rating: {
        id: 'rat-1',
        tripId: 'trip-1',
        agencyRating: 5,
        driverRating: 4,
        overallRating: 4.5,
        comment: 'Excellent voyage ! Le bus était très confortable et le chauffeur très professionnel. Départ et arrivée à l\'heure. Je recommande vivement cette compagnie pour les longs trajets.',
        categories: { punctuality: 5, comfort: 5, safety: 4, service: 4 },
        date: new Date('2024-01-16'),
        wouldRecommend: true,
        helpful: 12,
        photos: ['/api/placeholder/400/300', '/api/placeholder/400/300']
      }
    },
    {
      id: 'trip-2',
      from: 'Kinshasa',
      to: 'Goma',
      date: '2024-01-22',
      agency: { id: 'ag2', name: 'Trans-Kivu Express' },
      driver: { id: 'dr2', name: 'Jean Kabila', experience: '8 ans' },
      vehicle: { number: 'GO-1205', type: 'Minibus' },
      duration: '12h',
      price: 95000,
      status: 'completed',
      rating: {
        id: 'rat-2',
        tripId: 'trip-2',
        agencyRating: 3,
        driverRating: 5,
        overallRating: 4,
        comment: 'Voyage correct dans l\'ensemble. Le chauffeur était excellent, très prudent et sympathique. Cependant, le véhicule pourrait être mieux entretenu et la climatisation ne fonctionnait pas parfaitement.',
        categories: { punctuality: 4, comfort: 3, safety: 5, service: 4 },
        date: new Date('2024-01-23'),
        wouldRecommend: true,
        helpful: 8
      }
    },
    {
      id: 'trip-3',
      from: 'Lubumbashi',
      to: 'Kolwezi',
      date: '2024-02-05',
      agency: { id: 'ag3', name: 'Copperbelt Transport' },
      driver: { id: 'dr3', name: 'Michel Tshombe', experience: '12 ans' },
      vehicle: { number: 'KZ-0987', type: 'Bus Standard' },
      duration: '4h',
      price: 45000,
      status: 'completed',
      rating: {
        id: 'rat-3',
        tripId: 'trip-3',
        agencyRating: 4,
        driverRating: 4,
        overallRating: 4,
        comment: 'Bon service pour un trajet court. Rien d\'exceptionnel mais rien à redire non plus. Prix correct et ponctualité respectée.',
        categories: { punctuality: 4, comfort: 4, safety: 4, service: 4 },
        date: new Date('2024-02-05'),
        wouldRecommend: true,
        helpful: 3
      }
    }
  ]);

  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'success',
      title: 'Voyage confirmé !',
      message: 'Votre trajet Kinshasa → Lubumbashi est confirmé pour demain 08h00',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
      action: () => setActiveTab('trips')
    },
    {
      id: '2',
      type: 'info',
      title: 'Nouvel achievement débloqué',
      message: 'Félicitations ! Vous avez obtenu "Maître des Kilomètres"',
      timestamp: new Date(Date.now() - 7200000),
      read: false,
      action: () => setActiveTab('gamification')
    },
    {
      id: '3',
      type: 'warning',
      title: 'Évaluation en attente',
      message: 'N\'oubliez pas d\'évaluer votre dernier voyage vers Goma',
      timestamp: new Date(Date.now() - 10800000),
      read: true,
      action: () => setActiveTab('ratings')
    }
  ]);

  // Enhanced user data
  const [userData, setUserData] = useState({
    name: 'Jean-Baptiste Mukendi',
    email: 'jb.mukendi@gmail.com',
    phone: '+243 970 123 456',
    joinDate: new Date('2023-03-15'),
    avatar: '/api/placeholder/120/120',
    isVerified: true,
    membershipTier: 'Gold',
    totalTrips: 47,
    totalDistance: 18420,
    totalSpent: 2340000,
    carbonSaved: 890,
    loyaltyPoints: 12840,
    currentStreak: 12,
    favoriteDestination: 'Lubumbashi',
    preferredTime: 'Matin',
    averageRating: 4.2,
    badges: ['Early Bird', 'Eco Warrior', 'Social Butterfly', 'Review Master'],
    nextReward: { name: 'Voyage Gratuit', progress: 85 },
    recentActivity: [
      { type: 'trip', description: 'Voyage Kinshasa → Goma', date: new Date(Date.now() - 86400000) },
      { type: 'review', description: 'Avis publié pour Trans-Congo Express', date: new Date(Date.now() - 172800000) },
      { type: 'achievement', description: 'Achievement "Distance Master" débloqué', date: new Date(Date.now() - 259200000) }
    ]
  });

  // Charger le profil utilisateur depuis Firestore et remplacer les données statiques
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const profile = snap.data() as any;
          setUserData(prev => ({
            ...prev,
            name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || prev.name,
            email: profile.email || user.email || prev.email,
            phone: profile.phone || prev.phone,
            favoriteDestination: profile.city || prev.favoriteDestination,
            joinDate: profile.createdAt ? new Date(profile.createdAt) : prev.joinDate,
            isVerified: true
          }));
        } else {
          // Aucun profil Firestore: utiliser les infos du compte Auth (Google ou email/password)
          setUserData(prev => ({
            ...prev,
            name: (user.displayName || prev.name),
            email: user.email || prev.email,
            isVerified: true
          }));
        }
      } catch (e) {
        console.error('Failed to load user profile:', e);
      }
    });
    return () => unsubscribe();
  }, []);

  // Quick actions
  const quickActions = [
    {
      title: 'Nouveau Voyage',
      description: 'Réserver rapidement',
      icon: Plus,
      color: 'bg-kongo-black text-on-black',
      action: () => {
        onPageChange?.('search');
        toast.info("Redirection vers la recherche de trajets");
      }
    },
    {
      title: 'Mes Trajets',
      description: 'Voir les réservations',
      icon: MapPin,
      color: 'bg-kongo-lime text-kongo-black',
      action: () => {
        setActiveTab('trips');
        toast.info("Affichage de vos trajets");
      }
    },
    {
      title: 'Évaluer',
      description: 'Noter vos voyages',
      icon: Star,
      color: 'bg-yellow-500 text-white',
      action: () => {
        setActiveTab('ratings');
        toast.info("Système d'évaluations");
      }
    },
    {
      title: 'Support Client',
      description: 'Aide instantanée',
      icon: Headphones,
      color: 'bg-blue-500 text-white',
      action: () => {
        setShowChat(true);
        toast.info("Chat support ouvert");
      }
    }
  ];

  // Rating functions
  const handleEditComment = (ratingId: string, currentComment: string) => {
    setEditingComment(ratingId);
    setNewComment(currentComment);
  };

  const handleSaveComment = async (ratingId: string) => {
    toast.loading("Mise à jour du commentaire...", { id: 'update-comment' });
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the comment in the trip's rating
    // In a real app, this would be an API call
    
    toast.success("Commentaire mis à jour avec succès !", { id: 'update-comment' });
    setEditingComment(null);
    setNewComment("");
  };

  const handleAddHelpful = (ratingId: string) => {
    toast.success("Merci ! Votre avis sur cet avis a été enregistré", {
      description: "Cela aide d'autres voyageurs à prendre de meilleures décisions"
    });
  };

  const handleSubmitRating = (feedback: any) => {
    // Add the new rating to our state
    const newRating: TripRating = {
      id: `rat-${Date.now()}`,
      tripId: selectedTripToRate?.id || '',
      agencyRating: feedback.agencyRating,
      driverRating: feedback.driverRating,
      overallRating: (feedback.agencyRating + feedback.driverRating) / 2,
      comment: feedback.comment,
      categories: feedback.categories.reduce((acc: any, cat: any) => {
        acc[cat.id] = cat.rating;
        return acc;
      }, {}),
      date: new Date(),
      wouldRecommend: feedback.wouldRecommend,
      helpful: 0,
      photos: feedback.photos?.map((file: File) => URL.createObjectURL(file))
    };

    setUserRatings(prev => [newRating, ...prev]);
    setShowRatingModal(false);
    setSelectedTripToRate(null);
    
    toast.success("🎉 Évaluation envoyée avec succès !", {
      description: "Merci de contribuer à améliorer l'expérience KonGO",
      action: {
        label: "Voir mes évaluations",
        onClick: () => setActiveTab('ratings')
      }
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-500';
    if (rating >= 3.5) return 'text-yellow-500';
    if (rating >= 2.5) return 'text-orange-500';
    return 'text-red-500';
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-kongo-lime fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className={`ml-2 font-medium ${size === 'lg' ? 'text-h5' : 'text-body-small'}`}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  const filteredRatings = completedTrips.filter(trip => {
    if (ratingFilter === 'pending') return !trip.rating;
    if (ratingFilter === 'completed') return trip.rating;
    return true;
  });

  return (
    <div className={`min-h-screen bg-surface-primary ${className}`}>
      {/* Enhanced Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-kongo-black via-kongo-black-light to-kongo-black text-on-black"
      >
        <div className="container-professional py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
            {/* User Profile Section */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="w-20 h-20 border-4 border-kongo-lime">
                  <AvatarImage src={userData.avatar} />
                  <AvatarFallback className="bg-kongo-lime text-kongo-black font-bold text-2xl">
                    {userData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                
                {userData.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-h2 font-bold">Bienvenue, {userData.name.split(' ')[0]} !</h1>
                  <Badge className={`${
                    userData.membershipTier === 'Gold' 
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-silver-500/20 text-silver-400 border-silver-500/30'
                  }`}>
                    <Crown className="w-3 h-3 mr-1" />
                    {userData.membershipTier}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-body text-on-black/80">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>Membre depuis {userData.joinDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{userData.totalTrips} voyages</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span>{userData.averageRating}/5</span>
                  </div>
                </div>
                
                {/* Active streak */}
                <div className="flex items-center space-x-2 mt-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="text-body-small">Streak actuel: {userData.currentStreak} jours</span>
                  <div className="flex space-x-1">
                    {Array.from({ length: Math.min(userData.currentStreak, 10) }).map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowPreferences(true)}
                variant="outline"
                className="btn-ghost border-white/20 hover:bg-white/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Préférences
              </Button>
              
              <Button
                onClick={() => setShowChat(true)}
                variant="outline"
                className="btn-ghost border-white/20 hover:bg-white/10 relative"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Support
                {notifications.filter(n => !n.read).length > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-kongo-lime text-kongo-black rounded-full text-xs flex items-center justify-center font-bold">
                    {notifications.filter(n => !n.read).length}
                  </div>
                )}
              </Button>
              
              <Button
                onClick={() => {
                  toast.success("Profil partagé !", {
                    description: "Lien copié dans le presse-papiers"
                  });
                }}
                className="btn-secondary"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Coins className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
              <div className="text-h4 font-bold">{userData.loyaltyPoints.toLocaleString()}</div>
              <div className="text-body-small opacity-80">Points fidélité</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Target className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
              <div className="text-h4 font-bold">{(userData.totalDistance / 1000).toFixed(1)}k</div>
              <div className="text-body-small opacity-80">Kilomètres</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Gift className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
              <div className="text-h4 font-bold">{(userData.totalSpent / 1000).toFixed(0)}k</div>
              <div className="text-body-small opacity-80">CDF économisés</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <Trophy className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
              <div className="text-h4 font-bold">{userData.badges.length}</div>
              <div className="text-body-small opacity-80">Badges</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content with Enhanced Tabs */}
      <div className="container-professional py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Enhanced Tab Navigation */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 bg-surface-secondary p-1 rounded-xl">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2 py-3">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Tableau de bord</span>
            </TabsTrigger>
            <TabsTrigger value="trips" className="flex items-center space-x-2 py-3">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Mes trajets</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center space-x-2 py-3">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Favoris</span>
            </TabsTrigger>
            <TabsTrigger value="ratings" className="flex items-center space-x-2 py-3 relative">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Évaluations</span>
              {tripsToRate.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-kongo-lime text-kongo-black rounded-full text-xs flex items-center justify-center font-bold">
                  {tripsToRate.length}
                </div>
              )}
            </TabsTrigger>
            <TabsTrigger value="gamification" className="flex items-center space-x-2 py-3">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Récompenses</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2 py-3">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytiques</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2 py-3">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Dashboard Overview */}
          <TabsContent value="dashboard" className="space-y-8">
            {/* Quick Actions Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-h3 font-bold text-primary">Actions Rapides</h2>
                <Button
                  onClick={() => {
                    toast.info("Données actualisées");
                  }}
                  variant="outline"
                  size="sm"
                  className="btn-ghost"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickActions.map((action, index) => (
                  <motion.div
                    key={action.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * (index + 1) }}
                  >
                    <Card 
                      className="card-interactive cursor-pointer hover:shadow-lg"
                      onClick={action.action}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-xl ${action.color}`}>
                            <action.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-label font-semibold">{action.title}</h3>
                            <p className="text-body-small text-secondary">{action.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Platform Statistics Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <PlatformStats className="mb-8" />
            </motion.div>

            {/* Recent Activity and Next Rewards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-kongo-black" />
                      <span>Activité Récente</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userData.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-surface-secondary rounded-lg">
                        <div className={`p-2 rounded-lg ${
                          activity.type === 'trip' ? 'bg-kongo-lime/20 text-kongo-lime-dark' :
                          activity.type === 'review' ? 'bg-blue-100 text-blue-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {activity.type === 'trip' && <MapPin className="w-4 h-4" />}
                          {activity.type === 'review' && <Star className="w-4 h-4" />}
                          {activity.type === 'achievement' && <Trophy className="w-4 h-4" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-label">{activity.description}</p>
                          <p className="text-body-small text-secondary">
                            {activity.date.toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Next Rewards */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="card-elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <Gift className="w-5 h-5 text-kongo-black" />
                      <span>Prochaines Récompenses</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress vers prochaine récompense */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-label font-medium">{userData.nextReward.name}</span>
                        <span className="text-body-small text-kongo-lime-dark font-semibold">
                          {userData.nextReward.progress}%
                        </span>
                      </div>
                      <Progress value={userData.nextReward.progress} className="h-3" />
                      <p className="text-body-small text-secondary">
                        Plus que {100 - userData.nextReward.progress}% pour débloquer
                      </p>
                    </div>

                    <Separator />

                    {/* Available rewards */}
                    <div className="space-y-3">
                      <h4 className="text-label font-semibold">Disponibles maintenant</h4>
                      <div className="space-y-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start btn-outline-lime"
                          onClick={() => setActiveTab('gamification')}
                        >
                          <Coins className="w-4 h-4 mr-2" />
                          Échanger 500 points → Réduction 10%
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start btn-outline-lime"
                          onClick={() => setActiveTab('gamification')}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Badge "Expert Voyageur" disponible
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          {/* Enhanced Ratings Tab */}
          <TabsContent value="ratings" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-h3 font-bold text-primary">Évaluations et Commentaires</h2>
                  <p className="text-body text-secondary">
                    Partagez votre expérience et aidez d'autres voyageurs
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Filter buttons */}
                  <div className="flex items-center bg-surface-secondary rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={ratingFilter === 'all' ? 'default' : 'ghost'}
                      onClick={() => setRatingFilter('all')}
                      className={ratingFilter === 'all' ? 'btn-primary' : 'btn-ghost'}
                    >
                      Tous
                    </Button>
                    <Button
                      size="sm"
                      variant={ratingFilter === 'pending' ? 'default' : 'ghost'}
                      onClick={() => setRatingFilter('pending')}
                      className={ratingFilter === 'pending' ? 'btn-primary' : 'btn-ghost'}
                    >
                      En attente
                    </Button>
                    <Button
                      size="sm"
                      variant={ratingFilter === 'completed' ? 'default' : 'ghost'}
                      onClick={() => setRatingFilter('completed')}
                      className={ratingFilter === 'completed' ? 'btn-primary' : 'btn-ghost'}
                    >
                      Évalués
                    </Button>
                  </div>
                  
                  <Button
                    onClick={fetchTripsToRate}
                    variant="outline"
                    size="sm"
                    className="btn-ghost"
                    disabled={loadingTrips}
                  >
                    {loadingTrips ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualiser
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Pending Ratings */}
              {(ratingFilter === 'all' || ratingFilter === 'pending') && tripsToRate.length > 0 && (
                <Card className="card-elevated mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                      <span>Voyages en attente d'évaluation</span>
                      <Badge className="status-warning">
                        {tripsToRate.length} voyage{tripsToRate.length > 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tripsToRate.map((trip) => (
                      <div 
                        key={trip.id}
                        className="flex items-center justify-between p-4 bg-surface-secondary rounded-lg border border-orange-200"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-kongo-lime rounded-lg flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-kongo-black" />
                          </div>
                          <div>
                            <h4 className="text-label font-semibold">
                              {trip.from} → {trip.to}
                            </h4>
                            <p className="text-body-small text-secondary">
                              {trip.date} • {trip.agency.name} • {trip.driver.name}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedTripToRate(trip);
                            setShowRatingModal(true);
                          }}
                          className="btn-secondary"
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Évaluer
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* No pending ratings message */}
              {(ratingFilter === 'pending' && tripsToRate.length === 0) && (
                <Card className="card-elevated mb-8">
                  <CardContent className="p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-h4 text-primary mb-2">Tous vos voyages sont évalués !</h3>
                    <p className="text-body text-secondary">
                      Merci de contribuer à améliorer l'expérience KonGO
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Completed Ratings */}
              {(ratingFilter === 'all' || ratingFilter === 'completed') && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-h4 font-semibold text-primary">Mes évaluations</h3>
                    <Badge className="status-info">
                      {completedTrips.filter(trip => trip.rating).length} avis publiés
                    </Badge>
                  </div>

                  {completedTrips.filter(trip => trip.rating).map((trip) => (
                    <Card key={trip.id} className="card-elevated">
                      <CardContent className="p-6">
                        <div className="space-y-6">
                          {/* Trip and Rating Header */}
                          <div className="flex flex-col lg:flex-row lg:items-start justify-between space-y-4 lg:space-y-0">
                            <div className="flex items-center space-x-4">
                              <div className="w-16 h-16 bg-kongo-lime rounded-xl flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-kongo-black" />
                              </div>
                              <div>
                                <h4 className="text-h5 font-semibold text-primary">
                                  {trip.from} → {trip.to}
                                </h4>
                                <p className="text-body-small text-secondary">
                                  {trip.date} • {trip.agency.name}
                                </p>
                                <p className="text-body-small text-tertiary">
                                  Chauffeur: {trip.driver.name} • {trip.vehicle.type} {trip.vehicle.number}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              {renderStars(trip.rating!.overallRating, 'lg')}
                              <p className="text-body-small text-secondary mt-1">
                                Évalué le {trip.rating!.date.toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>

                          {/* Detailed Ratings */}
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-surface-secondary rounded-lg">
                            <div className="text-center">
                              <Building2 className="w-5 h-5 text-kongo-black mx-auto mb-2" />
                              <div className="text-label font-semibold">Agence</div>
                              {renderStars(trip.rating!.agencyRating, 'sm')}
                            </div>
                            <div className="text-center">
                              <Truck className="w-5 h-5 text-kongo-black mx-auto mb-2" />
                              <div className="text-label font-semibold">Chauffeur</div>
                              {renderStars(trip.rating!.driverRating, 'sm')}
                            </div>
                            <div className="text-center">
                              <Clock className="w-5 h-5 text-kongo-black mx-auto mb-2" />
                              <div className="text-label font-semibold">Ponctualité</div>
                              {renderStars(trip.rating!.categories.punctuality, 'sm')}
                            </div>
                            <div className="text-center">
                              <Shield className="w-5 h-5 text-kongo-black mx-auto mb-2" />
                              <div className="text-label font-semibold">Confort</div>
                              {renderStars(trip.rating!.categories.comfort, 'sm')}
                            </div>
                          </div>

                          {/* Comment Section */}
                          <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                              <MessageSquare className="w-5 h-5 text-kongo-black" />
                              <span className="text-label font-semibold">Mon commentaire</span>
                              {trip.rating!.wouldRecommend && (
                                <Badge className="status-success">
                                  <ThumbsUp className="w-3 h-3 mr-1" />
                                  Recommandé
                                </Badge>
                              )}
                            </div>
                            
                            {editingComment === trip.rating!.id ? (
                              <div className="space-y-3">
                                <Textarea
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  className="min-h-[120px] resize-none"
                                  maxLength={500}
                                />
                                <div className="flex items-center justify-between">
                                  <span className="text-body-xs text-tertiary">
                                    {newComment.length}/500 caractères
                                  </span>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingComment(null);
                                        setNewComment("");
                                      }}
                                      className="btn-ghost"
                                    >
                                      Annuler
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveComment(trip.rating!.id)}
                                      className="btn-primary"
                                    >
                                      <Send className="w-4 h-4 mr-2" />
                                      Sauvegarder
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="p-4 bg-surface-tertiary rounded-lg border-l-4 border-kongo-lime">
                                  <p className="text-body text-primary leading-relaxed">
                                    {trip.rating!.comment}
                                  </p>
                                </div>
                                
                                {/* Photos if any */}
                                {trip.rating!.photos && trip.rating!.photos.length > 0 && (
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <Camera className="w-4 h-4 text-kongo-black" />
                                      <span className="text-label font-medium">Photos du voyage</span>
                                    </div>
                                    <div className="flex space-x-3">
                                      {trip.rating!.photos.map((photo, index) => (
                                        <img
                                          key={index}
                                          src={photo}
                                          alt={`Photo voyage ${index + 1}`}
                                          className="w-20 h-20 object-cover rounded-lg border border-border-primary"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-4">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEditComment(trip.rating!.id, trip.rating!.comment)}
                                      className="btn-ghost"
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Modifier
                                    </Button>
                                    
                                    {trip.rating!.helpful !== undefined && trip.rating!.helpful > 0 && (
                                      <div className="flex items-center space-x-2 text-body-small text-secondary">
                                        <ThumbsUp className="w-4 h-4" />
                                        <span>{trip.rating!.helpful} personnes ont trouvé cet avis utile</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <Badge className="status-info">
                                    {trip.rating!.date.toLocaleDateString('fr-FR')}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {completedTrips.filter(trip => trip.rating).length === 0 && (
                    <Card className="card-elevated">
                      <CardContent className="p-8 text-center">
                        <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-h4 text-primary mb-2">Aucune évaluation pour le moment</h3>
                        <p className="text-body text-secondary">
                          Vos évaluations apparaîtront ici après vos voyages
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Other tabs remain the same */}
          <TabsContent value="trips" className="space-y-6">
            <h2 className="text-h3 font-bold text-primary">Mes Trajets</h2>
            <p className="text-body text-secondary">Gérez vos réservations et consultez l'historique de vos voyages.</p>
            {/* Trip management content would go here */}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <h2 className="text-h3 font-bold text-primary">Routes Favorites</h2>
            <p className="text-body text-secondary">Vos trajets préférés pour une réservation rapide.</p>
            {/* Favorites content would go here */}
          </TabsContent>

          <TabsContent value="gamification" className="space-y-6">
            <GamificationSystem onAchievementUnlock={() => {}} onLevelUp={() => {}} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-h3 font-bold text-primary">Analytiques</h2>
            <p className="text-body text-secondary">Analysez vos habitudes de voyage et optimisez vos déplacements.</p>
            {/* Analytics content would go here */}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-h3 font-bold text-primary">Paramètres</h2>
            <p className="text-body text-secondary">Configurez votre compte et vos préférences.</p>
            {/* Settings content would go here */}
          </TabsContent>
        </Tabs>
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && selectedTripToRate && (
          <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Évaluez votre voyage</DialogTitle>
                <DialogDescription>
                  Votre avis aide d'autres voyageurs à faire le bon choix
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-[80vh] overflow-y-auto">
                <TripRatingFeedback
                  trip={selectedTripToRate}
                  onSubmit={handleSubmitRating}
                  onClose={() => setShowRatingModal(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Preferences Modal */}
      <AnimatePresence>
        {showPreferences && (
          <UserPreferencesManager
            isOpen={showPreferences}
            onClose={() => setShowPreferences(false)}
            onSave={(preferences) => {
              console.log('Preferences saved:', preferences);
              setShowPreferences(false);
              toast.success("Préférences mises à jour avec succès !");
            }}
          />
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <AdvancedChatSystem
            isOpen={showChat}
            onClose={() => setShowChat(false)}
            initialMessage="Bonjour ! Comment puis-je vous aider avec vos voyages ?"
          />
        )}
      </AnimatePresence>
    </div>
  );
}