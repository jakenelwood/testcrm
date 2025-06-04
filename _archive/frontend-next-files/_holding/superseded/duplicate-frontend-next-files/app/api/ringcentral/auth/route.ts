import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// RingCentral OAuth configuration
const RINGCENTRAL_CLIENT_ID = process.env.RINGCENTRAL_CLIENT_ID;
const RINGCENTRAL_CLIENT_SECRET = process.env.RINGCENTRAL_CLIENT_SECRET;
const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com';
const REDIRECT_URI = process.env.REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/ringcentral/auth?action=callback`;

// Store tokens in memory (in production, you'd use a database)
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Handle GET requests to the RingCentral auth endpoint
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'authorize':
      return handleAuthorize(request);
    case 'callback':
      return handleCallback(request);
    case 'token':
      return handleGetToken(request);
    case 'logout':
      return handleLogout(request);
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

/**
 * Generate and redirect to RingCentral authorization URL
 */
async function handleAuthorize(request: NextRequest) {
  if (!RINGCENTRAL_CLIENT_ID) {
    console.error('RINGCENTRAL_CLIENT_ID not configured');
    return NextResponse.json({ error: 'RINGCENTRAL_CLIENT_ID not configured' }, { status: 500 });
  }

  // Generate a random state value for security
  const state = Math.random().toString(36).substring(2, 15);
  
  // Construct the authorization URL
  const authUrl = new URL(`${RINGCENTRAL_SERVER}/restapi/oauth/authorize`);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', RINGCENTRAL_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('scope', 'RingOut CallControl ReadAccounts SMS');
  
  // Redirect the user to RingCentral's authorization page
  return NextResponse.redirect(authUrl.toString());
}

/**
 * Handle the OAuth callback from RingCentral
 */
async function handleCallback(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  // Check if there was an error
  if (error) {
    return NextResponse.json({ error: `RingCentral authorization error: ${error}` }, { status: 400 });
  }
  
  if (!code) {
    return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
  }
  
  try {
    // Exchange the authorization code for tokens
    const tokenResponse = await axios({
      method: 'POST',
      url: `${RINGCENTRAL_SERVER}/restapi/oauth/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      auth: {
        username: RINGCENTRAL_CLIENT_ID || '',
        password: RINGCENTRAL_CLIENT_SECRET || ''
      },
      data: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      })
    });
    
    // Store tokens (in a real app, save these securely in a database)
    accessToken = tokenResponse.data.access_token;
    refreshToken = tokenResponse.data.refresh_token;
    tokenExpiry = Date.now() + (tokenResponse.data.expires_in * 1000);
    
    // Redirect to the application
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error: any) {
    console.error('Token exchange error:', error.response?.data || error.message);
    return NextResponse.json({ 
      error: 'Failed to exchange authorization code for tokens',
      details: error.response?.data || error.message 
    }, { status: 500 });
  }
}

/**
 * Get the current access token or refresh if expired
 */
async function handleGetToken(request: NextRequest) {
  // Check if we have a token and it's not expired
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return NextResponse.json({
      authenticated: true,
      access_token: accessToken
    });
  }
  
  // If we have a refresh token, try to refresh the access token
  if (refreshToken) {
    try {
      const refreshResponse = await axios({
        method: 'POST',
        url: `${RINGCENTRAL_SERVER}/restapi/oauth/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
          username: RINGCENTRAL_CLIENT_ID || '',
          password: RINGCENTRAL_CLIENT_SECRET || ''
        },
        data: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });
      
      // Update tokens
      accessToken = refreshResponse.data.access_token;
      refreshToken = refreshResponse.data.refresh_token;
      tokenExpiry = Date.now() + (refreshResponse.data.expires_in * 1000);
      
      return NextResponse.json({
        authenticated: true,
        access_token: accessToken
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear tokens on refresh failure
      accessToken = null;
      refreshToken = null;
      tokenExpiry = null;
    }
  }
  
  // If we get here, we're not authenticated
  return NextResponse.json({
    authenticated: false,
    message: 'Not authenticated with RingCentral'
  });
}

/**
 * Logout from RingCentral
 */
async function handleLogout(request: NextRequest) {
  // If we have an access token, revoke it
  if (accessToken) {
    try {
      await axios({
        method: 'POST',
        url: `${RINGCENTRAL_SERVER}/restapi/oauth/revoke`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
          username: RINGCENTRAL_CLIENT_ID || '',
          password: RINGCENTRAL_CLIENT_SECRET || ''
        },
        data: new URLSearchParams({
          token: accessToken
        })
      });
    } catch (error) {
      console.error('Token revocation error:', error);
    }
  }
  
  // Clear tokens
  accessToken = null;
  refreshToken = null;
  tokenExpiry = null;
  
  return NextResponse.json({
    success: true,
    message: 'Logged out from RingCentral'
  });
}
