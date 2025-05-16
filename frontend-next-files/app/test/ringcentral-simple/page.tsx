'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function RingCentralSimpleTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/ringcentral/auth?action=check', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        const data = await response.json();
        setAuthStatus(data.authenticated ? 'Authenticated' : 'Not authenticated');
      } catch (err: any) {
        setError(err.message || 'Failed to check authentication');
      }
    };

    checkAuth();
  }, []);

  // Handle authentication
  const handleAuthenticate = () => {
    setIsLoading(true);
    window.location.href = '/api/ringcentral/auth?action=authorize';
  };

  // Handle logout
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ringcentral/auth?action=logout');
      if (response.ok) {
        setAuthStatus('Not authenticated');
      } else {
        setError('Failed to logout');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to logout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">RingCentral Simple Authentication Test</h1>

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>RingCentral Authentication</CardTitle>
          <CardDescription>
            Test the basic RingCentral authentication flow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {authStatus && (
              <div className="p-3 rounded border">
                <p>Status: {authStatus}</p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded border bg-red-50 text-red-700">
                <p>Error: {error}</p>
              </div>
            )}

            <div className="flex space-x-4">
              {authStatus !== 'Authenticated' && (
                <Button
                  onClick={handleAuthenticate}
                  disabled={isLoading}
                >
                  Authenticate with RingCentral
                </Button>
              )}

              {authStatus === 'Authenticated' && (
                <Button
                  onClick={handleLogout}
                  disabled={isLoading}
                  variant="destructive"
                >
                  Logout from RingCentral
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2">Debug Information</h2>
        <p className="text-sm text-gray-600 mb-2">
          This page tests only the authentication flow with RingCentral, without any additional functionality.
        </p>
        <p className="text-sm text-gray-600 mb-4">
          Check the browser console and server logs for more detailed information.
        </p>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-2">Advanced Tests</h3>
          <ul className="space-y-2">
            <li>
              <Link href="/test/ringcentral-call" className="text-blue-600 hover:underline">
                RingOut Call Test
              </Link>
              <span className="text-xs text-gray-500 ml-2">(Traditional call method)</span>
            </li>
            <li>
              <Link href="/test/ringcentral-webrtc" className="text-blue-600 hover:underline">
                WebRTC Call Test
              </Link>
              <span className="text-xs text-gray-500 ml-2">(In-browser calling)</span>
            </li>
            <li>
              <Link href="/test/ringcentral-webrtc-enhanced" className="text-blue-600 hover:underline">
                Enhanced WebRTC Test
              </Link>
              <span className="text-xs text-gray-500 ml-2">(Improved debugging)</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">New</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
