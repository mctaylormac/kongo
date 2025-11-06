import { useState, useEffect, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ErrorBoundary } from "react-error-boundary";
import { Header } from "./components/Header";
import { LoadingScreen } from "./components/LoadingScreen";
import { ProgressBar } from "./components/ProgressBar";
import { QuickActions } from "./components/QuickActions";
import { NavigationBreadcrumbs } from "./components/NavigationBreadcrumbs";
import { useAppState } from "./hooks/useAppState";
import { toast, Toaster } from "sonner@2.0.3";

// App-specific imports
import {
  pageVariants,
  pageTransition,
  createProgressSteps,
  SESSION_CONFIG,
  NAVIGATION_PAGES,
  CONTACT_INFO
} from "./components/app/AppConstants";

import {
  createBreadcrumbItems,
  createNavigationHandlers,
  createBookingHandlers,
  createPageProps,
  shouldOfferSessionRecovery,
  shouldShowProgressBar,
  shouldShowBreadcrumbs,
  shouldShowFooter,
  getMainContentClassName
} from "./components/app/AppHelpers";

import {
  ErrorFallback,
  ComponentLoadingFallback,
  ConnectionStatusBanner,
  ConnectionStatusIndicator
} from "./components/app/AppComponents";

import { PageRenderer } from "./components/app/PageRenderer";
import { getAnalyticsInstance } from "./lib/firebase";
import { seedStaticData } from "./lib/seeds";

// Types for custom events
interface DemoSeatSelectionDetail {
  trip: any;
  searchParams: any;
}

interface QuickSearchDetail {
  from: string;
  to: string;
}

interface FavoriteRouteDetail {
  route: {
    from: string;
    to: string;
  };
}

interface PriceAlertDetail {
  route: {
    from: string;
    to: string;
  };
  alertPrice: number;
}

interface ShareTripDetail {
  trip: any;
}

interface AgencyBookingDetail {
  agencyId: string;
  agencyName: string;
  routes?: string[];
}

declare global {
  interface WindowEventMap {
    'demo-seat-selection': CustomEvent<DemoSeatSelectionDetail>;
    'navigate-to-agencies': CustomEvent<void>;
    'quick-search': CustomEvent<QuickSearchDetail>;
    'favorite-route': CustomEvent<FavoriteRouteDetail>;
    'price-alert': CustomEvent<PriceAlertDetail>;
    'share-trip': CustomEvent<ShareTripDetail>;
    'agency-booking': CustomEvent<AgencyBookingDetail>;
  }
}

// Lazy load remaining components
const Footer = lazy(() => import("./components/Footer").then(module => ({ default: module.Footer })));
const AccessibilitySettings = lazy(() => import("./components/AccessibilitySettings").then(module => ({ default: module.AccessibilitySettings })).catch(() => ({ default: () => <div></div> })));

// Enhanced notification system
const NotificationCenter = lazy(() => import("./components/NotificationCenter").then(module => ({ default: module.NotificationCenter })).catch(() => ({ default: () => <div></div> })));

