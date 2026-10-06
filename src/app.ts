/**
 * Express application factory for the StayEase booking API.
 *
 * Routes:
 *   GET  /api/rooms                         -> list all room types
 *   GET  /api/availability?checkIn&checkOut&guests -> search availability
 *   POST /api/bookings                      -> create a booking
 *   GET  /api/bookings                      -> list bookings (demo/admin)
 *   GET  /api/health                        -> health probe
 *
 * The factory takes a BookingStore so tests can inject a fresh store.
 */

import express, { type Express, type Request, type Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BookingStore } from './store.js';
import { searchAvailability, validateBookingRequest } from './domain/booking.js';
import { isValidDateString, nightsBetween } from './domain/dates.js';
import type { CreateBookingRequest } from './domain/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp(store: BookingStore = new BookingStore()): Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/rooms', (_req: Request, res: Response) => {
    res.json({ rooms: store.listRooms() });
  });

  app.get('/api/availability', (req: Request, res: Response) => {
    const checkIn = String(req.query.checkIn ?? '');
    const checkOut = String(req.query.checkOut ?? '');
    const guests = Number(req.query.guests ?? '1');

    const errors: { field: string; message: string }[] = [];
    if (!isValidDateString(checkIn)) {
      errors.push({ field: 'checkIn', message: 'checkIn must be a valid YYYY-MM-DD date.' });
    }
    if (!isValidDateString(checkOut)) {
      errors.push({ field: 'checkOut', message: 'checkOut must be a valid YYYY-MM-DD date.' });
    }
    if (!Number.isInteger(guests) || guests < 1) {
      errors.push({ field: 'guests', message: 'guests must be a positive integer.' });
    }
    if (
      errors.length === 0 &&
      isValidDateString(checkIn) &&
      isValidDateString(checkOut) &&
      nightsBetween(checkIn, checkOut) <= 0
    ) {
      errors.push({ field: 'checkOut', message: 'checkOut must be after checkIn.' });
    }
    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    const results = searchAvailability(
      store.listRooms(),
      store.listBookings(),
      checkIn,
      checkOut,
      guests
    );
    res.json({ checkIn, checkOut, guests, results });
  });

  app.post('/api/bookings', (req: Request, res: Response) => {
    const body = req.body as Partial<CreateBookingRequest>;
    const bookingReq: CreateBookingRequest = {
      roomTypeId: String(body.roomTypeId ?? ''),
      guestName: String(body.guestName ?? ''),
      guestEmail: String(body.guestEmail ?? ''),
      checkIn: String(body.checkIn ?? ''),
      checkOut: String(body.checkOut ?? ''),
      guests: Number(body.guests ?? 0),
    };

    // Surface static validation errors early for a clearer 400 payload.
    const staticErrors = validateBookingRequest(bookingReq, store.getRoom(bookingReq.roomTypeId));
    if (staticErrors.length > 0) {
      res.status(400).json({ errors: staticErrors });
      return;
    }

    const result = store.createBooking(bookingReq);
    if (!result.ok) {
      // Remaining failure here is an availability conflict.
      res.status(409).json({ errors: result.errors });
      return;
    }
    res.status(201).json({ booking: result.booking });
  });

  app.get('/api/bookings', (_req: Request, res: Response) => {
    res.json({ bookings: store.listBookings() });
  });

  // Serve the static frontend from /public.
  const publicDir = path.resolve(__dirname, '../public');
  app.use(express.static(publicDir));

  return app;
}
