import { Suspense, lazy, useEffect } from "react";
import { NAVIGATION_PAGES } from './AppConstants';
import { ComponentLoadingFallback } from './AppComponents';
import type { FavoriteRoute, SearchParams } from './AppTypes';
import type { PageProps } from './AppHelpers';

// Lazy load main page components
const SearchResults = lazy(() => import("../SearchResults").then(module => ({ default: module.SearchResults })));
const SeatSelection = lazy(() => import("../SeatSelection").then(module => ({ default: module.SeatSelection })));
const BaggageWeightCalculator = lazy(() => import("../BaggageWeightCalculator").then(module => ({ default: module.BaggageWeightCalculator })));
const PaymentFlow = lazy(() => import("../PaymentFlow").then(module => ({ default: module.PaymentFlow })));
const TripConfirmation = lazy(() => import("../TripConfirmation").then(module => ({ default: module.TripConfirmation })));
const UserDashboard = lazy(() => import("../UserDashboard").then(module => ({ default: module.UserDashboard })));
const AgencyDirectory = lazy(() => import("../AgencyDirectory").then(module => ({ default: module.AgencyDirectory })));
const LoginPage = lazy(() => import("../LoginPage").then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import("../SignupPage").then(module => ({ default: module.SignupPage })));

// Home page components
import { HeroSection } from "../HeroSection";

// Lazy load home page sections
const DestinationsCarousel = lazy(() => import("../DestinationsCarousel").then(module => ({ default: module.DestinationsCarousel })));
const USPSection = lazy(() => import("../USPSection").then(module => ({ default: module.USPSection })));
const HowItWorksSection = lazy(() => import("../HowItWorksSection").then(module => ({ default: module.HowItWorksSection })));
const PartnersSection = lazy(() => import("../PartnersSection").then(module => ({ default: module.PartnersSection })));
const AppDownloadSection = lazy(() => import("../AppDownloadSection").then(module => ({ default: module.AppDownloadSection })));

interface PageRendererProps {
  currentPage: string;
  pageProps: PageProps;
  onSearch: (params: SearchParams) => void;
  favoriteRoutes: FavoriteRoute[];
}

export function PageRenderer({ currentPage, pageProps, onSearch, favoriteRoutes }: PageRendererProps) {
  switch (currentPage) {
    case NAVIGATION_PAGES.SEARCH:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <SearchResults {...pageProps} onSearch={onSearch} />
        </Suspense>
      );

    case NAVIGATION_PAGES.SEATS:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          {pageProps.selectedTrip ? (
            <SeatSelection
              trip={pageProps.selectedTrip}
              passengers={pageProps.passengers}
              onContinue={pageProps.onContinue}
              onBack={pageProps.onBack}
              preferences={pageProps.preferences}
            />
          ) : (
            <BookingFlowRedirect
              onRedirect={() => pageProps.onPageChange(NAVIGATION_PAGES.SEARCH)}
            />
          )}
        </Suspense>
      );

    case NAVIGATION_PAGES.BAGGAGE:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <BaggageWeightCalculator
            trip={pageProps.selectedTrip}
            passengers={pageProps.passengers}
            onBaggageUpdate={(baggage, totalCost) => {
              pageProps.onBaggageUpdate(baggage, totalCost);
            }}
            onContinue={() => pageProps.onPageChange(NAVIGATION_PAGES.PAYMENT)}
            onBack={pageProps.onBack}
          />
        </Suspense>
      );

    case NAVIGATION_PAGES.PAYMENT:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <PaymentFlow
            trip={pageProps.selectedTrip}
            seats={pageProps.selectedSeats}
            baggageData={pageProps.baggageData}
            searchParams={pageProps.searchParams}
            onPaymentComplete={pageProps.onPaymentComplete}
            onBack={pageProps.onBack}
            preferences={pageProps.preferences}
            isOnline={pageProps.isOnline}
          />
        </Suspense>
      );

    case NAVIGATION_PAGES.CONFIRMATION:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <TripConfirmation
            bookingData={pageProps.bookingData}
            selectedTrip={pageProps.selectedTrip}
            searchParams={pageProps.searchParams}
            selectedSeats={pageProps.selectedSeats}
            onNewSearch={pageProps.onNewSearch}
            onViewDashboard={() => pageProps.onPageChange(NAVIGATION_PAGES.DASHBOARD)}
            preferences={pageProps.preferences}
          />
        </Suspense>
      );

    case NAVIGATION_PAGES.DASHBOARD:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <UserDashboard {...pageProps} />
        </Suspense>
      );

    case NAVIGATION_PAGES.AGENCIES:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <AgencyDirectory />
        </Suspense>
      );

    case NAVIGATION_PAGES.LOGIN:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <LoginPage {...pageProps} />
        </Suspense>
      );

    case NAVIGATION_PAGES.SIGNUP:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <SignupPage {...pageProps} />
        </Suspense>
      );

    default:
      return <HomePage onSearch={onSearch} favoriteRoutes={favoriteRoutes} />;
  }
}

function BookingFlowRedirect({ onRedirect }: { onRedirect: () => void }) {
  useEffect(() => {
    onRedirect();
  }, [onRedirect]);

  return <ComponentLoadingFallback />;
}

// Home page component with the simplified public booking path
function HomePage({ onSearch, favoriteRoutes }: { onSearch: (params: SearchParams) => void; favoriteRoutes: FavoriteRoute[] }) {
  return (
    <div className="space-y-0">
      {/* Hero Section */}
      <HeroSection onSearch={onSearch} />

      {/* Lazy loaded sections */}
      <Suspense fallback={<ComponentLoadingFallback className="py-24" />}>
        <DestinationsCarousel favoriteRoutes={favoriteRoutes} />
      </Suspense>

      <Suspense fallback={<ComponentLoadingFallback className="py-24" />}>
        <USPSection />
      </Suspense>

      <Suspense fallback={<ComponentLoadingFallback className="py-24" />}>
        <HowItWorksSection />
      </Suspense>

      <Suspense fallback={<ComponentLoadingFallback className="py-24" />}>
        <PartnersSection />
      </Suspense>

      <Suspense fallback={<ComponentLoadingFallback className="py-24" />}>
        <AppDownloadSection />
      </Suspense>
    </div>
  );
}
