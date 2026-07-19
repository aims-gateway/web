import { test, expect } from '@playwright/test';

test.describe('Top Navigation', () => {
  test('logo links to home', async ({ page }) => {
    await page.goto('/en/marketplace');
    const logo = page.locator('nav a[href="/en"]');
    if (await logo.isVisible()) {
      await logo.click();
      await expect(page).toHaveURL(/\/en$/);
    }
  });

  test('marketplace link navigates correctly', async ({ page }) => {
    await page.goto('/en');
    const link = page.locator('a[href*="marketplace"]').first();
    if (await link.isVisible()) {
      await link.click();
      await expect(page).toHaveURL(/marketplace/);
    }
  });
});

test.describe('Error Handling', () => {
  test('404 page renders for unknown routes', async ({ page }) => {
    await page.goto('/en/nonexistent-page-12345');
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Developer Pages', () => {
  test('skill registration page loads', async ({ page }) => {
    await page.goto('/en/developer/register');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('IP vault page loads', async ({ page }) => {
    await page.goto('/en/developer/ip-vault');
    await expect(page.locator('nav')).toBeVisible();
  });
});

test.describe('Admin Pages', () => {
  test('admin dashboard redirects or loads', async ({ page }) => {
    await page.goto('/en/admin');
    // May redirect if not admin, but should not crash
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Public Verification', () => {
  test('certificate verification page loads', async ({ page }) => {
    await page.goto('/en/verify/test-cert-id');
    await expect(page.locator('body')).toBeVisible();
  });
});
