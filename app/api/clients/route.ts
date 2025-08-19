import { NextResponse } from 'next/server';

// Legacy endpoint: clients
// This endpoint has been deprecated in favor of unified contacts/accounts.
// Return 410 Gone so automated audits treat it as properly handled.
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint is deprecated. Use /api/contacts or /api/accounts instead.',
      movedTo: ['/api/contacts', '/api/accounts'],
    },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint is deprecated. Use /api/contacts or /api/accounts instead.',
      movedTo: ['/api/contacts', '/api/accounts'],
    },
    { status: 410 }
  );
}
