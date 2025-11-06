import { NAVIGATION_PAGES, BOOKING_FLOW_PAGES } from './AppConstants';
import { AppState, BreadcrumbItem } from './AppTypes';
import { signInWithEmail, signUpWithEmail, resetPassword, signInWithGoogle } from '../../lib/auth';
import { setUserProfile } from '../../lib/firestore';

// Breadcrumb generation logic
export const createBreadcrumbItems = (appState: AppState): BreadcrumbItem[] => {
  const items = [];
  
  if (appState.currentPage !== NAVIGATION_PAGES.HOME) {
    items.push({ id: NAVIGATION_PAGES.HOME, label: 'Accueil', clickable: true });
  }
  
  if (appState.searchParams && appState.currentPage !== NAVIGATION_PAGES.HOME) {
    items.push({ 
      id: NAVIGATION_PAGES.SEARCH, 
      label: `${appState.searchParams.from} → ${appState.searchParams.to}`, 
      clickable: appState.currentPage !== NAVIGATION_PAGES.SEARCH && appState.currentPage !== NAVIGATION_PAGES.HOME
    });
  }
  
  if (appState.selectedTrip && [NAVIGATION_PAGES.SEATS, NAVIGATION_PAGES.BAGGAGE, NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION].includes(appState.currentPage)) {
    items.push({ 
      id: NAVIGATION_PAGES.SEATS, 
      label: 'Sélection des sièges', 
      clickable: [NAVIGATION_PAGES.BAGGAGE, NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION].includes(appState.currentPage)
    });
  }
  
  if (appState.selectedSeats.length > 0 && [NAVIGATION_PAGES.BAGGAGE, NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION].includes(appState.currentPage)) {
    items.push({ 
      id: NAVIGATION_PAGES.BAGGAGE, 
      label: 'Calcul bagages', 
      clickable: [NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION].includes(appState.currentPage)
    });
  }
  
  if ([NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION].includes(appState.currentPage)) {
    items.push({ 
      id: NAVIGATION_PAGES.PAYMENT, 
      label: 'Paiement', 
      clickable: appState.currentPage === NAVIGATION_PAGES.CONFIRMATION
    });
  }
  
  if (appState.currentPage === NAVIGATION_PAGES.CONFIRMATION) {
    items.push({ id: NAVIGATION_PAGES.CONFIRMATION, label: 'Confirmation', current: true });
  } else if (appState.currentPage === NAVIGATION_PAGES.DASHBOARD) {
    items.push({ id: NAVIGATION_PAGES.DASHBOARD, label: 'Tableau de bord', current: true });
  } else if (appState.currentPage === NAVIGATION_PAGES.AGENCIES) {
    items.push({ id: NAVIGATION_PAGES.AGENCIES, label: 'Nos Agences', current: true });
  } else if (appState.currentPage === NAVIGATION_PAGES.LOGIN) {
    items.push({ id: NAVIGATION_PAGES.LOGIN, label: 'Connexion', current: true });
  } else if (appState.currentPage === NAVIGATION_PAGES.SIGNUP) {
    items.push({ id: NAVIGATION_PAGES.SIGNUP, label: 'Inscription', current: true });
  }

  return items;
};

// Navigation handlers factory
export const createNavigationHandlers = (appState: AppState) => {
  const handleNewSearch = () => {
    appState.resetBookingFlow();
  };

  const handleBackToSearch = () => {
    appState.setCurrentPage(NAVIGATION_PAGES.SEARCH);
    appState.setSelectedTrip(null);
  };

  const handleBackToSeats = () => {
    appState.setCurrentPage(NAVIGATION_PAGES.SEATS);
  };

  const handleBackToBaggage = () => {
    appState.setCurrentPage(NAVIGATION_PAGES.BAGGAGE);
  };

  const handleBack = () => {
    switch (appState.currentPage) {
      case NAVIGATION_PAGES.SEARCH:
        appState.setCurrentPage(NAVIGATION_PAGES.HOME);
        break;
      case NAVIGATION_PAGES.SEATS:
        handleBackToSearch();
        break;
      case NAVIGATION_PAGES.BAGGAGE:
        handleBackToSeats();
        break;
      case NAVIGATION_PAGES.PAYMENT:
        handleBackToBaggage();
        break;
      case NAVIGATION_PAGES.CONFIRMATION:
      case NAVIGATION_PAGES.DASHBOARD:
      case NAVIGATION_PAGES.AGENCIES:
      case NAVIGATION_PAGES.LOGIN:
      case NAVIGATION_PAGES.SIGNUP:
        handleNewSearch();
        break;
      default:
        appState.setCurrentPage(NAVIGATION_PAGES.HOME);
    }
  };

  const handleBreadcrumbNavigate = (id: string) => {
    switch (id) {
      case NAVIGATION_PAGES.HOME:
        handleNewSearch();
        break;
      case NAVIGATION_PAGES.SEARCH:
        handleBackToSearch();
        break;
      case NAVIGATION_PAGES.SEATS:
        handleBackToSeats();
        break;
      case NAVIGATION_PAGES.BAGGAGE:
        handleBackToSeats();
        break;
      default:
        appState.setCurrentPage(id);
    }
  };

  return {
    handleNewSearch,
    handleBackToSearch,
    handleBackToSeats,
    handleBack,
    handleBreadcrumbNavigate
  };
};

