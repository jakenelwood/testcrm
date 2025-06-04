'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function EnvCheckPage() {
  const [envVars, setEnvVars] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEnvVars = async () => {
      try {
        const response = await fetch('/api/ringcentral/env-check');
        if (!response.ok) {
          throw new Error(`Failed to fetch environment variables: ${response.statusText}`);
        }
        const data = await response.json();
        setEnvVars(data);
      } catch (err: any) {
        console.error('Error fetching environment variables:', err);
        setError(err.message || 'Failed to fetch environment variables');
      } finally {
        setLoading(false);
      }
    };

    fetchEnvVars();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Environment Variables Check</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>RingCentral Environment Variables</CardTitle>
          <CardDescription>Current environment variables for RingCentral integration</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading environment variables...</p>
          ) : error ? (
            <div className="p-3 bg-red-50 text-red-800 rounded-md">
              {error}
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Server Configuration</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>RINGCENTRAL_SERVER:</strong> {envVars?.RINGCENTRAL_SERVER || 'Not set'}</li>
                <li><strong>RINGCENTRAL_CLIENT_ID:</strong> {envVars?.RINGCENTRAL_CLIENT_ID || 'Not set'}</li>
                <li><strong>RINGCENTRAL_CLIENT_SECRET:</strong> {envVars?.RINGCENTRAL_CLIENT_SECRET ? 'Set (hidden)' : 'Not set'}</li>
              </ul>

              <h2 className="text-xl font-semibold">Phone Numbers</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>RINGCENTRAL_FROM_NUMBER:</strong> {envVars?.RINGCENTRAL_FROM_NUMBER || 'Not set'}</li>
                <li><strong>NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER:</strong> {envVars?.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER || 'Not set'}</li>
              </ul>

              <h2 className="text-xl font-semibold">OAuth Configuration</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>REDIRECT_URI:</strong> {envVars?.REDIRECT_URI || 'Not set'}</li>
                <li><strong>NEXT_PUBLIC_APP_URL:</strong> {envVars?.NEXT_PUBLIC_APP_URL || 'Not set'}</li>
              </ul>

              <h2 className="text-xl font-semibold">Client-Side Configuration</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID:</strong> {envVars?.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID || 'Not set'}</li>
                <li><strong>NEXT_PUBLIC_RINGCENTRAL_SERVER:</strong> {envVars?.NEXT_PUBLIC_RINGCENTRAL_SERVER || 'Not set'}</li>
                <li><strong>NEXT_PUBLIC_RINGCENTRAL_DOMAIN:</strong> {envVars?.NEXT_PUBLIC_RINGCENTRAL_DOMAIN || 'Not set'}</li>
              </ul>

              <h2 className="text-xl font-semibold">Deployment Information</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>VERCEL_URL:</strong> {envVars?.VERCEL_URL || 'Not set'}</li>
                <li><strong>NODE_ENV:</strong> {envVars?.NODE_ENV || 'Not set'}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
