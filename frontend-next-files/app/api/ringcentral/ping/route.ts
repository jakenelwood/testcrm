import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// RingCentral OAuth configuration
const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER || 'https://platform.ringcentral.com';

/**
 * Ping the RingCentral API to test connectivity
 */
export async function GET(request: NextRequest) {
  console.log('========== RINGCENTRAL PING API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Get the access token from cookies
    console.log('Getting access token from cookies');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('ringcentral_access_token')?.value;
    
    if (!accessToken) {
      console.log('No access token found, testing without authentication');
      
      // Test connectivity to RingCentral server without authentication
      const response = await fetch(`${RINGCENTRAL_SERVER}/restapi/v1.0/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        console.log('Successfully connected to RingCentral API (unauthenticated)');
        console.log('========== RINGCENTRAL PING API - END ==========');
        return NextResponse.json({ success: true, authenticated: false });
      } else {
        console.log('Failed to connect to RingCentral API (unauthenticated)');
        console.log('========== RINGCENTRAL PING API - END (WITH ERROR) ==========');
        return NextResponse.json({ 
          success: false, 
          authenticated: false,
          error: `HTTP error: ${response.status} ${response.statusText}`
        });
      }
    }
    
    // Test connectivity to RingCentral server with authentication
    console.log('Testing authenticated connection to RingCentral API');
    const response = await fetch(`${RINGCENTRAL_SERVER}/restapi/v1.0/account/~/extension/~`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('Successfully connected to RingCentral API (authenticated)');
      console.log('========== RINGCENTRAL PING API - END ==========');
      return NextResponse.json({ success: true, authenticated: true });
    } else {
      console.log('Failed to connect to RingCentral API (authenticated)');
      console.log('========== RINGCENTRAL PING API - END (WITH ERROR) ==========');
      return NextResponse.json({ 
        success: false, 
        authenticated: true,
        error: `HTTP error: ${response.status} ${response.statusText}`
      });
    }
  } catch (error: any) {
    console.error('Ping error:', error);
    console.log('========== RINGCENTRAL PING API - END (WITH ERROR) ==========');
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
