'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isRingCentralAuthenticated, makeCall } from '@/utils/ringcentral';

export default function RingCentralCallPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await isRingCentralAuthenticated();
        setAuthStatus(isAuthenticated ? 'Authenticated' : 'Not authenticated');
      } catch (err: any) {
        setError(err.message || 'Failed to check authentication');
      }
    };

    checkAuth();
  }, []);

  // Handle making a call
  const handleMakeCall = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    setIsLoading(true);
    setCallStatus('Initiating call...');
    setError(null);

    try {
      // Use the utility function to make the call
      const result = await makeCall(phoneNumber);

      if (!result.success) {
        throw new Error(result.error || 'Failed to make call');
      }

      setCallStatus(`Call initiated successfully! Call ID: ${result.callId || 'N/A'}`);
    } catch (err: any) {
      setError(err.message || 'Failed to make call');
      setCallStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">RingCentral Call Test</h1>

      <Card className="max-w-md mx-auto mb-6">
        <CardHeader>
          <CardTitle>Make a Phone Call</CardTitle>
          <CardDescription>
            Test making calls with RingCentral
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {authStatus && (
              <div className={`p-3 rounded border ${authStatus === 'Authenticated' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                <p>Status: {authStatus}</p>
              </div>
            )}

            {authStatus !== 'Authenticated' && (
              <div className="p-3 rounded border bg-yellow-50 text-yellow-700">
                <p>You need to authenticate with RingCentral first.</p>
                <Button
                  onClick={() => router.push('/test/ringcentral-simple')}
                  className="mt-2"
                  variant="outline"
                >
                  Go to Authentication Page
                </Button>
              </div>
            )}

            {authStatus === 'Authenticated' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="Enter phone number (e.g., +16505551234)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Enter the phone number in E.164 format (e.g., +16505551234)
                  </p>
                </div>

                <Button
                  onClick={handleMakeCall}
                  disabled={isLoading || !phoneNumber}
                  className="w-full"
                >
                  {isLoading ? 'Making Call...' : 'Make Call'}
                </Button>
              </div>
            )}

            {callStatus && (
              <div className="p-3 rounded border bg-blue-50 text-blue-700">
                <p>{callStatus}</p>
              </div>
            )}

            {error && (
              <div className="p-3 rounded border bg-red-50 text-red-700">
                <p>Error: {error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Link href="/test/ringcentral-simple">
          <Button variant="outline">Back to Authentication Page</Button>
        </Link>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-2">How It Works</h2>
        <p className="text-sm text-gray-600 mb-2">
          This page uses RingCentral's RingOut API to initiate a call. When you make a call:
        </p>
        <ol className="text-sm text-gray-600 list-decimal pl-5 space-y-1">
          <li>RingCentral first calls your phone number (the one associated with your RingCentral account)</li>
          <li>When you answer, RingCentral then calls the destination number you entered</li>
          <li>Both calls are connected, allowing you to speak with the recipient</li>
        </ol>
      </div>
    </div>
  );
}
