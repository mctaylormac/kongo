export interface SearchParams {
  from: string;
  to: string;
  date: string;
  passengers: number;
  transportType?: 'bus' | 'train' | 'all';
  departureStopId?: string;
  arrivalStopId?: string;
}

export interface Trip {
  id: string;
  operator: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  departureAddress?: string;
  arrivalAddress?: string;
  price: number;
  currency: string;
  amenities: string[];
  seatsAvailable: number;
  vehicleType: 'bus' | 'train';
  busType?: string;
  trainType?: string;
  trainClass?: 'economy' | 'business' | 'first';
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

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  city: string;
  password: string;
  acceptTerms: boolean;
  marketing: boolean;
}

export type SocialProvider = 'google' | 'facebook' | 'microsoft';

export interface BookingPaymentData {
  method: string;
}

export interface UserProfile {
  role?: string | null;
  full_name?: string | null;
  agency_id?: string | null;
}

export type UserRole =
  | 'guest'
  | 'user'
  | 'superuser'
  | 'agency'
  | 'chef'
  | 'driver'
  | 'cashier';

export const ADMIN_ROLES: UserRole[] = ['superuser', 'agency', 'chef', 'driver', 'cashier'];

export function normalizeUserRole(role?: string | null): UserRole {
  if (!role) return 'user';
  if (role === 'client') return 'user';
  if ((ADMIN_ROLES as string[]).includes(role)) return role as UserRole;
  if (role === 'user') return 'user';
  return 'user';
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  clickable?: boolean;
  current?: boolean;
}

export interface StoredAppState {
  searchParams?: SearchParams | null;
  selectedTrip?: Trip | null;
  selectedSeats?: Seat[];
  baggageData?: BaggageData | null;
  bookingData?: BookingData | null;
  paymentStatus?: AppState['paymentStatus'];
  bookingHistory?: BookingData[];
  favoriteRoutes?: FavoriteRoute[];
  userPreferences?: Partial<UserPreferences>;
  sessionTimestamp?: number;
  currentPage?: string | null;
}

export interface AppState {
  currentPage: string;
  userRole: UserRole;
  isAuthenticated: boolean;
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
  completeBooking: (paymentData: BookingPaymentData) => void;
  resetBookingFlow: () => void;
  recoverSession: () => void;
  getSessionAge: () => number;
  addToFavorites: (route: { from: string; to: string }) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  clearHistory: () => void;
  setUserRole: (role: UserRole) => void;
  setIsAuthenticated: (value: boolean) => void;
}
