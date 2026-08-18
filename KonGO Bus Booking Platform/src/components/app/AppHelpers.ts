import { NAVIGATION_PAGES, BOOKING_FLOW_PAGES } from './AppConstants';
import {
  ADMIN_ROLES,
  AppState,
  AuthCredentials,
  BaggageItem,
  BookingPaymentData,
  BreadcrumbItem,
  normalizeUserRole,
  SearchParams,
  Seat,
  SignupData,
  SocialProvider,
  Trip,
  UserProfile,
} from './AppTypes';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

export const ADMIN_PATHS = [] as const;

export interface RouteGuardContext {
  currentPage: string;
  isAuthenticated: boolean;
  userRole: AppState['userRole'];
}

export function resolveInitialPageFromPath(pathname: string): string {
  const path = pathname.toLowerCase();

  if (path === '/admin') {
    return NAVIGATION_PAGES.LOGIN;
  }

  if (path === '/login') {
    return NAVIGATION_PAGES.LOGIN;
  }

  return NAVIGATION_PAGES.HOME;
}

export function resolveProtectedPage({ currentPage, isAuthenticated, userRole }: RouteGuardContext): string | null {
  if (!isAuthenticated) {
    if (currentPage === NAVIGATION_PAGES.DASHBOARD) {
      return NAVIGATION_PAGES.LOGIN;
    }
    return null;
  }

  if (
    (currentPage === NAVIGATION_PAGES.LOGIN || currentPage === NAVIGATION_PAGES.SIGNUP) &&
    isAuthenticated
  ) {
    return NAVIGATION_PAGES.DASHBOARD;
  }

  return null;
}

export const createBreadcrumbItems = (appState: AppState): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = [];

  if (appState.currentPage !== NAVIGATION_PAGES.HOME) {
    items.push({ id: NAVIGATION_PAGES.HOME, label: 'Accueil', clickable: true });
  }

  if (appState.searchParams && appState.currentPage !== NAVIGATION_PAGES.HOME) {
    items.push({
      id: NAVIGATION_PAGES.SEARCH,
      label: `${appState.searchParams.from} -> ${appState.searchParams.to}`,
      clickable: appState.currentPage !== NAVIGATION_PAGES.SEARCH && appState.currentPage !== NAVIGATION_PAGES.HOME,
    });
  }

  if (
    appState.selectedTrip &&
    ([NAVIGATION_PAGES.SEATS, NAVIGATION_PAGES.BAGGAGE, NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION] as string[]).includes(appState.currentPage)
  ) {
    items.push({
      id: NAVIGATION_PAGES.SEATS,
      label: 'Selection des sieges',
      clickable: ([NAVIGATION_PAGES.BAGGAGE, NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION] as string[]).includes(appState.currentPage),
    });
  }

  if (
    appState.selectedSeats.length > 0 &&
    ([NAVIGATION_PAGES.BAGGAGE, NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION] as string[]).includes(appState.currentPage)
  ) {
    items.push({
      id: NAVIGATION_PAGES.BAGGAGE,
      label: 'Calcul bagages',
      clickable: ([NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION] as string[]).includes(appState.currentPage),
    });
  }

  if (([NAVIGATION_PAGES.PAYMENT, NAVIGATION_PAGES.CONFIRMATION] as string[]).includes(appState.currentPage)) {
    items.push({
      id: NAVIGATION_PAGES.PAYMENT,
      label: 'Paiement',
      clickable: appState.currentPage === NAVIGATION_PAGES.CONFIRMATION,
    });
  }

  if (appState.currentPage === NAVIGATION_PAGES.CONFIRMATION) {
    items.push({ id: NAVIGATION_PAGES.CONFIRMATION, label: 'Confirmation', current: true });
  } else if (appState.currentPage === NAVIGATION_PAGES.DASHBOARD) {
    items.push({ id: NAVIGATION_PAGES.DASHBOARD, label: 'Tableau de bord', current: true });
  } else if (appState.currentPage === NAVIGATION_PAGES.AGENCIES) {
    items.push({ id: NAVIGATION_PAGES.AGENCIES, label: 'Nos agences', current: true });
  } else if (appState.currentPage === NAVIGATION_PAGES.LOGIN) {
    items.push({ id: NAVIGATION_PAGES.LOGIN, label: 'Connexion', current: true });
  } else if (appState.currentPage === NAVIGATION_PAGES.SIGNUP) {
    items.push({ id: NAVIGATION_PAGES.SIGNUP, label: 'Inscription', current: true });
  }

  return items;
};

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
    handleBreadcrumbNavigate,
  };
};

