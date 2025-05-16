import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// RingCentral API configuration
const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com';

/**
 * Handle GET requests to test the RingCentral API
 */
export async function GET(request: NextRequest) {
  try {
    // Get the access token from cookies
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;

    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated with RingCentral' }, { status: 401 });
    }

    // Make a simple API call to get extension info (should work with our permissions)
    const response = await fetch(`${RINGCENTRAL_SERVER}/restapi/v1.0/account/~/extension/~`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // If the response is not JSON, get the text instead
        const errorText = await response.text();
        console.error('RingCentral API test error (text):', errorText);
        return NextResponse.json({
          error: 'Failed to call RingCentral API',
          details: { message: errorText, status: response.status }
        }, { status: response.status });
      }

      console.error('RingCentral API test error (JSON):', errorData);
      return NextResponse.json({
        error: 'Failed to call RingCentral API',
        details: errorData
      }, { status: response.status });
    }

    const accountData = await response.json();

    return NextResponse.json({
      success: true,
      message: 'RingCentral API call successful',
      account: accountData
    });
  } catch (error: any) {
    console.error('API test error:', error);
    return NextResponse.json({
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
