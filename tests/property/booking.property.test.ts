/**
 * Property-based tests (Lesson 4).
 *
 * Instead of hand-picked examples, these tests state GENERAL RULES that must
 * hold for ALL valid inputs, and fast-check generates hundreds of randomized
 * cases (including shrunk minimal counterexamples) to try to falsify them.
 *
 * Each property maps directly back to a requirement in
 * .kiro/specs/hotel-booking/requirements.md.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { BookingStore } from '../../src/store.js';
import {
  roomsAvailable,
  roomsOccupied,
  priceStay,
  validateBookingRequest,
} from '../../src/domain/booking.js';
import { nightsBetween, formatDate, rangesOverlap } from '../../src/domain/dates.js';
import type { RoomType, CreateBookingRequest } from '../../src/domain/types.js';

// --- Generators -----------------------------------------------------------

/** A calendar date within a bounded window, as YYYY-MM-DD. */
const dateArb = fc
  .date({ min: new Date(Date.UTC(2026, 0, 1)), max: new Date(Date.UTC(2027, 11, 31)) })
  .map((d) => formatDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))));

/** An ordered [checkIn, checkOut) pair with 1..30 nights. */
const stayArb = fc
  .tuple(dateArb, fc.integer({ min: 1, max: 30 }))
  .map(([checkIn, nights]) => {
    const [y, m, d] = checkIn.split('-').map(Number);
    const out = new Date(Date.UTC(y, m - 1, d + nights));
    return { checkIn, checkOut: formatDate(out), nights };
  });

const roomTypeArb: fc.Arbitrary<RoomType> = fc.record({
  id: fc.constant('generated-room'),
  name: fc.constant('Generated Room'),
  description: fc.constant('A room for property tests.'),
  capacity: fc.integer({ min: 1, max: 8 }),
  priceCents: fc.integer({ min: 0, max: 100000 }),
  totalRooms: fc.integer({ min: 0, max: 6 }),
  amenities: fc.constant([] as string[]),
});

// --- Properties -----------------------------------------------------------

describe('property: pricing', () => {
  it('total price equals nights * nightly rate, and is non-negative', () => {
    fc.assert(
      fc.property(roomTypeArb, stayArb, (room, stay) => {
        const total = priceStay(room, stay.checkIn, stay.checkOut);
        expect(total).toBe(stay.nights * room.priceCents);
        expect(total).toBeGreaterThanOrEqual(0);
      })
    );
  });
});

describe('property: availability bounds', () => {
  it('roomsAvailable is always within [0, totalRooms] regardless of bookings', () => {
    fc.assert(
      fc.property(roomTypeArb, stayArb, (room, stay) => {
        const store = new BookingStore([room]);
        // Attempt a pile of bookings; some will be rejected, which is fine.
        for (let i = 0; i < 10; i++) {
          store.createBooking({
            roomTypeId: room.id,
            guestName: `Guest ${i}`,
            guestEmail: `g${i}@example.com`,
            checkIn: stay.checkIn,
            checkOut: stay.checkOut,
            guests: 1,
          });
        }
        const avail = roomsAvailable(room, store.listBookings(), stay.checkIn, stay.checkOut);
        expect(avail).toBeGreaterThanOrEqual(0);
        expect(avail).toBeLessThanOrEqual(room.totalRooms);
      })
    );
  });
});

describe('property: no overbooking', () => {
  it('accepted bookings for a date range never exceed totalRooms', () => {
    fc.assert(
      fc.property(roomTypeArb, stayArb, fc.integer({ min: 1, max: 12 }), (room, stay, attempts) => {
        const store = new BookingStore([room]);
        let accepted = 0;
        for (let i = 0; i < attempts; i++) {
          const res = store.createBooking({
            roomTypeId: room.id,
            guestName: `Guest ${i}`,
            guestEmail: `g${i}@example.com`,
            checkIn: stay.checkIn,
            checkOut: stay.checkOut,
            guests: 1,
          });
          if (res.ok) accepted++;
        }
        // Every accepted booking shares the same range, so the count of
        // concurrently occupied rooms must never exceed capacity.
        expect(accepted).toBeLessThanOrEqual(room.totalRooms);
        expect(roomsOccupied(room, store.listBookings(), stay.checkIn, stay.checkOut)).toBe(accepted);
      })
    );
  });
});

describe('property: non-overlapping stays never reduce each other', () => {
  it('a booking in a disjoint range does not consume availability for another range', () => {
    fc.assert(
      fc.property(stayArb, stayArb, (a, b) => {
        // Only meaningful when the two ranges do not overlap.
        fc.pre(!rangesOverlap(a.checkIn, a.checkOut, b.checkIn, b.checkOut));
        const room: RoomType = {
          id: 'generated-room',
          name: 'R',
          description: '',
          capacity: 4,
          priceCents: 10000,
          totalRooms: 1,
          amenities: [],
        };
        const store = new BookingStore([room]);
        const first = store.createBooking({
          roomTypeId: room.id,
          guestName: 'A',
          guestEmail: 'a@example.com',
          checkIn: a.checkIn,
          checkOut: a.checkOut,
          guests: 1,
        });
        expect(first.ok).toBe(true);
        // The disjoint range still has its full room available.
        expect(roomsAvailable(room, store.listBookings(), b.checkIn, b.checkOut)).toBe(1);
      })
    );
  });
});

describe('property: validation rejects invalid guest counts', () => {
  it('a request with guests < 1 is always invalid', () => {
    fc.assert(
      fc.property(stayArb, fc.integer({ min: -5, max: 0 }), (stay, guests) => {
        const room: RoomType = {
          id: 'generated-room',
          name: 'R',
          description: '',
          capacity: 4,
          priceCents: 10000,
          totalRooms: 2,
          amenities: [],
        };
        const req: CreateBookingRequest = {
          roomTypeId: room.id,
          guestName: 'Valid Name',
          guestEmail: 'valid@example.com',
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          guests,
        };
        const errors = validateBookingRequest(req, room);
        expect(errors.some((e) => e.field === 'guests')).toBe(true);
      })
    );
  });
});

describe('property: created bookings carry correct derived fields', () => {
  it('nights and totalCents on a stored booking match the pure computations', () => {
    fc.assert(
      fc.property(stayArb, (stay) => {
        const room: RoomType = {
          id: 'generated-room',
          name: 'R',
          description: '',
          capacity: 4,
          priceCents: 12345,
          totalRooms: 3,
          amenities: [],
        };
        const store = new BookingStore([room]);
        const res = store.createBooking({
          roomTypeId: room.id,
          guestName: 'Derived Fields',
          guestEmail: 'derived@example.com',
          checkIn: stay.checkIn,
          checkOut: stay.checkOut,
          guests: 1,
        });
        expect(res.ok).toBe(true);
        if (res.ok) {
          expect(res.booking.nights).toBe(nightsBetween(stay.checkIn, stay.checkOut));
          expect(res.booking.totalCents).toBe(priceStay(room, stay.checkIn, stay.checkOut));
        }
      })
    );
  });
});
