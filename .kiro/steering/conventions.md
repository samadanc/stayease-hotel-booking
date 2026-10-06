---
inclusion: always
---

# Convention — Keep business rules pure and tested

Enforce that all booking and availability logic lives in pure functions under
`src/domain/`, **so that** every requirement can be verified by property-based
tests without mocking I/O, and the no-overbooking guarantee stays trustworthy as
the code grows.

## The standard
- Business decisions (validation, availability, pricing) MUST be pure functions:
  outputs depend only on arguments; no `Date.now()`, no `Math.random()`, no
  network, no mutation of inputs.
- Non-deterministic effects (generating a booking `id`, stamping `createdAt`)
  live in `src/store.ts`, never in `src/domain/`.
- Every new domain rule MUST ship with at least one property in
  `tests/property/` expressing the invariant it guarantees.

## Why
Purity is what lets `fast-check` throw hundreds of random inputs at the rules and
trust the result. The moment a hidden clock or random value leaks into the
domain, the properties stop being reproducible and the overbooking guarantee
(Requirement R8) becomes unverifiable.

## Example

Avoid — a hidden clock inside a domain function makes it untestable:

```ts
// ❌ in src/domain/booking.ts
export function isCheckInToday(checkIn: string): boolean {
  return checkIn === new Date().toISOString().slice(0, 10); // reads the clock
}
```

Prefer — pass the clock in, keeping the function pure:

```ts
// ✅ in src/domain/booking.ts
export function isCheckInOn(checkIn: string, today: string): boolean {
  return checkIn === today; // deterministic: same inputs → same output
}
```

Passing `today` as a parameter ensures the rule is deterministic, which keeps
the property-based tests valid and the booking rules trustworthy.
