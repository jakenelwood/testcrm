// RingCentral API integration

// This file needs to be converted to a server-side API route in Next.js
// to keep your RingCentral credentials secure.
// For simplicity, we're defining the configuration here, but in production
// these should be environment variables.

import { type RingCentralClient } from './ringcentral-client';
// import { type RingCentralInterface } from '@/types/ringcentral'; // Commented out
import { type SupabaseClient } from '@supabase/supabase-js';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { NEXT_PUBLIC_APP_URL } from '@/lib/ringcentral/config'; // Keep this import
/* Commented out problematic import block
import {
  createRingCentralInstance,
  createSupabaseClient,
  getRingCentralTokensFromSupabase,
  getValidAccessToken,
  storeRingCentralTokensInSupabase,
} from '@/lib/ringcentral'; // Ensure this path is correct
*/
import {
  RINGCENTRAL_NOT_AUTHENTICATED_ERROR, // Kept
  UNKNOWN_ERROR_OCCURRED, // Kept
  // RINGCENTRAL_AUTH_CHECK_ERROR, // Removed
  // RINGCENTRAL_AUTH_ERROR, // Removed
  // RINGCENTRAL_TOKEN_REFRESH_ERROR, // Removed
} from '@/lib/constants';

/**
 * Get RingCentral tokens from cookies
 * @param cookies The cookies object from Next.js
 * @returns Object containing access_token, refresh_token, and expires_at
 */
export function getTokensFromCookies(cookies: ReadonlyRequestCookies) {
  const access_token = cookies.get('rc_access_token')?.value;
  const refresh_token = cookies.get('rc_refresh_token')?.value;
  const expires_at_str = cookies.get('rc_expires_at')?.value;
  const expires_at = expires_at_str ? parseInt(expires_at_str, 10) : undefined;

  return {
    access_token,
    refresh_token,
    expires_at
  };
}

interface RingCentralConfig {
  clientId: string;
  server: string;
}

// Default configuration - to be replaced with your actual credentials
const config: RingCentralConfig = {
  clientId: process.env.RINGCENTRAL_CLIENT_ID || process.env.CLIENT_ID || 'YOUR_CLIENT_ID',
  server: process.env.RINGCENTRAL_SERVER || process.env.RC_API_BASE || 'https://platform.ringcentral.com',
};

