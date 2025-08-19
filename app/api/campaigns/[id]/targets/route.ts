import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, campaignTargets } from '@/lib/drizzle/db';
import { and, eq, desc } from 'drizzle-orm';

const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

const bodySchema = z.object({
  opportunityId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;

    const rows = await db
      .select()
      .from(campaignTargets)
      .where(and(eq(campaignTargets.workspaceId, DEMO_WORKSPACE_ID), eq(campaignTargets.campaignId, campaignId)))
      .orderBy(desc(campaignTargets.assignedAt));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listing targets:', error);
    return NextResponse.json({ success: false, error: 'Failed to list targets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;
    const json = await request.json();
    const body = bodySchema.parse(json);

    const [created] = await db.insert(campaignTargets).values({
      campaignId,
      workspaceId: DEMO_WORKSPACE_ID,
      opportunityId: body.opportunityId,
      contactId: body.contactId,
      accountId: body.accountId,
    }).returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error adding target:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