export default function App() {
  const appState = useAppState();
  const [showSessionRecovery, setShowSessionRecovery] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(() => 
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'success' as const,
      title: 'Bienvenue sur KonGO !',
      message: 'Profitez de 10% de réduction sur votre premier voyage',
      timestamp: new Date(),
      read: false,
      action: () => appState.setCurrentPage(NAVIGATION_PAGES.SEARCH)
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Nouveaux trajets disponibles',
      message: 'Découvrez nos nouvelles destinations vers Goma et Bukavu',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
      action: () => appState.setCurrentPage(NAVIGATION_PAGES.SEARCH)
    }
  ]);

  // Create handlers
  const navigationHandlers = createNavigationHandlers(appState);
  const bookingHandlers = createBookingHandlers(appState, navigationHandlers);
  
  // Enhanced page props with more interactive features
  const pageProps = {
    ...createPageProps(appState, bookingHandlers, connectionStatus),
    notifications,
    onToggleNotifications: () => setShowNotifications(!showNotifications),
    onMarkNotificationRead: (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
    },
    onClearAllNotifications: () => {
      setNotifications([]);
    }
  };

  // Enhanced demo interactions
  useEffect(() => {
    const handleDemoSeatSelection = (event: CustomEvent<DemoSeatSelectionDetail>) => {
      const { trip, searchParams } = event.detail;
      appState.setSearchParams(searchParams);
      appState.setSelectedTrip(trip);
      appState.setCurrentPage(NAVIGATION_PAGES.SEATS);
      
      toast.success("🚌 Démonstration activée !", {
        description: `Navigation vers sélection de sièges - ${trip.from} → ${trip.to}`,
        action: {
          label: "Continuer",
          onClick: () => {}
        }
      });
    };

    const handleNavigateToAgencies = () => {
      appState.setCurrentPage(NAVIGATION_PAGES.AGENCIES);
      toast.info("🏢 Découvrez nos agences partenaires", {
        description: "Réseau étendu à travers la RDC"
      });
    };

    const handleQuickSearch = (event: CustomEvent<QuickSearchDetail>) => {
      const { from, to } = event.detail;
      const searchParams = {
        from,
        to,
        date: new Date().toISOString().split('T')[0],
        passengers: 1
      };
      appState.setSearchParams(searchParams);
      appState.setCurrentPage(NAVIGATION_PAGES.SEARCH);
      
      toast.success("🔍 Recherche rapide lancée", {
        description: `${from} → ${to}`
      });
    };

    const handleFavoriteRoute = (event: CustomEvent<FavoriteRouteDetail>) => {
      const { route } = event.detail;
      appState.addToFavorites(route);
      toast.success("⭐ Route ajoutée aux favoris", {
        description: `${route.from} → ${route.to}`,
        action: {
          label: "Voir favoris",
          onClick: () => appState.setCurrentPage(NAVIGATION_PAGES.DASHBOARD)
        }
      });
    };

    const handlePriceAlert = (event: CustomEvent<PriceAlertDetail>) => {
      const { alertPrice } = event.detail;
      toast.success("🔔 Alerte prix activée", {
        description: `Nous vous préviendrons si le prix descend sous ${alertPrice} CDF`,
        duration: 5000
      });
    };

    const handleShareTrip = (event: CustomEvent<ShareTripDetail>) => {
      const { trip } = event.detail;
      if (navigator.share) {
        navigator.share({
          title: 'KonGO - Voyage avec moi !',
          text: `Je voyage de ${trip.from} à ${trip.to} le ${trip.date}`,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(`Je voyage de ${trip.from} à ${trip.to} le ${trip.date} avec KonGO ! ${window.location.href}`);
        toast.success("🔗 Lien copié", {
          description: "Partagez votre voyage avec vos proches"
        });
      }
    };

    const handleAgencyBooking = (event: CustomEvent<AgencyBookingDetail>) => {
      const { agencyId, agencyName, routes } = event.detail;
      
      // Si des routes sont disponibles, proposer la première comme exemple
      if (routes && routes.length > 0) {
        const sampleRoute = routes[0].split('-');
        if (sampleRoute.length === 2) {
          const searchParams = {
            from: sampleRoute[0],
            to: sampleRoute[1],
            date: new Date().toISOString().split('T')[0],
            passengers: 1,
            preferredAgency: agencyId
          };
          appState.setSearchParams(searchParams);
          appState.setCurrentPage(NAVIGATION_PAGES.SEARCH);
          
          toast.success("🏢 Recherche avec agence sélectionnée", {
            description: `Trajets disponibles avec ${agencyName}`,
            action: {
              label: "Voir résultats",
              onClick: () => {}
            }
          });
        }
      } else {
        // Fallback : aller à la page de recherche
        appState.setCurrentPage(NAVIGATION_PAGES.SEARCH);
        toast.info("🔍 Recherche de trajets", {
          description: `Trouvez des voyages avec ${agencyName}`
        });
      }
    };

    // Register all event listeners
    window.addEventListener('demo-seat-selection', handleDemoSeatSelection);
    window.addEventListener('navigate-to-agencies', handleNavigateToAgencies);
    window.addEventListener('quick-search', handleQuickSearch);
    window.addEventListener('favorite-route', handleFavoriteRoute);
    window.addEventListener('price-alert', handlePriceAlert);
    window.addEventListener('share-trip', handleShareTrip);
    window.addEventListener('agency-booking', handleAgencyBooking);
    
    return () => {
      window.removeEventListener('demo-seat-selection', handleDemoSeatSelection);
      window.removeEventListener('navigate-to-agencies', handleNavigateToAgencies);
      window.removeEventListener('quick-search', handleQuickSearch);
      window.removeEventListener('favorite-route', handleFavoriteRoute);
      window.removeEventListener('price-alert', handlePriceAlert);
      window.removeEventListener('share-trip', handleShareTrip);
      window.removeEventListener('agency-booking', handleAgencyBooking);
    };
  }, [appState]);

  // Enhanced loading and session recovery
  useEffect(() => {
    // Dev-only optional seeding + analytics warm-up
    const isDev = (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) ||
                  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

    if (isDev) {
      // Expose manual seed hook for debugging from the browser console
      if (typeof window !== 'undefined') {
        const hook = async () => {
          try {
            await seedStaticData();
            console.log('[KonGO] Seed completed successfully');
          } catch (err) {
            console.error('[KonGO] Seed failed', err);
          }
        };
        (window as any).kongoSeed = hook;
        (window as any).kongoseed = hook; // alias pour éviter les erreurs de casse
      }

      seedStaticData()
        .then(() => console.log('[KonGO] Dev seed executed'))
        .catch((err) => console.error('[KonGO] Dev seed error', err));
    }
    getAnalyticsInstance().catch(() => {});

    let timeoutId: NodeJS.Timeout;
    
    if (!appState.isLoading) {
      timeoutId = setTimeout(() => {
        setIsInitialLoad(false);
        
        if (shouldOfferSessionRecovery(appState)) {
          setShowSessionRecovery(true);
        }
        
        // Show welcome notification for new users
        if (!localStorage.getItem('kongo-returning-user')) {
          setTimeout(() => {
            toast("🎉 Bienvenue sur KonGO !", {
              description: "Découvrez le transport moderne en RDC",
              action: {
                label: "Démarrer",
                onClick: () => {
                  const demoSearchEvent = new CustomEvent('quick-search', {
                    detail: { from: 'Kinshasa', to: 'Lubumbashi' }
                  });
                  window.dispatchEvent(demoSearchEvent);
                }
              },
              duration: 8000
            });
            localStorage.setItem('kongo-returning-user', 'true');
          }, 2000);
        }
      }, 800);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [appState.isLoading, appState]);

  // Enhanced connection status monitoring with offline capabilities
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus(true);
      toast.success("🌐 Connexion rétablie", {
        description: "Toutes les fonctionnalités sont disponibles",
        action: {
          label: "Synchroniser",
          onClick: () => {
            // Sync offline actions
            toast.info("Synchronisation en cours...");
          }
        }
      });
    };

    const handleOffline = () => {
      setConnectionStatus(false);
      toast.warning("📱 Mode hors ligne", {
        description: "Fonctions limitées disponibles",
        duration: 6000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enhanced session recovery notification
  useEffect(() => {
    if (showSessionRecovery) {
      toast("💾 Session précédente trouvée", {
        description: "Voulez-vous reprendre où vous vous êtes arrêté ?",
        action: {
          label: "Reprendre",
          onClick: () => {
            appState.recoverSession();
            setShowSessionRecovery(false);
            toast.success("✅ Session restaurée avec succès");
          }
        },
        cancel: {
          label: "Nouveau début",
          onClick: () => {
            setShowSessionRecovery(false);
            toast.info("🆕 Nouvelle session démarrée");
          }
        },
        duration: SESSION_CONFIG.TOAST_DURATION_MS
      });
    }
  }, [showSessionRecovery, appState]);

  // Keyboard shortcuts for power users
  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'h':
            event.preventDefault();
            appState.setCurrentPage(NAVIGATION_PAGES.HOME);
            toast.info("🏠 Accueil", { duration: 1500 });
            break;
          case 's':
            event.preventDefault();
            appState.setCurrentPage(NAVIGATION_PAGES.SEARCH);
            toast.info("🔍 Recherche", { duration: 1500 });
            break;
          case 'd':
            event.preventDefault();
            appState.setCurrentPage(NAVIGATION_PAGES.DASHBOARD);
            toast.info("📊 Tableau de bord", { duration: 1500 });
            break;
          case 'a':
            event.preventDefault();
            appState.setCurrentPage(NAVIGATION_PAGES.AGENCIES);
            toast.info("🏢 Agences", { duration: 1500 });
            break;
        }
      }
      
      // ESC to go back
      if (event.key === 'Escape' && appState.canGoBack) {
        bookingHandlers.handleBack();
        toast.info("⬅️ Retour", { duration: 1500 });
      }
    };

    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => window.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [appState, bookingHandlers]);

  // Enhanced loading animation
  if (isInitialLoad || appState.isLoading) {
    return (
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <LoadingScreen />
        {/* Loading tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.6 }}
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
        >
          <div className="bg-surface-elevated border border-border-primary rounded-lg px-6 py-3 shadow-lg">
            <p className="text-body-small text-secondary text-center">
              💡 <strong>Astuce :</strong> Utilisez Ctrl+S pour rechercher rapidement
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback} 
      onReset={() => {
        appState.setCurrentPage(NAVIGATION_PAGES.HOME);
        window.location.reload();
      }}
      onError={(error, errorInfo) => {
        console.error('Application Error:', error, errorInfo);
        toast.error("🚨 Erreur inattendue", {
          description: "L'application va se relancer automatiquement",
          action: {
            label: "Relancer maintenant",
            onClick: () => window.location.reload()
          }
        });
      }}
    >
      <div className="min-h-screen bg-surface-primary relative overflow-x-hidden">
        {/* Enhanced connection status banner */}
        <AnimatePresence>
          <ConnectionStatusBanner 
            isOnline={connectionStatus}
            onRetry={() => {
              if (!connectionStatus) {
                toast.loading("Tentative de reconnexion...", { id: 'reconnect' });
                setTimeout(() => {
                  if (navigator.onLine) {
                    toast.success("Reconnecté avec succès !", { id: 'reconnect' });
                  } else {
                    toast.error("Impossible de se reconnecter", { id: 'reconnect' });
                  }
                }, 2000);
              }
            }}
          />
        </AnimatePresence>

        {/* Enhanced Header with notifications */}
        <div className="relative z-40">
          <Header 
            currentLanguage={appState.userPreferences.language}
            onLanguageChange={bookingHandlers.handleLanguageChange}
            currentPage={appState.currentPage}
            onPageChange={appState.setCurrentPage}
            notificationCount={notifications.filter(n => !n.read).length}
            onToggleNotifications={() => setShowNotifications(!showNotifications)}
          />
        </div>
        
        {/* Enhanced Progress Bar */}
        {shouldShowProgressBar(appState.currentPage) && (
          <div className="relative z-30">
            <ProgressBar
              currentStep={appState.bookingProgress}
              totalSteps={5}
              steps={createProgressSteps(appState.bookingProgress, appState)}
              onStepClick={(step) => {
                if (step < appState.bookingProgress) {
                  // Allow navigation to previous steps
                  switch (step) {
                    case 1:
                      appState.setCurrentPage(NAVIGATION_PAGES.SEARCH);
                      break;
                    case 2:
                      if (appState.selectedTrip) {
                        appState.setCurrentPage(NAVIGATION_PAGES.SEATS);
                      }
                      break;
                    case 3:
                      if (appState.selectedSeats.length > 0) {
                        appState.setCurrentPage(NAVIGATION_PAGES.BAGGAGE);
                      }
                      break;
                    case 4:
                      if (appState.selectedSeats.length > 0) {
                        appState.setCurrentPage(NAVIGATION_PAGES.PAYMENT);
                      }
                      break;
                  }
                }
              }}
            />
          </div>
        )}

        {/* Enhanced Breadcrumbs with quick actions */}
        {shouldShowBreadcrumbs(appState.currentPage) && (
          <div className="relative z-30">
            <NavigationBreadcrumbs
              items={createBreadcrumbItems(appState)}
              onNavigate={bookingHandlers.handleBreadcrumbNavigate}
              onBack={appState.canGoBack ? bookingHandlers.handleBack : undefined}
              showBackButton={appState.canGoBack}
              currentPage={appState.currentPage}
              showQuickActions={true}
              onQuickAction={(action) => {
                switch (action) {
                  case 'share':
                    if (appState.selectedTrip) {
                      const shareEvent = new CustomEvent('share-trip', {
                        detail: { trip: appState.selectedTrip }
                      });
                      window.dispatchEvent(shareEvent);
                    }
                    break;
                  case 'favorite':
                    if (appState.selectedTrip) {
                      const favoriteEvent = new CustomEvent('favorite-route', {
                        detail: { 
                          route: { 
                            from: appState.selectedTrip.from, 
                            to: appState.selectedTrip.to 
                          } 
                        }
                      });
                      window.dispatchEvent(favoriteEvent);
                    }
                    break;
                  case 'alert':
                    if (appState.selectedTrip) {
                      const alertEvent = new CustomEvent('price-alert', {
                        detail: { 
                          route: { 
                            from: appState.selectedTrip.from, 
                            to: appState.selectedTrip.to 
                          },
                          alertPrice: appState.selectedTrip.price * 0.9
                        }
                      });
                      window.dispatchEvent(alertEvent);
                    }
                    break;
                }
              }}
            />
          </div>
        )}

        {/* Notification Center */}
        <AnimatePresence>
          {showNotifications && (
            <Suspense fallback={null}>
              <NotificationCenter
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkAsRead={pageProps.onMarkNotificationRead}
                onClearAll={pageProps.onClearAllNotifications}
              />
            </Suspense>
          )}
        </AnimatePresence>
        
        {/* Enhanced Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={appState.currentPage}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className={`relative z-10 ${getMainContentClassName(appState.currentPage)}`}
          >
            <main className="min-h-screen relative">
              {/* Log diagnostic pour transmission des villes à la confirmation */}
              {appState.currentPage === NAVIGATION_PAGES.CONFIRMATION && (
                <>
                  {console.log('Diagnostic CONFIRMATION:', {
                    selectedTrip: appState.selectedTrip,
                    searchParams: appState.searchParams,
                    bookingData: appState.bookingData
                  })}
                </>
              )}
              <PageRenderer
                currentPage={appState.currentPage}
                pageProps={pageProps}
                onSearch={bookingHandlers.handleSearch}
                favoriteRoutes={appState.favoriteRoutes}
              />
              
              {/* Floating contextual help */}
              {appState.currentPage !== NAVIGATION_PAGES.HOME && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1, duration: 0.3 }}
                  className="fixed bottom-24 right-6 z-40 hidden lg:block"
                >
                  <div className="bg-surface-elevated border border-border-primary rounded-lg p-4 shadow-lg max-w-xs">
                    <h4 className="text-label text-primary font-semibold mb-2">💡 Astuce</h4>
                    <p className="text-body-small text-secondary">
                      {appState.currentPage === NAVIGATION_PAGES.SEARCH && "Filtrez par prix, horaire ou équipements"}
                      {appState.currentPage === NAVIGATION_PAGES.SEATS && "Cliquez sur un siège pour le sélectionner"}
                      {appState.currentPage === NAVIGATION_PAGES.PAYMENT && "Vos informations sont sécurisées SSL"}
                      {appState.currentPage === NAVIGATION_PAGES.DASHBOARD && "Gérez vos voyages et préférences"}
                      {appState.currentPage === NAVIGATION_PAGES.AGENCIES && "Trouvez l'agence la plus proche"}
                      {(appState.currentPage === NAVIGATION_PAGES.LOGIN || appState.currentPage === NAVIGATION_PAGES.SIGNUP) && "Profitez d'avantages exclusifs"}
                    </p>
                  </div>
                </motion.div>
              )}
            </main>
          </motion.div>
        </AnimatePresence>
        
        {/* Enhanced Footer with interactive elements */}
        {shouldShowFooter(appState.currentPage) && (
          <Suspense fallback={<ComponentLoadingFallback className="py-16" />}>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative z-10"
            >
              <Footer 
                onQuickSearch={(from, to) => {
                  const event = new CustomEvent('quick-search', { detail: { from, to } });
                  window.dispatchEvent(event);
                }}
                onContactClick={() => {
                  toast.info("📞 Contactez-nous", {
                    description: "Équipe disponible 24/7",
                    action: {
                      label: "Appeler",
                      onClick: () => window.open(`tel:${CONTACT_INFO.phone}`, '_self')
                    }
                  });
                }}
              />
            </motion.div>
          </Suspense>
        )}
        
        {/* Enhanced Quick Actions FAB */}
        <div className="relative z-50">
          <QuickActions 
            currentPage={appState.currentPage}
            onPageChange={appState.setCurrentPage}
            bookingHistory={appState.bookingHistory}
            onQuickAction={(action) => {
              switch (action) {
                case 'emergency':
                  toast.error("🚨 Urgence", {
                    description: "Contactez immédiatement notre support",
                    action: {
                      label: "Appeler",
                      onClick: () => window.open(`tel:${CONTACT_INFO.phone}`, '_self')
                    },
                    duration: 10000
                  });
                  break;
                case 'support':
                  toast.info("💬 Support client", {
                    description: "Comment pouvons-nous vous aider ?",
                    action: {
                      label: "Chat",
                      onClick: () => {
                        // Open chat widget
                        toast.success("Chat en cours d'ouverture...");
                      }
                    }
                  });
                  break;
                case 'feedback':
                  toast.success("⭐ Merci pour votre retour !", {
                    description: "Votre avis nous aide à améliorer KonGO"
                  });
                  break;
              }
            }}
          />
        </div>
        
        {/* Enhanced Accessibility Settings */}
        <Suspense fallback={null}>
          <div className="relative z-40">
            <AccessibilitySettings 
              onSettingChange={(setting, value) => {
                appState.updatePreferences({ [setting]: value });
                toast.success("⚙️ Paramètre mis à jour", {
                  description: `${setting} ${value ? 'activé' : 'désactivé'}`
                });
              }}
            />
          </div>
        </Suspense>

        {/* Enhanced Connection Status Indicator */}
        <AnimatePresence>
          <ConnectionStatusIndicator 
            isOnline={connectionStatus}
            onRetry={() => {
              window.location.reload();
            }}
          />
        </AnimatePresence>

        {/* Enhanced Toast Notifications */}
        <Toaster 
          position="top-right"
          className="z-[70]"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--surface-elevated)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '14px',
              fontFamily: 'var(--font-family)',
              boxShadow: 'var(--shadow-lg)'
            },
            className: 'font-medium',
            actionButtonStyle: {
              background: 'var(--kongo-lime)',
              color: 'var(--text-on-lime)',
              border: 'none',
              borderRadius: 'var(--radius-base)',
              fontWeight: '600'
            },
            cancelButtonStyle: {
              background: 'var(--surface-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-secondary)',
              borderRadius: 'var(--radius-base)'
            }
          }}
          expand={true}
          richColors={true}
        />

        {/* Performance Monitor (Development only) */}
        {typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-2 left-2 z-[100] bg-kongo-black text-on-black px-2 py-1 rounded text-xs font-mono">
            Page: {appState.currentPage} | Online: {connectionStatus ? '✅' : '❌'}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}