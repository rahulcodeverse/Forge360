import { test, expect } from '@playwright/test';

test.describe('Payroll', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en-US/login');
    await page.getByLabel('Email address').fill('rahul.sharma@acme.com');
    await page.getByLabel('Password').fill('Employee@123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard');
  });

  test('shows payslips page', async ({ page }) => {
    await page.goto('/en-US/payroll');
    await expect(page.getByText('Payroll')).toBeVisible();
    await expect(page.getByText('My Payslips')).toBeVisible();
  });
});
