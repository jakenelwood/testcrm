import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient, RingCentralTokenRevokedError } from '@/utils/ringcentral-client';
import { API_ENDPOINTS } from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, FAILED_TO_END_CALL } from '@/lib/constants';

/**
 * Handle POST requests to end an active call
 */
export async function POST(request: NextRequest) {
  console.log('========== RINGCENTRAL END CALL API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  
  // Read the request body ONLY ONCE at the top level
  let requestBody: { callId?: string };
  try {
    requestBody = await request.json();
  } catch (error) {
    console.log('Error parsing request body:', error);
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  if (!requestBody.callId) {
    console.log('Error: No call ID provided for ending call');
    return NextResponse.json({ error: 'Call ID is required to end the call' }, { status: 400 });
  }

  // Pass the parsed body to the handler function
  return handleEndCall(requestBody.callId, request, 0);
}

/**
 * Handle the end call logic with retry capability
 * @param callId - The call ID to end (already parsed from request body)
 * @param originalRequest - The original request object (for headers, origin, etc.)
 * @param retryCount - Current retry attempt number
 */
async function handleEndCall(callId: string, originalRequest: NextRequest, retryCount: number = 0) {
  console.log(`========== RETRY ${retryCount}: ENDING CALL ${callId} ==========`);
  const troubleshooting: string[] = [];

  try {
    console.log('Call ID to end:', callId);
    troubleshooting.push(`Call ID to end: ${callId}`);

    // Step 1: Initialize RingCentral client
    console.log('Step 1: Initializing RingCentral client');
    const cookieStore = await cookies();
    troubleshooting.push('Retrieved cookies for RingCentral client');
    
    // Check if we have the access token before trying to use the client
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;
    const tokenExpiry = cookieStore.get('ringcentral_access_token_expiry_time')?.value;
    const refreshToken = cookieStore.get('ringcentral_refresh_token')?.value;
    
    troubleshooting.push(`Token status: accessToken exists: ${!!accessToken}, refreshToken exists: ${!!refreshToken}`);
    
    if (!accessToken) {
      console.log('No access token found in cookies');
      troubleshooting.push('No access token found in cookies');
      
      if (refreshToken) {
        troubleshooting.push('Refresh token found, will attempt to refresh during client initialization');
      } else {
        troubleshooting.push('No refresh token found, authentication will fail');
        return NextResponse.json({ 
          error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR,
          troubleshooting,
          authenticated: false
        }, { status: 401 });
      }
    }
    
    if (tokenExpiry && parseInt(tokenExpiry) < Date.now()) {
      console.log('Access token has expired');
      troubleshooting.push(`Access token has expired (expired at ${new Date(parseInt(tokenExpiry)).toISOString()})`);
    }
    
    const client = new RingCentralClient(cookieStore, originalRequest);
    troubleshooting.push('RingCentralClient initialized');

    // Step 2: End the call
    console.log('Step 2: Ending call');
    troubleshooting.push('Attempting to end call');

    try {
      // End the call using the client
      const endCallResponse = await client.endCall(callId);
      console.log('Successfully sent end call request');
      console.log('End call response:', endCallResponse);
      troubleshooting.push('Call ended successfully');
    } catch (error: any) {
      console.error('Error in end call request:', error);
      troubleshooting.push(`Error ending call: ${error.message}`);
      
      if (error.message && error.message.includes(RINGCENTRAL_NOT_AUTHENTICATED_ERROR)) {
        if (retryCount < 2 && refreshToken) {
          console.log(`Authentication failed, attempting to refresh token (retry ${retryCount + 1}/2)...`);
          troubleshooting.push(`Authentication failed, attempting to refresh token (retry ${retryCount + 1}/2)...`);
          
          // Add delay to prevent rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Manually call the refresh API
          try {
            const refreshResponse = await fetch(`${originalRequest.nextUrl.origin}/api/ringcentral/auth?action=refresh`, {
              method: 'GET',
              headers: {
                'Cookie': Array.from(cookieStore.getAll())
                  .map(c => `${c.name}=${c.value}`)
                  .join('; '),
              },
              cache: 'no-store',
            });
            
            let refreshErrorData: any = {};
            try {
              if (!refreshResponse.ok) {
                refreshErrorData = await refreshResponse.json();
              }
            } catch (e) {
              console.error('[handleEndCall] Could not parse JSON from failed refresh response:', e);
              refreshErrorData = { error: 'Failed to parse refresh error response', reauthorize: false };
            }

            if (refreshResponse.ok) {
              console.log('Token refreshed successfully, retrying end call request');
              troubleshooting.push('Token refreshed successfully, retrying end call request');
              // Wait a moment for cookies to be set properly
              await new Promise(resolve => setTimeout(resolve, 1000));
              return handleEndCall(callId, originalRequest, retryCount + 1);
            } else {
              console.error('Failed to refresh token during endCall retry, status:', refreshResponse.status, 'Body:', refreshErrorData);
              troubleshooting.push(`Manual refresh failed with status ${refreshResponse.status}. Error: ${refreshErrorData.error}`);
              
              // If token is revoked, do not attempt further retries and signal re-auth
              if (refreshErrorData.reauthorize === true || refreshErrorData.error === 'invalid_grant') {
                troubleshooting.push('Token revoked. Full re-authentication required.');
                return NextResponse.json({
                  error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR,
                  detail: 'RingCentral token revoked. Please re-authenticate.',
                  reauthorize: true,
                  troubleshooting,
                  authenticated: false
                }, { status: 401 });
              }
              
              return NextResponse.json({
                error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR,
                detail: refreshErrorData.error || 'Failed to refresh token during retry.',
                troubleshooting,
                authenticated: false
              }, { status: 401 });
            }
          } catch (refreshCatchError: any) {
            console.error('Error during token refresh attempt (fetch failed):', refreshCatchError);
            troubleshooting.push(`Error during token refresh attempt: ${refreshCatchError.message}`);
            // Fall through to the main 401 unauthorized response
          }
        }
        
        // If retries exhausted, no refresh token, or if refresh attempt failed and was not token_revoked
        return NextResponse.json({ 
          error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR,
          detail: error.message,
          reauthorize: (error instanceof RingCentralTokenRevokedError),
          troubleshooting,
          authenticated: false
        }, { status: 401 });
      }
      
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
      timestamp: new Date().toISOString(),
      troubleshooting
    });

  } catch (error: any) {
    console.error('Error ending call:', error);
    const errorMessage = error.message || FAILED_TO_END_CALL;
    console.log(`========== RINGCENTRAL END CALL API - END (ERROR: ${errorMessage}) ==========`);
    return NextResponse.json({
      error: errorMessage,
      troubleshooting,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
