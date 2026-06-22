import { test, expect } from '@playwright/test';

test.describe('Task Module (Công Việc)', () => {
  
  test('TASK_01: User can see the task board', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin@tdowaco.vn');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000');

    // Go to Tasks page
    await page.goto('http://localhost:3000/cong-viec');
    
    // Check page title
    await expect(page.locator('h1:has-text("Công việc đã nhận")')).toBeVisible();
    
    // Should see "Giao việc mới" button
    await expect(page.locator('text=Giao việc mới').first()).toBeVisible();
  });
});
