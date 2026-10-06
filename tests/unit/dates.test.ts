import { describe, it, expect } from 'vitest';
import {
  isValidDateString,
  nightsBetween,
  rangesOverlap,
  parseDate,
  formatDate,
} from '../../src/domain/dates.js';

describe('isValidDateString', () => {
  it('accepts well-formed dates', () => {
    expect(isValidDateString('2026-01-15')).toBe(true);
    expect(isValidDateString('2026-12-31')).toBe(true);
  });

  it('rejects malformed or impossible dates', () => {
    expect(isValidDateString('2026-13-01')).toBe(false);
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('2026-1-5')).toBe(false);
    expect(isValidDateString('not-a-date')).toBe(false);
    expect(isValidDateString('')).toBe(false);
  });
});

describe('nightsBetween', () => {
  it('counts nights for a standard stay', () => {
    expect(nightsBetween('2026-01-10', '2026-01-12')).toBe(2);
  });

  it('is zero for same-day', () => {
    expect(nightsBetween('2026-01-10', '2026-01-10')).toBe(0);
  });

  it('is negative when reversed', () => {
    expect(nightsBetween('2026-01-12', '2026-01-10')).toBe(-2);
  });
});

describe('rangesOverlap', () => {
  it('detects overlapping stays', () => {
    expect(rangesOverlap('2026-01-10', '2026-01-15', '2026-01-12', '2026-01-18')).toBe(true);
  });

  it('treats touching ranges as non-overlapping', () => {
    expect(rangesOverlap('2026-01-10', '2026-01-12', '2026-01-12', '2026-01-14')).toBe(false);
  });

  it('detects disjoint ranges', () => {
    expect(rangesOverlap('2026-01-10', '2026-01-12', '2026-01-20', '2026-01-22')).toBe(false);
  });
});

describe('parseDate/formatDate round trip', () => {
  it('round-trips a date', () => {
    expect(formatDate(parseDate('2026-07-04'))).toBe('2026-07-04');
  });
});
