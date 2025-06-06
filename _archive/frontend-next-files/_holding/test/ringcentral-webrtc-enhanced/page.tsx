'use client';

import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { isRingCentralAuthenticated, authenticateWithRingCentral } from '@/utils/ringcentral';
import { initializeWebPhone, makeCall } from '@/utils/ringcentral-webphone-enhanced';
import { logStep, checkWebSocketConnection } from '@/utils/ringcentral-webrtc-debug';

export default function RingCentralWebRTCEnhancedTest() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [webPhone, setWebPhone] = useState<any>(null);
  const [callStatus, setCallStatus] = useState('Ready');
  const [session, setSession] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [wsStatus, setWsStatus] = useState<string>('Not connected');

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);

  // Add a log entry
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isRingCentralAuthenticated();
        setIsAuthenticated(authenticated);

        if (authenticated) {
          addLog('Authenticated with RingCentral');
          setupWebPhone();
        } else {
          addLog('Not authenticated with RingCentral');
        }
      } catch (err: any) {
        setError(`Authentication check failed: ${err.message}`);
        addLog(`Error: ${err.message}`);
      }
    };

    checkAuth();
  }, []);

  // Initialize WebPhone
  const setupWebPhone = async () => {
    try {
      setIsLoading(true);
      setError(null);
      addLog('Initializing WebPhone...');

      // Request microphone permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        addLog('Microphone permissions granted');
      } catch (err: any) {
        addLog(`Microphone permission denied: ${err.message}`);
        setError('Microphone permission denied. Please allow microphone access to make calls.');
      }

      try {
        // Initialize WebPhone with more robust error handling
        addLog('Calling initializeWebPhone()...');

        // Add a retry mechanism for WebPhone initialization
        let webPhoneInstance = null;
        let initAttempts = 0;
        const maxInitAttempts = 3;

        while (initAttempts < maxInitAttempts && !webPhoneInstance) {
          try {
            initAttempts++;
            addLog(`WebPhone initialization attempt ${initAttempts}/${maxInitAttempts}...`);

            webPhoneInstance = await initializeWebPhone();

            if (!webPhoneInstance) {
              throw new Error('WebPhone initialization returned null or undefined');
            }

            addLog('WebPhone instance created successfully');
          } catch (initError) {
            addLog(`WebPhone initialization attempt ${initAttempts} failed: ${initError.message}`);

            if (initAttempts < maxInitAttempts) {
              const delay = 2000 * initAttempts;
              addLog(`Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            } else {
              throw new Error(`WebPhone initialization failed after ${maxInitAttempts} attempts: ${initError.message}`);
            }
          }
        }

        setWebPhone(webPhoneInstance);

        // Wait a moment for the WebPhone to fully initialize
        addLog('Waiting for WebPhone to fully initialize...');
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Set up audio elements
        if (remoteAudioRef.current && localAudioRef.current) {
          try {
            // Try multiple approaches to set up audio elements
            let audioConfigured = false;

            // Approach 1: Using userAgent.audioHelper
            if (webPhoneInstance.userAgent?.audioHelper) {
              try {
                webPhoneInstance.userAgent.audioHelper.setRemoteAudio(remoteAudioRef.current);
                webPhoneInstance.userAgent.audioHelper.setLocalAudio(localAudioRef.current);
                addLog('Audio elements configured using userAgent.audioHelper');
                audioConfigured = true;
              } catch (e) {
                addLog(`Failed to configure audio with userAgent.audioHelper: ${e.message}`);
              }
            }

            // Approach 2: Using audioHelper directly
            if (!audioConfigured && webPhoneInstance.audioHelper) {
              try {
                webPhoneInstance.audioHelper.setRemoteAudio(remoteAudioRef.current);
                webPhoneInstance.audioHelper.setLocalAudio(localAudioRef.current);
                addLog('Audio elements configured using audioHelper');
                audioConfigured = true;
              } catch (e) {
                addLog(`Failed to configure audio with audioHelper: ${e.message}`);
              }
            }

            // Approach 3: Manual configuration
            if (!audioConfigured) {
              addLog('No audioHelper found, attempting manual audio configuration');

              // Create a simple audio helper if none exists
              if (!webPhoneInstance.audioHelper) {
                webPhoneInstance.audioHelper = {
                  setRemoteAudio: (element) => {
                    addLog('Using custom setRemoteAudio function');
                    webPhoneInstance._remoteAudioElement = element;
                  },
                  setLocalAudio: (element) => {
                    addLog('Using custom setLocalAudio function');
                    webPhoneInstance._localAudioElement = element;
                  }
                };

                // Set the audio elements
                webPhoneInstance.audioHelper.setRemoteAudio(remoteAudioRef.current);
                webPhoneInstance.audioHelper.setLocalAudio(localAudioRef.current);
                addLog('Audio elements configured using custom audioHelper');
              }
            }
          } catch (audioError) {
            addLog(`Error configuring audio elements: ${audioError.message}`);
          }
        }

        // Check WebSocket status with retry mechanism
        let wsCheckAttempts = 0;
        const maxWsCheckAttempts = 3;
        let wsConnection = null;

        while (wsCheckAttempts < maxWsCheckAttempts) {
          try {
            wsCheckAttempts++;
            addLog(`Checking WebSocket status (attempt ${wsCheckAttempts}/${maxWsCheckAttempts})...`);

            wsConnection = checkWebSocketConnection(webPhoneInstance);
            const statusText = wsConnection.connected ? 'Connected' : `Not connected (${wsConnection.details.wsReadyStateText})`;
            setWsStatus(statusText);
            addLog(`WebSocket status: ${statusText}`);

            // If connected, break out of the retry loop
            if (wsConnection.connected) {
              addLog('WebSocket is connected, proceeding...');
              break;
            } else if (wsCheckAttempts < maxWsCheckAttempts) {
              // If not connected and we have more attempts, wait and try again
              const delay = 1000 * wsCheckAttempts;
              addLog(`WebSocket not connected, waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } catch (wsError) {
            addLog(`Error checking WebSocket status (attempt ${wsCheckAttempts}): ${wsError.message}`);

            if (wsCheckAttempts < maxWsCheckAttempts) {
              const delay = 1000 * wsCheckAttempts;
              addLog(`Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }

        // If we couldn't connect after all attempts, log a warning but continue
        if (!wsConnection?.connected) {
          addLog('WARNING: WebSocket is not connected after multiple attempts. Calls may not work properly.');
        }

        // Set up periodic WebSocket status check
        const intervalId = setInterval(() => {
          if (webPhoneInstance) {
            try {
              const wsConnection = checkWebSocketConnection(webPhoneInstance);
              const statusText = wsConnection.connected ? 'Connected' : `Not connected (${wsConnection.details.wsReadyStateText})`;
              setWsStatus(statusText);

              // Only log changes in status to avoid flooding the log
              if (statusText !== wsStatus) {
                addLog(`WebSocket status changed: ${statusText}`);
              }
            } catch (wsError) {
              console.error('Error in periodic WebSocket status check:', wsError);
            }
          }
        }, 5000);

        // Clean up interval on component unmount
        return () => clearInterval(intervalId);
      } catch (initError: any) {
        console.error('Error in WebPhone initialization:', initError);
        throw new Error(`WebPhone initialization failed: ${initError.message}`);
      }
    } catch (err: any) {
      setError(`Failed to initialize WebPhone: ${err.message}`);
      addLog(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle authentication
  const handleAuthenticate = () => {
    authenticateWithRingCentral();
  };

  // Make a call
  const handleCall = async () => {
    if (!phoneNumber) {
      setError('Please enter a phone number');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Format the phone number
      let formattedNumber = phoneNumber.trim();
      if (!formattedNumber.startsWith('+')) {
        if (formattedNumber.length === 10) {
          formattedNumber = '+1' + formattedNumber;
        } else if (formattedNumber.length === 11 && formattedNumber.startsWith('1')) {
          formattedNumber = '+' + formattedNumber;
        }
      }

      addLog(`Making call to ${formattedNumber}`);

      if (!webPhone) {
        throw new Error('WebPhone not initialized. Please try refreshing the page.');
      }

      // Check WebSocket status before making the call
      try {
        const wsConnection = checkWebSocketConnection(webPhone);
        if (!wsConnection.connected) {
          throw new Error(`WebSocket not connected: ${wsConnection.details.wsReadyStateText}`);
        }

        addLog(`WebSocket status before call: ${wsConnection.details.wsReadyStateText}`);
      } catch (wsError) {
        addLog(`Error checking WebSocket: ${wsError}`);
        throw new Error(`WebSocket check failed: ${wsError.message}`);
      }

      // Make the call with robust error handling
      try {
        addLog('Calling makeCall function...');
        const callSession = await makeCall(webPhone, formattedNumber, {
          media: {
            constraints: { audio: true, video: false },
            render: {
              remote: remoteAudioRef.current,
              local: localAudioRef.current
            }
          }
        });

        if (!callSession) {
          throw new Error('Call session is null or undefined');
        }

        setSession(callSession);
        addLog('Call session created successfully');

        // Set up event listeners
        callSession.on('progress', () => {
          setCallStatus('Ringing...');
          addLog('Call status: Ringing');
        });

        callSession.on('accepted', () => {
          setCallStatus('Call connected');
          addLog('Call status: Connected');
        });

        callSession.on('terminated', () => {
          setCallStatus('Call ended');
          setSession(null);
          addLog('Call status: Ended');
        });

        callSession.on('failed', (response: any) => {
          setCallStatus('Call failed');
          setSession(null);
          addLog(`Call failed: ${response?.cause || 'Unknown error'}`);
        });
      } catch (callError: any) {
        console.error('Error making call:', callError);
        throw new Error(`Failed to make call: ${callError.message}`);
      }
    } catch (err: any) {
      setError(`Failed to make call: ${err.message}`);
      addLog(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Hang up a call
  const handleHangup = () => {
    if (session) {
      session.terminate();
      addLog('Call terminated by user');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>RingCentral WebRTC Enhanced Test</CardTitle>
          <CardDescription>
            Test the enhanced WebRTC implementation with improved debugging
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <div className="space-y-4">
              <p>You need to authenticate with RingCentral to use WebRTC.</p>
              <Button onClick={handleAuthenticate} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Authenticate with RingCentral'}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${wsStatus.includes('Connected') ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <p className="text-sm">WebSocket Status: {wsStatus}</p>
                </div>

                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  <div className="flex items-end space-x-2">
                    <Button
                      onClick={handleCall}
                      disabled={isLoading || !webPhone || session !== null}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Call
                    </Button>

                    <Button
                      onClick={handleHangup}
                      disabled={isLoading || !session}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Hang Up
                    </Button>
                  </div>
                </div>

                <p className="text-sm">Call Status: {callStatus}</p>
              </div>

              {error && (
                <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="border rounded p-3 h-48 overflow-y-auto bg-gray-50">
                <h3 className="text-sm font-medium mb-2">Debug Logs:</h3>
                <div className="space-y-1 text-xs font-mono">
                  {logs.map((log, index) => (
                    <div key={index}>{log}</div>
                  ))}
                </div>
              </div>

              <div className="hidden">
                <audio ref={remoteAudioRef} autoPlay />
                <audio ref={localAudioRef} muted />
              </div>

              <div className="text-center">
                <Link href="/test" className="text-blue-600 hover:underline text-sm">
                  Back to Test Menu
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
