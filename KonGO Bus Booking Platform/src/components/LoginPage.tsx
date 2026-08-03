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
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  User,
  Smartphone,
  Globe,
  Shield,
  Zap,
  Star,
  Users,
  MapPin,
  Clock
} from "lucide-react";

interface LoginPageProps {
  onLogin: (credentials: { email: string; password: string; rememberMe: boolean }) => void;
  onNavigateToSignup: () => void;
  onForgotPassword: (email: string) => void;
  onSocialLogin: (provider: 'google' | 'facebook' | 'microsoft') => void;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginPage({
  onLogin,
  onNavigateToSignup,
  onForgotPassword,
  onSocialLogin,
  isLoading = false,
  error = null
}: LoginPageProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // Avantages KonGO pour encourager l'inscription
  const benefits = [
    { icon: Star, title: "Réservations Prioritaires", description: "Accès exclusif aux sièges premium" },
    { icon: Zap, title: "Paiement Rapide", description: "Mobile Money, cartes, paiement sécurisé" },
    { icon: Users, title: "Programme Fidélité", description: "Gagnez des points à chaque voyage" },
    { icon: MapPin, title: "200+ Destinations", description: "Réseau étendu à travers la RDC" },
    { icon: Shield, title: "Voyage Sécurisé", description: "Flotte moderne et certifiée" },
    { icon: Clock, title: "Support 24/7", description: "Assistance client toujours disponible" }
  ];

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.email) {
      errors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    if (!formData.password) {
      errors.password = 'Mot de passe requis';
    } else if (formData.password.length < 6) {
      errors.password = 'Minimum 6 caractères';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onLogin(formData);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotPasswordEmail && /\S+@\S+\.\S+/.test(forgotPasswordEmail)) {
      onForgotPassword(forgotPasswordEmail);
      setForgotPasswordSent(true);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-kongo-subtle">
      <div className="container-professional py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Section de gauche - Marque et avantages */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Logo et slogan */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-kongo-black rounded-xl flex items-center justify-center">
                  <span className="text-on-black font-bold text-2xl">K</span>
                </div>
                <div>
                  <h1 className="text-h2 text-kongo-black font-bold">KonGO</h1>
                  <p className="text-body text-secondary">Transport Moderne RDC</p>
                </div>
              </div>

              <div className="space-y-3">
                <h2 className="text-display-2 text-kongo-black">
                  Voyagez en toute{" "}
                  <span className="text-kongo-lime">sérénité</span>
                </h2>
                <p className="text-body-large text-secondary max-w-md">
                  Rejoignez plus de 50,000 voyageurs qui font confiance à KonGO
                  pour leurs déplacements à travers la République Démocratique du Congo.
                </p>
              </div>
            </div>

            {/* Avantages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-start space-x-3 p-4 bg-surface-elevated rounded-lg border border-border-primary hover:border-kongo-lime/50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-surface-kongo-lime-light rounded-lg flex items-center justify-center flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-kongo-lime-dark" />
                    </div>
                    <div>
                      <h3 className="text-h6 text-kongo-black font-medium">{benefit.title}</h3>
                      <p className="text-body-small text-secondary">{benefit.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Statistiques sociales */}
            <div className="flex items-center space-x-8 pt-6 border-t border-border-primary">
              <div className="text-center">
                <div className="text-h3 text-kongo-black font-bold">50K+</div>
                <div className="text-caption text-tertiary">Voyageurs</div>
              </div>
              <div className="text-center">
                <div className="text-h3 text-kongo-black font-bold">200+</div>
                <div className="text-caption text-tertiary">Destinations</div>
              </div>
              <div className="text-center">
                <div className="text-h3 text-kongo-black font-bold">4.8★</div>
                <div className="text-caption text-tertiary">Satisfaction</div>
              </div>
            </div>
          </motion.div>

          {/* Section de droite - Formulaire de connexion */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-full max-w-md mx-auto"
          >
            <AnimatePresence mode="wait">
              {!showForgotPassword ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="card-elevated">
                    <CardHeader className="text-center space-y-2">
                      <CardTitle className="text-h3 text-kongo-black">Connexion</CardTitle>
                      <p className="text-body text-secondary">
                        Accédez à votre compte KonGO pour gérer vos voyages
                      </p>
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
                      <div className="space-y-3">
                        <Button
                          onClick={() => onSocialLogin('google')}
                          variant="outline"
                          className="w-full h-12 border-border-secondary hover:border-kongo-lime"
                          disabled={isLoading}
                        >
                          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          Continuer avec Google
                        </Button>

                        <div className="flex items-center space-x-3">
                          <Button
                            onClick={() => onSocialLogin('facebook')}
                            variant="outline"
                            className="flex-1 h-12 border-border-secondary hover:border-kongo-lime"
                            disabled={isLoading}
                          >
                            <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                          </Button>

                          <Button
                            onClick={() => onSocialLogin('microsoft')}
                            variant="outline"
                            className="flex-1 h-12 border-border-secondary hover:border-kongo-lime"
                            disabled={isLoading}
                          >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                              <path fill="#F25022" d="M0 0h11v11H0z" />
                              <path fill="#7FBA00" d="M13 0h11v11H13z" />
                              <path fill="#00A4EF" d="M0 13h11v11H0z" />
                              <path fill="#FFB900" d="M13 13h11v11H13z" />
                            </svg>
                          </Button>
                        </div>
                      </div>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-surface-elevated px-2 text-muted-foreground">
                            Ou continuez avec votre email
                          </span>
                        </div>
                      </div>

                      {/* Formulaire de connexion */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-label text-primary">
                            Adresse email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="votre.email@exemple.com"
                              value={formData.email}
                              onChange={(e) => handleInputChange('email', e.target.value)}
                              className={`pl-10 h-12 ${validationErrors.email ? 'border-error focus:border-error focus:ring-error' : 'focus:border-kongo-lime focus:ring-kongo-lime'}`}
                              disabled={isLoading}
                            />
                          </div>
                          {validationErrors.email && (
                            <p className="text-body-small text-error">{validationErrors.email}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-label text-primary">
                            Mot de passe
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Votre mot de passe"
                              value={formData.password}
                              onChange={(e) => handleInputChange('password', e.target.value)}
                              className={`pl-10 pr-12 h-12 ${validationErrors.password ? 'border-error focus:border-error focus:ring-error' : 'focus:border-kongo-lime focus:ring-kongo-lime'}`}
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                              onClick={() => setShowPassword(!showPassword)}
                              disabled={isLoading}
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4 text-tertiary" />
                              ) : (
                                <Eye className="h-4 w-4 text-tertiary" />
                              )}
                            </Button>
                          </div>
                          {validationErrors.password && (
                            <p className="text-body-small text-error">{validationErrors.password}</p>
                          )}
                        </div>

                        {/* Options */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="remember"
                              checked={formData.rememberMe}
                              onCheckedChange={(checked) => handleInputChange('rememberMe', checked as boolean)}
                              disabled={isLoading}
                            />
                            <Label htmlFor="remember" className="text-body-small text-secondary">
                              Se souvenir de moi
                            </Label>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowForgotPassword(true)}
                            className="text-kongo-lime hover:text-kongo-lime-dark p-0 h-auto"
                            disabled={isLoading}
                          >
                            Mot de passe oublié ?
                          </Button>
                        </div>

                        {/* Bouton de connexion */}
                        <Button
                          type="submit"
                          className="btn-primary w-full h-12"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                              <span>Connexion...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <span>Se connecter</span>
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          )}
                        </Button>
                      </form>

                      {/* Lien vers inscription et admin */}
                      <div className="text-center pt-4 border-t border-border-primary space-y-4">
                        <p className="text-body-small text-secondary">
                          Pas encore de compte ?{' '}
                          <Button
                            variant="ghost"
                            onClick={onNavigateToSignup}
                            className="text-kongo-lime hover:text-kongo-lime-dark p-0 h-auto font-medium"
                            disabled={isLoading}
                          >
                            Créer un compte gratuitement
                          </Button>
                        </p>

                        <div className="flex justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-admin'))}
                            className="text-tertiary hover:text-kongo-black border-border-secondary hover:border-kongo-black h-8 px-3"
                            disabled={isLoading}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Console Administration
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                // Modal mot de passe oublié
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="card-elevated">
                    <CardHeader className="text-center space-y-2">
                      <CardTitle className="text-h3 text-kongo-black">
                        Mot de passe oublié
                      </CardTitle>
                      <p className="text-body text-secondary">
                        Entrez votre email pour recevoir un lien de récupération
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                      {!forgotPasswordSent ? (
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="forgot-email" className="text-label text-primary">
                              Adresse email
                            </Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                              <Input
                                id="forgot-email"
                                type="email"
                                placeholder="votre.email@exemple.com"
                                value={forgotPasswordEmail}
                                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                                className="pl-10 h-12 focus:border-kongo-lime focus:ring-kongo-lime"
                                required
                              />
                            </div>
                          </div>

                          <div className="flex space-x-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowForgotPassword(false)}
                              className="flex-1 h-12"
                            >
                              Retour
                            </Button>
                            <Button
                              type="submit"
                              className="btn-primary flex-1 h-12"
                            >
                              Envoyer le lien
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-surface-kongo-lime-light rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-success" />
                          </div>
                          <div className="space-y-2">
                            <h3 className="text-h4 text-kongo-black">Email envoyé !</h3>
                            <p className="text-body text-secondary">
                              Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              setShowForgotPassword(false);
                              setForgotPasswordSent(false);
                              setForgotPasswordEmail('');
                            }}
                            className="btn-primary w-full h-12"
                          >
                            Retour à la connexion
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