// WebRTC configuration
export const WEBRTC_CONFIG = {
  logLevel: 3, // Debug level for more detailed logs
  audioHelper: {
    enabled: true,
    incoming: true,
    outgoing: true
  },
  enableQosLogging: true,
  // Required parameters for WebRTC
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

/**
 * Check if the user is authenticated with RingCentral
 * @returns Promise resolving to true if authenticated, false otherwise
 */
export async function isRingCentralAuthenticated(): Promise<boolean> {
  console.log('========== RINGCENTRAL UTILITY - isRingCentralAuthenticated - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    console.log('Making authentication check request to /api/ringcentral/auth?action=check');
    const response = await fetch(`${NEXT_PUBLIC_APP_URL}/api/ringcentral/auth?action=check`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Include credentials to send cookies
      credentials: 'include'
    });

    console.log('Authentication check response status:', response.status);
    console.log('Authentication check response status text:', response.statusText);

    if (!response.ok) {
      console.warn('RingCentral auth check failed:', response.statusText);

      // If we get a 401 Unauthorized, try to refresh the token
      if (response.status === 401) {
        console.log('Attempting to refresh token due to 401 response');
        const refreshResponse = await fetch(`${NEXT_PUBLIC_APP_URL}/api/ringcentral/auth?action=refresh`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });

        if (refreshResponse.ok) {
          console.log('Token refresh successful, rechecking authentication');
          // Retry the authentication check after successful refresh
          return isRingCentralAuthenticated();
        } else {
          let refreshErrorData;
          try {
            refreshErrorData = await refreshResponse.json();
            console.log('Token refresh failed:', refreshErrorData);

            // If token is revoked, redirect to authentication
            if (refreshErrorData.revoked ||
                (refreshErrorData.error && refreshErrorData.error.includes('revoked'))) {
              console.log('Token is revoked, redirecting to authentication');
              authenticateWithRingCentral();
            }
          } catch (e) {
            console.log('Could not parse refresh error response:', e);
          }
        }
      }

      try {
        const errorText = await response.text();
        console.log('Raw error response text:', errorText);
      } catch (e) {
        console.log('Could not get raw error response text.');
      }
      console.log('========== RINGCENTRAL UTILITY - isRingCentralAuthenticated - END (NOT OK) ==========');
      return false;
    }

    // Log raw response text before parsing
    let rawResponseText = '';
    try {
      rawResponseText = await response.text(); // Read text
      console.log('[RC_AUTH_CHECK_CLIENT] Raw response text:', rawResponseText);
    } catch (e) {
      console.error('[RC_AUTH_CHECK_CLIENT] Error reading raw response text:', e);
      console.log('========== RINGCENTRAL UTILITY - isRingCentralAuthenticated - END (RAW TEXT READ ERROR) ==========');
      return false;
    }

    let data;
    try {
      data = JSON.parse(rawResponseText); // Parse the already read text
    } catch (e) {
      console.error('[RC_AUTH_CHECK_CLIENT] Error parsing JSON from raw text:', e);
      console.log('[RC_AUTH_CHECK_CLIENT] Raw text that failed to parse:', rawResponseText);
      console.log('========== RINGCENTRAL UTILITY - isRingCentralAuthenticated - END (JSON PARSE ERROR) ==========');
      return false;
    }

    console.log('[RC_AUTH_CHECK_CLIENT] Parsed response data (stringified):', JSON.stringify(data, null, 2));
    console.log('[RC_AUTH_CHECK_CLIENT] Type of data.isAuthenticated:', typeof data.isAuthenticated, 'Value:', data.isAuthenticated);

    const isAuthenticated = data.isAuthenticated === true; // Strict check
    console.log('Authentication result:', isAuthenticated);
    console.log('========== RINGCENTRAL UTILITY - isRingCentralAuthenticated - END ==========');
    return isAuthenticated;
  } catch (error) {
    console.log('Error during authentication check:');
    console.error('Failed to check RingCentral authentication:', error);
    console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    console.log('========== RINGCENTRAL UTILITY - isRingCentralAuthenticated - END (ERROR) ==========');
    return false;
  }
}

/**
 * Alias for isRingCentralAuthenticated for backward compatibility
 */
export const checkRingCentralAuth = isRingCentralAuthenticated;

const MAX_LOGIN_ATTEMPTS = 3;

/**
 * Redirect to RingCentral for authentication
 * @param redirectPath Optional path to redirect to after authentication
 */
export function authenticateWithRingCentral(redirectPath?: string) {
  // Redirect to the authentication page
  const redirectParam = redirectPath ? `&redirect=${encodeURIComponent(redirectPath)}` : '';
  // Use NEXT_PUBLIC_APP_URL to ensure the auth flow starts on the canonical domain
  window.location.href = `${NEXT_PUBLIC_APP_URL}/api/ringcentral/auth?action=authorize${redirectParam}`;
}

/**
 * Log out from RingCentral
 */
