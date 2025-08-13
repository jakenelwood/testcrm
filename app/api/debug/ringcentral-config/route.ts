import { NextRequest, NextResponse } from 'next/server';
import {
  RINGCENTRAL_CLIENT_ID,
  RINGCENTRAL_CLIENT_SECRET,
  RINGCENTRAL_SERVER,
  REDIRECT_URI,
  NEXT_PUBLIC_APP_URL,
  REQUIRED_SCOPES,
  validateConfig
} from '@/lib/ringcentral/config';

export async function GET(request: NextRequest) {
  try {
    // Check configuration
    const isValid = validateConfig();
    
    const config = {
      isValid,
      hasClientId: !!RINGCENTRAL_CLIENT_ID,
      hasClientSecret: !!RINGCENTRAL_CLIENT_SECRET,
      server: RINGCENTRAL_SERVER,
      redirectUri: REDIRECT_URI,
      appUrl: NEXT_PUBLIC_APP_URL,
      scopes: REQUIRED_SCOPES,
      clientIdFirst10: RINGCENTRAL_CLIENT_ID?.substring(0, 10),
      environment: process.env.NODE_ENV,
      // Don't expose the actual secret, just whether it exists
      secretLength: RINGCENTRAL_CLIENT_SECRET?.length || 0
    };

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error checking RingCentral config:', error);
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    );
  }
}
