import { NextResponse } from 'next/server';

// Legacy endpoint: leads
// Deprecated in unified schema. Return 410 Gone so audits pass and avoid DB errors.
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'This endpoint is deprecated. Use /api/opportunities instead.' },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'This endpoint is deprecated. Use /api/opportunities instead.' },
    { status: 410 }
  );
}
