import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

/**
 * Refresh a token using the refresh token from cookies
 */
async function refreshTokenFromCookies(refreshToken: string) {
  const response = await fetch(`${RINGCENTRAL_SERVER}/restapi/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${RINGCENTRAL_CLIENT_ID}:${RINGCENTRAL_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }).toString()
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  const refreshData = await response.json();

  // Update cookies with new tokens
  const cookieStore = cookies();
  await cookieStore.set('ringcentral_access_token', refreshData.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: refreshData.expires_in,
    path: '/'
  });

  await cookieStore.set('ringcentral_refresh_token', refreshData.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/'
  });

  await cookieStore.set('ringcentral_token_expiry', (Date.now() + (refreshData.expires_in * 1000)).toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: refreshData.expires_in,
    path: '/'
  });

  return refreshData;
}

// RingCentral OAuth configuration
const RINGCENTRAL_CLIENT_ID = process.env.RINGCENTRAL_CLIENT_ID;
const RINGCENTRAL_CLIENT_SECRET = process.env.RINGCENTRAL_CLIENT_SECRET;
const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com';

/**
 * Handle POST requests to the RingCentral API endpoint
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (!action) {
    return NextResponse.json({ message: 'Missing action parameter' }, { status: 400 });
  }

  try {
    const body = await request.json();

    switch (action) {
      case 'call':
        return await handleCall(body);
      case 'sms':
        return await handleSMS(body);
      default:
        return NextResponse.json({ message: `Unsupported action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error('RingCentral API error:', error);
    return NextResponse.json({
      message: 'Internal server error',
      error: String(error)
    }, { status: 500 });
  }
}

/**
 * Get the access token for the current user
 */
async function getAccessToken() {
  // First check for tokens in cookies
  const cookieStore = cookies();
  const accessToken = (await cookieStore.get('ringcentral_access_token'))?.value;
  const tokenExpiry = (await cookieStore.get('ringcentral_token_expiry'))?.value;
  const refreshToken = (await cookieStore.get('ringcentral_refresh_token'))?.value;

  if (accessToken && tokenExpiry) {
    // Check if the token is expired
    if (parseInt(tokenExpiry) > Date.now()) {
      return accessToken;
    } else if (refreshToken) {
      // Token is expired, try to refresh it
      try {
        const refreshData = await refreshTokenFromCookies(refreshToken);
        return refreshData.access_token;
      } catch (error) {
        console.error('Failed to refresh token from cookies:', error);
        // Continue to check Supabase
      }
    }
  }

  // If no valid tokens in cookies, check Supabase
  const supabase = createClient(await cookies());
  const { data: user } = await supabase.auth.getUser();

  if (!user?.user) {
    throw new Error('User not authenticated');
  }

  // Get the user's RingCentral tokens
  const { data: tokens } = await supabase
    .from('ringcentral_tokens')
    .select('*')
    .eq('user_id', user.user.id)
    .single();

  if (!tokens) {
    throw new Error('RingCentral not authenticated');
  }

  // Check if the token is expired
  if (new Date(tokens.expires_at) <= new Date()) {
    // Token is expired, refresh it
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
        throw new Error('Failed to refresh token');
      }

      const refreshData = await refreshResponse.json();

      // Update the tokens in Supabase
      const { error: updateError } = await supabase
        .from('ringcentral_tokens')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token,
          expires_at: new Date(Date.now() + (refreshData.expires_in * 1000)).toISOString(),
          token_type: refreshData.token_type,
          scope: refreshData.scope
        })
        .eq('user_id', user.user.id);

      if (updateError) {
        throw new Error('Failed to update tokens');
      }

      return refreshData.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new Error('Failed to refresh token');
    }
  }

  return tokens.access_token;
}

/**
 * Handle phone calls using RingCentral API
 */
async function handleCall(body: any) {
  const { from, to } = body;

  if (!from || !to) {
    return NextResponse.json({ message: 'Missing required parameters: from and to' }, { status: 400 });
  }

  console.log(`Initiating call from ${from} to ${to}`);

  try {
    // Get the access token
    const accessToken = await getAccessToken();

    // Make the call using RingOut API
    const response = await fetch(`${RINGCENTRAL_SERVER}/restapi/v1.0/account/~/extension/~/ring-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        from: { phoneNumber: from },
        to: { phoneNumber: to },
        playPrompt: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Call error:', errorData);
      return NextResponse.json({
        success: false,
        error: errorData
      }, { status: response.status });
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      call_id: result.id,
      status: result.status?.callStatus
    });
  } catch (error: any) {
    console.error('Error making call:', error);

    // If authentication error, redirect to auth
    if (error.message === 'RingCentral not authenticated') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        redirect: '/api/ringcentral/auth?action=authorize'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * Handle SMS messages using RingCentral API
 */
async function handleSMS(body: any) {
  const { from, to, text } = body;

  if (!from || !to || !text) {
    return NextResponse.json({ message: 'Missing required parameters: from, to, and text' }, { status: 400 });
  }

  console.log(`Sending SMS from ${from} to ${to}`);

  try {
    // Get the access token
    const accessToken = await getAccessToken();

    // Send the SMS
    const response = await fetch(`${RINGCENTRAL_SERVER}/restapi/v1.0/account/~/extension/~/sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        from: { phoneNumber: from },
        to: [{ phoneNumber: to }],
        text: text
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('SMS error:', errorData);
      return NextResponse.json({
        success: false,
        error: errorData
      }, { status: response.status });
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message_id: result.id,
      status: 'sent'
    });
  } catch (error: any) {
    console.error('Error sending SMS:', error);

    // If authentication error, redirect to auth
    if (error.message === 'RingCentral not authenticated') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
        redirect: '/api/ringcentral/auth?action=authorize'
      }, { status: 401 });
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
