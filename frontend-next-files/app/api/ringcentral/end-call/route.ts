import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient } from '@/utils/ringcentral-client';
import { API_ENDPOINTS } from '@/lib/ringcentral/config';

/**
 * Handle POST requests to end an active call
 */
export async function POST(request: NextRequest) {
  console.log('========== RINGCENTRAL END CALL API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Step 1: Parse the request body
    console.log('Step 1: Parsing request body');
    const body = await request.json();
    const { callId } = body;

    if (!callId) {
      console.log('Error: Missing call ID');
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }

    console.log('End call parameters:', { callId });

    // Step 2: Initialize RingCentral client
    console.log('Step 2: Initializing RingCentral client');
    const cookieStore = await cookies();
    const client = new RingCentralClient(cookieStore);

    if (!client.isAuthenticated()) {
      console.log('Error: Not authenticated with RingCentral');
      return NextResponse.json({ error: 'Not authenticated with RingCentral' }, { status: 401 });
    }

    // Step 3: End the call
    console.log('Step 3: Ending call');

    try {
      // End the call using the client
      await client.endCall(callId);
      console.log('Successfully sent end call request');
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

    // Extract error details
    let errorMessage = 'Failed to end call';
    let errorDetails = null;

    if (error.response) {
      try {
        const errorData = await error.response.json();
        errorMessage = errorData.message || errorData.error_description || errorMessage;
        errorDetails = errorData;
        console.error('RingCentral API error:', errorData);
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
    } else {
      errorMessage = error.message || errorMessage;
    }

    console.log(`========== RINGCENTRAL END CALL API - END (ERROR: ${errorMessage}) ==========`);

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}
