import { NextRequest, NextResponse } from 'next/server';
import { db, opportunities as opportunitiesTable } from '@/lib/drizzle/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// Demo workspace ID (replace with auth-derived workspace in production)
const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

const updateSchema = z.object({
  name: z.string().optional(),
  stage: z.string().optional(),
  amount: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  closeDate: z.string().optional(),
  notes: z.string().optional(),
});

// PUT /api/opportunities/[id] - Update a specific opportunity (e.g., stage move from kanban)
export async function PUT(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    // Basic UUID format check
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = updateSchema.parse(body);

    // Build update payload mapping camelCase to db column names
    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
    if (parsed.name !== undefined) updates.name = parsed.name;
    if (parsed.stage !== undefined) {
      updates.stage = parsed.stage;
      updates.stageChangedAt = new Date().toISOString();
    }
    if (parsed.amount !== undefined) updates.amount = parsed.amount.toString();
    if (parsed.probability !== undefined) updates.probability = parsed.probability;
    if (parsed.closeDate !== undefined) updates.closeDate = parsed.closeDate;
    if (parsed.notes !== undefined) updates.notes = parsed.notes;

    const [updated] = await db
      .update(opportunitiesTable)
      .set(updates)
      .where(and(eq(opportunitiesTable.id, id), eq(opportunitiesTable.workspaceId, DEMO_WORKSPACE_ID)))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

