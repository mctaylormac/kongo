import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Slider } from "./ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import {
  User,
  Bell,
  Palette,
  Globe,
  Shield,
  Smartphone,
  Car,
  Heart,
  Settings,
  MapPin,
  Clock,
  CreditCard,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  Accessibility,
  Languages,
  Zap,
  Filter,
  Star,
  Award,
  Gift,
  Save,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Share2
} from "lucide-react";

interface UserPreferencesManagerProps {
  onPreferenceChange?: (key: string, value: any) => void;
  onClose?: () => void;
  className?: string;
}

interface UserPreferences {
  // Profil personnel
  profile: {
    name: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    preferredLanguage: 'fr' | 'en';
    city: string;
    loyaltyStatus: 'bronze' | 'silver' | 'gold' | 'platinum';
  };

  // Préférences de voyage
  travel: {
    preferredSeatType: 'window' | 'aisle' | 'any';
    preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'any';
    maxTravelDuration: number; // en heures
    budgetRange: [number, number]; // min, max en CDF
    comfortLevel: 'economy' | 'comfort' | 'premium';
    frequentRoutes: string[];
    preferredAgencies: string[];
    accessibilityNeeds: string[];
  };

  // Notifications
  notifications: {
    email: {
      bookingConfirmation: boolean;
      priceAlerts: boolean;
      promotions: boolean;
      tripReminders: boolean;
      newsletter: boolean;
    };
    push: {
      realTimeUpdates: boolean;
      departureAlerts: boolean;
      priceDrops: boolean;
      newRoutes: boolean;
      systemMaintenance: boolean;
    };
    sms: {
      bookingConfirmation: boolean;
      tripReminders: boolean;
      emergencyAlerts: boolean;
    };
    frequency: 'instant' | 'daily' | 'weekly' | 'monthly';
  };

  // Interface utilisateur
  ui: {
    theme: 'light' | 'dark' | 'auto';
    colorScheme: 'default' | 'highContrast' | 'colorBlind';
    fontSize: number; // 0.8 à 1.5
    animations: boolean;
    soundEffects: boolean;
    compactMode: boolean;
    autoSave: boolean;
    quickActions: string[];
  };

  // Paiement et sécurité
  payment: {
    preferredMethod: 'mobile_money' | 'card' | 'bank_transfer' | 'cash';
    savedPaymentMethods: boolean;
    autoFillPayment: boolean;
    receiptFormat: 'email' | 'sms' | 'both';
    invoiceReminders: boolean;
    twoFactorAuth: boolean;
    sessionTimeout: number; // en minutes
  };

  // Recommandations et IA
  recommendations: {
    enablePersonalization: boolean;
    shareDataForML: boolean;
    smartSuggestions: boolean;
    priceOptimization: boolean;
    routeOptimization: boolean;
    weatherIntegration: boolean;
    eventBasedSuggestions: boolean;
  };
}

