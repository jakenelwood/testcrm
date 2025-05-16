'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Import the RingCentral utility functions
import { isRingCentralAuthenticated } from '@/utils/ringcentral';

// Dynamically import the initializeWebPhone function with no SSR
const initializeWebPhone = async (accessToken: string) => {
  const { initializeWebPhone } = await import('@/utils/initializeWebPhone');
  return initializeWebPhone(accessToken);
};

export default function RingCentralWebPhonePage() {
  const [webPhone, setWebPhone] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        setIsLoading(true);

        // Check if authenticated using our utility function
        const isAuth = await isRingCentralAuthenticated();
        setIsAuthenticated(isAuth);

        if (!isAuth) {
          setIsLoading(false);
          return;
        }

        // Get access token
        const tokenRes = await fetch('/api/ringcentral/token');
        if (!tokenRes.ok) {
          throw new Error('Failed to get access token');
        }

        const { access_token } = await tokenRes.json();

        // Initialize WebPhone
        try {
          // Request microphone permissions
          await navigator.mediaDevices.getUserMedia({ audio: true });

          // Initialize WebPhone with the token
          const phone = await initializeWebPhone(access_token);
          setWebPhone(phone);

          // Set up audio elements
          if (remoteAudioRef.current && localAudioRef.current) {
            phone.userAgent.audioHelper.setRemoteAudio(remoteAudioRef.current);
            phone.userAgent.audioHelper.setLocalAudio(localAudioRef.current);
          }

          // Set up event listeners
          phone.userAgent.on('registered', () => {
            console.log('WebPhone registered with SIP server');
          });

          phone.userAgent.on('registrationFailed', (e: any) => {
            console.error('WebPhone registration failed:', e);
            setError(`WebPhone registration failed: ${e.cause || 'Unknown error'}`);
          });

        } catch (err: any) {
          console.error('WebPhone initialization error:', err);
          setError(`Failed to initialize WebPhone: ${err.message}`);
        }
      } catch (err: any) {
        console.error('Setup error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    setup();
  }, []);

  const handleMakeCall = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    if (!webPhone || !webPhone.userAgent) {
      setError('WebPhone not initialized');
      return;
    }

    setCallStatus('Initiating call...');
    setError(null);

    try {
      // Format the phone number
      let formattedNumber = phoneNumber.trim();
      if (!formattedNumber.startsWith('+')) {
        if (formattedNumber.length === 10) {
          formattedNumber = '+1' + formattedNumber;
        } else if (formattedNumber.length === 11 && formattedNumber.startsWith('1')) {
          formattedNumber = '+' + formattedNumber;
        }
      }

      // Create the session
      const callSession = webPhone.userAgent.invite(formattedNumber, {
        media: {
          constraints: { audio: true, video: false },
          render: {
            remote: remoteAudioRef.current,
            local: localAudioRef.current
          }
        }
      });

      setSession(callSession);

      // Set up event listeners
      callSession.on('progress', () => {
        setCallStatus('Ringing...');
      });

      callSession.on('accepted', () => {
        setCallStatus('Call connected');
      });

      callSession.on('terminated', () => {
        setCallStatus('Call ended');
        setSession(null);
      });

      callSession.on('failed', (response: any) => {
        setError(`Call failed: ${response.cause || 'Unknown error'}`);
        setCallStatus(null);
        setSession(null);
      });
    } catch (err: any) {
      console.error('Error making call:', err);
      setError(err.message || 'Failed to make call');
      setCallStatus(null);
    }
  };

  const handleEndCall = () => {
    if (session) {
      session.terminate();
      setCallStatus('Ending call...');
    }
  };

  const handleAuthenticate = () => {
    window.location.href = '/api/ringcentral/auth?action=authorize';
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">RingCentral WebRTC Call Test (New)</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>WebRTC Phone</CardTitle>
          <CardDescription>Make calls directly from your browser</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading...</p>
          ) : !isAuthenticated ? (
            <div>
              <p className="mb-4">You need to authenticate with RingCentral first.</p>
              <Button onClick={handleAuthenticate}>Authenticate</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+1 (555) 555-5555"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={!!session}
                />
              </div>

              <div className="flex space-x-2">
                {!session ? (
                  <Button
                    onClick={handleMakeCall}
                    disabled={!webPhone || !phoneNumber}
                    className="flex-1"
                  >
                    Make Call
                  </Button>
                ) : (
                  <Button
                    onClick={handleEndCall}
                    variant="destructive"
                    className="flex-1"
                  >
                    End Call
                  </Button>
                )}
              </div>

              {callStatus && (
                <div className="p-3 bg-blue-50 text-blue-800 rounded-md">
                  {callStatus}
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 text-red-800 rounded-md">
                  {error}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-4">
        <Link href="/test/ringcentral-simple" className="text-blue-600 hover:underline">
          Back to Simple Test
        </Link>
      </div>

      {/* Hidden audio elements for WebRTC */}
      <audio ref={remoteAudioRef} id="remoteAudio" autoPlay />
      <audio ref={localAudioRef} id="localAudio" muted autoPlay />
    </div>
  );
}
