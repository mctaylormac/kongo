import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { HeaderLogo } from "./header/HeaderLogo";
import { HeaderNavigation } from "./header/HeaderNavigation";
import { HeaderActions } from "./header/HeaderActions";
import { MobileMenu } from "./header/MobileMenu";

interface HeaderProps {
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  currentPage: string;
  onPageChange: (page: string) => void;
  notificationCount?: number;
  onToggleNotifications?: () => void;
}

const NAVIGATION_ITEMS = [
  { id: 'home', label: 'Accueil' },
  { id: 'search', label: 'Rechercher' },
  { id: 'agencies', label: 'Agences' },
  { id: 'dashboard', label: 'Mes Voyages' }
];

const LANGUAGES = [
  { code: 'FR', name: 'Français', flag: '🇫🇷' },
  { code: 'EN', name: 'English', flag: '🇺🇸' }
];

// Animation variants sophistiquées pour le header KonGO
const headerVariants = {
  hidden: {
    y: -100,
    opacity: 0,
    scale: 0.95,
    filter: "blur(10px)"
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.8,
      when: "beforeChildren",
      staggerChildren: 0.15
    }
  }
};

const logoVariants = {
  hidden: {
    x: -50,
    opacity: 0,
    scale: 0.8,
    rotate: -10
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 15,
      duration: 0.6
    }
  }
};

const navigationVariants = {
  hidden: {
    y: -20,
    opacity: 0,
    scale: 0.9
  },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 15,
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const actionsVariants = {
  hidden: {
    x: 50,
    opacity: 0,
    scale: 0.8
  },
  visible: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 140,
      damping: 15,
      duration: 0.6,
      staggerChildren: 0.08
    }
  }
};

const borderVariants = {
  hidden: {
    scaleX: 0,
    opacity: 0
  },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      delay: 0.6,
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export function Header({ 
  currentLanguage, 
  onLanguageChange, 
  currentPage, 
  onPageChange,
  notificationCount = 0,
  onToggleNotifications
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger animation on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Close mobile menu when page changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPage]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogoClick = () => {
    onPageChange('home');
  };

  const handleDemoTrigger = () => {
    const mockSearchParams = {
      from: "Kinshasa",
      to: "Lubumbashi", 
      date: new Date().toISOString().split('T')[0],
      passengers: 2
    };
    
    const mockTrip = {
      id: "demo-trip-header",
      operator: "KonGO Premium",
      from: "Kinshasa", 
      to: "Lubumbashi",
      departure: "14:00",
      arrival: "06:00+1", 
      duration: "16h",
      price: 125000,
      currency: "CDF",
      amenities: ["WiFi", "Climatisation", "Repas", "Toilettes"],
      seatsAvailable: 28,
      busType: "Luxury Coach",
      date: mockSearchParams.date
    };
    
    const event = new CustomEvent('demo-seat-selection', {
      detail: { trip: mockTrip, searchParams: mockSearchParams }
    });
    window.dispatchEvent(event);
  };

  // Create navigation items with active state
  const navigationItems = NAVIGATION_ITEMS.map(item => ({
    ...item,
    active: currentPage === item.id || 
            (item.id === 'search' && ['search', 'seats', 'payment', 'confirmation'].includes(currentPage))
  }));

  return (
    <>
      <motion.header
        variants={headerVariants}
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        className={`
          fixed top-0 left-0 right-0 z-40 transition-all duration-300
          ${isScrolled 
            ? 'bg-surface-elevated/95 backdrop-blur-md shadow-lg' 
            : 'bg-surface-primary'
          }
        `}
      >
        {/* Animated border bottom */}
        <motion.div
          variants={borderVariants}
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-kongo-lime to-transparent origin-center"
        />
        
        <div className="container-professional">
          <div className="flex items-center justify-between h-14 relative">
            
            {/* Logo with enhanced animation */}
            <motion.div variants={logoVariants}>
              <HeaderLogo onClick={handleLogoClick} />
            </motion.div>
            
            {/* Desktop Navigation with staggered animation */}
            <motion.div variants={navigationVariants} className="hidden lg:block">
              <HeaderNavigation 
                items={navigationItems}
                onNavigate={onPageChange}
              />
            </motion.div>
            
            {/* Actions with staggered animation */}
            <motion.div 
              variants={actionsVariants}
              className="flex items-center space-x-3"
            >
              <HeaderActions
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                onPageChange={onPageChange}
                onDemoTrigger={handleDemoTrigger}
                notificationCount={notificationCount}
                onToggleNotifications={onToggleNotifications}
              />
              
              {/* Mobile Menu */}
              <MobileMenu
                isOpen={isMobileMenuOpen}
                onToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                navigationItems={navigationItems}
                languages={LANGUAGES}
                currentLanguage={currentLanguage}
                onLanguageChange={onLanguageChange}
                onNavigate={onPageChange}
                onDemoTrigger={handleDemoTrigger}
              />
            </motion.div>

            {/* Subtle glow effect when scrolled */}
            {isScrolled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-kongo-lime/5 to-transparent pointer-events-none"
              />
            )}
          </div>
        </div>
      </motion.header>

      {/* Spacer to prevent content overlap */}
      <div className="h-14" />
    </>
  );
}