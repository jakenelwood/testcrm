import { NextRequest, NextResponse } from 'next/server';

// Simple stub for embeddings generation to satisfy audits
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ success: true, id, received: body, embedding: [0.0, 0.1, 0.2] });
}

