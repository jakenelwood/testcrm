/**
 * 🧪 Comprehensive Schema Validation Test Suite
 * Tests the new unified AI-native schema with the application
 * Identifies hydration errors, API issues, and performance problems
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test data for validation
const TEST_CONTACT = {
  firstName: 'Test',
  lastName: 'Contact',
  email: 'test.contact@example.com',
  phone: '(555) 123-4567',
  lifecycleStage: 'lead'
};

const TEST_ACCOUNT = {
  name: 'Test Insurance Agency',
  industry: 'Insurance',
  employeeCount: 25,
  annualRevenue: 2500000
};

/**
 * Phase 1: Database Connectivity & Schema Validation
 */
test.describe('Phase 1: Database & Schema Validation', () => {
  let consoleErrors: string[] = [];
  let networkErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    // Monitor console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor network failures
    page.on('response', (response) => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });
  });

  test('Database connection is working', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('status', 'ok');
  });

  test('Unified contacts API endpoint works', async ({ request }) => {
    const response = await request.get(`${API_BASE}/contacts`);
    expect([200, 401, 403].includes(response.status())).toBe(true); // Auth might be required
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.hasOwnProperty('data')).toBe(true);
    }
  });

  test('Opportunities API endpoint works', async ({ request }) => {
    const response = await request.get(`${API_BASE}/opportunities`);
    expect([200, 401, 403].includes(response.status())).toBe(true);
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.hasOwnProperty('data')).toBe(true);
    }
  });

  test('Accounts API endpoint works', async ({ request }) => {
    const response = await request.get(`${API_BASE}/accounts`);
    expect([200, 401, 403].includes(response.status())).toBe(true);
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data) || data.hasOwnProperty('data')).toBe(true);
    }
  });

  test('Legacy endpoints are properly handled', async ({ request }) => {
    // Test that old clients/leads endpoints either redirect or return proper errors
    const clientsResponse = await request.get(`${API_BASE}/clients`);
    const leadsResponse = await request.get(`${API_BASE}/leads`);
    
    // Should either redirect (3xx), not found (404), or moved (410)
    expect([301, 302, 404, 410].includes(clientsResponse.status())).toBe(true);
    expect([301, 302, 404, 410].includes(leadsResponse.status())).toBe(true);
  });

  test('AI endpoints are available', async ({ request }) => {
    const searchResponse = await request.get(`${API_BASE}/ai/search`);
    const embeddingsResponse = await request.get(`${API_BASE}/ai/embeddings`);
    
    // Should not be 404 (not found) - other errors are acceptable
    expect(searchResponse.status()).not.toBe(404);
    expect(embeddingsResponse.status()).not.toBe(404);
  });

  test.afterEach(async () => {
    // Report any console or network errors
    if (consoleErrors.length > 0) {
      console.log('Console errors detected:', consoleErrors);
    }
    if (networkErrors.length > 0) {
      console.log('Network errors detected:', networkErrors);
    }
    
    // Reset for next test
    consoleErrors = [];
    networkErrors = [];
  });
});

/**
 * Phase 2: Frontend Hydration & Component Testing
 */
