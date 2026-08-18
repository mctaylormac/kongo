import React, { useState } from "react";
import { useNavigate } from "react-router";
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Eye, 
  EyeOff,
  Zap
} from "../../../lib/icons";
import { supabase } from "../../../lib/supabase";
import { toast } from "sonner";
import { motion } from "motion/react";
import { useAppState } from "../../../hooks/useAppState";
import IconeImage from "../../../../Public/ICONE.png";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated, setUserRole, setAgencyId } = useAppState();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch role and agency_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, agency_id')
        .eq('id', data.user.id)
        .single();

      if (profile?.role) {
        // Only allow admin roles
        if (['superuser', 'agency', 'chef', 'cashier'].includes(profile.role)) {
          setUserRole(profile.role);
          setAgencyId(profile.agency_id);
          setIsAuthenticated(true);
          toast.success(`Bienvenue, ${profile.role}`);
          navigate("/");
        } else {
          await supabase.auth.signOut();
          toast.error("Accès refusé. Réservé au personnel admin.");
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur d'authentification");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0A0A0B]">
      {/* Background Image / Gradient */}
      <div 
        className="absolute inset-0 z-0 opacity-40 scale-110 blur-[2px]"
        style={{
          backgroundImage: `url('/kongo_bus_login_bg_1777021582928.png')`, // Note: In production you'd use a public assets path
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-tr from-[#0A0A0B] via-[#0A0A0B]/80 to-transparent" />
      
      {/* Animated Shapes */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 20, repeat: Infinity }}
        className="absolute -top-24 -right-24 w-96 h-96 bg-[#34C759] rounded-full blur-[120px] pointer-events-none z-10"
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, -90, 0],
          opacity: [0.05, 0.1, 0.05]
        }}
        transition={{ duration: 25, repeat: Infinity, delay: 2 }}
        className="absolute -bottom-24 -left-24 w-96 h-96 bg-white rounded-full blur-[120px] pointer-events-none z-10"
      />

      <div className="relative z-20 w-full max-w-[440px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[32px] p-10 shadow-2xl"
        >
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center space-y-6 mb-10">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shadow-lg border border-white/10 group overflow-hidden">
              <img src={IconeImage} alt="Logo" className="w-10 h-10 group-hover:scale-110 transition-transform object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-2">
                KONGO <span className="text-[#34C759]">ADMIN</span>
              </h1>
              <p className="text-[#86868B] text-[15px] mt-2 font-medium">Gestion intelligente de la flotte et logistique.</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Email Professionnel</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#34C759] transition-colors" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-[#34C759] rounded-2xl text-white outline-none focus:ring-4 focus:ring-[#34C759]/10 transition-all placeholder:text-white/20 text-[15px]"
                  placeholder="nom@kongoglobal.cd"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Mot de passe</label>
                <button type="button" className="text-[11px] font-bold text-white/60 hover:text-white uppercase tracking-widest hover:underline transition-colors">Oublié ?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-[#34C759] transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-12 pr-12 bg-white/[0.02] border border-white/5 hover:border-white/10 focus:border-[#34C759] rounded-2xl text-white outline-none focus:ring-4 focus:ring-[#34C759]/10 transition-all placeholder:text-white/20 text-[15px]"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-white text-black rounded-2xl font-black text-[15px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-3 shadow-xl shadow-white/10 relative overflow-hidden"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Connexion Sécurisée
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Footer Info */}
          <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center space-y-4">
            <div className="flex items-center gap-2 text-[12px] font-bold text-[#34C759] bg-[#34C759]/5 px-4 py-2 rounded-full border border-[#34C759]/10 hover:bg-[#34C759]/10 transition-colors">
               <ShieldCheck className="w-4 h-4" />
               Système Protégé (SSL)
            </div>
            <p className="text-white/20 text-[10px] font-medium tracking-tight">Kongo Transport & Logistique • v2.0</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
