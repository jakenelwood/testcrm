import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient } from '@/utils/ringcentral-client';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';

/**
 * Handle GET requests to fetch permissions
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL PERMISSIONS API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const cookieStore = await cookies();
    const client = new RingCentralClient(cookieStore, request);

    // Get the access token, triggering refresh if necessary
    const currentAccessToken = await client.getValidAccessToken();

    if (!currentAccessToken) {
      console.log(`Error: ${RINGCENTRAL_NOT_AUTHENTICATED_ERROR} (token not available or refresh failed)`);
      return NextResponse.json({ error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR, permissions: [] }, { status: 401 });
    }

    console.log('Extracting permissions from token');
    let scopes: string[] = [];

    try {
      const tokenParts = currentAccessToken.split('.');
      if (tokenParts.length >= 2) {
        // Ensure atob is available or use Buffer for Node.js environments if running outside edge/browser-like
        const payloadDecoded = Buffer.from(tokenParts[1], 'base64url').toString('utf8');
        const payload = JSON.parse(payloadDecoded);
        if (payload.scope) {
          scopes = payload.scope.split(' ');
        }
      }
    } catch (e) {
      console.error('Error parsing token scopes:', e);
      // Do not let parsing error fail the entire request if token was otherwise valid
      // Return empty scopes or handle as appropriate
    }

    console.log('Token scopes:', scopes);
    console.log('========== RINGCENTRAL PERMISSIONS API - END ==========');

    return NextResponse.json({
      success: true,
      permissions: scopes
    });
  } catch (error: any) {
    console.log('Caught exception in main try/catch block');
    console.error('Permissions error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL PERMISSIONS API - END (WITH ERROR) ==========');
    // If the error is a known "not authenticated" error from the client, ensure 401 status
    if (error.message && error.message.includes(RINGCENTRAL_NOT_AUTHENTICATED_ERROR)) {
        return NextResponse.json({ error: error.message, permissions: [] }, { status: 401 });
    }
    return NextResponse.json({
      error: error.message || UNKNOWN_ERROR_OCCURRED,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
