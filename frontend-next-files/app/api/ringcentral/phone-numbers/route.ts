import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient } from '@/utils/ringcentral-client';
import { API_ENDPOINTS } from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';

/**
 * Handle GET requests to fetch phone numbers
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL PHONE NUMBERS API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    const cookieStore = await cookies();
    const client = new RingCentralClient(cookieStore, request);

    // No explicit isAuthenticated check needed here, client methods will handle it.
    // const currentAccessToken = await client.getValidAccessToken(); // Get token if needed
    // if (!currentAccessToken) {
    //   return NextResponse.json({ error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR, records: [] }, { status: 401 });
    // }

    // Make the API call to RingCentral
    console.log('Making API call to RingCentral for phone numbers');
    const phoneNumbersData = await client.get(API_ENDPOINTS.PHONE_NUMBERS);

    console.log('Phone numbers data:', phoneNumbersData);
    console.log('========== RINGCENTRAL PHONE NUMBERS API - END ==========');

    return NextResponse.json({
      success: true,
      phoneNumbers: phoneNumbersData.records || []
    });
  } catch (error: any) {
    console.log('Caught exception in main try/catch block');
    console.error('Phone numbers error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL PHONE NUMBERS API - END (WITH ERROR) ==========');
    return NextResponse.json({
      error: error.message || UNKNOWN_ERROR_OCCURRED,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
