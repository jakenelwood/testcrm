import { test, expect } from '@playwright/test';
import fs from 'fs';
import AxeBuilder from '@axe-core/playwright';
import path from 'path';

// Lightweight finding model for logging-only audit
interface Finding {
  category: 'UI' | 'UX' | 'Accessibility' | 'Performance' | 'API' | 'CrossBrowser' | 'Stability';
  severity: 'low' | 'medium' | 'high';
  page?: string;
  field?: string;
  issue: string;
  details?: string;
  browser?: string;
}

const findings: Finding[] = [];

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Prepare per-process NDJSON sink to avoid overwrites across projects/workers
const ART_DIR = path.join(process.cwd(), 'tests', 'artifacts');
const RUN_ID = `${Date.now()}-${process.pid}`;
const NDJSON_FILE = path.join(ART_DIR, `ui-ux-audit-findings-${RUN_ID}.ndjson`);
try { fs.mkdirSync(ART_DIR, { recursive: true }); } catch {}

// Helper to log a finding without failing the test
function logFinding(f: Finding) {
  findings.push({ ...f });
  const line = JSON.stringify({ generatedAt: new Date().toISOString(), ...f });
  try { fs.appendFileSync(NDJSON_FILE, line + '\n', 'utf-8'); } catch {}
  console.log(`[FINDING] [${f.category}] [${f.severity}] ${f.issue}${f.page ? ` @ ${f.page}` : ''}${f.field ? ` [${f.field}]` : ''}${f.browser ? ` (${f.browser})` : ''}`);
}

// Persist audit report at the end of the run
async function writeReport() {
  const outDir = ART_DIR;
  const file = path.join(outDir, `ui-ux-audit-report-${RUN_ID}.json`);
  await fs.promises.mkdir(outDir, { recursive: true });
  await fs.promises.writeFile(file, JSON.stringify({ generatedAt: new Date().toISOString(), findings }, null, 2), 'utf-8');
  console.log(`Audit findings written to: ${file}`);
}

// Global console/network monitoring per test
test.beforeEach(async ({ page, browserName }) => {
  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      logFinding({
        category: 'Stability',
        severity: type === 'error' ? 'high' : 'medium',
        issue: `Console ${type}: ${msg.text()}`,
        browser: browserName,
      });
    }
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      logFinding({
        category: 'API',
        severity: response.status() >= 500 ? 'high' : 'medium',
        issue: `HTTP ${response.status()} on ${response.request().method()} ${response.url()}`,
      });
    }
  });
});

// Summary report
test.afterAll(async () => {
  await writeReport();
});

// 1) Core navigation and layout checks
const corePages = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/dashboard',
  '/dashboard/leads',
  '/dashboard/opportunities',
  '/dashboard/pipelines',
];

test.describe('UI/UX: Core pages render and have primary landmarks', () => {
  for (const route of corePages) {
    test(`Page loads: ${route}`, async ({ page, browserName }) => {
      const t0 = Date.now();
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      const t1 = Date.now();

      // Performance note (do not fail)
      const loadMs = t1 - t0;
      if (loadMs > 3000) {
        logFinding({ category: 'Performance', severity: 'medium', page: route, issue: `Slow DOM load (${loadMs}ms)` , browser: browserName});
      }

      // Landmarks
      const hasMain = await page.locator('main, [role="main"]').count();
      const hasHeader = await page.locator('header, [role="banner"]').count();
      const hasFooter = await page.locator('footer, [role="contentinfo"]').count();

      if (hasMain === 0) logFinding({ category: 'Accessibility', severity: 'medium', page: route, issue: 'Missing <main> or role="main" landmark' });
      if (hasHeader === 0) logFinding({ category: 'Accessibility', severity: 'low', page: route, issue: 'Missing <header> or role="banner" landmark' });
      if (hasFooter === 0) logFinding({ category: 'Accessibility', severity: 'low', page: route, issue: 'Missing <footer> or role="contentinfo" landmark' });

      // No hard assertion; smoke presence
      const title = await page.title();
      if (!title || title.length === 0) {
        logFinding({ category: 'UX', severity: 'low', page: route, issue: 'Missing or empty document title' });
      }
    });
  }
});

// 1b) Accessibility automated checks via axe-core (log-only)
test.describe('Accessibility: axe-core scan', () => {
  for (const route of corePages) {
    test(`axe scan: ${route}`, async ({ page, browserName }) => {
      await page.goto(route);
      const axe = new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']);
      const results = await axe.analyze();
      for (const v of results.violations) {
        const targets = (v.nodes || []).flatMap((n: any) => n.target).slice(0, 3);
        logFinding({
          category: 'Accessibility',
          severity: 'medium',
          page: route,
          issue: `axe: ${v.id} - ${v.help}`,
          details: targets.join(', '),
          browser: browserName,
        });
      }
    });
  }
});


// 2) Signup form deep validation (client-side)

