import { NextRequest, NextResponse } from 'next/server';
import WebSocket from 'ws';

/**
 * Test WebSocket connectivity to a RingCentral SIP server
 * This is a server-side proxy to test WebSocket connections that might be blocked by CORS in the browser
 */
export async function POST(request: NextRequest) {
  console.log('========== RINGCENTRAL TEST WEBSOCKET API - START ==========');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    // Parse the request body
    const body = await request.json();
    const { url } = body;
    
    if (!url) {
      console.log('Error: No URL provided');
      return NextResponse.json({ success: false, error: 'No URL provided' }, { status: 400 });
    }
    
    console.log(`Testing WebSocket connection to: ${url}`);
    
    // Create a promise that will resolve when the WebSocket connects or fails
    const testWebSocketConnection = () => {
      return new Promise((resolve, reject) => {
        try {
          // Set a timeout in case the connection hangs
          const timeout = setTimeout(() => {
            console.log('WebSocket connection timed out');
            if (ws.readyState !== WebSocket.OPEN) {
              ws.terminate();
              reject(new Error('Connection timed out after 10 seconds'));
            }
          }, 10000);
          
          // Create a WebSocket connection
          const ws = new WebSocket(url);
          
          ws.on('open', () => {
            console.log('WebSocket connection successful');
            clearTimeout(timeout);
            ws.close();
            resolve({ success: true });
          });
          
          ws.on('error', (error) => {
            console.log(`WebSocket connection error: ${error.message}`);
            clearTimeout(timeout);
            ws.terminate();
            reject(error);
          });
          
          ws.on('close', (code, reason) => {
            console.log(`WebSocket connection closed: ${code} ${reason}`);
            clearTimeout(timeout);
          });
        } catch (error) {
          console.log(`Error creating WebSocket: ${error.message}`);
          reject(error);
        }
      });
    };
    
    // Test the connection
    try {
      const result = await testWebSocketConnection();
      console.log('WebSocket test completed successfully');
      console.log('========== RINGCENTRAL TEST WEBSOCKET API - END ==========');
      return NextResponse.json({ success: true });
    } catch (error) {
      console.log(`WebSocket test failed: ${error.message}`);
      console.log('========== RINGCENTRAL TEST WEBSOCKET API - END (WITH ERROR) ==========');
      return NextResponse.json({ success: false, error: error.message });
    }
  } catch (error: any) {
    console.error('Test WebSocket error:', error);
    console.log('========== RINGCENTRAL TEST WEBSOCKET API - END (WITH ERROR) ==========');
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred'
    }, { status: 500 });
  }
}
