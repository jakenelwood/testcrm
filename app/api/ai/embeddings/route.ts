import { NextRequest, NextResponse } from 'next/server';
import { db, contacts, accounts, documents } from '@/lib/drizzle/db';
import { embedText } from '@/lib/ai/voyage';
import { eq } from 'drizzle-orm';

// Persist embeddings to vector columns depending on entity type
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { text, entity, id, inputType = 'document' } = body as {
      text: string;
      entity?: 'contact' | 'account' | 'interaction' | 'document';
      id?: string;
      inputType?: 'query' | 'document';
    };

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'text is required' }, { status: 400 });
    }

    const { embedding, model, dimensions } = await embedText(text, { inputType });

    // If entity and id provided, store embedding in the appropriate table
    let stored: { entity?: string; id?: string } = {};
    if (entity && id) {
      if (entity === 'contact') {
        await db.update(contacts).set({ summaryEmbedding: embedding as any }).where(eq(contacts.id, id));
        stored = { entity, id };
      } else if (entity === 'account') {
        await db.update(accounts).set({ summaryEmbedding: embedding as any }).where(eq(accounts.id, id));
        stored = { entity, id };
      } else if (entity === 'document') {
        await db.update(documents).set({ embedding: embedding as any }).where(eq(documents.id, id));
        stored = { entity, id };
      }
    }

    return NextResponse.json({ success: true, model, dimensions, embedding, stored });
  } catch (error: any) {
    console.error('Error in /api/ai/embeddings:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}

