import { test, expect } from '@playwright/test';

test.describe('Vehicle Module (Đăng ký xe)', () => {
  
  test('CAR_03: Normal user sees vehicle bookings', async ({ page }) => {
    // Login as Normal user
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'daodaiphong');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000');

    // Go to Vehicles page
    await page.goto('http://localhost:3000/xe');
    
    // Check page title
    await expect(page.locator('h1:has-text("Hệ thống Đăng ký Xe")')).toBeVisible();
    
    // Admin should see "Đăng ký xe mới" button
    await expect(page.locator('text=Đăng ký xe mới').first()).toBeVisible();
  });
});
