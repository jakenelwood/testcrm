// utils/initializeWebPhone.ts
// Use dynamic imports to avoid server-side rendering issues
export async function initializeWebPhone(accessToken: string) {
  console.log('🔄 Initializing RingCentral WebPhone...');

  // Dynamically import the RingCentral SDK
  const RingCentralModule = await import('ringcentral');
  const RingCentral = RingCentralModule.SDK || RingCentralModule.default;

  const WebPhoneModule = await import('ringcentral-web-phone');
  const WebPhone = WebPhoneModule.default || WebPhoneModule;

  const sdk = new RingCentral({
    server: process.env.NEXT_PUBLIC_RINGCENTRAL_SERVER || 'https://platform.ringcentral.com',
    clientId: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID!,
    clientSecret: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_SECRET!
  });

  const platform = sdk.platform();

  try {
    // Step 1: Authenticate using stored access_token
    await platform.login({ access_token: accessToken });
    console.log('✅ Logged in to RingCentral SDK');

    // Step 2: Request SIP (WebRTC) info from /client-info endpoint
    // This is CRITICAL - we must call /client-info to get the SIP configuration
    // with authorizationId, expiresIn and sipInfo values
    const clientInfoResponse = await platform.post('/client-info');
    const clientInfo = await clientInfoResponse.json();
    console.log('✅ Received SIP info from /client-info', clientInfo);

    if (!clientInfo.authorizationId || !clientInfo.sipInfo) {
      throw new Error('Missing required SIP info from /client-info response');
    }

    // Step 3: Initialize WebPhone with the client info from /client-info
    // NOT with platform.auth().data() which doesn't have the required fields
    const webPhone = new WebPhone(clientInfo, {
      audioHelper: {
        enabled: true,
        incoming: true,
        outgoing: true,
      },
      enableQosLogging: true,
    });

    console.log('✅ WebPhone initialized');

    return webPhone;
  } catch (err: any) {
    console.error('❌ Failed to initialize WebPhone:', err.message);
    throw new Error('Failed to initialize WebPhone: ' + err.message);
  }
}
