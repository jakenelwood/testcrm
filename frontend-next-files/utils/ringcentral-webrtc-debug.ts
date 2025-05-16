/**
 * RingCentral WebRTC Debugging Utilities
 * This file contains utility functions for debugging RingCentral WebRTC issues
 */

/**
 * Log a debugging step with a title and data
 * @param title The title of the debugging step
 * @param data The data to log
 */
export function logStep(title: string, data: any): void {
  console.log(`🔍 DEBUG [${title}]:`, data);

  // Add more detailed logging for specific types of data
  if (title === 'SIP Info' && data) {
    console.log('  - authorizationId:', !!data.authorizationId);
    console.log('  - domain:', data.domain);
    console.log('  - outboundProxy:', data.outboundProxy);
    console.log('  - transport:', data.transport);
    console.log('  - wsServers:', data.wsServers);
    console.log('  - userName:', !!data.userName);
    console.log('  - password:', !!data.password);
  } else if (title === 'WebSocket ReadyState' && typeof data === 'number') {
    const states = ['CONNECTING (0)', 'OPEN (1)', 'CLOSING (2)', 'CLOSED (3)'];
    console.log(`  - ${states[data] || `UNKNOWN (${data})`}`);
  }
}

/**
 * Validate SIP info for WebRTC
 * @param sipInfo The SIP info object to validate
 * @returns An object with validation results
 */
