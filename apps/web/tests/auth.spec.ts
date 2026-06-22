import { test, expect } from '@playwright/test';

test.describe('Authentication & Dashboard', () => {
  test('Admin can login successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Check if redirect to login was successful
    
    // Fill in credentials
    await page.fill('input[name="username"]', 'admin@tdowaco.vn');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');

    // Wait for navigation and verify dashboard is loaded
    await page.waitForURL('http://localhost:3000');
    await expect(page.locator('text=Bảng tin').first()).toBeVisible();
  });

  test('Normal user can login successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // Fill in credentials
    await page.fill('input[name="username"]', 'daodaiphong');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');

    // Wait for navigation and verify dashboard is loaded
    await page.waitForURL('http://localhost:3000');
    // We expect it to login successfully
    await expect(page.locator('text=Bảng tin').first()).toBeVisible();
  });
});
