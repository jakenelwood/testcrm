import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CampaignsPage from '@/app/dashboard/campaigns/page';
import { withProviders } from '../helpers/providers';

// Mock fetch globally
const originalFetch = global.fetch;

describe('CampaignsPage (empty state)', () => {
  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/campaigns')) {
        return new Response(JSON.stringify({ success: true, data: [
          { id: '11111111-1111-1111-1111-111111111111', name: 'Test Campaign', status: 'draft', totalSent: 0 }
        ] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('{}', { status: 200 });
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch as any;
    jest.clearAllMocks();
  });

  it('renders a campaign card when data exists', async () => {
    render(withProviders(<CampaignsPage />));

    // Header renders
    await screen.findByText('Campaigns');
    // Wait for cards
    expect(await screen.findByText('Test Campaign', {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('allows typing in search without errors', async () => {
    render(withProviders(<CampaignsPage />));

    const input = await screen.findByPlaceholderText('Search campaigns...');
    fireEvent.change(input, { target: { value: 'alpha' } });
    expect((input as HTMLInputElement).value).toBe('alpha');
  });
});