export function validateSipInfo(sipInfo: any): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!sipInfo) {
    return { valid: false, issues: ['SIP info is null or undefined'] };
  }

  // Check required fields
  if (!sipInfo.authorizationId) {
    issues.push('Missing authorizationId in SIP info');
  }

  if (!sipInfo.domain) {
    issues.push('Missing domain in SIP info');
  }

  if (!sipInfo.outboundProxy) {
    issues.push('Missing outboundProxy in SIP info');
  }

  // Check for userName or username (RingCentral API sometimes uses lowercase)
  if (!sipInfo.userName && !sipInfo.username) {
    issues.push('Missing userName/username in SIP info');
  }

  if (!sipInfo.password) {
    issues.push('Missing password in SIP info');
  }

  // Check for wsServers (critical for WebSocket connection)
  if (!sipInfo.wsServers || !Array.isArray(sipInfo.wsServers) || sipInfo.wsServers.length === 0) {
    issues.push('Missing or invalid wsServers in SIP info');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Check WebSocket connection status
 * @param webPhone The WebPhone instance
 * @returns An object with connection status and details
 */
export function checkWebSocketConnection(webPhone: any): { connected: boolean; details: any } {
  if (!webPhone) {
    return {
      connected: false,
      details: { error: 'WebPhone instance is null or undefined' }
    };
  }

  // Try to find the userAgent through various properties
  let userAgent = null;

  if (webPhone.userAgent) {
    userAgent = webPhone.userAgent;
  } else if ((webPhone as any).ua) {
    userAgent = (webPhone as any).ua;
  } else if ((webPhone as any).sipClient?.userAgent) {
    userAgent = (webPhone as any).sipClient.userAgent;
  } else if ((webPhone as any).client?.userAgent) {
    userAgent = (webPhone as any).client.userAgent;
  } else if ((webPhone as any)._ua) {
    userAgent = (webPhone as any)._ua;
  } else {
    // Last resort: try to find any property that might be the userAgent
    for (const key in webPhone) {
      const prop = (webPhone as any)[key];
      if (prop && typeof prop === 'object' &&
          ((typeof prop.register === 'function') ||
           (prop.transport && prop.transport.ws))) {
        userAgent = prop;
        break;
      }
    }
  }

  if (!userAgent) {
    return {
      connected: false,
      details: { error: 'WebPhone userAgent not found in any property' }
    };
  }

  // Try to find the transport through various properties
  let transport = null;

  if (userAgent.transport) {
    transport = userAgent.transport;
  } else if ((userAgent as any).connection) {
    transport = (userAgent as any).connection;
  } else if ((userAgent as any).transportLayer) {
    transport = (userAgent as any).transportLayer;
  } else {
    // Last resort: try to find any property that might be the transport
    for (const key in userAgent) {
      const prop = (userAgent as any)[key];
      if (prop && typeof prop === 'object' &&
          ((typeof prop.isConnected === 'function') ||
           (prop.ws))) {
        transport = prop;
        break;
      }
    }
  }

  if (!transport) {
    return {
      connected: false,
      details: {
        error: 'WebPhone transport not found',
        userAgentFound: true
      }
    };
  }

  // Check if the transport is connected
  let isConnected = false;

  if (typeof transport.isConnected === 'function') {
    try {
      isConnected = transport.isConnected();
    } catch (e) {
      console.warn('Error calling transport.isConnected():', e);
    }
  }

  // Check WebSocket state
  let ws = null;
  let wsReadyState = -1;

  if (transport.ws) {
    ws = transport.ws;
  } else if ((transport as any).socket) {
    ws = (transport as any).socket;
  } else if ((transport as any).connection) {
    ws = (transport as any).connection;
  }

  if (ws) {
    wsReadyState = ws.readyState;

    // If isConnected is false but WebSocket is OPEN, override isConnected
    if (!isConnected && wsReadyState === 1) {
      isConnected = true;
    }
  }

  // Determine WebSocket state text
  const wsReadyStateText = wsReadyState === 0 ? 'CONNECTING' :
                          wsReadyState === 1 ? 'OPEN' :
                          wsReadyState === 2 ? 'CLOSING' :
                          wsReadyState === 3 ? 'CLOSED' : 'UNKNOWN';

  return {
    connected: isConnected,
    details: {
      isConnected,
      wsReadyState,
      wsReadyStateText,
      hasUserAgent: !!userAgent,
      hasTransport: !!transport,
      hasWebSocket: !!ws
    }
  };
}

/**
 * Comprehensive WebRTC diagnostic check
 * @param webPhone The WebPhone instance
 * @param sipInfo The SIP info object
 * @returns An object with diagnostic results
 */
export function runWebRTCDiagnostics(webPhone: any, sipInfo: any): {
  success: boolean;
  issues: string[];
  details: any;
} {
  const issues: string[] = [];
  const details: any = {};

  // Step 1: Validate SIP info
  try {
    const sipValidation = validateSipInfo(sipInfo);
    details.sipValidation = sipValidation;

    if (!sipValidation.valid) {
      issues.push(...sipValidation.issues);
    }
  } catch (error) {
    issues.push(`Error validating SIP info: ${error.message}`);
    details.sipValidationError = error.message;
  }

  // Step 2: Check WebPhone instance
  if (!webPhone) {
    issues.push('WebPhone instance is null or undefined');
    return { success: false, issues, details };
  }

  // Step 3: Find userAgent through various properties
  let userAgent = null;

  try {
    if (webPhone.userAgent) {
      userAgent = webPhone.userAgent;
      details.userAgentSource = 'webPhone.userAgent';
    } else if ((webPhone as any).ua) {
      userAgent = (webPhone as any).ua;
      details.userAgentSource = 'webPhone.ua';
    } else if ((webPhone as any).sipClient?.userAgent) {
      userAgent = (webPhone as any).sipClient.userAgent;
      details.userAgentSource = 'webPhone.sipClient.userAgent';
    } else if ((webPhone as any).client?.userAgent) {
      userAgent = (webPhone as any).client.userAgent;
      details.userAgentSource = 'webPhone.client.userAgent';
    } else if ((webPhone as any)._ua) {
      userAgent = (webPhone as any)._ua;
      details.userAgentSource = 'webPhone._ua';
    } else {
      // Last resort: try to find any property that might be the userAgent
      for (const key in webPhone) {
        const prop = (webPhone as any)[key];
        if (prop && typeof prop === 'object' &&
            ((typeof prop.register === 'function') ||
             (prop.transport && prop.transport.ws))) {
          userAgent = prop;
          details.userAgentSource = `webPhone.${key}`;
          break;
        }
      }
    }

    details.userAgentFound = !!userAgent;

    if (!userAgent) {
      issues.push('WebPhone userAgent not found in any property');
    }
  } catch (error) {
    issues.push(`Error finding userAgent: ${error.message}`);
    details.userAgentError = error.message;
  }

  // Step 4: Check WebSocket connection
  try {
    const wsConnection = checkWebSocketConnection(webPhone);
    details.wsConnection = wsConnection;

    if (!wsConnection.connected) {
      issues.push(`WebSocket not connected: ${wsConnection.details.wsReadyStateText}`);
    }
  } catch (error) {
    issues.push(`Error checking WebSocket connection: ${error.message}`);
    details.wsConnectionError = error.message;
  }

  // Step 5: Check if register method exists and was called
  try {
    const hasRegisterMethod = typeof webPhone.register === 'function' ||
                             (userAgent && typeof userAgent.register === 'function');

    details.hasRegisterMethod = hasRegisterMethod;

    if (!hasRegisterMethod) {
      issues.push('WebPhone does not have a register method');
    }
  } catch (error) {
    issues.push(`Error checking register method: ${error.message}`);
    details.registerMethodError = error.message;
  }

  // Step 6: Check audio capabilities
  try {
    const hasAudioHelper = !!(webPhone.audioHelper || userAgent?.audioHelper);
    details.hasAudioHelper = hasAudioHelper;

    if (!hasAudioHelper) {
      issues.push('WebPhone does not have an audioHelper');
    }
  } catch (error) {
    issues.push(`Error checking audio capabilities: ${error.message}`);
    details.audioHelperError = error.message;
  }

  // Step 7: Check browser compatibility
  try {
    const isWebRTCSupported = !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );

    details.isWebRTCSupported = isWebRTCSupported;

    if (!isWebRTCSupported) {
      issues.push('Browser does not support WebRTC');
    }
  } catch (error) {
    issues.push(`Error checking browser compatibility: ${error.message}`);
    details.browserCompatibilityError = error.message;
  }

  return {
    success: issues.length === 0,
    issues,
    details
  };
}

export default {
  logStep,
  validateSipInfo,
  checkWebSocketConnection,
  runWebRTCDiagnostics
};
