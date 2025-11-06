import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, RefreshCw, Loader2, Wifi, WifiOff } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";

// Component Loading Fallback
export function ComponentLoadingFallback({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className="text-center space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-kongo-lime border-t-transparent rounded-full mx-auto"
        />
        <p className="text-body-small text-secondary">Chargement...</p>
      </div>
    </div>
  );
}

// Enhanced Error Fallback Component
export function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  const [details, setDetails] = useState(false);
  
  return (
    <div className="min-h-screen bg-surface-secondary flex items-center justify-center p-6 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23${encodeURIComponent('bfeb30').slice(1)}' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      <Card className="card-elevated max-w-md w-full relative z-10">
        <CardContent className="p-8 text-center space-y-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto"
          >
            <AlertTriangle className="w-8 h-8 text-error" />
          </motion.div>
          
          <div className="space-y-3">
            <h2 className="text-h3 text-kongo-black font-semibold">
              Oups ! Une erreur est survenue
            </h2>
            <p className="text-body-small text-secondary leading-relaxed">
              Nous nous excusons pour ce problème technique. Notre équipe a été notifiée et travaille à une solution.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={resetErrorBoundary}
              className="btn-primary w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/'}
              className="btn-outline w-full"
            >
              Retour à l'accueil
            </Button>
          </div>
          
          <button
            onClick={() => setDetails(!details)}
            className="text-caption text-tertiary hover:text-secondary transition-colors cursor-pointer"
          >
            {details ? 'Masquer' : 'Afficher'} les détails techniques
          </button>
          
          {details && (
            <motion.details
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="text-left mt-4"
            >
              <div className="text-body-xs text-error bg-error/5 p-4 rounded-lg overflow-auto max-h-32">
                <strong>Erreur:</strong> {error.message}
                <br />
                <strong>Stack:</strong> {error.stack?.slice(0, 200)}...
              </div>
            </motion.details>
          )}
          
          <div className="pt-4 border-t border-border-primary">
            <p className="text-caption text-quaternary">
              Problème persistant ? Contactez-nous au{" "}
              <a href="tel:+243123456789" className="text-kongo-lime hover:text-kongo-lime-dark transition-colors">
                +243 123 456 789
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Connection Status Banner
export function ConnectionStatusBanner({ isOnline }: { isOnline: boolean }) {
  if (isOnline) return null;
  
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className="fixed top-0 left-0 right-0 bg-warning text-white p-3 text-center z-[60] shadow-lg"
    >
      <div className="flex items-center justify-center space-x-2">
        <WifiOff className="w-4 h-4" />
        <span className="text-body-small font-medium">
          Mode hors ligne - Fonctionnalités limitées
        </span>
      </div>
    </motion.div>
  );
}

// Connection Status Indicator
export function ConnectionStatusIndicator({ isOnline }: { isOnline: boolean }) {
  if (!isOnline) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 0.7, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed bottom-2 left-2 pointer-events-none z-30"
    >
      <div className="flex items-center space-x-1 bg-success text-white px-3 py-1 rounded-full text-body-xs shadow-sm">
        <Wifi className="w-3 h-3" />
        <span className="font-medium">En ligne</span>
      </div>
    </motion.div>
  );
}

// Loading Spinner Component
export function LoadingSpinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12"
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      className={`border-2 border-kongo-lime border-t-transparent rounded-full ${sizeClasses[size]} ${className}`}
    />
  );
}