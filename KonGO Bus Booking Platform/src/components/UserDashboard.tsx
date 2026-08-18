import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";


// Import des nouveaux composants avancés
import { UserPreferencesManager } from "./UserPreferencesManager";
import { AdvancedChatSystem } from "./AdvancedChatSystem";
import { GamificationSystem } from "./GamificationSystem";
import { TripRatingFeedback, useTripsForRating } from "./TripRatingFeedback";
import { DeleteAccountDialog } from "./DeleteAccountDialog";

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
  Rocket,
  ThumbsUp,
  ThumbsDown,
  Send,
  MessageSquare,
  StarIcon,
  Building2,
  Truck,
  Ticket,
  Info,
  Trash2
} from "lucide-react";

interface UserDashboardProps {
  onPageChange?: (page: string) => void;
  onSearch?: (searchData: any) => void;
  favoriteRoutes?: any[];
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

interface PurchasedTicket {
  id: string;
  booking_code: string;
  total_price: number;
  currency: string;
  payment_method: string | null;
  payment_status: string | null;
  status: string | null;
  created_at: string;
  seats?: any;
  scanned?: boolean; // true if a ticket_scan record exists for this booking
  trips?: {
    origin?: { name?: string };
    destination?: { name?: string };
    departure_time?: string;
  };
}

// [Agent Dev Web] - Action: UserDashboard nettoyé - bookingHistory remplacé par purchasedTickets (Supabase)
export function UserDashboard({
  onPageChange,
  onSearch,
  favoriteRoutes = [],
  className = ""
}: UserDashboardProps) {
  const [activeTab, setActiveTab] = useState('trips');
  const [showPreferences, setShowPreferences] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedTripToRate, setSelectedTripToRate] = useState<Trip | null>(null);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  
  const [selectedProvince, setSelectedProvince] = useState<string>("Kinshasa");
  const [provinceStops, setProvinceStops] = useState<any[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);

  const kongoProvinces = ['Kinshasa', 'Kongo Central', 'Haut-Katanga', 'Lualaba', 'Nord-Kivu', 'Sud-Kivu', 'Tshopo', 'Ituri'];

  useEffect(() => {
    const fetchProvinceStops = async () => {
      setLoadingStops(true);
      const { data } = await supabase.from('stops').select('*').ilike('city_name', `%${selectedProvince}%`);
      setProvinceStops(data || []);
      setLoadingStops(false);
    };
    if (activeTab === 'stops') {
      fetchProvinceStops();
    }
  }, [selectedProvince, activeTab]);
  
