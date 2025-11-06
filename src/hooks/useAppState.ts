import { useState, useEffect, useCallback } from 'react';
import { createBooking } from '../lib/firestore';
import { auth } from '../lib/auth';

interface SearchParams {
  from: string;
  to: string;
  date: string;
  passengers: number;
  transportType?: 'bus' | 'train' | 'all'; // Nouveau: type de transport
}

interface Trip {
  id: string;
  operator: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
  currency: string;
  amenities: string[];
  seatsAvailable: number;
  vehicleType: 'bus' | 'train'; // Nouveau: type de véhicule
  busType?: string; // Optionnel pour les bus
  trainType?: string; // Nouveau: type de train
  trainClass?: 'economy' | 'business' | 'first'; // Nouveau: classe de train
  date: string;
}

interface Seat {
  seatNumber: string;
  type: 'standard' | 'premium' | 'vip';
  price: number;
}

interface BaggageItem {
  id: string;
  type: 'cabine' | 'soute';
  weight: number;
  price: number;
  description: string;
}

interface BaggageData {
  items: BaggageItem[];
  totalCost: number;
}

interface BookingData {
  id: string;
  trip: Trip;
  seats: Seat[];
  baggage?: BaggageData;
  totalPrice: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  bookingDate: string;
  confirmationCode: string;
}

interface UserPreferences {
  language: string;
  currency: string;
  notifications: boolean;
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
  };
}

interface FavoriteRoute {
  id: string;
  from: string;
  to: string;
  addedDate: string;
}

interface AppState {
  // Current page state
  currentPage: string;
  isLoading: boolean;
  canGoBack: boolean;
  
  // Booking flow state
  searchParams: SearchParams | null;
  selectedTrip: Trip | null;
  selectedSeats: Seat[];
  baggageData: BaggageData | null;
  bookingData: BookingData | null;
  bookingProgress: number;
  paymentStatus: 'pending' | 'completed' | 'failed' | null;
  
  // User data
  bookingHistory: BookingData[];
  favoriteRoutes: FavoriteRoute[];
  userPreferences: UserPreferences;
  
  // Actions
  setCurrentPage: (page: string) => void;
  setSearchParams: (params: SearchParams) => void;
  setSelectedTrip: (trip: Trip | null) => void;
  setSelectedSeats: (seats: Seat[]) => void;
  setBaggageData: (baggage: BaggageData | null) => void;
  completeBooking: (paymentData: any) => void;
  resetBookingFlow: () => void;
  recoverSession: () => void;
  getSessionAge: () => number;
  addToFavorites: (route: { from: string; to: string }) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  clearHistory: () => void;
}

const STORAGE_KEY = 'kongo-app-state';

