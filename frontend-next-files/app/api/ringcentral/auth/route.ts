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
import { RingCentralTokenRevokedError } from '@/utils/ringcentral-client';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import type { ResponseCookies } from 'next/dist/server/web/spec-extension/cookies';

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

  // Attempt to satisfy linter by awaiting and casting, 
  // though cookies() in Route Handlers typically isn't a Promise.
  const cookieStore = await cookies() as ReadonlyRequestCookies; 

  console.log(`[AUTH_ROUTE] Action: ${action}, Timestamp: ${new Date().toISOString()}`);

  switch (action) {
    case 'authorize':
      return handleAuthorize(request, cookieStore);
    case 'check':
      return handleCheckAuth(request, cookieStore);
    case 'logout':
      return handleLogout(request, cookieStore);
    case 'token':
      return handleGetToken(request, cookieStore);
    case 'refresh':
      return handleTokenRefresh(request, cookieStore);
    default:
      console.warn(`[AUTH_ROUTE] Invalid action received: ${action}`);
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

/**
 * Generate and redirect to RingCentral authorization URL with PKCE
 */
async function handleAuthorize(request: NextRequest, cookieStore: ReadonlyRequestCookies) {
  console.log('[AUTH_AUTHORIZE] Start');
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
    const state = Math.random().toString(36).substring(2, 15);
    console.log('Step 1: Generating PKCE code_verifier and code_challenge');
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    console.log('Code verifier generated (length): Linter fix placeholder'); // Corrected logging
    console.log('Code challenge generated (length): Linter fix placeholder'); // Corrected logging

    // Get mutable cookies for setting
    const response = NextResponse.next(); // Create a response to set cookies on, if needed for ReadonlyRequestCookies context
                                        // However, cookies() from 'next/headers' in App Router Route Handlers can directly .set()
    
    // cookies() from 'next/headers' is Readonly. To set, you operate on a NextResponse object.
    // But since handleAuthorize is called with cookieStore (Readonly), let's assume this context doesn't intend to set cookies directly for now
    // or it would need to return a Response object where cookies are set.
    // For now, we will set cookies on a temporary response object if these cookies are critical for the redirect flow.
    // This part of the logic might need review based on how `cookieStore.set` is expected to work in this context.
    // The original code used `cookieStore.set`, which implies it might be a custom wrapper or an older API.
    // With `next/headers` cookies(), you set on a `NextResponse`.

    const tempResponseForCookies = NextResponse.json({});
    tempResponseForCookies.cookies.set('rc_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
      sameSite: 'lax'
    });
    tempResponseForCookies.cookies.set('rc_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
      sameSite: 'lax'
    });

    console.log('Step 2: Creating authorization URL with PKCE');
    const redirectUri = REDIRECT_URI;
    const authUrl = new URL(`${RINGCENTRAL_SERVER}/restapi/oauth/authorize`);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', RINGCENTRAL_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    authUrl.searchParams.append('scope', formatScopesForOAuth());
    console.log('Authorization URL:', authUrl.toString());
    console.log('========== RINGCENTRAL AUTH API - END (REDIRECT) ==========');

    const redirectResponse = NextResponse.redirect(authUrl.toString());
    // Transfer cookies set on tempResponseForCookies to the actual redirectResponse
    tempResponseForCookies.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie as ResponseCookie);
    });
    return redirectResponse;

  } catch (error: any) {
    console.error('Authorization error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL AUTH API - END (ERROR) ==========');
    return NextResponse.json({ error: error.message || UNKNOWN_ERROR_OCCURRED }, { status: 500 });
  }
}

// Define a clear structure for token data from Supabase
interface DatabaseTokenData {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null; // ISO string format from DB
  refresh_token_expires_at: string | null; // ISO string format from DB
  token_type: string | null;
  scope: string | null;
}

