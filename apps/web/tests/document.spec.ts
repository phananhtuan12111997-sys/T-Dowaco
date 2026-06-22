import { test, expect } from '@playwright/test';

test.describe('Document Module (Công Văn)', () => {
  
  test('DOC_03: Normal user sees documents', async ({ page }) => {
    // Login as Admin
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin@tdowaco.vn');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000');

    // Go to Documents page
    await page.goto('http://localhost:3000/cong-van');
    
    // It should redirect to /cong-van/den
    await page.waitForURL('http://localhost:3000/cong-van/den');

    // Check page title
    await expect(page.locator('h1:has-text("Danh sách Công văn đến")')).toBeVisible();
    
    // Admin should see "Soạn công văn mới" button
    await expect(page.locator('text=Soạn công văn mới').first()).toBeVisible();
  });
});
