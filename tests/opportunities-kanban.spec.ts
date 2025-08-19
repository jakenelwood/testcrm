import { test, expect } from '@playwright/test';

// This test verifies the Opportunities Kanban loads without @hello-pangea/dnd setup errors
// and that droppable columns render correctly.
test.describe('Opportunities Kanban Board', () => {
  test('loads without drag-handle invariant errors and shows droppable columns', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/dashboard/opportunities');

    // Wait for the page-level heading first (renders earlier / more stable)
    await expect(page.getByRole('heading', { name: 'Opportunities' })).toBeVisible();

    // Then assert pipeline heading via stable test id
    await expect(page.getByTestId('opportunity-pipeline-heading')).toBeVisible();

    // Columns should be present (Droppable containers)
    const droppables = page.locator('[data-rbd-droppable-id]');
    await expect(droppables.first()).toBeVisible();

    // Give time for any lazy effects to mount
    await page.waitForTimeout(500);

    // Ensure we did not log the Pangea invariant error
    const dndSetupErrors = consoleErrors.filter((t) => t.includes('Unable to find drag handle'));
    if (dndSetupErrors.length > 0) {
      console.error('Pangea DnD setup errors:', dndSetupErrors);
    }
    expect(dndSetupErrors, 'No "Unable to find drag handle" errors should occur').toHaveLength(0);
  });
});

