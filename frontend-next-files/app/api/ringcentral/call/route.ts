import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  RINGCENTRAL_SERVER,
  RINGCENTRAL_FROM_NUMBER,
  API_ENDPOINTS
} from '@/lib/ringcentral/config';
import { RingCentralClient } from '@/utils/ringcentral-client';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';

/**
 * Handle POST requests to make a call
 */
export async function POST(request: NextRequest) {
  console.log('========== RINGCENTRAL CALL API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Environment variables:', {
    RINGCENTRAL_SERVER: RINGCENTRAL_SERVER,
    RINGCENTRAL_FROM_NUMBER: RINGCENTRAL_FROM_NUMBER
  });

  try {
    const { to, from, webhookUrl } = await request.json();

    if (!to) {
      return NextResponse.json({ error: '"to" number is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const client = new RingCentralClient(cookieStore, request);

    const fromNumber = from || RINGCENTRAL_FROM_NUMBER;
    if (!fromNumber) {
      return NextResponse.json({ error: '"from" number is required, or RINGCENTRAL_FROM_NUMBER must be set in config' }, { status: 400 });
    }

    // Construct the request payload for RingCentral RingOut
    const basePayload: any = {
      from: { phoneNumber: fromNumber },
      to: { phoneNumber: to },
      playPrompt: false,
    };

    if (webhookUrl) {
      basePayload.webhook = {
        uri: webhookUrl,
        eventFilters: [
          '/restapi/v1.0/account/~/extension/~/telephony/sessions',
        ]
      };
      console.log('Webhook configured for RingOut:', basePayload.webhook);
    }

    console.log('Making RingOut API call with payload:', JSON.stringify(basePayload, null, 2));
    const response = await client.post(API_ENDPOINTS.RING_OUT, basePayload);

    console.log('Step 6: Processing API response from RingCentralClient');
    // The RingCentralClient's post method already throws an error if !response.ok and parses JSON.
    // So, the complex error handling and JSON parsing below can be simplified.

    console.log('Step 7B: Processing successful response from RingCentralClient');
    console.log('Response body (JSON) from client.post:', response);

    // Log the successful response
    console.log('RingCentral call successful:', response);
    console.log('========== RINGCENTRAL CALL API - END ==========');

    return NextResponse.json({
      success: true,
      message: 'Call initiated successfully',
      callId: response.id,
      callDetails: response
    });
  } catch (error: any) {
    console.log('Step X: Caught exception in main try/catch block');
    console.error('Call error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL CALL API - END (WITH ERROR) ==========');
    return NextResponse.json({
      error: error.message || UNKNOWN_ERROR_OCCURRED,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
