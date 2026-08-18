import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NAVIGATION_PAGES } from './AppConstants';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      resetPasswordForEmail: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import {
  createBookingHandlers,
  createNavigationHandlers,
  resolveInitialPageFromPath,
  resolveProtectedPage,
  shouldOfferSessionRecovery,
} from './AppHelpers';
import type { AppState, AuthCredentials, SignupData, Trip } from './AppTypes';

const supabaseMock = vi.mocked(supabase);
const toastMock = vi.mocked(toast);

function createAppState(overrides: Partial<AppState> = {}): AppState {
  return {
    currentPage: NAVIGATION_PAGES.HOME,
    userRole: 'guest',
    isAuthenticated: false,
    isLoading: false,
    canGoBack: false,
    searchParams: null,
    selectedTrip: null,
    selectedSeats: [],
    baggageData: null,
    bookingData: null,
    bookingProgress: 0,
    bookingHistory: [],
    favoriteRoutes: [],
    userPreferences: {
      language: 'FR',
      currency: 'CDF',
      notifications: true,
      accessibility: {
        highContrast: false,
        largeText: false,
        reduceMotion: false,
      },
    },
    paymentStatus: null,
    setCurrentPage: vi.fn(),
    setSearchParams: vi.fn(),
    setSelectedTrip: vi.fn(),
    setSelectedSeats: vi.fn(),
    setBaggageData: vi.fn(),
    completeBooking: vi.fn(),
    resetBookingFlow: vi.fn(),
    recoverSession: vi.fn(),
    getSessionAge: vi.fn(() => 1_000),
    addToFavorites: vi.fn(),
    updatePreferences: vi.fn(),
    clearHistory: vi.fn(),
    setUserRole: vi.fn(),
    setIsAuthenticated: vi.fn(),
    ...overrides,
  };
}

describe('AppHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('resolves initial page from public and admin paths', () => {
    expect(resolveInitialPageFromPath('/')).toBe(NAVIGATION_PAGES.HOME);
    expect(resolveInitialPageFromPath('/login')).toBe(NAVIGATION_PAGES.LOGIN);
    expect(resolveInitialPageFromPath('/admin')).toBe(NAVIGATION_PAGES.ADMIN_LOGIN);
  });

  it('resolves protected pages for guests and authenticated users', () => {
    expect(
      resolveProtectedPage({
        currentPage: NAVIGATION_PAGES.DASHBOARD,
        isAuthenticated: false,
        userRole: 'guest',
      })
    ).toBe(NAVIGATION_PAGES.LOGIN);

    expect(
      resolveProtectedPage({
        currentPage: NAVIGATION_PAGES.ADMIN_TRIPS,
        isAuthenticated: true,
        userRole: 'user',
      })
    ).toBe(NAVIGATION_PAGES.DASHBOARD);

    expect(
      resolveProtectedPage({
        currentPage: NAVIGATION_PAGES.HOME,
        isAuthenticated: true,
        userRole: 'agency',
      })
    ).toBe(NAVIGATION_PAGES.ADMIN_DASHBOARD);
  });

  it('creates booking navigation handlers with expected redirects', () => {
    const appState = createAppState({ currentPage: NAVIGATION_PAGES.PAYMENT });
    const handlers = createNavigationHandlers(appState);

    handlers.handleBack();
    expect(appState.setCurrentPage).toHaveBeenCalledWith(NAVIGATION_PAGES.BAGGAGE);
  });

  it('offers session recovery only for recent home sessions with search data', () => {
    const appState = createAppState({
      currentPage: NAVIGATION_PAGES.HOME,
      searchParams: {
        from: 'Kinshasa',
        to: 'Goma',
        date: '2026-04-03',
        passengers: 1,
      },
      getSessionAge: vi.fn(() => 60_000),
    });

    expect(shouldOfferSessionRecovery(appState)).toBe(true);
  });

  it('logs in and routes regular users to the dashboard', async () => {
    const appState = createAppState();
    const navigationHandlers = createNavigationHandlers(appState);
    const handlers = createBookingHandlers(appState, navigationHandlers);

    const credentials: AuthCredentials = {
      email: 'user@example.com',
      password: 'secret',
      rememberMe: false,
    };

    vi.mocked(supabaseMock.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: 'user-1', email: 'user@example.com' } } as never,
      error: null,
    });

    const single = vi.fn().mockResolvedValue({
      data: { role: 'client', full_name: 'Test User' },
      error: null,
    });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    vi.mocked(supabaseMock.from).mockReturnValue({ select } as never);

    await handlers.handleLogin(credentials);

    expect(appState.setIsAuthenticated).toHaveBeenCalledWith(true);
    expect(appState.setUserRole).toHaveBeenCalledWith('user');
    expect(appState.setCurrentPage).toHaveBeenCalledWith(NAVIGATION_PAGES.DASHBOARD);
    expect(toastMock.success).toHaveBeenCalled();
  });

  it('routes admins to the admin dashboard after login', async () => {
    const appState = createAppState();
    const handlers = createBookingHandlers(appState, createNavigationHandlers(appState));

    vi.mocked(supabaseMock.auth.signInWithPassword).mockResolvedValue({
      data: { user: { id: 'admin-1', email: 'admin@example.com' } } as never,
      error: null,
    });

    const single = vi.fn().mockResolvedValue({
      data: { role: 'agency', full_name: 'Admin User' },
      error: null,
    });
    const eq = vi.fn(() => ({ single }));
    const select = vi.fn(() => ({ eq }));
    vi.mocked(supabaseMock.from).mockReturnValue({ select } as never);

    await handlers.handleLogin({
      email: 'admin@example.com',
      password: 'secret',
      rememberMe: true,
    });

    expect(appState.setCurrentPage).toHaveBeenCalledWith(NAVIGATION_PAGES.ADMIN_DASHBOARD);
  });

  it('signs up and redirects to login', async () => {
    const appState = createAppState();
    const handlers = createBookingHandlers(appState, createNavigationHandlers(appState));

    const userData: SignupData = {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: '+243810000000',
      dateOfBirth: '1995-01-01',
      city: 'Kinshasa',
      password: 'Secret123',
      acceptTerms: true,
      marketing: true,
    };

    vi.mocked(supabaseMock.auth.signUp).mockResolvedValue({
      data: { user: { id: 'new-user' } } as never,
      error: null,
    });

    await handlers.handleSignup(userData);

    expect(appState.setCurrentPage).toHaveBeenCalledWith(NAVIGATION_PAGES.LOGIN);
    expect(toastMock.success).toHaveBeenCalled();
  });
});
