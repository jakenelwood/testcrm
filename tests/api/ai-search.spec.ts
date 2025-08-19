import { test, expect, request } from '@playwright/test';

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

test.describe('AI Semantic Search API', () => {
  test('POST /api/ai/embeddings returns embedding', async ({ request }) => {
    const res = await request.post(`${base}/api/ai/embeddings`, {
      data: { text: 'Test embedding text' },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(Array.isArray(json.embedding)).toBeTruthy();
    expect(json.dimensions).toBeGreaterThan(0);
  });

  test('POST /api/ai/search returns results', async ({ request }) => {
    const res = await request.post(`${base}/api/ai/search`, {
      data: { query: 'insurance contact', scope: 'contacts', limit: 5 },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.success).toBeTruthy();
    expect(json.scope).toBe('contacts');
    expect(typeof json.count).toBe('number');
    expect(Array.isArray(json.results)).toBeTruthy();
  });
});