export function useAppState(): AppState {
  // Initialize state
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
      reduceMotion: false
    }
  });
  const [sessionTimestamp, setSessionTimestamp] = useState<number>(Date.now());

  // Calculate booking progress
  const bookingProgress = (() => {
    if (!searchParams) return 0;
    if (!selectedTrip) return 1;
    if (selectedSeats.length === 0) return 2;
    if (!baggageData && selectedSeats.length > 0) return 3;
    if (!bookingData && selectedSeats.length > 0) return 4;
    return 5;
  })();

  // Calculate if we can go back
  const canGoBack = currentPage !== 'home';

  // Load state from localStorage on mount
  useEffect(() => {
    const loadState = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          
          // Restore state with validation
          if (parsed.searchParams) setSearchParams(parsed.searchParams);
          if (parsed.selectedTrip) setSelectedTrip(parsed.selectedTrip);
          if (parsed.selectedSeats) setSelectedSeats(parsed.selectedSeats);
          if (parsed.baggageData) setBaggageData(parsed.baggageData);
          if (parsed.bookingData) setBookingData(parsed.bookingData);
          if (parsed.paymentStatus) setPaymentStatus(parsed.paymentStatus);
          if (parsed.bookingHistory) setBookingHistory(parsed.bookingHistory);
          if (parsed.favoriteRoutes) setFavoriteRoutes(parsed.favoriteRoutes);
          if (parsed.userPreferences) setUserPreferences({
            ...userPreferences,
            ...parsed.userPreferences
          });
          if (parsed.sessionTimestamp) setSessionTimestamp(parsed.sessionTimestamp);
          if (parsed.currentPage && parsed.currentPage !== 'home') {
            setCurrentPage(parsed.currentPage);
          }
        }
      } catch (error) {
        console.warn('Failed to load app state from localStorage:', error);
      } finally {
        // Add small delay to show loading screen
        setTimeout(() => setIsLoading(false), 800);
      }
    };

    loadState();
  }, []);

  // Save state to localStorage whenever state changes
  useEffect(() => {
    if (!isLoading) {
      try {
        const stateToSave = {
          searchParams,
          selectedTrip,
          selectedSeats,
          baggageData,
          bookingData,
          paymentStatus,
          bookingHistory,
          favoriteRoutes,
          userPreferences,
          sessionTimestamp,
          currentPage: currentPage !== 'home' ? currentPage : null
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to save app state to localStorage:', error);
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
    bookingHistory,
    favoriteRoutes,
    userPreferences,
    currentPage,
    sessionTimestamp
  ]);

  // Actions
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

  const completeBooking = useCallback(async (paymentData: any) => {
    if (!selectedTrip || selectedSeats.length === 0) return;

  const seatsTotalPrice = selectedSeats.reduce((total: number, seat: Seat) => total + seat.price, 0);
    const baggageTotalPrice = baggageData?.totalCost || 0;
    const totalPrice = seatsTotalPrice + baggageTotalPrice;

    // Création d'un nouvel objet trip avec from/to extraits du champ route si besoin
    let tripWithCities = selectedTrip;
    if (selectedTrip) {
      let from = selectedTrip.from;
      let to = selectedTrip.to;
      if ((!from || !to) && selectedTrip.route && typeof selectedTrip.route === 'string') {
        const villes = selectedTrip.route.split('→').map((v: string) => v.trim());
        from = villes[0] || '';
        to = villes[villes.length - 1] || '';
      }
      tripWithCities = { ...selectedTrip, from, to };
    }
    let booking: BookingData = {
      id: `BK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      trip: tripWithCities,
      seats: selectedSeats,
      baggage: baggageData,
      totalPrice,
      currency: tripWithCities?.currency,
      paymentMethod: paymentData.method,
      paymentStatus: 'completed',
      bookingDate: new Date().toISOString(),
      confirmationCode: `KG${Date.now().toString().slice(-6)}`
    };
    // Log pour vérifier le trip final
    console.log('BookingData (avant setBookingData):', booking);

    // Nettoyage de l'objet booking avant envoi à Firestore
    booking = Object.fromEntries(Object.entries(booking).filter(([_, v]) => v !== undefined));
    if (!booking.currency) booking.currency = 'CDF';

    try {
      const user = auth.currentUser;
      if (user) {
        const bookingId = await createBooking(user.uid, booking);
        booking.id = bookingId;
      }
    } catch (error) {
      // Continue locally even if remote write fails
      console.error('Failed to persist booking to Firestore:', error);
    }

    setBookingData(booking);
    setPaymentStatus('completed');
  setBookingHistory((prev: BookingData[]) => [booking, ...prev.slice(0, 9)]); // Keep last 10 bookings
  }, [selectedTrip, selectedSeats, baggageData]);

  const recoverSession = useCallback(() => {
    // Just navigate to the appropriate page based on current state
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
      addedDate: new Date().toISOString()
    };

    setFavoriteRoutes(prev => {
      // Check if route already exists
      const exists = prev.some(fav => fav.from === route.from && fav.to === route.to);
      if (exists) return prev;
      return [newFavorite, ...prev.slice(0, 9)]; // Keep last 10 favorites
    });
  }, []);

  const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    setUserPreferences(prev => ({
      ...prev,
      ...newPreferences,
      accessibility: {
        ...prev.accessibility,
        ...(newPreferences.accessibility || {})
      }
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setBookingHistory([]);
  }, []);

  return {
    // State
    currentPage,
    isLoading,
    canGoBack,
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
    
    // Actions
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
    clearHistory
  };
}