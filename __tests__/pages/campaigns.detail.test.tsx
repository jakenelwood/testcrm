import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import CampaignDetailPage from '@/app/dashboard/campaigns/[id]/page';
import { withProviders } from '../helpers/providers';

// Mock fetch globally
const originalFetch = global.fetch;

const mockId = '00000000-0000-0000-0000-000000000000';

jest.mock('next/navigation', () => ({
  useParams: () => ({ id: mockId }),
}));

describe('CampaignDetailPage (empty state)', () => {
  beforeEach(() => {
    global.fetch = jest.fn(async (input: RequestInfo) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes(`/api/campaigns?id=${mockId}`)) {
        return new Response(JSON.stringify({ success: true, data: [
          { id: mockId, name: 'Server Campaign', status: 'draft' }
        ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes(`/api/campaigns/${mockId}/steps`)) {
        return new Response(JSON.stringify({ success: true, data: [
          { id: 'step-1', stepNumber: 1, branchLabel: null, templateId: null }
        ] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes(`/api/campaigns/${mockId}/targets`)) {
        return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      if (url.includes(`/api/campaigns/${mockId}/overrides`)) {
        return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      return new Response('{}', { status: 200 });
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch as any;
    jest.clearAllMocks();
  });

  it('renders a step when server returns one and still shows empty audience', async () => {
    render(withProviders(<CampaignDetailPage />));

    // Wait for Steps tab content
    await screen.findByText('Steps');

    // Step from server
    expect(await screen.findByText(/Step 1/)).toBeInTheDocument();
    // Audience empty state
    await screen.findByText(/Audience/);
    expect(screen.getByText(/No targets yet/)).toBeInTheDocument();
  });

  it('allows adding a step on top of server data', async () => {
    render(withProviders(<CampaignDetailPage />));
    const button = await screen.findByText('Add step');
    fireEvent.click(button);
    expect(await screen.findAllByText(/Step 1/)).toHaveLength(1);
  });
});