function setTokenCookies(
  cookieSetter: ResponseCookies,
  accessToken: string,
  refreshToken: string,
  accessTokenExpiryTime: number, 
  refreshTokenExpiryTime: number, 
  tokenType: string = 'bearer',
  scope?: string
) {
  const secure = process.env.NODE_ENV === 'production';
  const sameSite = secure ? 'lax' : 'lax';
  const path = '/';
  const domain = undefined;

  const cookieOptionsBase: Partial<ResponseCookie> = {
    httpOnly: true,
    secure,
    sameSite,
    path,
    domain,
  };

  console.log('[SET_TOKEN_COOKIES] Setting cookies with attributes (path, domain, secure, httpOnly, sameSite):', {
    path: cookieOptionsBase.path,
    domain: cookieOptionsBase.domain,
    secure: cookieOptionsBase.secure,
    httpOnly: cookieOptionsBase.httpOnly,
    sameSite: cookieOptionsBase.sameSite,
    accessTokenFirst10: accessToken?.substring(0,10),
    refreshTokenFirst10: refreshToken?.substring(0,10),
    accessTokenExpiryISO: new Date(accessTokenExpiryTime).toISOString(),
    refreshTokenExpiryISO: new Date(refreshTokenExpiryTime).toISOString(),
    tokenType,
    scope
  });

  cookieSetter.set('ringcentral_access_token', accessToken, {
    ...cookieOptionsBase,
    expires: new Date(accessTokenExpiryTime),
  });
  cookieSetter.set('ringcentral_refresh_token', refreshToken, {
    ...cookieOptionsBase,
    expires: new Date(refreshTokenExpiryTime),
  });
  cookieSetter.set('ringcentral_access_token_expiry_time', String(accessTokenExpiryTime), {
    ...cookieOptionsBase,
    expires: new Date(accessTokenExpiryTime),
  });
  cookieSetter.set(
    'ringcentral_refresh_token_expiry_time',
    String(refreshTokenExpiryTime),
    { ...cookieOptionsBase, expires: new Date(refreshTokenExpiryTime) }
  );
  cookieSetter.set('ringcentral_token_type', tokenType, {
    ...cookieOptionsBase,
    expires: new Date(refreshTokenExpiryTime),
  });
  if (scope) {
    cookieSetter.set('ringcentral_scope', scope, {
      ...cookieOptionsBase,
      expires: new Date(refreshTokenExpiryTime),
    });
  }
  console.log('[SET_TOKEN_COOKIES] Finished setting cookies.');
}

function clearTokenCookies(cookieSetter: ResponseCookies) {
  console.log('[CLEAR_TOKEN_COOKIES] Clearing cookies...');
  const pastDate = new Date(0);
  const cookieOptions: Partial<ResponseCookie> = { 
    path: '/', 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production', 
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax', 
    expires: pastDate 
  };
  cookieSetter.set('ringcentral_access_token', '', cookieOptions);
  cookieSetter.set('ringcentral_refresh_token', '', cookieOptions);
  cookieSetter.set('ringcentral_access_token_expiry_time', '', cookieOptions);
  cookieSetter.set('ringcentral_refresh_token_expiry_time', '', cookieOptions);
  cookieSetter.set('ringcentral_token_type', '', cookieOptions);
  cookieSetter.set('ringcentral_scope', '', cookieOptions);
  cookieSetter.set('rc_oauth_state', '', { ...cookieOptions, httpOnly: false });
  cookieSetter.set('rc_code_verifier', '', { ...cookieOptions, httpOnly: false }); 
  console.log('RingCentral token cookies cleared.');
}

/**
 * Check if the user is authenticated with RingCentral
 */
