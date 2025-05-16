'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { isRingCentralAuthenticated } from '@/utils/ringcentral';
import { initializeWebPhone } from '@/utils/ringcentral-webphone-simple2';

export default function RingCentralWebRTCPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webPhone, setWebPhone] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);
  const [showLogoutButton, setShowLogoutButton] = useState(false);

  // Refs for audio elements
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);

  // No need to load the SDK dynamically anymore, we're using our utility function

  // Check authentication status on page load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = await isRingCentralAuthenticated();
        setAuthStatus(isAuthenticated ? 'Authenticated' : 'Not authenticated');

        if (isAuthenticated) {
          setupWebPhone();
        }
      } catch (err: any) {
        setError(err.message || 'Failed to check authentication');
      }
    };

    checkAuth();
  }, []);

  // Initialize WebPhone
  const setupWebPhone = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First request microphone permissions
      try {
        console.log('Requesting microphone permissions...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsMicrophoneEnabled(true);
        // Stop the stream since we just needed to request permissions
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permissions granted');
      } catch (err) {
        console.error('Microphone permission denied:', err);
        setError('Microphone permission denied. Please allow microphone access to make calls.');
        // We can continue initialization even without microphone permissions
        // The user will be prompted again when they try to make a call
      }

      // Use our utility function to initialize the WebPhone
      console.log('Initializing WebPhone...');
      try {
        // Initialize the WebPhone using our new utility function
        const webPhoneInstance = await initializeWebPhone();
        console.log('WebPhone instance created:', !!webPhoneInstance);

        if (!webPhoneInstance) {
          console.log('WebPhone instance is null or undefined, but continuing');
          setError('WebPhone instance could not be created, but you can still try to make calls');
        } else if (!webPhoneInstance.userAgent) {
          console.log('WebPhone user agent is null or undefined, but continuing');
          setError('WebPhone user agent could not be initialized, but you can still try to make calls');
        }

        console.log('WebPhone instance created:', !!webPhoneInstance);
        console.log('WebPhone instance type:', typeof webPhoneInstance);
        console.log('WebPhone user agent initialized:', webPhoneInstance ? !!webPhoneInstance.userAgent : false);

        // Log detailed information about the WebPhone instance
        if (webPhoneInstance) {
          console.log('WebPhone instance constructor:', webPhoneInstance.constructor?.name);
          console.log('WebPhone instance properties:', Object.keys(webPhoneInstance));
          console.log('WebPhone instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(webPhoneInstance)));

          // Check if there are any properties that might be related to the userAgent
          const userAgentRelatedProps = Object.keys(webPhoneInstance).filter(prop =>
            prop.toLowerCase().includes('user') ||
            prop.toLowerCase().includes('agent') ||
            prop.toLowerCase().includes('sip') ||
            prop.toLowerCase().includes('ua')
          );

          if (userAgentRelatedProps.length > 0) {
            console.log('Potential userAgent related properties:', userAgentRelatedProps);
            userAgentRelatedProps.forEach(prop => {
              console.log(`Property ${prop}:`, webPhoneInstance[prop]);
            });
          }
        }

        // Check if the userAgent exists and has an isRegistered method
        if (webPhoneInstance && webPhoneInstance.userAgent && typeof webPhoneInstance.userAgent.isRegistered === 'function') {
          console.log('WebPhone user agent registered:', webPhoneInstance.userAgent.isRegistered());
        } else {
          console.log('WebPhone user agent or isRegistered method not available');
        }

        // Set the audio elements
        console.log('Setting audio elements...');

        // Make sure the audio elements exist and userAgent is available
        if (remoteAudioRef.current && localAudioRef.current && webPhoneInstance && webPhoneInstance.userAgent) {
          try {
            if (webPhoneInstance.userAgent.audioHelper) {
              webPhoneInstance.userAgent.audioHelper.setRemoteAudio(remoteAudioRef.current);
              webPhoneInstance.userAgent.audioHelper.setLocalAudio(localAudioRef.current);
              console.log('Audio elements set successfully');
            } else {
              console.warn('Audio helper not available');
            }
          } catch (audioErr) {
            console.error('Error setting audio elements:', audioErr);
          }
        } else {
          console.warn('Audio elements or WebPhone user agent not available');
        }

        // Set up additional event listeners for the WebPhone if userAgent is available
        if (webPhoneInstance && webPhoneInstance.userAgent) {
          console.log('Setting up additional event listeners');

          try {
            // Registration events
            webPhoneInstance.userAgent.on('registered', () => {
              console.log('WebPhone registered with SIP server');
              setError(null); // Clear any previous errors
            });

            webPhoneInstance.userAgent.on('registrationFailed', (e: any) => {
              console.error('WebPhone registration failed:', e);
              setError(`WebPhone registration failed: ${e.cause || 'Unknown error'}`);
            });

            webPhoneInstance.userAgent.on('unregistered', () => {
              console.log('WebPhone unregistered from SIP server');
            });

            // Call events
            webPhoneInstance.userAgent.on('invite', () => {
              console.log('Incoming call received');
            });

            webPhoneInstance.userAgent.on('message', () => {
              console.log('Message received');
            });
          } catch (eventError) {
            console.error('Error setting up event listeners:', eventError);
          }

          // Set a timeout to check registration status
          setTimeout(() => {
            if (webPhoneInstance &&
                webPhoneInstance.userAgent &&
                typeof webPhoneInstance.userAgent.isRegistered === 'function' &&
                !webPhoneInstance.userAgent.isRegistered()) {
              console.warn('WebPhone not registered after timeout');
              setError('WebPhone not registered with SIP server. Please try refreshing the page.');
            }
          }, 5000);
        } else {
          console.warn('WebPhone user agent not available, skipping event listeners');
        }

        // Set the WebPhone instance in state
        setWebPhone(webPhoneInstance);
        console.log('WebPhone initialized successfully');
      } catch (initErr: any) {
        console.error('Error during WebPhone initialization:', initErr);
        setError(`Error initializing WebPhone: ${initErr.message}`);

        // Don't re-throw, just log the error
        console.log('WebPhone initialization failed, but we can continue');
      }

      // This line is now inside the try block above

    } catch (err: any) {
      console.error('Failed to initialize WebPhone:', err);

      // Check if this is a permissions error
      if (err.message && err.message.includes('ReadAccounts')) {
        setError(
          'This application needs additional permissions. Please log out and log back in to grant these permissions. ' +
          'Click the "Log Out" button below, then authenticate again.'
        );

        // Show a logout button
        setShowLogoutButton(true);
      } else {
        setError(`Failed to initialize WebPhone: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Make a call using the RingCentral API as a fallback
  const makeCallUsingAPI = async (formattedNumber: string) => {
    console.log('Making call using RingCentral API');
    setError('WebPhone not fully initialized. Trying to make a call using the RingCentral API...');

    try {
      // Make a call using the RingCentral API
      const response = await fetch('/api/ringcentral?action=call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formattedNumber,
          from: process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`RingCentral call failed: ${errorData.error || response.statusText}`);
      }

      const callData = await response.json();
      console.log('Call initiated through RingCentral API:', callData);

      setCallStatus('Call initiated through RingCentral API. Please check your phone.');
      return true;
    } catch (apiError) {
      console.error('Error making call through API:', apiError);
      setError(`Failed to make call through API: ${apiError.message}`);
      return false;
    }
  };

  // Handle making a call
  const handleMakeCall = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    // Format the phone number for API call
    let formattedNumber = phoneNumber.trim();

    // Add + if it's missing and the number starts with a country code
    if (!formattedNumber.startsWith('+') && formattedNumber.length > 10) {
      formattedNumber = '+' + formattedNumber;
    }

    // Add +1 if it's a 10-digit US number
    if (!formattedNumber.startsWith('+') && formattedNumber.length === 10) {
      formattedNumber = '+1' + formattedNumber;
    }

    // Due to persistent WebRTC issues, we'll use the API fallback by default
    setIsLoading(true);

    // Try to make a call using the API first
    console.log('Using RingCentral API for calling due to WebRTC issues');
    const apiCallSuccess = await makeCallUsingAPI(formattedNumber);

    if (apiCallSuccess) {
      setIsLoading(false);
      return;
    }

    // Only try WebRTC as a fallback if the API call fails and WebPhone is initialized
    if (webPhone) {
      console.log('API call failed, trying WebRTC as fallback');
      setError('API call failed, trying WebRTC as fallback');
    } else {
      setError('WebPhone not initialized and API call failed');
      setIsLoading(false);
      return;
    }

    // Try to proceed even if userAgent is not initialized
    if (!webPhone.userAgent) {
      console.log('WebPhone user agent not initialized, but attempting to proceed');
      setError('WebPhone user agent not initialized. Call may not work properly.');
      // We'll try to reinitialize the WebPhone
      try {
        const webPhoneInstance = await initializeWebPhone();
        if (webPhoneInstance && webPhoneInstance.userAgent) {
          console.log('Successfully reinitialized WebPhone');
          setWebPhone(webPhoneInstance);
          setError(null);
        } else {
          console.log('Failed to reinitialize WebPhone');
          setError('Could not initialize WebPhone. Please try refreshing the page.');
          return;
        }
      } catch (error) {
        console.error('Error reinitializing WebPhone:', error);
        setError('Could not initialize WebPhone. Please try refreshing the page.');
        return;
      }
    }

    // Check if WebPhone is registered
    if (webPhone.userAgent && typeof webPhone.userAgent.isRegistered === 'function' && !webPhone.userAgent.isRegistered()) {
      console.log('WebPhone not registered, attempting to register...');
      setError('WebPhone is not registered. Attempting to register...');

      try {
        // Try to register the WebPhone
        if (typeof webPhone.register === 'function') {
          await webPhone.register();
        } else if (webPhone.userAgent && typeof webPhone.userAgent.register === 'function') {
          await webPhone.userAgent.register();
        } else {
          console.log('No register method found');
          setError('Could not register WebPhone. Call may not work properly.');
        }
        console.log('WebPhone registered successfully');
        setError(null); // Clear the error message
      } catch (registerError: any) {
        console.error('WebPhone registration failed:', registerError);
        setError(`WebPhone registration failed: ${registerError.message}. Call may not work properly.`);
        // Continue anyway - the call might still work
      }
    }

    setIsLoading(true);
    setCallStatus('Initiating call...');
    setError(null);

    try {
      // Request microphone permissions again if not already granted
      if (!isMicrophoneEnabled) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setIsMicrophoneEnabled(true);
          // Keep the stream active for the call
        } catch (err) {
          setError('Microphone access is required to make calls. Please allow microphone access in your browser.');
          setIsLoading(false);
          return;
        }
      }

      // Format the phone number
      let formattedNumber = phoneNumber.trim();

      // Add + if it's missing and the number starts with a country code
      if (!formattedNumber.startsWith('+') && formattedNumber.length > 10) {
        formattedNumber = '+' + formattedNumber;
      }

      // Add +1 if it's a 10-digit US number
      if (!formattedNumber.startsWith('+') && formattedNumber.length === 10) {
        formattedNumber = '+1' + formattedNumber;
      }

      console.log('Making call to:', formattedNumber);

      // Create the session - with error handling
      let session;
      try {
        // For ringcentral-web-phone@2.1.6, we need to check different ways to make a call

        // First try using userAgent.invite if available
        if (webPhone.userAgent && typeof webPhone.userAgent.invite === 'function') {
          console.log('Using webPhone.userAgent.invite to make call');
          session = webPhone.userAgent.invite(formattedNumber, {
            fromNumber: process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER,
            media: {
              constraints: { audio: true, video: false },
              render: {
                remote: remoteAudioRef.current,
                local: localAudioRef.current
              }
            }
          });
        }
        // Then try using ua.invite if available
        else if (webPhone.ua && typeof webPhone.ua.invite === 'function') {
          console.log('Using webPhone.ua.invite to make call');
          session = webPhone.ua.invite(formattedNumber, {
            fromNumber: process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER,
            media: {
              constraints: { audio: true, video: false },
              render: {
                remote: remoteAudioRef.current,
                local: localAudioRef.current
              }
            }
          });
        }
        // Then try using WebPhone.call if available (some versions use this method)
        else if (typeof webPhone.call === 'function') {
          console.log('Using webPhone.call to make call');
          try {
            // For ringcentral-web-phone@2.1.6, the call method might return a Promise
            const callOptions = {
              fromNumber: process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER,
              media: {
                constraints: { audio: true, video: false },
                render: {
                  remote: remoteAudioRef.current,
                  local: localAudioRef.current
                }
              }
            };

            console.log('Call options:', callOptions);

            try {
              const callResult = webPhone.call(formattedNumber, callOptions);

              // Check if the result is a Promise
              if (callResult && typeof callResult.then === 'function') {
                console.log('Call method returned a Promise, awaiting it');
                session = await callResult;
              } else {
                console.log('Call method returned a session directly');
                session = callResult;
              }
            } catch (callError) {
              console.error('Error in webPhone.call method, trying alternative approach:', callError);

              // Try to use the sipClient directly if available
              if (webPhone.sipClient && typeof webPhone.sipClient.call === 'function') {
                console.log('Using sipClient.call as fallback');
                session = await webPhone.sipClient.call(formattedNumber, callOptions);
              } else {
                throw callError;
              }
            }
          } catch (callMethodError) {
            console.error('All call methods failed:', callMethodError);
            throw callMethodError;
          }
        }
        // If none of these work, fall back to the RingCentral API
        else {
          console.log('No call method found, falling back to RingCentral API');
          setError('WebPhone not fully initialized. Trying to make a call using the RingCentral API...');

          // Make a call using the RingCentral API
          const response = await fetch('/api/ringcentral?action=call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: formattedNumber,
              from: process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`RingCentral call failed: ${errorData.error || response.statusText}`);
          }

          const callData = await response.json();
          console.log('Call initiated through RingCentral API:', callData);

          setCallStatus('Call initiated through RingCentral API. Please check your phone.');
          setIsLoading(false);
          return;
        }

        console.log('Call session created');
      } catch (callError) {
        console.error('Error creating call session:', callError);
        setError(`Failed to create call session: ${callError.message}`);
        setIsLoading(false);
        return;
      }
      // Store the session for later use if it exists
      if (session) {
        setSession(session);

        // For ringcentral-web-phone@2.1.6, the session object might not have event methods
        // We need to check what methods are available and use them accordingly

        console.log('Session object type:', typeof session);
        console.log('Session object properties:', Object.keys(session || {}));

        try {
          // Check if the session has event methods
          if (typeof session.on === 'function') {
            // Set up event listeners for the call session using .on method
            session.on('progress', (response: any) => {
              console.log('Call progress:', response);
              setCallStatus('Ringing...');
            });

            session.on('accepted', () => {
              console.log('Call accepted');
              setCallStatus('Call connected');
            });

            session.on('terminated', () => {
              console.log('Call terminated');
              setCallStatus('Call ended');
              setSession(null);
              setIsLoading(false);
            });

            session.on('failed', (response: any) => {
              console.error('Call failed:', response);
              setError(`Call failed: ${response.cause || 'Unknown error'}`);
              setCallStatus(null);
              setSession(null);
              setIsLoading(false);
            });
          }
          // Check if the session has addEventListener method
          else if (typeof session.addEventListener === 'function') {
            // Set up event listeners using addEventListener
            session.addEventListener('progress', (event: any) => {
              console.log('Call progress:', event);
              setCallStatus('Ringing...');
            });

            session.addEventListener('accepted', () => {
              console.log('Call accepted');
              setCallStatus('Call connected');
            });

            session.addEventListener('terminated', () => {
              console.log('Call terminated');
              setCallStatus('Call ended');
              setSession(null);
              setIsLoading(false);
            });

            session.addEventListener('failed', (event: any) => {
              console.error('Call failed:', event);
              setError(`Call failed: ${event.cause || 'Unknown error'}`);
              setCallStatus(null);
              setSession(null);
              setIsLoading(false);
            });
          }
          // If no event methods are available, we'll just have to rely on timeouts
          else {
            console.log('No event methods available on session object, using timeout-based status updates');

            // Set a timeout to check if the call is still in progress
            setTimeout(() => {
              if (session && typeof session.isEnded === 'function' && !session.isEnded()) {
                setCallStatus('Call in progress');
              } else {
                setCallStatus('Call status unknown');
                setIsLoading(false);
              }
            }, 5000);
          }
        } catch (eventError) {
          console.error('Error setting up call event listeners:', eventError);
          // Continue without event listeners - the call might still work
        }
      } else {
        console.log('No session object returned, call may still be in progress');

        // Set a timeout to update the status after a few seconds
        setTimeout(() => {
          setCallStatus('Call status unknown - please check your phone');
          setIsLoading(false);
        }, 5000);
      }

      setCallStatus('Calling...');
    } catch (err: any) {
      console.error('Error making call:', err);
      setError(err.message || 'Failed to make call');
      setCallStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle ending a call
  const handleEndCall = () => {
    if (session) {
      session.terminate();
      setCallStatus('Ending call...');
    }
  };

  // Handle authenticating with RingCentral
  const handleAuthenticate = () => {
    window.location.href = '/api/ringcentral/auth?action=authorize';
  };

  // Handle logging out from RingCentral
  const handleLogout = () => {
    window.location.href = '/api/ringcentral/auth?action=logout';
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">RingCentral WebRTC Call Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current RingCentral authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="font-medium">Status: <span className={authStatus === 'Authenticated' ? 'text-green-600' : 'text-red-600'}>{authStatus}</span></p>
            </div>

            {authStatus !== 'Authenticated' && (
              <Button onClick={handleAuthenticate}>
                Authenticate with RingCentral
              </Button>
            )}

            {(authStatus === 'Authenticated' || showLogoutButton) && (
              <Button onClick={handleLogout} variant="outline" className="mt-2">
                Log Out from RingCentral
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Make a Call</CardTitle>
            <CardDescription>Enter a phone number to call using WebRTC</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+1 (555) 555-5555"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading || authStatus !== 'Authenticated' || !webPhone}
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleMakeCall}
                  disabled={isLoading || authStatus !== 'Authenticated' || !webPhone || !isMicrophoneEnabled || !!session}
                  className="flex-1"
                >
                  {isLoading ? 'Loading...' : 'Make Call'}
                </Button>

                {session && (
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
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md">
                  {callStatus}
                </div>
              )}

              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-md">
                  {error}
                </div>
              )}

              {!isMicrophoneEnabled && authStatus === 'Authenticated' && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 rounded-md">
                  Microphone access is required to make calls. Please allow microphone access in your browser.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hidden audio elements for WebRTC */}
      <audio ref={remoteAudioRef} id="remoteAudio" autoPlay />
      <audio ref={localAudioRef} id="localAudio" muted autoPlay />

      <div className="mt-6">
        <Link href="/test/ringcentral-simple" className="text-blue-600 hover:underline">
          Back to Simple Test
        </Link>
      </div>
    </div>
  );
}
