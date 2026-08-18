import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useAppState } from './useAppState';

describe('useAppState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts on home when no stored state exists', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(result.current.currentPage).toBe('home');
    expect(result.current.isLoading).toBe(false);
  });

  it('starts on admin login when entering through an admin path', () => {
    window.history.replaceState(null, '', '/admin');

    const { result } = renderHook(() => useAppState());

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(result.current.currentPage).toBe('admin-login');
  });

  it('hydrates stored booking state from localStorage', () => {
    localStorage.setItem(
      'kongo-app-state',
      JSON.stringify({
        searchParams: {
          from: 'Kinshasa',
          to: 'Goma',
          date: '2026-04-03',
          passengers: 2,
        },
        selectedSeats: [{ seatNumber: 'A1', type: 'standard', price: 1000 }],
        sessionTimestamp: 12345,
      })
    );

    const { result } = renderHook(() => useAppState());

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(result.current.currentPage).toBe('baggage');
    expect(result.current.searchParams?.from).toBe('Kinshasa');
    expect(result.current.selectedSeats).toHaveLength(1);
    expect(result.current.getSessionAge()).toBeGreaterThan(0);
  });

  it('persists sanitized booking data without sensitive fields', async () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      vi.advanceTimersByTime(800);
    });

    act(() => {
      result.current.setSelectedTrip({
        id: 'trip-1',
        operator: 'KonGO',
        from: 'Kinshasa',
        to: 'Matadi',
        departure: '08:00',
        arrival: '12:00',
        duration: '4h',
        price: 25000,
        currency: 'CDF',
        amenities: ['WiFi'],
        seatsAvailable: 10,
        vehicleType: 'bus',
        date: '2026-04-03',
      });
      result.current.setSelectedSeats([{ seatNumber: 'A1', type: 'standard', price: 25000 }]);
    });

    act(() => {
      result.current.completeBooking({
        method: 'card',
        cardNumber: '4111111111111111',
        cvv: '123',
        firstName: 'Jane',
      } as never);
    });

    const stored = JSON.parse(localStorage.getItem('kongo-app-state') || '{}');

    expect(stored.bookingData.paymentMethod).toBe('card');
    expect(stored.bookingData.cardNumber).toBeUndefined();
    expect(stored.bookingData.cvv).toBeUndefined();
    expect(stored.bookingData.firstName).toBeUndefined();
  });
});
