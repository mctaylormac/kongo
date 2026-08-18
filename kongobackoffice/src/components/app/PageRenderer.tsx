import { Suspense, lazy } from "react";
import { NAVIGATION_PAGES } from './AppConstants';
import { ComponentLoadingFallback } from './AppComponents';
import type { PageProps } from './AppHelpers';

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

interface PageRendererProps {
  currentPage: string;
  pageProps: PageProps;
}

export function PageRenderer({ currentPage, pageProps }: PageRendererProps) {
  switch (currentPage) {
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
      return (
        <Suspense fallback={<ComponentLoadingFallback />}>
          <AdminLoginPage {...pageProps} />
        </Suspense>
      );
  }
}
