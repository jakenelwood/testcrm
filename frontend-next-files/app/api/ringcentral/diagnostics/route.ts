import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { REQUIRED_SCOPES } from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, FAILED_TO_GENERATE_DIAGNOSTICS } from '@/lib/constants';
import { RingCentralClient } from '@/utils/ringcentral-client';

/**
 * Comprehensive RingCentral Diagnostics API
 *
 * This endpoint gathers extensive information about the RingCentral configuration,
 * authentication status, and environment to help troubleshoot integration issues.
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL DIAGNOSTICS API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // 1. Gather all environment variables related to RingCentral
    const envVars = {
      // Server configuration
      RINGCENTRAL_SERVER: process.env.RINGCENTRAL_SERVER,

      // Authentication credentials
      RINGCENTRAL_CLIENT_ID: process.env.RINGCENTRAL_CLIENT_ID ? 'Set (hidden)' : 'Not set',
      RINGCENTRAL_CLIENT_SECRET: process.env.RINGCENTRAL_CLIENT_SECRET ? 'Set (hidden)' : 'Not set',
      RINGCENTRAL_USERNAME: process.env.RINGCENTRAL_USERNAME ? 'Set (hidden)' : 'Not set',
      RINGCENTRAL_EXTENSION: process.env.RINGCENTRAL_EXTENSION,
      RINGCENTRAL_PASSWORD: process.env.RINGCENTRAL_PASSWORD ? 'Set (hidden)' : 'Not set',

      // Phone numbers
      RINGCENTRAL_FROM_NUMBER: process.env.RINGCENTRAL_FROM_NUMBER,
      NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER: process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER,

      // OAuth configuration
      REDIRECT_URI: process.env.REDIRECT_URI,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

      // Client-side configuration
      NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID ? 'Set (hidden)' : 'Not set',
      NEXT_PUBLIC_RINGCENTRAL_SERVER: process.env.NEXT_PUBLIC_RINGCENTRAL_SERVER,
      NEXT_PUBLIC_RINGCENTRAL_DOMAIN: process.env.NEXT_PUBLIC_RINGCENTRAL_DOMAIN,
    };

    console.log('Environment variables:', {
      ...envVars,
      // Hide sensitive values in logs
      RINGCENTRAL_CLIENT_ID: process.env.RINGCENTRAL_CLIENT_ID ? '[REDACTED]' : 'Not set',
      RINGCENTRAL_CLIENT_SECRET: process.env.RINGCENTRAL_CLIENT_SECRET ? '[REDACTED]' : 'Not set',
      RINGCENTRAL_USERNAME: process.env.RINGCENTRAL_USERNAME ? '[REDACTED]' : 'Not set',
      RINGCENTRAL_PASSWORD: process.env.RINGCENTRAL_PASSWORD ? '[REDACTED]' : 'Not set',
    });

    // 2. Check for authentication tokens
    console.log('Checking authentication tokens');
    const cookieStore = cookies();
    const client = new RingCentralClient(cookieStore, request);

    // Using getValidAccessToken to ensure token is fresh before checking or using it.
    const currentAccessToken = await client.getValidAccessToken();

    if (!currentAccessToken) {
      console.log(`Error: ${RINGCENTRAL_NOT_AUTHENTICATED_ERROR} (token not available or refresh failed)`);
      return NextResponse.json(
        { 
          error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR,
          diagnostics: { isAuthenticated: false, tokenError: 'No valid token or refresh failed' }
        },
        { status: 401 }
      );
    }

    // If we reach here, token is considered valid for the checks below.
    const diagnostics: any = {
      isAuthenticated: true, // Based on successful getValidAccessToken
      token: {
        hasAccessToken: !!currentAccessToken,
        accessTokenLength: currentAccessToken?.length || 0,
        // Note: We don't have direct access to the parsed token expiry here unless client exposes it
        // or we re-parse the cookie. client.isAuthenticated() uses internal expiry.
        isAccessTokenValidSyncCheck: client.isAuthenticated(), // Synchronous check based on client's internal state
        hasRefreshToken: !!cookieStore.get('ringcentral_refresh_token')?.value,
        accessTokenCookie: cookieStore.get('ringcentral_access_token')?.value?.substring(0, 15) + '...', // Show partial for debug
        refreshTokenCookie: cookieStore.get('ringcentral_refresh_token')?.value?.substring(0, 15) + '...',
        accessTokenExpiryCookie: cookieStore.get('ringcentral_access_token_expiry_time')?.value,
        refreshTokenExpiryCookie: cookieStore.get('ringcentral_refresh_token_expiry_time')?.value,
      },
      config: {
        serverUrlValid: !!process.env.RINGCENTRAL_SERVER && process.env.RINGCENTRAL_SERVER.startsWith('https://'),
        clientIdPresent: !!process.env.RINGCENTRAL_CLIENT_ID,
        clientSecretPresent: !!process.env.RINGCENTRAL_CLIENT_SECRET,
        fromNumberPresent: !!(process.env.RINGCENTRAL_FROM_NUMBER || process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER),
        fromNumberFormat: validatePhoneNumber(process.env.RINGCENTRAL_FROM_NUMBER || process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER || ''),
        redirectUriPresent: !!process.env.REDIRECT_URI,
        redirectUriValid: !!process.env.REDIRECT_URI && (
          process.env.REDIRECT_URI.startsWith('http://localhost') ||
          process.env.REDIRECT_URI.startsWith('https://')
        ),
      },
      inconsistencies: [],
      recommendations: [],
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        nextJsVersion: process.env.NEXT_PUBLIC_VERSION || 'Unknown'
      }
    };

    console.log('Authentication status:', diagnostics.token);
    console.log('Configuration validation:', diagnostics.config);

    // 3. Validate environment configuration
    const configValidation = diagnostics.config;

    // 4. Check for inconsistencies
    const inconsistencies: any[] = [];

    if (process.env.RINGCENTRAL_FROM_NUMBER !== process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER) {
      inconsistencies.push({
        type: 'FROM_NUMBER_MISMATCH',
        message: 'RINGCENTRAL_FROM_NUMBER and NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER have different values',
        values: {
          RINGCENTRAL_FROM_NUMBER: process.env.RINGCENTRAL_FROM_NUMBER,
          NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER: process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER
        }
      });
    }

    if (process.env.RINGCENTRAL_SERVER !== process.env.NEXT_PUBLIC_RINGCENTRAL_SERVER) {
      inconsistencies.push({
        type: 'SERVER_URL_MISMATCH',
        message: 'RINGCENTRAL_SERVER and NEXT_PUBLIC_RINGCENTRAL_SERVER have different values',
        values: {
          RINGCENTRAL_SERVER: process.env.RINGCENTRAL_SERVER,
          NEXT_PUBLIC_RINGCENTRAL_SERVER: process.env.NEXT_PUBLIC_RINGCENTRAL_SERVER
        }
      });
    }

    if (!process.env.RINGCENTRAL_FROM_NUMBER && !process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER) {
      inconsistencies.push({
        type: 'FROM_NUMBER_MISSING',
        message: 'Both RINGCENTRAL_FROM_NUMBER and NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER are missing',
        severity: 'ERROR'
      });
    }

    console.log('Configuration inconsistencies:', inconsistencies);

    // 5. Prepare recommendations based on findings
    const recommendations: any[] = [];

    if (!configValidation.fromNumberPresent) {
      recommendations.push({
        issue: 'Missing "from" number',
        action: 'Add RINGCENTRAL_FROM_NUMBER=+1XXXXXXXXXX to your .env.local file',
        severity: 'CRITICAL'
      });
    } else if (!configValidation.fromNumberFormat) {
      recommendations.push({
        issue: 'Invalid "from" number format',
        action: 'Ensure RINGCENTRAL_FROM_NUMBER is in E.164 format (e.g., +1XXXXXXXXXX)',
        severity: 'HIGH'
      });
    }

    if (inconsistencies.length > 0) {
      recommendations.push({
        issue: 'Environment variable inconsistencies',
        action: 'Standardize environment variables to avoid confusion',
        details: 'Use RINGCENTRAL_FROM_NUMBER for server-side code and NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER for client-side code',
        severity: 'MEDIUM'
      });
    }

    console.log('Recommendations:', recommendations);
    console.log('========== RINGCENTRAL DIAGNOSTICS API - END ==========');

    // Return comprehensive diagnostics information
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envVars,
      authentication: diagnostics.token,
      configuration: configValidation,
      inconsistencies,
      recommendations,
      serverInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        nextJsVersion: process.env.NEXT_PUBLIC_VERSION || 'Unknown'
      }
    });
  } catch (error: any) {
    console.error('Error in RingCentral diagnostics:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL DIAGNOSTICS API - END (WITH ERROR) ==========');

    return NextResponse.json({
      error: FAILED_TO_GENERATE_DIAGNOSTICS,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * Validate phone number format (basic E.164 validation)
 */
function validatePhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber) return false;

  // Basic E.164 format check: +[country code][number]
  // This is a simple check, more sophisticated validation might be needed
  return /^\+[1-9]\d{1,14}$/.test(phoneNumber);
}
