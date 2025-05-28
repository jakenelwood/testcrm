/**
 * RingCentral Configuration
 *
 * Centralized configuration for all RingCentral-related settings.
 * This follows the DRY principle by defining all RingCentral settings in one place.
 */

// Server URL
export const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com';

// Authentication
export const RINGCENTRAL_CLIENT_ID = process.env.RINGCENTRAL_CLIENT_ID;
export const RINGCENTRAL_CLIENT_SECRET = process.env.RINGCENTRAL_CLIENT_SECRET;
export const RINGCENTRAL_USERNAME = process.env.RINGCENTRAL_USERNAME;
export const RINGCENTRAL_EXTENSION = process.env.RINGCENTRAL_EXTENSION;
export const RINGCENTRAL_PASSWORD = process.env.RINGCENTRAL_PASSWORD;

// Phone Numbers
export const RINGCENTRAL_FROM_NUMBER = process.env.RINGCENTRAL_FROM_NUMBER || process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER;

// OAuth - Determine base URL and redirect URI
// Prioritize environment variables for production, fallback for local development.

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// NEXT_PUBLIC_APP_URL: Use environment variable if set.
// Fallback to 'https://crm-jakenelwoods-projects.vercel.app' in production if not set (though it should always be set in Vercel).
// Fallback to 'http://localhost:3000' in development.
export const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ||
  (IS_PRODUCTION ? 'https://crm-jakenelwoods-projects.vercel.app' : 'http://localhost:3000');

// REDIRECT_URI: Use environment variable if set, otherwise construct from NEXT_PUBLIC_APP_URL.
// This ensures Vercel's REDIRECT_URI environment variable is used if present.
export const REDIRECT_URI = process.env.REDIRECT_URI || `${NEXT_PUBLIC_APP_URL}/oauth-callback`;

// Client-side config (for WebRTC)
export const NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID = RINGCENTRAL_CLIENT_ID;
export const NEXT_PUBLIC_RINGCENTRAL_SERVER = process.env.NEXT_PUBLIC_RINGCENTRAL_SERVER || RINGCENTRAL_SERVER;
export const NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER = process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER;
export const NEXT_PUBLIC_RINGCENTRAL_DOMAIN = process.env.NEXT_PUBLIC_RINGCENTRAL_DOMAIN;

// API Endpoints
export const API_ENDPOINTS = {
  RING_OUT: '/restapi/v1.0/account/~/extension/~/ring-out',
  RING_OUT_CALL: (callId: string) => `/restapi/v1.0/account/~/extension/~/ring-out/${callId}`,
  SMS: '/restapi/v1.0/account/~/extension/~/sms',
  ACCOUNT_INFO: '/restapi/v1.0/account/~',
  EXTENSION_INFO: '/restapi/v1.0/account/~/extension/~',
  PHONE_NUMBERS: '/restapi/v1.0/account/~/extension/~/phone-number',
  CLIENT_INFO: '/restapi/v1.0/client-info/sip-provision',
  ACTIVE_CALLS: '/restapi/v1.0/account/~/active-calls',
  AUTHZ_PROFILE: '/restapi/oauth/userinfo',
  SIP_PROVISION: '/restapi/v1.0/client-info/sip-provision',
  TELEPHONY_SESSION: (sessionId: string) => `/restapi/v1.0/account/~/telephony/sessions/${sessionId}`,
};

// Required OAuth Scopes
// These scopes match what's configured in the RingCentral developer console
export const REQUIRED_SCOPES = process.env.RINGCENTRAL_OAUTH_SCOPES
  ? process.env.RINGCENTRAL_OAUTH_SCOPES.split(' ')
  : ['RingOut', 'SMS'];

// Format scopes for OAuth URL (space-separated string)
export function formatScopesForOAuth() {
  return REQUIRED_SCOPES.join(' ');
}

// Utility function to validate configuration
export function validateConfig() {
  const requiredVars = [
    { name: 'RINGCENTRAL_CLIENT_ID', value: RINGCENTRAL_CLIENT_ID },
    { name: 'RINGCENTRAL_CLIENT_SECRET', value: RINGCENTRAL_CLIENT_SECRET },
    { name: 'RINGCENTRAL_SERVER', value: RINGCENTRAL_SERVER },
    { name: 'RINGCENTRAL_FROM_NUMBER', value: RINGCENTRAL_FROM_NUMBER },
    { name: 'RINGCENTRAL_OAUTH_SCOPES', value: REQUIRED_SCOPES.join(' ') },
    { name: 'REDIRECT_URI', value: REDIRECT_URI },
    { name: 'NEXT_PUBLIC_APP_URL', value: NEXT_PUBLIC_APP_URL },
  ];

  const missingVars = requiredVars.filter(v => !v.value);

  if (missingVars.length > 0) {
    console.error('Missing required RingCentral configuration variables:',
      missingVars.map(v => v.name).join(', '));
    return false;
  }

  return true;
}
