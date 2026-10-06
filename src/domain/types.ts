/**
 * Domain types for the StayEase hotel booking system.
 *
 * Dates are represented as ISO calendar dates (YYYY-MM-DD). A booking covers
 * nights from `checkIn` (inclusive) to `checkOut` (exclusive), matching standard
 * hotel semantics: a stay of check-in 2026-01-10 / check-out 2026-01-12 occupies
 * the nights of the 10th and 11th (2 nights).
 */

export interface RoomType {
  /** Stable identifier, e.g. "deluxe-king". */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Short marketing description. */
  description: string;
  /** Maximum number of guests the room sleeps. Must be >= 1. */
  capacity: number;
  /** Nightly rate in whole cents (USD). Must be >= 0. */
  priceCents: number;
  /** Total physical rooms of this type the hotel owns. Must be >= 0. */
  totalRooms: number;
  /** Amenity tags for display/filtering. */
  amenities: string[];
}

export interface Booking {
  id: string;
  roomTypeId: string;
  guestName: string;
  guestEmail: string;
  /** Inclusive start date (YYYY-MM-DD). */
  checkIn: string;
  /** Exclusive end date (YYYY-MM-DD). */
  checkOut: string;
  guests: number;
  /** Number of nights (checkOut - checkIn). */
  nights: number;
  /** Total price in cents = nights * room.priceCents. */
  totalCents: number;
  /** ISO timestamp when the booking was created. */
  createdAt: string;
}

export interface SearchQuery {
  checkIn: string;
  checkOut: string;
  guests: number;
}

export interface AvailabilityResult {
  roomType: RoomType;
  /** How many physical rooms remain bookable for the full date range. */
  roomsAvailable: number;
  nights: number;
  totalCents: number;
}

export interface CreateBookingRequest {
  roomTypeId: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
}
