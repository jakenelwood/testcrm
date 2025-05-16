import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { REQUIRED_SCOPES } from '@/lib/ringcentral/config';

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
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;
    const refreshToken = cookieStore.get('ringcentral_refresh_token')?.value;
    const tokenExpiry = cookieStore.get('ringcentral_token_expiry')?.value;

    // Check token scopes if available
    let tokenScopes: string[] = [];
    let hasRequiredScopes = false;

    if (accessToken) {
      try {
        // Access token is a JWT, split by dots and decode the middle part (payload)
        const tokenParts = accessToken.split('.');
        if (tokenParts.length >= 2) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.scope) {
            tokenScopes = payload.scope.split(' ');
            console.log('Token scopes:', tokenScopes);

            // Check if all required scopes are present
            hasRequiredScopes = REQUIRED_SCOPES.every(scope =>
              tokenScopes.includes(scope) ||
              // Handle case sensitivity and format differences
              tokenScopes.includes(scope.toLowerCase()) ||
              tokenScopes.includes(scope.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase())
            );
          }
        }
      } catch (e) {
        console.error('Error parsing token scopes:', e);
      }
    }

    const authStatus = {
      accessTokenPresent: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
      refreshTokenPresent: !!refreshToken,
      refreshTokenLength: refreshToken?.length || 0,
      tokenExpiry: tokenExpiry ? new Date(parseInt(tokenExpiry)).toISOString() : 'Not set',
      tokenExpired: tokenExpiry ? new Date(parseInt(tokenExpiry)) < new Date() : true,
      tokenExpiresIn: tokenExpiry
        ? `${Math.round((new Date(parseInt(tokenExpiry)).getTime() - new Date().getTime()) / 1000 / 60)} minutes`
        : 'N/A',
      scopes: tokenScopes,
      hasRequiredScopes
    };

    console.log('Authentication status:', authStatus);

    // 3. Validate environment configuration
    const configValidation = {
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
    };

    console.log('Configuration validation:', configValidation);

    // 4. Check for inconsistencies
    const inconsistencies = [];

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
    const recommendations = [];

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

    if (!authStatus.accessTokenPresent) {
      recommendations.push({
        issue: 'Not authenticated with RingCentral',
        action: 'Complete the OAuth authentication flow',
        severity: 'HIGH'
      });
    } else if (authStatus.tokenExpired) {
      recommendations.push({
        issue: 'RingCentral token has expired',
        action: 'Re-authenticate with RingCentral',
        severity: 'HIGH'
      });
    }

    console.log('Recommendations:', recommendations);
    console.log('========== RINGCENTRAL DIAGNOSTICS API - END ==========');

    // Return comprehensive diagnostics information
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: envVars,
      authentication: authStatus,
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
      error: 'Failed to generate RingCentral diagnostics',
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
