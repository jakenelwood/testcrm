/**
 * RingCentral WebPhone API Implementation
 * Uses our server-side API to get SIP provisioning data
 */

import { authenticateWithRingCentral, isRingCentralAuthenticated } from './ringcentral';

/**
 * Initialize WebPhone for making calls directly in the browser
 * @returns Promise resolving to the WebPhone instance
 */
export async function initializeWebPhone(): Promise<any> {
  console.log('========== RINGCENTRAL WEBPHONE API - initializeWebPhone - START ==========');
  console.log('Timestamp:', new Date().toISOString());

  try {
    // Step 1: Check if the user is authenticated with RingCentral
    console.log('Step 1: Checking RingCentral authentication');
    const isAuthenticated = await isRingCentralAuthenticated();
    console.log('Authentication status:', isAuthenticated);

    if (!isAuthenticated) {
      console.log('Not authenticated, redirecting to authentication page');
      authenticateWithRingCentral();
      throw new Error('RingCentral authentication required');
    }

    // Step 2: Dynamically import the RingCentral WebPhone SDK
    console.log('Step 2: Loading RingCentral WebPhone SDK');
    const WebPhone = (await import('ringcentral-web-phone')).default;

    // Step 3: Get SIP provisioning data from our server-side API
    console.log('Step 3: Getting SIP provisioning data from server-side API');
    const response = await fetch('/api/ringcentral/sip-provision', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    console.log('SIP provision response status:', response.status);

    if (!response.ok) {
      console.log('Failed to get SIP provision data');
      const errorData = await response.json();
      throw new Error(`Failed to get SIP provision data: ${errorData.error || response.statusText}`);
    }

    const sipProvision = await response.json();
    
    console.log('SIP provision data received:', {
      hasAuthorizationId: !!sipProvision.authorizationId,
      hasSipInfo: !!sipProvision.sipInfo,
      sipInfoCount: sipProvision.sipInfo?.length,
      expiresIn: sipProvision.expiresIn
    });

    // Step 4: Create WebPhone instance
    console.log('Step 4: Creating WebPhone instance');
    
    // Create a simple WebPhone configuration
    const webPhoneConfig = {
      logLevel: 3,
      appKey: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID,
      appName: 'Gonzigo CRM',
      appVersion: '1.0.0',
      media: {
        permissions: {
          audio: true,
          video: false
        }
      }
    };
    
    console.log('WebPhone config:', JSON.stringify(webPhoneConfig, null, 2));
    
    // Create the WebPhone instance
    const webPhone = new WebPhone(sipProvision, webPhoneConfig);
    
    console.log('WebPhone instance created successfully');
    
    if (!webPhone) {
      throw new Error('Failed to create WebPhone instance');
    }
    
    // Check if userAgent is initialized
    if (!webPhone.userAgent) {
      throw new Error('WebPhone user agent not initialized');
    }
    
    console.log('WebPhone user agent initialized successfully');
    
    // Step 5: Register the WebPhone
    console.log('Step 5: Registering WebPhone');
    try {
      // Register the WebPhone
      await webPhone.register();
      console.log('WebPhone registered successfully');
    } catch (registerError: any) {
      console.error('WebPhone registration failed:', registerError);
      throw new Error(`WebPhone registration failed: ${registerError.message}`);
    }
    
    console.log('WebPhone initialized and registered successfully');
    console.log('========== RINGCENTRAL WEBPHONE API - initializeWebPhone - END ==========');
    
    return webPhone;
  } catch (error: any) {
    console.error('Failed to initialize WebRTC phone:', error);
    console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    console.log('========== RINGCENTRAL WEBPHONE API - initializeWebPhone - END (WITH ERROR) ==========');
    throw error;
  }
}

export default {
  initializeWebPhone
};
