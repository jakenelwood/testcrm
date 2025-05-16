import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  RINGCENTRAL_SERVER,
  RINGCENTRAL_FROM_NUMBER
} from '@/lib/ringcentral/config';

/**
 * Handle GET requests to check call status
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL CALL STATUS API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Environment variables:', {
    RINGCENTRAL_SERVER: RINGCENTRAL_SERVER,
    RINGCENTRAL_FROM_NUMBER: RINGCENTRAL_FROM_NUMBER
  });

  try {
    // Get the call ID from the query parameters
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');
    const verbose = searchParams.get('verbose') === 'true';

    if (!callId) {
      console.log('Error: No call ID provided');
      return NextResponse.json({ error: 'Call ID is required' }, { status: 400 });
    }

    console.log('Call ID:', callId);
    console.log('Verbose mode:', verbose);

    // Get the access token from cookies
    console.log('Getting access token from cookies');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;
    const tokenExpiry = cookieStore.get('ringcentral_token_expiry')?.value;

    console.log('Access token available:', !!accessToken);
    console.log('Token expiry:', tokenExpiry ? new Date(parseInt(tokenExpiry)).toISOString() : 'Not set');

    if (!accessToken) {
      console.log('Error: No access token found');
      return NextResponse.json({ error: 'Not authenticated with RingCentral' }, { status: 401 });
    }

    // Construct the URL for the API call
    const apiUrl = `${RINGCENTRAL_SERVER}/restapi/v1.0/account/~/extension/~/ring-out/${callId}`;
    console.log('API URL:', apiUrl);

    // Make the API call to RingCentral
    console.log('Making API call to RingCentral');
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

    if (!response.ok) {
      console.log('Handling error response');
      let errorData;
      try {
        errorData = await response.json();
        console.log('Error response body (JSON):', errorData);
      } catch (e) {
        console.log('Error parsing JSON response:', e);
        try {
          const errorText = await response.text();
          console.log('Error response body (text):', errorText);
          return NextResponse.json({
            error: 'Failed to get call status',
            details: { message: errorText, status: response.status }
          }, { status: response.status });
        } catch (textError) {
          console.log('Error getting response text:', textError);
          return NextResponse.json({
            error: 'Failed to get call status',
            details: { message: 'Could not parse error response', status: response.status }
          }, { status: response.status });
        }
      }

      console.error('RingCentral call status error (JSON):', errorData);
      return NextResponse.json({
        error: 'Failed to get call status',
        details: errorData
      }, { status: response.status });
    }

    // Parse the response
    console.log('Processing successful response');
    let callData;
    try {
      callData = await response.json();
      console.log('Call status data:', callData);
    } catch (e) {
      console.log('Error parsing JSON response:', e);
      try {
        const responseText = await response.text();
        console.log('Response body (text):', responseText);
        return NextResponse.json({
          error: 'Failed to parse successful response',
          details: { message: responseText }
        }, { status: 500 });
      } catch (textError) {
        console.log('Error getting response text:', textError);
        return NextResponse.json({
          error: 'Failed to parse successful response',
          details: { message: 'Could not parse response' }
        }, { status: 500 });
      }
    }

    // Add human-readable status descriptions
    let statusDescription = 'Unknown';
    let nextStep = 'Wait for the call to complete';
    let troubleshooting = [];

    if (callData && callData.status) {
      const status = callData.status;

      // Overall call status
      if (status.callStatus === 'InProgress') {
        statusDescription = 'Call is in progress';

        // Caller status (your phone)
        if (status.callerStatus === 'InProgress') {
          statusDescription += ' - Calling your phone';
          nextStep = 'Answer your phone when it rings';
          troubleshooting.push('Make sure your phone is on and can receive calls');
          troubleshooting.push('Check if your phone has Do Not Disturb enabled');
          troubleshooting.push('Verify that the "from" number is correct');
        } else if (status.callerStatus === 'Success') {
          statusDescription += ' - You answered your phone';

          // Callee status (destination phone)
          if (status.calleeStatus === 'InProgress') {
            statusDescription += ', calling destination number';
            nextStep = 'Wait for the destination to answer';
            troubleshooting.push('Verify that the destination number is correct');
          } else if (status.calleeStatus === 'Success') {
            statusDescription += ', destination answered';
            nextStep = 'You are now connected to the destination';
          } else if (status.calleeStatus === 'Failed') {
            statusDescription += ', destination failed to answer';
            nextStep = 'Try calling a different number';
            troubleshooting.push('The destination number may be unavailable or busy');
            troubleshooting.push('Check if the destination number is valid');
          }
        } else if (status.callerStatus === 'Failed') {
          statusDescription += ' - Failed to connect to your phone';
          nextStep = 'Try again or check your phone';
          troubleshooting.push('Make sure your phone is on and can receive calls');
          troubleshooting.push('Check if your phone has Do Not Disturb enabled');
          troubleshooting.push('Verify that the "from" number is correct');
        }
      } else if (status.callStatus === 'Success') {
        statusDescription = 'Call completed successfully';
        nextStep = 'The call has been connected';
      } else if (status.callStatus === 'Failed') {
        statusDescription = 'Call failed';
        nextStep = 'Try again or check the phone numbers';
        troubleshooting.push('Verify that both phone numbers are correct');
        troubleshooting.push('Check if your RingCentral account has calling enabled');
        troubleshooting.push('Make sure your phone is on and can receive calls');
      } else if (status.callStatus === 'Busy') {
        statusDescription = 'One of the numbers is busy';
        nextStep = 'Try again later';
        troubleshooting.push('The destination number may be on another call');
        troubleshooting.push('Your phone may be on another call');
      } else if (status.callStatus === 'Error') {
        statusDescription = 'Error making call';

        if (status.callerStatus === 'GenericError') {
          statusDescription += ' - Unable to connect to your phone';
          nextStep = 'Check your RingCentral account settings';
          troubleshooting.push('Verify that the "from" number is correctly configured in your RingCentral account');
          troubleshooting.push('Make sure your RingCentral account has outbound calling enabled');
          troubleshooting.push('Check if your RingCentral account has any restrictions on outbound calling');
          troubleshooting.push('Verify that the phone number format is correct (try with country code)');
          troubleshooting.push('Contact RingCentral support to check if there are any issues with your account');
        } else {
          nextStep = 'Try again or check the phone numbers';
          troubleshooting.push('Verify that both phone numbers are correct');
          troubleshooting.push('Check if your RingCentral account has calling enabled');
        }
      }
    }

    console.log('Status description:', statusDescription);
    console.log('Next step:', nextStep);
    console.log('Troubleshooting tips:', troubleshooting);
    console.log('========== RINGCENTRAL CALL STATUS API - END ==========');

    return NextResponse.json({
      success: true,
      callId: callData.id,
      callDetails: callData,
      statusDescription,
      nextStep,
      troubleshooting,
      timestamp: new Date().toISOString(),
      verbose: verbose ? {
        fromNumber: RINGCENTRAL_FROM_NUMBER,
        server: RINGCENTRAL_SERVER,
        tokenAvailable: !!accessToken,
        tokenExpiry: tokenExpiry ? new Date(parseInt(tokenExpiry)).toISOString() : 'Not set'
      } : undefined
    });
  } catch (error: any) {
    console.log('Caught exception in main try/catch block');
    console.error('Call status error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL CALL STATUS API - END (WITH ERROR) ==========');
    return NextResponse.json({
      error: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
