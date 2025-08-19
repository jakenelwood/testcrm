import { test, expect } from '@playwright/test';

/**
 * OpportunityDetailsModal Test Suite
 * Tests the restored opportunity details modal functionality
 * including hydration safety, form interactions, and data persistence
 */

test.describe('OpportunityDetailsModal', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console for hydration errors
    page.on('console', (msg) => {
      if (msg.type() === 'error' && (msg.text().includes('hydration') || msg.text().includes('mismatch'))) {
        console.error('🚨 HYDRATION ERROR DETECTED:', msg.text());
        throw new Error(`Hydration error detected: ${msg.text()}`);
      }
    });

    // Monitor for React hydration warnings
    page.on('pageerror', (error) => {
      if (error.message.includes('hydration') || error.message.includes('mismatch')) {
        console.error('🚨 HYDRATION PAGE ERROR:', error.message);
        throw new Error(`Hydration error detected: ${error.message}`);
      }
    });
  });

  test('Modal opens from kanban board without hydration issues', async ({ page }) => {
    // Navigate to opportunities page
    await page.goto('/dashboard/pipelines');
    await page.waitForLoadState('networkidle');

    // Ensure we're in kanban view
    const kanbanToggle = page.locator('[aria-label="Toggle Kanban view"]');
    if (await kanbanToggle.count() > 0) {
      await kanbanToggle.click();
      await page.waitForTimeout(500);
    }

    // Look for opportunity cards in the kanban board
    const opportunityCards = page.locator('[data-testid="opportunity-card"], .opportunity-card, [class*="opportunity"], [class*="card"]').first();
    
    if (await opportunityCards.count() > 0) {
      // Click on the first opportunity card
      await opportunityCards.click();
      
      // Wait for modal to appear
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Verify modal is open and contains expected content
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Check for modal title
      const modalTitle = modal.locator('h2, [data-testid="modal-title"]').first();
      await expect(modalTitle).toBeVisible();
      
      // Verify tabs are present
      const tabs = modal.locator('[role="tablist"], [data-testid="modal-tabs"]');
      if (await tabs.count() > 0) {
        await expect(tabs).toBeVisible();
      }
      
      // Close modal
      const closeButton = modal.locator('button[aria-label="Close"], [data-testid="close-modal"]').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
      } else {
        // Try pressing Escape
        await page.keyboard.press('Escape');
      }
      
      // Verify modal is closed
      await expect(modal).not.toBeVisible();
    } else {
      console.log('No opportunity cards found in kanban view - this may be expected if no data exists');
    }
  });

  test('Modal opens from list view without hydration issues', async ({ page }) => {
    // Navigate to opportunities page
    await page.goto('/dashboard/pipelines');
    await page.waitForLoadState('networkidle');

    // Switch to list view
    const listToggle = page.locator('[aria-label="Toggle List view"]');
    if (await listToggle.count() > 0) {
      await listToggle.click();
      await page.waitForTimeout(500);
    }

    // Look for opportunity rows in the table
    const opportunityRows = page.locator('table tbody tr, [data-testid="opportunity-row"]');
    
    if (await opportunityRows.count() > 0) {
      // Click on the first opportunity row
      await opportunityRows.first().click();
      
      // Wait for modal to appear
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Verify modal is open
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    } else {
      console.log('No opportunity rows found in list view - this may be expected if no data exists');
    }
  });

  test('Modal form fields render correctly without hydration mismatches', async ({ page }) => {
    await page.goto('/dashboard/pipelines');
    await page.waitForLoadState('networkidle');

    // Try to open any opportunity modal
    const opportunityElement = page.locator('[data-testid="opportunity-card"], table tbody tr, .opportunity-card, [class*="opportunity"]').first();
    
    if (await opportunityElement.count() > 0) {
      await opportunityElement.click();
      
      // Wait for modal and form to load
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      const modal = page.locator('[role="dialog"]');
      
      // Check for form fields without hydration issues
      const formFields = modal.locator('input, select, textarea');
      const fieldCount = await formFields.count();
      
      if (fieldCount > 0) {
        // Verify form fields are properly hydrated
        for (let i = 0; i < Math.min(fieldCount, 10); i++) {
          const field = formFields.nth(i);
          await expect(field).toBeVisible();
          
          // Check that field values are consistent (no hydration mismatch)
          const fieldValue = await field.inputValue();
          const fieldDefaultValue = await field.getAttribute('defaultValue');
          
          // If there's a default value, it should match the current value (unless user input)
          if (fieldDefaultValue !== null && !await field.getAttribute('data-user-input')) {
            expect(fieldValue).toBe(fieldDefaultValue);
          }
        }
      }
      
      // Close modal
      await page.keyboard.press('Escape');
    }
  });

  test('Modal tabs function correctly', async ({ page }) => {
    await page.goto('/dashboard/pipelines');
    await page.waitForLoadState('networkidle');

    const opportunityElement = page.locator('[data-testid="opportunity-card"], table tbody tr, .opportunity-card, [class*="opportunity"]').first();
    
    if (await opportunityElement.count() > 0) {
      await opportunityElement.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const modal = page.locator('[role="dialog"]');
      const tabs = modal.locator('[role="tab"], [data-testid="tab"]');
      const tabCount = await tabs.count();
      
      if (tabCount > 1) {
        // Test switching between tabs
        for (let i = 0; i < Math.min(tabCount, 4); i++) {
          const tab = tabs.nth(i);
          await tab.click();
          await page.waitForTimeout(300);
          
          // Verify tab is active
          const isActive = await tab.getAttribute('aria-selected') === 'true' || 
                          await tab.getAttribute('data-state') === 'active' ||
                          (await tab.getAttribute('class') || '').includes('active');
          
          expect(isActive).toBe(true);
        }
      }
      
      await page.keyboard.press('Escape');
    }
  });

  test('Modal edit functionality works without hydration issues', async ({ page }) => {
    await page.goto('/dashboard/pipelines');
    await page.waitForLoadState('networkidle');

    const opportunityElement = page.locator('[data-testid="opportunity-card"], table tbody tr, .opportunity-card, [class*="opportunity"]').first();
    
    if (await opportunityElement.count() > 0) {
      await opportunityElement.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const modal = page.locator('[role="dialog"]');
      
      // Look for edit button
      const editButton = modal.locator('button:has-text("Edit"), [data-testid="edit-button"]');
      
      if (await editButton.count() > 0) {
        await editButton.click();
        await page.waitForTimeout(500);
        
        // Verify form fields are now editable
        const editableFields = modal.locator('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
        const editableCount = await editableFields.count();
        
        if (editableCount > 0) {
          // Test editing a field
          const firstField = editableFields.first();
          const fieldType = await firstField.getAttribute('type');
          
          if (fieldType === 'text' || fieldType === 'email' || !fieldType) {
            await firstField.fill('Test Value');
            const newValue = await firstField.inputValue();
            expect(newValue).toBe('Test Value');
          }
        }
        
        // Look for cancel button to exit edit mode
        const cancelButton = modal.locator('button:has-text("Cancel"), [data-testid="cancel-button"]');
        if (await cancelButton.count() > 0) {
          await cancelButton.click();
        }
      }
      
      await page.keyboard.press('Escape');
    }
  });

  test('Modal navigation to detail page works', async ({ page }) => {
    await page.goto('/dashboard/pipelines');
    await page.waitForLoadState('networkidle');

    const opportunityElement = page.locator('[data-testid="opportunity-card"], table tbody tr, .opportunity-card, [class*="opportunity"]').first();
    
    if (await opportunityElement.count() > 0) {
      await opportunityElement.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const modal = page.locator('[role="dialog"]');
      
      // Look for link to detail page
      const detailLink = modal.locator('a[href*="/opportunities/"], [data-testid="view-details-link"]');
      
      if (await detailLink.count() > 0) {
        // Get the href before clicking
        const href = await detailLink.getAttribute('href');
        
        await detailLink.click();
        
        // Wait for navigation
        await page.waitForLoadState('networkidle');
        
        // Verify we're on the detail page
        if (href) {
          expect(page.url()).toContain('/opportunities/');
        }
        
        // Verify detail page loads without hydration errors
        await page.waitForTimeout(1000);
        
        // Go back to test modal again
        await page.goBack();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('Modal handles missing data gracefully', async ({ page }) => {
    await page.goto('/dashboard/pipelines');
    await page.waitForLoadState('networkidle');

    // This test ensures the modal doesn't break with incomplete data
    const opportunityElement = page.locator('[data-testid="opportunity-card"], table tbody tr, .opportunity-card, [class*="opportunity"]').first();
    
    if (await opportunityElement.count() > 0) {
      await opportunityElement.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const modal = page.locator('[role="dialog"]');
      
      // Verify modal displays even with potentially missing data
      await expect(modal).toBeVisible();
      
      // Check that empty fields are handled gracefully
      const emptyStateElements = modal.locator(':has-text("Not provided"), :has-text("Not specified"), :has-text("-"), :has-text("N/A")');
      const emptyStateCount = await emptyStateElements.count();
      
      // It's okay to have empty states - just verify they don't cause errors
      console.log(`Found ${emptyStateCount} empty state indicators - this is normal for incomplete data`);
      
      await page.keyboard.press('Escape');
    }
  });

  test('Modal phone and SMS buttons work (if present)', async ({ page }) => {
    await page.goto('/dashboard/pipelines');
    await page.waitForLoadState('networkidle');

    const opportunityElement = page.locator('[data-testid="opportunity-card"], table tbody tr, .opportunity-card, [class*="opportunity"]').first();
    
    if (await opportunityElement.count() > 0) {
      await opportunityElement.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const modal = page.locator('[role="dialog"]');
      
      // Look for phone and SMS buttons
      const phoneButton = modal.locator('button[aria-label*="phone"], button[aria-label*="call"], [data-testid="phone-button"]');
      const smsButton = modal.locator('button[aria-label*="sms"], button[aria-label*="message"], [data-testid="sms-button"]');
      
      if (await phoneButton.count() > 0) {
        // Just verify the button is clickable (don't actually make a call)
        await expect(phoneButton.first()).toBeVisible();
        await expect(phoneButton.first()).toBeEnabled();
      }
      
      if (await smsButton.count() > 0) {
        // Just verify the button is clickable (don't actually send SMS)
        await expect(smsButton.first()).toBeVisible();
        await expect(smsButton.first()).toBeEnabled();
      }
      
      await page.keyboard.press('Escape');
    }
  });
});

test.describe('OpportunityDetailsModal Performance', () => {
  test('Modal opens quickly without performance issues', async ({ page }) => {
    await page.goto('/dashboard/pipelines');
    await page.waitForLoadState('networkidle');

    const opportunityElement = page.locator('[data-testid="opportunity-card"], table tbody tr, .opportunity-card, [class*="opportunity"]').first();
    
    if (await opportunityElement.count() > 0) {
      const startTime = Date.now();
      
      await opportunityElement.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      const openTime = Date.now() - startTime;
      
      // Modal should open within 2 seconds
      expect(openTime).toBeLessThan(2000);
      
      console.log(`Modal open time: ${openTime}ms`);
      
      await page.keyboard.press('Escape');
    }
  });
});
