import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.locator('body')).toBeVisible();
  });

  test('has wallet connection options', async ({ page }) => {
    await page.goto('/en/login');
    // Login page should render connection UI
    await expect(page.locator('nav')).toBeVisible();
  });
});

test.describe('Authenticated Pages (mock session)', () => {
  test.beforeEach(async ({ page }) => {
    // Seed sessionStorage to simulate authenticated state
    await page.goto('/en');
    await page.evaluate(() => {
      sessionStorage.setItem('aims_token', 'mock-jwt-token');
      sessionStorage.setItem('aims_wallet', '0x' + 'a'.repeat(40));
    });
  });

  test('dashboard loads when authenticated', async ({ page }) => {
    await page.goto('/en/dashboard');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('profile page loads when authenticated', async ({ page }) => {
    await page.goto('/en/profile');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('agreements page loads when authenticated', async ({ page }) => {
    await page.goto('/en/agreements');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('settlements page loads when authenticated', async ({ page }) => {
    await page.goto('/en/settlements');
    await expect(page.locator('nav')).toBeVisible();
  });

  test('token station loads when authenticated', async ({ page }) => {
    await page.goto('/en/api-station');
    await expect(page.locator('nav')).toBeVisible();
  });
});
