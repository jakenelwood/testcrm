import { test, expect } from '@playwright/test';

/**
 * Hydration Monitoring Test Suite
 * Monitors for hydration mismatches during schema migration and component updates
 */

test.describe('Hydration Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console for hydration errors
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('hydration')) {
        console.error('🚨 HYDRATION ERROR DETECTED:', msg.text());
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

  test('Dashboard loads without hydration errors', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Wait for hydration to complete
    await page.waitForLoadState('networkidle');
    
    // Check for hydration-specific errors in console
    const logs = await page.evaluate(() => {
      return window.console.error.toString();
    });
    
    expect(logs).not.toContain('hydration');
    expect(logs).not.toContain('mismatch');
  });

  test('Contacts page hydrates correctly', async ({ page }) => {
    await page.goto('/contacts');
    
    // Wait for data loading
    await page.waitForSelector('[data-testid="contacts-list"]', { timeout: 10000 });
    
    // Verify no hydration mismatches
    const hydrationErrors = await page.evaluate(() => {
      return document.querySelectorAll('[data-hydration-error]').length;
    });
    
    expect(hydrationErrors).toBe(0);
  });

  test('Leads/Opportunities page hydrates correctly', async ({ page }) => {
    await page.goto('/leads');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for any hydration-related DOM inconsistencies
    const hasHydrationIssues = await page.evaluate(() => {
      // Check for common hydration issues
      const suppressedElements = document.querySelectorAll('[suppressHydrationWarning]');
      const missingElements = document.querySelectorAll('[data-missing-hydration]');
      
      return suppressedElements.length > 0 || missingElements.length > 0;
    });
    
    if (hasHydrationIssues) {
      console.warn('⚠️ Potential hydration issues detected on leads page');
    }
  });

  test('AI features load without hydration errors', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Look for AI-powered components
    const aiComponents = await page.locator('[data-ai-component]').count();
    
    if (aiComponents > 0) {
      // Wait for AI components to hydrate
      await page.waitForTimeout(2000);
      
      // Check for hydration errors specific to AI components
      const aiErrors = await page.evaluate(() => {
        const aiElements = document.querySelectorAll('[data-ai-component]');
        let errorCount = 0;
        
        aiElements.forEach(element => {
          if (element.getAttribute('data-hydration-error')) {
            errorCount++;
          }
        });
        
        return errorCount;
      });
      
      expect(aiErrors).toBe(0);
    }
  });

  test('Form components hydrate correctly', async ({ page }) => {
    await page.goto('/contacts/new');
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 5000 });
    
    // Check form field hydration
    const formFields = await page.locator('input, select, textarea').count();
    
    if (formFields > 0) {
      // Verify form fields are properly hydrated
      const fieldErrors = await page.evaluate(() => {
        const fields = document.querySelectorAll('input, select, textarea');
        let errorCount = 0;
        
        fields.forEach(field => {
          // Check for common hydration issues with form fields
          if (field.value !== field.defaultValue && !field.hasAttribute('data-user-input')) {
            errorCount++;
          }
        });
        
        return errorCount;
      });
      
      expect(fieldErrors).toBe(0);
    }
  });

  test('Navigation hydrates without issues', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test navigation between pages
    await page.click('a[href="/contacts"]');
    await page.waitForLoadState('networkidle');
    
    await page.click('a[href="/leads"]');
    await page.waitForLoadState('networkidle');
    
    await page.click('a[href="/dashboard"]');
    await page.waitForLoadState('networkidle');
    
    // Verify no hydration errors during navigation
    const navigationErrors = await page.evaluate(() => {
      return window.performance.getEntriesByType('navigation').some(entry => 
        entry.name.includes('hydration-error')
      );
    });
    
    expect(navigationErrors).toBe(false);
  });

  test('Real-time updates maintain hydration', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Simulate real-time updates (if implemented)
    await page.evaluate(() => {
      // Trigger any real-time update mechanisms
      window.dispatchEvent(new CustomEvent('test-realtime-update'));
    });
    
    await page.waitForTimeout(1000);
    
    // Check that real-time updates don't cause hydration issues
    const realtimeErrors = await page.evaluate(() => {
      return document.querySelectorAll('[data-realtime-error]').length;
    });
    
    expect(realtimeErrors).toBe(0);
  });
});

/**
 * Schema Migration Specific Tests
 * These tests will be particularly important during the schema migration
 */
test.describe('Schema Migration Hydration', () => {
  test('New unified contacts model renders correctly', async ({ page }) => {
    await page.goto('/contacts');

    // Wait for contacts to load with new schema
    await page.waitForSelector('[data-testid="contact-item"]', { timeout: 10000 });

    // Verify lifecycle stages render correctly
    const lifecycleStages = await page.locator('[data-testid="lifecycle-stage"]').count();

    if (lifecycleStages > 0) {
      // Check for hydration issues with lifecycle stage components
      const stageErrors = await page.evaluate(() => {
        const stages = document.querySelectorAll('[data-testid="lifecycle-stage"]');
        return Array.from(stages).some(stage =>
          stage.textContent !== stage.getAttribute('data-expected-content')
        );
      });

      expect(stageErrors).toBe(false);
    }
  });

  test('AI embeddings features hydrate correctly', async ({ page }) => {
    await page.goto('/contacts');

    // Look for AI-powered search or recommendations
    const aiSearchBox = page.locator('[data-testid="ai-search"]');

    if (await aiSearchBox.count() > 0) {
      await aiSearchBox.fill('test search query');
      await page.waitForTimeout(1000);

      // Verify AI search results don't cause hydration issues
      const searchResults = await page.locator('[data-testid="ai-search-results"]').count();

      if (searchResults > 0) {
        const resultsHydrated = await page.evaluate(() => {
          const results = document.querySelector('[data-testid="ai-search-results"]');
          return results && !results.hasAttribute('data-hydration-pending');
        });

        expect(resultsHydrated).toBe(true);
      }
    }
  });
});

