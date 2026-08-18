import { useState, useEffect, useCallback } from 'react';
import type {
  AppState,
  BaggageData,
  BookingData,
  BookingPaymentData,
  FavoriteRoute,
  SearchParams,
  Seat,
  StoredAppState,
  Trip,
  UserPreferences,
  UserRole,
} from '../components/app/AppTypes';
import { resolveInitialPageFromPath } from '../components/app/AppHelpers';

const STORAGE_KEY = 'kongo-app-state';

export function useAppState(): AppState {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [baggageData, setBaggageData] = useState<BaggageData | null>(null);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'completed' | 'failed' | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingData[]>([]);
  const [favoriteRoutes, setFavoriteRoutes] = useState<FavoriteRoute[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    language: 'FR',
    currency: 'CDF',
    notifications: true,
    accessibility: {
      highContrast: false,
      largeText: false,
      reduceMotion: false,
    },
  });
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sessionTimestamp, setSessionTimestamp] = useState<number>(Date.now());

  const stripSensitiveBooking = (booking: unknown) => {
    if (!booking || typeof booking !== 'object') return null;

    const {
      firstName: _firstName,
      lastName: _lastName,
      email: _email,
      phone: _phone,
      phoneNumber: _phoneNumber,
      cardNumber: _cardNumber,
      cvv: _cvv,
      expiryDate: _expiryDate,
      cardName: _cardName,
      ...safe
    } = booking as Record<string, unknown>;

    return safe;
  };

  const bookingProgress = (() => {
    if (!searchParams) return 0;
    if (!selectedTrip) return 1;
    if (selectedSeats.length === 0) return 2;
    if (!baggageData && selectedSeats.length > 0) return 3;
    if (!bookingData && selectedSeats.length > 0) return 4;
    return 5;
  })();

  const canGoBack = currentPage !== 'home';

  const resolveStoredBookingPage = (storedState: StoredAppState) => {
    if (storedState.bookingData) return 'confirmation';
    if (storedState.baggageData) return 'payment';
    if (storedState.selectedSeats && storedState.selectedSeats.length > 0) return 'baggage';
    if (storedState.selectedTrip) return 'seats';
    if (storedState.searchParams) return 'search';
    return 'home';
  };

  useEffect(() => {
    const loadState = () => {
      try {
        const path = window.location.pathname.toLowerCase();
        const initialPage = resolveInitialPageFromPath(path);
        const stored = localStorage.getItem(STORAGE_KEY);

        if (stored) {
          const parsed = JSON.parse(stored) as StoredAppState;

          if (parsed.searchParams) setSearchParams(parsed.searchParams);
          if (parsed.selectedTrip) setSelectedTrip(parsed.selectedTrip);
          if (parsed.selectedSeats) setSelectedSeats(parsed.selectedSeats);
          if (parsed.baggageData) setBaggageData(parsed.baggageData);
          if (parsed.bookingData) setBookingData(parsed.bookingData);
          if (parsed.paymentStatus) setPaymentStatus(parsed.paymentStatus);
          if (parsed.userPreferences) {
            setUserPreferences((prev) => ({
              ...prev,
              ...parsed.userPreferences,
              accessibility: {
                ...prev.accessibility,
                ...(parsed.userPreferences.accessibility || {}),
              },
            }));
          }
          if (parsed.sessionTimestamp) setSessionTimestamp(parsed.sessionTimestamp);

          if (initialPage !== 'home') {
            setCurrentPage(initialPage);
          } else {
            setCurrentPage(resolveStoredBookingPage(parsed));
          }
        } else {
          setCurrentPage(initialPage);
        }
      } catch {
        // Ignore malformed local state and continue with a clean session.
      } finally {
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    loadState();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      try {
        const safeBookingData = stripSensitiveBooking(bookingData);

        const stateToSave: StoredAppState = {
          searchParams,
          selectedTrip,
          selectedSeats,
          baggageData,
          bookingData: safeBookingData as unknown as BookingData | null,
          paymentStatus,
          userPreferences,
          sessionTimestamp,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch {
        // Ignore storage write failures so the booking flow remains usable.
      }
    }
  }, [
    isLoading,
    searchParams,
    selectedTrip,
    selectedSeats,
    baggageData,
    bookingData,
    paymentStatus,
    userPreferences,
    sessionTimestamp,
  ]);

  const resetBookingFlow = useCallback(() => {
    setCurrentPage('home');
    setSearchParams(null);
    setSelectedTrip(null);
    setSelectedSeats([]);
    setBaggageData(null);
    setBookingData(null);
    setPaymentStatus(null);
    setSessionTimestamp(Date.now());
  }, []);

  const completeBooking = useCallback((booking: BookingData) => {
    setBookingData(booking);
    setPaymentStatus('completed');
    setBookingHistory((prev) => [booking, ...prev.slice(0, 9)]);
  }, []);

  const recoverSession = useCallback(() => {
    if (bookingData) {
      setCurrentPage('confirmation');
    } else if (baggageData) {
      setCurrentPage('payment');
    } else if (selectedSeats.length > 0) {
      setCurrentPage('baggage');
    } else if (selectedTrip) {
      setCurrentPage('seats');
    } else if (searchParams) {
      setCurrentPage('search');
    }
  }, [bookingData, baggageData, selectedSeats, selectedTrip, searchParams]);

  const getSessionAge = useCallback(() => {
    return Date.now() - sessionTimestamp;
  }, [sessionTimestamp]);

  const addToFavorites = useCallback((route: { from: string; to: string }) => {
    const newFavorite: FavoriteRoute = {
      id: `fav-${Date.now()}`,
      from: route.from,
      to: route.to,
      addedDate: new Date().toISOString(),
    };

    setFavoriteRoutes((prev) => {
      const exists = prev.some((fav) => fav.from === route.from && fav.to === route.to);
      if (exists) return prev;
      return [newFavorite, ...prev.slice(0, 9)];
    });
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    setUserPreferences((prev) => ({
      ...prev,
      ...newPreferences,
      accessibility: {
        ...prev.accessibility,
        ...(newPreferences.accessibility || {}),
      },
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setBookingHistory([]);
  }, []);

  return {
    currentPage,
    isLoading,
    canGoBack,
    isAuthenticated,
    searchParams,
    selectedTrip,
    selectedSeats,
    baggageData,
    bookingData,
    bookingProgress,
    paymentStatus,
    bookingHistory,
    favoriteRoutes,
    userPreferences,
    userRole,
    setCurrentPage,
    setSearchParams,
    setSelectedTrip,
    setSelectedSeats,
    setBaggageData,
    completeBooking,
    resetBookingFlow,
    recoverSession,
    getSessionAge,
    addToFavorites,
    updatePreferences,
    clearHistory,
    setUserRole,
    setIsAuthenticated,
  };
}