  const [, setUserRatings] = useState<TripRating[]>([]);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [ratingFilter, setRatingFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Verification state for "My Trips"
  const [purchasedTickets, setPurchasedTickets] = useState<PurchasedTicket[]>([]);
  const [loadingPurchasedTickets, setLoadingPurchasedTickets] = useState(false);


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

  // Enhanced user data - initially placeholder, updated with real data
  const [userData, setUserData] = useState({
    name: 'Voyageur',
    email: '',
    phone: '',
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

  // Fetch real user data from Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setLoadingPurchasedTickets(true);

          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) throw error;

          if (profile) {
            setUserData(prev => ({
              ...prev,
              name: profile.full_name || user.email?.split('@')[0] || 'Voyageur',
              email: profile.email || user.email || '',
              phone: profile.phone_number || prev.phone,
              avatar: profile.avatar_url || prev.avatar,
              joinDate: new Date(profile.created_at)
            }));
          }

          // [Agent Supabase] - Action: Two-step fetch with scan status enrichment
          const { data: tickets, error: ticketsError } = await supabase
            .from('bookings')
            .select(`
              id,
              booking_code,
              total_price,
              currency,
              payment_method,
              payment_status,
              status,
              created_at,
              seats,
              trips(
                origin:locations!origin_location_id(name),
                destination:locations!destination_location_id(name),
                departure_time
              )
            `)
            .eq('user_id', user.id)
            .eq('payment_status', 'paid')
            .order('created_at', { ascending: false });

          if (ticketsError) {
            console.error('Error fetching purchased tickets:', ticketsError);
            setPurchasedTickets([]);
          } else if (tickets && tickets.length > 0) {
            // Step 2: Check which bookings have been scanned
            const bookingIds = tickets.map(t => t.id);
            const { data: scans } = await supabase
              .from('ticket_scans')
              .select('booking_id')
              .in('booking_id', bookingIds)
              .eq('result', 'valid');

            const scannedIds = new Set((scans || []).map(s => s.booking_id));

            const enriched = tickets.map(t => ({
              ...t,
              scanned: scannedIds.has(t.id),
            }));
            setPurchasedTickets(enriched as PurchasedTicket[]);
          } else {
            setPurchasedTickets([]);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoadingPurchasedTickets(false);
      }
    };

    fetchUserProfile();
  }, []);

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
    toast.success("Merci ! Votre avis sur cet avis a été enregistr?", {
      description: "Cela aide d'autres voyageurs Ã  prendre de meilleures décisions"
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

    toast.success("Évaluation envoyée avec succès !", {
      description: "Merci de contribuer à améliorer l'expérience KonGO",
      action: {
        label: "Voir mes évaluations",
        onClick: () => setActiveTab('ratings')
      }
    });
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`${sizeClass} ${star <= rating ? 'text-kongo-lime fill-current' : 'text-gray-300'}`}
          />
        ))}
        <span className={`ml-2 font-medium ${size === 'lg' ? 'text-h5' : 'text-body-small'}`}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className={`min-h-screen bg-surface-primary ${className}`}>
      {/* Enhanced Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-kongo-black via-kongo-black-light to-kongo-black border-b border-white/10"
      >

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0 w-full">
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

              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 shadow-xl">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-h2 font-bold text-white tracking-tight">
                    Bienvenue, <span className="text-kongo-lime">{userData.name.split(' ')[0]}</span> !
                  </h1>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => setShowPreferences(true)}
                className="min-h-12 min-w-[170px] justify-center rounded-xl border-2 border-kongo-lime/60 bg-white text-kongo-black hover:bg-kongo-lime hover:text-kongo-black shadow-lg shadow-black/20"
              >
                <Settings className="w-4 h-4 mr-2" />
                Préférences
              </Button>

              <Button
                onClick={() => setShowChat(true)}
                className="min-h-12 min-w-[170px] justify-center rounded-xl border-2 border-kongo-lime bg-kongo-lime text-kongo-black hover:bg-kongo-lime-light shadow-lg shadow-kongo-lime/30 relative"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Support
                {notifications.filter(n => !n.read).length > 0 && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold border-2 border-kongo-black">
                    {notifications.filter(n => !n.read).length}
                  </div>
                )}
              </Button>

              <Button
                onClick={() => {
                  toast.success("Profil partag? !", {
                    description: "Lien copi? dans le presse-papiers"
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 w-full">
            <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-center">
              <Coins className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
              <div className="text-h4 font-bold text-white">{userData.loyaltyPoints.toLocaleString()}</div>
              <div className="text-body-small text-white/70">Points fidélité</div>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-center">
              <Target className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
              <div className="text-h4 font-bold text-white">{(userData.totalDistance / 1000).toFixed(1)}k</div>
              <div className="text-body-small text-white/70">Kilomètres</div>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-center">
              <Gift className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
              <div className="text-h4 font-bold text-white">{(userData.totalSpent / 1000).toFixed(0)}k</div>
              <div className="text-body-small text-white/70">CDF économisés</div>
            </div>

            <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-center">
              <Trophy className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
              <div className="text-h4 font-bold text-white">{userData.badges.length}</div>
              <div className="text-body-small text-white/70">Badges</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content with Enhanced Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Enhanced Tab Navigation */}
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 mb-8 h-auto p-2 bg-gray-100 border-2 border-gray-300 rounded-2xl shadow-inner gap-2">
            <TabsTrigger
              value="trips"
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-xs sm:text-sm md:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Mes trajets</span>
            </TabsTrigger>

            <TabsTrigger
              value="favorites"
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-xs sm:text-sm md:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl"
            >
              <Heart className="w-4 h-4 shrink-0" />
              <span>Favoris</span>
            </TabsTrigger>

            <TabsTrigger
              value="ratings"
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-xs sm:text-sm md:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl relative"
            >
              <Star className="w-4 h-4 shrink-0" />
              <span>Évaluations</span>
              {tripsToRate.length > 0 && (
                <div className="w-5 h-5 bg-[#C8E63C] text-black rounded-full text-xs flex items-center justify-center font-black border border-black ml-1">
                  {tripsToRate.length}
                </div>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="gamification"
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-xs sm:text-sm md:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl"
            >
              <Trophy className="w-4 h-4 shrink-0" />
              <span>Récompenses</span>
            </TabsTrigger>

            <TabsTrigger
              value="analytics"
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-xs sm:text-sm md:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl"
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Analytiques</span>
            </TabsTrigger>

            <TabsTrigger
              value="settings"
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-xs sm:text-sm md:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Paramètres</span>
            </TabsTrigger>

            <TabsTrigger
              value="stops"
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-extrabold text-xs sm:text-sm md:text-base cursor-pointer shadow-md hover:bg-gray-200 hover:border-gray-400 hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 data-[state=active]:bg-[#1D1D1F] data-[state=active]:text-[#C8E63C] data-[state=active]:border-2 data-[state=active]:border-[#C8E63C] data-[state=active]:shadow-xl"
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span>Arrêts</span>
            </TabsTrigger>
          </TabsList>

          {/* Arrêts par Province Tab */}
          <TabsContent value="stops" className="space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-h3 font-bold text-primary">ArrÃªts par Province</h2>
                  <p className="text-body text-secondary">
                    Consultez les points d'embarquement et de débarquement disponibles.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger className="w-[200px] border-2 border-kongo-lime/30 focus:border-kongo-lime rounded-xl h-12">
                      <MapPin className="w-4 h-4 mr-2 text-kongo-lime" />
                      <SelectValue placeholder="Sélectionner une province" />
                    </SelectTrigger>
                    <SelectContent>
                      {kongoProvinces.map(prov => (
                        <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {loadingStops ? (
                <div className="flex justify-center items-center py-20">
                  <div className="w-12 h-12 border-4 border-kongo-lime border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : provinceStops.length === 0 ? (
                <Card className="card-elevated mb-8 p-10 text-center">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-h4 text-primary mb-2">Aucun arrÃªt trouvé</h3>
                  <p className="text-body text-secondary">
                    Il n'y a pas encore d'arrÃªts configurés pour {selectedProvince}.
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {provinceStops.map(stop => (
                    <Card key={stop.id} className="card-elevated hover:border-kongo-lime transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-kongo-lime/20 rounded-xl flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-6 h-6 text-kongo-lime-dark" />
                          </div>
                          <div>
                            <h4 className="text-h5 font-bold text-primary">{stop.name}</h4>
                            <p className="text-body-small text-secondary mt-1 flex items-center">
                              <Building2 className="w-3 h-3 mr-1" />
                              {stop.city_name}
                            </p>
                            {stop.address && (
                              <p className="text-body-small text-tertiary mt-2 flex items-start">
                                <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                                {stop.address}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Enhanced Ratings Tab */}
          <TabsContent value="ratings" className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
                <div>
                  <h2 className="text-h3 font-bold text-primary">Ã‰valuations et Commentaires</h2>
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
                    variant="ghost"
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
                              {trip.from} ? {trip.to}
                            </h4>
                            <p className="text-body-small text-secondary">
                              {trip.date} ? {trip.agency.name} ? {trip.driver.name}
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
                          Ã‰valuer
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
                      Merci de contribuer Ã  améliorer l'expérience KonGO
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
                                  {trip.from} ? {trip.to}
                                </h4>
                                <p className="text-body-small text-secondary">
                                  {trip.date} ? {trip.agency.name}
                                </p>
                                <p className="text-body-small text-tertiary">
                                  Chauffeur: {trip.driver.name} ? {trip.vehicle.type} {trip.vehicle.number}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              {renderStars(trip.rating!.overallRating, 'lg')}
                              <p className="text-body-small text-secondary mt-1">
                                Ã‰valué le {trip.rating!.date.toLocaleDateString('fr-FR')}
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
                              <div className="text-label font-semibold">Ponctualit?</div>
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
                                  Recommand?
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
                                    {newComment.length}/500 caractÃ¨res
                                  </span>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
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
                                      variant="ghost"
                                      onClick={() => handleEditComment(trip.rating!.id, trip.rating!.comment)}
                                      className="btn-ghost"
                                    >
                                      <Edit className="w-4 h-4 mr-2" />
                                      Modifier
                                    </Button>

                                    {trip.rating!.helpful !== undefined && trip.rating!.helpful > 0 && (
                                      <div className="flex items-center space-x-2 text-body-small text-secondary">
                                        <ThumbsUp className="w-4 h-4" />
                                        <span>{trip.rating!.helpful} personnes ont trouv? cet avis utile</span>
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
                          Vos évaluations apparaÃ®tront ici aprÃ¨s vos voyages
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </motion.div>
          </TabsContent>

          {/* Other tabs remain the same */}
          <TabsContent value="trips" className="space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 space-y-4 lg:space-y-0">
              <div>
                <h2 className="text-h3 font-bold text-primary">Mes Trajets</h2>
                <p className="text-body text-secondary">
                  Gérez vos réservations et consultez l'historique de vos voyages.
                </p>
              </div>

            </div>

            {/* Purchased Tickets */}
            <Card className="card-elevated">
              <CardHeader className="border-b border-border-primary">
                <CardTitle className="text-h5 flex items-center justify-between">
                  <span className="flex items-center">
                    <Ticket className="w-5 h-5 mr-2 text-kongo-black" />
                    Mes tickets achetés
                  </span>
                  <Badge className="status-info">
                    {purchasedTickets.length} ticket{purchasedTickets.length > 1 ? 's' : ''}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loadingPurchasedTickets ? (
                  <div className="p-10 flex justify-center">
                    <div className="w-8 h-8 border-2 border-kongo-black border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : purchasedTickets.length === 0 ? (
                  <div className="p-10 text-center text-secondary">
                    <Ticket className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Aucun ticket acheté pour le moment.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border-primary">
                    {purchasedTickets.map((ticket) => (
                      <div key={ticket.id} className="p-6 hover:bg-surface-secondary transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-body-small font-bold text-kongo-black">
                                {ticket.booking_code || 'Ticket sans référence'}
                              </span>
                              <Badge className="status-kongo">Payé</Badge>
                            </div>
                            <p className="text-body-small text-primary">
                              {(ticket.trips as any)?.origin?.name || 'Départ'} → {(ticket.trips as any)?.destination?.name || 'Arrivée'}
                            </p>
                            <div className="text-body-xs text-secondary flex flex-wrap gap-3">
                              <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{new Date(ticket.created_at).toLocaleDateString('fr-FR')}</span>
                              <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />{(ticket.trips as any)?.departure_time ? new Date((ticket.trips as any).departure_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                              <span className="flex items-center"><CreditCard className="w-3 h-3 mr-1" />{ticket.payment_method || 'Non précisé'}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-h5 font-black text-kongo-black">
                              {new Intl.NumberFormat('fr-CD', {
                                style: 'currency',
                                currency: ticket.currency || 'CDF',
                                maximumFractionDigits: 0,
                              }).format(Number(ticket.total_price || 0))}
                            </p>
                            <p className="text-body-xs text-tertiary">
                              Sièges: {Array.isArray(ticket.seats) ? ticket.seats.length : 1}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
                {/* [Agent Dev Web] - Action: Voyages à venir - Filtrés (non scannés + date future) */}
                <Card className="card-elevated">
                  <CardHeader className="border-b border-border-primary">
                    <CardTitle className="text-h5 flex items-center">
                      <Zap className="w-5 h-5 mr-2 text-warning" />
                      Voyages Confirmés &amp; À venir
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loadingPurchasedTickets ? (
                      <div className="p-10 flex justify-center">
                        <div className="w-8 h-8 border-2 border-kongo-black border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (() => {
                      const now = new Date();
                      const upcomingTickets = purchasedTickets.filter(ticket => {
                        const depTime = (ticket.trips as any)?.departure_time;
                        const isFuture = depTime ? new Date(depTime) >= now : true;
                        return !ticket.scanned && isFuture;
                      });

                      if (upcomingTickets.length === 0) {
                        return (
                          <div className="p-12 text-center text-secondary">
                            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>Aucun voyage confirmé à venir.</p>
                            <Button
                              variant="link"
                              className="text-kongo-lime-dark font-bold mt-2"
                              onClick={() => onPageChange?.('search')}
                            >
                              Réserver un nouveau trajet
                            </Button>
                          </div>
                        );
                      }

                      return (
                        <div className="divide-y divide-border-primary">
                          {upcomingTickets.map((ticket) => {
                            const tripsData = ticket.trips as any;
                            const origin = tripsData?.origin?.name || 'Départ';
                            const destination = tripsData?.destination?.name || 'Arrivée';
                            const depTime = tripsData?.departure_time
                              ? new Date(tripsData.departure_time)
                              : null;
                            return (
                              <div key={ticket.id} className="p-6 hover:bg-surface-secondary transition-colors group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                  <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 bg-kongo-lime rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                      <MapPin className="w-8 h-8 text-kongo-black" />
                                    </div>
                                    <div>
                                      <div className="flex items-center space-x-2 mb-1">
                                        <h4 className="text-h5 font-bold text-primary">{origin} → {destination}</h4>
                                        <Badge className="status-kongo">Confirmé</Badge>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-small text-secondary">
                                        {depTime && (
                                          <>
                                            <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {depTime.toLocaleDateString('fr-FR')}</span>
                                            <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {depTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                                          </>
                                        )}
                                        <span className="flex items-center font-mono"><Ticket className="w-3 h-3 mr-1" /> {ticket.booking_code}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-3">
                                    <div className="text-right mr-2">
                                      <p className="text-label font-black text-kongo-black">
                                        {new Intl.NumberFormat('fr-CD', { style: 'currency', currency: ticket.currency || 'CDF', maximumFractionDigits: 0 }).format(Number(ticket.total_price || 0))}
                                      </p>
                                    </div>
                                    <Button variant="ghost" size="sm" className="btn-ghost">
                                      <Download className="w-4 h-4 mr-2" />
                                      PDF
                                    </Button>
                                    <Button className="btn-secondary">
                                      <Eye className="w-4 h-4 mr-2" />
                                      Détails
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
            </motion.div>
          </TabsContent>


          <TabsContent value="favorites" className="space-y-6">
            <h2 className="text-h3 font-bold text-primary">Routes Favorites</h2>
            <p className="text-body text-secondary">Vos trajets préférés pour une réservation rapide.</p>
            {/* Favorites content would go here */}
          </TabsContent>

          <TabsContent value="gamification" className="space-y-6">
            <GamificationSystem onAchievementUnlock={() => { }} onLevelUp={() => { }} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-h3 font-bold text-primary">Analytiques</h2>
            <p className="text-body text-secondary">Analysez vos habitudes de voyage et optimisez vos déplacements.</p>
            {/* Analytics content would go here */}
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-h3 font-bold text-primary">Paramètres du compte</h2>
            <p className="text-body text-secondary">Configurez votre compte et vos préférences.</p>

            {/* Zone danger - Suppression de compte */}
            <div className="mt-8 border-2 border-red-200 rounded-2xl p-6 bg-red-50">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-red-800 mb-1">Zone de danger</h3>
                  <p className="text-sm text-red-700 mb-4">
                    La suppression de votre compte est <strong>définitive et irréversible</strong>.
                    Toutes vos données (réservations, avis, points de fidélité) seront supprimées.
                  </p>
                  <Button
                    onClick={() => setShowDeleteAccountDialog(true)}
                    style={{ backgroundColor: '#DC2626', color: '#FFFFFF' }}
                    className="bg-[#DC2626] text-white hover:bg-red-700 border-2 border-red-800 font-black text-base px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                    <span className="text-white font-black text-base">Supprimer mon compte</span>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Rating Modal */}
      <AnimatePresence>
        {showRatingModal && selectedTripToRate && (
          <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
            <DialogContent className="sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Ã‰valuez votre voyage</DialogTitle>
                <DialogDescription>
                  Votre avis aide d'autres voyageurs ? faire le bon choix
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
            onClose={() => setShowPreferences(false)}
            onPreferenceChange={(key, value) => {
              void value;
              toast.success(`Paramètre ${key} mis à jour !`);
            }}
            onOpenDeleteAccount={() => {
              setShowPreferences(false);
              setShowDeleteAccountDialog(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <AdvancedChatSystem
            onClose={() => setShowChat(false)}
            initialMessage="Bonjour ! Comment puis-je vous aider avec vos voyages ?"
          />
        )}
      </AnimatePresence>
      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        isOpen={showDeleteAccountDialog}
        onClose={() => setShowDeleteAccountDialog(false)}
        onAccountDeleted={() => {
          setShowDeleteAccountDialog(false);
          // Redirect vers la page d'accueil après suppression
          if (onPageChange) onPageChange('home');
        }}
      />
    </div>
  );
}





