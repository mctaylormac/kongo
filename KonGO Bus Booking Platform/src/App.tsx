import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "react-error-boundary";
import { toast, Toaster } from "sonner";
import { Header } from "./components/Header";
import { LoadingScreen } from "./components/LoadingScreen";
import { ProgressBar } from "./components/ProgressBar";
import { QuickActions } from "./components/QuickActions";
import { useAppState } from "./hooks/useAppState";
import { supabase } from "./lib/supabase";
import {
  pageVariants,
  pageTransition,
  createProgressSteps,
  NAVIGATION_PAGES,
  CONTACT_INFO,
} from "./components/app/AppConstants";
import {
  createNavigationHandlers,
  createBookingHandlers,
  createPageProps,
  resolveProtectedPage,
  shouldOfferSessionRecovery,
  shouldShowProgressBar,
  shouldShowFooter,
  shouldShowQuickActions,
  getMainContentClassName,
} from "./components/app/AppHelpers";
import {
  ErrorFallback,
  ComponentLoadingFallback,
  ConnectionStatusBanner,
} from "./components/app/AppComponents";
import { PageRenderer } from "./components/app/PageRenderer";
import { normalizeUserRole } from "./components/app/AppTypes";

interface QuickSearchDetail {
  from: string;
  to: string;
}

declare global {
  interface WindowEventMap {
    "navigate-to-search": CustomEvent<void>;
    "quick-search": CustomEvent<QuickSearchDetail>;
    "navigate-to-admin": CustomEvent<void>;
  }
}

const Footer = lazy(() => import("./components/Footer").then((module) => ({ default: module.Footer })));

