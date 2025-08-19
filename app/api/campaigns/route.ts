/**
 * 📣 Campaigns API (MVP)
 * GET: list campaigns in current workspace
 * POST: create a campaign (draft by default)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, campaigns } from '@/lib/drizzle/db';
import { and, eq, ilike, desc, asc, count } from 'drizzle-orm';

// Demo workspace scoping (replace with auth-derived workspace in production)
const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

const CampaignStatusEnum = z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']);
const CampaignTypeEnum = z.enum(['email', 'sms', 'phone', 'social', 'direct_mail', 'multi_channel', 'ai_automated', 'ai_nurture', 'on_hold', 'reengagement']);
const CampaignObjectiveEnum = z.enum(['lead_generation', 'nurture', 'conversion', 'retention', 'winback', 'ai_qualification', 'ai_nurture', 'hold_management', 'reengagement']);

const listQuerySchema = z.object({
  id: z.string().uuid().optional(),
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  status: CampaignStatusEnum.optional(),
  campaignType: CampaignTypeEnum.optional(),
  sortBy: z.enum(['createdAt', 'name', 'startDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  campaignType: CampaignTypeEnum.default('multi_channel'),
  objective: CampaignObjectiveEnum.optional(),
  description: z.string().optional(),
  status: CampaignStatusEnum.default('draft'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));

    const where = [eq(campaigns.workspaceId, DEMO_WORKSPACE_ID)];
    if (query.id) where.push(eq(campaigns.id, query.id));
    if (query.search) where.push(ilike(campaigns.name, `%${query.search}%`));
    if (query.status) where.push(eq(campaigns.status, query.status));
    if (query.campaignType) where.push(eq(campaigns.campaignType, query.campaignType));

    const orderBy = query.sortOrder === 'desc'
      ? desc(campaigns[query.sortBy])
      : asc(campaigns[query.sortBy]);

    const offset = (query.page - 1) * query.limit;

    const rows = await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        status: campaigns.status,
        campaignType: campaigns.campaignType,
        objective: campaigns.objective,
        totalTargeted: campaigns.totalTargeted,
        totalSent: campaigns.totalSent,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
      })
      .from(campaigns)
      .where(and(...where))
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(offset);

    const totalCountResult = await db.select({ count: count() }).from(campaigns).where(and(...where));
    const totalCount = totalCountResult[0]?.count || 0;

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / query.limit),
      },
    });
  } catch (error) {
    console.error('Error listing campaigns:', error);
    return NextResponse.json({ success: false, error: 'Failed to list campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const body = createCampaignSchema.parse(json);

    const [created] = await db.insert(campaigns).values({
      name: body.name,
      workspaceId: DEMO_WORKSPACE_ID,
      campaignType: body.campaignType,
      objective: body.objective,
      description: body.description,
      status: body.status,
      startDate: body.startDate as any,
      endDate: body.endDate as any,
    }).returning();

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating campaign:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

