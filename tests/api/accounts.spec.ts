import { test, expect } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('Accounts API', () => {
  test('GET /api/accounts returns success with array', async ({ request }) => {
    const res = await request.get(`${base}/api/accounts`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(Array.isArray(json.data)).toBeTruthy();
    expect(typeof json.count).toBe('number');
  });
});

