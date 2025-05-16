import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// RingCentral OAuth configuration
const RINGCENTRAL_CLIENT_ID = process.env.RINGCENTRAL_CLIENT_ID;
const RINGCENTRAL_CLIENT_SECRET = process.env.RINGCENTRAL_CLIENT_SECRET;
const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com';

// Use different redirect URIs for production and development
const isProd = process.env.NODE_ENV === 'production';
const REDIRECT_URI = isProd
  ? 'https://crm-sepia-alpha.vercel.app/api/ringcentral/callback'
  : (process.env.REDIRECT_URI || 'http://localhost:3000/oauth-callback');

/**
 * Handle GET requests to the RingCentral auth endpoint
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'authorize':
      return handleAuthorize(request);
    case 'check':
      return handleCheckAuth(request);
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

  // Store state in cookie for verification during callback
  const cookieStore = await cookies();
  cookieStore.set('rc_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/'
  });

  // Construct the authorization URL
  const authUrl = new URL(`${RINGCENTRAL_SERVER}/restapi/oauth/authorize`);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', RINGCENTRAL_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('state', state);
  // Use lowercase, underscore-separated scope values as required by RingCentral OAuth
  authUrl.searchParams.append('scope', 'read_call_log read_messages read_presence ringout sms');

  // Redirect the user to RingCentral's authorization page
  return NextResponse.redirect(authUrl.toString());
}

/**
 * Check if the user is authenticated with RingCentral
 */
async function handleCheckAuth(request: NextRequest) {
  try {
    // First check for tokens in cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;
    const tokenExpiry = cookieStore.get('ringcentral_token_expiry')?.value;

    if (accessToken && tokenExpiry) {
      // Check if the token is expired
      if (parseInt(tokenExpiry) > Date.now()) {
        return NextResponse.json({ authenticated: true });
      }
    }

    // If no valid tokens in cookies, check Supabase
    const supabase = createClient(await cookies());
    const { data: user } = await supabase.auth.getUser();

    if (!user?.user) {
      return NextResponse.json({ authenticated: false, message: 'User not authenticated' });
    }

    // Get the user's RingCentral tokens
    const { data: tokens } = await supabase
      .from('ringcentral_tokens')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (!tokens) {
      return NextResponse.json({ authenticated: false, message: 'RingCentral not authenticated' });
    }

    // Check if the token is expired
    if (new Date(tokens.expires_at) <= new Date()) {
      // Token is expired, try to refresh it
      try {
        const refreshResponse = await fetch(`${RINGCENTRAL_SERVER}/restapi/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${RINGCENTRAL_CLIENT_ID}:${RINGCENTRAL_CLIENT_SECRET}`).toString('base64')}`
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokens.refresh_token
          }).toString()
        });

        if (!refreshResponse.ok) {
          return NextResponse.json({ authenticated: false, message: 'Failed to refresh token' });
        }

        const refreshData = await refreshResponse.json();

        // Update the tokens in Supabase
        await supabase
          .from('ringcentral_tokens')
          .update({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token,
            expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString(),
            token_type: refreshData.token_type,
            scope: refreshData.scope
          })
          .eq('user_id', user.user.id);

        return NextResponse.json({ authenticated: true });
      } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json({ authenticated: false, message: 'Failed to refresh token' });
      }
    }

    return NextResponse.json({ authenticated: true });
  } catch (error: any) {
    console.error('Check auth error:', error);
    return NextResponse.json({
      authenticated: false,
      message: error.message || 'Unknown error occurred'
    });
  }
}

/**
 * Logout from RingCentral
 */
async function handleLogout(request: NextRequest) {
  try {
    // Clear cookies
    const cookieStore = await cookies();
    cookieStore.delete('ringcentral_access_token');
    cookieStore.delete('ringcentral_refresh_token');
    cookieStore.delete('ringcentral_token_expiry');

    // Get the user's access token from Supabase
    const supabase = createClient(await cookies());
    const { data: user } = await supabase.auth.getUser();

    if (!user?.user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get the user's RingCentral tokens
    const { data: tokens } = await supabase
      .from('ringcentral_tokens')
      .select('access_token')
      .eq('user_id', user.user.id)
      .single();

    if (tokens?.access_token) {
      // Revoke the access token
      await fetch(`${RINGCENTRAL_SERVER}/restapi/oauth/revoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${RINGCENTRAL_CLIENT_ID}:${RINGCENTRAL_CLIENT_SECRET}`).toString('base64')}`
        },
        body: new URLSearchParams({
          token: tokens.access_token
        }).toString()
      });

      // Delete the tokens from Supabase
      await supabase
        .from('ringcentral_tokens')
        .delete()
        .eq('user_id', user.user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({
      error: 'Failed to logout',
      details: error.message
    }, { status: 500 });
  }
}
