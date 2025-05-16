import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { logStep, validateSipInfo } from '@/utils/ringcentral-webrtc-debug';

// RingCentral OAuth configuration
const RINGCENTRAL_CLIENT_ID = process.env.RINGCENTRAL_CLIENT_ID;
const RINGCENTRAL_CLIENT_SECRET = process.env.RINGCENTRAL_CLIENT_SECRET;
const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com';

/**
 * Handle GET requests to get the client info for WebRTC
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL CLIENT INFO API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Get the access token from cookies
    console.log('Step 1: Getting access token from cookies');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;

    if (!accessToken) {
      console.log('No access token found in cookies');
      console.log('========== RINGCENTRAL CLIENT INFO API - END (NO TOKEN) ==========');
      return NextResponse.json({ error: 'No access token found' }, { status: 401 });
    }

    console.log('Access token found, length:', accessToken.length);

    // Make the request to RingCentral's client-info/sip-provision endpoint
    console.log('Step 2: Making request to RingCentral client-info/sip-provision endpoint');
    const clientInfoResponse = await fetch(`${RINGCENTRAL_SERVER}/restapi/v1.0/client-info/sip-provision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        sipInfo: [{
          transport: 'WSS'
        }]
      })
    });

    if (!clientInfoResponse.ok) {
      console.error('Failed to get client info:', clientInfoResponse.statusText);
      console.log('Response status:', clientInfoResponse.status);
      console.log('Request URL:', `${RINGCENTRAL_SERVER}/restapi/v1.0/client-info/sip-provision`);

      let errorMessage = `Failed to get client info: ${clientInfoResponse.status} ${clientInfoResponse.statusText}`;
      let errorData = null;

      try {
        errorData = await clientInfoResponse.json();
        console.error('Error data:', errorData);

        if (errorData.errorCode) {
          errorMessage += ` - ${errorData.errorCode}`;
        }

        if (errorData.message) {
          errorMessage += `: ${errorData.message}`;
        }
      } catch (e) {
        console.log('Could not parse error response as JSON');
      }

      // Check for common error cases
      if (clientInfoResponse.status === 401) {
        errorMessage = 'Authentication failed. Your access token may have expired. Please log in again.';
      } else if (clientInfoResponse.status === 403) {
        errorMessage = 'Permission denied. Your app may need additional permissions. Please check the scopes in your authorization request.';
      } else if (clientInfoResponse.status === 404) {
        errorMessage = 'The client-info/sip-provision endpoint was not found. Please check the API version and endpoint URL.';
      }

      console.log('Error message:', errorMessage);
      console.log('========== RINGCENTRAL CLIENT INFO API - END (ERROR) ==========');

      return NextResponse.json({
        error: errorMessage,
        status: clientInfoResponse.status,
        statusText: clientInfoResponse.statusText,
        details: errorData
      }, { status: clientInfoResponse.status });
    }

    // Parse the response
    const clientInfo = await clientInfoResponse.json();

    console.log('Step 3: Processing client info response');
    console.log('Client info received:', {
      hasAuthorizationId: !!clientInfo.authorizationId,
      hasSipInfo: !!clientInfo.sipInfo,
      sipInfoCount: clientInfo.sipInfo?.length,
      expiresIn: clientInfo.expiresIn
    });

    // Use the new debug utility to log SIP info
    if (clientInfo.sipInfo && clientInfo.sipInfo.length > 0) {
      logStep('SIP Info', clientInfo.sipInfo[0]);

      // Validate the SIP info
      const sipValidation = validateSipInfo(clientInfo.sipInfo[0]);
      logStep('SIP Validation', sipValidation);

      if (!sipValidation.valid) {
        console.warn('SIP info validation failed:', sipValidation.issues);
      }
    }

    // Check for missing fields and try to fix them
    if (!clientInfo.sipInfo) {
      console.error('Missing sipInfo in client info response');
      console.log('========== RINGCENTRAL CLIENT INFO API - END (MISSING FIELDS) ==========');
      return NextResponse.json({
        error: 'Missing sipInfo in client info response'
      }, { status: 500 });
    }

    // ✅ 1. Verify client-info includes SIP Info
    const sipInfo = clientInfo.sipInfo?.[0];
    if (!sipInfo || !sipInfo.authorizationId) {
      console.warn('Invalid or missing SIP info, attempting to fix');
      logStep('Invalid SIP Info', sipInfo);

      // If authorizationId is missing, we'll generate one
      // This is a workaround for the RingCentral API not returning this field
      if (sipInfo && !sipInfo.authorizationId) {
        console.log('authorizationId is missing, generating one');

        // Generate a random authorizationId (UUID format)
        const uuid = crypto.randomUUID();
        sipInfo.authorizationId = uuid;

        console.log('Generated authorizationId:', uuid);
      }
    }

    // Add wsServers if missing
    if (clientInfo.sipInfo && clientInfo.sipInfo.length > 0 && !clientInfo.sipInfo[0].wsServers) {
      console.log('wsServers is missing, generating from outboundProxy');

      // Generate wsServers from outboundProxy
      if (clientInfo.sipInfo[0].outboundProxy) {
        const proxy = clientInfo.sipInfo[0].outboundProxy;
        clientInfo.sipInfo[0].wsServers = [`wss://${proxy}`];

        console.log('Generated wsServers:', clientInfo.sipInfo[0].wsServers);
      }
    }

    // Add expiresIn if missing
    if (!clientInfo.expiresIn) {
      console.log('expiresIn is missing, setting default');
      clientInfo.expiresIn = 3600; // 1 hour
      console.log('Set expiresIn to:', clientInfo.expiresIn);
    }

    // Final validation check before returning
    const finalSipInfo = clientInfo.sipInfo?.[0];
    const finalValidation = validateSipInfo(finalSipInfo);

    // Add debug information to the response
    const debugInfo = {
      sipInfoValid: finalValidation.valid,
      sipInfoIssues: finalValidation.issues,
      timestamp: new Date().toISOString()
    };

    // Log the final state
    logStep('Final SIP Info Validation', finalValidation);
    console.log('Client info retrieved successfully');
    console.log('========== RINGCENTRAL CLIENT INFO API - END (SUCCESS) ==========');

    // Return the client info with debug information
    return NextResponse.json({
      ...clientInfo,
      _debug: debugInfo
    });
  } catch (error: any) {
    console.error('Error getting client info:', error);
    console.log('Error stack:', error.stack);
    console.log('========== RINGCENTRAL CLIENT INFO API - END (ERROR) ==========');
    return NextResponse.json({
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