export default function App() {
  const appState = useAppState();
  const {
    currentPage,
    userRole,
    isAuthenticated,
    isLoading,
    searchParams,
    favoriteRoutes,
    bookingHistory,
    bookingProgress,
    userPreferences,
    setCurrentPage,
    setSearchParams,
    setSelectedTrip,
    setIsAuthenticated,
    setUserRole,
    getSessionAge,
  } = appState;
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(() => (typeof window !== "undefined" ? navigator.onLine : true));
  const [_showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "success" as const,
      title: "Bienvenue sur KonGO !",
      message: "Profitez de 10% de réduction sur votre premier voyage",
      timestamp: new Date(),
      read: false,
      action: () => setCurrentPage(NAVIGATION_PAGES.SEARCH),
    },
    {
      id: "2",
      type: "info" as const,
      title: "Nouveaux trajets disponibles",
      message: "Découvrez nos nouvelles destinations vers Goma et Bukavu",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      action: () => setCurrentPage(NAVIGATION_PAGES.SEARCH),
    },
  ]);

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

        if (error) {
          throw error;
        }

        // Prevent backoffice users from accessing the client platform
        const backofficeRoles = ['superuser', 'agency', 'driver', 'chef', 'cashier'];
        if (profile?.role && backofficeRoles.includes(profile.role)) {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setUserRole("guest");
          toast.error("Accès refusé : Ce compte est réservé au portail Back-office.");
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
    setIsAuthenticated(false);
    setUserRole("guest");
    setCurrentPage(NAVIGATION_PAGES.HOME);
    toast.info("Déconnexion réussie");
  }, [setCurrentPage, setIsAuthenticated, setUserRole]);

  const pageProps = {
    ...createPageProps(appState, bookingHandlers, connectionStatus),
    notifications,
    onToggleNotifications: () => setShowNotifications((prev) => !prev),
    onMarkNotificationRead: (id: string) => {
      setNotifications((prev) => prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)));
    },
    onClearAllNotifications: () => setNotifications([]),
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
      if (!isAuthenticated && currentPage === NAVIGATION_PAGES.DASHBOARD) {
        toast.info("Veuillez vous connecter d'abord");
      }
      setCurrentPage(redirectedPage);
    }
  }, [currentPage, isAuthenticated, isAuthReady, setCurrentPage, userRole]);

  useEffect(() => {
    const handleQuickSearch = (event: CustomEvent<QuickSearchDetail>) => {
      setSearchParams({
        ...event.detail,
        date: new Date().toISOString().split("T")[0],
        passengers: 1,
      });
      setCurrentPage(NAVIGATION_PAGES.SEARCH);
    };

    const handleNavigateToSearch = () => setCurrentPage(NAVIGATION_PAGES.SEARCH);
    const handleNavigateToAdmin = () => {
      toast.info("Veuillez utiliser le portail Back-office : backoffice.kongo.cd");
    };

    window.addEventListener("quick-search", handleQuickSearch);
    window.addEventListener("navigate-to-search", handleNavigateToSearch);
    window.addEventListener("navigate-to-admin", handleNavigateToAdmin);

    return () => {
      window.removeEventListener("quick-search", handleQuickSearch);
      window.removeEventListener("navigate-to-search", handleNavigateToSearch);
      window.removeEventListener("navigate-to-admin", handleNavigateToAdmin);
    };
  }, [setCurrentPage, setSearchParams]);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let welcomeTimeoutId: ReturnType<typeof setTimeout> | undefined;

    if (!isLoading) {
      timeoutId = setTimeout(() => {
        setIsInitialLoad(false);

        if (shouldOfferSessionRecovery(appState)) {
          toast("Session détectée", {
            description: "Vous pouvez reprendre votre réservation en cours.",
            duration: 5000,
          });
        }

        if (!localStorage.getItem("kongo-returning-user")) {
          welcomeTimeoutId = setTimeout(() => {
            toast("Bienvenue sur KonGO !", {
              description: "Découvrez le transport moderne en RDC",
              duration: 8000,
            });
            localStorage.setItem("kongo-returning-user", "true");
          }, 2000);
        }
      }, 800);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (welcomeTimeoutId) clearTimeout(welcomeTimeoutId);
    };
  }, [appState, currentPage, getSessionAge, isLoading, searchParams]);

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

  if (isInitialLoad || isLoading || !isAuthReady) {
    return (
      <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative">
        <LoadingScreen />
      </motion.div>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => window.location.reload()}>
      <div className="min-h-screen bg-surface-primary relative overflow-x-hidden">
        <AnimatePresence>
          <ConnectionStatusBanner isOnline={connectionStatus} />
        </AnimatePresence>

        {!currentPage.startsWith("admin") && (
          <Header
            currentLanguage={userPreferences.language}
            onLanguageChange={bookingHandlers.handleLanguageChange}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            notificationCount={notifications.filter((notification) => !notification.read).length}
            onToggleNotifications={() => setShowNotifications((prev) => !prev)}
            onLogout={handleLogout}
            userRole={userRole}
          />
        )}

        {shouldShowProgressBar(currentPage) && (
          <ProgressBar
            currentStep={bookingProgress}
            totalSteps={5}
            steps={createProgressSteps(bookingProgress, appState)}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className={`relative z-10 ${getMainContentClassName(currentPage)}`}
          >
            <main className="min-h-screen">
              <PageRenderer
                currentPage={currentPage}
                pageProps={pageProps}
                onSearch={bookingHandlers.handleSearch}
                favoriteRoutes={favoriteRoutes}
              />
            </main>
          </motion.div>
        </AnimatePresence>

        {shouldShowFooter(currentPage) && (
          <Suspense fallback={<ComponentLoadingFallback />}>
            <Footer
              onQuickSearch={(from, to) => window.dispatchEvent(new CustomEvent("quick-search", { detail: { from, to } }))}
            />
          </Suspense>
        )}

        {shouldShowQuickActions(currentPage) && (
          <QuickActions
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            bookingHistory={bookingHistory}
            onQuickAction={(action) => {
              if (action === "emergency") {
                toast.error(`Support d'urgence : ${CONTACT_INFO.phone}`);
              }
            }}
          />
        )}

        <Toaster position="top-right" richColors />

        {import.meta.env.DEV && (
          <div className="fixed bottom-2 left-2 z-[100] bg-black text-white px-2 py-1 rounded text-[10px] font-mono opacity-50">
            {currentPage} | {connectionStatus ? "ONLINE" : "OFFLINE"}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
