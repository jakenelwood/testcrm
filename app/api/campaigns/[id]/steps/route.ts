import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, campaignSteps } from '@/lib/drizzle/db';
import { and, eq, asc } from 'drizzle-orm';

const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

const bodySchema = z.object({
  stepNumber: z.number().int().min(1),
  templateId: z.string().uuid().optional(),
  waitAfterMs: z.number().int().min(0).default(0),
  condition: z.record(z.any()).optional(),
  branchLabel: z.string().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;

    const rows = await db
      .select()
      .from(campaignSteps)
      .where(and(eq(campaignSteps.workspaceId, DEMO_WORKSPACE_ID), eq(campaignSteps.campaignId, campaignId)))
      .orderBy(asc(campaignSteps.stepNumber));

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error listing steps:', error);
    return NextResponse.json({ success: false, error: 'Failed to list steps' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;
    const json = await request.json();
    const body = bodySchema.parse(json);

    const [created] = await db.insert(campaignSteps).values({
      campaignId,
      workspaceId: DEMO_WORKSPACE_ID,
      stepNumber: body.stepNumber,
      templateId: body.templateId,
      waitAfterMs: body.waitAfterMs,
      condition: (body.condition ?? {}) as any,
      branchLabel: body.branchLabel,
    }).returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating step:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

