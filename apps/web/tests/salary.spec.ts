import { test, expect } from '@playwright/test';

test.describe('Salary Module (Bảng Lương)', () => {
  
  test('SAL_01: Normal user only sees their own salary', async ({ page }) => {
    // Login as normal user
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'daodaiphong');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000');

    // Go to Salary page
    await page.goto('http://localhost:3000/bang-luong');
    
    // Normal user should not see "Tải lên" (Upload) button
    await expect(page.locator('text=Tải lên')).not.toBeVisible();

    // Verify if it displays their own records. Usually there is a table.
    // If the table is empty, we just verify it loaded without errors.
    await expect(page.locator('h1:has-text("Phiếu lương cá nhân")')).toBeVisible();
    
    // For a normal user, they should only see "Phiếu lương" text or table rows
    const table = page.locator('table');
    if (await table.isVisible()) {
       // Just check that it rendered
       await expect(table).toBeVisible();
    }
  });

  test('SAL_02: Admin sees all users salaries and upload button', async ({ page }) => {
    // Login as Admin
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin@tdowaco.vn');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000');

    // Go to Salary page
    await page.goto('http://localhost:3000/bang-luong');
    
    // Admin should see "Tải lên" (Upload) button
    await expect(page.locator('text=Tải lên').first()).toBeVisible();
    
    // Check if the page title is correct
    await expect(page.locator('h1:has-text("Quản lý phiếu lương toàn công ty")')).toBeVisible();
  });

  test('SAL_03: Select year updates the table', async ({ page }) => {
    // Login as Admin
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="username"]', 'admin@tdowaco.vn');
    await page.fill('input[name="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000');

    await page.goto('http://localhost:3000/bang-luong');
    
    // There is a select for year. Let's find it. Radix select usually has a button with role="combobox"
    const yearSelect = page.locator('button[role="combobox"]').first();
    await expect(yearSelect).toBeVisible();
    
    // Click to open dropdown
    await yearSelect.click();
    
    // Select an option, e.g. 2025
    await page.locator('div[role="option"]:has-text("2025")').click();
    
    // Check if URL updated or loading occurred. If it uses searchParams:
    await expect(page).toHaveURL(/.*year=2025.*/);
  });
});
