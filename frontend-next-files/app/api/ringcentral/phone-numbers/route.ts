import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// RingCentral API configuration
const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com';

/**
 * Handle GET requests to fetch phone numbers
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL PHONE NUMBERS API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Get the access token from cookies
    console.log('Getting access token from cookies');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;

    if (!accessToken) {
      console.log('Error: No access token found');
      return NextResponse.json({ error: 'Not authenticated with RingCentral' }, { status: 401 });
    }

    // Construct the URL for the API call
    const apiUrl = `${RINGCENTRAL_SERVER}/restapi/v1.0/account/~/extension/~/phone-number`;
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

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.log('Error response body (JSON):', errorData);
      } catch (e) {
        const errorText = await response.text();
        console.log('Error response body (text):', errorText);
        return NextResponse.json({
          error: 'Failed to get phone numbers',
          details: { message: errorText, status: response.status }
        }, { status: response.status });
      }

      console.error('RingCentral phone numbers error (JSON):', errorData);
      return NextResponse.json({
        error: 'Failed to get phone numbers',
        details: errorData
      }, { status: response.status });
    }

    // Parse the response
    const phoneNumbersData = await response.json();
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
      error: error.message || 'Unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
