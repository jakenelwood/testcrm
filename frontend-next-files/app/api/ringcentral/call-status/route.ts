import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { RingCentralClient } from '@/utils/ringcentral-client';
import {
  API_ENDPOINTS,
  RINGCENTRAL_SERVER, // Used for constructing verbose output
  RINGCENTRAL_FROM_NUMBER // Used for constructing verbose output
} from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';
import { RingCentralResourceNotFoundError } from '@/utils/ringcentral-client';

interface CallStatusParams {
  callId?: string;
  ringSessionId?: string;
  verbose?: boolean;
}

async function handleCallStatus(params: CallStatusParams, clientRequest: NextRequest, retryCount: number = 0) {
  console.log('========== RINGCENTRAL CALL STATUS API - PROCESSING ==========');
  console.log(`Retry count: ${retryCount}`);
  const { callId, ringSessionId, verbose } = params;
  const troubleshooting: string[] = [];

  try {
    if (!callId && !ringSessionId) {
      troubleshooting.push('callId or ringSessionId is required');
      return NextResponse.json({ error: 'callId or ringSessionId is required', troubleshooting }, { status: 400 });
    }

    console.log('Getting cookies for RingCentral client initialization');
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
    
    // Pass the original clientRequest to RingCentralClient for origin detection if needed
    console.log('Initializing RingCentralClient');
    const client = new RingCentralClient(cookieStore, clientRequest); 
    troubleshooting.push('RingCentralClient initialized');

    let endpoint: string;
    if (ringSessionId) {
      endpoint = API_ENDPOINTS.TELEPHONY_SESSION(ringSessionId);
      troubleshooting.push(`Using telephony session status endpoint for ringSessionId: ${ringSessionId}`);
      console.log(`Using telephony session status endpoint for ringSessionId: ${ringSessionId}`);
    } else if (callId) {
      endpoint = API_ENDPOINTS.RING_OUT_CALL(callId);
      troubleshooting.push(`Using RingOut status endpoint for callId: ${callId}`);
      console.log(`Using RingOut status endpoint for callId: ${callId}`);
    } else {
      return NextResponse.json({ error: 'Internal error: callId or ringSessionId became undefined' }, { status: 500 });
    }

    console.log(`Fetching call status from endpoint: ${endpoint}`);
    troubleshooting.push(`Fetching call status from endpoint: ${endpoint}`);
    
    try {
      const callData = await client.get(endpoint);
      console.log('Call status data:', callData);
      troubleshooting.push('Successfully fetched call status data.');

      console.log('========== RINGCENTRAL CALL STATUS API - END PROCESSING ==========');
      return NextResponse.json({
        success: true,
        data: callData,
        troubleshooting,
        timestamp: new Date().toISOString(),
        ...(verbose && { 
          verbose: {
              fromNumber: RINGCENTRAL_FROM_NUMBER,
              server: RINGCENTRAL_SERVER,
              tokenAvailable: client.isAuthenticated(),
              clientUsesRequestOrigin: (client as any).requestOrigin,
          }
        })
      });
    } catch (error: any) {
      console.error('Error fetching call status:', error);
      troubleshooting.push(`Error fetching call status: ${error.message}`);
      
      if (error.message && error.message.includes(RINGCENTRAL_NOT_AUTHENTICATED_ERROR)) {
        if (retryCount < 2 && refreshToken) {
          console.log(`Authentication failed, attempting to refresh token (retry ${retryCount + 1}/2)...`);
          troubleshooting.push(`Authentication failed, attempting to refresh token (retry ${retryCount + 1}/2)...`);
          
          // Manually call the refresh API
          try {
            const refreshResponse = await fetch(`${clientRequest.nextUrl.origin}/api/ringcentral/auth?action=refresh`, {
              method: 'GET',
              headers: {
                'Cookie': Array.from(cookieStore.getAll())
                  .map(c => `${c.name}=${c.value}`)
                  .join('; '),
              },
            });
            
            if (refreshResponse.ok) {
              console.log('Token refreshed successfully, retrying call status request');
              troubleshooting.push('Token refreshed successfully, retrying call status request');
              // Wait a moment for cookies to be set properly
              await new Promise(resolve => setTimeout(resolve, 500));
              return handleCallStatus(params, clientRequest, retryCount + 1);
            } else {
              console.error('Failed to refresh token, status:', refreshResponse.status);
              return NextResponse.json({ 
                error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR,
                troubleshooting,
                authenticated: false
              }, { status: 401 });
            }
          } catch (refreshError) {
            console.error('Error during token refresh attempt:', refreshError);
            troubleshooting.push(`Error during token refresh attempt: ${refreshError}`);
          }
        }
        
        return NextResponse.json({ 
          error: RINGCENTRAL_NOT_AUTHENTICATED_ERROR,
          troubleshooting,
          authenticated: false
        }, { status: 401 });
      }
      
      // Rethrow for the outer catch to handle
      throw error;
    }
  } catch (error: any) {
    console.log('Caught exception in main try/catch block for call status');
    troubleshooting.push(`Error occurred: ${error.message}`);

    if (error instanceof RingCentralResourceNotFoundError) {
      console.log('Call status error: Resource not found (404 from RingCentral).');
      troubleshooting.push('RingCentral reported resource not found (likely call ended and cleaned up).');
      console.log('========== RINGCENTRAL CALL STATUS API - END (RESOURCE NOT FOUND) ==========');
      return NextResponse.json({
        success: true,
        data: { callStatus: 'NotFound', message: error.message },
        troubleshooting,
        timestamp: new Date().toISOString(),
        ...(verbose && { 
          verbose: {
              fromNumber: RINGCENTRAL_FROM_NUMBER,
              server: RINGCENTRAL_SERVER,
              originalError: error.originalErrorData
          }
        })
      }, { status: 200 });
    } else {
      console.error('Call status error:', error.message, error.stack);
      console.log('========== RINGCENTRAL CALL STATUS API - END (WITH ERROR) ==========');
      const status = error.message && error.message.includes(RINGCENTRAL_NOT_AUTHENTICATED_ERROR) ? 401 : 500;
      return NextResponse.json({
        error: error.message || UNKNOWN_ERROR_OCCURRED,
        troubleshooting,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }, { status });
    }
  }
}

export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL CALL STATUS API - GET START ==========');
  const { searchParams } = new URL(request.url);
  const callId = searchParams.get('callId') || undefined;
  const ringSessionId = searchParams.get('ringSessionId') || undefined;
  const verbose = searchParams.get('verbose') === 'true';

  if (!callId && !ringSessionId) {
    return NextResponse.json({ error: 'callId or ringSessionId query parameter is required' }, { status: 400 });
  }
  
  return handleCallStatus({ callId, ringSessionId, verbose }, request);
}

export async function POST(request: NextRequest) {
  console.log('========== RINGCENTRAL CALL STATUS API - POST START ==========');
  let requestBody: CallStatusParams;
  try {
    requestBody = await request.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  return handleCallStatus(requestBody, request);
}
