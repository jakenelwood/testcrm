import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { db, campaignStepRuns } from '@/lib/drizzle/db';

const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

const schema = z.object({
  stepId: z.string().uuid(),
  targetId: z.string().uuid(),
  channel: z.string().min(1),
  payload: z.record(z.any()).default({}),
  overrides: z.record(z.any()).optional(),
  idempotencyKey: z.string().min(10).optional(),
});

function signBody(body: string, secret: string, timestamp: string) {
  const h = crypto.createHmac('sha256', secret);
  h.update(timestamp + '.' + body);
  return h.digest('hex');
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    const secret = process.env.N8N_WEBHOOK_SECRET;
    if (!n8nUrl || !secret) {
      return NextResponse.json({ success: false, error: 'N8N webhook not configured' }, { status: 500 });
    }

    const json = await req.json();
    const body = schema.parse(json);

    const campaignId = params.id;
    const timestamp = Date.now().toString();
    const idempotencyKey = body.idempotencyKey ?? crypto.randomUUID();

    const runInsert = await db.insert(campaignStepRuns).values({
      workspaceId: DEMO_WORKSPACE_ID,
      campaignId,
      targetId: body.targetId,
      stepId: body.stepId,
      channel: body.channel,
      resolvedPayload: (body.payload ?? {}) as any,
      status: 'queued',
    }).returning();

    const stepRun = runInsert?.[0];
    if (!stepRun) {
      return NextResponse.json({ success: false, error: 'Failed to create step run' }, { status: 500 });
    }

    const outbound = JSON.stringify({
      campaignId,
      stepId: body.stepId,
      targetId: body.targetId,
      channel: body.channel,
      payload: body.payload ?? {},
      overrides: body.overrides ?? {},
      stepRunId: stepRun.id,
      idempotencyKey,
    });

    const signature = signBody(outbound, secret, timestamp);

    const res = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp,
        'X-Idempotency-Key': idempotencyKey,
        'X-Signature': signature,
      },
      body: outbound,
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, data: stepRun, warning: 'n8n returned non-2xx' }, { status: 202 });
    }

    const result = await res.json().catch(() => ({}));
    return NextResponse.json({ success: true, data: { stepRun, n8n: result } }, { status: 201 });
  } catch (error) {
    console.error('enqueue error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

