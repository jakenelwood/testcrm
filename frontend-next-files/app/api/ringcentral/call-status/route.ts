import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient } from '@/utils/ringcentral-client';
import {
  API_ENDPOINTS,
  RINGCENTRAL_SERVER, // Used for constructing verbose output
  RINGCENTRAL_FROM_NUMBER // Used for constructing verbose output
} from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';

interface CallStatusRequestBody {
  callId?: string;
  ringSessionId?: string;
  verbose?: boolean;
}

export async function POST(request: NextRequest) {
  console.log('========== RINGCENTRAL CALL STATUS API - START ==========');
  let requestBody: CallStatusRequestBody;
  try {
    requestBody = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { callId, ringSessionId, verbose } = requestBody;
  const troubleshooting: string[] = []; // Ensure explicit typing

  try {
    if (!callId && !ringSessionId) {
      troubleshooting.push('callId or ringSessionId is required');
      return NextResponse.json({ error: 'callId or ringSessionId is required', troubleshooting }, { status: 400 });
    }

    const cookieStore = cookies();
    const client = new RingCentralClient(cookieStore, request);

    let endpoint: string;
    if (ringSessionId) {
      endpoint = API_ENDPOINTS.TELEPHONY_SESSION(ringSessionId);
      troubleshooting.push(`Using telephony session status endpoint for ringSessionId: ${ringSessionId}`);
      console.log(`Using telephony session status endpoint for ringSessionId: ${ringSessionId}`);
    } else if (callId) {
      // Assuming callId without ringSessionId refers to a RingOut call ID for status
      endpoint = API_ENDPOINTS.RING_OUT_CALL(callId);
      troubleshooting.push(`Using RingOut status endpoint for callId: ${callId}`);
      console.log(`Using RingOut status endpoint for callId: ${callId}`);
    } else {
      // Should be caught by the initial check, but as a safeguard:
      return NextResponse.json({ error: 'Internal error: callId or ringSessionId became undefined' }, { status: 500 });
    }

    console.log(`Fetching call status from endpoint: ${endpoint}`);
    troubleshooting.push(`Fetching call status from endpoint: ${endpoint}`);
    const callData = await client.get(endpoint);

    console.log('Call status data:', callData);
    troubleshooting.push('Successfully fetched call status data.');
    // Log headers for troubleshooting if needed, carefully to avoid large outputs or sensitive info
    // console.log('Response headers:', Object.fromEntries(callDataResponse.headers));

    console.log('========== RINGCENTRAL CALL STATUS API - END ==========');
    return NextResponse.json({
      success: true,
      data: callData,
      troubleshooting,
      timestamp: new Date().toISOString(),
      ...(verbose && { // Conditionally add verbose block
        verbose: {
            fromNumber: RINGCENTRAL_FROM_NUMBER,
            server: RINGCENTRAL_SERVER,
            tokenAvailable: client.isAuthenticated(), // Check current state, might not reflect if refresh just happened
            clientUsesRequestOrigin: (client as any).requestOrigin, // For debugging client construction
        }
      })
    });
  } catch (error: any) {
    console.log('Caught exception in main try/catch block for call status');
    console.error('Call status error:', error.message, error.stack);
    troubleshooting.push(`Error occurred: ${error.message}`);
    console.log('========== RINGCENTRAL CALL STATUS API - END (WITH ERROR) ==========');
    const status = error.message && error.message.includes(RINGCENTRAL_NOT_AUTHENTICATED_ERROR) ? 401 : 500;
    return NextResponse.json({
      error: error.message || UNKNOWN_ERROR_OCCURRED,
      troubleshooting,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status });
  }
}
