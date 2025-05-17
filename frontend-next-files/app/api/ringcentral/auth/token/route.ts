import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR } from '@/lib/constants';
import { UNKNOWN_ERROR_OCCURRED, FAILED_TO_GET_TOKEN } from '@/lib/constants';

/**
 * Get the access token for API calls
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user's access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;
    const tokenExpiry = cookieStore.get('ringcentral_token_expiry')?.value;

    if (!accessToken) {
      return NextResponse.json({ 
        authenticated: false, 
        message: RINGCENTRAL_NOT_AUTHENTICATED_ERROR
      });
    }

    // Check if the token is expired
    if (tokenExpiry && parseInt(tokenExpiry) <= Date.now()) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'Token expired' 
      });
    }

    return NextResponse.json({ 
      authenticated: true,
      access_token: accessToken
    });
  } catch (error: any) {
    console.error('Error getting token:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL TOKEN API - END (ERROR) ==========');
    return NextResponse.json({ error: error.message || FAILED_TO_GET_TOKEN }, { status: 500 });
  }
}
