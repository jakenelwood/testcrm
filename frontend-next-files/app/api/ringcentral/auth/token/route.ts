import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
        message: 'Not authenticated with RingCentral' 
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
    console.error('Get token error:', error);
    return NextResponse.json({
      authenticated: false,
      message: error.message || 'Unknown error occurred'
    });
  }
}
