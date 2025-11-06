export interface SearchParams {
  from: string;
  to: string;
  date: string;
  passengers: number;
}

export interface Trip {
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
  busType: string;
  date: string;
}

export interface Seat {
  seatNumber: string;
  type: 'standard' | 'premium' | 'vip';
  price: number;
}

export interface BaggageItem {
  id: string;
  type: 'cabine' | 'soute';
  weight: number;
  price: number;
  description: string;
}

export interface BaggageData {
  items: BaggageItem[];
  totalCost: number;
}

export interface BookingData {
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

export interface UserPreferences {
  language: string;
  currency: string;
  notifications: boolean;
  accessibility: {
    highContrast: boolean;
    largeText: boolean;
    reduceMotion: boolean;
  };
}

export interface FavoriteRoute {
  id: string;
  from: string;
  to: string;
  addedDate: string;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  clickable?: boolean;
  current?: boolean;
}

export interface AppState {
  currentPage: string;
  isLoading: boolean;
  canGoBack: boolean;
  searchParams: SearchParams | null;
  selectedTrip: Trip | null;
  selectedSeats: Seat[];
  baggageData: BaggageData | null;
  bookingData: BookingData | null;
  bookingProgress: number;
  bookingHistory: BookingData[];
  favoriteRoutes: FavoriteRoute[];
  userPreferences: UserPreferences;
  paymentStatus: 'pending' | 'completed' | 'failed' | null;
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