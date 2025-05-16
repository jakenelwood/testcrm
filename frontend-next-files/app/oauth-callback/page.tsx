'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Create a separate component that uses useSearchParams
function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Log all query parameters for debugging
    console.log('OAuth callback received with params:', {
      code: code ? `${code.substring(0, 5)}...` : null, // Only log part of the code for security
      state,
      error,
      errorDescription,
      allParams: Object.fromEntries(searchParams.entries())
    });

    if (error) {
      console.error('OAuth error:', error, errorDescription);
      setStatus('error');
      setMessage(`Authentication failed: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
      return;
    }

    if (!code) {
      console.error('No authorization code received');
      setStatus('error');
      setMessage('No authorization code received');
      return;
    }

    // Process the OAuth callback
    const processCallback = async () => {
      try {
        console.log('Exchanging code for tokens...');

        // Call our API to exchange the code for tokens
        const exchangeUrl = `/api/ringcentral/auth/exchange-code?code=${code}&state=${state}`;
        console.log('Exchange URL:', exchangeUrl);

        const response = await fetch(exchangeUrl);
        console.log('Exchange response status:', response.status);

        const responseText = await response.text();
        console.log('Exchange response text:', responseText);

        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          throw new Error('Invalid response format from server');
        }

        if (!response.ok) {
          console.error('Exchange request failed:', data);
          throw new Error(data.error || 'Failed to exchange code for tokens');
        }

        console.log('Exchange successful:', data);
        setStatus('success');
        setMessage('Authentication successful! You can now make calls and send SMS messages.');

        // Redirect back to the RingCentral Test Call page after a short delay
        console.log('Redirecting to test call page in 3 seconds...');
        setTimeout(() => {
          router.push('/dashboard/settings/development/ringcentral-test-call');
        }, 3000);
      } catch (error) {
        console.error('Error processing callback:', error);
        setStatus('error');
        setMessage(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>RingCentral Authentication</CardTitle>
          <CardDescription>
            {status === 'loading' ? 'Processing your authentication...' :
             status === 'success' ? 'Authentication successful!' :
             'Authentication failed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className={`text-${status === 'error' ? 'red' : status === 'success' ? 'green' : 'gray'}-600`}>
            {message}
          </p>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => router.push('/dashboard/settings/development/ringcentral-test-call')}
            variant={status === 'error' ? 'outline' : 'default'}
          >
            {status === 'error' ? 'Try Again' : 'Continue'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Main component that wraps the content in a Suspense boundary
export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>RingCentral Authentication</CardTitle>
            <CardDescription>Processing your authentication...</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Please wait while we process your authentication...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <OAuthCallbackContent />
    </Suspense>
  );
}
