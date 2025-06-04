import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { getTokensFromCookies } from '@/utils/ringcentral';

/**
 * API route to get SIP provisioning data from RingCentral
 * This is used by the WebPhone to make calls directly in the browser
 */
export async function GET(req: NextRequest) {
  console.log('========== RINGCENTRAL SIP PROVISION API - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    let token_to_use: any;
    // Step 1: Get access token from cookies
    console.log('Step 1: Getting access token from cookies');
    const cookiesObj = await cookies();
    console.log('Cookies available:', cookiesObj.getAll().map(c => c.name));

    // Try to get the access token directly
    const accessTokenCookie = cookiesObj.get('rc_access_token');
    console.log('Access token cookie:', accessTokenCookie ? 'Found' : 'Not found');

    // If we can't get it directly, try to get it from our utility function
    const { access_token } = getTokensFromCookies(cookiesObj);
    console.log('Access token from utility:', access_token ? 'Found' : 'Not found');

    // If we still don't have it, try to get it from the auth API
    if (!access_token) {
      console.log('No access token found in cookies, trying to get it from auth API');

      try {
        // Make a request to our auth API to get the token
        const authResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/ringcentral/auth?action=token`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.get('cookie') || ''
          }
        });

        if (!authResponse.ok) {
          console.log('Failed to get access token from auth API');
          return NextResponse.json(
            { error: 'No access token found. Please authenticate with RingCentral first.' },
            { status: 401 }
          );
        }

        const authData = await authResponse.json();
        console.log('Auth data received:', {
          authenticated: authData.authenticated,
          hasAccessToken: !!authData.access_token
        });

        if (!authData.authenticated || !authData.access_token) {
          console.log('No valid access token available from auth API');
          return NextResponse.json(
            { error: 'No valid access token available. Please authenticate with RingCentral first.' },
            { status: 401 }
          );
        }

        // Use the access token from the auth API
        const access_token_from_api = authData.access_token;
        console.log('Access token from API found, length:', access_token_from_api.length);

        // Continue with the access token from the API
        token_to_use = access_token_from_api;
        console.log('Using access token from API');
      } catch (error) {
        console.error('Error getting access token from auth API:', error);
        return NextResponse.json(
          { error: 'Failed to get access token. Please authenticate with RingCentral first.' },
          { status: 401 }
        );
      }
    } else {
      console.log('Access token found in cookies, length:', access_token.length);
      token_to_use = access_token;
    }

    // Step 2: Make request to RingCentral sip-provision endpoint
    console.log('Step 2: Making request to RingCentral sip-provision endpoint');

    // Make sure we have a token to use
    if (!token_to_use) {
      console.log('No token available to use for sip-provision request');
      return NextResponse.json(
        { error: 'No access token available. Please authenticate with RingCentral first.' },
        { status: 401 }
      );
    }

    console.log('Making request to sip-provision endpoint with token, length:', token_to_use.length);

    const response = await fetch(
      `${process.env.RINGCENTRAL_SERVER}/restapi/v1.0/client-info/sip-provision`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token_to_use}`
        },
        body: JSON.stringify({
          sipInfo: [{ transport: 'WSS' }]
        })
      }
    );

    // Step 3: Process the response
    console.log('Step 3: Processing sip-provision response');
    if (!response.ok) {
      console.log('Failed to get sip-provision data');
      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);

      let errorData;
      try {
        errorData = await response.json();
        console.log('Error data:', errorData);
      } catch (e) {
        console.log('Could not parse error response as JSON');
        errorData = { error: response.statusText };
      }

      return NextResponse.json(
        { error: `Failed to get sip-provision data: ${errorData.error || response.statusText}` },
        { status: response.status }
      );
    }

    // Parse the response
    const sipProvision = await response.json();

    console.log('SIP provision data received:', {
      hasAuthorizationId: !!sipProvision.authorizationId,
      hasSipInfo: !!sipProvision.sipInfo,
      sipInfoCount: sipProvision.sipInfo?.length,
      expiresIn: sipProvision.expiresIn
    });

    // Log the full SIP provision data for debugging
    console.log('Full SIP provision data:', JSON.stringify(sipProvision, null, 2));

    // Log the structure of the sipInfo array if it exists
    if (sipProvision.sipInfo && sipProvision.sipInfo.length > 0) {
      console.log('SIP info structure:', JSON.stringify(sipProvision.sipInfo[0], null, 2));
    }

    // Validate the SIP provision data
    if (!sipProvision.sipInfo || sipProvision.sipInfo.length === 0) {
      console.log('Missing sipInfo in sip-provision response');
      return NextResponse.json(
        { error: 'Missing sipInfo in sip-provision response' },
        { status: 500 }
      );
    }

    // Check if we need to enhance the SIP provision data
    const enhancedSipProvision = { ...sipProvision };

    // Check for authorizationId in different locations
    if (!enhancedSipProvision.authorizationId) {
      console.log('Top-level authorizationId is missing, checking in sipInfo');

      // Check if authorizationId exists in the sipInfo array
      if (enhancedSipProvision.sipInfo &&
          enhancedSipProvision.sipInfo.length > 0 &&
          enhancedSipProvision.sipInfo[0].authorizationId) {
        console.log('Found authorizationId in sipInfo[0], using it');
        enhancedSipProvision.authorizationId = enhancedSipProvision.sipInfo[0].authorizationId;
      } else {
        console.log('authorizationId is missing everywhere, generating one');
        enhancedSipProvision.authorizationId = uuidv4();
      }
    }

    // Add wsServers if missing
    if (enhancedSipProvision.sipInfo && enhancedSipProvision.sipInfo.length > 0) {
      for (const info of enhancedSipProvision.sipInfo) {
        if (!info.wsServers && info.outboundProxy) {
          console.log('wsServers is missing, generating from outboundProxy');
          info.wsServers = [`wss://${info.outboundProxy}`];
        }

        // Ensure transport is set
        if (!info.transport) {
          console.log('transport is missing, setting to WSS');
          info.transport = 'WSS';
        }

        // Log the SIP info for debugging
        console.log('Enhanced SIP info:', {
          transport: info.transport,
          username: info.username ? 'Present' : 'Missing',
          password: info.password ? 'Present' : 'Missing',
          domain: info.domain,
          outboundProxy: info.outboundProxy,
          wsServers: info.wsServers ? 'Present' : 'Missing'
        });
      }
    }

    // Add expiresIn if missing
    if (!enhancedSipProvision.expiresIn) {
      console.log('expiresIn is missing, setting default');
      enhancedSipProvision.expiresIn = 3600;
    }

    // Ensure we have all required fields for WebPhone
    console.log('Final SIP provision data:', {
      hasAuthorizationId: !!enhancedSipProvision.authorizationId,
      hasSipInfo: !!enhancedSipProvision.sipInfo,
      sipInfoCount: enhancedSipProvision.sipInfo?.length,
      expiresIn: enhancedSipProvision.expiresIn
    });

    console.log('SIP provision data enhanced successfully');
    console.log('========== RINGCENTRAL SIP PROVISION API - END (SUCCESS) ==========');

    // Return the enhanced SIP provision data
    return NextResponse.json(enhancedSipProvision);
  } catch (error: any) {
    console.error('Error getting SIP provision data:', error);
    console.log('========== RINGCENTRAL SIP PROVISION API - END (ERROR) ==========');
    return NextResponse.json(
      { error: `Failed to get SIP provision data: ${error.message}` },
      { status: 500 }
    );
  }
}
