import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient } from '@/utils/ringcentral-client';
import { API_ENDPOINTS } from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, FAILED_TO_END_CALL } from '@/lib/constants';

/**
 * Handle POST requests to end an active call
 */
export async function POST(request: NextRequest) {
  console.log('========== RINGCENTRAL END CALL API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Step 1: Parse the request body
    console.log('Step 1: Parsing request body');
    const { callId } = await request.json();

    if (!callId) {
      console.log('Error: No call ID provided for ending call');
      return NextResponse.json({ error: 'Call ID is required to end the call' }, { status: 400 });
    }

    console.log('Call ID to end:', callId);

    // Step 2: Initialize RingCentral client
    console.log('Step 2: Initializing RingCentral client');
    const cookieStore = cookies();
    const client = new RingCentralClient(cookieStore, request);

    // No explicit isAuthenticated check needed here, client methods will handle it.
    // const currentAccessToken = await client.getValidAccessToken(); // Get token if needed
    // if (!currentAccessToken) {
    //   return NextResponse.json({ error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR }, { status: 401 });
    // }

    // Step 3: End the call
    console.log('Step 3: Ending call');

    try {
      // End the call using the client
      const endCallResponse = await client.endCall(callId);
      console.log('Successfully sent end call request');
      console.log('End call response:', endCallResponse);
    } catch (error) {
      console.error('Error in end call request:', error);
      throw error;
    }

    console.log('Call ended successfully:', {
      callId,
      status: 'Ended'
    });

    console.log('========== RINGCENTRAL END CALL API - END (SUCCESS) ==========');
    return NextResponse.json({
      success: true,
      message: 'Call ended successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error ending call:', error);
    const errorMessage = error.message || FAILED_TO_END_CALL;
    console.log(`========== RINGCENTRAL END CALL API - END (ERROR: ${errorMessage}) ==========`);
    return NextResponse.json({
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
