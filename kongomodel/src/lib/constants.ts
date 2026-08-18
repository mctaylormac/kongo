import { motion } from "motion/react";

// Navigation pages constants
export const NAVIGATION_PAGES = {
  ADMIN_DASHBOARD: 'admin-dashboard',
  ADMIN_BUSES: 'admin-buses',
  ADMIN_TRIPS: 'admin-trips',
  ADMIN_BOOKINGS: 'admin-bookings',
  ADMIN_AGENCIES: 'admin-agencies',
  ADMIN_CLIENTS: 'admin-clients',
  ADMIN_LOGIN: 'admin-login'
} as const;

export const ADMIN_ROLES = ['superuser', 'agency', 'chef', 'cashier'] as const;

// Booking flow pages are not used in backoffice
export const BOOKING_FLOW_PAGES = [] as const;

// Animations constants
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    filter: "blur(4px)"
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)"
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02,
    filter: "blur(4px)"
  }
};

export const pageTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20,
  duration: 0.6
};

// Staggered content animation pour les sections
export const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 20
    }
  }
};

// Session management constants
export const SESSION_CONFIG = {
  STORAGE_KEY: 'kongo-app-session',
  MAX_AGE_HOURS: 24,
  RECOVERY_DELAY_MS: 1500,
  TOAST_DURATION_MS: 8000
} as const;

// Contact information
export const CONTACT_INFO = {
  phone: '+243123456789',
  email: 'contact@kongo-transport.cd',
  whatsapp: '+243987654321',
  address: 'Avenue Lumumba, Kinshasa, RDC'
} as const;

// Enhanced animation presets pour différentes sections
export const heroAnimations = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  },
  item: {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 15
      }
    }
  }
};

export const cardAnimations = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  },
  item: {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 20
      }
    }
  }
};

export const fadeInVariants = {
  hidden: {
    opacity: 0,
    filter: "blur(4px)"
  },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
    }
  }
};

// Database interfaces
export interface Stop {
  id: string;
  name: string;
  city_name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface AgeCategory {
  id: string;
  name: string;
  discount_percentage: number;
  trip_id?: string | null;
}
