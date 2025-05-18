import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import {
  RINGCENTRAL_CLIENT_ID,
  RINGCENTRAL_CLIENT_SECRET,
  RINGCENTRAL_SERVER,
  REDIRECT_URI,
  formatScopesForOAuth
} from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED, FAILED_TO_LOGOUT } from '@/lib/constants';

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
    case 'refresh':
      return handleTokenRefresh(request);
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
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL_URL:', process.env.VERCEL_URL || 'Not set');

    // We're using a stable redirect URI that doesn't change with deployments
    // This ensures that the redirect URI is always the same and matches what's configured in RingCentral
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
    return NextResponse.json({ error: error.message || UNKNOWN_ERROR_OCCURRED }, { status: 500 });
  }
}

/**
 * Check if the user is authenticated with RingCentral
 */
async function handleCheckAuth(request: NextRequest) {
  console.log('========== RINGCENTRAL AUTH CHECK API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;
    const tokenExpiryString = cookieStore.get('ringcentral_access_token_expiry_time')?.value;
    const tokenExpiry = tokenExpiryString ? parseInt(tokenExpiryString, 10) : null;

    console.log('Cookie Access token available:', !!accessToken);
    console.log('Cookie Token expiry available:', !!tokenExpiry);

    if (tokenExpiry) {
      const expiryDate = new Date(tokenExpiry);
      const now = new Date();
      console.log('Cookie Token expiry date:', expiryDate.toISOString());
      console.log('Current date:', now.toISOString());
      console.log('Cookie Token expired:', expiryDate <= now);
    }

    let isAuthenticated = false;

    if (accessToken && tokenExpiry && tokenExpiry > Date.now()) {
      console.log('Valid RingCentral token found in cookies.');
      isAuthenticated = true;
    } else {
      console.log('No valid RingCentral token in cookies, checking Supabase for existing user session.');
      const supabase = createClient(cookieStore);
      let { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error fetching Supabase user:", userError);
        // Decide if this is critical enough to stop, or proceed as unauthenticated
      }

      if (user && !user.user_metadata?.is_anonymous) {
        console.log('Authenticated Supabase user found (not anonymous). Checking DB for RingCentral tokens for user_id:', user.id);
        const { data: tokens, error: dbTokenError } = await supabase
          .from('ringcentral_tokens')
          .select('access_token, refresh_token, expires_at, refresh_token_expires_at')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (dbTokenError && dbTokenError.code !== 'PGRST116') { // PGRST116: no rows found, not an error here
          console.error('Error retrieving RingCentral tokens from database:', dbTokenError);
        } else if (tokens) {
          console.log('Retrieved tokens from DB:', {
            hasAccessToken: !!tokens.access_token,
            expiresAt: tokens.expires_at,
            hasRefreshToken: !!tokens.refresh_token,
          });
          const dbAccessTokenExpiry = tokens.expires_at ? new Date(tokens.expires_at).getTime() : null;

          if (tokens.access_token && dbAccessTokenExpiry && dbAccessTokenExpiry > Date.now()) {
            console.log('Database RingCentral token is valid. Setting cookies.');
            
            cookieStore.set('ringcentral_access_token', tokens.access_token, {
              httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: new Date(dbAccessTokenExpiry), path: '/', sameSite: 'lax'
            });
            cookieStore.set('ringcentral_access_token_expiry_time', dbAccessTokenExpiry.toString(), {
              httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: new Date(dbAccessTokenExpiry), path: '/', sameSite: 'lax'
            });

            if (tokens.refresh_token) {
              const dbRefreshTokenExpiry = tokens.refresh_token_expires_at ? new Date(tokens.refresh_token_expires_at).getTime() : undefined;
              cookieStore.set('ringcentral_refresh_token', tokens.refresh_token, {
                httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: dbRefreshTokenExpiry ? new Date(dbRefreshTokenExpiry) : undefined, path: '/', sameSite: 'lax'
              });
              if (dbRefreshTokenExpiry) {
                cookieStore.set('ringcentral_refresh_token_expiry_time', dbRefreshTokenExpiry.toString(), {
                    httpOnly: true, secure: process.env.NODE_ENV === 'production', expires: new Date(dbRefreshTokenExpiry), path: '/', sameSite: 'lax'
                });
              }
            }
            isAuthenticated = true;
          } else {
            console.log('Database RingCentral token is expired or invalid.');
          }
        } else {
          console.log('No RingCentral tokens found in database for this user.');
        }
      } else if (user && user.user_metadata?.is_anonymous) {
        console.log('User session is for an anonymous Supabase user. Anonymous users do not have RingCentral tokens by default.');
        isAuthenticated = false; 
      } else {
        console.log('No active Supabase user session found. RingCentral authentication cannot be established.');
        // At this point, we know there's no RC auth. If app policy requires an anonymous user for other reasons,
        // it could be created here, but it won't change RC auth status.
        // For example:
        // console.log('No authenticated Supabase user, creating a new anonymous user for app session purposes...');
        // const { data: newUserData, error: signUpError } = await supabase.auth.signUp({ ... });
        // if (newUserData?.user) user = newUserData.user; // For further app logic if needed
        isAuthenticated = false;
      }
    }

    if (!isAuthenticated) {
      console.log('User is not authenticated with RingCentral');
      console.log('========== RINGCENTRAL AUTH CHECK API - END (NOT AUTHENTICATED) ==========');
      return NextResponse.json({ authenticated: false, message: RINGCENTRAL_NOT_AUTHENTICATED_ERROR });
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
      message: error.message || UNKNOWN_ERROR_OCCURRED
    });
  }
}