// Booking flow handlers factory
export const createBookingHandlers = (appState: AppState, navigationHandlers: any) => {
  const handleSearch = (params: any) => {
    appState.setSearchParams(params);
    appState.setCurrentPage(NAVIGATION_PAGES.SEARCH);
  };

  const handleTripSelection = (trip: any) => {
    appState.setSelectedTrip(trip);
    appState.setCurrentPage(NAVIGATION_PAGES.SEATS);
  };

  const handleSeatSelection = (seats: any[]) => {
    appState.setSelectedSeats(seats);
    appState.setCurrentPage(NAVIGATION_PAGES.BAGGAGE);
  };

  const handleBaggageCalculation = (baggage: any[], totalCost: number) => {
    appState.setBaggageData({ items: baggage, totalCost });
  };

  const handlePaymentComplete = (paymentData: any) => {
    appState.completeBooking(paymentData);
    appState.setCurrentPage(NAVIGATION_PAGES.CONFIRMATION);
  };

  const handleLanguageChange = (language: string) => {
    appState.updatePreferences({ language });
  };

  // Authentication handlers
  const handleLogin = async (credentials: { email: string; password: string; rememberMe: boolean }) => {
    try {
      await signInWithEmail(credentials.email, credentials.password, { rememberMe: credentials.rememberMe });
      appState.setCurrentPage(NAVIGATION_PAGES.DASHBOARD);
    } catch (error: any) {
      console.error('Login error:', error);
      // Surface error via state if needed (handled by caller/UI toast)
    }
  };

  const handleSignup = async (userData: { 
    firstName?: string;
    lastName?: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    city?: string;
    password: string;
    acceptTerms?: boolean;
    marketing?: boolean;
    rememberMe?: boolean;
  }) => {
    try {
      const cred = await signUpWithEmail(userData.email, userData.password, { rememberMe: !!userData.rememberMe });
      // Save profile document
      await setUserProfile(cred.user.uid, {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email,
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '',
        city: userData.city || '',
        marketing: !!userData.marketing,
        createdAt: new Date().toISOString()
      });
      appState.setCurrentPage(NAVIGATION_PAGES.DASHBOARD);
    } catch (error: any) {
      console.error('Signup error:', error);
    }
  };

  const handleSocialAuth = async (provider: string) => {
    try {
      if (provider === 'google') {
        await signInWithGoogle({ rememberMe: true });
        appState.setCurrentPage(NAVIGATION_PAGES.DASHBOARD);
      }
    } catch (error: any) {
      console.error('Social auth error:', error);
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (error: any) {
      console.error('Password reset error:', error);
    }
  };

  return {
    handleSearch,
    handleTripSelection,
    handleSeatSelection,
    handleBaggageCalculation,
    handlePaymentComplete,
    handleLanguageChange,
    handleLogin,
    handleSignup,
    handleSocialAuth,
    handleForgotPassword,
    ...navigationHandlers
  };
};

// Page props factory
export const createPageProps = (appState: AppState, handlers: any, connectionStatus: boolean) => ({
  searchParams: appState.searchParams,
  selectedTrip: appState.selectedTrip,
  selectedSeats: appState.selectedSeats,
  baggageData: appState.baggageData,
  bookingData: appState.bookingData,
  bookingHistory: appState.bookingHistory,
  favoriteRoutes: appState.favoriteRoutes,
  preferences: appState.userPreferences,
  isOnline: connectionStatus,
  onSelectTrip: handlers.handleTripSelection,
  onContinue: handlers.handleSeatSelection,
  onBaggageUpdate: handlers.handleBaggageCalculation,
  onPaymentComplete: handlers.handlePaymentComplete,
  onNewSearch: handlers.handleNewSearch,
  onPageChange: appState.setCurrentPage,
  onAddToFavorites: appState.addToFavorites,
  onUpdatePreferences: appState.updatePreferences,
  onClearHistory: appState.clearHistory,
  onBack: handlers.handleBack,
  passengers: appState.searchParams?.passengers || 1,
  
  // Authentication props
  onLogin: handlers.handleLogin,
  onSignup: handlers.handleSignup,
  onSocialLogin: handlers.handleSocialAuth,
  onSocialSignup: handlers.handleSocialAuth,
  onForgotPassword: handlers.handleForgotPassword,
  onNavigateToLogin: () => appState.setCurrentPage(NAVIGATION_PAGES.LOGIN),
  onNavigateToSignup: () => appState.setCurrentPage(NAVIGATION_PAGES.SIGNUP),
  isLoading: false,
  error: null
});

// Session management helpers
export const shouldOfferSessionRecovery = (appState: AppState) => {
  try {
    const sessionAge = appState.getSessionAge();
    return sessionAge < 24 * 60 * 60 * 1000 && 
           appState.searchParams && 
           appState.currentPage === NAVIGATION_PAGES.HOME;
  } catch (error) {
    return false;
  }
};

// Page layout helpers
export const shouldShowProgressBar = (currentPage: string) => {
  return BOOKING_FLOW_PAGES.includes(currentPage as any);
};

export const shouldShowBreadcrumbs = (currentPage: string) => {
  return currentPage !== NAVIGATION_PAGES.HOME && 
         currentPage !== NAVIGATION_PAGES.LOGIN && 
         currentPage !== NAVIGATION_PAGES.SIGNUP;
};

export const shouldShowFooter = (currentPage: string) => {
  return currentPage === NAVIGATION_PAGES.HOME;
};

export const getMainContentClassName = (currentPage: string) => {
  if (currentPage === NAVIGATION_PAGES.HOME) {
    return "";
  }
  
  if (currentPage === NAVIGATION_PAGES.LOGIN || currentPage === NAVIGATION_PAGES.SIGNUP) {
    return "pt-0";
  }
  
  if (BOOKING_FLOW_PAGES.includes(currentPage as any)) {
    return "pt-0";
  }
  
  return "pt-6";
};