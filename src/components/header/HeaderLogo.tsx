import { motion } from "motion/react";
import { KonGOLogo } from "../KonGOLogo";

interface HeaderLogoProps {
  onClick: () => void;
}

// Animation variants pour le logo
const logoContainerVariants = {
  hidden: {
    x: -30,
    opacity: 0,
    scale: 0.9,
    rotate: -5
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 15,
      duration: 0.8,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const logoHoverVariants = {
  initial: { 
    scale: 1, 
    rotate: 0,
    filter: "brightness(1)"
  },
  hover: { 
    scale: 1.05,
    rotate: 1,
    filter: "brightness(1.1)",
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: { 
    scale: 0.98,
    rotate: -1,
    transition: {
      duration: 0.1
    }
  }
};

const brandTextVariants = {
  hidden: {
    x: -20,
    opacity: 0,
    scale: 0.8
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 20,
      delay: 0.1
    }
  }
};

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: [0, 0.3, 0],
    scale: [0.8, 1.2, 0.8],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export function HeaderLogo({ onClick }: HeaderLogoProps) {
  return (
    <motion.div
      variants={logoContainerVariants}
      className="flex items-center cursor-pointer relative"
      onClick={onClick}
    >
      <motion.div
        variants={logoHoverVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        className="relative"
      >
        {/* Glow effect on hover */}
        <motion.div
          variants={glowVariants}
          className="absolute inset-0 bg-kongo-lime rounded-lg blur-md pointer-events-none -z-10"
        />

        {/* Desktop Logo */}
        <div className="hidden lg:block">
          <KonGOLogo
            variant="full"
            size="md"
            clickable={true}
            onClick={onClick}
            className="transition-all duration-300"
          />
        </div>
        
        {/* Tablet Logo */}
        <div className="hidden md:block lg:hidden">
          <KonGOLogo
            variant="go"
            size="sm"
            clickable={true}
            onClick={onClick}
            className="transition-all duration-300"
          />
        </div>
        
        {/* Mobile Logo & Text */}
        <div className="md:hidden flex items-center space-x-2">
          <KonGOLogo
            variant="symbol"
            size="xs"
            clickable={true}
            onClick={onClick}
            className="transition-all duration-300"
          />
          <motion.span 
            variants={brandTextVariants}
            className="text-kongo-black font-bold text-base tracking-tight"
          >
            KonGO
          </motion.span>
        </div>
      </motion.div>

      {/* Subtle animated accent */}
      <motion.div
        className="absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-kongo-lime to-transparent rounded-full"
        initial={{ width: 0, opacity: 0 }}
        animate={{ 
          width: ["0%", "60%", "0%"],
          opacity: [0, 0.6, 0]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          repeatDelay: 5,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  );
}