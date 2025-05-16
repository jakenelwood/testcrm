import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import {
  RINGCENTRAL_CLIENT_ID,
  RINGCENTRAL_CLIENT_SECRET,
  RINGCENTRAL_SERVER,
  REDIRECT_URI,
  VERCEL_DEPLOYMENT_REDIRECT_URI
} from '@/lib/ringcentral/config';

/**
 * Handle GET requests to exchange the authorization code for tokens
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL EXCHANGE CODE API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request URL:', request.url);
  console.log('Request headers:', Object.fromEntries(request.headers));

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
    const cookieStore = await cookies();
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
    console.log('VERCEL_DEPLOYMENT_URL:', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'Not set');
    console.log('VERCEL_DEPLOYMENT_REDIRECT_URI:', VERCEL_DEPLOYMENT_REDIRECT_URI || 'Not set');

    // Determine which redirect URI to use
    // We need to use the same redirect URI that was used in the authorization request
    // Try both possibilities and see which one works
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
        error: 'Failed to exchange authorization code for tokens',
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
    const supabase = await createClient(cookieStore);

    // Get the current user
    const { data, error: userError } = await supabase.auth.getUser();
    console.log('Supabase auth.getUser() response:', {
      hasUser: !!data?.user,
      userId: data?.user?.id,
      userEmail: data?.user?.email,
      error: userError
    });

    if (userError) {
      console.error('Error getting Supabase user:', userError);
      console.log('Full error object:', JSON.stringify(userError));
    }

    if (!data?.user) {
      console.log('No authenticated user found, creating a new anonymous user');

      // Create a new anonymous user
      const { data: newUserData, error: signUpError } = await supabase.auth.signUp({
        email: `anonymous-${Date.now()}@gonzigo.com`,
        password: `Anonymous${Date.now()}!`,
        options: {
          data: {
            is_anonymous: true,
            created_via: 'ringcentral_auth'
          }
        }
      });

      if (signUpError) {
        console.error('Error creating anonymous user:', signUpError);
        console.log('Full error object:', JSON.stringify(signUpError));
        throw new Error(`Failed to create anonymous user: ${signUpError.message}`);
      }

      if (!newUserData?.user) {
        console.error('No user returned after sign up');
        throw new Error('Failed to create anonymous user: No user returned');
      }

      console.log('Successfully created anonymous user:', {
        id: newUserData.user.id,
        email: newUserData.user.email,
        created_at: newUserData.user.created_at
      });

      // Use the newly created user
      data = newUserData;
    }

    // Now we definitely have a user
    {
      console.log('User found, storing tokens in database');
      console.log('User details:', {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at
      });

      const user = data.user;

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
      const { error: upsertError } = await supabase
        .from('ringcentral_tokens')
        .upsert({
          user_id: user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_type: tokenData.token_type,
          expires_at: new Date(expiresAt).toISOString(),
          scope: tokenData.scope,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (upsertError) {
        console.error('Error upserting token record:', upsertError);
        console.log('Full error object:', JSON.stringify(upsertError));

        // Check if the table exists
        console.log('Checking if ringcentral_tokens table exists');
        const { data: tableData, error: tableError } = await supabase
          .from('ringcentral_tokens')
          .select('count(*)', { count: 'exact', head: true });

        if (tableError) {
          console.error('Error checking table:', tableError);
          console.log('Full error object:', JSON.stringify(tableError));
        } else {
          console.log('Table check result:', tableData);
        }
      } else {
        console.log('✅ Token record upserted successfully');

        // Verify the record was actually stored
        const { data: verifyData, error: verifyError } = await supabase
          .from('ringcentral_tokens')
          .select('*')
          .eq('user_id', user.id)
          .limit(1);

        if (verifyError) {
          console.error('Error verifying token storage:', verifyError);
        } else if (!verifyData || verifyData.length === 0) {
          console.error('❌ No token record found after upsert!');
        } else {
          console.log('✅ Verified token record exists:', {
            id: verifyData[0].id,
            user_id: verifyData[0].user_id,
            hasAccessToken: !!verifyData[0].access_token,
            expires_at: verifyData[0].expires_at
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
    console.error('Error exchanging code for tokens:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL EXCHANGE CODE API - END (ERROR) ==========');
    return NextResponse.json({
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
