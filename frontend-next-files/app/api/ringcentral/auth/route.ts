import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import {
  RINGCENTRAL_CLIENT_ID,
  RINGCENTRAL_CLIENT_SECRET,
  RINGCENTRAL_SERVER,
  REDIRECT_URI,
  VERCEL_DEPLOYMENT_REDIRECT_URI,
  formatScopesForOAuth
} from '@/lib/ringcentral/config';

/**
 * Generate a random string for PKCE code_verifier
 */
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate code_challenge from code_verifier using SHA-256
 */
function generateCodeChallenge(codeVerifier: string) {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return hash.toString('base64url');
}

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
    case 'token':
      return handleGetToken(request);
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

/**
 * Generate and redirect to RingCentral authorization URL with PKCE
 */
async function handleAuthorize(request: NextRequest) {
  console.log('========== RINGCENTRAL AUTH API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request URL:', request.url);
  console.log('Request headers:', Object.fromEntries(request.headers));
  console.log('Query params:', Object.fromEntries(new URL(request.url).searchParams));

  if (!RINGCENTRAL_CLIENT_ID) {
    console.error('RINGCENTRAL_CLIENT_ID not configured');
    console.log('========== RINGCENTRAL AUTH API - END (ERROR) ==========');
    return NextResponse.json({ error: 'RINGCENTRAL_CLIENT_ID not configured' }, { status: 500 });
  }

  try {
    // Generate a random state value for security
    const state = Math.random().toString(36).substring(2, 15);

    // Generate PKCE code_verifier and code_challenge
    console.log('Step 1: Generating PKCE code_verifier and code_challenge');
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);

    console.log('Code verifier generated (length):', codeVerifier.length);
    console.log('Code challenge generated (length):', codeChallenge.length);

    // Store state and code_verifier in cookies for verification during callback
    const cookieStore = await cookies();
    cookieStore.set('rc_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    });

    // Store the code_verifier in a cookie for the token exchange
    cookieStore.set('rc_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/'
    });

    // Construct the authorization URL with PKCE
    console.log('Step 2: Creating authorization URL with PKCE');
    console.log('REDIRECT_URI from config:', REDIRECT_URI);
    console.log('REDIRECT_URI from env directly:', process.env.REDIRECT_URI);
    console.log('VERCEL_DEPLOYMENT_URL:', process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'Not set');
    console.log('VERCEL_DEPLOYMENT_REDIRECT_URI:', VERCEL_DEPLOYMENT_REDIRECT_URI || 'Not set');

    // Determine which redirect URI to use
    // If we're running in Vercel production and have a deployment URL, use that
    // Otherwise, use the configured REDIRECT_URI
    const redirectUri = REDIRECT_URI;

    const authUrl = new URL(`${RINGCENTRAL_SERVER}/restapi/oauth/authorize`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', RINGCENTRAL_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    console.log('redirect_uri after URL encoding:', authUrl.searchParams.get('redirect_uri'));
    authUrl.searchParams.append('state', state);

    // Add PKCE parameters
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    // Note: RingCentral requires specific scope format in the authorization URL
    // We're only requesting the RingOut scope since that's all we need
    // This is defined centrally in the config.ts file
    console.log('Using scope:', formatScopesForOAuth());
    authUrl.searchParams.append('scope', formatScopesForOAuth());

    console.log('Authorization URL:', authUrl.toString());
    console.log('========== RINGCENTRAL AUTH API - END (REDIRECT) ==========');

    // Redirect the user to RingCentral's authorization page
    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Authorization error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL AUTH API - END (ERROR) ==========');
    return NextResponse.json({
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * Check if the user is authenticated with RingCentral
 */
async function handleCheckAuth(request: NextRequest) {
  console.log('========== RINGCENTRAL AUTH CHECK API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Get the user's access token from cookies
    console.log('Step 1: Getting cookies');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;
    const tokenExpiry = cookieStore.get('ringcentral_token_expiry')?.value;

    console.log('Access token available:', !!accessToken);
    console.log('Access token length:', accessToken?.length || 0);
    console.log('Token expiry available:', !!tokenExpiry);

    if (tokenExpiry) {
      const expiryDate = new Date(parseInt(tokenExpiry));
      const now = new Date();
      console.log('Token expiry date:', expiryDate.toISOString());
      console.log('Current date:', now.toISOString());
      console.log('Token expired:', expiryDate <= now);
    }

    // Check if we have valid tokens in cookies
    let isAuthenticated = false;

    if (accessToken && tokenExpiry && parseInt(tokenExpiry) > Date.now()) {
      isAuthenticated = true;
    } else {
      // If not in cookies, check the database
      console.log('Step 2: Checking database for tokens');
      const supabase = await createClient(cookieStore);

      // Get the current user
      const { data, error: userError } = await supabase.auth.getUser();
      console.log('Supabase auth.getUser() response:', {
        hasUser: !!data?.user,
        userId: data?.user?.id,
        userEmail: data?.user?.email,
        error: userError
      });

      let user = data.user;

      // If no user exists, create an anonymous one
      if (!user) {
        console.log('No authenticated user found, creating a new anonymous user');

        // Create a new anonymous user
        const { data: newUserData, error: signUpError } = await supabase.auth.signUp({
          email: `anonymous-${Date.now()}@gonzigo.com`,
          password: `Anonymous${Date.now()}!`,
          options: {
            data: {
              is_anonymous: true,
              created_via: 'ringcentral_auth_check'
            }
          }
        });

        if (signUpError) {
          console.error('Error creating anonymous user:', signUpError);
          console.log('Full error object:', JSON.stringify(signUpError));
        } else if (newUserData?.user) {
          console.log('Successfully created anonymous user:', {
            id: newUserData.user.id,
            email: newUserData.user.email
          });
          user = newUserData.user;
        }
      }

      if (user) {
        console.log('User found, checking for tokens in database');

        // Get the tokens from the database
        const { data: tokens, error } = await supabase
          .from('ringcentral_tokens')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (error) {
          console.error('Error retrieving tokens from database:', error);
        } else if (tokens) {
          console.log('Tokens found in database');

          // Check if the token is expired
          const expiresAt = new Date(tokens.expires_at);
          const now = new Date();

          if (expiresAt > now) {
            console.log('Database token is valid');

            // Store the tokens in cookies for future use
            cookieStore.set('ringcentral_access_token', tokens.access_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
              path: '/'
            });

            cookieStore.set('ringcentral_refresh_token', tokens.refresh_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/'
            });

            cookieStore.set('ringcentral_token_expiry', expiresAt.getTime().toString(), {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
              path: '/'
            });

            isAuthenticated = true;
          } else {
            console.log('Database token is expired');
          }
        } else {
          console.log('No tokens found in database');
        }
      } else {
        console.log('No authenticated user found');
      }
    }

    if (!isAuthenticated) {
      console.log('User is not authenticated with RingCentral');
      console.log('========== RINGCENTRAL AUTH CHECK API - END (NOT AUTHENTICATED) ==========');
      return NextResponse.json({ authenticated: false, message: 'Not authenticated with RingCentral' });
    }

    console.log('User is authenticated with RingCentral');
    console.log('========== RINGCENTRAL AUTH CHECK API - END (AUTHENTICATED) ==========');
    return NextResponse.json({ authenticated: true });
  } catch (error: any) {
    console.log('Error during authentication check:');
    console.error('Check auth error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL AUTH CHECK API - END (ERROR) ==========');
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
  console.log('========== RINGCENTRAL LOGOUT API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Clear cookies
    console.log('Step 1: Clearing cookies');
    const cookieStore = await cookies();
    cookieStore.delete('ringcentral_access_token');
    cookieStore.delete('ringcentral_refresh_token');
    cookieStore.delete('ringcentral_token_expiry');

    // Clear tokens from database
    console.log('Step 2: Clearing tokens from database');
    const supabase = await createClient(cookieStore);

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      console.log('User found, removing tokens from database');

      // Delete the tokens from the database
      const { error } = await supabase
        .from('ringcentral_tokens')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting tokens from database:', error);
      } else {
        console.log('Tokens deleted from database successfully');
      }
    } else {
      console.log('No authenticated user found, skipping database cleanup');
    }

    console.log('========== RINGCENTRAL LOGOUT API - END (SUCCESS) ==========');
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL LOGOUT API - END (ERROR) ==========');
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}

/**
 * Get the access token for API calls
 */
async function handleGetToken(request: NextRequest) {
  console.log('========== RINGCENTRAL GET TOKEN API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Get the user's access token from cookies
    console.log('Step 1: Getting tokens from cookies');
    const cookieStore = await cookies();
    let accessToken = cookieStore.get('ringcentral_access_token')?.value;
    let refreshToken = cookieStore.get('ringcentral_refresh_token')?.value;
    let tokenExpiry = cookieStore.get('ringcentral_token_expiry')?.value;

    console.log('Access token available in cookies:', !!accessToken);
    console.log('Access token length:', accessToken?.length || 0);
    console.log('Refresh token available:', !!refreshToken);
    console.log('Token expiry available:', !!tokenExpiry);

    // Check if we have valid tokens in cookies
    let tokensValid = accessToken && tokenExpiry && parseInt(tokenExpiry) > Date.now();

    // If not in cookies or expired, check the database
    if (!tokensValid) {
      console.log('Step 2: Checking database for tokens');
      const supabase = await createClient(cookieStore);

      // Get the current user
      const { data, error: userError } = await supabase.auth.getUser();

      let user = data.user;

      // If no user exists, create an anonymous one
      if (!user) {
        console.log('No authenticated user found, creating a new anonymous user');

        // Create a new anonymous user
        const { data: newUserData, error: signUpError } = await supabase.auth.signUp({
          email: `anonymous-${Date.now()}@gonzigo.com`,
          password: `Anonymous${Date.now()}!`,
          options: {
            data: {
              is_anonymous: true,
              created_via: 'ringcentral_get_token'
            }
          }
        });

        if (signUpError) {
          console.error('Error creating anonymous user:', signUpError);
          console.log('Full error object:', JSON.stringify(signUpError));
        } else if (newUserData?.user) {
          console.log('Successfully created anonymous user:', {
            id: newUserData.user.id,
            email: newUserData.user.email
          });
          user = newUserData.user;
        }
      }

      if (user) {
        console.log('User found, checking for tokens in database');

        // Get the tokens from the database
        const { data: tokens, error } = await supabase
          .from('ringcentral_tokens')
          .select('access_token, refresh_token, expires_at')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (error) {
          console.error('Error retrieving tokens from database:', error);
        } else if (tokens) {
          console.log('Tokens found in database');

          // Check if the token is expired
          const expiresAt = new Date(tokens.expires_at);
          const now = new Date();

          if (expiresAt > now) {
            console.log('Database token is valid');

            // Update our local variables
            accessToken = tokens.access_token;
            refreshToken = tokens.refresh_token;
            tokenExpiry = expiresAt.getTime().toString();

            // Store the tokens in cookies for future use
            cookieStore.set('ringcentral_access_token', tokens.access_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
              path: '/'
            });

            cookieStore.set('ringcentral_refresh_token', tokens.refresh_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 60 * 60 * 24 * 30, // 30 days
              path: '/'
            });

            cookieStore.set('ringcentral_token_expiry', expiresAt.getTime().toString(), {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
              path: '/'
            });

            tokensValid = true;
          } else {
            console.log('Database token is expired');
          }
        } else {
          console.log('No tokens found in database');
        }
      } else {
        console.log('No authenticated user found');
      }
    }

    if (!tokensValid) {
      console.log('No valid tokens found');
      console.log('========== RINGCENTRAL GET TOKEN API - END (NOT AUTHENTICATED) ==========');
      return NextResponse.json({
        authenticated: false,
        message: 'Not authenticated with RingCentral'
      });
    }

    console.log('Returning valid access token');
    console.log('========== RINGCENTRAL GET TOKEN API - END (SUCCESS) ==========');

    // Return all the token information needed for WebRTC
    return NextResponse.json({
      authenticated: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: tokenExpiry ? parseInt(tokenExpiry) : undefined,
      token_type: 'bearer'
    });
  } catch (error: any) {
    console.log('Error getting token:');
    console.error('Get token error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL GET TOKEN API - END (ERROR) ==========');
    return NextResponse.json({
      authenticated: false,
      message: error.message || 'Unknown error occurred'
    });
  }
}
