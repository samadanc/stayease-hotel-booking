# Design — Hotel Booking Feature

## Overview

StayEase is a small full-stack TypeScript app. The design keeps all booking
rules in a pure, side-effect-free **domain layer** so the invariants in
`requirements.md` can be verified with property-based tests, independent of HTTP
and storage concerns.

```
┌──────────────┐     fetch      ┌──────────────┐    calls    ┌──────────────────┐
│  Frontend    │ ─────────────▶ │  Express API │ ──────────▶ │  Domain layer    │
│ (public/*)   │  JSON over HTTP│  (src/app.ts)│  pure fns   │ (src/domain/*)   │
└──────────────┘ ◀───────────── └──────┬───────┘ ◀────────── └──────────────────┘
                                        │ reads/writes
                                        ▼
                                 ┌──────────────┐
                                 │ BookingStore │  in-memory
                                 │ (src/store)  │
                                 └──────────────┘
```

## Components

### Domain layer (`src/domain/`)
- `types.ts` — `RoomType`, `Booking`, `CreateBookingRequest`, result shapes.
- `dates.ts` — pure calendar-date helpers: `isValidDateString`, `nightsBetween`,
  `rangesOverlap`, parse/format. All UTC to avoid timezone drift.
- `booking.ts` — the engine:
  - `validateBookingRequest` → static field-level validation (R3–R6).
  - `roomsOccupied` → peak concurrent occupancy over a range.
  - `roomsAvailable` → `totalRooms − occupied`, clamped to `[0, totalRooms]` (R9).
  - `priceStay` → `nights × nightly rate` (R7).
  - `searchAvailability` → filters room types for a search (R2).
  - `canBook` → combines validation + availability into an accept/reject
    decision (R8, R12).

Purity is the key design decision: every rule is a function of its inputs with
no hidden state, so property-based tests can throw hundreds of random inputs at
them.

### Storage (`src/store.ts`)
`BookingStore` holds seed room types and an array of bookings in memory. It
returns defensive copies so callers cannot mutate internal state. `createBooking`
delegates the accept/reject decision to `canBook`, then derives `nights`,
`totalCents`, `id`, and `createdAt`. In-memory storage is intentional: the app
runs anywhere with zero setup, which matters for the challenge's reproducibility.

### API (`src/app.ts`)
Express app factory (injectable store for tests). Routes:
- `GET /api/health`, `GET /api/rooms`, `GET /api/availability`,
  `POST /api/bookings`, `GET /api/bookings`.
- Static validation failures → **400**; availability conflicts → **409** (R12).
- Serves the static frontend from `public/`.

### Frontend (`public/`)
Vanilla HTML/CSS/JS, no build step. Search form → results grid → booking modal →
confirmation toast. Key elements carry `data-test` attributes so Playwright
(both the MCP server and the committed E2E suite) can target them stably.

## Key design decisions

1. **Half-open date ranges `[checkIn, checkOut)`** mirror real hotel semantics
   and make "back-to-back" bookings (R10) fall out naturally: touching ranges
   do not overlap.
2. **Peak-concurrency availability.** Rather than counting total overlapping
   bookings, `roomsOccupied` computes the maximum number of simultaneously
   occupied rooms across the queried range, which is the true constraint for
   overbooking (R8).
3. **Cents, not floats, for money** (R7) to avoid rounding errors.
4. **Separate 400 vs 409** so clients can distinguish "you sent bad data" from
   "the room is gone" (R12).

## Property-based testing plan (Lesson 4)

The following requirement-level invariants are encoded as properties in
`tests/property/booking.property.test.ts` and checked against randomized inputs:

| Property | Requirement |
|---|---|
| total price = nights × rate, ≥ 0 | R7 |
| availability ∈ [0, totalRooms] | R9 |
| accepted overlapping bookings ≤ totalRooms | R8 |
| disjoint-range booking leaves other range fully available | R8/R10 |
| guests < 1 always rejected | R5 |
| stored booking's derived fields match pure computation | R11 |

## Testing strategy
- **Unit** (`tests/unit/`): representative examples for dates, validation, and
  availability edge cases.
- **Property** (`tests/property/`): the invariants above via `fast-check`.
- **E2E** (`tests/e2e/`): Playwright drives the real browser through search →
  book → confirm; first explored interactively via the Playwright MCP server.
