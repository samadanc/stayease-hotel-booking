/**
 * In-memory data store for rooms and bookings.
 *
 * Deliberately simple and dependency-free so the app runs anywhere with no
 * database setup. The store is the single source of truth; all availability is
 * computed from `bookings` via the pure functions in domain/booking.ts.
 */

import { randomUUID } from 'node:crypto';
import type { Booking, CreateBookingRequest, RoomType } from './domain/types.js';
import { canBook, priceStay } from './domain/booking.js';
import { nightsBetween } from './domain/dates.js';

export const SEED_ROOMS: RoomType[] = [
  {
    id: 'standard-queen',
    name: 'Standard Queen',
    description: 'A cozy room with a plush queen bed, perfect for solo travelers or couples.',
    capacity: 2,
    priceCents: 11900,
    totalRooms: 8,
    amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Coffee maker'],
  },
  {
    id: 'deluxe-king',
    name: 'Deluxe King',
    description: 'Spacious king room with a city view and a dedicated work desk.',
    capacity: 3,
    priceCents: 18900,
    totalRooms: 5,
    amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'City view', 'Mini bar', 'Work desk'],
  },
  {
    id: 'family-suite',
    name: 'Family Suite',
    description: 'Two-room suite with a king bed and two twins, ideal for families.',
    capacity: 5,
    priceCents: 29900,
    totalRooms: 3,
    amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Kitchenette', 'Sofa bed', 'Two bathrooms'],
  },
  {
    id: 'penthouse',
    name: 'Penthouse',
    description: 'Top-floor luxury with panoramic views, a private terrace, and a soaking tub.',
    capacity: 4,
    priceCents: 54900,
    totalRooms: 1,
    amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Panoramic view', 'Private terrace', 'Soaking tub', 'Butler service'],
  },
];

export class BookingStore {
  private rooms: RoomType[];
  private bookings: Booking[] = [];

  constructor(rooms: RoomType[] = SEED_ROOMS) {
    // Defensive copy so callers can't mutate internal state.
    this.rooms = rooms.map((r) => ({ ...r, amenities: [...r.amenities] }));
  }

  listRooms(): RoomType[] {
    return this.rooms.map((r) => ({ ...r, amenities: [...r.amenities] }));
  }

  getRoom(id: string): RoomType | undefined {
    const r = this.rooms.find((x) => x.id === id);
    return r ? { ...r, amenities: [...r.amenities] } : undefined;
  }

  listBookings(): Booking[] {
    return this.bookings.map((b) => ({ ...b }));
  }

  /**
   * Attempts to create a booking. Returns the created booking on success or the
   * list of validation/availability errors on failure.
   */
  createBooking(
    req: CreateBookingRequest
  ): { ok: true; booking: Booking } | { ok: false; errors: { field: string; message: string }[] } {
    const roomType = this.getRoom(req.roomTypeId);
    const decision = canBook(req, roomType, this.bookings);
    if (!decision.ok) {
      return { ok: false, errors: decision.errors };
    }

    const rt = roomType as RoomType;
    const booking: Booking = {
      id: randomUUID(),
      roomTypeId: rt.id,
      guestName: req.guestName.trim(),
      guestEmail: req.guestEmail.trim(),
      checkIn: req.checkIn,
      checkOut: req.checkOut,
      guests: req.guests,
      nights: nightsBetween(req.checkIn, req.checkOut),
      totalCents: priceStay(rt, req.checkIn, req.checkOut),
      createdAt: new Date().toISOString(),
    };
    this.bookings.push(booking);
    return { ok: true, booking };
  }

  /** Test/support helper: wipe all bookings. */
  reset(): void {
    this.bookings = [];
  }
}
