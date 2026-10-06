/**
 * Pure, dependency-free date helpers for calendar dates (YYYY-MM-DD).
 *
 * All functions operate on UTC to avoid timezone drift. These are deliberately
 * small and total so they are easy to reason about in property-based tests.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Returns true if `s` is a syntactically valid YYYY-MM-DD calendar date. */
export function isValidDateString(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  // Reject overflow dates like 2026-02-30 (JS would roll them over).
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Parses a YYYY-MM-DD string to a UTC Date at midnight. Throws if invalid. */
export function parseDate(s: string): Date {
  if (!isValidDateString(s)) {
    throw new Error(`Invalid date string: ${s}`);
  }
  const [y, m, d] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Formats a UTC Date as YYYY-MM-DD. */
export function formatDate(dt: Date): string {
  const y = dt.getUTCFullYear().toString().padStart(4, '0');
  const m = (dt.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = dt.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Number of nights between two calendar dates. Positive when checkOut is after
 * checkIn, zero or negative otherwise. Pure integer arithmetic on UTC days.
 */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseDate(checkIn).getTime();
  const b = parseDate(checkOut).getTime();
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * Returns true when two half-open date ranges [aIn, aOut) and [bIn, bOut)
 * overlap on at least one night. Touching ranges (one checks out the day the
 * other checks in) do NOT overlap.
 */
export function rangesOverlap(
  aIn: string,
  aOut: string,
  bIn: string,
  bOut: string
): boolean {
  const aStart = parseDate(aIn).getTime();
  const aEnd = parseDate(aOut).getTime();
  const bStart = parseDate(bIn).getTime();
  const bEnd = parseDate(bOut).getTime();
  return aStart < bEnd && bStart < aEnd;
}
