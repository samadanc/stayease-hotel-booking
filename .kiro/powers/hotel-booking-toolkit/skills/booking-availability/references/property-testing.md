# Reference — Property-based tests for booking systems

Copy-ready `fast-check` properties. Adapt the generators to your schema.

## Generators

```ts
import fc from 'fast-check';

const dateArb = fc
  .date({ min: new Date(Date.UTC(2026, 0, 1)), max: new Date(Date.UTC(2027, 11, 31)) })
  .map(formatDate);

const stayArb = fc
  .tuple(dateArb, fc.integer({ min: 1, max: 30 }))
  .map(([checkIn, nights]) => ({ checkIn, checkOut: addNights(checkIn, nights), nights }));
```

## Invariants

```ts
// Pricing: total = nights * rate, non-negative
fc.assert(fc.property(roomArb, stayArb, (room, stay) => {
  const t = priceStay(room, stay.checkIn, stay.checkOut);
  expect(t).toBe(stay.nights * room.priceCents);
  expect(t).toBeGreaterThanOrEqual(0);
}));

// Availability always within [0, totalRooms]
fc.assert(fc.property(roomArb, stayArb, (room, stay) => {
  const a = roomsAvailable(room, bookings, stay.checkIn, stay.checkOut);
  expect(a).toBeGreaterThanOrEqual(0);
  expect(a).toBeLessThanOrEqual(room.totalRooms);
}));

// No overbooking: accepted overlapping bookings <= totalRooms
fc.assert(fc.property(roomArb, stayArb, fc.integer({ min: 1, max: 12 }), (room, stay, n) => {
  let accepted = 0;
  for (let i = 0; i < n; i++) if (book(room, stay).ok) accepted++;
  expect(accepted).toBeLessThanOrEqual(room.totalRooms);
}));
```

## Tips
- Use `fc.pre(condition)` to constrain generated inputs (e.g. only non-overlapping
  ranges) instead of filtering, so shrinking still works.
- When a property fails, `fast-check` prints a **shrunk** minimal counterexample —
  start debugging from that.
