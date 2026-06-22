import { test, expect } from '@playwright/test';

test.describe('Meeting Module (Cuộc Họp)', () => {
  
  test('MEET_03: Admin can see all meetings', async ({ page }) => {
    // Login as Admin
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin@tdowaco.vn');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000');

    // Go to Meeting page
    await page.goto('http://localhost:3000/cuoc-hop');
    
    // Admin should see "Đăng ký lịch họp" button
    await expect(page.locator('text=Đăng ký lịch họp').first()).toBeVisible();
    
    // Check page title
    await expect(page.locator('h1:has-text("Lịch họp cơ quan")')).toBeVisible();
  });

  test('MEET_04: Normal user sees restricted view', async ({ page }) => {
    // Login as Normal user
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'test3');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000');

    await page.goto('http://localhost:3000/cuoc-hop');
    
    // Normal user should NOT see "Đăng ký lịch họp"
    await expect(page.locator('text=Đăng ký lịch họp')).not.toBeVisible();
    
    // Check page title
    await expect(page.locator('h1:has-text("Lịch họp cơ quan")')).toBeVisible();
  });
});
