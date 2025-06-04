import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient } from '@/utils/ringcentral-client';
import { API_ENDPOINTS } from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';

/**
 * Handle GET requests to fetch extension information
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL EXTENSION INFO API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const cookieStore = await cookies();
    const client = new RingCentralClient(cookieStore, request);

    console.log('Making API call to RingCentral for extension info');
    const extensionInfo = await client.get(API_ENDPOINTS.EXTENSION_INFO);

    console.log('Extension info data:', extensionInfo);
    console.log('========== RINGCENTRAL EXTENSION INFO API - END ==========');

    return NextResponse.json({
      success: true,
      extensionInfo
    });
  } catch (error: any) {
    console.log('Caught exception in main try/catch block');
    console.error('Extension info error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL EXTENSION INFO API - END (WITH ERROR) ==========');
    return NextResponse.json({
      error: error.message || UNKNOWN_ERROR_OCCURRED,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
