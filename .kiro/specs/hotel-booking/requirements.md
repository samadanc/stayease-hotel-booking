# Requirements — Hotel Booking Feature

## Introduction

StayEase lets guests search a hotel's rooms for a date range and guest count,
see live availability and pricing, and book a room. The system must never
overbook a room type and must reject invalid requests with clear, field-level
errors. Requirements are written in EARS (Easy Approach to Requirements Syntax)
so each one is atomic and testable; many map directly to property-based tests in
`tests/property/`.

## Glossary

- **Room type**: a category of room (e.g. Deluxe King) with a capacity, nightly
  rate, and a fixed number of physical rooms.
- **Stay / date range**: a half-open interval `[checkIn, checkOut)` measured in
  nights. Check-out is exclusive.
- **Availability**: the number of physical rooms of a type that are free for an
  entire requested date range.

## Requirements

### R1 — List rooms
**WHEN** a client requests the room catalog,
**THE SYSTEM SHALL** return every room type with its name, description,
capacity, nightly rate, total rooms, and amenities.

### R2 — Search availability
**WHEN** a user submits a search with a check-in date, check-out date, and guest
count,
**THE SYSTEM SHALL** return only room types whose capacity is greater than or
equal to the guest count AND that have at least one room free for the full date
range, each annotated with rooms available, number of nights, and total price.

### R3 — Valid date range
**WHEN** a user submits a search or booking where check-out is not strictly after
check-in,
**THE SYSTEM SHALL** reject the request with a validation error on the
`checkOut` field and SHALL NOT return results or create a booking.

### R4 — Date format
**IF** a submitted check-in or check-out value is not a valid `YYYY-MM-DD`
calendar date,
**THEN THE SYSTEM SHALL** reject the request with a validation error identifying
the offending field.

### R5 — Guest count bounds
**WHILE** validating a booking request,
**THE SYSTEM SHALL** require the guest count to be an integer of at least 1 and
no greater than the smaller of the room type's capacity and the global maximum
of 16 guests per booking; otherwise it SHALL return a `guests` validation error.

### R6 — Required guest details
**WHEN** a user submits a booking,
**THE SYSTEM SHALL** require a non-empty guest name and a syntactically valid
email address, returning field-level errors for any that are missing or invalid.

### R7 — Pricing
**WHEN** the system prices a stay,
**THE SYSTEM SHALL** compute the total as `nights × nightly rate`, where nights
is the number of calendar nights in the range, and the result SHALL be
non-negative.

### R8 — No overbooking (safety-critical)
**WHILE** any set of existing bookings is held,
**THE SYSTEM SHALL** ensure that the number of accepted bookings whose date
ranges overlap a given night never exceeds that room type's total number of
physical rooms.

### R9 — Availability bounds
**WHEN** the system reports availability for a room type and date range,
**THE SYSTEM SHALL** return a value within the inclusive range
`[0, totalRooms]`.

### R10 — Back-to-back bookings
**WHEN** one booking's check-out date equals another booking's check-in date for
the same room type,
**THE SYSTEM SHALL** treat the two stays as non-overlapping and allow both.

### R11 — Booking confirmation
**WHEN** a booking is successfully created,
**THE SYSTEM SHALL** persist it with a unique identifier, the derived number of
nights, the total price, and a creation timestamp, and SHALL return the created
booking to the client.

### R12 — Availability conflict response
**IF** a booking request is otherwise valid but no room is free for the selected
range,
**THEN THE SYSTEM SHALL** reject it with an availability error and an HTTP 409
status, distinct from the HTTP 400 returned for static validation failures.

## Traceability

| Requirement | Primary implementation | Verified by |
|---|---|---|
| R1 | `src/app.ts` `GET /api/rooms` | `tests/e2e` |
| R2 | `src/domain/booking.ts` `searchAvailability` | `tests/unit/booking.test.ts` |
| R3 | `src/domain/booking.ts` `validateBookingRequest` | unit + property |
| R4 | `src/domain/dates.ts` `isValidDateString` | `tests/unit/dates.test.ts` |
| R5 | `validateBookingRequest` | `tests/property` (guest-count property) |
| R6 | `validateBookingRequest` | `tests/unit/booking.test.ts` |
| R7 | `priceStay` | `tests/property` (pricing property) |
| R8 | `roomsOccupied` / `canBook` | `tests/property` (no-overbooking property) |
| R9 | `roomsAvailable` | `tests/property` (availability-bounds property) |
| R10 | `rangesOverlap` | `tests/unit/*` (touching ranges) |
| R11 | `src/store.ts` `createBooking` | `tests/property` (derived-fields property) |
| R12 | `src/app.ts` `POST /api/bookings` | smoke test / E2E |
