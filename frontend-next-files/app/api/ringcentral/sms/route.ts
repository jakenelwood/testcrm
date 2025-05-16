import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient } from '@/utils/ringcentral-client';

// RingCentral API configuration
const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com';
const RINGCENTRAL_FROM_NUMBER = process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER;

/**
 * Handle POST requests to send an SMS
 */
export async function POST(request: NextRequest) {
  console.log('========== RINGCENTRAL SMS API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Step 1: Parse the request body
    console.log('Step 1: Parsing request body');
    const body = await request.json();
    const { to, from, text } = body;

    // Support both parameter naming conventions
    const toNumber = to || body.phoneNumber;
    const message = text || body.message;
    const fromNumber = from || RINGCENTRAL_FROM_NUMBER;

    if (!toNumber || !message) {
      console.log('Error: Missing required parameters');
      return NextResponse.json({ error: 'To number and message text are required' }, { status: 400 });
    }

    console.log('SMS parameters:', {
      to: toNumber,
      from: fromNumber,
      text: message.substring(0, 20) + (message.length > 20 ? '...' : '') // Log only the beginning of the message for privacy
    });

    // Step 2: Initialize RingCentral client
    console.log('Step 2: Initializing RingCentral client');
    const cookieStore = await cookies();
    const client = new RingCentralClient(cookieStore);

    if (!client.isAuthenticated()) {
      console.log('Error: Not authenticated with RingCentral');
      return NextResponse.json({ error: 'Not authenticated with RingCentral' }, { status: 401 });
    }

    // Step 3: Send SMS
    console.log('Step 3: Sending SMS');
    const platform = client.getPlatform();

    // Send the SMS using the client directly
    const responseData = await client.post('/restapi/v1.0/account/~/extension/~/sms', {
      from: { phoneNumber: fromNumber },
      to: [{ phoneNumber: toNumber }],
      text: message
    });
    console.log('SMS sent successfully:', {
      id: responseData.id,
      status: 'Sent'
    });

    console.log('========== RINGCENTRAL SMS API - END (SUCCESS) ==========');
    return NextResponse.json({
      id: responseData.id,
      status: 'Sent',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error sending SMS:', error);

    // Extract error details
    let errorMessage = 'Failed to send SMS';
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

    console.log(`========== RINGCENTRAL SMS API - END (ERROR: ${errorMessage}) ==========`);

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}
