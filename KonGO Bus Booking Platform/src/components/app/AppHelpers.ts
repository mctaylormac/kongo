import { NAVIGATION_PAGES, BOOKING_FLOW_PAGES } from './AppConstants';
import { AppState, BreadcrumbItem } from './AppTypes';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

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

  if (appState.selectedTrip && ([NAVIGATION_PAGES.SEATS, NAVIGATION_PAGES.BAGGAGE, NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION] as string[]).includes(appState.currentPage)) {
    items.push({
      id: NAVIGATION_PAGES.SEATS,
      label: 'Sélection des sièges',
      clickable: ([NAVIGATION_PAGES.BAGGAGE, NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION] as string[]).includes(appState.currentPage)
    });
  }

  if (appState.selectedSeats.length > 0 && ([NAVIGATION_PAGES.BAGGAGE, NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION] as string[]).includes(appState.currentPage)) {
    items.push({
      id: NAVIGATION_PAGES.BAGGAGE,
      label: 'Calcul bagages',
      clickable: ([NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION] as string[]).includes(appState.currentPage)
    });
  }

  if (([NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION] as string[]).includes(appState.currentPage)) {
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
  const handleLogin = async (credentials: any) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Fetch role from profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name, agency_id')
          .eq('id', authData.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        const role = profile?.role || 'user';
        const userName = profile?.full_name || authData.user.email || "Utilisateur";
        
        appState.setUserRole(role as any);

        toast.success("✅ Connexion réussie", {
          description: `Bienvenue, ${userName} (${role})`
        });

        if (['superuser', 'agency', 'chef', 'driver', 'cashier'].includes(role)) {
          appState.setCurrentPage(NAVIGATION_PAGES.ADMIN_DASHBOARD);
        } else {
          appState.setCurrentPage(NAVIGATION_PAGES.DASHBOARD);
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error("❌ Erreur de connexion", {
        description: error.message || "Identifiants invalides"
      });
    }
  };

  const handleSignup = async (userData: any) => {
    try {
      // Création de l'utilisateur avec Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: `${userData.firstName} ${userData.lastName}`,
            phone_number: userData.phone,
            city: userData.city,
            date_of_birth: userData.dateOfBirth
          }
        }
      });

      if (error) throw error;

      // Si aucune erreur, l'utilisateur est maintenant créé et prêt à être utilisé
      if (data.user) {
        toast.success("🎉 Inscription réussie !", {
          description: "Bienvenue sur KonGO ! Votre compte a été créé avec succès."
        });

        // Redirection directe vers le dashboard
        appState.setCurrentPage(NAVIGATION_PAGES.DASHBOARD);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error("❌ Erreur d'inscription", {
        description: error.message || "Une erreur est survenue lors de la création de votre compte."
      });
    }
  };

  const handleSocialAuth = async (provider: any) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Social auth error:', error);
      toast.error("❌ Erreur d'authentification sociale", {
        description: error.message
      });
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("📧 Email envoyé", {
        description: "Instructions de réinitialisation envoyées à votre adresse"
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      toast.error("❌ Erreur", {
        description: error.message
      });
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
  userRole: appState.userRole,
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
    currentPage !== NAVIGATION_PAGES.SIGNUP &&
    currentPage !== NAVIGATION_PAGES.ADMIN_LOGIN &&
    currentPage !== NAVIGATION_PAGES.ADMIN_DASHBOARD;
};

export const shouldShowFooter = (currentPage: string) => {
  return currentPage === NAVIGATION_PAGES.HOME;
};

export const getMainContentClassName = (currentPage: string) => {
  if (currentPage === NAVIGATION_PAGES.HOME) {
    return "";
  }

  if (currentPage === NAVIGATION_PAGES.LOGIN || currentPage === NAVIGATION_PAGES.SIGNUP || currentPage === NAVIGATION_PAGES.ADMIN_LOGIN) {
    return "pt-0";
  }

  if (BOOKING_FLOW_PAGES.includes(currentPage as any)) {
    return "pt-0";
  }

  if (currentPage === NAVIGATION_PAGES.ADMIN_DASHBOARD) {
    return "pt-0 pb-0";
  }

  return "pt-6";
};