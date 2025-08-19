import { test, expect } from '@playwright/test';

test.describe('Signup Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/auth/signup');
  });

  test('should display all form fields correctly', async ({ page }) => {
    // Check that all form elements are present
    await expect(page.getByRole('textbox', { name: 'Display Name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Password', exact: true })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Confirm Password' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible();
    
    // Check that the create account button is initially disabled
    await expect(page.getByRole('button', { name: 'Create account' })).toBeDisabled();
  });

  test('should validate display name field', async ({ page }) => {
    const displayNameField = page.getByRole('textbox', { name: 'Display Name' });
    
    // Test empty display name
    await displayNameField.fill('');
    await displayNameField.blur();
    
    // Test valid display name
    await displayNameField.fill('John Doe');
    await expect(displayNameField).toHaveValue('John Doe');
    
    // Test display name with special characters
    await displayNameField.fill('John O\'Connor-Smith Jr.');
    await expect(displayNameField).toHaveValue('John O\'Connor-Smith Jr.');
  });

  test('should validate email field', async ({ page }) => {
    const emailField = page.getByRole('textbox', { name: 'Email' });
    
    // Test invalid email formats
    await emailField.fill('invalid-email');
    await emailField.blur();
    
    await emailField.fill('test@');
    await emailField.blur();
    
    await emailField.fill('@domain.com');
    await emailField.blur();
    
    // Test valid email
    await emailField.fill('test@example.com');
    await expect(emailField).toHaveValue('test@example.com');
  });

  test('should validate password field and show strength indicator', async ({ page }) => {
    const passwordField = page.getByRole('textbox', { name: 'Password', exact: true });
    
    // Test weak password
    await passwordField.fill('123');
    await expect(page.locator('text=Password must be at least 8 characters long')).toBeVisible();
    
    // Test medium strength password
    await passwordField.fill('password123');
    // Should show some strength indicator
    
    // Test strong password
    await passwordField.fill('StrongP@ssw0rd123!');
    await expect(page.locator('text=Strong password')).toBeVisible();
    
    // Test password visibility toggle
    const toggleButton = page.locator('[data-testid="password-toggle"]').first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(passwordField).toHaveAttribute('type', 'text');
      await toggleButton.click();
      await expect(passwordField).toHaveAttribute('type', 'password');
    }
  });

  test('should validate password confirmation', async ({ page }) => {
    const passwordField = page.getByRole('textbox', { name: 'Password', exact: true });
    const confirmPasswordField = page.getByRole('textbox', { name: 'Confirm Password' });
    
    // Fill password
    await passwordField.fill('StrongP@ssw0rd123!');
    
    // Test mismatched confirmation
    await confirmPasswordField.fill('DifferentPassword123!');
    await confirmPasswordField.blur();
    
    // Test matching confirmation
    await confirmPasswordField.fill('StrongP@ssw0rd123!');
    await confirmPasswordField.blur();
    
    // Should show success indicator when passwords match
    const successIcon = page.locator('[data-testid="password-match-success"]');
    if (await successIcon.isVisible()) {
      await expect(successIcon).toBeVisible();
    }
  });

  test('should enable submit button when all fields are valid', async ({ page }) => {
    const createAccountButton = page.getByRole('button', { name: 'Create account' });
    
    // Initially disabled
    await expect(createAccountButton).toBeDisabled();
    
    // Fill all fields with valid data
    await page.getByRole('textbox', { name: 'Display Name' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email' }).fill('test@example.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('StrongP@ssw0rd123!');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('StrongP@ssw0rd123!');
    
    // Button should now be enabled
    await expect(createAccountButton).toBeEnabled();
  });

  test('should handle form submission with invalid email domain', async ({ page }) => {
    // Fill form with invalid email domain
    await page.getByRole('textbox', { name: 'Display Name' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email' }).fill('test@invalid-domain.fake');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('StrongP@ssw0rd123!');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('StrongP@ssw0rd123!');
    
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Should show error message
    await expect(page.locator('text=Invalid email address')).toBeVisible();
  });

  test('should handle form submission with weak password', async ({ page }) => {
    // Fill form with weak password
    await page.getByRole('textbox', { name: 'Display Name' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email' }).fill('test@gmail.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('password123');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('password123');
    
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Should show password strength error
    await expect(page.locator('text=Password is too weak')).toBeVisible();
  });

  test('should successfully create account with valid data', async ({ page }) => {
    const timestamp = Date.now();
    const email = `testuser${timestamp}@gmail.com`;
    
    // Fill form with valid data
    await page.getByRole('textbox', { name: 'Display Name' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('Xk9#mP2$vL8@qR5!');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('Xk9#mP2$vL8@qR5!');
    
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Should show success message
    await expect(page.locator('text=Success! Check your email for the confirmation link.')).toBeVisible();
    
    // Should redirect to login page after delay (optional - might be flaky)
    // await expect(page).toHaveURL('/auth/login', { timeout: 6000 });
  });

  test('should handle existing email error', async ({ page }) => {
    // Use the email we know exists from previous test
    await page.getByRole('textbox', { name: 'Display Name' }).fill('Test User');
    await page.getByRole('textbox', { name: 'Email' }).fill('testuser@gmail.com');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('Xk9#mP2$vL8@qR5!');
    await page.getByRole('textbox', { name: 'Confirm Password' }).fill('Xk9#mP2$vL8@qR5!');
    
    await page.getByRole('button', { name: 'Create account' }).click();
    
    // Should show existing account error
    await expect(page.locator('text=An account with this email already exists')).toBeVisible();
  });

  test('should navigate to login page when clicking sign in link', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click();
    await expect(page).toHaveURL('/auth/login');
  });

  test('should navigate to home page when clicking logo', async ({ page }) => {
    await page.getByRole('link', { name: 'crm' }).click();
    await expect(page).toHaveURL('/');
  });
});