export function UserPreferencesManager({
  onPreferenceChange,
  onClose,
  className = ""
}: UserPreferencesManagerProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    profile: {
      name: 'Voyageur',
      email: '',
      phone: '',
      dateOfBirth: '',
      preferredLanguage: 'fr',
      city: '',
      loyaltyStatus: 'bronze'
    },
    travel: {
      preferredSeatType: 'window',
      preferredTimeOfDay: 'morning',
      maxTravelDuration: 16,
      budgetRange: [50000, 200000],
      comfortLevel: 'comfort',
      frequentRoutes: ['Kinshasa-Lubumbashi', 'Kinshasa-Kisangani'],
      preferredAgencies: ['Trans-Congo Express', 'Kivu Bus'],
      accessibilityNeeds: []
    },
    notifications: {
      email: {
        bookingConfirmation: true,
        priceAlerts: true,
        promotions: false,
        tripReminders: true,
        newsletter: false
      },
      push: {
        realTimeUpdates: true,
        departureAlerts: true,
        priceDrops: true,
        newRoutes: false,
        systemMaintenance: true
      },
      sms: {
        bookingConfirmation: true,
        tripReminders: true,
        emergencyAlerts: true
      },
      frequency: 'instant'
    },
    ui: {
      theme: 'light',
      colorScheme: 'default',
      fontSize: 1,
      animations: true,
      soundEffects: true,
      compactMode: false,
      autoSave: true,
      quickActions: ['search', 'favorites', 'history', 'support']
    },
    payment: {
      preferredMethod: 'mobile_money',
      savedPaymentMethods: true,
      autoFillPayment: true,
      receiptFormat: 'both',
      invoiceReminders: true,
      twoFactorAuth: true,
      sessionTimeout: 30
    },
    recommendations: {
      enablePersonalization: true,
      shareDataForML: true,
      smartSuggestions: true,
      priceOptimization: true,
      routeOptimization: true,
      weatherIntegration: true,
      eventBasedSuggestions: false
    }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profile) {
            setPreferences(prev => ({
              ...prev,
              profile: {
                ...prev.profile,
                name: profile.full_name || user.email?.split('@')[0] || 'Voyageur',
                email: profile.email || user.email || '',
                phone: profile.phone_number || '',
                city: profile.city || '',
                dateOfBirth: profile.date_of_birth || ''
              }
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    fetchProfile();

    // Charger les préférences depuis le localStorage ou API
    const savedPrefs = localStorage.getItem('kongo-user-preferences');
    if (savedPrefs) {
      try {
        const parsed = JSON.parse(savedPrefs);
        setPreferences(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
      }
    }
  }, []);

  const updatePreference = (section: keyof UserPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
    onPreferenceChange?.(key, value);
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      // Simuler sauvegarde API
      await new Promise(resolve => setTimeout(resolve, 1000));

      localStorage.setItem('kongo-user-preferences', JSON.stringify(preferences));
      setHasChanges(false);

      toast.success("🎉 Préférences sauvegardées", {
        description: "Vos paramètres ont été mis à jour avec succès",
        action: {
          label: "Voir profil",
          onClick: () => setActiveTab('profile')
        }
      });
    } catch (error) {
      toast.error("❌ Erreur de sauvegarde", {
        description: "Impossible de sauvegarder vos préférences"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    toast("🔄 Réinitialiser les préférences ?", {
      description: "Cette action est irréversible",
      action: {
        label: "Confirmer",
        onClick: () => {
          // Reset logique ici
          setHasChanges(true);
          toast.success("✅ Préférences réinitialisées");
        }
      },
      cancel: {
        label: "Annuler",
        onClick: () => { }
      }
    });
  };

  const exportPreferences = () => {
    const dataStr = JSON.stringify(preferences, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `kongo-preferences-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success("📁 Préférences exportées", {
      description: "Fichier téléchargé avec succès"
    });
  };

  const getLoyaltyBadgeColor = (status: string) => {
    switch (status) {
      case 'bronze': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'silver': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'gold': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'platinum': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-surface-tertiary text-secondary border-border-secondary';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`w-full max-w-6xl mx-auto ${className}`}
    >
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-kongo-black rounded-xl">
            <Settings className="w-8 h-8 text-on-black" />
          </div>
          <div>
            <h1 className="text-h2 text-primary font-bold">Mes Préférences</h1>
            <p className="text-body text-secondary">
              Personnalisez votre expérience KonGO selon vos besoins
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {hasChanges && (
            <Badge className="status-warning">
              <Save className="w-3 h-3 mr-1" />
              Modifications non sauvées
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={exportPreferences}
            className="btn-ghost"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="btn-ghost"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          {onClose && (
            <Button
              size="sm"
              onClick={onClose}
              className="btn-outline"
            >
              Fermer
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Navigation des onglets */}
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 h-auto p-1 bg-surface-secondary">
          <TabsTrigger value="profile" className="flex items-center space-x-2 py-3">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="travel" className="flex items-center space-x-2 py-3">
            <Car className="w-4 h-4" />
            <span className="hidden sm:inline">Voyage</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2 py-3">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="ui" className="flex items-center space-x-2 py-3">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Interface</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center space-x-2 py-3">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Paiement</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center space-x-2 py-3">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">IA</span>
          </TabsTrigger>
        </TabsList>

        {/* Profil Personnel */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <User className="w-5 h-5 text-kongo-black" />
                <span>Informations Personnelles</span>
                <Badge className={`${getLoyaltyBadgeColor(preferences.profile.loyaltyStatus)} ml-auto`}>
                  <Award className="w-3 h-3 mr-1" />
                  {preferences.profile.loyaltyStatus.toUpperCase()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    value={preferences.profile.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePreference('profile', 'name', e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={preferences.profile.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePreference('profile', 'email', e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={preferences.profile.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePreference('profile', 'phone', e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville de résidence</Label>
                  <Select
                    value={preferences.profile.city}
                    onValueChange={(value: string) => updatePreference('profile', 'city', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kinshasa">Kinshasa</SelectItem>
                      <SelectItem value="Lubumbashi">Lubumbashi</SelectItem>
                      <SelectItem value="Goma">Goma</SelectItem>
                      <SelectItem value="Kisangani">Kisangani</SelectItem>
                      <SelectItem value="Bukavu">Bukavu</SelectItem>
                      <SelectItem value="Mbuji-Mayi">Mbuji-Mayi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Langue préférée</Label>
                  <Select
                    value={preferences.profile.preferredLanguage}
                    onValueChange={(value: 'fr' | 'en') => updatePreference('profile', 'preferredLanguage', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthdate">Date de naissance</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={preferences.profile.dateOfBirth}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePreference('profile', 'dateOfBirth', e.target.value)}
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Préférences de Voyage */}
        <TabsContent value="travel" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Car className="w-5 h-5 text-kongo-black" />
                  <span>Préférences de Siège</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Position préférée</Label>
                  <Select
                    value={preferences.travel.preferredSeatType}
                    onValueChange={(value: 'window' | 'aisle' | 'any') => updatePreference('travel', 'preferredSeatType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="window">🪟 Fenêtre</SelectItem>
                      <SelectItem value="aisle">🚶 Couloir</SelectItem>
                      <SelectItem value="any">⚡ Peu importe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Niveau de confort</Label>
                  <Select
                    value={preferences.travel.comfortLevel}
                    onValueChange={(value: 'economy' | 'comfort' | 'premium') => updatePreference('travel', 'comfortLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="economy">💺 Économique</SelectItem>
                      <SelectItem value="comfort">🛋️ Confort</SelectItem>
                      <SelectItem value="premium">✨ Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-kongo-black" />
                  <span>Horaires Préférés</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Moment de la journée</Label>
                  <Select
                    value={preferences.travel.preferredTimeOfDay}
                    onValueChange={(value: 'morning' | 'afternoon' | 'evening' | 'night' | 'any') => updatePreference('travel', 'preferredTimeOfDay', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">🌅 Matin (6h-12h)</SelectItem>
                      <SelectItem value="afternoon">☀️ Après-midi (12h-18h)</SelectItem>
                      <SelectItem value="evening">🌆 Soirée (18h-22h)</SelectItem>
                      <SelectItem value="night">🌙 Nuit (22h-6h)</SelectItem>
                      <SelectItem value="any">⏰ Peu importe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Durée maximale de voyage: {preferences.travel.maxTravelDuration}h</Label>
                  <Slider
                    value={[preferences.travel.maxTravelDuration]}
                    onValueChange={([value]: number[]) => updatePreference('travel', 'maxTravelDuration', value)}
                    max={24}
                    min={4}
                    step={2}
                    className="w-full"
                  />
                  <div className="flex justify-between text-body-small text-quaternary">
                    <span>4h</span>
                    <span>24h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Filter className="w-5 h-5 text-kongo-black" />
                <span>Budget et Filtres Avancés</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>
                  Fourchette budgétaire: {preferences.travel.budgetRange[0].toLocaleString()} - {preferences.travel.budgetRange[1].toLocaleString()} CDF
                </Label>
                <Slider
                  value={preferences.travel.budgetRange}
                  onValueChange={(value: number[]) => updatePreference('travel', 'budgetRange', value)}
                  max={500000}
                  min={25000}
                  step={25000}
                  className="w-full"
                />
                <div className="flex justify-between text-body-small text-quaternary">
                  <span>25,000 CDF</span>
                  <span>500,000 CDF</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Email */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-kongo-black" />
                  <span>Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(preferences.notifications.email).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={`email-${key}`} className="text-label">
                      {key === 'bookingConfirmation' && 'Confirmations'}
                      {key === 'priceAlerts' && 'Alertes prix'}
                      {key === 'promotions' && 'Promotions'}
                      {key === 'tripReminders' && 'Rappels voyage'}
                      {key === 'newsletter' && 'Newsletter'}
                    </Label>
                    <Switch
                      id={`email-${key}`}
                      checked={value}
                      onCheckedChange={(checked: boolean) =>
                        updatePreference('notifications', 'email', {
                          ...preferences.notifications.email,
                          [key]: checked
                        })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Push */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-kongo-black" />
                  <span>Push</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(preferences.notifications.push).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={`push-${key}`} className="text-label">
                      {key === 'realTimeUpdates' && 'Mises à jour temps réel'}
                      {key === 'departureAlerts' && 'Alertes départ'}
                      {key === 'priceDrops' && 'Baisses de prix'}
                      {key === 'newRoutes' && 'Nouvelles routes'}
                      {key === 'systemMaintenance' && 'Maintenance système'}
                    </Label>
                    <Switch
                      id={`push-${key}`}
                      checked={value}
                      onCheckedChange={(checked: boolean) =>
                        updatePreference('notifications', 'push', {
                          ...preferences.notifications.push,
                          [key]: checked
                        })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SMS */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Smartphone className="w-5 h-5 text-kongo-black" />
                  <span>SMS</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(preferences.notifications.sms).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={`sms-${key}`} className="text-label">
                      {key === 'bookingConfirmation' && 'Confirmations'}
                      {key === 'tripReminders' && 'Rappels voyage'}
                      {key === 'emergencyAlerts' && 'Alertes urgence'}
                    </Label>
                    <Switch
                      id={`sms-${key}`}
                      checked={value}
                      onCheckedChange={(checked: boolean) =>
                        updatePreference('notifications', 'sms', {
                          ...preferences.notifications.sms,
                          [key]: checked
                        })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interface Utilisateur */}
        <TabsContent value="ui" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Palette className="w-5 h-5 text-kongo-black" />
                  <span>Apparence</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Thème</Label>
                  <Select
                    value={preferences.ui.theme}
                    onValueChange={(value: 'light' | 'dark' | 'auto') => updatePreference('ui', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">☀️ Clair</SelectItem>
                      <SelectItem value="dark">🌙 Sombre</SelectItem>
                      <SelectItem value="auto">⚡ Automatique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Schéma de couleurs</Label>
                  <Select
                    value={preferences.ui.colorScheme}
                    onValueChange={(value: 'default' | 'highContrast' | 'colorBlind') => updatePreference('ui', 'colorScheme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">🎨 Par défaut</SelectItem>
                      <SelectItem value="highContrast">🔍 Contraste élevé</SelectItem>
                      <SelectItem value="colorBlind">👁️ Daltonisme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Taille du texte: {Math.round(preferences.ui.fontSize * 100)}%</Label>
                  <Slider
                    value={[preferences.ui.fontSize]}
                    onValueChange={([value]: number[]) => updatePreference('ui', 'fontSize', value)}
                    max={1.5}
                    min={0.8}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-body-small text-quaternary">
                    <span>80%</span>
                    <span>150%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-kongo-black" />
                  <span>Comportement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="animations">Animations</Label>
                  <Switch
                    id="animations"
                    checked={preferences.ui.animations}
                    onCheckedChange={(checked: boolean) => updatePreference('ui', 'animations', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sounds">Effets sonores</Label>
                  <Switch
                    id="sounds"
                    checked={preferences.ui.soundEffects}
                    onCheckedChange={(checked: boolean) => updatePreference('ui', 'soundEffects', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="compact">Mode compact</Label>
                  <Switch
                    id="compact"
                    checked={preferences.ui.compactMode}
                    onCheckedChange={(checked: boolean) => updatePreference('ui', 'compactMode', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="autosave">Sauvegarde automatique</Label>
                  <Switch
                    id="autosave"
                    checked={preferences.ui.autoSave}
                    onCheckedChange={(checked: boolean) => updatePreference('ui', 'autoSave', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Paiement et Sécurité */}
        <TabsContent value="payment" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-kongo-black" />
                  <span>Méthodes de Paiement</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Méthode préférée</Label>
                  <Select
                    value={preferences.payment.preferredMethod}
                    onValueChange={(value: 'mobile_money' | 'card' | 'bank_transfer' | 'cash') => updatePreference('payment', 'preferredMethod', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile_money">📱 Mobile Money</SelectItem>
                      <SelectItem value="card">💳 Carte bancaire</SelectItem>
                      <SelectItem value="bank_transfer">🏦 Virement bancaire</SelectItem>
                      <SelectItem value="cash">💵 Espèces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="save-payment">Sauvegarder méthodes</Label>
                  <Switch
                    id="save-payment"
                    checked={preferences.payment.savedPaymentMethods}
                    onCheckedChange={(checked: boolean) => updatePreference('payment', 'savedPaymentMethods', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="autofill">Remplissage automatique</Label>
                  <Switch
                    id="autofill"
                    checked={preferences.payment.autoFillPayment}
                    onCheckedChange={(checked: boolean) => updatePreference('payment', 'autoFillPayment', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-kongo-black" />
                  <span>Sécurité</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="2fa">Authentification 2FA</Label>
                  <Switch
                    id="2fa"
                    checked={preferences.payment.twoFactorAuth}
                    onCheckedChange={(checked: boolean) => updatePreference('payment', 'twoFactorAuth', checked)}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Expiration session: {preferences.payment.sessionTimeout} min</Label>
                  <Slider
                    value={[preferences.payment.sessionTimeout]}
                    onValueChange={([value]: number[]) => updatePreference('payment', 'sessionTimeout', value)}
                    max={120}
                    min={15}
                    step={15}
                    className="w-full"
                  />
                  <div className="flex justify-between text-body-small text-quaternary">
                    <span>15 min</span>
                    <span>2h</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* IA et Recommandations */}
        <TabsContent value="ai" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-kongo-black" />
                <span>Intelligence Artificielle</span>
                <Badge className="status-kongo ml-auto">
                  <Star className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-surface-kongo-lime-light p-4 rounded-lg border border-kongo-lime/20">
                <p className="text-body-small text-kongo-lime-dark">
                  <strong>🤖 IA KonGO :</strong> Notre intelligence artificielle apprend de vos habitudes
                  pour vous proposer les meilleures recommandations de voyage personnalisées.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="personalization">Personnalisation activée</Label>
                    <Switch
                      id="personalization"
                      checked={preferences.recommendations.enablePersonalization}
                      onCheckedChange={(checked: boolean) => updatePreference('recommendations', 'enablePersonalization', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="ml-data">Partage données ML</Label>
                    <Switch
                      id="ml-data"
                      checked={preferences.recommendations.shareDataForML}
                      onCheckedChange={(checked: boolean) => updatePreference('recommendations', 'shareDataForML', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="smart-suggestions">Suggestions intelligentes</Label>
                    <Switch
                      id="smart-suggestions"
                      checked={preferences.recommendations.smartSuggestions}
                      onCheckedChange={(checked: boolean) => updatePreference('recommendations', 'smartSuggestions', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="price-optimization">Optimisation prix</Label>
                    <Switch
                      id="price-optimization"
                      checked={preferences.recommendations.priceOptimization}
                      onCheckedChange={(checked: boolean) => updatePreference('recommendations', 'priceOptimization', checked)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="route-optimization">Optimisation trajets</Label>
                    <Switch
                      id="route-optimization"
                      checked={preferences.recommendations.routeOptimization}
                      onCheckedChange={(checked: boolean) => updatePreference('recommendations', 'routeOptimization', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="weather-integration">Intégration météo</Label>
                    <Switch
                      id="weather-integration"
                      checked={preferences.recommendations.weatherIntegration}
                      onCheckedChange={(checked: boolean) => updatePreference('recommendations', 'weatherIntegration', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="event-suggestions">Suggestions événements</Label>
                    <Switch
                      id="event-suggestions"
                      checked={preferences.recommendations.eventBasedSuggestions}
                      onCheckedChange={(checked: boolean) => updatePreference('recommendations', 'eventBasedSuggestions', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions finales */}
      <div className="flex items-center justify-between p-6 bg-surface-secondary rounded-lg border border-border-primary">
        <div>
          <p className="text-label font-semibold text-primary">
            {hasChanges ? 'Modifications en attente' : 'Préférences à jour'}
          </p>
          <p className="text-body-small text-secondary">
            {hasChanges
              ? 'N\'oubliez pas de sauvegarder vos changements'
              : 'Dernière sauvegarde : ' + new Date().toLocaleString('fr-FR')
            }
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.json';
              input.onchange = (e: Event) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev: ProgressEvent<FileReader>) => {
                    try {
                      const imported = JSON.parse(ev.target?.result as string);
                      setPreferences(imported);
                      setHasChanges(true);
                      toast.success("📁 Préférences importées");
                    } catch (error) {
                      toast.error("❌ Fichier invalide");
                    }
                  };
                  reader.readAsText(file);
                }
              };
              input.click();
            }}
            className="btn-ghost"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importer
          </Button>

          <Button
            onClick={savePreferences}
            disabled={!hasChanges || saving}
            className="btn-primary min-w-[120px]"
          >
            {saving ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Sauvegarde...</span>
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
