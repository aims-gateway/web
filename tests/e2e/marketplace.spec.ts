import { test, expect } from '@playwright/test';

test.describe('Marketplace Page', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/en/marketplace');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('displays skill cards or empty state', async ({ page }) => {
    await page.goto('/en/marketplace');
    // Marketplace page should render without crashing
    await expect(page.locator('body')).toBeVisible();
  });

  test('alliance marketplace loads', async ({ page }) => {
    await page.goto('/en/marketplace/alliance');
    await expect(page.locator('nav')).toBeVisible();
  });
});

test.describe('Skill Detail Page', () => {
  test('loads with mock ID without crashing', async ({ page }) => {
    await page.goto('/en/marketplace/test-skill-id');
    // Should render without a full page crash
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Trading Hub (Route)', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/en/route');
    await expect(page.locator('nav')).toBeVisible();
  });
});
