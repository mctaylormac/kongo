import { useState } from "react";
import { motion } from "motion/react";
import kongoFullLogo from "figma:asset/6ac07760bea1f091736540652732c1c872a64a2c.png";
import kongoOnlyGO from "figma:asset/cf746f9341703abf62ed47b8a55e2876d9fe13b3.png";
import kongoSymbol from "figma:asset/edfb573b9341f1ec805971acd783ae119c5e7b51.png";

export interface KonGOLogoProps {
  variant?: "full" | "go" | "symbol";
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  animated?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

export function KonGOLogo({ 
  variant = "full", 
  size = "md", 
  className = "", 
  animated = false,
  clickable = false,
  onClick 
}: KonGOLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Size mappings for responsive logo - Optimisé pour une meilleure proportion
  const sizeMap = {
    xs: { width: 50, height: 16 },
    sm: { width: 70, height: 23 },
    md: { width: 100, height: 33 },
    lg: { width: 130, height: 43 },
    xl: { width: 160, height: 53 },
    "2xl": { width: 220, height: 73 }
  };

  // Logo source selection based on variant
  const getLogoSource = () => {
    switch (variant) {
      case "go":
        return kongoOnlyGO;
      case "symbol":
        return kongoSymbol;
      default:
        return kongoFullLogo;
    }
  };

  // Fallback logo using CSS when images fail to load
  const renderFallbackLogo = () => {
    const { width, height } = sizeMap[size];
    
    if (variant === "symbol") {
      return (
        <div 
          className={`inline-flex items-center justify-center bg-kongo-lime rounded-lg ${className}`}
          style={{ width: height, height: height }} // Square for symbol
        >
          <span 
            className="font-extrabold text-kongo-black"
            style={{ fontSize: height * 0.5 }}
          >
            GO
          </span>
        </div>
      );
    }
    
    return (
      <div 
        className={`inline-flex items-center space-x-1 ${className}`}
        style={{ width, height }}
      >
        <span 
          className="font-extrabold text-kongo-black"
          style={{ fontSize: height * 0.6 }}
        >
          {variant === "go" ? "" : "Kon"}
        </span>
        <span 
          className="font-extrabold text-kongo-lime"
          style={{ fontSize: height * 0.6 }}
        >
          GO
        </span>
      </div>
    );
  };

  const { width, height } = sizeMap[size];
  const logoSource = getLogoSource();

  // Animation variants
  const logoVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.8,
      y: 20
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

  // Loading shimmer effect
  const shimmerVariants = {
    initial: { x: "-100%" },
    animate: { 
      x: "100%",
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const LogoContent = () => {
    if (imageError) {
      return renderFallbackLogo();
    }

    return (
      <div className="relative overflow-hidden" style={{ width, height }}>
        {/* Loading shimmer */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gray-100 rounded">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
            />
          </div>
        )}
        
        {/* Actual logo image */}
        <img
          src={logoSource}
          alt={`KonGO ${variant === "full" ? "Logo" : variant === "go" ? "GO" : "Symbol"}`}
          width={width}
          height={height}
          className={`object-contain transition-opacity duration-300 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setImageError(true);
            setIsLoaded(true);
          }}
          style={{ 
            maxWidth: "100%", 
            height: "auto",
            filter: "contrast(1.05) saturate(1.1)" // Enhance logo vibrancy
          }}
        />
      </div>
    );
  };

  if (animated || clickable) {
    return (
      <motion.div
        variants={logoVariants}
        initial={animated ? "initial" : undefined}
        animate={animated ? "animate" : undefined}
        whileHover={clickable ? "hover" : undefined}
        whileTap={clickable ? "tap" : undefined}
        onClick={onClick}
        className={`inline-block ${clickable ? "cursor-pointer" : ""} ${className}`}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={clickable ? (e) => {
          if (e.key === "Enter" || e.key === " ") {
            onClick?.();
          }
        } : undefined}
        aria-label={clickable ? "KonGO Logo - Retour à l'accueil" : undefined}
      >
        <LogoContent />
      </motion.div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <LogoContent />
    </div>
  );
}

// Preset components for common use cases - Taille optimisée
export function KonGOLogoHeader({ onClick }: { onClick?: () => void }) {
  return (
    <KonGOLogo
      variant="full"
      size="md"
      animated={false}
      clickable={!!onClick}
      onClick={onClick}
      className="transition-transform hover:scale-105"
    />
  );
}

export function KonGOLogoCompact({ size = "sm" }: { size?: KonGOLogoProps["size"] }) {
  return (
    <KonGOLogo
      variant="go"
      size={size}
      className="md:hidden" // Show compact version on mobile
    />
  );
}

export function KonGOLogoLoading() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      className="relative"
    >
      <KonGOLogo
        variant="symbol"
        size="xl"
        className="drop-shadow-lg"
      />
      
      {/* Pulse ring */}
      <motion.div
        animate={{ 
          scale: [1, 1.5, 1],
          opacity: [0.8, 0, 0.8]
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute inset-0 border-2 border-kongo-lime rounded-2xl"
      />
    </motion.div>
  );
}

export function KonGOLogoBrand({ 
  tagline = "Transport RDC",
  size = "xl" 
}: { 
  tagline?: string;
  size?: KonGOLogoProps["size"];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="text-center space-y-3"
    >
      <KonGOLogo
        variant="full"
        size={size}
        animated={true}
        className="mx-auto"
      />
      
      {tagline && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-body-small text-secondary font-medium"
        >
          {tagline}
        </motion.p>
      )}
    </motion.div>
  );
}

// Hook for responsive logo sizing
export function useResponsiveLogo() {
  const getResponsiveVariant = (screenWidth: number): KonGOLogoProps["variant"] => {
    if (screenWidth < 640) return "symbol"; // Mobile: just symbol
    if (screenWidth < 768) return "go"; // Small tablet: GO only
    return "full"; // Desktop: full logo
  };

  const getResponsiveSize = (screenWidth: number): KonGOLogoProps["size"] => {
    if (screenWidth < 640) return "xs";
    if (screenWidth < 768) return "sm";
    if (screenWidth < 1024) return "md";
    return "lg";
  };

  return { getResponsiveVariant, getResponsiveSize };
}