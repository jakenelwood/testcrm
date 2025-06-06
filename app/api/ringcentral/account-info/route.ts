import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient } from '@/utils/ringcentral-client';
import { API_ENDPOINTS } from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';

/**
 * Handle GET requests to fetch account information
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL ACCOUNT INFO API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const cookieStore = await cookies();
    const client = new RingCentralClient(cookieStore, request);

    if (!client.isAuthenticated() && !cookieStore.get('ringcentral_refresh_token')?.value) {
      console.log(`Error: ${RINGCENTRAL_NOT_AUTHENTICATED_ERROR} (no valid token or refresh token)`);
      return NextResponse.json({ error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR }, { status: 401 });
    }

    console.log('Making API call to RingCentral for account info');
    const accountInfo = await client.get(API_ENDPOINTS.ACCOUNT_INFO);

    console.log('Account info data:', accountInfo);
    console.log('========== RINGCENTRAL ACCOUNT INFO API - END ==========');

    return NextResponse.json({
      success: true,
      accountInfo
    });
  } catch (error: any) {
    console.log('Caught exception in main try/catch block');
    console.error('Account info error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL ACCOUNT INFO API - END (WITH ERROR) ==========');
    return NextResponse.json({
      error: error.message || UNKNOWN_ERROR_OCCURRED,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
