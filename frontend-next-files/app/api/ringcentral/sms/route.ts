import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient } from '@/utils/ringcentral-client';
import { API_ENDPOINTS, RINGCENTRAL_FROM_NUMBER } from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, FAILED_TO_SEND_SMS } from '@/lib/constants';

/**
 * Handle POST requests to send an SMS
 */
export async function POST(request: NextRequest) {
  console.log('========== RINGCENTRAL SMS API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Step 1: Parse the request body
    console.log('Step 1: Parsing request body');
    const { to, text } = await request.json();

    if (!to || !text) {
      console.log('Error: Missing required parameters');
      return NextResponse.json({ error: '"to" and "text" are required' }, { status: 400 });
    }

    console.log('SMS parameters:', {
      to: to,
      text: text.substring(0, 20) + (text.length > 20 ? '...' : '') // Log only the beginning of the message for privacy
    });

    // Step 2: Initialize RingCentral client
    console.log('Step 2: Initializing RingCentral client');
    const cookieStore = await cookies();
    const client = new RingCentralClient(cookieStore, request);

    const fromNumber = RINGCENTRAL_FROM_NUMBER;
    if (!fromNumber) {
      console.log('Error: RINGCENTRAL_FROM_NUMBER is not configured on the server.');
      return NextResponse.json({ error: 'RINGCENTRAL_FROM_NUMBER is not configured on the server.' }, { status: 500 });
    }

    // Step 3: Send SMS
    console.log('Step 3: Sending SMS');

    const payload = {
      to: [{ phoneNumber: to }],
      from: { phoneNumber: fromNumber },
      text: text,
    };

    console.log('Sending SMS with payload:', payload);
    const response = await client.post(API_ENDPOINTS.SMS, payload);

    console.log('SMS API response:', response);
    console.log('SMS sent successfully:', response);

    console.log('========== RINGCENTRAL SMS API - END (SUCCESS) ==========');
    return NextResponse.json({
      id: response.id,
      status: 'Sent',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('SMS error:', error);
    let errorMessage = error.message || FAILED_TO_SEND_SMS;
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
    }

    console.log(`========== RINGCENTRAL SMS API - END (ERROR: ${errorMessage}) ==========`);

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}