export interface BookingHandlers {
  handleSearch: (params: SearchParams) => void;
  handleTripSelection: (trip: Trip) => void;
  handleSeatSelection: (seats: Seat[]) => void;
  handleBaggageCalculation: (baggage: BaggageItem[], totalCost: number) => void;
  handlePaymentComplete: (booking: any) => void;
  handleLanguageChange: (language: string) => void;
  handleLogin: (credentials: AuthCredentials) => Promise<void>;
  handleSignup: (userData: SignupData) => Promise<void>;
  handleSocialAuth: (provider: SocialProvider) => Promise<void>;
  handleForgotPassword: (email: string) => Promise<void>;
}

export const createBookingHandlers = (
  appState: AppState,
  navigationHandlers: ReturnType<typeof createNavigationHandlers>
): BookingHandlers & ReturnType<typeof createNavigationHandlers> => {
  const handleSearch = (params: SearchParams) => {
    appState.setSearchParams(params);
    appState.setCurrentPage(NAVIGATION_PAGES.SEARCH);
  };

  const handleTripSelection = (trip: Trip) => {
    appState.setSelectedTrip(trip);
    appState.setCurrentPage(NAVIGATION_PAGES.SEATS);
  };

  const handleSeatSelection = (seats: Seat[]) => {
    appState.setSelectedSeats(seats);
    appState.setCurrentPage(NAVIGATION_PAGES.BAGGAGE);
  };

  const handleBaggageCalculation = (baggage: BaggageItem[], totalCost: number) => {
    appState.setBaggageData({ items: baggage, totalCost });
  };

  const handlePaymentComplete = (booking: any) => {
    appState.completeBooking(booking);
    appState.setCurrentPage(NAVIGATION_PAGES.CONFIRMATION);
  };

  const handleLanguageChange = (language: string) => {
    appState.updatePreferences({ language });
  };

  const handleLogin = async (credentials: AuthCredentials) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name, agency_id')
          .eq('id', authData.user.id)
          .single<UserProfile>();

        if (profileError && profileError.code !== 'PGRST116') throw profileError;

        const role = normalizeUserRole(profile?.role);
        const userName = profile?.full_name || authData.user.email || 'Utilisateur';

        appState.setIsAuthenticated(true);
        appState.setUserRole(role);

        toast.success('Connexion reussie', {
          description: `Bienvenue, ${userName} (${role})`,
        });

        if (ADMIN_ROLES.includes(role)) {
          // In Front-office, admins are redirected to help/info or just stay on dashboard
          appState.setCurrentPage(NAVIGATION_PAGES.HOME);
          toast.info("Veuillez utiliser le portail Back-office pour l'administration.");
        } else {
          appState.setCurrentPage(NAVIGATION_PAGES.DASHBOARD);
        }
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Identifiants invalides';
      console.error('Login error:', error);
      toast.error('Erreur de connexion', {
        description: message,
      });
    }
  };

  const handleSignup = async (userData: SignupData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: `${userData.firstName} ${userData.lastName}`,
            phone_number: userData.phone,
            city: userData.city,
            date_of_birth: userData.dateOfBirth,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast.success('Inscription reussie', {
          description: 'Bienvenue sur KonGO. Votre compte a ete cree avec succes.',
        });

        appState.setCurrentPage(NAVIGATION_PAGES.LOGIN);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Une erreur est survenue lors de la creation de votre compte.";
      console.error('Signup error:', error);
      toast.error("Erreur d'inscription", {
        description: message,
      });
    }
  };

  const handleSocialAuth = async (provider: SocialProvider) => {
    try {
      const oauthProvider = provider === 'microsoft' ? 'azure' : provider;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: oauthProvider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erreur d'authentification sociale";
      console.error('Social auth error:', error);
      toast.error("Erreur d'authentification sociale", {
        description: message,
      });
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success('Email envoye', {
        description: 'Instructions de reinitialisation envoyees a votre adresse',
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur';
      console.error('Password reset error:', error);
      toast.error('Erreur', {
        description: message,
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
    ...navigationHandlers,
  };
};

export interface PageProps {
  searchParams: SearchParams | null;
  selectedTrip: Trip | null;
  selectedSeats: Seat[];
  baggageData: AppState['baggageData'];
  bookingData: AppState['bookingData'];
  bookingHistory: AppState['bookingHistory'];
  favoriteRoutes: AppState['favoriteRoutes'];
  preferences: AppState['userPreferences'];
  userRole: AppState['userRole'];
  isOnline: boolean;
  onSelectTrip: (trip: Trip) => void;
  onContinue: (seats: Seat[]) => void;
  onBaggageUpdate: (baggage: BaggageItem[], totalCost: number) => void;
  onPaymentComplete: (booking: any) => void;
  onNewSearch: () => void;
  onPageChange: (page: string) => void;
  onAddToFavorites: AppState['addToFavorites'];
  onUpdatePreferences: AppState['updatePreferences'];
  onClearHistory: AppState['clearHistory'];
  onBack: () => void;
  passengers: number;
  onLogin: (credentials: AuthCredentials) => Promise<void>;
  onSignup: (userData: SignupData) => Promise<void>;
  onSocialLogin: (provider: SocialProvider) => Promise<void>;
  onSocialSignup: (provider: SocialProvider) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  onNavigateToLogin: () => void;
  onNavigateToSignup: () => void;
  isLoading: boolean;
  error: string | null;
}

export const createPageProps = (
  appState: AppState,
  handlers: BookingHandlers & ReturnType<typeof createNavigationHandlers>,
  connectionStatus: boolean
): PageProps => ({
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
  onLogin: handlers.handleLogin,
  onSignup: handlers.handleSignup,
  onSocialLogin: handlers.handleSocialAuth,
  onSocialSignup: handlers.handleSocialAuth,
  onForgotPassword: handlers.handleForgotPassword,
  onNavigateToLogin: () => appState.setCurrentPage(NAVIGATION_PAGES.LOGIN),
  onNavigateToSignup: () => appState.setCurrentPage(NAVIGATION_PAGES.SIGNUP),
  isLoading: false,
  error: null,
});

export const shouldOfferSessionRecovery = (appState: AppState) => {
  try {
    const sessionAge = appState.getSessionAge();
    return sessionAge < 24 * 60 * 60 * 1000 && appState.searchParams && appState.currentPage === NAVIGATION_PAGES.HOME;
  } catch {
    return false;
  }
};

export const shouldShowProgressBar = (currentPage: string) => {
  return BOOKING_FLOW_PAGES.includes(currentPage as any);
};

export const shouldShowBreadcrumbs = (currentPage: string) => {
  return (
    currentPage !== NAVIGATION_PAGES.HOME &&
    currentPage !== NAVIGATION_PAGES.LOGIN &&
    currentPage !== NAVIGATION_PAGES.SIGNUP
  );
};

export const shouldShowQuickActions = (currentPage: string) => {
  const isAdminPage = currentPage.startsWith('admin') || 
                      currentPage.includes('dashboard') || 
                      currentPage.includes('management');
  
  // Masquer sur les pages d'authentification pour la clarté
  const isAuthPage = currentPage === NAVIGATION_PAGES.LOGIN || 
                    currentPage === NAVIGATION_PAGES.SIGNUP;
                    
  return !isAdminPage && !isAuthPage;
};

export const shouldShowFooter = (currentPage: string) => {
  return currentPage === NAVIGATION_PAGES.HOME;
};

export const getMainContentClassName = (currentPage: string) => {
  if (currentPage === NAVIGATION_PAGES.HOME) {
    return '';
  }

  if (
    currentPage === NAVIGATION_PAGES.LOGIN ||
    currentPage === NAVIGATION_PAGES.SIGNUP
  ) {
    return 'pt-0';
  }

  if (BOOKING_FLOW_PAGES.includes(currentPage as any)) {
    return 'pt-0';
  }


  return 'pt-6';
};
