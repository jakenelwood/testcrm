import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  RINGCENTRAL_SERVER,
  RINGCENTRAL_FROM_NUMBER,
  API_ENDPOINTS
} from '@/lib/ringcentral/config';

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
    console.log('Step 1: Getting access token from cookies');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;
    const tokenExpiry = cookieStore.get('ringcentral_token_expiry')?.value;

    console.log('Access token available:', !!accessToken);
    console.log('Token expiry:', tokenExpiry ? new Date(parseInt(tokenExpiry)).toISOString() : 'Not set');

    if (!accessToken) {
      console.log('Error: No access token found');
      return NextResponse.json({ error: 'Not authenticated with RingCentral' }, { status: 401 });
    }

    // Get the phone number from the request body
    console.log('Step 2: Processing request body');
    const body = await request.json();
    console.log('Request body:', body);

    let { phoneNumber, callerIdType, customCallerId } = body;
    console.log('Original phone number:', phoneNumber);
    console.log('Caller ID type:', callerIdType);
    console.log('Custom Caller ID:', customCallerId);

    if (!phoneNumber) {
      console.log('Error: No phone number provided');
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Ensure the phone number is in E.164 format
    console.log('Step 3: Formatting phone number to E.164 format');
    const originalPhoneNumber = phoneNumber;

    // Remove any non-digit characters for consistent processing
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    if (!phoneNumber.startsWith('+')) {
      // If it's a 10-digit US number without country code, add +1
      if (digitsOnly.length === 10) {
        phoneNumber = `+1${digitsOnly}`;
      }
      // If it's an 11-digit number starting with 1, add +
      else if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) {
        phoneNumber = `+${digitsOnly}`;
      }
      // For any other format, try to make it a US number if possible
      else if (digitsOnly.length > 10) {
        // Extract the last 10 digits and add +1
        phoneNumber = `+1${digitsOnly.substring(digitsOnly.length - 10)}`;
      }
    }
    // If it starts with + but not +1, and looks like a US number
    else if (phoneNumber.startsWith('+') && !phoneNumber.startsWith('+1') && digitsOnly.length >= 10) {
      // This might be a misformatted US number, extract the last 10 digits
      phoneNumber = `+1${digitsOnly.substring(digitsOnly.length - 10)}`;
    }

    console.log('Phone number transformation:', {
      original: originalPhoneNumber,
      formatted: phoneNumber,
      digitsOnly: digitsOnly,
      length: phoneNumber.length,
      startsWithPlus: phoneNumber.startsWith('+')
    });

    // Log the request details for debugging
    console.log('Step 4: Preparing RingCentral API call');
    console.log('Call parameters:', {
      fromNumber: RINGCENTRAL_FROM_NUMBER,
      toNumber: phoneNumber,
      server: RINGCENTRAL_SERVER,
      accessTokenLength: accessToken?.length || 0
    });

    // Make the RingOut call using the correct endpoint and payload format
    // This endpoint should work with our current permissions
    let callerIdNumber = RINGCENTRAL_FROM_NUMBER;

    // Handle different caller ID types
    if (callerIdType) {
      console.log('Using custom caller ID type:', callerIdType);

      switch (callerIdType) {
        case 'direct':
          // Use the direct number (already the default in most cases)
          break;
        case 'company':
          // For company number, we would need to fetch it from RingCentral
          // For now, we'll use the from number as a fallback
          console.log('Company number requested, using from number as fallback');
          break;
        case 'custom':
          // Use the custom caller ID if provided
          if (customCallerId) {
            callerIdNumber = customCallerId;
            console.log('Using custom caller ID:', callerIdNumber);
          }
          break;
        case 'blocked':
          // Set to 'private' or similar to block caller ID
          callerIdNumber = 'private';
          console.log('Using blocked caller ID');
          break;
        default:
          // Use the default from number
          break;
      }
    }

    const payload = {
      from: { phoneNumber: RINGCENTRAL_FROM_NUMBER },
      to: { phoneNumber },
      callerId: { phoneNumber: callerIdNumber !== 'private' ? callerIdNumber : undefined },
      playPrompt: false
    };

    // If caller ID should be blocked
    if (callerIdType === 'blocked') {
      payload.callerId = undefined;
    }

    console.log('RingOut payload:', JSON.stringify(payload));

    // Construct the full URL for the API call
    const apiUrl = `${RINGCENTRAL_SERVER}${API_ENDPOINTS.RING_OUT}`;
    console.log('API URL:', apiUrl);

    // Log the headers we're sending
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken.substring(0, 10)}...` // Only show part of the token for security
    });

    console.log('Step 5: Making API call to RingCentral');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    console.log('Step 6: Processing API response');
    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    console.log('Response headers:', Object.fromEntries([...response.headers.entries()]));

    if (!response.ok) {
      console.log('Step 7A: Handling error response');
      let errorData;
      try {
        errorData = await response.json();
        console.log('Error response body (JSON):', errorData);
      } catch (e) {
        // If the response is not JSON, get the text instead
        console.log('Error parsing JSON response:', e);
        try {
          const errorText = await response.text();
          console.log('Error response body (text):', errorText);
          return NextResponse.json({
            error: 'Failed to make call',
            details: { message: errorText, status: response.status }
          }, { status: response.status });
        } catch (textError) {
          console.log('Error getting response text:', textError);
          return NextResponse.json({
            error: 'Failed to make call',
            details: { message: 'Could not parse error response', status: response.status }
          }, { status: response.status });
        }
      }

      console.error('RingCentral call error (JSON):', errorData);
      return NextResponse.json({
        error: 'Failed to make call',
        details: errorData
      }, { status: response.status });
    }

    console.log('Step 7B: Processing successful response');
    let callData;
    try {
      callData = await response.json();
      console.log('Response body (JSON):', callData);
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

    // Log the successful response
    console.log('RingCentral call successful:', callData);
    console.log('========== RINGCENTRAL CALL API - END ==========');

    return NextResponse.json({
      success: true,
      message: 'Call initiated successfully',
      callId: callData.id,
      callDetails: callData
    });
  } catch (error: any) {
    console.log('Step X: Caught exception in main try/catch block');
    console.error('Call error:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL CALL API - END (WITH ERROR) ==========');
    return NextResponse.json({
      error: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
