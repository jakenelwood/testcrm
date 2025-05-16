import type { NextApiRequest, NextApiResponse } from 'next';
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
 * Handler for RingCentral OAuth endpoints
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;

  switch (action) {
    case 'authorize':
      return handleAuthorize(req, res);
    case 'callback':
      return handleCallback(req, res);
    case 'token':
      return handleGetToken(req, res);
    case 'logout':
      return handleLogout(req, res);
    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}

/**
 * Generate and redirect to RingCentral authorization URL
 */
async function handleAuthorize(req: NextApiRequest, res: NextApiResponse) {
  if (!RINGCENTRAL_CLIENT_ID) {
    return res.status(500).json({ error: 'RINGCENTRAL_CLIENT_ID not configured' });
  }

  // Generate a random state value for security
  const state = Math.random().toString(36).substring(2, 15);
  
  // Store state in session/cookie (in a real app)
  // req.session.rcOAuthState = state;
  
  // Construct the authorization URL
  const authUrl = new URL(`${RINGCENTRAL_SERVER}/restapi/oauth/authorize`);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', RINGCENTRAL_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('state', state);
  authUrl.searchParams.append('scope', 'RingOut CallControl ReadAccounts SMS');
  
  // Redirect the user to RingCentral's authorization page
  res.redirect(authUrl.toString());
}

/**
 * Handle the OAuth callback from RingCentral
 */
async function handleCallback(req: NextApiRequest, res: NextApiResponse) {
  const { code, state, error } = req.query;
  
  // Check if there was an error
  if (error) {
    return res.status(400).json({ error: `RingCentral authorization error: ${error}` });
  }
  
  // Verify state parameter (security check)
  // if (state !== req.session.rcOAuthState) {
  //   return res.status(400).json({ error: 'Invalid state parameter' });
  // }
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
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
        code: code as string,
        redirect_uri: REDIRECT_URI
      })
    });
    
    // Store tokens (in a real app, save these securely in a database)
    accessToken = tokenResponse.data.access_token;
    refreshToken = tokenResponse.data.refresh_token;
    tokenExpiry = Date.now() + (tokenResponse.data.expires_in * 1000);
    
    // Redirect to the application
    res.redirect('/dashboard');
  } catch (error: any) {
    console.error('Token exchange error:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Failed to exchange authorization code for tokens',
      details: error.response?.data || error.message 
    });
  }
}

/**
 * Get the current access token or refresh if expired
 */
async function handleGetToken(req: NextApiRequest, res: NextApiResponse) {
  // Check if we have a token and it's not expired
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return res.status(200).json({
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
      
      return res.status(200).json({
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
  return res.status(200).json({
    authenticated: false,
    message: 'Not authenticated with RingCentral'
  });
}

/**
 * Logout from RingCentral
 */
async function handleLogout(req: NextApiRequest, res: NextApiResponse) {
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
  
  return res.status(200).json({
    success: true,
    message: 'Logged out from RingCentral'
  });
}
