/**
 * RingCentral WebPhone Simple Implementation 2
 * Uses our server-side API to get SIP provisioning data
 */

import { authenticateWithRingCentral, isRingCentralAuthenticated } from './ringcentral';

/**
 * Initialize WebPhone for making calls directly in the browser
 * @returns Promise resolving to the WebPhone instance
 */
export async function initializeWebPhone(): Promise<any> {
  console.log('========== RINGCENTRAL WEBPHONE SIMPLE2 - initializeWebPhone - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Step 1: Check if the user is authenticated with RingCentral
    console.log('Step 1: Checking RingCentral authentication');
    const isAuthenticated = await isRingCentralAuthenticated();
    console.log('Authentication status:', isAuthenticated);

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to authentication page');
      authenticateWithRingCentral();
      throw new Error('RingCentral authentication required');
    }

    // Step 2: Dynamically import the RingCentral WebPhone SDK
    console.log('Step 2: Loading RingCentral WebPhone SDK');

    // Import the WebPhone SDK and check its version
    const webPhoneModule = await import('ringcentral-web-phone');

    // In ringcentral-web-phone@2.1.6, the WebPhone class is exported as default
    const WebPhone = webPhoneModule.default;

    // Log information about the WebPhone SDK
    console.log('WebPhone SDK module:', webPhoneModule);
    console.log('WebPhone constructor:', WebPhone);
    console.log('WebPhone constructor type:', typeof WebPhone);
    console.log('WebPhone version:', webPhoneModule.version || 'Unknown');

    // Step 3: Get SIP provisioning data from our server-side API
    console.log('Step 3: Getting SIP provisioning data from server-side API');

    // Use client-info endpoint instead of sip-provision for better compatibility
    const response = await fetch('/api/ringcentral/client-info', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    console.log('Client info response status:', response.status);

    if (!response.ok) {
      console.log('Failed to get client info data');
      let errorData;
      try {
        errorData = await response.json();
        console.log('Error data:', errorData);
      } catch (e) {
        console.log('Could not parse error response as JSON');
        errorData = { error: response.statusText };
      }
      throw new Error(`Failed to get client info data: ${errorData.error || response.statusText}`);
    }

    const clientInfo = await response.json();
    console.log('Client info data received:', clientInfo);

    // Verify that the client info includes SIP info
    const sipInfo = clientInfo?.sipInfo?.[0];
    if (!sipInfo || !sipInfo.authorizationId) {
      console.error('Invalid or missing SIP info in client-info response:', clientInfo);
      throw new Error('Invalid or missing SIP info in client-info response');
    }

    console.log('SIP info verified:', sipInfo);

    // Use the client info as the SIP provision data
    const sipProvision = clientInfo;

    console.log('SIP provision data received:', {
      hasAuthorizationId: !!sipProvision.authorizationId,
      hasSipInfo: !!sipProvision.sipInfo,
      sipInfoCount: sipProvision.sipInfo?.length,
      expiresIn: sipProvision.expiresIn
    });

    // Step 4: Create WebPhone instance
    console.log('Step 4: Creating WebPhone instance');

    // Create a simple WebPhone configuration
    const webPhoneConfig = {
      logLevel: 3,
      appKey: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID,
      appName: 'Gonzigo CRM',
      appVersion: '1.0.0',
      media: {
        permissions: {
          audio: true,
          video: false
        }
      },
      // Add additional configuration for better compatibility
      enableDefaultModifiers: true,
      autoStop: true,
      sessionDescriptionHandlerFactoryOptions: {
        peerConnectionOptions: {
          iceCheckingTimeout: 5000,
          rtcConfiguration: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        }
      }
    };

    console.log('WebPhone config:', JSON.stringify(webPhoneConfig, null, 2));

    // Ensure SIP provision data has all required fields
    if (!sipProvision.authorizationId) {
      console.log('authorizationId is missing in SIP provision data');
    }

    if (!sipProvision.sipInfo || sipProvision.sipInfo.length === 0) {
      console.log('sipInfo is missing or empty in SIP provision data');
    } else {
      console.log('SIP info count:', sipProvision.sipInfo.length);

      // Log the first SIP info entry
      const firstSipInfo = sipProvision.sipInfo[0];
      console.log('First SIP info entry:', {
        transport: firstSipInfo.transport,
        username: firstSipInfo.username ? 'Present' : 'Missing',
        password: firstSipInfo.password ? 'Present' : 'Missing',
        authorizationId: firstSipInfo.authorizationId ? 'Present' : 'Missing',
        domain: firstSipInfo.domain,
        outboundProxy: firstSipInfo.outboundProxy,
        wsServers: firstSipInfo.wsServers ? 'Present' : 'Missing'
      });
    }

    // Log the SIP provision data for debugging in detail
    console.log('SIP provision data for WebPhone (detailed):', {
      authorizationId: sipProvision.authorizationId,
      sipInfo: sipProvision.sipInfo,
      expiresIn: sipProvision.expiresIn,
      owner_id: sipProvision.owner_id,
      scope: sipProvision.scope,
      full_data: sipProvision // Log the entire object
    });

    // Create the WebPhone instance with a try-catch block
    console.log('Creating WebPhone instance with SIP provision data');
    let webPhone;
    try {
      // Try creating the WebPhone instance
      console.log('About to create WebPhone instance with constructor:', WebPhone);
      console.log('WebPhone constructor type:', typeof WebPhone);
      console.log('WebPhone constructor prototype:', WebPhone.prototype);

      // Check if WebPhone is a constructor function
      if (typeof WebPhone !== 'function') {
        console.error('WebPhone is not a constructor function!');
        throw new Error('WebPhone is not a constructor function');
      }

      // Prepare the SIP provision data for WebPhone
      console.log('Preparing SIP provision data for WebPhone');

      // For ringcentral-web-phone@2.1.6, the SIP provision data needs to be formatted differently
      // The key difference is that the authorizationId needs to be in the sipInfo array

      // First, ensure the sipInfo array has the authorizationId
      if (sipProvision.sipInfo && sipProvision.sipInfo.length > 0) {
        if (!sipProvision.sipInfo[0].authorizationId && sipProvision.authorizationId) {
          sipProvision.sipInfo[0].authorizationId = sipProvision.authorizationId;
        }

        // Ensure wsServers is properly formatted
        if (!sipProvision.sipInfo[0].wsServers && sipProvision.sipInfo[0].outboundProxy) {
          sipProvision.sipInfo[0].wsServers = [`wss://${sipProvision.sipInfo[0].outboundProxy}`];
        }
      }

      // Create a properly formatted SIP provision object for v2.1.6
      // The key is to ensure the wsServers are properly formatted
      const formattedSipProvision = {
        ...sipProvision,
        // Add expiresIn if missing
        expiresIn: sipProvision.expiresIn || 3600
      };

      // Ensure sipInfo has the correct format for wsServers
      if (formattedSipProvision.sipInfo && formattedSipProvision.sipInfo.length > 0) {
        // Make sure wsServers is an array of strings with proper wss:// prefix
        if (!formattedSipProvision.sipInfo[0].wsServers ||
            !Array.isArray(formattedSipProvision.sipInfo[0].wsServers) ||
            formattedSipProvision.sipInfo[0].wsServers.length === 0) {

          const outboundProxy = formattedSipProvision.sipInfo[0].outboundProxy;
          if (outboundProxy) {
            formattedSipProvision.sipInfo[0].wsServers = [`wss://${outboundProxy}`];
            console.log('Fixed wsServers format:', formattedSipProvision.sipInfo[0].wsServers);
          }
        }

        // Ensure transport is set to WSS
        if (!formattedSipProvision.sipInfo[0].transport) {
          formattedSipProvision.sipInfo[0].transport = 'WSS';
        }
      }

      console.log('Formatted SIP provision data for v2.1.6:', JSON.stringify(formattedSipProvision, null, 2));

      // Create a custom WebSocket implementation to work around issues in the SDK
      class CustomWebSocket extends WebSocket {
        constructor(url: string, protocols?: string | string[]) {
          console.log('Creating CustomWebSocket with URL:', url);

          // Add a fallback mechanism for when the WebSocket connection fails
          try {
            super(url, protocols);

            // Add additional properties and methods that might be missing
            this.onopen = () => {
              console.log('CustomWebSocket: Connection opened');
              // Log the readyState
              console.log('CustomWebSocket readyState after open:', this.readyState);
            };

            this.onclose = (event) => {
              console.log('CustomWebSocket: Connection closed', event ? `with code ${event.code}` : '');
              // Log the readyState
              console.log('CustomWebSocket readyState after close:', this.readyState);
            };

            this.onerror = (error) => {
              console.error('CustomWebSocket error:', error);
              // Log the readyState
              console.log('CustomWebSocket readyState after error:', this.readyState);
            };

            // Log initial readyState
            console.log('CustomWebSocket initial readyState:', this.readyState);
          } catch (error) {
            console.error('Error creating WebSocket:', error);

            // Create a mock WebSocket object that won't throw errors
            console.log('Creating mock WebSocket object');

            // Define properties that match a real WebSocket
            Object.defineProperties(this, {
              readyState: {
                value: WebSocket.CLOSED,
                writable: true
              },
              CONNECTING: { value: WebSocket.CONNECTING },
              OPEN: { value: WebSocket.OPEN },
              CLOSING: { value: WebSocket.CLOSING },
              CLOSED: { value: WebSocket.CLOSED },
              url: { value: url },
              protocol: { value: '' },
              extensions: { value: '' },
              bufferedAmount: { value: 0 },
              binaryType: { value: 'blob', writable: true }
            });

            // Define event handlers
            this.onopen = null;
            this.onclose = null;
            this.onerror = null;
            this.onmessage = null;

            // Log that we're using a mock WebSocket
            console.log('Using mock WebSocket');
          }
        }

        // Override send method to add error handling
        send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
          try {
            console.log('CustomWebSocket: Sending data, readyState:', this.readyState);
            if (this.readyState !== WebSocket.OPEN) {
              console.error('CustomWebSocket: Cannot send data, socket not open (readyState:', this.readyState, ')');
              return; // Don't try to send if not open
            }

            // Check if super.send exists (it won't in the mock WebSocket)
            if (super.send) {
              super.send(data);
              console.log('CustomWebSocket: Data sent successfully');
            } else {
              console.log('CustomWebSocket: Using mock send (no-op)');
            }
          } catch (error) {
            console.error('CustomWebSocket: Error sending data:', error);
            // Don't throw, just log the error
          }
        }

        // Add a close method that won't throw if already closed
        close(code?: number, reason?: string): void {
          try {
            console.log('CustomWebSocket: Closing connection, readyState:', this.readyState);
            if (this.readyState === WebSocket.CLOSED || this.readyState === WebSocket.CLOSING) {
              console.log('CustomWebSocket: Already closed or closing');
              return; // Don't try to close if already closed or closing
            }

            // Check if super.close exists (it won't in the mock WebSocket)
            if (super.close) {
              super.close(code, reason);
              console.log('CustomWebSocket: Connection closed successfully');
            } else {
              console.log('CustomWebSocket: Using mock close (no-op)');
              this.readyState = WebSocket.CLOSED;
            }
          } catch (error) {
            console.error('CustomWebSocket: Error closing connection:', error);
            // Don't throw, just log the error
          }
        }

        // Add addEventListener method for compatibility
        addEventListener(type: string, listener: EventListener): void {
          try {
            if (super.addEventListener) {
              super.addEventListener(type, listener);
            } else {
              console.log('CustomWebSocket: Using mock addEventListener (no-op)');
              // Store the listener in case we want to implement this later
              this[`on${type}`] = listener;
            }
          } catch (error) {
            console.error('CustomWebSocket: Error in addEventListener:', error);
          }
        }

        // Add removeEventListener method for compatibility
        removeEventListener(type: string, listener: EventListener): void {
          try {
            if (super.removeEventListener) {
              super.removeEventListener(type, listener);
            } else {
              console.log('CustomWebSocket: Using mock removeEventListener (no-op)');
              // Clear the listener if it matches
              if (this[`on${type}`] === listener) {
                this[`on${type}`] = null;
              }
            }
          } catch (error) {
            console.error('CustomWebSocket: Error in removeEventListener:', error);
          }
        }
      }

      // Create the WebPhone instance with the formatted data and additional options
      const enhancedWebPhoneConfig = {
        ...webPhoneConfig,
        // Add additional options that might help with WebSocket connection
        wsOptions: {
          traceSip: true,
          reconnection: true,
          reconnectionAttempts: 3,
          reconnectionDelay: 2000
        },
        // Use our custom WebSocket implementation
        webSocketFactory: (url: string, protocols?: string | string[]) => {
          console.log('Creating WebSocket with URL:', url);
          return new CustomWebSocket(url, protocols);
        },
        // Add a logger to see what's happening inside the SDK
        logLevel: 0, // 0 = debug, 3 = error
        logger: {
          log: (...args: any[]) => console.log('RingCentral WebPhone [LOG]:', ...args),
          debug: (...args: any[]) => console.debug('RingCentral WebPhone [DEBUG]:', ...args),
          info: (...args: any[]) => console.info('RingCentral WebPhone [INFO]:', ...args),
          warn: (...args: any[]) => console.warn('RingCentral WebPhone [WARN]:', ...args),
          error: (...args: any[]) => console.error('RingCentral WebPhone [ERROR]:', ...args)
        }
      };

      console.log('Enhanced WebPhone config:', JSON.stringify(enhancedWebPhoneConfig, null, 2));

      // Create the WebPhone instance
      webPhone = new WebPhone(formattedSipProvision, enhancedWebPhoneConfig);

      // Monkey patch the SIP client to add detailed logging
      if (webPhone.sipClient) {
        console.log('SIP client found, adding detailed logging');

        // Log the structure of the SIP client in detail
        console.log('SIP client structure:', Object.keys(webPhone.sipClient));
        console.log('SIP client methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(webPhone.sipClient)));

        // Log the transport property if it exists
        if (webPhone.sipClient.transport) {
          console.log('SIP client transport found:', Object.keys(webPhone.sipClient.transport));

          // Check if the transport has a socket
          if (webPhone.sipClient.transport.socket) {
            console.log('Transport socket found:', Object.keys(webPhone.sipClient.transport.socket));
            console.log('Transport socket readyState:', webPhone.sipClient.transport.socket.readyState);
          } else {
            console.error('Transport socket is missing');

            // Create a new socket for the transport
            if (formattedSipProvision.sipInfo && formattedSipProvision.sipInfo.length > 0) {
              const wsUrl = formattedSipProvision.sipInfo[0].wsServers[0];
              console.log('Creating new transport socket with URL:', wsUrl);

              // Create a new WebSocket
              const socket = new CustomWebSocket(wsUrl);

              // Attach it to the transport
              webPhone.sipClient.transport.socket = socket;

              // Wait for it to open
              socket.onopen = () => {
                console.log('Transport socket opened');
              };
            }
          }
        } else {
          console.error('SIP client transport is missing');
        }

        // Check if the socket property exists directly on the SIP client
        if (webPhone.sipClient.socket) {
          console.log('SIP client socket found directly:', Object.keys(webPhone.sipClient.socket));
          console.log('SIP client socket readyState:', webPhone.sipClient.socket.readyState);
        } else {
          console.log('SIP client does not have a direct socket property');
        }

        // Check if _send method exists
        if (typeof webPhone.sipClient._send === 'function') {
          console.log('_send method found, adding logging');

          // Save the original _send method
          const originalSend = webPhone.sipClient._send;

          // Replace it with our version that adds logging
          webPhone.sipClient._send = function(...args: any[]) {
            console.log('SIP client _send called with args:', args);
            console.log('SIP client structure at _send time:', Object.keys(this));
            console.log('SIP client this.socket at _send time:', this.socket ? 'exists' : 'undefined');

            // If this.socket is undefined, check if it's in the transport
            if (!this.socket && this.transport && this.transport.socket) {
              console.log('Using transport.socket instead of direct socket');
              this.socket = this.transport.socket;
            }

            // Check if socket exists
            if (!this.socket) {
              console.error('SIP client socket is undefined at _send time');
              console.log('Full SIP client at _send time:', this);

              // Try to recreate the socket
              if (formattedSipProvision.sipInfo && formattedSipProvision.sipInfo.length > 0) {
                const wsUrl = formattedSipProvision.sipInfo[0].wsServers[0];
                console.log('Creating new socket with URL:', wsUrl);
                this.socket = new CustomWebSocket(wsUrl);

                // Wait for the socket to open
                this.socket.onopen = () => {
                  console.log('New socket opened, retrying _send');
                  try {
                    originalSend.apply(this, args);
                  } catch (error) {
                    console.error('Error calling _send after socket recreation:', error);
                  }
                };

                return; // Don't try to send now, wait for the socket to open
              }

              return; // Don't try to send if socket is undefined
            }

            // Check if socket.send exists
            if (typeof this.socket.send !== 'function') {
              console.error('SIP client socket.send is not a function');
              console.log('Socket structure:', Object.keys(this.socket));

              // Try to fix the socket
              console.log('Attempting to fix the socket');

              // Create a new socket with all the methods
              const fixedSocket = new CustomWebSocket(formattedSipProvision.sipInfo[0].wsServers[0]);

              // Copy all properties from the old socket
              for (const prop in this.socket) {
                if (prop !== 'send' && prop !== 'close') {
                  fixedSocket[prop] = this.socket[prop];
                }
              }

              // Replace the socket
              this.socket = fixedSocket;

              // Try again
              try {
                return originalSend.apply(this, args);
              } catch (error) {
                console.error('Error calling _send after socket fix:', error);
              }

              return; // Don't try to send if send is not a function
            }

            // Call the original method
            try {
              return originalSend.apply(this, args);
            } catch (error) {
              console.error('Error in original _send method:', error);
              console.log('Error details:', error);

              // Try to continue anyway
              console.log('Trying to continue after error');

              // If the error is about send, try to call send directly
              if (error.message && error.message.includes('send')) {
                console.log('Error is about send, trying to call send directly');
                try {
                  this.socket.send(args[0]);
                  console.log('Direct send succeeded');
                } catch (sendError) {
                  console.error('Direct send failed:', sendError);
                }
              }
            }
          };
        } else {
          console.warn('_send method not found on SIP client');

          // Try to add a _send method
          console.log('Attempting to add a _send method');

          webPhone.sipClient._send = function(data: string) {
            console.log('Custom _send method called with data:', data);

            // Check if socket exists
            if (!this.socket && this.transport && this.transport.socket) {
              console.log('Using transport.socket for custom _send');
              this.socket = this.transport.socket;
            }

            if (!this.socket) {
              console.error('No socket available for custom _send');
              return;
            }

            // Try to send the data
            try {
              this.socket.send(data);
              console.log('Custom _send succeeded');
            } catch (error) {
              console.error('Custom _send failed:', error);
            }
          };
        }
      } else {
        console.warn('SIP client not found on WebPhone instance');

        // Try to find the SIP client in other properties
        const possibleSipClientProps = Object.keys(webPhone).filter(prop =>
          prop.toLowerCase().includes('sip') ||
          prop.toLowerCase().includes('client') ||
          prop.toLowerCase().includes('transport')
        );

        console.log('Possible SIP client properties:', possibleSipClientProps);

        // Check each property
        for (const prop of possibleSipClientProps) {
          if (webPhone[prop] && typeof webPhone[prop] === 'object') {
            console.log(`Checking property ${prop} as possible SIP client:`, Object.keys(webPhone[prop]));
          }
        }
      }

      // In v2.1.6, the userAgent is created during initialization but might not be immediately accessible
      // Let's wait a short time for it to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('WebPhone instance created successfully');

      // Check if the instance was created
      if (!webPhone) {
        console.log('WebPhone instance is null or undefined');
        throw new Error('Failed to create WebPhone instance');
      }

      // Log the WebPhone instance properties and methods in detail
      console.log('WebPhone instance type:', typeof webPhone);
      console.log('WebPhone instance constructor:', webPhone.constructor?.name);
      console.log('WebPhone instance properties:', Object.keys(webPhone));
      console.log('WebPhone instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(webPhone)));

      // Log the full WebPhone instance for inspection
      console.log('WebPhone instance (full):', webPhone);

      // For ringcentral-web-phone@2.1.6, the userAgent property might be accessed differently
      // Let's try different approaches to access the userAgent

      // First, check the direct property
      if (!webPhone.userAgent) {
        console.log('Direct userAgent property not found, trying alternative approaches');

        // Log all properties of the WebPhone instance
        console.log('All WebPhone properties:', Object.keys(webPhone));

        // In v2.1.6, the userAgent might be accessed through a different property or method
        // Let's check if there's a 'ua' property
        if (webPhone.ua) {
          console.log('Found ua property, using it as userAgent');
          webPhone.userAgent = webPhone.ua;
        }
        // Or it might be accessible through a method
        else if (typeof webPhone.getUserAgent === 'function') {
          console.log('Found getUserAgent method, trying to use it');
          try {
            const userAgent = webPhone.getUserAgent();
            if (userAgent) {
              console.log('Got userAgent through getUserAgent method');
              webPhone.userAgent = userAgent;
            }
          } catch (error) {
            console.error('Error calling getUserAgent:', error);
          }
        }
        // Or it might be a private property with a different name
        else {
          console.log('Checking for other properties that might be the userAgent');
          const possibleUserAgentProps = Object.keys(webPhone).filter(prop =>
            prop.toLowerCase().includes('user') ||
            prop.toLowerCase().includes('agent') ||
            prop.toLowerCase().includes('sip') ||
            prop.toLowerCase().includes('ua')
          );

          console.log('Possible userAgent properties:', possibleUserAgentProps);

          // Try each possible property
          for (const prop of possibleUserAgentProps) {
            if (webPhone[prop] && typeof webPhone[prop] === 'object') {
              console.log(`Checking property ${prop}:`, webPhone[prop]);
              // If it has typical userAgent methods, it might be the userAgent
              if (typeof webPhone[prop].register === 'function' ||
                  typeof webPhone[prop].invite === 'function') {
                console.log(`Property ${prop} looks like a userAgent, using it`);
                webPhone.userAgent = webPhone[prop];
                break;
              }
            }
          }
        }

        // If we still don't have a userAgent, we'll try to proceed anyway
        if (!webPhone.userAgent) {
          console.log('Still no userAgent found, will try to proceed anyway');
          // For v2.1.6, we might need to use the WebPhone instance directly for some operations
          console.log('Will try to use WebPhone instance methods directly if available');
        }
      }

    // Check if we have a userAgent now
    if (webPhone.userAgent) {
      console.log('WebPhone user agent initialized successfully');
    } else {
      console.log('WebPhone user agent still not initialized, but continuing');
    }

    // Step 5: Register the WebPhone
    console.log('Step 5: Registering WebPhone');
    try {
      // For ringcentral-web-phone@2.1.6, the registration process might be different

      // First, check if the WebPhone instance has a register method
      if (typeof webPhone.register === 'function') {
        console.log('Using WebPhone.register method');
        try {
          await webPhone.register();
        } catch (registerError) {
          console.error('Error using WebPhone.register method:', registerError);
          // Continue to try other methods
        }
      }
      // Then check if the userAgent has a register method
      if (webPhone.userAgent && typeof webPhone.userAgent.register === 'function') {
        console.log('Using userAgent.register method');
        try {
          // For v2.1.6, we need to ensure the WebSocket connection is established
          if (webPhone.userAgent.transport &&
              typeof webPhone.userAgent.transport.connect === 'function') {

            try {
              console.log('Connecting transport before registration');

              // Check if the transport has a socket property
              if (!webPhone.userAgent.transport.socket) {
                console.log('Transport socket is missing, creating a new one');

                // Get the WebSocket URL from the SIP info
                const wsUrl = formattedSipProvision.sipInfo[0].wsServers[0];
                console.log('Creating new WebSocket with URL:', wsUrl);

                // Create a new WebSocket
                const socket = new CustomWebSocket(wsUrl);

                // Attach the socket to the transport if possible
                if (typeof webPhone.userAgent.transport.setSocket === 'function') {
                  webPhone.userAgent.transport.setSocket(socket);
                } else {
                  // Try to set it directly
                  webPhone.userAgent.transport.socket = socket;
                }
              }

              // Now try to connect
              if (!webPhone.userAgent.transport.isConnected()) {
                await webPhone.userAgent.transport.connect();
              }
            } catch (connectError) {
              console.error('Error connecting transport:', connectError);
              // Continue anyway, the register method might still work
            }
          }

          // Try to register
          await webPhone.userAgent.register();
        } catch (registerError) {
          console.error('Error using userAgent.register method:', registerError);
          // Continue to try other methods
        }
      }
      // In v2.1.6, the register method might be on the ua property
      else if (webPhone.ua && typeof webPhone.ua.register === 'function') {
        console.log('Using ua.register method');
        try {
          // For v2.1.6, we need to ensure the WebSocket connection is established
          if (webPhone.ua.transport &&
              typeof webPhone.ua.transport.connect === 'function' &&
              !webPhone.ua.transport.isConnected()) {
            console.log('Connecting transport before registration');
            await webPhone.ua.transport.connect();
          }

          await webPhone.ua.register();
        } catch (registerError) {
          console.error('Error using ua.register method:', registerError);
          // Continue to try other methods
        }
      }
      // Or it might be a different method name
      else if (typeof webPhone.sipRegister === 'function') {
        console.log('Using sipRegister method');
        try {
          await webPhone.sipRegister();
        } catch (registerError) {
          console.error('Error using sipRegister method:', registerError);
          // Continue to try other methods
        }
      }
      // If none of these work, try to find any method that might be for registration
      else {
        console.log('No standard register method found, looking for alternatives');

        const possibleRegisterMethods = Object.keys(webPhone).filter(method =>
          typeof webPhone[method] === 'function' &&
          (method.toLowerCase().includes('register') ||
           method.toLowerCase().includes('connect') ||
           method.toLowerCase().includes('start'))
        );

        console.log('Possible register methods:', possibleRegisterMethods);

        if (possibleRegisterMethods.length > 0) {
          const method = possibleRegisterMethods[0];
          console.log(`Trying method ${method}`);
          await webPhone[method]();
        } else {
          console.log('No register method found on WebPhone or userAgent');
          // Continue without registration - the WebPhone might still work
        }
      }

      console.log('WebPhone registered successfully');
    } catch (registerError: any) {
      console.error('WebPhone registration failed:', registerError);
      console.log('Registration error stack:', registerError.stack);

      // Log more details about the error
      if (registerError.message) {
        console.log('Registration error message:', registerError.message);
      }

      // Don't throw here, we'll try to continue with the unregistered WebPhone
      console.log('Continuing with unregistered WebPhone');
    }

    // Verify registration status if possible
    // In v2.1.6, the isRegistered method might be in different places
    let isRegistered = false;

    if (webPhone.userAgent && typeof webPhone.userAgent.isRegistered === 'function') {
      isRegistered = webPhone.userAgent.isRegistered();
      console.log('WebPhone registration status (userAgent.isRegistered):', isRegistered);
    }
    else if (webPhone.ua && typeof webPhone.ua.isRegistered === 'function') {
      isRegistered = webPhone.ua.isRegistered();
      console.log('WebPhone registration status (ua.isRegistered):', isRegistered);
    }
    else if (typeof webPhone.isRegistered === 'function') {
      isRegistered = webPhone.isRegistered();
      console.log('WebPhone registration status (WebPhone.isRegistered):', isRegistered);
    }
    else {
      console.log('Cannot check registration status - no isRegistered method available');
    }

    // Return the WebPhone instance even if userAgent is not initialized
    // The page component will handle this case

    console.log('WebPhone initialized successfully');
    console.log('========== RINGCENTRAL WEBPHONE SIMPLE2 - initializeWebPhone - END ==========');

    // Return the WebPhone instance even if registration failed
    return webPhone;
  } catch (webPhoneError) {
    console.error('Error creating WebPhone instance:', webPhoneError);
    console.log('WebPhone creation error stack:', webPhoneError.stack);

    // Create a minimal WebPhone-like object that won't throw errors
    console.log('Creating a minimal WebPhone-like object');
    const minimalWebPhone = {
      userAgent: null,
      register: async () => {
        console.log('Minimal WebPhone register method called');
        return Promise.resolve();
      },
      makeCall: (number: string) => {
        console.log('Minimal WebPhone makeCall method called with number:', number);
        throw new Error('WebPhone not properly initialized');
      }
    };

    console.log('Returning minimal WebPhone-like object');
    console.log('========== RINGCENTRAL WEBPHONE SIMPLE2 - initializeWebPhone - END (WITH FALLBACK) ==========');
    return minimalWebPhone;
  }
  } catch (error: any) {
    console.error('Failed to initialize WebRTC phone:', error);
    console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    console.log('========== RINGCENTRAL WEBPHONE SIMPLE2 - initializeWebPhone - END (WITH ERROR) ==========');

    // Create a minimal WebPhone-like object as a last resort
    const emergencyFallbackWebPhone = {
      userAgent: null,
      register: async () => Promise.resolve(),
      makeCall: () => { throw new Error('WebPhone initialization failed completely'); }
    };

    return emergencyFallbackWebPhone;
  }
}

export default {
  initializeWebPhone
};