/**
 * Logout from RingCentral
 */
async function handleLogout(request: NextRequest) {
  console.log('========== RINGCENTRAL LOGOUT API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  const cookieStore = await cookies();

  try {
    // Remove RingCentral specific cookies
    cookieStore.delete('ringcentral_access_token');
    cookieStore.delete('ringcentral_refresh_token');
    cookieStore.delete('ringcentral_access_token_expiry_time');
    cookieStore.delete('rc_oauth_state'); // Also clear PKCE related cookies if any
    cookieStore.delete('rc_code_verifier');

    // Attempt to revoke tokens with RingCentral (optional, but good practice)
    // This part might need the access_token one last time, or specific logic.
    // For now, we focus on clearing local session.

    // Clear tokens from Supabase if a user is logged in
    const supabase = createClient(cookieStore);
    const { data: { user } } = await supabase.auth.getUser();

    if (user && !user.is_anonymous) {
      console.log('User found, attempting to clear RingCentral tokens from database for user_id:', user.id);
      const { error: deleteError } = await supabase
        .from('ringcentral_tokens')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting RingCentral tokens from database:', deleteError);
        // Not returning error to client, as logout should proceed locally
      } else {
        console.log('Successfully deleted RingCentral tokens from database for user_id:', user.id);
      }
    } else {
      console.log('No authenticated Supabase user or user is anonymous, skipping database token deletion.');
    }

    console.log('Local RingCentral session cleared.');
    console.log('========== RINGCENTRAL LOGOUT API - END (SUCCESS) ==========');
    return NextResponse.json({ success: true, message: 'Successfully logged out from RingCentral locally.' });
  } catch (error: any) {
    console.error('Error during RingCentral logout:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL LOGOUT API - END (ERROR) ==========');
    return NextResponse.json({ success: false, error: error.message || FAILED_TO_LOGOUT }, { status: 500 });
  }
}

/**
 * Retrieves the current RingCentral access token if available and valid.
 * This is a simplified version, actual token validation (e.g. expiry) should be robust.
 */
