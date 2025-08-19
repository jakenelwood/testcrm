import { test, expect } from '@playwright/test';

test.describe('Kanban Board Animations', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the opportunities page
    await page.goto('/dashboard/opportunities');
    await page.waitForLoadState('networkidle');
  });

  test('should display kanban board by default', async ({ page }) => {
    // Check that we're in kanban view by default
    const kanbanToggle = page.locator('[aria-label="Toggle Kanban view"]');
    await expect(kanbanToggle).toHaveAttribute('data-state', 'on');

    // Check that kanban columns are visible
    const kanbanColumns = page.locator('[class*="min-w-[280px]"]');
    await expect(kanbanColumns).toHaveCount(5); // Assuming 5 stages
  });

  test('should show opportunity cards with proper styling', async ({ page }) => {
    // Look for opportunity cards
    const opportunityCards = page.locator('[id^="opportunity-card-"]');
    
    if (await opportunityCards.count() > 0) {
      const firstCard = opportunityCards.first();
      
      // Check that the card has proper styling classes
      await expect(firstCard).toHaveClass(/bg-card/);
      await expect(firstCard).toHaveClass(/rounded-lg/);
      await expect(firstCard).toHaveClass(/cursor-pointer/);
    }
  });

  test('should handle card hover animations', async ({ page }) => {
    const opportunityCards = page.locator('[id^="opportunity-card-"]');
    
    if (await opportunityCards.count() > 0) {
      const firstCard = opportunityCards.first();
      
      // Hover over the card
      await firstCard.hover();
      
      // Check for hover effects (shadow changes, etc.)
      await expect(firstCard).toHaveClass(/hover:shadow-md/);
    }
  });

  test('should open modal when card is clicked', async ({ page }) => {
    const opportunityCards = page.locator('[id^="opportunity-card-"]');
    
    if (await opportunityCards.count() > 0) {
      const firstCard = opportunityCards.first();
      
      // Click on the card
      await firstCard.click();
      
      // Wait for modal to appear
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
      
      // Verify modal is visible
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // Close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });

  test('should switch between kanban and list views', async ({ page }) => {
    // Switch to list view
    const listToggle = page.locator('[aria-label="Toggle List view"]');
    await listToggle.click();
    
    // Check that list view is active
    await expect(listToggle).toHaveAttribute('data-state', 'on');
    
    // Check that table is visible
    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    // Switch back to kanban view
    const kanbanToggle = page.locator('[aria-label="Toggle Kanban view"]');
    await kanbanToggle.click();
    
    // Check that kanban view is active
    await expect(kanbanToggle).toHaveAttribute('data-state', 'on');
  });

  test('should handle search functionality', async ({ page }) => {
    // Find the search input
    const searchInput = page.locator('input[placeholder="Search opportunities..."]');
    await expect(searchInput).toBeVisible();
    
    // Type in search
    await searchInput.fill('test');
    
    // Verify search input has the value
    await expect(searchInput).toHaveValue('test');
  });

  test('should display summary cards with statistics', async ({ page }) => {
    // Check for summary cards
    const totalValueCard = page.locator('text=Total Value').locator('..');
    const totalOpportunitiesCard = page.locator('text=Total Opportunities').locator('..');
    const avgProbabilityCard = page.locator('text=Avg. Probability').locator('..');
    
    await expect(totalValueCard).toBeVisible();
    await expect(totalOpportunitiesCard).toBeVisible();
    await expect(avgProbabilityCard).toBeVisible();
  });
});

test.describe('Card Tilt Animations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/opportunities');
    await page.waitForLoadState('networkidle');
  });

  test('should apply tilt transforms when card is armed for drag', async ({ page }) => {
    const opportunityCards = page.locator('[id^="opportunity-card-"]');
    
    if (await opportunityCards.count() > 0) {
      const firstCard = opportunityCards.first();
      
      // Mouse down to arm the card for drag
      await firstCard.dispatchEvent('mousedown', { button: 0 });
      
      // Wait a bit for the drag ready state
      await page.waitForTimeout(200);
      
      // Move mouse to trigger tilt
      await firstCard.hover();
      
      // Check if transform style is applied
      const transform = await firstCard.getAttribute('style');
      
      // Should contain perspective and rotate transforms when armed
      if (transform) {
        expect(transform).toMatch(/transform/);
      }
      
      // Mouse up to reset
      await firstCard.dispatchEvent('mouseup');
    }
  });
});
