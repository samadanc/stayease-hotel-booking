import { test, expect } from '@playwright/test';

/**
 * End-to-end tests for the StayEase booking flow.
 *
 * These tests exercise the same browser interactions that were first explored
 * interactively using the Playwright MCP server (see docs/MCP.md). Running them
 * here as a committed suite makes the MCP-driven exploration reproducible in CI.
 */

function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

test('search returns available rooms', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.brand')).toHaveText(/StayEase/);

  await page.fill('#checkIn', futureDate(10));
  await page.fill('#checkOut', futureDate(12));
  await page.fill('#guests', '2');
  await page.click('#search-btn');

  await expect(page.locator('[data-test="room-card"]').first()).toBeVisible();
});

test('a guest can complete a booking', async ({ page }) => {
  await page.goto('/');

  await page.fill('#checkIn', futureDate(20));
  await page.fill('#checkOut', futureDate(23));
  await page.fill('#guests', '2');
  await page.click('#search-btn');

  await page.locator('[data-test="book-btn"]').first().click();
  await expect(page.locator('#booking-modal')).toBeVisible();

  await page.fill('#guestName', 'Ada Lovelace');
  await page.fill('#guestEmail', 'ada@example.com');
  await page.click('#confirm-btn');

  await expect(page.locator('#confirmation')).toBeVisible();
  await expect(page.locator('#confirmation-detail')).toContainText(/Confirmation/);
});

test('invalid date range shows an error', async ({ page }) => {
  await page.goto('/');

  await page.fill('#checkIn', futureDate(12));
  await page.fill('#checkOut', futureDate(10));
  await page.click('#search-btn');

  await expect(page.locator('#search-error')).toBeVisible();
});
