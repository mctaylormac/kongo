import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";

interface AdminLoginPageProps {
  onLogin: (credentials: { email: string; password: string; rememberMe: boolean }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function AdminLoginPage({
  onLogin,
  isLoading = false,
  error = null
}: AdminLoginPageProps) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Nettoyer l'URL si on vient de /admin
    if (window.location.pathname !== '/') {
      window.history.replaceState(null, '', '/');
    }
  }, []);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.email) {
      errors.email = 'Email requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email invalide';
    }

    if (!formData.password) {
      errors.password = 'Mot de passe requis';
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-kongo-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-kongo-lime rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-kongo-lime/20">
            <ShieldCheck className="w-10 h-10 text-kongo-black" />
          </div>
          <h1 className="text-display-2 text-white font-bold">Portail Agent</h1>
          <p className="text-secondary mt-2">Accès sécurisé réservé au personnel KonGO</p>
        </div>

        <Card className="bg-surface-elevated border-white/10 shadow-2xl">
          <CardHeader className="text-center border-b border-white/5 pb-6">
            <CardTitle className="text-h4 text-white">Authentification</CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Alert className="border-error/50 bg-error/10 text-error">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-label text-secondary">
                  Identifiant (Email)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="agent@kongo.cd"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-tertiary focus:border-kongo-lime focus:ring-kongo-lime ${validationErrors.email ? 'border-error/50' : ''}`}
                    disabled={isLoading}
                  />
                </div>
                {validationErrors.email && (
                  <p className="text-body-small text-error">{validationErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-label text-secondary">
                  Code d'accès
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tertiary w-4 h-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`pl-10 pr-12 h-12 bg-white/5 border-white/10 text-white placeholder:text-tertiary focus:border-kongo-lime focus:ring-kongo-lime ${validationErrors.password ? 'border-error/50' : ''}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10"
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

              <Button
                type="submit"
                className="w-full h-12 bg-kongo-lime text-kongo-black hover:bg-kongo-lime-dark transition-colors font-bold mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-kongo-black/20 border-t-kongo-black rounded-full animate-spin" />
                    <span>Vérification...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Ouvrir la session</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
