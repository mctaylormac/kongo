import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "react-error-boundary";
import { toast, Toaster } from "sonner";
import { LoadingScreen } from "./components/LoadingScreen";
import { useAppState } from "./hooks/useAppState";
import { supabase } from "./lib/supabase";
import {
  pageVariants,
  pageTransition,
  NAVIGATION_PAGES,
} from "./components/app/AppConstants";
import {
  createNavigationHandlers,
  createBookingHandlers,
  createPageProps,
  resolveProtectedPage,
  getMainContentClassName,
} from "./components/app/AppHelpers";
import {
  ErrorFallback,
} from "./components/app/AppComponents";
import { PageRenderer } from "./components/app/PageRenderer";
import { normalizeUserRole } from "./components/app/AppTypes";
import { DashboardLayout } from "./components/admin/DashboardLayout";

export default function App() {
  const appState = useAppState();
  const {
    currentPage,
    userRole,
    isAuthenticated,
    isLoading,
    setCurrentPage,
    setIsAuthenticated,
    setUserRole,
  } = appState;
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(() => (typeof window !== "undefined" ? navigator.onLine : true));

  const navigationHandlers = createNavigationHandlers(appState);
  const bookingHandlers = createBookingHandlers(appState, navigationHandlers);

  const syncAuthState = useCallback(
    async (sessionOverride?: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"]) => {
      try {
        const session =
          sessionOverride ?? (await supabase.auth.getSession()).data.session;

        if (!session?.user) {
          setIsAuthenticated(false);
          setUserRole("guest");
          setIsAuthReady(true);
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (error) throw error;

        // Prevent customer users from accessing the backoffice platform
        const backofficeRoles = ['superuser', 'agency', 'driver', 'chef', 'cashier'];
        if (!profile?.role || !backofficeRoles.includes(profile.role)) {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setUserRole("guest");
          toast.error("Accès refusé : Ce portail est réservé aux comptes administratifs.");
          setIsAuthReady(true);
          return;
        }

        setIsAuthenticated(true);
        setUserRole(normalizeUserRole(profile?.role));
      } catch {
        setIsAuthenticated(false);
        setUserRole("guest");
      } finally {
        setIsAuthReady(true);
      }
    },
    [setIsAuthenticated, setUserRole]
  );

  const handleLogout = useCallback(() => {
    void supabase.auth.signOut();
    localStorage.removeItem('kongo-app-state');
    setIsAuthenticated(false);
    setUserRole("guest");
    setCurrentPage(NAVIGATION_PAGES.ADMIN_LOGIN);
    toast.info("Déconnexion réussie");
  }, [setCurrentPage, setIsAuthenticated, setUserRole]);

  const pageProps = {
    ...createPageProps(appState, bookingHandlers, connectionStatus),
    onLogout: handleLogout,
  };

  useEffect(() => {
    void syncAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncAuthState(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncAuthState]);

  useEffect(() => {
    if (!isAuthReady) return;

    const redirectedPage = resolveProtectedPage({
      currentPage,
      isAuthenticated,
      userRole,
    });

    if (redirectedPage && redirectedPage !== currentPage) {
      setCurrentPage(redirectedPage);
    }
  }, [currentPage, isAuthenticated, isAuthReady, setCurrentPage, userRole]);

  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus(true);
      toast.success("Connexion rétablie");
    };

    const handleOffline = () => {
      setConnectionStatus(false);
      toast.warning("Mode hors ligne activé");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        setIsInitialLoad(false);
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);

  if (isInitialLoad || isLoading || !isAuthReady) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className="min-h-screen bg-surface-primary relative overflow-x-hidden">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className={`relative z-10 w-full ${getMainContentClassName(currentPage)}`}
          >
            {isAuthenticated && currentPage !== NAVIGATION_PAGES.ADMIN_LOGIN ? (
              <DashboardLayout
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                onLogout={handleLogout}
                userRole={userRole}
              >
                <PageRenderer
                  currentPage={currentPage}
                  pageProps={pageProps}
                />
              </DashboardLayout>
            ) : (
              <main className="min-h-screen">
                <PageRenderer
                  currentPage={currentPage}
                  pageProps={pageProps}
                />
              </main>
            )}
          </motion.div>
        </AnimatePresence>

        <Toaster position="top-right" richColors />

        {import.meta.env.DEV && (
          <div className="fixed bottom-2 left-2 z-[100] bg-black text-white px-2 py-1 rounded text-[10px] font-mono opacity-50">
            {currentPage} | {userRole}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