test.describe('UI/UX: Signup form fields and validation', () => {
  test('Elements present and interactive', async ({ page }) => {
    await page.goto('/auth/signup');

    const displayName = page.getByRole('textbox', { name: 'Display Name' });
    const email = page.getByRole('textbox', { name: 'Email' });
    const password = page.getByRole('textbox', { name: 'Password', exact: true });
    const confirm = page.getByRole('textbox', { name: 'Confirm Password' });
    const submit = page.getByRole('button', { name: 'Create account' });

    for (const [name, locator] of [
      ['Display Name', displayName],
      ['Email', email],
      ['Password', password],
      ['Confirm Password', confirm],
      ['Create account', submit],
    ] as const) {
      if (!(await locator.isVisible())) {
        logFinding({ category: 'UI', severity: 'high', page: '/auth/signup', field: name, issue: 'Field not visible' });
      }
    }

    // Validate basic client-side checks
    await displayName.fill('');
    await email.fill('invalid');
    await password.fill('123');
    await confirm.fill('456');

    // Expect weak password helper
    const weakTip = page.locator('text=Password must be at least 8 characters long');
    if (!(await weakTip.first().isVisible())) {
      logFinding({ category: 'UX', severity: 'medium', page: '/auth/signup', field: 'Password', issue: 'No weak password helper message' });
    }

    // Match passwords
    await password.fill('StrongP@ssw0rd123!');
    await confirm.fill('StrongP@ssw0rd123!');

    // Submit enabled
    if (!(await submit.isEnabled())) {
      logFinding({ category: 'UX', severity: 'medium', page: '/auth/signup', field: 'Create account', issue: 'Submit not enabled after valid inputs' });
    }
  });

  test('Keyboard accessibility (Tab/Enter)', async ({ page }) => {
    await page.goto('/auth/signup');

    // Tab through primary inputs
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Attempt submit via Enter without mouse
    await page.keyboard.press('Enter');

    // If any visible toast/alert is not focusable, log
    const alert = page.locator('[role="alert"], .alert');
    if ((await alert.count()) > 0 && !(await alert.first().isVisible())) {
      logFinding({ category: 'Accessibility', severity: 'low', page: '/auth/signup', issue: 'Alert shown but not visible/focusable' });
    }
  });
});

// 3) Responsive checks and overflow hygiene

test.describe('UI: Responsive and overflow hygiene', () => {
  const viewports = [
    { w: 1280, h: 800, label: 'desktop' },
    { w: 390, h: 844, label: 'mobile' },
  ];

  for (const vp of viewports) {
    test(`No body horizontal scroll on pipelines (${vp.label})`, async ({ page, browserName }) => {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto('/dashboard/pipelines');
      await page.waitForLoadState('networkidle');

      // Body overflow-x should not scroll; kanban column area can scroll instead
      const overflowX = await page.evaluate(() => getComputedStyle(document.body).overflowX);
      if (overflowX === 'scroll' || overflowX === 'auto') {
        logFinding({ category: 'UX', severity: 'medium', page: '/dashboard/pipelines', issue: 'Body has horizontal scroll; should be contained within board area', browser: browserName });
      }
    });
  }
});

// 4) API contracts (non-fatal, info only)

test.describe('API: Contract and status sanity checks', () => {
  test('Health endpoint should not be 404', async ({ request }) => {
    try {
      const res = await request.get(`${BASE_URL}/api/health`);
      if (res.status() === 404) {
        logFinding({ category: 'API', severity: 'high', page: '/api/health', issue: 'Health endpoint missing (404)' });
      } else if (res.status() >= 500) {
        logFinding({ category: 'API', severity: 'high', page: '/api/health', issue: `Server error ${res.status()}` });
      }
    } catch (e: any) {
      logFinding({ category: 'API', severity: 'high', page: '/api/health', issue: `Request failed: ${e?.message || e}` });
    }
  });

  for (const endpoint of ['/api/contacts', '/api/opportunities', '/api/pipelines']) {
    test(`Endpoint exists: ${endpoint}`, async ({ request }) => {
      try {
        const res = await request.get(`${BASE_URL}${endpoint}`);
        if (res.status() === 404) {
          logFinding({ category: 'API', severity: 'medium', page: endpoint, issue: 'Endpoint not found (404)' });
        }
      } catch (e: any) {
        logFinding({ category: 'API', severity: 'medium', page: endpoint, issue: `Request failed: ${e?.message || e}` });
      }
    });
  }
});

// 5) Cross-browser smoke: minimal assertions, rely on config projects

test.describe('CrossBrowser: smoke navigation', () => {
  test('Navigate key routes without hard failures', async ({ page, browserName }) => {
    for (const route of ['/','/dashboard','/dashboard/leads','/dashboard/opportunities']) {
      try {
        await page.goto(route);
        await page.waitForLoadState('domcontentloaded');
      } catch (e: any) {
        logFinding({ category: 'CrossBrowser', severity: 'high', page: route, issue: `Navigation failed: ${e?.message || e}`, browser: browserName });
      }
    }
  });
});

