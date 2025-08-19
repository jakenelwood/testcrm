import { NextRequest, NextResponse } from 'next/server';

// Simple stubbed vector search endpoint for audits
export async function GET(_req: NextRequest, context: { params: Promise<{ query: string }> }) {
  const { query } = await context.params;
  return NextResponse.json({ success: true, query, results: [], embeddings: false });
}

