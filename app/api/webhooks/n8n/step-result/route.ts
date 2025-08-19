import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { db, campaignStepRuns } from '@/lib/drizzle/db';
import { eq } from 'drizzle-orm';

const schema = z.object({
  stepRunId: z.string().uuid(),
  status: z.enum(['sent', 'bounced', 'failed', 'skipped']).default('sent'),
  sentAt: z.string().optional(),
  error: z.record(z.any()).optional(),
  executionId: z.string().optional(),
  providerMessageId: z.string().optional(),
  providerResponse: z.record(z.any()).optional(),
});

function verifySignature(raw: string, timestamp: string, signature: string, secret: string) {
  const h = crypto.createHmac('sha256', secret);
  h.update(timestamp + '.' + raw);
  const expected = h.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.N8N_WEBHOOK_SECRET;
    if (!secret) return NextResponse.json({ success: false, error: 'Missing webhook secret' }, { status: 500 });

    const timestamp = req.headers.get('x-timestamp') ?? '';
    const signature = req.headers.get('x-signature') ?? '';
    const raw = await req.text();

    if (!timestamp || !signature) {
      return NextResponse.json({ success: false, error: 'Missing signature headers' }, { status: 401 });
    }

    const ok = verifySignature(raw, timestamp, signature, secret);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    const parsed = schema.parse(JSON.parse(raw));

    const updates: any = {
      status: parsed.status,
    };
    if (parsed.sentAt) updates.sentAt = new Date(parsed.sentAt).toISOString();
    if (parsed.executionId) updates.n8nExecutionId = parsed.executionId;
    if (parsed.providerMessageId) updates.providerMessageId = parsed.providerMessageId;
    if (parsed.error) updates.errorJson = parsed.error as any;
    if (parsed.providerResponse) updates.resolvedPayload = parsed.providerResponse as any;

    const [updated] = await db
      .update(campaignStepRuns)
      .set(updates)
      .where(eq(campaignStepRuns.id, parsed.stepRunId))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('n8n step-result webhook error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

