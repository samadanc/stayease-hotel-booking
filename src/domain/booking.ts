/**
 * Core booking engine: pure functions for validation, availability, and pricing.
 *
 * These functions have no I/O and no hidden state. Availability is always
 * computed from the full set of existing bookings, which makes the invariants
 * (no overbooking, non-negative availability, correct pricing) straightforward
 * to express as properties.
 */

import type {
  Booking,
  CreateBookingRequest,
  RoomType,
  AvailabilityResult,
} from './types.js';
import { isValidDateString, nightsBetween, rangesOverlap } from './dates.js';

export const MAX_GUESTS_PER_BOOKING = 16;
/** A single stay may not exceed this many nights. */
export const MAX_NIGHTS = 30;

export interface ValidationError {
  field: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a booking request against static rules (shape, dates, guest count)
 * and the referenced room type. Returns an array of errors; empty means valid.
 * Does NOT check availability — that is a separate concern (see roomsAvailable).
 */
export function validateBookingRequest(
  req: CreateBookingRequest,
  roomType: RoomType | undefined
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!req.guestName || req.guestName.trim().length === 0) {
    errors.push({ field: 'guestName', message: 'Guest name is required.' });
  }

  if (!req.guestEmail || !EMAIL_RE.test(req.guestEmail)) {
    errors.push({ field: 'guestEmail', message: 'A valid email is required.' });
  }

  if (!isValidDateString(req.checkIn)) {
    errors.push({ field: 'checkIn', message: 'Check-in must be a valid YYYY-MM-DD date.' });
  }
  if (!isValidDateString(req.checkOut)) {
    errors.push({ field: 'checkOut', message: 'Check-out must be a valid YYYY-MM-DD date.' });
  }

  // Only evaluate night-based rules when both dates parse.
  if (isValidDateString(req.checkIn) && isValidDateString(req.checkOut)) {
    const nights = nightsBetween(req.checkIn, req.checkOut);
    if (nights <= 0) {
      errors.push({ field: 'checkOut', message: 'Check-out must be after check-in.' });
    } else if (nights > MAX_NIGHTS) {
      errors.push({ field: 'checkOut', message: `Stay may not exceed ${MAX_NIGHTS} nights.` });
    }
  }

  if (!Number.isInteger(req.guests) || req.guests < 1) {
    errors.push({ field: 'guests', message: 'At least one guest is required.' });
  } else if (req.guests > MAX_GUESTS_PER_BOOKING) {
    errors.push({ field: 'guests', message: `A booking may not exceed ${MAX_GUESTS_PER_BOOKING} guests.` });
  }

  if (!roomType) {
    errors.push({ field: 'roomTypeId', message: 'Unknown room type.' });
  } else if (Number.isInteger(req.guests) && req.guests > roomType.capacity) {
    errors.push({
      field: 'guests',
      message: `This room sleeps at most ${roomType.capacity} guests.`,
    });
  }

  return errors;
}

/**
 * Counts how many physical rooms of `roomType` are already occupied for ANY
 * night in the requested [checkIn, checkOut) range. The peak concurrent
 * occupancy over the range is what limits availability.
 */
export function roomsOccupied(
  roomType: RoomType,
  bookings: Booking[],
  checkIn: string,
  checkOut: string
): number {
  const overlapping = bookings.filter(
    (b) =>
      b.roomTypeId === roomType.id &&
      rangesOverlap(b.checkIn, b.checkOut, checkIn, checkOut)
  );

  // Peak concurrency: for each distinct check-in boundary of overlapping
  // bookings, count how many bookings cover that night. The maximum is the
  // peak number of simultaneously occupied rooms.
  if (overlapping.length === 0) return 0;

  const boundaries = new Set<string>([checkIn]);
  for (const b of overlapping) {
    boundaries.add(b.checkIn);
  }

  let peak = 0;
  for (const point of boundaries) {
    // Skip boundaries outside the queried range.
    if (!rangesOverlap(point, addOneNight(point), checkIn, checkOut)) continue;
    const concurrent = overlapping.filter((b) =>
      rangesOverlap(b.checkIn, b.checkOut, point, addOneNight(point))
    ).length;
    if (concurrent > peak) peak = concurrent;
  }
  return peak;
}

function addOneNight(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  const yy = dt.getUTCFullYear().toString().padStart(4, '0');
  const mm = (dt.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = dt.getUTCDate().toString().padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Number of rooms of `roomType` still bookable for the full range. Never
 * negative and never greater than totalRooms.
 */
export function roomsAvailable(
  roomType: RoomType,
  bookings: Booking[],
  checkIn: string,
  checkOut: string
): number {
  const occupied = roomsOccupied(roomType, bookings, checkIn, checkOut);
  const free = roomType.totalRooms - occupied;
  return Math.max(0, Math.min(roomType.totalRooms, free));
}

/** Total price in cents for a stay. Pure: nights * nightly rate. */
export function priceStay(roomType: RoomType, checkIn: string, checkOut: string): number {
  const nights = nightsBetween(checkIn, checkOut);
  return nights * roomType.priceCents;
}

/**
 * Builds availability results for a search across all room types, filtering to
 * rooms that fit the guest count and have at least one room free.
 */
export function searchAvailability(
  roomTypes: RoomType[],
  bookings: Booking[],
  checkIn: string,
  checkOut: string,
  guests: number
): AvailabilityResult[] {
  const nights = nightsBetween(checkIn, checkOut);
  return roomTypes
    .filter((rt) => rt.capacity >= guests)
    .map((rt) => ({
      roomType: rt,
      roomsAvailable: roomsAvailable(rt, bookings, checkIn, checkOut),
      nights,
      totalCents: priceStay(rt, checkIn, checkOut),
    }))
    .filter((r) => r.roomsAvailable > 0);
}

/**
 * Decides whether a new booking can be accepted: it must pass validation AND
 * there must be at least one room free for the whole range. Returns either the
 * list of errors or an "ok" marker.
 */
export function canBook(
  req: CreateBookingRequest,
  roomType: RoomType | undefined,
  existingBookings: Booking[]
): { ok: true } | { ok: false; errors: ValidationError[] } {
  const errors = validateBookingRequest(req, roomType);
  if (errors.length > 0) return { ok: false, errors };

  // roomType is defined here because validation passed.
  const rt = roomType as RoomType;
  const available = roomsAvailable(rt, existingBookings, req.checkIn, req.checkOut);
  if (available < 1) {
    return {
      ok: false,
      errors: [{ field: 'roomTypeId', message: 'No rooms available for the selected dates.' }],
    };
  }
  return { ok: true };
}
