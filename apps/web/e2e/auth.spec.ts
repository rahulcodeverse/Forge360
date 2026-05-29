import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/en-US/login');
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/en-US/login');
    await page.getByLabel('Email address').fill('bad@email.com');
    await page.getByLabel('Password').fill('wrongpass');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText(/invalid|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('redirects to dashboard on valid login', async ({ page }) => {
    // Demo credentials from seed data
    await page.goto('/en-US/login');
    await page.getByLabel('Email address').fill('rahul.sharma@acme.com');
    await page.getByLabel('Password').fill('Employee@123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page.getByText('Dashboard')).toBeVisible();
  });
});
