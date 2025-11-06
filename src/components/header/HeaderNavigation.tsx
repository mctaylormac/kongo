import { motion } from "motion/react";
import { Button } from "../ui/button";

interface NavigationItem {
  id: string;
  label: string;
  active: boolean;
}

interface HeaderNavigationProps {
  items: NavigationItem[];
  onNavigate: (page: string) => void;
}

// Animation variants pour les éléments de navigation
const navigationItemVariants = {
  hidden: {
    y: -15,
    opacity: 0,
    scale: 0.95
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
      duration: 0.4
    }
  }
};

const activeIndicatorVariants = {
  hidden: {
    scale: 0,
    opacity: 0
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      delay: 0.2
    }
  }
};

const hoverVariants = {
  initial: { scale: 1, y: 0 },
  hover: { 
    scale: 1.05, 
    y: -2,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: { 
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

export function HeaderNavigation({ items, onNavigate }: HeaderNavigationProps) {
  return (
    <nav className="flex items-center space-x-1">
      {items.map((item, index) => (
        <motion.div 
          key={item.id} 
          className="relative"
          variants={navigationItemVariants}
          custom={index}
        >
          <motion.div
            variants={hoverVariants}
            initial="initial"
            whileHover="hover"
            whileTap="tap"
          >
            <Button
              variant="ghost"
              onClick={() => onNavigate(item.id)}
              className={`
                relative px-4 py-2 h-10 font-medium text-sm transition-all duration-200 rounded-md
                ${item.active 
                  ? 'text-kongo-black bg-surface-kongo-lime-light hover:bg-surface-kongo-lime-medium' 
                  : 'text-secondary hover:text-kongo-black hover:bg-surface-hover'
                }
              `}
            >
              {item.label}
            </Button>
          </motion.div>

          {/* Active indicator avec animation améliorée */}
          {item.active && (
            <motion.div
              layoutId="activeIndicator"
              variants={activeIndicatorVariants}
              className="absolute -bottom-1 left-1/2 w-1.5 h-1.5 bg-kongo-lime rounded-full shadow-kongo-lime"
              style={{ 
                transform: 'translateX(-50%)',
                boxShadow: '0 0 6px var(--kongo-lime)'
              }}
              initial={false}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 30,
                layout: {
                  type: "spring",
                  stiffness: 400,
                  damping: 30
                }
              }}
            />
          )}

          {/* Subtle glow effect on hover */}
          <motion.div
            className="absolute inset-0 rounded-md pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ 
              opacity: item.active ? 0 : 0.1,
              background: 'radial-gradient(circle, var(--kongo-lime) 0%, transparent 70%)'
            }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>
      ))}
    </nav>
  );
}