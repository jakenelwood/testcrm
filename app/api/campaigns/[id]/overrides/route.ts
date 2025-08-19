import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, campaignTargetOverrides } from '@/lib/drizzle/db';

const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

const bodySchema = z.object({
  targetId: z.string().uuid(),
  stepId: z.string().uuid(),
  overrides: z.record(z.any()).default({}),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const campaignId = params.id;
    const json = await request.json();
    const body = bodySchema.parse(json);

    const [created] = await db.insert(campaignTargetOverrides).values({
      campaignId,
      workspaceId: DEMO_WORKSPACE_ID,
      targetId: body.targetId,
      stepId: body.stepId,
      overridesJson: body.overrides as any,
    }).returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating override:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

