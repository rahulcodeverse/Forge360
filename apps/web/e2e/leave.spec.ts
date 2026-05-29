import { test, expect } from '@playwright/test';

test.describe('Leave Management', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/en-US/login');
    await page.getByLabel('Email address').fill('rahul.sharma@acme.com');
    await page.getByLabel('Password').fill('Employee@123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard');
  });

  test('shows leave balance on dashboard', async ({ page }) => {
    await expect(page.getByText('Leave Balance')).toBeVisible();
  });

  test('navigates to leave page', async ({ page }) => {
    await page.click('a[href*="/leave"]');
    await page.waitForURL('**/leave');
    await expect(page.getByText('Leave Management')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Apply leave' })).toBeVisible();
  });

  test('can open apply leave dialog', async ({ page }) => {
    await page.goto('/en-US/leave');
    await page.getByRole('button', { name: /apply leave/i }).click();
    await expect(page.getByText('Apply for Leave')).toBeVisible();
    await expect(page.getByLabel('Leave Type')).toBeVisible();
  });
});
