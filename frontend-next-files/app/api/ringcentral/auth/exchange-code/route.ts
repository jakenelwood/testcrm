import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import {
  RINGCENTRAL_CLIENT_ID,
  RINGCENTRAL_CLIENT_SECRET,
  RINGCENTRAL_SERVER,
  REDIRECT_URI
} from '@/lib/ringcentral/config';
import { UNKNOWN_ERROR_OCCURRED, FAILED_TO_EXCHANGE_CODE_FOR_TOKENS } from '@/lib/constants';

/**
 * Handle GET requests to exchange the authorization code for tokens
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL EXCHANGE CODE API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request URL:', request.url);
  console.log('Request headers:', Object.fromEntries(request.headers));

  const cookieStore = await cookies(); // Get cookie store early

  // Log all cookies received by the server for this request
  console.log('ALL COOKIES RECEIVED BY /exchange-code (Name: Value):');
  cookieStore.getAll().forEach(cookie => {
    console.log(`  ${cookie.name}: ${cookie.value.substring(0, 70)}${cookie.value.length > 70 ? '...' : ''}`);
  });
  // End logging all cookies

  const { searchParams } = new URL(request.url);
  console.log('Query params:', Object.fromEntries(searchParams));

  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    console.error('OAuth error:', error, errorDescription);
  }

  if (!code) {
    console.log('Missing authorization code');
    console.log('========== RINGCENTRAL EXCHANGE CODE API - END (ERROR) ==========');
    return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 });
  }

  try {
    // Get the code_verifier from the cookie
    const codeVerifier = cookieStore.get('rc_code_verifier')?.value;
    const storedState = cookieStore.get('rc_oauth_state')?.value;

    // Verify the state parameter to prevent CSRF attacks
    if (state !== storedState) {
      console.log('State mismatch, possible CSRF attack');
      console.log('Received state:', state);
      console.log('Stored state:', storedState);
      console.log('========== RINGCENTRAL EXCHANGE CODE API - END (STATE MISMATCH) ==========');
      return NextResponse.json({ error: 'Invalid state parameter' }, { status: 400 });
    }

    if (!codeVerifier) {
      console.log('Missing code_verifier cookie');
      console.log('========== RINGCENTRAL EXCHANGE CODE API - END (MISSING CODE VERIFIER) ==========');
      return NextResponse.json({ error: 'Missing code_verifier' }, { status: 400 });
    }

    console.log('Step 1: Exchanging authorization code for tokens with PKCE');
    console.log('Code verifier available (length):', codeVerifier.length);

    // Log the redirect URI for debugging
    console.log('REDIRECT_URI from config:', REDIRECT_URI);
    console.log('REDIRECT_URI from env directly:', process.env.REDIRECT_URI);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL_URL:', process.env.VERCEL_URL || 'Not set');

    // We're using a stable redirect URI that doesn't change with deployments
    // This ensures that the redirect URI is always the same and matches what's configured in RingCentral
    const redirectUri = REDIRECT_URI;

    // Create the URL params for better debugging
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier
    });

    console.log('redirect_uri in token request:', params.get('redirect_uri'));

    // Exchange the authorization code for tokens using PKCE
    const tokenResponse = await fetch(`${RINGCENTRAL_SERVER}/restapi/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${RINGCENTRAL_CLIENT_ID}:${RINGCENTRAL_CLIENT_SECRET}`).toString('base64')}`
      },
      body: params.toString()
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange error:', errorData);
      console.log('========== RINGCENTRAL EXCHANGE CODE API - END (TOKEN ERROR) ==========');
      return NextResponse.json({
        error: FAILED_TO_EXCHANGE_CODE_FOR_TOKENS,
        details: errorData
      }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');
    console.log('Token data received:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      scope: tokenData.scope
    });

    // Store tokens in cookies
    console.log('Step 2: Storing tokens in cookies');
    // We already have cookieStore from earlier, no need to get it again
    cookieStore.set('ringcentral_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenData.expires_in,
      path: '/'
    });

    cookieStore.set('ringcentral_refresh_token', tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    const expiresAt = Date.now() + (tokenData.expires_in * 1000);
    cookieStore.set('ringcentral_token_expiry', expiresAt.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: tokenData.expires_in,
      path: '/'
    });

    // Store tokens in Supabase
    console.log('Step 3: Storing tokens in Supabase');
    const supabase = createClient(cookieStore);

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting Supabase user during token exchange:', userError);
      // This is a critical error, as we need a user to associate tokens with.
      return NextResponse.json({ error: 'Failed to retrieve user session.', details: userError.message }, { status: 500 });
    }

    if (!user) {
      console.error('No Supabase user session found during token exchange. OAuth flow cannot complete without a user.');
      // This indicates a broken or state-loss scenario. The user should re-authenticate with the app first.
      return NextResponse.json({ error: 'User session not found. Please sign in and try connecting to RingCentral again.' }, { status: 403 }); // 403 Forbidden or 401 Unauthorized
    }

    // If user is anonymous, this is also an issue. OAuth should be tied to a non-anonymous identity.
    if (user.user_metadata?.is_anonymous) {
        console.error('Attempted to associate RingCentral tokens with an anonymous Supabase user. This is not allowed.', { userId: user.id });
        return NextResponse.json({ error: 'Cannot link RingCentral account to an anonymous user. Please sign in with a regular account.' }, { status: 403 });
    }

    // At this point, 'user' is a valid, non-anonymous Supabase user.
    console.log('User found, storing tokens in database for user_id:', user.id);

    // Verify the token data
    console.log('Token data to store:', {
      hasAccessToken: !!tokenData.access_token,
      accessTokenLength: tokenData.access_token?.length,
      hasRefreshToken: !!tokenData.refresh_token,
      refreshTokenLength: tokenData.refresh_token?.length,
      tokenType: tokenData.token_type,
      expiresIn: tokenData.expires_in,
      expiresAt: new Date(expiresAt).toISOString(),
      scope: tokenData.scope
    });

    // Try direct upsert approach
    console.log('Attempting direct upsert to ringcentral_tokens table');
    const refreshTokenExpiresIn = tokenData.refresh_token_expires_in; // Standard field, might be undefined
    const refreshTokenExpiresAt = refreshTokenExpiresIn ? new Date(Date.now() + refreshTokenExpiresIn * 1000).toISOString() : null; // Or a default far future date

    const upsertData = {
      user_id: user.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_at: new Date(expiresAt).toISOString(),
      refresh_token_expires_at: refreshTokenExpiresAt,
      scope: tokenData.scope,
      updated_at: new Date().toISOString()
      // created_at will be set on insert by Supabase or by the upsert if not present
    };

    const { data: upsertedData, error: upsertError } = await supabase
      .from('ringcentral_tokens')
      .upsert(upsertData, {
        onConflict: 'user_id', // Assumes 'user_id' has a UNIQUE constraint
      })
      .select(); // Select the upserted/updated record

    if (upsertError) {
      console.error('Error upserting token record:', upsertError);
      console.log('Full error object:', JSON.stringify(upsertError));
      // Consider more specific error handling or re-throwing if critical
    } else {
      console.log('✅ Token record upserted successfully.');
      if (upsertedData && upsertedData.length > 0) {
        console.log('✅ Verified token record (from upsert response):', {
          id: upsertedData[0].id,
          user_id: upsertedData[0].user_id,
          hasAccessToken: !!upsertedData[0].access_token,
          expires_at: upsertedData[0].expires_at,
          refresh_token_expires_at: upsertedData[0].refresh_token_expires_at
        });
      } else {
        // This case should ideally not happen if upsertError is null
        console.warn('Upsert reported success but returned no data. Verification step will run next.');
        // Fallback verification (as was present before)
        const { data: verifyData, error: verifyError } = await supabase
          .from('ringcentral_tokens')
          .select('id, user_id, access_token, expires_at, refresh_token_expires_at')
          .eq('user_id', user.id)
          .maybeSingle(); // Use maybeSingle() to avoid errors when no rows are found

        if (verifyError) {
          console.error('Error verifying token storage after upsert (fallback):', verifyError);
        } else if (!verifyData) {
          console.error('❌ No token record found after upsert (fallback verification)!');
        } else {
          console.log('✅ Verified token record exists (fallback verification):', {
            id: verifyData.id,
            user_id: verifyData.user_id,
            hasAccessToken: !!verifyData.access_token,
            expires_at: verifyData.expires_at,
            refresh_token_expires_at: verifyData.refresh_token_expires_at
          });
        }
      }
    }

    console.log('========== RINGCENTRAL EXCHANGE CODE API - END (SUCCESS) ==========');
    return NextResponse.json({
      success: true,
      message: 'Authentication successful'
    });
  } catch (error: any) {
    console.error('Token exchange error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL EXCHANGE CODE API - END (ERROR) ==========');
    return NextResponse.json({ error: error.message || UNKNOWN_ERROR_OCCURRED }, { status: 500 });
  }
}