async function handleGetToken(request: NextRequest) {
  console.log('========== RINGCENTRAL GET TOKEN API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  const cookieStore = await cookies();
  try {
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;
    const expiryTime = cookieStore.get('ringcentral_access_token_expiry_time')?.value;

    if (accessToken && expiryTime && parseInt(expiryTime) > Date.now()) {
      console.log('Valid access token found.');
      console.log('========== RINGCENTRAL GET TOKEN API - END (SUCCESS) ==========');
      return NextResponse.json({ accessToken });
    } else {
      console.log('No valid access token found or token expired.');
      // Optionally, try to refresh here if a refresh token is available
      // For simplicity, just returning not found
      console.log('========== RINGCENTRAL GET TOKEN API - END (NO TOKEN) ==========');
      return NextResponse.json({ error: 'No valid access token available' }, { status: 401 });
    }
  } catch (error: any) {
    console.error('Error retrieving token:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL GET TOKEN API - END (ERROR) ==========');
    return NextResponse.json({ error: error.message || UNKNOWN_ERROR_OCCURRED }, { status: 500 });
  }
}

/**
 * Handle RingCentral token refresh.
 * This function is called when the client suspects the access token is expired
 * or when it needs a new one.
 */
async function handleTokenRefresh(request: NextRequest) {
  console.log('========== RINGCENTRAL TOKEN REFRESH API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request URL:', request.url);
  console.log('Request headers:', Object.fromEntries(request.headers));

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { data: { user } , error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Error fetching Supabase user during token refresh or no user found:', userError?.message || 'No user');
      return NextResponse.json({ error: 'User session not found or invalid.', reauthorize: true }, { status: 401 });
    }
    if (user.user_metadata?.is_anonymous) {
      console.warn('Attempting token refresh for an anonymous user. This should typically not happen.', { userId: user.id });
      // Depending on policy, you might allow or deny this. Denying is safer for RingCentral tokens.
      return NextResponse.json({ error: 'Token refresh not allowed for anonymous users.', reauthorize: true }, { status: 403 });
    }

    const refreshToken = cookieStore.get('ringcentral_refresh_token')?.value;

    if (!refreshToken) {
      console.log('No RingCentral refresh token found in cookies.');
      await clearStaleTokens(supabase, user.id, cookieStore, 'No refresh token in cookies');
      console.log('========== RINGCENTRAL TOKEN REFRESH API - END (NO REFRESH TOKEN) ==========');
      return NextResponse.json({ error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR, reauthorize: true, details: 'No refresh token available' }, { status: 401 });
    }

    console.log('Step 1: Attempting to refresh token with RingCentral');
    
    // Log basic info about refresh token to help debug
    console.log('Refresh token info:', {
      tokenLength: refreshToken?.length || 0,
      firstFiveChars: refreshToken?.substring(0, 5) || '',
      lastFiveChars: refreshToken?.substring(refreshToken.length - 5) || '',
    });
    
    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: RINGCENTRAL_CLIENT_ID as string,
        // client_secret: RINGCENTRAL_CLIENT_SECRET as string, // Not always needed for refresh with PKCE-issued tokens but good for explicit confidential client
      });

      console.log('Refresh token request details:');
      console.log(' Token URL:', `${RINGCENTRAL_SERVER}/restapi/oauth/token`);
      console.log(' Grant Type:', params.get('grant_type'));
      console.log(' Client ID:', params.get('client_id'));
      // Avoid logging refresh token itself unless absolutely necessary for deep debugging

      const response = await fetch(`${RINGCENTRAL_SERVER}/restapi/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${RINGCENTRAL_CLIENT_ID}:${RINGCENTRAL_CLIENT_SECRET}`).toString('base64')}`
        },
        body: params.toString(),
      });

      if (!response.ok) {
        let tokenData = {};
        try {
          tokenData = await response.json();
        } catch (e) {
          console.error('Error parsing token refresh response:', e);
          // Continue with empty tokenData
        }
        
        console.error('RingCentral token refresh failed. Status:', response.status);
        console.error('Response body:', tokenData);
        
                 if ((tokenData as any).error === 'invalid_grant') {
           console.log('Refresh token is invalid or revoked. Clearing stale tokens.');
           await clearStaleTokens(supabase, user.id, cookieStore, 'invalid_grant on refresh');
           return NextResponse.json({ error: 'RingCentral refresh token is invalid or expired. Please re-authenticate.', reauthorize: true }, { status: 401 });
         }
         
         return NextResponse.json({ 
           error: (tokenData as any).error_description || 'Failed to refresh RingCentral token', 
           details: tokenData 
         }, { status: response.status });
      }

      const tokenData = await response.json();

      console.log('Token refresh successful from RingCentral.');
      console.log('Received token data:', {
          hasAccessToken: !!tokenData.access_token,
          accessTokenLength: tokenData.access_token?.length || 0, 
          hasRefreshToken: !!tokenData.refresh_token, // RC usually returns a new refresh token
          refreshTokenLength: tokenData.refresh_token?.length || 0,
          expiresIn: tokenData.expires_in,
          scope: tokenData.scope,
          tokenType: tokenData.token_type,
          ownerId: tokenData.owner_id, // Present in refresh response
          endpointId: tokenData.endpoint_id // Present in refresh response
      });

      console.log('Step 2: Storing new tokens in cookies.');
      const newAccessToken = tokenData.access_token;
      const newRefreshToken = tokenData.refresh_token; // RingCentral may issue a new refresh token
      const expiresIn = tokenData.expires_in;
      const newExpiresAt = Date.now() + (expiresIn * 1000);

      // Set access token and its expiry in cookies
      await cookieStore.set('ringcentral_access_token', newAccessToken, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: expiresIn, 
        path: '/',
        sameSite: 'lax' 
      });
      
      await cookieStore.set('ringcentral_access_token_expiry_time', newExpiresAt.toString(), { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', 
        maxAge: expiresIn, 
        path: '/', 
        sameSite: 'lax' 
      });
      
      // Handle refresh token and its expiry
      const newRefreshTokenExpiresIn = tokenData.refresh_token_expires_in || 60 * 60 * 24 * 30; // Default 30 days if not specified
      const newRefreshTokenServerExpiryTime = Date.now() + (newRefreshTokenExpiresIn * 1000);
      
      console.log(`New refresh token expires in ${newRefreshTokenExpiresIn}s, at ${new Date(newRefreshTokenServerExpiryTime).toISOString()}`);

      if (newRefreshToken) {
        await cookieStore.set('ringcentral_refresh_token', newRefreshToken, {
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production', 
          maxAge: newRefreshTokenExpiresIn,
          path: '/', 
          sameSite: 'lax' 
        });
        
        await cookieStore.set('ringcentral_refresh_token_expiry_time', newRefreshTokenServerExpiryTime.toString(), {
          httpOnly: true, 
          secure: process.env.NODE_ENV === 'production', 
          maxAge: newRefreshTokenExpiresIn, 
          path: '/', 
          sameSite: 'lax'
        });
      } else {
        console.warn('RingCentral did not return a new refresh token. Using the existing one.');
      }

      console.log('Step 3: Storing new tokens in Supabase.');
      console.log('User found, updating tokens in database for user_id:', user.id);

      const upsertData: any = {
        user_id: user.id,
        access_token: newAccessToken,
        expires_at: new Date(newExpiresAt).toISOString(),
        scope: tokenData.scope,
        token_type: tokenData.token_type,
        updated_at: new Date().toISOString(),
      };

      if (newRefreshToken) {
        upsertData.refresh_token = newRefreshToken;
        upsertData.refresh_token_expires_at = new Date(newRefreshTokenServerExpiryTime).toISOString();
      }

      const { data: upsertedDbData, error: dbError } = await supabase
        .from('ringcentral_tokens')
        .upsert(upsertData, { 
            onConflict: 'user_id', // Assumes 'user_id' has a UNIQUE constraint
          })
        .select(); // Select the data to confirm the write

      if (dbError) {
        console.error('Error upserting new RingCentral tokens to database:', dbError);
        // Even if DB store fails, cookies are set, so client might proceed. Log and monitor.
      } else {
        console.log('Successfully upserted new RingCentral tokens to Supabase.', upsertedDbData);
      }

      console.log('========== RINGCENTRAL TOKEN REFRESH API - END (SUCCESS) ==========');
      return NextResponse.json({
        success: true,
        message: 'Token refreshed successfully.',
        accessToken: newAccessToken, // Send back for RingCentralClient to update itself
        expiresAt: newExpiresAt,     // Send back for RingCentralClient to update itself
      });

    } catch (refreshError: any) {
      console.error('Token refresh API error:', refreshError.message);
      console.error('Error stack:', refreshError.stack);
      console.log('========== RINGCENTRAL TOKEN REFRESH API - END (REFRESH ERROR) ==========');
      return NextResponse.json({ 
        error: refreshError.message || 'An error occurred during token refresh API call',
        stack: process.env.NODE_ENV === 'development' ? refreshError.stack : undefined,
        reauthorize: true 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Token refresh error (outer catch block):', error.message, error.stack);
    console.log('========== RINGCENTRAL TOKEN REFRESH API - END (ERROR) ==========');
    return NextResponse.json({ 
      error: error.message || 'An unexpected error occurred during token refresh.',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      reauthorize: true 
    }, { status: 500 });
  }
}

async function clearStaleTokens(supabase: any, userId: string, cookieStore: any, reason: string) {
  // ... existing code ...
}
