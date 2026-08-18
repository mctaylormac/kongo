import { NAVIGATION_PAGES } from './AppConstants';
import {
  ADMIN_ROLES,
  AppState,
  AuthCredentials,
  normalizeUserRole,
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

export function resolveInitialPageFromPath(_pathname: string): string {
  return NAVIGATION_PAGES.ADMIN_LOGIN;
}

export function resolveProtectedPage({ currentPage, isAuthenticated, userRole }: RouteGuardContext): string | null {
  const isAdminRole = ADMIN_ROLES.includes(userRole);

  if (!isAuthenticated) {
    if (currentPage !== NAVIGATION_PAGES.ADMIN_LOGIN) {
      return NAVIGATION_PAGES.ADMIN_LOGIN;
    }
    return null;
  }

  if (isAdminRole) {
    if (currentPage === NAVIGATION_PAGES.ADMIN_LOGIN) {
      return NAVIGATION_PAGES.ADMIN_DASHBOARD;
    }
    return null;
  }

  // Si authentifié mais pas admin role (utilisateur standard sur le backoffice)
  if (!isAdminRole && isAuthenticated) {
    void supabase.auth.signOut();
    return NAVIGATION_PAGES.ADMIN_LOGIN;
  }

  return null;
}

export const createNavigationHandlers = (appState: AppState) => {
  return {
    handleNewSearch: () => {},
    handleBackToSearch: () => {},
    handleBackToSeats: () => {},
    handleBack: () => appState.setCurrentPage(NAVIGATION_PAGES.ADMIN_DASHBOARD),
    handleBreadcrumbNavigate: (id: string) => appState.setCurrentPage(id),
  };
};

export interface BookingHandlers {
  handleLanguageChange: (language: string) => void;
  handleLogin: (credentials: AuthCredentials) => Promise<void>;
}

export const createBookingHandlers = (
  appState: AppState,
  _navigationHandlers: any
): any => {
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
          .select('role, full_name')
          .eq('id', authData.user.id)
          .single<UserProfile>();

        if (profileError) throw profileError;

        const role = normalizeUserRole(profile?.role);
        
        if (!ADMIN_ROLES.includes(role)) {
          await supabase.auth.signOut();
          throw new Error("Accès refusé : Ce portail est réservé aux administrateurs.");
        }

        const userName = profile?.full_name || authData.user.email || 'Utilisateur';

        appState.setIsAuthenticated(true);
        appState.setUserRole(role);

        toast.success('Connexion réussie', {
          description: `Bienvenue, ${userName}`,
        });

        appState.setCurrentPage(NAVIGATION_PAGES.ADMIN_DASHBOARD);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Identifiants invalides';
      toast.error('Erreur de connexion', {
        description: message,
      });
    }
  };

  return {
    handleLanguageChange,
    handleLogin,
  };
};

export interface PageProps {
  userRole: AppState['userRole'];
  isOnline: boolean;
  onPageChange: (page: string) => void;
  onBack: () => void;
  onLogin: (credentials: AuthCredentials) => Promise<void>;
  onLogout: () => void;
  isLoading: boolean;
  error: string | null;
}

export const createPageProps = (
  appState: AppState,
  handlers: any,
  connectionStatus: boolean
): PageProps => ({
  userRole: appState.userRole,
  isOnline: connectionStatus,
  onPageChange: appState.setCurrentPage,
  onBack: handlers.handleBack || (() => {}),
  onLogin: handlers.handleLogin,
  onLogout: handlers.handleLogout || (() => {}),
  isLoading: false,
  error: null,
});

export const shouldOfferSessionRecovery = (_appState: AppState) => false;
export const shouldShowProgressBar = (_currentPage: string) => false;
export const shouldShowBreadcrumbs = (_currentPage: string) => false;
export const shouldShowQuickActions = (_currentPage: string) => false;
export const shouldShowFooter = (_currentPage: string) => false;

export const getMainContentClassName = (currentPage: string) => {
  if (currentPage === NAVIGATION_PAGES.ADMIN_LOGIN) {
    return 'pt-0';
  }
  return 'pt-0 pb-0';
};