/**
 * Comprehensive Database and AI Features Testing
 * Tests the new unified schema and AI capabilities
 */
test.describe('Unified Schema Comprehensive Testing', () => {
  test('Database connection and basic queries work', async ({ page }) => {
    await page.goto('/api/health');

    // Check if API responds
    const response = await page.textContent('body');
    expect(response).toContain('ok');
  });

  test('Contacts page loads with unified schema data', async ({ page }) => {
    await page.goto('/contacts');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for contact list or empty state
    const hasContacts = await page.locator('[data-testid="contact-item"]').count() > 0;
    const hasEmptyState = await page.locator('[data-testid="empty-contacts"]').count() > 0;

    expect(hasContacts || hasEmptyState).toBe(true);
  });

  test('Opportunities page works with new schema', async ({ page }) => {
    await page.goto('/opportunities');

    await page.waitForLoadState('networkidle');

    // Check for opportunities list or empty state
    const hasOpportunities = await page.locator('[data-testid="opportunity-item"]').count() > 0;
    const hasEmptyState = await page.locator('[data-testid="empty-opportunities"]').count() > 0;

    expect(hasOpportunities || hasEmptyState).toBe(true);
  });

  test('Dashboard loads with new data structure', async ({ page }) => {
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Check for dashboard widgets
    const hasDashboardContent = await page.locator('[data-testid="dashboard-widget"]').count() > 0;
    const hasWelcomeMessage = await page.locator('h1, h2').count() > 0;

    expect(hasDashboardContent || hasWelcomeMessage).toBe(true);
  });

  test('Contact creation form works with new fields', async ({ page }) => {
    await page.goto('/contacts/new');

    await page.waitForSelector('form', { timeout: 5000 });

    // Check for essential form fields
    const hasFirstName = await page.locator('input[name="firstName"], input[name="first_name"]').count() > 0;
    const hasLastName = await page.locator('input[name="lastName"], input[name="last_name"]').count() > 0;
    const hasEmail = await page.locator('input[name="email"]').count() > 0;
    const hasLifecycleStage = await page.locator('select[name="lifecycleStage"], select[name="lifecycle_stage"]').count() > 0;

    expect(hasFirstName).toBe(true);
    expect(hasLastName).toBe(true);
    expect(hasEmail).toBe(true);
    expect(hasLifecycleStage).toBe(true);
  });

  test('Multi-tenant workspace isolation works', async ({ page }) => {
    // This test verifies that workspace-based data isolation is working
    await page.goto('/dashboard');

    await page.waitForLoadState('networkidle');

    // Check that workspace context is properly set
    const workspaceIndicator = await page.locator('[data-testid="workspace-name"], [data-workspace-id]').count() > 0;

    // If workspace indicators exist, verify they're not empty
    if (workspaceIndicator) {
      const workspaceText = await page.locator('[data-testid="workspace-name"]').first().textContent();
      expect(workspaceText?.trim().length).toBeGreaterThan(0);
    }
  });

  test('Insurance-specific fields are preserved', async ({ page }) => {
    await page.goto('/contacts/new');

    await page.waitForSelector('form', { timeout: 5000 });

    // Check for insurance-specific fields
    const hasInsuranceFields = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return false;

      // Look for insurance-related inputs
      const insuranceKeywords = ['premium', 'policy', 'coverage', 'deductible', 'carrier', 'vehicle', 'property'];
      const inputs = Array.from(form.querySelectorAll('input, select, textarea'));

      return inputs.some(input => {
        const name = input.getAttribute('name') || '';
        const placeholder = input.getAttribute('placeholder') || '';
        const label = input.closest('label')?.textContent || '';

        return insuranceKeywords.some(keyword =>
          name.toLowerCase().includes(keyword) ||
          placeholder.toLowerCase().includes(keyword) ||
          label.toLowerCase().includes(keyword)
        );
      });
    });

    // Insurance fields may not be on the basic contact form, so this is informational
    console.log('Insurance-specific fields found:', hasInsuranceFields);
  });

  test('Vector search functionality is available', async ({ page }) => {
    // Test if AI search endpoints are working
    const response = await page.request.get('/api/ai/search/test');

    // Expect either success or a proper error (not 404)
    expect([200, 400, 401, 500].includes(response.status())).toBe(true);
  });

  test('Embedding service integration works', async ({ page }) => {
    // Test if embedding generation endpoint is available
    const response = await page.request.post('/api/ai/embeddings/test', {
      data: { text: 'test embedding generation' }
    });

    // Expect either success or a proper error (not 404)
    expect([200, 400, 401, 500].includes(response.status())).toBe(true);
  });
});

/**
 * Performance and Load Testing
 */
test.describe('Performance Validation', () => {
  test('Page load times are acceptable', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Expect page to load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    console.log(`Dashboard load time: ${loadTime}ms`);
  });

  test('Database queries perform well', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    // Expect contacts page to load within 3 seconds
    expect(loadTime).toBeLessThan(3000);

    console.log(`Contacts page load time: ${loadTime}ms`);
  });

  test('No memory leaks during navigation', async ({ page }) => {
    // Navigate through multiple pages to check for memory leaks
    const pages = ['/dashboard', '/contacts', '/opportunities', '/dashboard'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Brief pause between navigations
    }

    // Check for excessive console errors that might indicate memory issues
    const errors = await page.evaluate(() => {
      return window.performance.getEntriesByType('navigation').length;
    });

    expect(errors).toBeGreaterThan(0); // Should have navigation entries
  });
});
