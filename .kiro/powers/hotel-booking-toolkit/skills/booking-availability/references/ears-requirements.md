# Reference — EARS requirements for booking features

EARS (Easy Approach to Requirements Syntax) keeps each requirement atomic and
testable. Use these templates when writing a booking spec.

## Patterns
- **Ubiquitous:** `THE SYSTEM SHALL <behavior>.`
- **Event-driven:** `WHEN <trigger> THE SYSTEM SHALL <behavior>.`
- **State-driven:** `WHILE <state> THE SYSTEM SHALL <behavior>.`
- **Unwanted:** `IF <condition> THEN THE SYSTEM SHALL <behavior>.`
- **Optional:** `WHERE <feature included> THE SYSTEM SHALL <behavior>.`

## Reusable booking requirements

- WHEN a user searches with a date range and guest count, THE SYSTEM SHALL
  return only room types that fit the guests and have a room free for the whole
  range.
- IF check-out is not strictly after check-in, THEN THE SYSTEM SHALL reject the
  request with a `checkOut` error.
- IF a date is not a valid YYYY-MM-DD calendar date, THEN THE SYSTEM SHALL reject
  the request naming the offending field.
- WHILE any set of bookings is held, THE SYSTEM SHALL ensure accepted bookings
  overlapping any night never exceed the room type's physical room count.
- WHEN the system reports availability, THE SYSTEM SHALL return a value within
  [0, totalRooms].
- WHEN a booking succeeds, THE SYSTEM SHALL persist it with a unique id, derived
  nights, total price, and creation timestamp.

## Tip
Add a traceability table mapping each requirement to its implementation and the
test that verifies it. Property-based tests pair naturally with the WHILE/IF
requirements above.
