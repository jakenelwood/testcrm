import { NextRequest, NextResponse } from 'next/server';
import { db, accounts as accountsTable } from '@/lib/drizzle/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

const updateAccountSchema = z.object({
  name: z.string().optional(),
  website: z.string().optional(),
  industry: z.string().optional(),
  employeeCount: z.coerce.number().optional(),
  annualRevenue: z.coerce.number().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  businessType: z.string().optional(),
  taxId: z.string().optional(),
  dunsNumber: z.string().optional(),
  commercialPremium: z.coerce.number().optional(),
});

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const data = updateAccountSchema.parse(body);

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.website !== undefined) updates.website = data.website;
    if (data.industry !== undefined) updates.industry = data.industry;
    if (data.employeeCount !== undefined) updates.employeeCount = data.employeeCount;
    if (data.annualRevenue !== undefined) updates.annualRevenue = data.annualRevenue.toString();
    if (data.address !== undefined) updates.address = data.address;
    if (data.city !== undefined) updates.city = data.city;
    if (data.state !== undefined) updates.state = data.state;
    if (data.zipCode !== undefined) updates.zipCode = data.zipCode;
    if (data.businessType !== undefined) updates.businessType = data.businessType;
    if (data.taxId !== undefined) updates.taxId = data.taxId;
    if (data.dunsNumber !== undefined) updates.dunsNumber = data.dunsNumber;
    if (data.commercialPremium !== undefined) updates.commercialPremium = data.commercialPremium.toString();

    const [updated] = await db
      .update(accountsTable)
      .set(updates)
      .where(and(eq(accountsTable.id, id), eq(accountsTable.workspaceId, DEMO_WORKSPACE_ID)))
      .returning();

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}

