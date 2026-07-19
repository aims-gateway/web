import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AIMS/i);
  });

  test('has navigation bar', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('has hero section with CTA', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('a[href*="marketplace"], a[href*="login"]');
    await expect(links.first()).toBeVisible();
  });

  test('footer is visible', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });
});

test.describe('Locale Switching', () => {
  test('default locale is English', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/en/);
  });

  test('can navigate to Chinese locale', async ({ page }) => {
    await page.goto('/zh');
    await expect(page).toHaveURL(/\/zh/);
    await expect(page.locator('nav')).toBeVisible();
  });

  test('can navigate to Japanese locale', async ({ page }) => {
    await page.goto('/ja');
    await expect(page).toHaveURL(/\/ja/);
    await expect(page.locator('nav')).toBeVisible();
  });
});
