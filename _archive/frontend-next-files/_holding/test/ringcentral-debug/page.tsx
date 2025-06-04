'use client';

import { useState, useEffect, useRef } from 'react';
import { isRingCentralAuthenticated, authenticateWithRingCentral } from '@/utils/ringcentral';

export default function RingCentralDebugPage() {
  // State for tracking each step of the process
  const [logs, setLogs] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sipInfo, setSipInfo] = useState<any | null>(null);
  const [webPhone, setWebPhone] = useState<any | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<string>('Not started');
  const [callStatus, setCallStatus] = useState<string>('Not started');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [expandedSection, setExpandedSection] = useState<string | null>('auth');
  const [networkTestResults, setNetworkTestResults] = useState<{[key: string]: boolean | string}>({});

  // Refs for audio elements
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);

  // Add a log entry with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev]);
    console.log(`[RingCentral Debug] ${message}`);
  };

  // Step 1: Check Authentication
  const checkAuthentication = async () => {
    try {
      addLog('Checking RingCentral authentication...');
      const authenticated = await isRingCentralAuthenticated();
      setIsAuthenticated(authenticated);
      addLog(`Authentication status: ${authenticated ? 'Authenticated' : 'Not authenticated'}`);
      return authenticated;
    } catch (error: any) {
      addLog(`Authentication check error: ${error.message}`);
      setIsAuthenticated(false);
      return false;
    }
  };

  // Step 2: Get Access Token
  const getAccessToken = async () => {
    try {
      addLog('Getting access token...');
      const response = await fetch('/api/ringcentral/auth?action=token', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        addLog(`Failed to get access token: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      if (!data.authenticated || !data.access_token) {
        addLog('No valid access token available');
        return null;
      }

      addLog(`Access token received (length: ${data.access_token.length})`);
      setAccessToken(data.access_token);
      return data.access_token;
    } catch (error: any) {
      addLog(`Error getting access token: ${error.message}`);
      return null;
    }
  };

  // Step 3: Get SIP Info
  const getSipInfo = async (token: string) => {
    try {
      addLog('Getting SIP info from client-info endpoint...');
      const response = await fetch('/api/ringcentral/client-info', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        addLog(`Failed to get SIP info: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      if (!data.sipInfo || !data.sipInfo.length) {
        addLog('No SIP info received');
        return null;
      }

      addLog(`SIP info received: ${JSON.stringify(data, null, 2)}`);
      setSipInfo(data);
      return data;
    } catch (error: any) {
      addLog(`Error getting SIP info: ${error.message}`);
      return null;
    }
  };

  // Step 4: Initialize WebPhone
  const initializeWebPhone = async (sipProvision: any) => {
    try {
      addLog('Initializing WebPhone...');

      // Dynamically import the RingCentral SDK
      addLog('Loading RingCentral SDK...');
      const RingCentral = (await import('ringcentral')).default;
      const WebPhone = (await import('ringcentral-web-phone')).default;

      addLog('Creating WebPhone configuration...');
      const webPhoneConfig = {
        logLevel: 3, // Debug level for more detailed logs
        appKey: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID,
        appName: 'Gonzigo CRM Debug',
        appVersion: '1.0.0',
        media: {
          // Don't pass React refs directly - this causes circular JSON error
          // Instead, we'll set them after WebPhone is created
          permissions: {
            audio: true,
            video: false
          }
        },
        enableDefaultModifiers: true,
        autoStop: true
      };

      addLog(`WebPhone config: ${JSON.stringify(webPhoneConfig, null, 2)}`);

      // Create the WebPhone instance with the SIP provision data
      addLog('Creating WebPhone instance...');

      try {
        // Make sure we have the required SIP info
        if (!sipProvision || !sipProvision.sipInfo || !sipProvision.sipInfo[0]) {
          addLog('Error: Invalid SIP provision data');
          return null;
        }

        // Log the SIP server we're connecting to
        const sipServer = sipProvision.sipInfo[0].outboundProxy || sipProvision.sipInfo[0].domain;
        addLog(`Using SIP server: ${sipServer}`);

        // Create the WebPhone instance
        const webPhoneInstance = new WebPhone(sipProvision, webPhoneConfig);

        if (!webPhoneInstance) {
          addLog('Failed to create WebPhone instance');
          return null;
        }

        addLog('WebPhone instance created successfully');

        // Wait a moment for the user agent to initialize
        await new Promise(resolve => setTimeout(resolve, 500));

        // Set audio elements after WebPhone is created
        addLog('Setting audio elements...');
        try {
          if (remoteAudioRef.current && localAudioRef.current) {
            // Check if userAgent and audioHelper are available
            if (webPhoneInstance.userAgent && webPhoneInstance.userAgent.audioHelper) {
              // Set audio elements for the WebPhone instance
              webPhoneInstance.userAgent.audioHelper.setRemoteAudio(remoteAudioRef.current);
              webPhoneInstance.userAgent.audioHelper.setLocalAudio(localAudioRef.current);
              addLog('Audio elements set successfully');
            } else {
              // Try an alternative approach if audioHelper isn't available
              addLog('AudioHelper not available, using alternative approach');

              // Store the audio elements for later use during calls
              webPhoneInstance._remoteAudio = remoteAudioRef.current;
              webPhoneInstance._localAudio = localAudioRef.current;

              // Add a custom method to set the audio elements during a call
              webPhoneInstance.setupAudioElements = (session) => {
                if (session && session.mediaHandler) {
                  session.mediaHandler.on('addStream', (event) => {
                    if (webPhoneInstance._remoteAudio && event.stream) {
                      webPhoneInstance._remoteAudio.srcObject = event.stream;
                      webPhoneInstance._remoteAudio.play().catch(e => addLog(`Error playing remote audio: ${e.message}`));
                    }
                  });
                }
              };
            }
          } else {
            addLog('Warning: Audio elements not available');
          }
        } catch (error) {
          addLog(`Warning: Could not set audio elements: ${error.message}`);
        }

        // Check if userAgent is initialized
        if (!webPhoneInstance.userAgent) {
          addLog('WebPhone user agent not initialized, but continuing with limited functionality');
          // We'll still return the instance and try to work with it
        } else {
          addLog('WebPhone user agent initialized successfully');

          // Set up event listeners if userAgent is available
          try {
            webPhoneInstance.userAgent.on('registered', () => {
              addLog('WebPhone registered with SIP server');
              setRegistrationStatus('Registered');
            });

            webPhoneInstance.userAgent.on('registrationFailed', (e: any) => {
              addLog(`WebPhone registration failed: ${e.cause || e.message || JSON.stringify(e)}`);
              setRegistrationStatus('Registration Failed');
            });

            webPhoneInstance.userAgent.on('unregistered', () => {
              addLog('WebPhone unregistered from SIP server');
              setRegistrationStatus('Unregistered');
            });

            webPhoneInstance.userAgent.on('invite', (session: any) => {
              addLog('Incoming call received');

              // Use our custom audio setup if available
              if (webPhoneInstance.setupAudioElements) {
                webPhoneInstance.setupAudioElements(session);
              }
            });

            addLog('Event listeners set up successfully');
          } catch (listenerError) {
            addLog(`Warning: Could not set up event listeners: ${listenerError.message}`);
          }
        }

        setWebPhone(webPhoneInstance);
        return webPhoneInstance;
      } catch (error) {
        addLog(`Error creating WebPhone instance: ${error.message}`);
        if (error.stack) {
          addLog(`Error stack: ${error.stack.split('\n')[0]}`);
        }
        return null;
      }
    } catch (error: any) {
      addLog(`Error initializing WebPhone: ${error.message}`);
      return null;
    }
  };

  // Step 5: Register WebPhone
  const registerWebPhone = async (webPhoneInstance: any) => {
    try {
      addLog('Registering WebPhone with SIP server...');
      setRegistrationStatus('Registering');

      // Add more detailed event listeners for debugging
      webPhoneInstance.userAgent.transport.on('connected', () => {
        addLog('WebSocket connected successfully');
      });

      webPhoneInstance.userAgent.transport.on('disconnected', () => {
        addLog('WebSocket disconnected');
      });

      webPhoneInstance.userAgent.transport.on('transportError', (error: any) => {
        addLog(`WebSocket transport error: ${error.message || JSON.stringify(error)}`);
      });

      // Check WebSocket state
      const transportState = webPhoneInstance.userAgent.transport.state;
      addLog(`Current WebSocket state: ${transportState}`);

      if (transportState !== 'connected') {
        addLog('Attempting to connect WebSocket before registration...');
        try {
          await webPhoneInstance.userAgent.transport.connect();
          addLog('WebSocket connected manually');
        } catch (wsError: any) {
          addLog(`WebSocket connection failed: ${wsError.message}`);
        }
      }

      // Try to register
      addLog('Calling webPhone.register()...');
      await webPhoneInstance.register();

      addLog('WebPhone register() called successfully');
      return true;
    } catch (error: any) {
      addLog(`Error registering WebPhone: ${error.message}`);

      // More detailed error information
      if (error.stack) {
        addLog(`Error stack: ${error.stack.split('\n')[0]}`);
      }

      // Check if it's a network error
      if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        addLog('This appears to be a network error. Check your internet connection and firewall settings.');
        addLog('Make sure WebSocket connections to wss://*.ringcentral.com:8083/ are not blocked.');
      }

      // Check if it's an authentication error
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        addLog('This appears to be an authentication error. Try re-authenticating with RingCentral.');
      }

      setRegistrationStatus('Registration Failed');
      return false;
    }
  };

  // Step 6: Make a call
  const makeCall = async () => {
    if (!webPhone || !phoneNumber) {
      addLog('Cannot make call: WebPhone not initialized or phone number not provided');
      return;
    }

    try {
      addLog(`Making call to ${phoneNumber}...`);
      setCallStatus('Calling');

      // Check if userAgent is available
      if (!webPhone.userAgent) {
        addLog('Cannot make call: WebPhone user agent not initialized');
        setCallStatus('Error');

        // Try alternative approach - use RingOut API instead
        addLog('Attempting to use RingOut API as fallback...');
        try {
          const response = await fetch('/api/ringcentral/call', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phoneNumber })
          });

          if (response.ok) {
            const data = await response.json();
            addLog(`RingOut call initiated: ${JSON.stringify(data)}`);
            setCallStatus('RingOut Initiated');
          } else {
            const error = await response.text();
            addLog(`RingOut call failed: ${error}`);
            setCallStatus('RingOut Failed');
          }
        } catch (ringoutError: any) {
          addLog(`RingOut error: ${ringoutError.message}`);
          setCallStatus('RingOut Error');
        }
        return;
      }

      // Create the session without passing React refs directly
      const session = webPhone.userAgent.invite(phoneNumber, {
        media: {
          constraints: {
            audio: true,
            video: false
          }
        }
      });

      addLog('Call initiated');

      // Use our custom audio setup if available
      if (webPhone.setupAudioElements) {
        webPhone.setupAudioElements(session);
      }

      // Set up call event listeners
      session.on('accepted', () => {
        addLog('Call accepted');
        setCallStatus('Connected');
      });

      session.on('terminated', () => {
        addLog('Call terminated');
        setCallStatus('Terminated');
      });

      session.on('failed', (response: any, cause: string) => {
        addLog(`Call failed: ${cause}`);
        setCallStatus('Failed');
      });

    } catch (error: any) {
      addLog(`Error making call: ${error.message}`);
      setCallStatus('Error');

      // Log more detailed error information
      if (error.stack) {
        addLog(`Error stack: ${error.stack.split('\n')[0]}`);
      }

      // Check for specific error types
      if (error.message.includes('Permission') || error.message.includes('getUserMedia')) {
        addLog('This appears to be a microphone permission issue. Please ensure your browser has permission to access the microphone.');
      } else if (error.message.includes('WebSocket') || error.message.includes('network')) {
        addLog('This appears to be a network issue. Please check your internet connection and firewall settings.');
      }
    }
  };

  // Test network connectivity to RingCentral WebSocket servers
  const testNetworkConnectivity = async () => {
    addLog('Testing network connectivity to RingCentral servers...');
    const results: {[key: string]: boolean | string} = {};

    // Test WebSocket connectivity
    if (sipInfo && sipInfo.sipInfo && sipInfo.sipInfo.length > 0) {
      const wsServers = sipInfo.sipInfo[0].wsServers || [];

      if (wsServers.length === 0 && sipInfo.sipInfo[0].outboundProxy) {
        // If no wsServers but we have outboundProxy, construct the WebSocket URL
        wsServers.push(`wss://${sipInfo.sipInfo[0].outboundProxy}`);
      }

      for (const wsServer of wsServers) {
        try {
          addLog(`Testing WebSocket connection to ${wsServer}...`);

          // We can't directly test WebSocket in the browser due to CORS,
          // so we'll use our server as a proxy
          const response = await fetch('/api/ringcentral/test-websocket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: wsServer })
          });

          const data = await response.json();

          if (data.success) {
            addLog(`✅ Successfully connected to ${wsServer}`);
            results[wsServer] = true;
          } else {
            addLog(`❌ Failed to connect to ${wsServer}: ${data.error}`);
            results[wsServer] = `Failed: ${data.error}`;
          }
        } catch (error: any) {
          addLog(`❌ Error testing ${wsServer}: ${error.message}`);
          results[wsServer] = `Error: ${error.message}`;
        }
      }
    } else {
      addLog('No WebSocket servers found in SIP info');
      results['wsServers'] = 'No WebSocket servers found';
    }

    // Test HTTP connectivity to RingCentral API
    try {
      addLog('Testing HTTP connectivity to RingCentral API...');
      const response = await fetch('/api/ringcentral/ping', {
        method: 'GET'
      });

      const data = await response.json();

      if (data.success) {
        addLog('✅ Successfully connected to RingCentral API');
        results['rcApi'] = true;
      } else {
        addLog(`❌ Failed to connect to RingCentral API: ${data.error}`);
        results['rcApi'] = `Failed: ${data.error}`;
      }
    } catch (error: any) {
      addLog(`❌ Error testing RingCentral API: ${error.message}`);
      results['rcApi'] = `Error: ${error.message}`;
    }

    // Test browser WebRTC capabilities
    try {
      addLog('Testing browser WebRTC capabilities...');

      // Check if getUserMedia is supported
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        addLog('✅ Browser supports getUserMedia');
        results['getUserMedia'] = true;

        // Try to access microphone
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          addLog('✅ Successfully accessed microphone');
          results['microphone'] = true;

          // Clean up the stream
          stream.getTracks().forEach(track => track.stop());
        } catch (micError: any) {
          addLog(`❌ Failed to access microphone: ${micError.message}`);
          results['microphone'] = `Failed: ${micError.message}`;
        }
      } else {
        addLog('❌ Browser does not support getUserMedia');
        results['getUserMedia'] = false;
      }

      // Check if RTCPeerConnection is supported
      if (window.RTCPeerConnection) {
        addLog('✅ Browser supports RTCPeerConnection');
        results['rtcPeerConnection'] = true;
      } else {
        addLog('❌ Browser does not support RTCPeerConnection');
        results['rtcPeerConnection'] = false;
      }
    } catch (error: any) {
      addLog(`❌ Error testing WebRTC capabilities: ${error.message}`);
      results['webrtc'] = `Error: ${error.message}`;
    }

    setNetworkTestResults(results);
    addLog('Network connectivity tests completed');
    return results;
  };

  // Run the full initialization process
  const runFullInitialization = async () => {
    addLog('Starting full initialization process...');

    // Step 1: Check Authentication
    const authenticated = await checkAuthentication();
    if (!authenticated) {
      addLog('Authentication required. Please authenticate first.');
      return;
    }

    // Step 2: Get Access Token
    const token = await getAccessToken();
    if (!token) {
      addLog('Failed to get access token. Cannot proceed.');
      return;
    }

    // Step 3: Get SIP Info
    const sipProvision = await getSipInfo(token);
    if (!sipProvision) {
      addLog('Failed to get SIP info. Cannot proceed.');
      return;
    }

    // Step 4: Initialize WebPhone
    const webPhoneInstance = await initializeWebPhone(sipProvision);
    if (!webPhoneInstance) {
      addLog('Failed to initialize WebPhone. Cannot proceed.');
      return;
    }

    // Step 5: Register WebPhone
    const registered = await registerWebPhone(webPhoneInstance);
    if (!registered) {
      addLog('Failed to register WebPhone.');
      return;
    }

    addLog('Full initialization process completed successfully!');
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">RingCentral WebRTC Debugging</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Debugging Steps</h2>

          {/* Authentication Section */}
          <div className="mb-4 border rounded p-3">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'auth' ? null : 'auth')}
            >
              <h3 className="text-lg font-medium">1. Authentication</h3>
              <span>{expandedSection === 'auth' ? '▼' : '▶'}</span>
            </div>

            {expandedSection === 'auth' && (
              <div className="mt-2">
                <div className="mb-2">
                  Status: {isAuthenticated === null ? 'Not checked' : isAuthenticated ? 'Authenticated' : 'Not authenticated'}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={checkAuthentication}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Check Authentication
                  </button>

                  {!isAuthenticated && (
                    <button
                      onClick={authenticateWithRingCentral}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Authenticate
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Access Token Section */}
          <div className="mb-4 border rounded p-3">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'token' ? null : 'token')}
            >
              <h3 className="text-lg font-medium">2. Access Token</h3>
              <span>{expandedSection === 'token' ? '▼' : '▶'}</span>
            </div>

            {expandedSection === 'token' && (
              <div className="mt-2">
                <div className="mb-2">
                  Status: {accessToken ? `Token received (${accessToken.substring(0, 10)}...)` : 'No token'}
                </div>
                <button
                  onClick={getAccessToken}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Get Access Token
                </button>
              </div>
            )}
          </div>

          {/* SIP Info Section */}
          <div className="mb-4 border rounded p-3">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'sip' ? null : 'sip')}
            >
              <h3 className="text-lg font-medium">3. SIP Info</h3>
              <span>{expandedSection === 'sip' ? '▼' : '▶'}</span>
            </div>

            {expandedSection === 'sip' && (
              <div className="mt-2">
                <div className="mb-2">
                  Status: {sipInfo ? 'SIP info received' : 'No SIP info'}
                </div>
                <button
                  onClick={() => accessToken && getSipInfo(accessToken)}
                  disabled={!accessToken}
                  className={`px-3 py-1 rounded ${accessToken ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  Get SIP Info
                </button>
              </div>
            )}
          </div>

          {/* WebPhone Initialization Section */}
          <div className="mb-4 border rounded p-3">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'init' ? null : 'init')}
            >
              <h3 className="text-lg font-medium">4. Initialize WebPhone</h3>
              <span>{expandedSection === 'init' ? '▼' : '▶'}</span>
            </div>

            {expandedSection === 'init' && (
              <div className="mt-2">
                <div className="mb-2">
                  Status: {webPhone ? 'WebPhone initialized' : 'Not initialized'}
                </div>
                <button
                  onClick={() => sipInfo && initializeWebPhone(sipInfo)}
                  disabled={!sipInfo}
                  className={`px-3 py-1 rounded ${sipInfo ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  Initialize WebPhone
                </button>
              </div>
            )}
          </div>

          {/* Registration Section */}
          <div className="mb-4 border rounded p-3">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'register' ? null : 'register')}
            >
              <h3 className="text-lg font-medium">5. Register WebPhone</h3>
              <span>{expandedSection === 'register' ? '▼' : '▶'}</span>
            </div>

            {expandedSection === 'register' && (
              <div className="mt-2">
                <div className="mb-2">
                  Status: {registrationStatus}
                </div>
                <button
                  onClick={() => webPhone && registerWebPhone(webPhone)}
                  disabled={!webPhone}
                  className={`px-3 py-1 rounded ${webPhone ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  Register WebPhone
                </button>
              </div>
            )}
          </div>

          {/* Make Call Section */}
          <div className="mb-4 border rounded p-3">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'call' ? null : 'call')}
            >
              <h3 className="text-lg font-medium">6. Make Call</h3>
              <span>{expandedSection === 'call' ? '▼' : '▶'}</span>
            </div>

            {expandedSection === 'call' && (
              <div className="mt-2">
                <div className="mb-2">
                  Status: {callStatus}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="px-3 py-1 border rounded"
                  />
                  <button
                    onClick={makeCall}
                    disabled={!webPhone || !phoneNumber || registrationStatus !== 'Registered'}
                    className={`px-3 py-1 rounded ${webPhone && phoneNumber && registrationStatus === 'Registered' ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    Call
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Network Test Section */}
          <div className="mb-4 border rounded p-3">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setExpandedSection(expandedSection === 'network' ? null : 'network')}
            >
              <h3 className="text-lg font-medium">7. Network Connectivity Test</h3>
              <span>{expandedSection === 'network' ? '▼' : '▶'}</span>
            </div>

            {expandedSection === 'network' && (
              <div className="mt-2">
                <div className="mb-2">
                  <button
                    onClick={testNetworkConnectivity}
                    disabled={!sipInfo}
                    className={`px-3 py-1 rounded ${sipInfo ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    Run Network Tests
                  </button>
                </div>

                {Object.keys(networkTestResults).length > 0 && (
                  <div className="mt-2 bg-gray-100 p-2 rounded">
                    <h4 className="font-medium mb-1">Test Results:</h4>
                    <ul className="text-sm">
                      {Object.entries(networkTestResults).map(([key, result]) => (
                        <li key={key} className="mb-1">
                          {typeof result === 'boolean' ? (
                            result ?
                              <span className="text-green-600">✅ {key}: Success</span> :
                              <span className="text-red-600">❌ {key}: Failed</span>
                          ) : (
                            <span className="text-red-600">❌ {key}: {result}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex space-x-2">
            <button
              onClick={runFullInitialization}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Run Full Initialization
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-2">Debug Logs</h2>
          <div className="h-96 overflow-y-auto bg-gray-100 p-2 rounded font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Start the debugging process.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">Audio Elements</h3>
            <div className="flex space-x-4">
              <div>
                <p className="text-sm mb-1">Remote Audio:</p>
                <audio ref={remoteAudioRef} controls autoPlay />
              </div>
              <div>
                <p className="text-sm mb-1">Local Audio:</p>
                <audio ref={localAudioRef} controls muted />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
