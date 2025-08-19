import { test, expect } from '@playwright/test';

test.describe('Signup form UX', () => {
  test('enables submit when fields valid and shows inline messages', async ({ page }) => {
    await page.goto('/auth/signup');

    // Fill display name
    await page.getByLabel('Display Name').fill('Test User');

    // Invalid email shows inline error
    await page.getByLabel('Email').fill('invalid');
    await expect(page.getByText('Please enter a valid email address')).toBeVisible();

    // Fix email
    await page.getByLabel('Email').fill('test@example.com');
    await expect(page.getByText('Please enter a valid email address')).toHaveCount(0);

    // Passwords
    await page.getByLabel('Password').fill('password123');
    await page.getByLabel('Confirm Password').fill('password123');

    // Button should be enabled
    await expect(page.getByRole('button', { name: 'Create account' })).toBeEnabled();
  });
});

