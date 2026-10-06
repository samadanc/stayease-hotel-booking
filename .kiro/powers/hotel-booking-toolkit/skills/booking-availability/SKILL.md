---
name: booking-availability
description: >
  Patterns and best practices for implementing correct booking/reservation
  availability. Activates on booking, reservation, hotel, availability,
  overbooking, or scheduling work. Use it to model date ranges, prevent
  overbooking, and derive property-based tests from requirements.
---

# Booking Availability Skill

When helping build any reservation or booking system, apply these rules.

## 1. Model stays as half-open date ranges `[checkIn, checkOut)`
Check-out is **exclusive**. A stay 2026-01-10 → 2026-01-12 occupies the nights of
the 10th and 11th (2 nights). This makes back-to-back bookings (one guest checks
out the morning another checks in) fall out for free: touching ranges do not
overlap.

```ts
function rangesOverlap(aIn, aOut, bIn, bOut) {
  return aStart < bEnd && bStart < aEnd; // strict: touching ≠ overlapping
}
```

## 2. Availability = peak concurrent occupancy, not total overlaps
To decide if a room type with N physical rooms can take another booking for a
range, compute the **maximum number of simultaneously occupied rooms** across
that range and compare to N. Counting total overlapping bookings over-counts
when bookings are nested or staggered.

## 3. Clamp availability to `[0, totalRooms]`
Never return negative availability; never exceed the physical room count. These
are two invariants worth asserting in tests.

## 4. Money in integer cents
Represent prices as integer cents and compute `total = nights * nightlyCents`.
Avoid floating-point dollars.

## 5. Separate validation from availability
- Static validation (bad dates, missing name, guests over capacity) → reject
  **before** touching availability; surface field-level errors; HTTP 400.
- Availability conflict (valid request, no room free) → HTTP 409.

## 6. Turn each requirement into a property
For every rule, write a property-based test (e.g. with `fast-check`) that states
the invariant and let the framework generate hundreds of cases:
- pricing: `total === nights * rate && total >= 0`
- bounds: `0 <= available <= totalRooms`
- no overbooking: `acceptedOverlapping <= totalRooms`
- disjoint ranges never consume each other's availability

See `references/property-testing.md` and `references/ears-requirements.md` for
copy-ready templates.
