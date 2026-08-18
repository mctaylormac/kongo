import { motion } from "motion/react";
import { KonGOLogo } from "./KonGOLogo";

/**
 * LoadingScreen simplifié pour KonGO
 * 
 * Version simplifiée avec animation légère et performante.
 * Autres variantes disponibles:
 * - LoadingScreenMinimal: Version avec logo et dots
 * - LoadingScreenUltraMinimal: Juste un spinner
 */
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-surface-primary z-50 flex items-center justify-center">
      
      {/* Contenu principal centré */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.4,
          ease: "easeOut"
        }}
        className="text-center space-y-6"
      >
        
        {/* Logo KonGO */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ 
              duration: 0.3,
              ease: "easeOut"
            }}
          >
            <KonGOLogo variant="full" size="md" />
          </motion.div>
        </div>

        {/* Spinner simple et élégant */}
        <div className="flex justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "linear"
            }}
            className="w-6 h-6 border-2 border-gray-200 border-t-kongo-lime rounded-full"
          />
        </div>

        {/* Texte de chargement discret */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            delay: 0.2,
            duration: 0.3
          }}
          className="text-body-small text-tertiary"
        >
          Chargement...
        </motion.p>
      </motion.div>

      {/* Effet de fond subtil optionnel */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ 
          delay: 0.5,
          duration: 0.6
        }}
        className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface-kongo-lime-light/10 to-transparent pointer-events-none"
      />
    </div>
  );
}

// Export des autres variantes pour usage ultérieur
export { LoadingScreenMinimal } from "./LoadingScreenMinimal";
export { LoadingScreenUltraMinimal } from "./LoadingScreenUltraMinimal";
