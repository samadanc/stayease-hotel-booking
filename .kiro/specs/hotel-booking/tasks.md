# Implementation Plan — Hotel Booking Feature

Tasks derived from `requirements.md` and `design.md`. Each task references the
requirements it satisfies. Checked boxes are complete in this repository.

- [x] 1. Scaffold the TypeScript project (Express + static frontend, Vitest,
  Playwright, ESLint).
  - package.json, tsconfig.json, configs.

- [x] 2. Define domain types.
  - `src/domain/types.ts`: `RoomType`, `Booking`, `CreateBookingRequest`,
    `AvailabilityResult`.
  - _Requirements: R1, R11_

- [x] 3. Implement pure date utilities.
  - `src/domain/dates.ts`: `isValidDateString`, `parseDate`, `formatDate`,
    `nightsBetween`, `rangesOverlap`.
  - _Requirements: R3, R4, R7, R10_

- [x] 4. Implement the booking engine.
  - [x] 4.1 `validateBookingRequest` for static field validation.
    - _Requirements: R3, R4, R5, R6_
  - [x] 4.2 `roomsOccupied` / `roomsAvailable` peak-concurrency availability.
    - _Requirements: R8, R9_
  - [x] 4.3 `priceStay` pricing in cents.
    - _Requirements: R7_
  - [x] 4.4 `searchAvailability` and `canBook`.
    - _Requirements: R2, R8, R12_

- [x] 5. Implement the in-memory store.
  - `src/store.ts`: seed rooms, `createBooking` with derived fields.
  - _Requirements: R1, R11_

- [x] 6. Implement the HTTP API.
  - `src/app.ts`: rooms, availability, bookings; 400 vs 409 responses.
  - _Requirements: R1, R2, R3, R11, R12_

- [x] 7. Build the frontend.
  - `public/`: search form, results grid, booking modal, confirmation toast,
    `data-test` hooks.
  - _Requirements: R1, R2, R6_

- [x] 8. Write unit tests.
  - `tests/unit/dates.test.ts`, `tests/unit/booking.test.ts`.
  - _Requirements: R3–R7, R10_

- [x] 9. Write property-based tests (Lesson 4).
  - `tests/property/booking.property.test.ts`.
  - _Requirements: R5, R7, R8, R9, R11_

- [x] 10. Write E2E tests driven by the Playwright MCP server (Lesson 6).
  - `tests/e2e/booking.spec.ts`.
  - _Requirements: R1, R2, R3, R6, R11_
