---
inclusion: always
---

# Product — StayEase

StayEase is a hotel booking web application. A guest searches rooms by date
range and party size, sees live availability and total price, and books a room.
The product's defining rule is **correctness of availability**: the system must
never confirm more bookings than there are physical rooms for any night.

## Priorities (in order)
1. **Never overbook.** Availability and booking logic must be provably correct.
   When in doubt, reject a booking rather than risk a double-book.
2. **Clear, field-level feedback.** Validation errors always name the offending
   field and explain how to fix it.
3. **Zero-setup runnability.** The app must run with `npm install && npm run
   serve` and no external services, so reviewers can try it instantly.

## Scope guidance
- Keep booking rules in the pure domain layer (`src/domain/`), not in routes or
  the frontend.
- Prefer extending the existing in-memory store over introducing a database
  unless a task explicitly calls for persistence.
- Money is always represented in integer **cents**, never floating-point
  dollars.