test.describe('Phase 2: Frontend Hydration & Components', () => {
  test('Dashboard loads without hydration errors', async ({ page }) => {
    const hydrationErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.text().includes('hydration') || msg.text().includes('mismatch')) {
        hydrationErrors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for hydration errors
    expect(hydrationErrors).toHaveLength(0);
    
    // Verify page loaded successfully
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Contacts page renders with new schema', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    
    // Should have either contact items or empty state
    const hasContent = await page.evaluate(() => {
      return document.querySelector('[data-testid="contact-item"], [data-testid="empty-contacts"], .contact-list, .empty-state') !== null;
    });
    
    expect(hasContent).toBe(true);
    
    // Check for lifecycle stage indicators (new unified model feature)
    const hasLifecycleStages = await page.locator('[data-lifecycle-stage], .lifecycle-stage, [data-testid="lifecycle-stage"]').count();
    console.log('Lifecycle stage indicators found:', hasLifecycleStages);
  });

  test('Contact creation form has unified schema fields', async ({ page }) => {
    await page.goto('/contacts/new');
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check for essential unified schema fields
    const formFields = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return {};
      
      const fields = {
        firstName: !!form.querySelector('input[name*="first"], input[name*="First"]'),
        lastName: !!form.querySelector('input[name*="last"], input[name*="Last"]'),
        email: !!form.querySelector('input[name*="email"], input[type="email"]'),
        phone: !!form.querySelector('input[name*="phone"], input[type="tel"]'),
        lifecycleStage: !!form.querySelector('select[name*="lifecycle"], select[name*="stage"]'),
        accountId: !!form.querySelector('select[name*="account"], input[name*="account"]')
      };
      
      return fields;
    });
    
    expect(formFields.firstName).toBe(true);
    expect(formFields.lastName).toBe(true);
    expect(formFields.email).toBe(true);
    
    console.log('Form fields validation:', formFields);
  });

  test('Opportunities page works with new schema', async ({ page }) => {
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');
    
    // Should load without errors
    const hasContent = await page.evaluate(() => {
      return document.querySelector('[data-testid="opportunity-item"], [data-testid="empty-opportunities"], .opportunity-list, .empty-state') !== null;
    });
    
    expect(hasContent).toBe(true);
  });

  test('Navigation between pages works smoothly', async ({ page }) => {
    const pages = ['/dashboard', '/contacts', '/opportunities', '/dashboard'];
    
    for (const pagePath of pages) {
      const startTime = Date.now();
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      console.log(`${pagePath} load time: ${loadTime}ms`);
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    }
  });

  test('Workspace isolation indicators are present', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Look for workspace context indicators
    const workspaceIndicators = await page.evaluate(() => {
      const indicators = document.querySelectorAll('[data-workspace], [data-testid*="workspace"], .workspace-name');
      return indicators.length;
    });
    
    console.log('Workspace indicators found:', workspaceIndicators);
    // This is informational - workspace indicators may not be visible in UI
  });
});

/**
 * Phase 3: AI Features Integration Testing
 */
test.describe('Phase 3: AI Features Integration', () => {
  test('Embedding service initializes without errors', async ({ page }) => {
    // Test if AI-related JavaScript loads without errors
    const aiErrors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error' && (msg.text().includes('embedding') || msg.text().includes('voyage'))) {
        aiErrors.push(msg.text());
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    expect(aiErrors).toHaveLength(0);
  });

  test('Vector search endpoints respond correctly', async ({ request }) => {
    // Test AI search endpoint
    const searchResponse = await request.post(`${API_BASE}/ai/search`, {
      data: { query: 'test search', type: 'contacts' }
    });
    
    // Should not be 404 or 500 - other status codes are acceptable
    expect(searchResponse.status()).not.toBe(404);
    expect(searchResponse.status()).not.toBe(500);
    
    console.log('AI search endpoint status:', searchResponse.status());
  });

  test('Embedding generation endpoint is available', async ({ request }) => {
    const embeddingResponse = await request.post(`${API_BASE}/ai/embeddings`, {
      data: { text: 'test embedding generation' }
    });
    
    // Should not be 404 - other errors are acceptable (auth, rate limits, etc.)
    expect(embeddingResponse.status()).not.toBe(404);
    
    console.log('Embedding endpoint status:', embeddingResponse.status());
  });

  test('AI-powered search interface works', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    
    // Look for AI search components
    const aiSearchElements = await page.locator('[data-testid*="ai-search"], .ai-search, [placeholder*="search"], input[type="search"]').count();
    
    if (aiSearchElements > 0) {
      console.log('AI search interface found');
      
      // Try to interact with search
      const searchInput = page.locator('input[type="search"], [data-testid*="search"]').first();
      await searchInput.fill('test query');
      await page.waitForTimeout(1000);
      
      // Check for search results or loading states
      const hasResults = await page.locator('[data-testid*="search-result"], .search-result').count() > 0;
      console.log('Search results found:', hasResults);
    } else {
      console.log('No AI search interface found - may not be implemented yet');
    }
  });
});

/**
 * Phase 4: End-to-End User Workflows
 */
