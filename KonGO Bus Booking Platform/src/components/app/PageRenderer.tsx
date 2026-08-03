import { Suspense, lazy } from "react";
import { motion } from "motion/react";
import { NAVIGATION_PAGES } from './AppConstants';
import { ComponentLoadingFallback } from './AppComponents';
import { createDemoTrip } from './AppConstants';

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

// Admin Pages
const AdminDashboard = lazy(() => import("../admin/AdminDashboard").then(module => ({ default: module.AdminDashboard })));
const SuperuserDashboard = lazy(() => import("../admin/SuperuserDashboard").then(module => ({ default: module.SuperuserDashboard })));
const AgencyDashboard = lazy(() => import("../admin/AgencyDashboard").then(module => ({ default: module.AgencyDashboard })));
const DriverDashboard = lazy(() => import("../admin/DriverDashboard").then(module => ({ default: module.DriverDashboard })));
const ChefDashboard = lazy(() => import("../admin/ChefDashboard").then(module => ({ default: module.ChefDashboard })));
const BusManagement = lazy(() => import("../admin/BusManagement").then(module => ({ default: module.BusManagement })));
const TripManagement = lazy(() => import("../admin/TripManagement").then(module => ({ default: module.TripManagement })));
const BookingManagement = lazy(() => import("../admin/BookingManagement").then(module => ({ default: module.BookingManagement })));
const AgencyManagement = lazy(() => import("../admin/AgencyManagement").then(module => ({ default: module.AgencyManagement })));
const ClientManagement = lazy(() => import("../admin/ClientManagement").then(module => ({ default: module.ClientManagement })));
const CashierDashboard = lazy(() => import("../admin/CashierDashboard").then(module => ({ default: module.CashierDashboard })));
const AdminLoginPage = lazy(() => import("../admin/AdminLoginPage").then(module => ({ default: module.AdminLoginPage })));

// Home page components - load directly for better performance
import { HeroSection } from "../HeroSection";
import { USPSection } from "../USPSection";

// Lazy load home page sections
const DestinationsCarousel = lazy(() => import("../DestinationsCarousel").then(module => ({ default: module.DestinationsCarousel })));
const HowItWorksSection = lazy(() => import("../HowItWorksSection").then(module => ({ default: module.HowItWorksSection })));
const LoyaltyProgramSection = lazy(() => import("../LoyaltyProgramSection").then(module => ({ default: module.LoyaltyProgramSection })));
const PartnersSection = lazy(() => import("../PartnersSection").then(module => ({ default: module.PartnersSection })));
const ReviewsSection = lazy(() => import("../ReviewsSection").then(module => ({ default: module.ReviewsSection })));
const AppDownloadSection = lazy(() => import("../AppDownloadSection").then(module => ({ default: module.AppDownloadSection })));

interface PageRendererProps {
  currentPage: string;
  pageProps: any;
  onSearch: (params: any) => void;
  favoriteRoutes: any[];
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
          <SeatSelection
            trip={pageProps.selectedTrip || createDemoTrip()}
            passengers={pageProps.passengers}
            onContinue={pageProps.onContinue}
            onBack={pageProps.onBack}
            preferences={pageProps.preferences}
          />
        </Suspense>
      );

    case NAVIGATION_PAGES.BAGGAGE:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <BaggageWeightCalculator
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

    case NAVIGATION_PAGES.ADMIN_LOGIN:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <AdminLoginPage {...pageProps} />
        </Suspense>
      );

    case NAVIGATION_PAGES.ADMIN_DASHBOARD:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          {pageProps.userRole === 'superuser' && <SuperuserDashboard {...pageProps} />}
          {pageProps.userRole === 'agency' && <AgencyDashboard {...pageProps} />}
          {pageProps.userRole === 'chef' && <ChefDashboard {...pageProps} />}
          {pageProps.userRole === 'driver' && <DriverDashboard {...pageProps} />}
          {pageProps.userRole === 'cashier' && <CashierDashboard {...pageProps} />}
          {(!pageProps.userRole || pageProps.userRole === 'guest') && <AdminDashboard {...pageProps} />}
        </Suspense>
      );

    case NAVIGATION_PAGES.ADMIN_BUSES:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <BusManagement {...pageProps} />
        </Suspense>
      );

    case NAVIGATION_PAGES.ADMIN_TRIPS:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <TripManagement {...pageProps} />
        </Suspense>
      );

    case NAVIGATION_PAGES.ADMIN_BOOKINGS:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <BookingManagement {...pageProps} />
        </Suspense>
      );

    case NAVIGATION_PAGES.ADMIN_AGENCIES:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <AgencyManagement {...pageProps} />
        </Suspense>
      );

    case NAVIGATION_PAGES.ADMIN_CLIENTS:
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <ClientManagement {...pageProps} />
        </Suspense>
      );

    default:
      return <HomePage onSearch={onSearch} favoriteRoutes={favoriteRoutes} />;
  }
}

// Home page component with all sections
function HomePage({ onSearch, favoriteRoutes }: { onSearch: (params: any) => void; favoriteRoutes: any[] }) {
  return (
    <div className="space-y-0">
      {/* Hero Section - Always visible */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8 }}
      >
        <HeroSection onSearch={onSearch} />
      </motion.div>

      {/* USP Section - Critical above fold */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.1 }}
      >
        <USPSection />
      </motion.div>

      {/* Lazy loaded sections */}
      <Suspense fallback={<ComponentLoadingFallback className="py-24" />}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <DestinationsCarousel favoriteRoutes={favoriteRoutes} />
        </motion.div>
      </Suspense>

      <Suspense fallback={<ComponentLoadingFallback className="py-24" />}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <HowItWorksSection />
        </motion.div>
      </Suspense>

      <Suspense fallback={<ComponentLoadingFallback className="py-24" />}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <LoyaltyProgramSection />
        </motion.div>
      </Suspense>

      <Suspense fallback={<ComponentLoadingFallback className="py-24" />}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <PartnersSection />
        </motion.div>
      </Suspense>

      <Suspense fallback={<ComponentLoadingFallback className="py-24" />}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <ReviewsSection />
        </motion.div>
      </Suspense>

      <Suspense fallback={<ComponentLoadingFallback className="py-24" />}>
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          <AppDownloadSection />
        </motion.div>
      </Suspense>
    </div>
  );
}