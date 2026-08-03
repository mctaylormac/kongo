import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import {
  Trophy,
  Star,
  Gift,
  Target,
  Award,
  Crown,
  Zap,
  Flame,
  Gem,
  Medal,
  Shield,
  Coins,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  Lock,
  Unlock,
  Heart,
  Sparkles,
  Rocket,
  Gamepad2,
  BarChart3,
  Settings,
  Share2,
  Download,
  RefreshCw,
  Plus,
  ArrowRight,
  ArrowUp,
  Percent
} from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: 'travel' | 'social' | 'loyalty' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  requirements: string[];
  reward?: {
    type: 'discount' | 'points' | 'badge' | 'exclusive';
    value: string | number;
    description: string;
  };
}

interface UserLevel {
  current: number;
  name: string;
  nextName: string;
  xp: number;
  xpToNext: number;
  benefits: string[];
  color: string;
  icon: any;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special';
  deadline?: Date;
  progress: number;
  maxProgress: number;
  completed: boolean;
  reward: {
    xp: number;
    points: number;
    items: string[];
  };
  icon: any;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
}

interface GamificationSystemProps {
  className?: string;
  onAchievementUnlock?: (achievement: Achievement) => void;
  onLevelUp?: (newLevel: UserLevel) => void;
}

export function GamificationSystem({
  className = "",
  onAchievementUnlock,
  onLevelUp
}: GamificationSystemProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [animatingAchievements, setAnimatingAchievements] = useState<string[]>([]);
  const [userName, setUserName] = useState<string>('Voyageur');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

          if (profile?.full_name) {
            setUserName(profile.full_name);
          } else if (user.email) {
            setUserName(user.email.split('@')[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();
  }, []);

  const [userStats] = useState({
    totalPoints: 12840,
    totalTrips: 47,
    totalDistance: 18420, // km
    totalSavings: 125000, // CDF
    friendsReferred: 8,
    reviewsWritten: 23,
    photosShared: 15,
    consecutiveDays: 12,
    favoriteRoutes: 5,
    perfectRating: 98.5
  });

  const [currentLevel, setCurrentLevel] = useState<UserLevel>({
    current: 7,
    name: 'Explorateur KonGO',
    nextName: 'Maître Voyageur',
    xp: 2400,
    xpToNext: 800,
    benefits: [
      'Réduction 10% sur tous les trajets',
      'Accès prioritaire aux nouvelles routes',
      'Support client VIP',
      'Sélection de siège gratuite'
    ],
    color: 'text-purple-600',
    icon: Crown
  });

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first-trip',
      title: 'Premier Voyage',
      description: 'Effectuer votre premier trajet avec KonGO',
      icon: MapPin,
      category: 'travel',
      rarity: 'common',
      points: 100,
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      unlockedAt: new Date(Date.now() - 2592000000), // 30 days ago
      requirements: ['Réserver et effectuer un voyage'],
      reward: {
        type: 'points',
        value: 100,
        description: '100 points de fidélité'
      }
    },
    {
      id: 'distance-master',
      title: 'Maître des Kilomètres',
      description: 'Parcourir 15 000 km avec KonGO',
      icon: Target,
      category: 'travel',
      rarity: 'epic',
      points: 1500,
      progress: 18420,
      maxProgress: 15000,
      unlocked: true,
      unlockedAt: new Date(Date.now() - 86400000), // yesterday
      requirements: ['Accumuler 15 000 km de voyage'],
      reward: {
        type: 'discount',
        value: 15,
        description: '15% de réduction permanente'
      }
    },
    {
      id: 'social-butterfly',
      title: 'Papillon Social',
      description: 'Référer 10 amis à KonGO',
      icon: Users,
      category: 'social',
      rarity: 'rare',
      points: 800,
      progress: 8,
      maxProgress: 10,
      unlocked: false,
      requirements: ['Inviter 10 amis qui effectuent un voyage'],
      reward: {
        type: 'exclusive',
        value: 'VIP Status',
        description: 'Statut VIP pendant 6 mois'
      }
    },
    {
      id: 'review-champion',
      title: 'Champion des Avis',
      description: 'Écrire 50 avis de qualité',
      icon: Star,
      category: 'social',
      rarity: 'rare',
      points: 600,
      progress: 23,
      maxProgress: 50,
      unlocked: false,
      requirements: ['Rédiger 50 avis avec 4+ étoiles'],
      reward: {
        type: 'badge',
        value: 'Expert Reviewer',
        description: 'Badge visible sur le profil'
      }
    },
    {
      id: 'early-bird',
      title: 'Lève-tôt',
      description: 'Prendre 20 trajets avant 7h du matin',
      icon: Clock,
      category: 'travel',
      rarity: 'common',
      points: 300,
      progress: 12,
      maxProgress: 20,
      unlocked: false,
      requirements: ['Voyager 20 fois avant 7h'],
      reward: {
        type: 'discount',
        value: 5,
        description: '5% de bonus sur trajets matinaux'
      }
    },
    {
      id: 'loyalty-legend',
      title: 'Légende de la Fidélité',
      description: 'Maintenir un streak de 30 jours',
      icon: Flame,
      category: 'loyalty',
      rarity: 'legendary',
      points: 2500,
      progress: 12,
      maxProgress: 30,
      unlocked: false,
      requirements: ['Utiliser KonGO 30 jours consécutifs'],
      reward: {
        type: 'exclusive',
        value: 'Golden Pass',
        description: 'Accès illimité premium 1 an'
      }
    },
    {
      id: 'weekend-warrior',
      title: 'Guerrier du Weekend',
      description: 'Voyager 15 weekends consécutifs',
      icon: Calendar,
      category: 'travel',
      rarity: 'epic',
      points: 1200,
      progress: 8,
      maxProgress: 15,
      unlocked: false,
      requirements: ['Voyager chaque weekend pendant 15 semaines'],
      reward: {
        type: 'discount',
        value: 20,
        description: '20% de réduction weekend permanent'
      }
    },
    {
      id: 'perfect-passenger',
      title: 'Passager Parfait',
      description: 'Maintenir une note de 5/5 sur 25 voyages',
      icon: Medal,
      category: 'loyalty',
      rarity: 'epic',
      points: 1000,
      progress: 22,
      maxProgress: 25,
      unlocked: false,
      requirements: ['25 voyages avec note parfaite'],
      reward: {
        type: 'badge',
        value: 'Perfect Passenger',
        description: 'Badge prestigieux + priorité réservation'
      }
    }
  ]);

  const [dailyQuests, setDailyQuests] = useState<Quest[]>([
    {
      id: 'daily-check',
      title: 'Connexion Quotidienne',
      description: 'Se connecter à KonGO aujourd\'hui',
      type: 'daily',
      progress: 1,
      maxProgress: 1,
      completed: true,
      reward: { xp: 50, points: 25, items: [] },
      icon: CheckCircle2,
      difficulty: 'easy'
    },
    {
      id: 'daily-search',
      title: 'Exploration',
      description: 'Effectuer 3 recherches de trajets',
      type: 'daily',
      progress: 1,
      maxProgress: 3,
      completed: false,
      reward: { xp: 75, points: 50, items: [] },
      icon: Target,
      difficulty: 'easy'
    },
    {
      id: 'daily-share',
      title: 'Partage Social',
      description: 'Partager un trajet sur les réseaux sociaux',
      type: 'daily',
      progress: 0,
      maxProgress: 1,
      completed: false,
      reward: { xp: 100, points: 75, items: ['Bonus social'] },
      icon: Share2,
      difficulty: 'medium'
    }
  ]);

  const [weeklyQuests] = useState<Quest[]>([
    {
      id: 'weekly-trips',
      title: 'Voyageur Actif',
      description: 'Effectuer 2 voyages cette semaine',
      type: 'weekly',
      deadline: new Date(Date.now() + 345600000), // 4 days
      progress: 1,
      maxProgress: 2,
      completed: false,
      reward: { xp: 300, points: 200, items: ['Bonus XP weekend'] },
      icon: MapPin,
      difficulty: 'medium'
    },
    {
      id: 'weekly-review',
      title: 'Critique Constructif',
      description: 'Écrire 3 avis détaillés',
      type: 'weekly',
      deadline: new Date(Date.now() + 345600000),
      progress: 2,
      maxProgress: 3,
      completed: false,
      reward: { xp: 250, points: 150, items: ['Badge Reviewer'] },
      icon: Star,
      difficulty: 'medium'
    }
  ]);

  const [leaderboard] = useState([
    { rank: 1, name: 'Bamba K.', points: 28450, level: 12, avatar: '/api/placeholder/32/32' },
    { rank: 2, name: 'Sarah Nzuzi', points: 26120, level: 11, avatar: '/api/placeholder/32/32' },
    { rank: 3, name: 'Paul Mukendi', points: 24880, level: 11, avatar: '/api/placeholder/32/32' },
    { rank: 4, name: 'Vous', points: userStats.totalPoints, level: currentLevel.current, avatar: '/api/placeholder/32/32' },
    { rank: 5, name: 'Marie Kabamba', points: 11750, level: 6, avatar: '/api/placeholder/32/32' }
  ]);

  useEffect(() => {
    // Vérifier les achievements automatiquement
    const checkAchievements = () => {
      achievements.forEach(achievement => {
        if (!achievement.unlocked && achievement.progress >= achievement.maxProgress) {
          unlockAchievement(achievement.id);
        }
      });
    };

    checkAchievements();
  }, [achievements]);

  const unlockAchievement = (achievementId: string) => {
    setAchievements(prev => prev.map(achievement => {
      if (achievement.id === achievementId && !achievement.unlocked) {
        const updatedAchievement = {
          ...achievement,
          unlocked: true,
          unlockedAt: new Date()
        };

        // Animation
        setAnimatingAchievements(prev => [...prev, achievementId]);
        setTimeout(() => {
          setAnimatingAchievements(prev => prev.filter(id => id !== achievementId));
        }, 3000);

        // Notification
        toast.success(`🏆 Achievement débloqué !`, {
          description: `${achievement.title} - ${achievement.reward?.description}`,
          duration: 5000,
          action: {
            label: "Voir",
            onClick: () => setActiveTab('achievements')
          }
        });

        // Callback
        onAchievementUnlock?.(updatedAchievement);

        return updatedAchievement;
      }
      return achievement;
    }));
  };

  const completeQuest = (questId: string) => {
    setDailyQuests(prev => prev.map(quest => {
      if (quest.id === questId && !quest.completed) {
        const updatedQuest = { ...quest, completed: true, progress: quest.maxProgress };

        // Récompenses
        toast.success(`✅ Quête terminée !`, {
          description: `+${quest.reward.xp} XP, +${quest.reward.points} points`,
          action: {
            label: "Collecter",
            onClick: () => {
              // Ajouter XP et points
              setCurrentLevel(prev => ({
                ...prev,
                xp: prev.xp + quest.reward.xp
              }));
            }
          }
        });

        return updatedQuest;
      }
      return quest;
    }));
  };

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'text-gray-600 bg-gray-100 border-gray-200';
      case 'rare': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'epic': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'legendary': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    }
  };

  const getDifficultyColor = (difficulty: Quest['difficulty']) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'hard': return 'text-red-600 bg-red-100';
      case 'expert': return 'text-purple-600 bg-purple-100';
    }
  };

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec niveau et stats principales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-kongo-black via-kongo-black-light to-kongo-black p-6 rounded-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-16 h-16 border-4 border-kongo-lime">
                <AvatarImage src="/api/placeholder/64/64" />
                <AvatarFallback className="bg-kongo-lime text-kongo-black font-bold">
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase() || 'V'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-kongo-lime text-kongo-black rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                {currentLevel.current}
              </div>
            </div>

            <div>
              <h2 className="text-h3 text-on-black font-bold">{userName}</h2>
              <p className="text-body text-on-black opacity-80">
                {userStats.totalPoints.toLocaleString()} points • Rang #{leaderboard.find(u => u.name === 'Vous')?.rank}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-5 h-5 text-kongo-lime" />
              <span className="text-h4 text-on-black font-bold">
                {currentLevel.xp}/{currentLevel.xp + currentLevel.xpToNext} XP
              </span>
            </div>
            <Progress
              value={(currentLevel.xp / (currentLevel.xp + currentLevel.xpToNext)) * 100}
              className="w-48 h-3 bg-white/20"
            />
            <p className="text-body-small text-on-black opacity-60 mt-1">
              {currentLevel.xpToNext} XP jusqu'à {currentLevel.nextName}
            </p>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 rounded-lg p-4 text-center">
            <MapPin className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
            <div className="text-h4 text-on-black font-bold">{userStats.totalTrips}</div>
            <div className="text-body-small text-on-black opacity-80">Voyages</div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 text-center">
            <Target className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
            <div className="text-h4 text-on-black font-bold">
              {(userStats.totalDistance / 1000).toFixed(1)}k
            </div>
            <div className="text-body-small text-on-black opacity-80">Kilomètres</div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 text-center">
            <Users className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
            <div className="text-h4 text-on-black font-bold">{userStats.friendsReferred}</div>
            <div className="text-body-small text-on-black opacity-80">Références</div>
          </div>

          <div className="bg-white/10 rounded-lg p-4 text-center">
            <Flame className="w-6 h-6 text-kongo-lime mx-auto mb-2" />
            <div className="text-h4 text-on-black font-bold">{userStats.consecutiveDays}</div>
            <div className="text-body-small text-on-black opacity-80">Jours streak</div>
          </div>
        </div>
      </motion.div>

      {/* Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-surface-secondary">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Achievements</span>
          </TabsTrigger>
          <TabsTrigger value="quests" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Quêtes</span>
          </TabsTrigger>
          <TabsTrigger value="rewards" className="flex items-center space-x-2">
            <Gift className="w-4 h-4" />
            <span className="hidden sm:inline">Récompenses</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center space-x-2">
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Classement</span>
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progression niveau */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-kongo-black" />
                  <span>Progression</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-label">Niveau actuel</span>
                    <Badge className="status-kongo">{currentLevel.name}</Badge>
                  </div>
                  <Progress value={75} className="h-3" />
                  <p className="text-body-small text-secondary">
                    Plus que {currentLevel.xpToNext} XP pour le niveau suivant
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-label font-semibold">Avantages actuels</h4>
                  {currentLevel.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-kongo-lime" />
                      <span className="text-body-small">{benefit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements récents */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Trophy className="w-5 h-5 text-kongo-black" />
                  <span>Achievements Récents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements
                    .filter(a => a.unlocked)
                    .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
                    .slice(0, 3)
                    .map((achievement) => {
                      const Icon = achievement.icon;
                      return (
                        <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-surface-secondary rounded-lg">
                          <div className={`p-2 rounded-lg ${getRarityColor(achievement.rarity)}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h5 className="text-label font-medium">{achievement.title}</h5>
                            <p className="text-body-small text-secondary">{achievement.description}</p>
                          </div>
                          <Badge className="status-success text-xs">
                            +{achievement.points}
                          </Badge>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quêtes quotidiennes rapides */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-kongo-black" />
                  <span>Quêtes du Jour</span>
                </div>
                <Badge className="status-info">
                  {dailyQuests.filter(q => q.completed).length}/{dailyQuests.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dailyQuests.map((quest) => {
                  const Icon = quest.icon;
                  return (
                    <div
                      key={quest.id}
                      className={`p-4 rounded-lg border transition-all ${quest.completed
                          ? 'bg-green-50 border-green-200'
                          : 'bg-surface-tertiary border-border-secondary hover:border-kongo-lime'
                        }`}
                    >
                      <div className="flex items-center space-x-2 mb-3">
                        <Icon className={`w-5 h-5 ${quest.completed ? 'text-green-600' : 'text-kongo-black'}`} />
                        <span className={`text-label font-medium ${quest.completed ? 'text-green-700' : ''}`}>
                          {quest.title}
                        </span>
                      </div>

                      <p className="text-body-small text-secondary mb-3">
                        {quest.description}
                      </p>

                      <div className="space-y-2">
                        <Progress
                          value={(quest.progress / quest.maxProgress) * 100}
                          className="h-2"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-body-xs text-tertiary">
                            {quest.progress}/{quest.maxProgress}
                          </span>
                          {quest.completed ? (
                            <Badge className="status-success text-xs">Terminé</Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => completeQuest(quest.id)}
                              className="btn-outline-lime text-xs px-2 py-1"
                            >
                              Continuer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements */}
        <TabsContent value="achievements" className="space-y-6">
          {/* Filtres */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'btn-primary' : 'btn-ghost'}
            >
              Tous ({achievements.length})
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'travel' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('travel')}
              className={selectedCategory === 'travel' ? 'btn-primary' : 'btn-ghost'}
            >
              <MapPin className="w-4 h-4 mr-1" />
              Voyage ({achievements.filter(a => a.category === 'travel').length})
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'social' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('social')}
              className={selectedCategory === 'social' ? 'btn-primary' : 'btn-ghost'}
            >
              <Users className="w-4 h-4 mr-1" />
              Social ({achievements.filter(a => a.category === 'social').length})
            </Button>
            <Button
              size="sm"
              variant={selectedCategory === 'loyalty' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('loyalty')}
              className={selectedCategory === 'loyalty' ? 'btn-primary' : 'btn-ghost'}
            >
              <Heart className="w-4 h-4 mr-1" />
              Fidélité ({achievements.filter(a => a.category === 'loyalty').length})
            </Button>
          </div>

          {/* Grille des achievements */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredAchievements.map((achievement) => {
                const Icon = achievement.icon;
                const isAnimating = animatingAchievements.includes(achievement.id);

                return (
                  <motion.div
                    key={achievement.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      scale: isAnimating ? [1, 1.05, 1] : 1,
                      rotateY: isAnimating ? [0, 10, 0] : 0
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{
                      duration: isAnimating ? 0.6 : 0.3,
                      repeat: isAnimating ? 2 : 0
                    }}
                  >
                    <Card className={`card-interactive relative overflow-hidden ${achievement.unlocked ? '' : 'opacity-75'
                      }`}>
                      {/* Effet de brillance pour les achievements légendaires */}
                      {achievement.rarity === 'legendary' && achievement.unlocked && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent animate-pulse" />
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className={`p-3 rounded-xl ${getRarityColor(achievement.rarity)} relative`}>
                            {achievement.unlocked ? (
                              <Icon className="w-6 h-6" />
                            ) : (
                              <div className="relative">
                                <Icon className="w-6 h-6 opacity-50" />
                                <Lock className="w-3 h-3 absolute -bottom-1 -right-1 text-quaternary" />
                              </div>
                            )}
                            {isAnimating && (
                              <div className="absolute inset-0 bg-kongo-lime/20 rounded-xl animate-ping" />
                            )}
                          </div>

                          <div className="text-right">
                            <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                              {achievement.rarity.toUpperCase()}
                            </Badge>
                            <div className="text-h5 font-bold text-kongo-black mt-1">
                              +{achievement.points}
                            </div>
                          </div>
                        </div>

                        <CardTitle className={`text-h5 ${achievement.unlocked ? '' : 'text-tertiary'}`}>
                          {achievement.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <p className="text-body-small text-secondary">
                          {achievement.description}
                        </p>

                        {/* Progression */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-body-xs text-tertiary">Progression</span>
                            <span className="text-body-xs font-medium">
                              {achievement.progress}/{achievement.maxProgress}
                            </span>
                          </div>
                          <Progress
                            value={(achievement.progress / achievement.maxProgress) * 100}
                            className="h-2"
                          />
                        </div>

                        {/* Récompense */}
                        {achievement.reward && (
                          <div className="bg-surface-kongo-lime-light p-3 rounded-lg border border-kongo-lime/20">
                            <div className="flex items-center space-x-2">
                              <Gift className="w-4 h-4 text-kongo-lime-dark" />
                              <span className="text-body-small font-medium text-kongo-lime-dark">
                                Récompense: {achievement.reward.description}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Bouton d'action */}
                        {achievement.unlocked ? (
                          <div className="flex items-center justify-center space-x-2 text-success">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-body-small font-medium">Débloqué</span>
                            {achievement.unlockedAt && (
                              <span className="text-body-xs text-tertiary">
                                • {achievement.unlockedAt.toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full btn-outline-lime"
                            onClick={() => {
                              toast.info("🎯 Objectif en cours", {
                                description: `Plus que ${achievement.maxProgress - achievement.progress} pour débloquer`
                              });
                            }}
                          >
                            <Target className="w-4 h-4 mr-2" />
                            En cours
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </TabsContent>

        {/* Quêtes */}
        <TabsContent value="quests" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quêtes quotidiennes */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-kongo-black" />
                    <span>Quotidiennes</span>
                  </div>
                  <Badge className="status-info">
                    Se renouvellent dans 18h
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dailyQuests.map((quest) => {
                  const Icon = quest.icon;
                  return (
                    <div
                      key={quest.id}
                      className={`p-4 border rounded-lg ${quest.completed
                          ? 'bg-green-50 border-green-200'
                          : 'border-border-secondary hover:border-kongo-lime'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 ${quest.completed ? 'text-green-600' : 'text-kongo-black'}`} />
                          <div>
                            <h4 className="text-label font-medium">{quest.title}</h4>
                            <p className="text-body-xs text-secondary">{quest.description}</p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getDifficultyColor(quest.difficulty)}`}>
                          {quest.difficulty}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Progress
                          value={(quest.progress / quest.maxProgress) * 100}
                          className="h-2"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-body-xs text-tertiary">
                            {quest.progress}/{quest.maxProgress}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-body-xs text-kongo-lime-dark font-medium">
                              +{quest.reward.xp} XP, +{quest.reward.points} pts
                            </span>
                            {quest.completed && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Quêtes hebdomadaires */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-kongo-black" />
                    <span>Hebdomadaires</span>
                  </div>
                  <Badge className="status-warning">
                    4 jours restants
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {weeklyQuests.map((quest) => {
                  const Icon = quest.icon;
                  return (
                    <div
                      key={quest.id}
                      className={`p-4 border rounded-lg ${quest.completed
                          ? 'bg-green-50 border-green-200'
                          : 'border-border-secondary hover:border-kongo-lime'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-5 h-5 ${quest.completed ? 'text-green-600' : 'text-kongo-black'}`} />
                          <div>
                            <h4 className="text-label font-medium">{quest.title}</h4>
                            <p className="text-body-xs text-secondary">{quest.description}</p>
                          </div>
                        </div>
                        <Badge className={`text-xs ${getDifficultyColor(quest.difficulty)}`}>
                          {quest.difficulty}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Progress
                          value={(quest.progress / quest.maxProgress) * 100}
                          className="h-2"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-body-xs text-tertiary">
                            {quest.progress}/{quest.maxProgress}
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className="text-body-xs text-purple-600 font-medium">
                              +{quest.reward.xp} XP, +{quest.reward.points} pts
                            </span>
                            {quest.completed && (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Récompenses */}
        <TabsContent value="rewards" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Réduction 20%',
                description: 'Sur votre prochain voyage',
                cost: 500,
                type: 'discount',
                icon: Percent,
                available: true
              },
              {
                title: 'Surclassement Gratuit',
                description: 'Siège premium offert',
                cost: 800,
                type: 'upgrade',
                icon: ArrowUp,
                available: true
              },
              {
                title: 'Pass VIP Mensuel',
                description: 'Avantages exclusifs 30 jours',
                cost: 2000,
                type: 'premium',
                icon: Crown,
                available: false
              },
              {
                title: 'Badge Personnalisé',
                description: 'Créez votre propre badge',
                cost: 1500,
                type: 'cosmetic',
                icon: Star,
                available: true
              },
              {
                title: 'Double XP',
                description: 'Weekend avec XP doublé',
                cost: 1000,
                type: 'boost',
                icon: Zap,
                available: true
              },
              {
                title: 'Voyage Mystère',
                description: 'Destination surprise offerte',
                cost: 5000,
                type: 'special',
                icon: Gift,
                available: false
              }
            ].map((reward, index) => {
              const Icon = reward.icon;
              const canAfford = userStats.totalPoints >= reward.cost;

              return (
                <Card key={index} className={`card-interactive ${!reward.available ? 'opacity-50' : ''
                  }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-kongo-lime/10 rounded-lg">
                        <Icon className="w-6 h-6 text-kongo-lime-dark" />
                      </div>
                      <div className="text-right">
                        <div className="text-h5 font-bold text-kongo-black">
                          {reward.cost.toLocaleString()}
                        </div>
                        <div className="text-body-xs text-secondary">points</div>
                      </div>
                    </div>
                    <CardTitle className="text-h5">{reward.title}</CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-body-small text-secondary">
                      {reward.description}
                    </p>

                    <Button
                      className="w-full"
                      disabled={!reward.available || !canAfford}
                      onClick={() => {
                        if (canAfford && reward.available) {
                          toast.success(`🎁 ${reward.title} réclamé !`, {
                            description: reward.description
                          });
                        }
                      }}
                    >
                      {!reward.available ? (
                        <>
                          <Lock className="w-4 h-4 mr-2" />
                          Bientôt disponible
                        </>
                      ) : !canAfford ? (
                        <>
                          <Coins className="w-4 h-4 mr-2" />
                          Points insuffisants
                        </>
                      ) : (
                        <>
                          <Gift className="w-4 h-4 mr-2" />
                          Échanger
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Classement */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Crown className="w-5 h-5 text-kongo-black" />
                  <span>Classement Mensuel</span>
                </div>
                <Badge className="status-info">
                  Mise à jour en temps réel
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((user, index) => (
                  <motion.div
                    key={user.rank}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center space-x-4 p-4 rounded-lg border ${user.name === 'Vous'
                        ? 'bg-surface-kongo-lime-light border-kongo-lime/30'
                        : 'border-border-secondary hover:border-kongo-lime/50'
                      }`}
                  >
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${user.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                        user.rank === 2 ? 'bg-gray-100 text-gray-700' :
                          user.rank === 3 ? 'bg-orange-100 text-orange-700' :
                            'bg-surface-tertiary text-secondary'
                      }`}>
                      {user.rank <= 3 ? (
                        user.rank === 1 ? <Crown className="w-4 h-4" /> :
                          user.rank === 2 ? <Medal className="w-4 h-4" /> :
                            <Award className="w-4 h-4" />
                      ) : (
                        user.rank
                      )}
                    </div>

                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-label font-semibold ${user.name === 'Vous' ? 'text-kongo-lime-dark' : ''
                          }`}>
                          {user.name}
                        </span>
                        {user.name === 'Vous' && (
                          <Badge className="status-kongo text-xs">Vous</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-body-small text-secondary">
                        <span>Niveau {user.level}</span>
                        <span>•</span>
                        <span>{user.points.toLocaleString()} points</span>
                      </div>
                    </div>

                    {user.rank <= 3 && (
                      <div className="text-right">
                        <Badge className={`text-xs ${user.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                            user.rank === 2 ? 'bg-gray-100 text-gray-700' :
                              'bg-orange-100 text-orange-700'
                          }`}>
                          {user.rank === 1 ? '🥇 Or' :
                            user.rank === 2 ? '🥈 Argent' :
                              '🥉 Bronze'}
                        </Badge>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-surface-secondary rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-kongo-lime" />
                    <span className="text-label font-medium">Votre progression</span>
                  </div>
                  <Button size="sm" className="btn-outline-lime">
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-h4 font-bold text-kongo-black">+3</div>
                    <div className="text-body-xs text-secondary">Positions ce mois</div>
                  </div>
                  <div className="text-center">
                    <div className="text-h4 font-bold text-kongo-black">2,400</div>
                    <div className="text-body-xs text-secondary">Points gagnés</div>
                  </div>
                  <div className="text-center">
                    <div className="text-h4 font-bold text-kongo-black">15</div>
                    <div className="text-body-xs text-secondary">Achievements</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