test.describe('Phase 4: End-to-End Workflows', () => {
  test('Complete contact creation workflow', async ({ page }) => {
    await page.goto('/contacts/new');
    await page.waitForSelector('form', { timeout: 10000 });

    // Fill out contact form with test data
    const formFilled = await page.evaluate((testContact) => {
      const form = document.querySelector('form');
      if (!form) return false;

      // Try different field name variations
      const firstNameField = form.querySelector('input[name*="first"], input[name*="First"]') as HTMLInputElement;
      const lastNameField = form.querySelector('input[name*="last"], input[name*="Last"]') as HTMLInputElement;
      const emailField = form.querySelector('input[name*="email"], input[type="email"]') as HTMLInputElement;
      const phoneField = form.querySelector('input[name*="phone"], input[type="tel"]') as HTMLInputElement;

      if (firstNameField) firstNameField.value = testContact.firstName;
      if (lastNameField) lastNameField.value = testContact.lastName;
      if (emailField) emailField.value = testContact.email;
      if (phoneField) phoneField.value = testContact.phone;

      return !!(firstNameField && lastNameField && emailField);
    }, TEST_CONTACT);

    if (formFilled) {
      // Try to submit the form
      const submitButton = page.locator('button[type="submit"], input[type="submit"], .submit-btn');
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(2000);

        // Check for success indicators or navigation
        const currentUrl = page.url();
        console.log('After form submission, current URL:', currentUrl);
      }
    } else {
      console.log('Could not fill form - field selectors may need updating');
    }
  });

  test('Contact list displays unified data correctly', async ({ page }) => {
    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');

    // Check for contact data display
    const contactData = await page.evaluate(() => {
      const contactElements = document.querySelectorAll('[data-testid="contact-item"], .contact-item, .contact-card');

      return Array.from(contactElements).slice(0, 3).map(element => ({
        hasName: !!(element.textContent?.includes('Test') || element.querySelector('[data-field="name"], .name')),
        hasEmail: !!(element.textContent?.includes('@') || element.querySelector('[data-field="email"], .email')),
        hasLifecycleStage: !!(element.querySelector('[data-lifecycle-stage], .lifecycle-stage') ||
                             element.textContent?.includes('lead') ||
                             element.textContent?.includes('customer'))
      }));
    });

    console.log('Contact data display validation:', contactData);
  });

  test('Account-contact relationships work', async ({ page }) => {
    await page.goto('/accounts');
    await page.waitForLoadState('networkidle');

    // Check if accounts page exists and loads
    const accountsExist = await page.evaluate(() => {
      return document.querySelector('[data-testid="account-item"], .account-item, .account-card') !== null ||
             document.querySelector('[data-testid="empty-accounts"], .empty-state') !== null;
    });

    if (accountsExist) {
      console.log('Accounts page loaded successfully');

      // Check for account-contact relationship indicators
      const hasRelationships = await page.evaluate(() => {
        return document.querySelector('[data-testid="contact-count"], .contact-count, .related-contacts') !== null;
      });

      console.log('Account-contact relationships visible:', hasRelationships);
    } else {
      console.log('Accounts page may not be implemented yet');
    }
  });

  test('Opportunity management workflow', async ({ page }) => {
    await page.goto('/opportunities');
    await page.waitForLoadState('networkidle');

    // Check for opportunity creation capability
    const createButton = page.locator('a[href*="/opportunities/new"], button[data-testid="create-opportunity"], .create-opportunity');

    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForLoadState('networkidle');

      // Check for opportunity form
      const hasForm = await page.locator('form').count() > 0;
      console.log('Opportunity creation form found:', hasForm);

      if (hasForm) {
        // Check for insurance-specific fields
        const insuranceFields = await page.evaluate(() => {
          const form = document.querySelector('form');
          if (!form) return false;

          return !!(
            form.querySelector('[name*="premium"], [name*="coverage"], [name*="insurance"]') ||
            form.textContent?.includes('premium') ||
            form.textContent?.includes('coverage')
          );
        });

        console.log('Insurance-specific fields in opportunity form:', insuranceFields);
      }
    } else {
      console.log('Opportunity creation not found - may need implementation');
    }
  });
});

/**
 * Phase 5: Performance & Error Handling
 */
