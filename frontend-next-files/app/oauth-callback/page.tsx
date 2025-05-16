'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Authentication failed: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code received');
      return;
    }

    // Process the OAuth callback
    const processCallback = async () => {
      try {
        // Call our API to exchange the code for tokens
        const response = await fetch(`/api/ringcentral/auth/exchange-code?code=${code}&state=${state}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to exchange code for tokens');
        }

        const data = await response.json();

        setStatus('success');
        setMessage('Authentication successful! You can now make calls and send SMS messages.');

        // Redirect back to the RingCentral Test Call page after a short delay
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
