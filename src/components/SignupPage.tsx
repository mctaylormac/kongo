import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Progress } from "./ui/progress";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle,
  CheckCircle,
  User,
  Phone,
  MapPin,
  Gift,
  Crown,
  Zap,
  Shield,
  Star,
  Calendar,
  Check,
  X
} from "lucide-react";

interface SignupPageProps {
  onSignup: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    city: string;
    password: string;
    acceptTerms: boolean;
    marketing: boolean;
  }) => void;
  onNavigateToLogin: () => void;
  onSocialSignup: (provider: 'google' | 'facebook' | 'microsoft') => void;
  isLoading?: boolean;
  error?: string | null;
}

export function SignupPage({
  onSignup,
  onNavigateToLogin,
  onSocialSignup,
  isLoading = false,
  error = null
}: SignupPageProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    city: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    marketing: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  // Villes principales de RDC
  const cities = [
    'Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Kisangani', 
    'Bukavu', 'Goma', 'Tshikapa', 'Kolwezi', 'Likasi', 'Matadi', 
    'Beni', 'Mbandaka', 'Mwene-Ditu', 'Kikwit', 'Uvira', 'Butembo', 
    'Gandajika', 'Kalemie', 'Gemena'
  ];

  // Avantages d'inscription
  const signupBenefits = [
    {
      icon: Gift,
      title: "Bonus d'inscription",
      description: "10% de réduction sur votre premier voyage",
      highlight: true
    },
    {
      icon: Crown,
      title: "Statut VIP",
      description: "Accès prioritaire aux nouveaux trajets",
      highlight: false
    },
    {
      icon: Star,
      title: "Programme fidélité",
      description: "Gagnez des points à chaque réservation",
      highlight: false
    },
    {
      icon: Shield,
      title: "Protection voyage",
      description: "Assurance et support 24/7 inclus",
      highlight: false
    }
  ];

  const validateStep = (step: number) => {
    const errors: { [key: string]: string } = {};

    if (step === 1) {
      if (!formData.firstName.trim()) errors.firstName = 'Prénom requis';
      if (!formData.lastName.trim()) errors.lastName = 'Nom requis';
      if (!formData.email) {
        errors.email = 'Email requis';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Email invalide';
      }
      if (!formData.phone) {
        errors.phone = 'Téléphone requis';
      } else if (!/^\+?[0-9]{9,15}$/.test(formData.phone.replace(/\s/g, ''))) {
        errors.phone = 'Numéro invalide';
      }
    }

    if (step === 2) {
      if (!formData.dateOfBirth) errors.dateOfBirth = 'Date de naissance requise';
      if (!formData.city) errors.city = 'Ville requise';
      if (!formData.password) {
        errors.password = 'Mot de passe requis';
      } else if (formData.password.length < 8) {
        errors.password = 'Minimum 8 caractères';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'Doit contenir minuscule, majuscule et chiffre';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
      if (!formData.acceptTerms) {
        errors.acceptTerms = 'Vous devez accepter les conditions';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep(2)) {
      const { confirmPassword, ...submitData } = formData;
      onSignup(submitData);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/(?=.*[a-z])/.test(password)) strength += 25;
    if (/(?=.*[A-Z])/.test(password)) strength += 25;
    if (/(?=.*\d)/.test(password)) strength += 25;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const progressPercentage = currentStep === 1 ? 50 : 100;

  return (
    <div className="min-h-screen bg-gradient-kongo-subtle">
      <div className="container-professional py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Section de gauche - Marque et avantages */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-8"
          >
            {/* Logo et slogan */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-kongo-black rounded-xl flex items-center justify-center">
                  <span className="text-on-black font-bold text-2xl">K</span>
                </div>
                <div>
                  <h1 className="text-h2 text-kongo-black font-bold">KonGO</h1>
                  <p className="text-body text-secondary">Rejoignez l'aventure</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h2 className="text-display-2 text-kongo-black">
                  Votre voyage{" "}
                  <span className="text-kongo-lime">commence</span>{" "}
                  ici
                </h2>
                <p className="text-body-large text-secondary max-w-md">
                  Créez votre compte KonGO en quelques minutes et profitez d'avantages exclusifs 
                  pour tous vos déplacements en RDC.
                </p>
              </div>
            </div>

            {/* Avantages d'inscription */}
            <div className="space-y-4">
              <h3 className="text-h4 text-kongo-black font-semibold">
                Pourquoi rejoindre KonGO ?
              </h3>
              <div className="space-y-4">
                {signupBenefits.map((benefit, index) => {
                  const IconComponent = benefit.icon;
                  return (
                    <motion.div
                      key={benefit.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className={`relative p-4 rounded-xl border transition-all duration-300 ${
                        benefit.highlight
                          ? 'bg-gradient-to-r from-kongo-lime/10 to-kongo-lime/5 border-kongo-lime/30 shadow-kongo-lime/20 shadow-lg'
                          : 'bg-surface-elevated border-border-primary hover:border-kongo-lime/50'
                      }`}
                    >
                      {benefit.highlight && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="status-kongo text-xs">
                            Nouveau
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          benefit.highlight 
                            ? 'bg-kongo-lime text-kongo-black' 
                            : 'bg-surface-kongo-lime-light text-kongo-lime-dark'
                        }`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-h5 text-kongo-black font-medium">
                            {benefit.title}
                          </h4>
                          <p className="text-body text-secondary mt-1">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Témoignage client */}
            <div className="bg-surface-elevated p-6 rounded-xl border border-border-primary">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-kongo-black to-kongo-black-light rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-on-black" />
                </div>
                <div>
                  <div className="text-h6 text-kongo-black font-medium">Marie Kadima</div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              </div>
              <blockquote className="text-body text-secondary italic">
                "Depuis que j'utilise KonGO, voyager entre Kinshasa et Lubumbashi 
                n'a jamais été aussi simple. Service impeccable et ponctualité garantie !"
              </blockquote>
            </div>
          </motion.div>

          {/* Section de droite - Formulaire d'inscription */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-7"
          >
            <Card className="card-elevated">
              <CardHeader className="text-center space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-h3 text-kongo-black">Créer un compte</CardTitle>
                  <div className="text-body-small text-tertiary">
                    Étape {currentStep} sur 2
                  </div>
                </div>
                
                {/* Barre de progression */}
                <div className="w-full">
                  <Progress value={progressPercentage} className="h-2" />
                  <div className="flex justify-between mt-2 text-xs text-tertiary">
                    <span className={currentStep >= 1 ? 'text-kongo-lime font-medium' : ''}>
                      Informations personnelles
                    </span>
                    <span className={currentStep >= 2 ? 'text-kongo-lime font-medium' : ''}>
                      Sécurité & Préférences
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Erreur générale */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert className="border-error bg-color-error-light">
                      <AlertCircle className="h-4 w-4 text-error" />
                      <AlertDescription className="text-error">
                        {error}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {/* Connexion sociale */}
                {currentStep === 1 && (
                  <>
                    <div className="space-y-3">
                      <Button
                        onClick={() => onSocialSignup('google')}
                        variant="outline"
                        className="w-full h-12 border-border-secondary hover:border-kongo-lime"
                        disabled={isLoading}
                      >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Inscription rapide avec Google
                      </Button>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={() => onSocialSignup('facebook')}
                          variant="outline"
                          className="h-12 border-border-secondary hover:border-kongo-lime"
                          disabled={isLoading}
                        >
                          <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                          Facebook
                        </Button>
                        
                        <Button
                          onClick={() => onSocialSignup('microsoft')}
                          variant="outline"
                          className="h-12 border-border-secondary hover:border-kongo-lime"
                          disabled={isLoading}
                        >
                          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                            <path fill="#F25022" d="M0 0h11v11H0z"/>
                            <path fill="#7FBA00" d="M13 0h11v11H13z"/>
                            <path fill="#00A4EF" d="M0 13h11v11H0z"/>
                            <path fill="#FFB900" d="M13 13h11v11H13z"/>
                          </svg>
                          Microsoft
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-surface-elevated px-2 text-muted-foreground">
                          Ou remplissez le formulaire
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <AnimatePresence mode="wait">
                  {currentStep === 1 ? (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Étape 1 - Informations personnelles */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-label text-primary">
                            Prénom *
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                            <Input
                              id="firstName"
                              placeholder="Votre prénom"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              className={`pl-10 h-12 ${validationErrors.firstName ? 'border-error' : 'focus:border-kongo-lime focus:ring-kongo-lime'}`}
                              disabled={isLoading}
                            />
                          </div>
                          {validationErrors.firstName && (
                            <p className="text-body-small text-error">{validationErrors.firstName}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-label text-primary">
                            Nom *
                          </Label>
                          <Input
                            id="lastName"
                            placeholder="Votre nom"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className={`h-12 ${validationErrors.lastName ? 'border-error' : 'focus:border-kongo-lime focus:ring-kongo-lime'}`}
                            disabled={isLoading}
                          />
                          {validationErrors.lastName && (
                            <p className="text-body-small text-error">{validationErrors.lastName}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-label text-primary">
                          Adresse email *
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="votre.email@exemple.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`pl-10 h-12 ${validationErrors.email ? 'border-error' : 'focus:border-kongo-lime focus:ring-kongo-lime'}`}
                            disabled={isLoading}
                          />
                        </div>
                        {validationErrors.email && (
                          <p className="text-body-small text-error">{validationErrors.email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-label text-primary">
                          Numéro de téléphone *
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+243 XX XXX XXXX"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className={`pl-10 h-12 ${validationErrors.phone ? 'border-error' : 'focus:border-kongo-lime focus:ring-kongo-lime'}`}
                            disabled={isLoading}
                          />
                        </div>
                        {validationErrors.phone && (
                          <p className="text-body-small text-error">{validationErrors.phone}</p>
                        )}
                        <p className="text-body-small text-tertiary">
                          Nécessaire pour les notifications de voyage et support
                        </p>
                      </div>

                      <Button
                        onClick={handleNextStep}
                        className="btn-primary w-full h-12 mt-6"
                        disabled={isLoading}
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <span>Continuer</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      {/* Étape 2 - Sécurité et préférences */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="dateOfBirth" className="text-label text-primary">
                              Date de naissance *
                            </Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                              <Input
                                id="dateOfBirth"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                                className={`pl-10 h-12 ${validationErrors.dateOfBirth ? 'border-error' : 'focus:border-kongo-lime focus:ring-kongo-lime'}`}
                                disabled={isLoading}
                                max={new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]}
                              />
                            </div>
                            {validationErrors.dateOfBirth && (
                              <p className="text-body-small text-error">{validationErrors.dateOfBirth}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="city" className="text-label text-primary">
                              Ville principale *
                            </Label>
                            <Select value={formData.city} onValueChange={(value) => handleInputChange('city', value)}>
                              <SelectTrigger className={`h-12 ${validationErrors.city ? 'border-error' : 'focus:border-kongo-lime focus:ring-kongo-lime'}`}>
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 text-tertiary mr-3" />
                                  <SelectValue placeholder="Choisissez votre ville" />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {cities.map((city) => (
                                  <SelectItem key={city} value={city}>{city}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {validationErrors.city && (
                              <p className="text-body-small text-error">{validationErrors.city}</p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-label text-primary">
                            Mot de passe *
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Créez un mot de passe sécurisé"
                              value={formData.password}
                              onChange={(e) => handleInputChange('password', e.target.value)}
                              className={`pl-10 pr-12 h-12 ${validationErrors.password ? 'border-error' : 'focus:border-kongo-lime focus:ring-kongo-lime'}`}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-tertiary" />
                              ) : (
                                <Eye className="h-4 w-4 text-tertiary" />
                              )}
                            </Button>
                          </div>
                          
                          {/* Indicateur de force du mot de passe */}
                          {formData.password && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-body-small text-secondary">Force du mot de passe</span>
                                <span className={`text-body-small font-medium ${
                                  passwordStrength < 50 ? 'text-error' : 
                                  passwordStrength < 75 ? 'text-warning' : 'text-success'
                                }`}>
                                  {passwordStrength < 50 ? 'Faible' : 
                                   passwordStrength < 75 ? 'Moyen' : 'Fort'}
                                </span>
                              </div>
                              <Progress value={passwordStrength} className="h-2" />
                            </div>
                          )}
                          
                          {validationErrors.password && (
                            <p className="text-body-small text-error">{validationErrors.password}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="text-label text-primary">
                            Confirmer le mot de passe *
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Retapez votre mot de passe"
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                              className={`pl-10 pr-12 h-12 ${validationErrors.confirmPassword ? 'border-error' : 'focus:border-kongo-lime focus:ring-kongo-lime'}`}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-tertiary" />
                              ) : (
                                <Eye className="h-4 w-4 text-tertiary" />
                              )}
                            </Button>
                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                                <Check className="w-4 h-4 text-success" />
                              </div>
                            )}
                          </div>
                          {validationErrors.confirmPassword && (
                            <p className="text-body-small text-error">{validationErrors.confirmPassword}</p>
                          )}
                        </div>

                        {/* Conditions d'utilisation */}
                        <div className="space-y-4 pt-4">
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="acceptTerms"
                              checked={formData.acceptTerms}
                              onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                              disabled={isLoading}
                              className={validationErrors.acceptTerms ? 'border-error' : ''}
                            />
                            <Label htmlFor="acceptTerms" className="text-body-small text-secondary leading-relaxed">
                              J'accepte les{' '}
                              <Button variant="ghost" className="text-kongo-lime hover:text-kongo-lime-dark p-0 h-auto underline">
                                conditions d'utilisation
                              </Button>{' '}
                              et la{' '}
                              <Button variant="ghost" className="text-kongo-lime hover:text-kongo-lime-dark p-0 h-auto underline">
                                politique de confidentialité
                              </Button>{' '}
                              de KonGO
                            </Label>
                          </div>
                          {validationErrors.acceptTerms && (
                            <p className="text-body-small text-error ml-6">{validationErrors.acceptTerms}</p>
                          )}

                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id="marketing"
                              checked={formData.marketing}
                              onCheckedChange={(checked) => handleInputChange('marketing', checked as boolean)}
                              disabled={isLoading}
                            />
                            <Label htmlFor="marketing" className="text-body-small text-secondary leading-relaxed">
                              J'accepte de recevoir des informations sur les promotions et nouveautés KonGO
                              <span className="text-tertiary block mt-1">
                                (Vous pouvez vous désabonner à tout moment)
                              </span>
                            </Label>
                          </div>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex space-x-3 pt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(1)}
                            className="flex-1 h-12"
                            disabled={isLoading}
                          >
                            Retour
                          </Button>
                          <Button
                            type="submit"
                            className="btn-primary flex-2 h-12"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                <span>Création...</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-2">
                                <span>Créer mon compte</span>
                                <CheckCircle className="w-4 h-4" />
                              </div>
                            )}
                          </Button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Lien vers connexion */}
                <div className="text-center pt-4 border-t border-border-primary">
                  <p className="text-body-small text-secondary">
                    Vous avez déjà un compte ?{' '}
                    <Button
                      variant="ghost"
                      onClick={onNavigateToLogin}
                      className="text-kongo-lime hover:text-kongo-lime-dark p-0 h-auto font-medium"
                      disabled={isLoading}
                    >
                      Se connecter
                    </Button>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}