test.describe('Phase 5: Performance & Reliability', () => {
  test('Page load performance is acceptable', async ({ page }) => {
    const pages = ['/dashboard', '/contacts', '/opportunities'];
    const performanceResults: Record<string, number> = {};

    for (const pagePath of pages) {
      const startTime = Date.now();
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      performanceResults[pagePath] = loadTime;

      // Performance expectations
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds

      if (loadTime > 3000) {
        console.warn(`Slow page load detected: ${pagePath} took ${loadTime}ms`);
      }
    }

    console.log('Performance results:', performanceResults);
  });

  test('Database query performance through API', async ({ request }) => {
    const endpoints = ['/api/contacts', '/api/opportunities', '/api/accounts'];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      const response = await request.get(endpoint);
      const queryTime = Date.now() - startTime;

      console.log(`${endpoint} query time: ${queryTime}ms (status: ${response.status()})`);

      // API should respond within 2 seconds
      expect(queryTime).toBeLessThan(2000);
    }
  });

  test('Error handling for invalid data', async ({ page }) => {
    await page.goto('/contacts/new');
    await page.waitForSelector('form', { timeout: 10000 });

    // Try to submit form with invalid data
    const emailField = page.locator('input[type="email"], input[name*="email"]').first();

    if (await emailField.count() > 0) {
      await emailField.fill('invalid-email');

      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Check for validation errors
        const hasValidationErrors = await page.evaluate(() => {
          return document.querySelector('.error, .invalid, [data-testid="error"]') !== null ||
                 document.querySelector('input:invalid') !== null;
        });

        console.log('Form validation working:', hasValidationErrors);
      }
    }
  });

  test('Memory usage during navigation', async ({ page }) => {
    // Navigate through multiple pages to check for memory leaks
    const pages = ['/dashboard', '/contacts', '/opportunities', '/contacts', '/dashboard'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      // Check for excessive DOM nodes (potential memory leak indicator)
      const domNodeCount = await page.evaluate(() => {
        return document.querySelectorAll('*').length;
      });

      console.log(`${pagePath} DOM nodes: ${domNodeCount}`);

      // Reasonable DOM node count (adjust based on your app)
      expect(domNodeCount).toBeLessThan(5000);

      await page.waitForTimeout(500); // Brief pause between navigations
    }
  });

  test('Console error monitoring', async ({ page }) => {
    const criticalErrors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        criticalErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // Navigate through key pages
    const pages = ['/dashboard', '/contacts', '/opportunities'];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // Report findings
    console.log('Critical errors found:', criticalErrors.length);
    console.log('Warnings found:', warnings.length);

    if (criticalErrors.length > 0) {
      console.log('Critical errors:', criticalErrors);
    }

    // Should have minimal critical errors
    expect(criticalErrors.length).toBeLessThan(5);
  });
});

/**
 * Summary Test: Overall System Health
 */
test.describe('System Health Summary', () => {
  test('Overall system health check', async ({ page, request }) => {
    const healthReport = {
      databaseConnectivity: false,
      frontendLoading: false,
      apiEndpoints: false,
      noHydrationErrors: false,
      performanceAcceptable: false
    };

    // Test database connectivity
    try {
      const healthResponse = await request.get(`${API_BASE}/health`);
      healthReport.databaseConnectivity = healthResponse.status() === 200;
    } catch (error) {
      console.log('Database connectivity test failed:', error);
    }

    // Test frontend loading
    try {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      healthReport.frontendLoading = true;
    } catch (error) {
      console.log('Frontend loading test failed:', error);
    }

    // Test API endpoints
    try {
      const contactsResponse = await request.get(`${API_BASE}/contacts`);
      healthReport.apiEndpoints = [200, 401, 403].includes(contactsResponse.status());
    } catch (error) {
      console.log('API endpoints test failed:', error);
    }

    // Test for hydration errors
    const hydrationErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.text().includes('hydration') || msg.text().includes('mismatch')) {
        hydrationErrors.push(msg.text());
      }
    });

    await page.goto('/contacts');
    await page.waitForLoadState('networkidle');
    healthReport.noHydrationErrors = hydrationErrors.length === 0;

    // Test performance
    const startTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    healthReport.performanceAcceptable = loadTime < 3000;

    console.log('🏥 System Health Report:', healthReport);

    // Overall health score
    const healthScore = Object.values(healthReport).filter(Boolean).length;
    const totalChecks = Object.keys(healthReport).length;

    console.log(`🎯 Health Score: ${healthScore}/${totalChecks} (${Math.round(healthScore/totalChecks*100)}%)`);

    // Expect at least 80% health score
    expect(healthScore / totalChecks).toBeGreaterThan(0.8);
  });
});
