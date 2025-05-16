import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// RingCentral API configuration
const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com';

/**
 * Handle GET requests to fetch permissions
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL PERMISSIONS API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Get the access token from cookies
    console.log('Getting access token from cookies');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;

    if (!accessToken) {
      console.log('Error: No access token found');
      return NextResponse.json({ error: 'Not authenticated with RingCentral' }, { status: 401 });
    }

    // Instead of making an API call, we'll extract the scopes from the token
    console.log('Extracting permissions from token');

    // Extract the scopes from the token
    const cookieToken = cookieStore.get('ringcentral_access_token')?.value || '';
    let scopes: string[] = [];

    try {
      // Access token is a JWT, split by dots and decode the middle part (payload)
      const tokenParts = cookieToken.split('.');
      if (tokenParts.length >= 2) {
        const payload = JSON.parse(atob(tokenParts[1]));
        if (payload.scope) {
          scopes = payload.scope.split(' ');
        }
      }
    } catch (e) {
      console.error('Error parsing token scopes:', e);
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
    return NextResponse.json({
      error: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
