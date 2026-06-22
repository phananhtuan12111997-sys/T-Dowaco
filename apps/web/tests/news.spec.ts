import { test, expect } from '@playwright/test';

test.describe('News Module (Bảng Tin)', () => {
  
  test('NEWS_01: Normal user only has read access', async ({ page }) => {
    // Login as normal user (not HR or IT)
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'test2');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000');

    // Go to News page (this is also the home page, but let's be explicit)
    await page.goto('http://localhost:3000/bang-tin');
    
    // Normal user should not see "Đăng tin mới" (Create News) button
    await expect(page.locator('text=Đăng tin mới')).not.toBeVisible();

    // They should see the news feed
    await expect(page.locator('h1:has-text("Bản tin công ty")')).toBeVisible();
  });

  test('NEWS_02: Admin can see create news button', async ({ page }) => {
    // Login as Admin
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin@tdowaco.vn');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000');

    await page.goto('http://localhost:3000/bang-tin');
    
    // Admin should see "Đăng tin mới" (Upload) button
    await expect(page.locator('text=Đăng tin mới').first()).toBeVisible();
    
    // Check if the page title is correct
    await expect(page.locator('h1:has-text("Bản tin công ty")')).toBeVisible();
  });
});
