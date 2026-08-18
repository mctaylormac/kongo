import { useState, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";

interface AdminLoginPageProps {
  onLogin: (credentials: { email: string; password: string; rememberMe: boolean }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function AdminLoginPage({ onLogin, isLoading = false, error = null }: AdminLoginPageProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.email) {
      errors.email = "Email requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email invalide";
    }

    if (!formData.password) {
      errors.password = "Mot de passe requis";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (validateForm()) {
      onLogin(formData);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-kongo-black flex items-center justify-center p-4">
      <style>{`
        /* Force l'apparence sombre meme avec l'autofill de Chrome */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 40px #171717 inset !important;
          -webkit-text-fill-color: white !important;
          transition: background-color 5000s ease-in-out 0s;
          caret-color: #bef264 !important;
        }

        .admin-input {
          color: white !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
        }
      `}</style>

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
          <h1 className="text-3xl text-white font-bold">Portail Agent</h1>
          <p className="text-gray-400 mt-2">Acces securise reserve au personnel KonGO</p>
        </div>

        <Card className="bg-zinc-900 border-white/10 shadow-2xl">
          <CardHeader className="text-center border-b border-white/5 pb-6">
            <CardTitle className="text-xl text-white">Authentification</CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {error && (
              <Alert className="border-red-500/50 bg-red-500/10 text-red-500">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Identifiant (Email)
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    id="email"
                    type="email"
                    placeholder="agent@kongo.cd"
                    value={formData.email}
                    onChange={(event) => handleInputChange("email", event.target.value)}
                    className={`admin-input flex w-full rounded-md border px-3 py-2 text-sm pl-10 h-12 border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-kongo-lime/50 ${validationErrors.email ? "border-red-500/50" : ""}`}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Code d'acces
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={formData.password}
                    onChange={(event) => handleInputChange("password", event.target.value)}
                    className={`admin-input flex w-full rounded-md border px-3 py-2 text-sm pl-10 pr-12 h-12 border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-kongo-lime/50 ${validationErrors.password ? "border-red-500/50" : ""}`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 text-gray-500"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-kongo-lime text-kongo-black hover:bg-lime-400 transition-colors font-bold mt-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-kongo-black/20 border-t-kongo-black rounded-full animate-spin" />
                    <span>Verification...</span>
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
