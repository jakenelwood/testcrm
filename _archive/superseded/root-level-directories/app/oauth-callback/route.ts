import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

// RingCentral OAuth configuration
const RINGCENTRAL_CLIENT_ID = process.env.RINGCENTRAL_CLIENT_ID;
const RINGCENTRAL_CLIENT_SECRET = process.env.RINGCENTRAL_CLIENT_SECRET;
const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/oauth-callback';

/**
 * Handle the OAuth callback from RingCentral
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check if there was an error
  if (error) {
    console.error('RingCentral authorization error:', error);
    return NextResponse.redirect(new URL('/test/ringcentral?error=' + encodeURIComponent(error), request.url));
  }

  // Verify state parameter (security check)
  const storedState = (await cookies().get('rc_oauth_state'))?.value;
  if (!storedState || state !== storedState) {
    console.error('Invalid state parameter');
    return NextResponse.redirect(new URL('/test/ringcentral?error=invalid_state', request.url));
  }

  if (!code) {
    console.error('Authorization code missing');
    return NextResponse.redirect(new URL('/test/ringcentral?error=missing_code', request.url));
  }

  try {
    // Exchange the authorization code for tokens
    const tokenResponse = await fetch(`${RINGCENTRAL_SERVER}/restapi/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${RINGCENTRAL_CLIENT_ID}:${RINGCENTRAL_CLIENT_SECRET}`).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      return NextResponse.redirect(new URL('/test/ringcentral?error=token_exchange_failed', request.url));
    }

    const tokenData = await tokenResponse.json();

    // Store tokens in Supabase
    const supabase = createClient(await cookies());
    const { data: user } = await supabase.auth.getUser();

    if (!user?.user) {
      // If no user is authenticated, store tokens in cookies temporarily
      await cookies().set('ringcentral_access_token', tokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: tokenData.expires_in,
        path: '/'
      });
      
      await cookies().set('ringcentral_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      });
      
      await cookies().set('ringcentral_token_expiry', (Date.now() + (tokenData.expires_in * 1000)).toString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: tokenData.expires_in,
        path: '/'
      });
    } else {
      // If a user is authenticated, store tokens in Supabase
      const { error: storeError } = await supabase
        .from('ringcentral_tokens')
        .upsert({
          user_id: user.user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
          token_type: tokenData.token_type,
          scope: tokenData.scope
        });
      
      if (storeError) {
        console.error('Error storing tokens:', storeError);
        return NextResponse.redirect(new URL('/test/ringcentral?error=token_storage_failed', request.url));
      }
    }
    
    // Redirect to the test page with success message
    return NextResponse.redirect(new URL('/test/ringcentral?success=true', request.url));
  } catch (error: any) {
    console.error('Token exchange error:', error);
    return NextResponse.redirect(new URL('/test/ringcentral?error=' + encodeURIComponent(error.message || 'Unknown error'), request.url));
  }
}
