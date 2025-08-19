import { NextRequest, NextResponse } from 'next/server';
import { db, contacts, accounts, documents } from '@/lib/drizzle/db';
import { embedText } from '@/lib/ai/voyage';
import { and, eq, sql } from 'drizzle-orm';

// Cosine distance using pgvector: smaller is more similar.
// We order ASC on distance to get nearest neighbors.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query, scope = 'contacts', limit = 10 } = body as {
      query: string;
      scope?: 'contacts' | 'accounts' | 'interactions' | 'documents';
      limit?: number;
    };

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ success: false, error: 'query is required' }, { status: 400 });
    }

    // 1) Get query embedding from Voyage
    const { embedding } = await embedText(query, { inputType: 'query' });
    // Cast embedding to pgvector literal to avoid parameter expansion issues
    const vec = sql.raw(`'[${embedding.join(',')}]'::vector`);

    // 2) Run vector search depending on scope (workspace scoped)
    const WORKSPACE = '550e8400-e29b-41d4-a716-446655440000';

    if (scope === 'contacts') {
      const rows = await db
        .select({
          id: contacts.id,
          firstName: contacts.firstName,
          lastName: contacts.lastName,
          email: contacts.email,
          distance: sql<number>`(${contacts.summaryEmbedding} <-> ${vec})`,
        })
        .from(contacts)
        .where(and(eq(contacts.workspaceId, WORKSPACE)))
        .orderBy(sql`(${contacts.summaryEmbedding} <-> ${vec}) ASC`)
        .limit(limit);

      return NextResponse.json({ success: true, scope, count: rows.length, results: rows });
    }

    if (scope === 'accounts') {
      const rows = await db
        .select({
          id: accounts.id,
          name: accounts.name,
          distance: sql<number>`(${accounts.summaryEmbedding} <-> ${vec})`,
        })
        .from(accounts)
        .where(and(eq(accounts.workspaceId, WORKSPACE)))
        .orderBy(sql`(${accounts.summaryEmbedding} <-> ${vec}) ASC`)
        .limit(limit);

      return NextResponse.json({ success: true, scope, count: rows.length, results: rows });
    }

    // interactions table exported under migrations may be partitioned; skip for now in MVP

    if (scope === 'documents') {
      const rows = await db
        .select({
          id: documents.id,
          fileName: documents.fileName,
          distance: sql<number>`(${documents.embedding} <-> ${vec})`,
        })
        .from(documents)
        .where(and(eq(documents.workspaceId, WORKSPACE)))
        .orderBy(sql`(${documents.embedding} <-> ${vec}) ASC`)
        .limit(limit);

      return NextResponse.json({ success: true, scope, count: rows.length, results: rows });
    }

    return NextResponse.json({ success: true, scope, count: 0, results: [] });
  } catch (error: any) {
    console.error('Error in /api/ai/search:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unknown error' }, { status: 500 });
  }
}

