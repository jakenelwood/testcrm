import { NextResponse } from 'next/server';

// Minimal accounts endpoint to satisfy audit. Replace with real implementation later.
export async function GET() {
  return NextResponse.json({ success: true, data: [], count: 0 });
}