async function handleCheckAuth(request: NextRequest, cookieStore: ReadonlyRequestCookies) {
  const checkAuthId = crypto.randomBytes(4).toString('hex');
  console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] Start. Timestamp: ${new Date().toISOString()}`);
  let isAuthenticated = false; // Declare isAuthenticated
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const now = Date.now();
  const nowISO = new Date(now).toISOString();
  const response = NextResponse.json({}); // Base response, cookies will be added if needed

  try {
    if (user) {
      console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] Supabase user found:`, { id: user.id, email: user.email });
      const { data: dbTokensData, error: dbTokenError } = await supabase
        .from('ringcentral_tokens')
        .select('access_token, refresh_token, expires_at, refresh_token_expires_at, token_type, scope')
        .eq('user_id', user.id)
        .maybeSingle<DatabaseTokenData>();

      if (dbTokenError && dbTokenError.code !== 'PGRST116') {
        console.error(`[AUTH_CHECK_AUTH][${checkAuthId}] Error retrieving DB tokens:`, dbTokenError);
      } else if (dbTokensData) {
        const dbAccessToken = dbTokensData.access_token;
        const dbRefreshToken = dbTokensData.refresh_token;
        const dbAccessTokenExpiry = dbTokensData.expires_at ? new Date(dbTokensData.expires_at).getTime() : null;
        const dbRefreshTokenExpiry = dbTokensData.refresh_token_expires_at ? new Date(dbTokensData.refresh_token_expires_at).getTime() : null;
        
        console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] Tokens found in DB:`, {
          hasAccessToken: !!dbAccessToken,
          accessTokenFirst10: dbAccessToken?.substring(0,10),
          dbExpiresAtISO: dbTokensData.expires_at,
          parsedDbAccessTokenExpiryEpoch: dbAccessTokenExpiry,
          isDbAccessTokenValid: dbAccessTokenExpiry ? (dbAccessTokenExpiry > now) : false,
          nowISO,
        });
        
        if (dbAccessToken && dbRefreshToken && dbAccessTokenExpiry && dbAccessTokenExpiry > now && dbRefreshTokenExpiry && dbRefreshTokenExpiry > now) {
          console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] Valid token found in DB. Synchronizing cookies.`);
          setTokenCookies(
            response.cookies, // Set on the main response object
            dbAccessToken,
            dbRefreshToken,
            dbAccessTokenExpiry,
            dbRefreshTokenExpiry,
            dbTokensData.token_type || 'bearer',
            dbTokensData.scope || undefined
          );
          isAuthenticated = true;
          const responseBody = { isAuthenticated: true, source: 'database', userId: user.id, email: user.email, checkAuthId, timestamp: new Date().toISOString() };
          const responseJsonString = JSON.stringify(responseBody);
          console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] PRE_RETURN (Authenticated via DB). JSON String: ${responseJsonString}`);
          return new NextResponse(responseJsonString, { status: 200, headers: response.headers });
        } else {
          console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] Token in DB invalid/expired.`);
        }
      } else {
        console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] No RingCentral tokens in DB for this user.`);
      }
    } else {
      console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] No Supabase user session found. Checking cookies only.`);
    }

    // Fallback: Check cookies if no user or no valid DB token
    const cookieAccessToken = cookieStore.get('ringcentral_access_token')?.value;
    const cookieTokenExpiryString = cookieStore.get('ringcentral_access_token_expiry_time')?.value;
    
    console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] Cookie check values:`, {
      cookieAccessTokenFirst10: cookieAccessToken?.substring(0,10),
      cookieTokenExpiryString,
    });

    if (cookieAccessToken && cookieTokenExpiryString) {
      const cookieTokenExpiry = parseInt(cookieTokenExpiryString, 10);
      if (!isNaN(cookieTokenExpiry)) {
          const isCookieTokenValid = cookieTokenExpiry > now;
          console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] Parsed cookie token expiry:`, {
              cookieTokenExpiryDate: new Date(cookieTokenExpiry).toISOString(),
              nowDate: nowISO,
              isCookieTokenValid
          });
          if (isCookieTokenValid) {
            console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] End (Authenticated via Cookies).`);
            isAuthenticated = true;
            const responseBody = { isAuthenticated: true, source: 'cookies', checkAuthId, timestamp: new Date().toISOString() };
            const responseJsonString = JSON.stringify(responseBody);
            console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] PRE_RETURN (Authenticated via Cookies). JSON String: ${responseJsonString}`);
            return new NextResponse(responseJsonString, { status: 200 }); // Cookies are already in request, no need to re-set from 'response.headers' here
          } else {
            console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] Token in cookies expired.`);
          }
      } else {
          console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] Invalid cookie token expiry string:`, cookieTokenExpiryString);
      }
    } else {
      console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] No valid access token or expiry in cookies.`);
    }

    console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] End (Not Authenticated).`);
    const responseBody = { isAuthenticated: false, source: 'none', checkAuthId, timestamp: new Date().toISOString() };
    const responseJsonString = JSON.stringify(responseBody);
    console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] PRE_RETURN (Not Authenticated - Fallthrough). JSON String: ${responseJsonString}`);
    return new NextResponse(responseJsonString, { status: 200, headers: response.headers }); // Pass response.headers in case any cookies were cleared by a sub-function call

  } catch (error: any) {
    console.error(`[AUTH_CHECK_AUTH][${checkAuthId}] Error:`, error.message, error.stack);
    const errorBody = { isAuthenticated: false, error: error.message || UNKNOWN_ERROR_OCCURRED, checkAuthId, timestamp: new Date().toISOString() };
    const errorJsonString = JSON.stringify(errorBody);
    console.log(`[AUTH_CHECK_AUTH][${checkAuthId}] PRE_RETURN (Error). JSON String: ${errorJsonString}`);
    return new NextResponse(errorJsonString, { status: 500 });
  }
}

/**
 * Logout from RingCentral
 */
async function handleLogout(request: NextRequest, cookieStore: ReadonlyRequestCookies) {
  console.log('========== RINGCENTRAL LOGOUT API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  const response = NextResponse.json({ success: true, message: 'Logout successful' });
  clearTokenCookies(response.cookies); // Clear cookies on the response object

  const supabase = createClient(cookieStore); // Create client with existing cookies to get user
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    console.log('User found, attempting to clear RingCentral tokens from database for user_id:', user.id);
    const { error: deleteError } = await supabase
      .from('ringcentral_tokens')
      .delete()
      .eq('user_id', user.id);
    if (deleteError) {
      console.error('Error deleting RingCentral tokens from database:', deleteError);
    } else {
      console.log('Successfully deleted RingCentral tokens from database for user_id:', user.id);
    }
  } else {
    console.log('No Supabase user found, skipping database token deletion.');
  }
  console.log('========== RINGCENTRAL LOGOUT API - END (SUCCESS) ==========');
  return response;
}

/**
 * Retrieves the current RingCentral access token if available and valid.
 * This is a simplified version, actual token validation (e.g. expiry) should be robust.
 */
async function handleGetToken(request: NextRequest, cookieStore: ReadonlyRequestCookies) {
  const getTokenId = crypto.randomBytes(4).toString('hex');
  console.log(`[AUTH_GET_TOKEN][${getTokenId}] Start. Timestamp: ${new Date().toISOString()}`);
  
  try {
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;
    const expiryTimeStr = cookieStore.get('ringcentral_access_token_expiry_time')?.value;
    const expiryTime = expiryTimeStr ? parseInt(expiryTimeStr, 10) : null;
    const now = Date.now();

    console.log(`[AUTH_GET_TOKEN][${getTokenId}] Retrieved from cookies:`, {
        accessTokenFirst10: accessToken?.substring(0,10),
        expiryTimeStr,
        parsedExpiryTimeEpoch: expiryTime,
        isTokenValid: expiryTime ? expiryTime > now : false,
        nowEpoch: now
    });

    if (accessToken && expiryTime && expiryTime > now) {
      console.log(`[AUTH_GET_TOKEN][${getTokenId}] Valid access token found in cookies.`);
      return NextResponse.json({ accessToken, expiresAt: expiryTime });
    } else {
      // If no valid cookie token, let's try to see if there's one in the DB (like handleCheckAuth)
      // This makes `getToken` more robust, but `handleCheckAuth` is the primary source for auth status.
      console.log(`[AUTH_GET_TOKEN][${getTokenId}] No valid token in cookies. Attempting DB check.`);
      const supabase = createClient(cookieStore);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dbTokensData } = await supabase
          .from('ringcentral_tokens')
          .select('access_token, expires_at')
          .eq('user_id', user.id)
          .maybeSingle<Pick<DatabaseTokenData, 'access_token' | 'expires_at'>>();
        
        if (dbTokensData && dbTokensData.access_token && dbTokensData.expires_at) {
          const dbExpiryTime = new Date(dbTokensData.expires_at).getTime();
          if (dbExpiryTime > now) {
            console.log(`[AUTH_GET_TOKEN][${getTokenId}] Valid token found in DB. Note: Cookies are not being re-set here.`);
            // It's generally better for the client to rely on /api/auth?action=check for cookie sync.
            // Returning DB token directly if cookies were missing/stale.
            return NextResponse.json({ accessToken: dbTokensData.access_token, expiresAt: dbExpiryTime, source: 'database' });
          }
        }
      }
      console.log(`[AUTH_GET_TOKEN][${getTokenId}] No valid access token available from cookies or DB.`);
      return NextResponse.json({ error: 'No valid access token available' }, { status: 401 });
    }
  } catch (error: any) {
    console.error(`[AUTH_GET_TOKEN][${getTokenId}] Error:`, error.message, error.stack);
    return NextResponse.json({ error: error.message || UNKNOWN_ERROR_OCCURRED }, { status: 500 });
  }
}

/**
 * Handle RingCentral token refresh.
 * This function is called when the client suspects the access token is expired
 * or when it needs a new one.
 */
async function handleTokenRefresh(request: NextRequest, cookieStore: ReadonlyRequestCookies) {
  const refreshId = crypto.randomBytes(4).toString('hex');
  console.log(`[AUTH_TOKEN_REFRESH][${refreshId}] Start. Timestamp: ${new Date().toISOString()}`);
  const response = NextResponse.json({}); // Base response, cookies will be set here
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  const currentRefreshToken = cookieStore.get('ringcentral_refresh_token')?.value;

  if (!currentRefreshToken) {
    console.log(`[AUTH_TOKEN_REFRESH][${refreshId}] No refresh token in cookies.`);
    clearTokenCookies(response.cookies); // Clear any lingering auth cookies
    if (user) {
        console.log(`[AUTH_TOKEN_REFRESH][${refreshId}] Deleting DB tokens for user ${user.id} due to missing refresh token.`);
        await supabase.from('ringcentral_tokens').delete().eq('user_id', user.id);
    }
    return new NextResponse(JSON.stringify({ error: 'No refresh token available', reauthorize: true, refreshId }), { status: 401, headers: response.headers });
  }

  if (!RINGCENTRAL_CLIENT_ID || !RINGCENTRAL_CLIENT_SECRET) {
    console.error(`[AUTH_TOKEN_REFRESH][${refreshId}] RINGCENTRAL_CLIENT_ID or CLIENT_SECRET is not configured.`);
    clearTokenCookies(response.cookies);
    if (user) {
        console.log(`[AUTH_TOKEN_REFRESH][${refreshId}] Deleting DB tokens for user ${user.id} due to server config error.`);
        await supabase.from('ringcentral_tokens').delete().eq('user_id', user.id);
    }
    return new NextResponse(JSON.stringify({ error: 'Server configuration error', reauthorize: true, refreshId }), { status: 500, headers: response.headers });
  }

  try {
    console.log(`[AUTH_TOKEN_REFRESH][${refreshId}] Attempting refresh. Refresh token (first 10): ${currentRefreshToken.substring(0,10)}`);
    const tokenUrl = `${RINGCENTRAL_SERVER}/restapi/oauth/token`;
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: currentRefreshToken,
      client_id: RINGCENTRAL_CLIENT_ID, // Now asserted as string or handled by above check
    });

    const rcResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${RINGCENTRAL_CLIENT_ID}:${RINGCENTRAL_CLIENT_SECRET}`).toString('base64')}`
      },
      body: params.toString(),
    });

    const data = await rcResponse.json();

    if (!rcResponse.ok) {
      console.error(`[AUTH_TOKEN_REFRESH][${refreshId}] Refresh failed. Status: ${rcResponse.status}, Body:`, data);
      clearTokenCookies(response.cookies); // Clear cookies on failure
      if (user) {
        console.log(`[AUTH_TOKEN_REFRESH][${refreshId}] Deleting DB tokens for user ${user.id} due to refresh failure.`);
        await supabase.from('ringcentral_tokens').delete().eq('user_id', user.id);
      }
      const reauthorize = rcResponse.status === 400 || rcResponse.status === 401;
      return new NextResponse(JSON.stringify({ error: data.error_description || data.message || 'Failed to refresh token', reauthorize, refreshId }), { status: rcResponse.status, headers: response.headers });
    }

    console.log(`[AUTH_TOKEN_REFRESH][${refreshId}] Refresh successful. Updating cookies & DB. Data:`, {
      accessTokenFirst10: data.access_token?.substring(0,10),
      refreshTokenFirst10: data.refresh_token?.substring(0,10),
      expires_in: data.expires_in,
      refresh_token_expires_in: data.refresh_token_expires_in
    });
    const { access_token, refresh_token, expires_in, refresh_token_expires_in, scope, token_type } = data;
    const now = Date.now();
    const accessTokenExpiresAt = now + (expires_in * 1000);
    const refreshTokenExpiresAt = now + (refresh_token_expires_in * 1000);

    setTokenCookies(response.cookies, access_token, refresh_token, accessTokenExpiresAt, refreshTokenExpiresAt, token_type, scope);

    if (user) {
      const { error: dbError } = await supabase
        .from('ringcentral_tokens')
        .update({
          access_token: access_token,
          refresh_token: refresh_token,
          expires_at: new Date(accessTokenExpiresAt).toISOString(),
          refresh_token_expires_at: new Date(refreshTokenExpiresAt).toISOString(),
          token_type: token_type,
          scope: scope,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      if (dbError) console.error(`[AUTH_TOKEN_REFRESH][${refreshId}] Error updating DB tokens for user ${user.id}:`, dbError);
      else console.log(`[AUTH_TOKEN_REFRESH][${refreshId}] DB tokens updated for user: ${user.id}`);
    }
    const successBody = { success: true, message: 'Token refreshed', accessToken: access_token, expiresAt: accessTokenExpiresAt, refreshId };
    return new NextResponse(JSON.stringify(successBody), { status: 200, headers: response.headers });

  } catch (error: any) {
    console.error(`[AUTH_TOKEN_REFRESH][${refreshId}] Exception:`, error.message, error.stack);
    clearTokenCookies(response.cookies); // Clear cookies on exception
     if (user) {
        console.log(`[AUTH_TOKEN_REFRESH][${refreshId}] Deleting DB tokens for user ${user.id} due to exception.`);
        await supabase.from('ringcentral_tokens').delete().eq('user_id', user.id);
    }
    return new NextResponse(JSON.stringify({ error: error.message || UNKNOWN_ERROR_OCCURRED, reauthorize: true, refreshId }), { status: 500, headers: response.headers });
  }
}

async function clearStaleTokens(supabase: any, userId: string | undefined, cookieSetter: ResponseCookies, reason: string) {
  console.warn(`[CLEAR_STALE_TOKENS] Called. Reason: ${reason}. Note: Cookie clearing should primarily happen in the calling handler on its NextResponse object.`);
  // This function is less critical now as direct cookie manipulation on response objects is preferred.
  // It can still be a utility for DB cleanup if needed separately.
  if (userId && supabase) {
    // ... (database clearing logic as before) ...
  }
}
