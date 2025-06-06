import { NextRequest, NextResponse } from 'next/server';
import {
  RINGCENTRAL_CLIENT_ID,
  RINGCENTRAL_SERVER,
  REDIRECT_URI,
  NEXT_PUBLIC_APP_URL,
  formatScopesForOAuth
} from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';
import { cookies } from 'next/headers';

/**
 * Debug endpoint to check RingCentral configuration
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL DEBUG API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Create a test authorization URL to see what's being sent
    const authUrl = new URL(`${RINGCENTRAL_SERVER}/restapi/oauth/authorize`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', RINGCENTRAL_CLIENT_ID || '');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('state', 'debug-test');
    authUrl.searchParams.append('scope', formatScopesForOAuth());

    // Create test token exchange parameters
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: 'test-code',
      redirect_uri: REDIRECT_URI,
      code_verifier: 'test-verifier'
    });

    // Gather all relevant information
    const debugInfo = {
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_ENV: process.env.VERCEL_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
      },
      config: {
        RINGCENTRAL_SERVER,
        RINGCENTRAL_CLIENT_ID: RINGCENTRAL_CLIENT_ID ? 'Set (hidden)' : 'Not set',
        REDIRECT_URI,
        REDIRECT_URI_LENGTH: REDIRECT_URI?.length || 0,
        REDIRECT_URI_CHAR_CODES: REDIRECT_URI?.split('').map(c => c.charCodeAt(0)),
        NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_APP_URL_LENGTH: NEXT_PUBLIC_APP_URL?.length || 0,
        NODE_ENV: process.env.NODE_ENV,
        VERCEL_URL: process.env.VERCEL_URL,
      },
      env_direct: {
        REDIRECT_URI: process.env.REDIRECT_URI,
        REDIRECT_URI_LENGTH: process.env.REDIRECT_URI?.length || 0,
        REDIRECT_URI_CHAR_CODES: process.env.REDIRECT_URI?.split('').map(c => c.charCodeAt(0)),
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_APP_URL_LENGTH: process.env.NEXT_PUBLIC_APP_URL?.length || 0,
      },
      auth_url: {
        full: authUrl.toString(),
        redirect_uri: authUrl.searchParams.get('redirect_uri'),
        redirect_uri_length: authUrl.searchParams.get('redirect_uri')?.length || 0,
        redirect_uri_char_codes: authUrl.searchParams.get('redirect_uri')?.split('').map(c => c.charCodeAt(0)),
      },
      token_params: {
        redirect_uri: tokenParams.get('redirect_uri'),
        redirect_uri_length: tokenParams.get('redirect_uri')?.length || 0,
        redirect_uri_char_codes: tokenParams.get('redirect_uri')?.split('').map(c => c.charCodeAt(0)),
      }
    };

    console.log('Debug info:', JSON.stringify(debugInfo, null, 2));
    console.log('========== RINGCENTRAL DEBUG API - END ==========');

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL DEBUG API - END (WITH ERROR) ==========');

    return NextResponse.json({
      error: error.message || UNKNOWN_ERROR_OCCURRED,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
