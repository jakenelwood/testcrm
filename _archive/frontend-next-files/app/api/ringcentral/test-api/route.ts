import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient } from '@/utils/ringcentral-client';
import { API_ENDPOINTS, RINGCENTRAL_SERVER } from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';

// RingCentral API configuration
// const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com'; // Remove redundant const

/**
 * Handle GET requests to test the RingCentral API
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL TEST API - START ==========');
  try {
    const cookieStore = await cookies();
    const client = new RingCentralClient(cookieStore, request);

    // No explicit isAuthenticated check needed here, client methods will handle it.
    // const currentAccessToken = await client.getValidAccessToken(); // Get token if needed
    // if (!currentAccessToken) {
    //   return NextResponse.json({ error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR, data: null }, { status: 401 });
    // }

    console.log('Making API call to RingCentral using client.get()');
    // Use a specific, simple endpoint like AUTHZ_PROFILE (userinfo)
    const data = await client.get(API_ENDPOINTS.AUTHZ_PROFILE);

    console.log('Test API response data:', data);

    return NextResponse.json({
      success: true,
      message: 'RingCentral API test successful',
      accountInfo: data,
      permissions: client.isAuthenticated() ? data.permissions : []
    });
  } catch (error: any) {
    console.error('API test error:', error);
    return NextResponse.json({
      error: error.message || UNKNOWN_ERROR_OCCURRED
    }, { status: 500 });
  }
}
