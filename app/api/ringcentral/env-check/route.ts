import { NextRequest, NextResponse } from 'next/server';
import {
  RINGCENTRAL_SERVER,
  RINGCENTRAL_FROM_NUMBER,
  RINGCENTRAL_CLIENT_ID,
  RINGCENTRAL_CLIENT_SECRET,
  REDIRECT_URI,
  validateConfig
} from '@/lib/ringcentral/config';

export async function GET(request: NextRequest) {
  const isValid = validateConfig();

  return NextResponse.json({
    RINGCENTRAL_SERVER,
    RINGCENTRAL_FROM_NUMBER,
    RINGCENTRAL_CLIENT_ID: RINGCENTRAL_CLIENT_ID ? 'Set' : 'Not set',
    RINGCENTRAL_CLIENT_SECRET: RINGCENTRAL_CLIENT_SECRET ? 'Set' : 'Not set',
    REDIRECT_URI,
    configValid: isValid
  });
}
