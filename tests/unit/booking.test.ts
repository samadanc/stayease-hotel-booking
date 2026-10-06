import { describe, it, expect } from 'vitest';
import { BookingStore, SEED_ROOMS } from '../../src/store.js';
import {
  validateBookingRequest,
  roomsAvailable,
  priceStay,
} from '../../src/domain/booking.js';
import type { CreateBookingRequest } from '../../src/domain/types.js';

const baseReq: CreateBookingRequest = {
  roomTypeId: 'standard-queen',
  guestName: 'Ada Lovelace',
  guestEmail: 'ada@example.com',
  checkIn: '2026-03-01',
  checkOut: '2026-03-04',
  guests: 2,
};

const standardQueen = SEED_ROOMS.find((r) => r.id === 'standard-queen')!;

describe('validateBookingRequest', () => {
  it('passes a valid request', () => {
    expect(validateBookingRequest(baseReq, standardQueen)).toEqual([]);
  });

  it('rejects a missing name', () => {
    const errors = validateBookingRequest({ ...baseReq, guestName: '  ' }, standardQueen);
    expect(errors.some((e) => e.field === 'guestName')).toBe(true);
  });

  it('rejects a bad email', () => {
    const errors = validateBookingRequest({ ...baseReq, guestEmail: 'nope' }, standardQueen);
    expect(errors.some((e) => e.field === 'guestEmail')).toBe(true);
  });

  it('rejects check-out before check-in', () => {
    const errors = validateBookingRequest(
      { ...baseReq, checkIn: '2026-03-04', checkOut: '2026-03-01' },
      standardQueen
    );
    expect(errors.some((e) => e.field === 'checkOut')).toBe(true);
  });

  it('rejects guests over room capacity', () => {
    const errors = validateBookingRequest({ ...baseReq, guests: 5 }, standardQueen);
    expect(errors.some((e) => e.field === 'guests')).toBe(true);
  });

  it('rejects an unknown room type', () => {
    const errors = validateBookingRequest({ ...baseReq, roomTypeId: 'nope' }, undefined);
    expect(errors.some((e) => e.field === 'roomTypeId')).toBe(true);
  });
});

describe('priceStay', () => {
  it('multiplies nightly rate by nights', () => {
    expect(priceStay(standardQueen, '2026-03-01', '2026-03-04')).toBe(standardQueen.priceCents * 3);
  });
});

describe('availability and overbooking', () => {
  it('decrements availability as rooms are booked', () => {
    const store = new BookingStore();
    const penthouse = SEED_ROOMS.find((r) => r.id === 'penthouse')!; // totalRooms: 1
    expect(roomsAvailable(penthouse, store.listBookings(), '2026-05-01', '2026-05-03')).toBe(1);

    const first = store.createBooking({
      roomTypeId: 'penthouse',
      guestName: 'Grace Hopper',
      guestEmail: 'grace@example.com',
      checkIn: '2026-05-01',
      checkOut: '2026-05-03',
      guests: 2,
    });
    expect(first.ok).toBe(true);

    // The single penthouse is now fully booked for overlapping dates.
    expect(roomsAvailable(penthouse, store.listBookings(), '2026-05-01', '2026-05-03')).toBe(0);
  });

  it('refuses to overbook', () => {
    const store = new BookingStore();
    const ok = store.createBooking({
      roomTypeId: 'penthouse',
      guestName: 'A',
      guestEmail: 'a@example.com',
      checkIn: '2026-06-01',
      checkOut: '2026-06-05',
      guests: 2,
    });
    expect(ok.ok).toBe(true);

    const conflict = store.createBooking({
      roomTypeId: 'penthouse',
      guestName: 'B',
      guestEmail: 'b@example.com',
      checkIn: '2026-06-02',
      checkOut: '2026-06-03',
      guests: 2,
    });
    expect(conflict.ok).toBe(false);
  });

  it('allows back-to-back (touching) bookings', () => {
    const store = new BookingStore();
    store.createBooking({
      roomTypeId: 'penthouse',
      guestName: 'A',
      guestEmail: 'a@example.com',
      checkIn: '2026-07-01',
      checkOut: '2026-07-03',
      guests: 2,
    });
    const nextGuest = store.createBooking({
      roomTypeId: 'penthouse',
      guestName: 'B',
      guestEmail: 'b@example.com',
      checkIn: '2026-07-03',
      checkOut: '2026-07-05',
      guests: 2,
    });
    expect(nextGuest.ok).toBe(true);
  });
});
