/**
 * RingCentral WebRTC Utility
 * This file contains utility functions for working with RingCentral WebRTC
 */

import { authenticateWithRingCentral, isRingCentralAuthenticated } from './ringcentral';

/**
 * Initialize WebRTC phone for making calls directly in the browser
 * @returns Promise resolving to the WebPhone instance
 */
export async function initializeWebPhone(): Promise<any> {
  console.log('========== RINGCENTRAL WEBRTC - initializeWebPhone - START ==========');
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

    // Step 2: Get the access token from the server
    console.log('Step 2: Getting access token');
    const response = await fetch('/api/ringcentral/auth?action=token', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    console.log('Token response status:', response.status);

    if (!response.ok) {
      console.log('Failed to get access token');
      throw new Error('Failed to get access token');
    }

    const tokenData = await response.json();
    console.log('Token data received:', {
      authenticated: tokenData.authenticated,
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      hasExpiresAt: !!tokenData.expires_at
    });

    if (!tokenData.authenticated || !tokenData.access_token) {
      console.log('No valid access token available');
      throw new Error('No valid access token available');
    }

    // Step 3: Dynamically import the RingCentral SDK
    console.log('Step 3: Loading RingCentral SDK');
    const RingCentral = (await import('ringcentral')).default;
    const WebPhone = (await import('ringcentral-web-phone')).default;

    // Step 4: Create RingCentral SDK instance
    console.log('Step 4: Creating RingCentral SDK instance');
    const sdk = new RingCentral({
      server: process.env.NEXT_PUBLIC_RINGCENTRAL_SERVER || 'https://platform.ringcentral.com',
      clientId: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_SECRET
    });

    // Step 5: Initialize platform with the access token
    console.log('Step 5: Initializing platform with access token');
    const platform = sdk.platform();

    // Set the auth data
    await platform.auth().setData({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_at ? Math.floor((tokenData.expires_at - Date.now()) / 1000) : 3600,
      token_type: tokenData.token_type || 'bearer'
    });

    // Step 6: Get SIP provisioning data directly
    console.log('Step 6: Getting SIP provisioning data directly');
    try {
      // This is the critical step - we need to get the SIP provisioning data
      // We use the sip-provision endpoint which doesn't require ReadClientInfo permission
      const sipProvisionResponse = await platform.post('/restapi/v1.0/client-info/sip-provision', {
        sipInfo: [{ transport: 'WSS' }]
      });

      const sipProvision = await sipProvisionResponse.json();

      console.log('SIP provision data received:', {
        hasAuthorizationId: !!sipProvision.authorizationId,
        hasSipInfo: !!sipProvision.sipInfo,
        sipInfoCount: sipProvision.sipInfo?.length,
        expiresIn: sipProvision.expiresIn
      });

      // Validate the SIP provision data
      if (!sipProvision || !sipProvision.sipInfo || !sipProvision.sipInfo.length) {
        throw new Error('Missing or incomplete SIP provision data');
      }

      // Check if we have the required fields
      const sipInfo = sipProvision.sipInfo[0];
      console.log('SIP info details:', {
        transport: sipInfo.transport,
        hasOutboundProxy: !!sipInfo.outboundProxy,
        hasDomain: !!sipInfo.domain,
        hasUserName: !!sipInfo.userName,
        hasPassword: !!sipInfo.password,
        hasWsServers: !!sipInfo.wsServers
      });

      // Make sure we have an authorizationId
      if (!sipProvision.authorizationId) {
        console.log('No authorizationId in SIP provision data, generating one');
        sipProvision.authorizationId = crypto.randomUUID();
      }

      // Step 7: Create WebPhone instance
      console.log('Step 7: Creating WebPhone instance');

      // Create a WebPhone configuration
      const webPhoneConfig = {
        logLevel: 3, // Debug level for more detailed logs
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

      // Check if we need to add wsServers to the SIP info
      if (sipProvision.sipInfo && sipProvision.sipInfo.length > 0) {
        for (const info of sipProvision.sipInfo) {
          if (!info.wsServers && info.outboundProxy) {
            console.log('Adding wsServers based on outboundProxy');
            info.wsServers = [`wss://${info.outboundProxy}`];
          }
        }
      }

      // Make sure we have expiresIn
      if (!sipProvision.expiresIn) {
        console.log('No expiresIn in SIP provision data, setting default');
        sipProvision.expiresIn = 3600;
      }

      console.log('SIP provision data prepared for WebPhone');

      // Create the WebPhone instance with the SIP provision data
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

      // Step 8: Register the WebPhone with the SIP server
      console.log('Step 8: Registering WebPhone with SIP server');
      try {
        // This is the crucial step - we must call register() to initialize the SIP user agent
        await (webPhone as any).register();
        console.log('WebPhone registered successfully');
      } catch (registerError: any) {
        console.error('WebPhone registration failed:', registerError);
        console.log('Registration error details:', registerError.message);
        console.log('Registration error stack:', registerError.stack);
        throw new Error(`WebPhone registration failed: ${registerError.message}`);
      }

      console.log('WebPhone initialized and registered successfully');
      console.log('========== RINGCENTRAL WEBRTC - initializeWebPhone - END ==========');

      return webPhone;
    } catch (error: any) {
      console.error('Error initializing WebPhone:', error);
      console.log('Error stack:', error.stack);

      // Check for specific error types
      if (error.message && error.message.includes('ReadAccounts')) {
        throw new Error('Failed to initialize WebPhone: In order to call this API endpoint, application needs to have [ReadAccounts] permission. Please log out and re-authenticate with the proper permissions.');
      }

      throw new Error(`Failed to initialize WebPhone: ${error.message}`);
    }
  } catch (error: any) {
    console.log('Error initializing WebPhone:');
    console.error('Failed to initialize WebRTC phone:', error);
    console.log('Error stack:', error instanceof Error ? error.stack : 'No stack trace available');
    console.log('========== RINGCENTRAL WEBRTC - initializeWebPhone - END (WITH ERROR) ==========');
    throw error;
  }
}

export default {
  initializeWebPhone
};