export async function logoutFromRingCentral(): Promise<boolean> {
  try {
    const response = await fetch(`${NEXT_PUBLIC_APP_URL}/api/ringcentral/auth?action=logout`, {
      credentials: 'include' // Ensure cookies are sent for logout
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to logout from RingCentral:', error);
    return false;
  }
}

/**
 * Make a phone call using RingCentral
 * @param toNumber The phone number to call
 * @param fromNumber Optional phone number to call from (defaults to the one in .env)
 * @returns Promise resolving to the call result
 */
export async function makeCall(toNumber: string, fromNumber?: string): Promise<any> {
  console.log('========== RINGCENTRAL UTILITY - makeCall - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Parameters:', { toNumber, fromNumber });

  try {
    // Check if the user is authenticated with RingCentral
    console.log('Step 1: Checking RingCentral authentication');
    const isAuthenticated = await isRingCentralAuthenticated();
    console.log('Authentication status:', isAuthenticated);

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to authentication page');
      authenticateWithRingCentral();
      throw new Error('RingCentral authentication required');
    }

    // Make the call using the App Router API
    console.log('Step 2: Making API call to /api/ringcentral/call');
    const requestBody = { phoneNumber: toNumber };
    console.log('Request body:', requestBody);

    const response = await fetch(`${NEXT_PUBLIC_APP_URL}/api/ringcentral/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      credentials: 'include' // Ensure cookies are sent
    });

    console.log('Step 3: Processing API response');
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);

    if (!response.ok) {
      console.log('Step 3A: Handling error response');
      let errorData: any;

      try {
        errorData = await response.json();
        console.log('Error response body:', errorData);
      } catch (e) {
        console.log('Error parsing JSON response:', e);
        throw new Error(`RingCentral call failed: ${response.statusText}`);
      }

      // If authentication is required, redirect to auth page
      if (response.status === 401 && errorData.redirect) {
        console.log('Authentication required, redirecting to:', errorData.redirect);
        window.location.href = errorData.redirect;
        throw new Error('RingCentral authentication required');
      }

      throw new Error(`RingCentral call failed: ${errorData.error || response.statusText}`);
    }

    console.log('Step 3B: Processing successful response');
    const responseData = await response.json();
    console.log('Response data:', responseData);
    console.log('========== RINGCENTRAL UTILITY - makeCall - END ==========');

    return responseData;
  } catch (error) {
    console.log('Step X: Caught exception in makeCall');
    console.error('Failed to make RingCentral call:', error);
    console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    console.log('========== RINGCENTRAL UTILITY - makeCall - END (WITH ERROR) ==========');
    throw error;
  }
}

/**
 * Alias for makeCall for backward compatibility
 * Note: The parameter order is toNumber, fromNumber to match the makeCall function
 */
export const makeRingCentralCall = (toNumber: string, fromNumber?: string): Promise<any> =>
  makeCall(toNumber, fromNumber);

/**
 * Send an SMS message using RingCentral
 * @param toNumber The phone number to send the SMS to
 * @param text The text message to send
 * @param fromNumber Optional phone number to send from (defaults to the one in .env)
 * @returns Promise resolving to the SMS result
 */
export async function sendSMS(toNumber: string, text: string, fromNumber?: string): Promise<any> {
  try {
    // Check if the user is authenticated with RingCentral
    const isAuthenticated = await isRingCentralAuthenticated();
    if (!isAuthenticated) {
      authenticateWithRingCentral();
      throw new Error('RingCentral authentication required');
    }

    // Send the SMS using the App Router API
    const response = await fetch(`${NEXT_PUBLIC_APP_URL}/api/ringcentral/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: toNumber,
        message: text,
        fromNumber: fromNumber || process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER
      }),
      credentials: 'include' // Ensure cookies are sent
    });

    if (!response.ok) {
      const errorData = await response.json();

      // If authentication is required, redirect to auth page
      if (response.status === 401 && errorData.redirect) {
        window.location.href = errorData.redirect;
        throw new Error('RingCentral authentication required');
      }

      throw new Error(`RingCentral SMS failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send RingCentral SMS:', error);
    throw error;
  }
}

/**
 * Alias for sendSMS for backward compatibility
 * Note: The parameter order is fromNumber, toNumber, text to maintain backward compatibility
 */
export const sendRingCentralSMS = (fromNumber: string, toNumber: string, text: string): Promise<any> =>
  sendSMS(toNumber, text, fromNumber);

/**
 * Initialize WebRTC phone for making calls directly in the browser
 * @returns Promise resolving to the WebPhone instance
 */
export async function initializeWebRTCPhone(): Promise<any> {
  console.log('========== RINGCENTRAL UTILITY - initializeWebRTCPhone - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Check if the user is authenticated with RingCentral
    console.log('Step 1: Checking RingCentral authentication');
    const isAuthenticated = await isRingCentralAuthenticated();
    console.log('Authentication status:', isAuthenticated);

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to authentication page');
      authenticateWithRingCentral();
      throw new Error('RingCentral authentication required');
    }

    // Get the access token from the server
    console.log('Step 2: Getting access token');
    const response = await fetch(`${NEXT_PUBLIC_APP_URL}/api/ringcentral/auth?action=token`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    console.log('Token response status:', response.status);

    if (!response.ok) {
      console.log('Failed to get access token');
      throw new Error('Failed to get access token');
    }

    const tokenData = await response.json();
    console.log('Token data received:', {
      authenticated: tokenData.authenticated,
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      hasExpiresAt: !!tokenData.expires_at
    });

    if (!tokenData.authenticated || !tokenData.access_token) {
      console.log('No valid access token available');
      throw new Error('No valid access token available');
    }

    // Dynamically import the RingCentral SDK
    console.log('Step 3: Loading RingCentral SDK');
    const { SDK } = await import('@ringcentral/sdk');
    const WebPhone = (await import('ringcentral-web-phone')).default;

    // Create RingCentral SDK instance
    console.log('Step 4: Creating RingCentral SDK instance');
    const sdk = new SDK({
      server: process.env.NEXT_PUBLIC_RINGCENTRAL_SERVER || 'https://platform.ringcentral.com',
      clientId: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_SECRET
    });

    // Initialize platform with the access token
    console.log('Step 5: Initializing platform with access token');
    const platform = sdk.platform();

    // Set the auth data
    await platform.auth().setData({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_at ? Math.floor((tokenData.expires_at - Date.now()) / 1000) : 3600,
      token_type: tokenData.token_type || 'bearer'
    });

    // Create a very simple WebPhone configuration
    const webPhoneConfig = {
      logLevel: 3, // Debug level for more detailed logs
      appKey: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID,
      appName: 'Gonzigo CRM',
      appVersion: '1.0.0',
      media: {
        permissions: {
          audio: true,
          video: false
        }
      }
    };

    console.log('WebPhone config:', JSON.stringify(webPhoneConfig, null, 2));

    // Following the official RingCentral WebPhone example
    console.log('Step 6: Creating WebPhone instance directly with platform');
    try {
      // Create the WebPhone instance directly with the platform
      // This is the recommended approach from the RingCentral WebPhone documentation
      const webPhone = new WebPhone(platform, webPhoneConfig);

      console.log('WebPhone instance created successfully');

      if (!webPhone) {
        throw new Error('Failed to create WebPhone instance');
      }

      // Check if userAgent is initialized
      if (!webPhone.userAgent) {
        throw new Error('WebPhone user agent not initialized');
      }

      console.log('WebPhone user agent initialized successfully');

      // Set up event listeners for the WebPhone
      console.log('Setting up WebPhone event listeners');
      webPhone.userAgent.on('registered', () => {
        console.log('WebPhone registered with SIP server');
      });

      webPhone.userAgent.on('registrationFailed', (e: any) => {
        console.error('WebPhone registration failed:', e);
      });

      webPhone.userAgent.on('unregistered', () => {
        console.log('WebPhone unregistered from SIP server');
      });

      webPhone.userAgent.on('invite', (_session: any) => {
        console.log('Incoming call received');
      });

      // CRITICAL STEP: Register the WebPhone with the SIP server
      console.log('Step 7: Registering WebPhone with SIP server');
      try {
        // This is the crucial step that was missing!
        // We must call register() to initialize the SIP user agent
        // Use type assertion to handle TypeScript error
        await (webPhone as any).register();
        console.log('WebPhone registered successfully');
      } catch (registerError: any) {
        console.error('WebPhone registration failed:', registerError);
        console.log('Registration error details:', registerError.message);
        console.log('Registration error stack:', registerError.stack);
        throw new Error(`WebPhone registration failed: ${registerError.message}`);
      }

      console.log('WebPhone initialized and registered successfully');
      console.log('========== RINGCENTRAL UTILITY - initializeWebRTCPhone - END ==========');

      return webPhone;
    } catch (error: any) {
      console.error('Error initializing WebPhone:', error);
      console.log('Error stack:', error.stack);

      // Check for specific error types
      if (error.message && error.message.includes('ReadAccounts')) {
        throw new Error('Failed to initialize WebPhone: In order to call this API endpoint, application needs to have [ReadAccounts] permission. Please log out and re-authenticate with the proper permissions.');
      }

      throw new Error(`Failed to initialize WebPhone: ${error.message}`);
    }
  } catch (error: any) {
    console.log('Error initializing WebPhone:');
    console.error('Failed to initialize WebRTC phone:', error);
    console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    console.log('========== RINGCENTRAL UTILITY - initializeWebRTCPhone - END (WITH ERROR) ==========');
    throw error;
  }
}

export default {
  config,
  isRingCentralAuthenticated,
  checkRingCentralAuth,
  authenticateWithRingCentral,
  logoutFromRingCentral,
  makeCall,
  makeRingCentralCall,
  sendSMS,
  sendRingCentralSMS,
  initializeWebRTCPhone,
  WEBRTC_CONFIG
};