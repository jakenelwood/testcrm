/**
 * 🎯 Unified Opportunities API - Insurance Quotes & Policies
 * Uses the new unified schema for opportunity management
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, opportunities, contacts, accounts, users, type Opportunity, type NewOpportunity } from '@/lib/drizzle/db';
import { eq, and, or, ilike, desc, asc, count } from 'drizzle-orm';
import { z } from 'zod';

// Demo workspace ID (in production, this would come from authentication)
const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

// Validation schemas for opportunities
const createOpportunitySchema = z.object({
  // Required fields
  name: z.string().min(1, 'Opportunity name is required'),
  
  // Relationships (must have either contact or account)
  contactId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  
  // Pipeline stage
  stage: z.enum(['start', 'attempting_contact', 'contacted_no_interest', 'contacted_interested', 'quoted', 'quote_yes', 'quote_no_followup_ok', 'quote_no_dont_contact', 'quote_maybe', 'proposed', 'closed_won', 'closed_lost', 'paused', 'future_follow_up_date']).default('start'),
  
  // Financial details
  amount: z.number().positive().optional(),
  probability: z.number().min(0).max(100).default(50),
  closeDate: z.string().optional(), // ISO date string
  
  // Insurance specific
  insuranceTypes: z.array(z.string()).optional(), // ["auto", "home", "commercial"]
  policyTerm: z.number().positive().default(12), // months
  effectiveDate: z.string().optional(),
  expirationDate: z.string().optional(),
  
  // Premium breakdown
  premiumBreakdown: z.record(z.number()).optional(), // {"auto": 1200, "home": 800}
  coverageDetails: z.record(z.any()).optional(),
  
  // Competition
  competingCarriers: z.array(z.string()).optional(),
  currentCarrier: z.string().optional(),
  currentPremium: z.number().optional(),
  
  // AI insights
  aiWinProbability: z.number().min(0).max(100).optional(),
  aiRecommendedActions: z.array(z.string()).optional(),
  aiRiskFactors: z.array(z.string()).optional(),
  
  // Flexible data
  customFields: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  
  // Source tracking
  source: z.string().optional(),
});

const updateOpportunitySchema = createOpportunitySchema.partial();

// Query parameters
const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  stage: z.enum(['start', 'attempting_contact', 'contacted_no_interest', 'contacted_interested', 'quoted', 'quote_yes', 'quote_no_followup_ok', 'quote_no_dont_contact', 'quote_maybe', 'proposed', 'closed_won', 'closed_lost', 'paused', 'future_follow_up_date']).optional(),
  contactId: z.string().uuid().optional(),
  accountId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  insuranceType: z.string().optional(),
  sortBy: z.enum(['name', 'amount', 'probability', 'closeDate', 'createdAt', 'stageChangedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/opportunities - List opportunities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));
    
    const offset = (query.page - 1) * query.limit;
    
    // Build where conditions (always include workspace filter)
    const whereConditions = [eq(opportunities.workspaceId, DEMO_WORKSPACE_ID)];
    
    // Search across multiple fields
    if (query.search) {
      whereConditions.push(
        or(
          ilike(opportunities.name, `%${query.search}%`),
          ilike(opportunities.notes, `%${query.search}%`),
          ilike(opportunities.currentCarrier, `%${query.search}%`)
        )
      );
    }
    
    // Filter by stage
    if (query.stage) {
      whereConditions.push(eq(opportunities.stage, query.stage));
    }
    
    // Filter by contact
    if (query.contactId) {
      whereConditions.push(eq(opportunities.contactId, query.contactId));
    }
    
    // Filter by account
    if (query.accountId) {
      whereConditions.push(eq(opportunities.accountId, query.accountId));
    }
    
    // Filter by owner
    if (query.ownerId) {
      whereConditions.push(eq(opportunities.ownerId, query.ownerId));
    }
    
    // Filter by insurance type
    if (query.insuranceType) {
      // This would require a more complex query for JSONB array contains
      // For now, we'll skip this filter
    }
    
    const whereClause = and(...whereConditions);
    
    // Build order by clause
    const orderBy = query.sortOrder === 'desc' 
      ? desc(opportunities[query.sortBy])
      : asc(opportunities[query.sortBy]);
    
    // Execute query with workspace isolation and joins for related data
    const opportunitiesResult = await db
      .select({
        // Opportunity fields
        id: opportunities.id,
        workspaceId: opportunities.workspaceId,
        name: opportunities.name,
        contactId: opportunities.contactId,
        accountId: opportunities.accountId,
        stage: opportunities.stage,
        amount: opportunities.amount,
        probability: opportunities.probability,
        closeDate: opportunities.closeDate,
        insuranceTypes: opportunities.insuranceTypes,
        policyTerm: opportunities.policyTerm,
        premiumBreakdown: opportunities.premiumBreakdown,
        currentCarrier: opportunities.currentCarrier,
        currentPremium: opportunities.currentPremium,
        aiWinProbability: opportunities.aiWinProbability,
        tags: opportunities.tags,
        source: opportunities.source,
        ownerId: opportunities.ownerId,
        contactAttempts: opportunities.contactAttempts,
        maxContactAttempts: opportunities.maxContactAttempts,
        pausedUntil: opportunities.pausedUntil,
        createdAt: opportunities.createdAt,
        updatedAt: opportunities.updatedAt,
        stageChangedAt: opportunities.stageChangedAt,

        // Contact fields (for B2C opportunities)
        contactFirstName: contacts.firstName,
        contactLastName: contacts.lastName,
        contactEmail: contacts.email,

        // Account fields (for B2B opportunities)
        accountName: accounts.name,
        accountBusinessType: accounts.businessType,

        // Owner/User fields
        ownerFullName: users.fullName,
        ownerEmail: users.email,
      })
      .from(opportunities)
      .leftJoin(contacts, eq(opportunities.contactId, contacts.id))
      .leftJoin(accounts, eq(opportunities.accountId, accounts.id))
      .leftJoin(users, eq(opportunities.ownerId, users.id))
      .where(whereClause)
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(offset);
    
    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(opportunities)
      .where(whereClause);
    
    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / query.limit);

    // Transform the data to include related information
    const transformedOpportunities = opportunitiesResult.map(opp => ({
      id: opp.id,
      workspaceId: opp.workspaceId,
      name: opp.name,
      contactId: opp.contactId,
      accountId: opp.accountId,
      stage: opp.stage,
      amount: opp.amount ? Number(opp.amount) : undefined,
      probability: opp.probability,
      closeDate: opp.closeDate,
      insuranceTypes: opp.insuranceTypes,
      currentCarrier: opp.currentCarrier,
      ownerId: opp.ownerId,
      contactAttempts: opp.contactAttempts,
      maxContactAttempts: opp.maxContactAttempts,
      pausedUntil: opp.pausedUntil,
      createdAt: opp.createdAt,
      updatedAt: opp.updatedAt,

      // Related data
      contact: opp.contactId ? {
        id: opp.contactId,
        firstName: opp.contactFirstName,
        lastName: opp.contactLastName,
        email: opp.contactEmail,
      } : undefined,

      account: opp.accountId ? {
        id: opp.accountId,
        name: opp.accountName,
        accountType: opp.accountBusinessType,
      } : undefined,

      owner: opp.ownerId ? {
        id: opp.ownerId,
        fullName: opp.ownerFullName,
        email: opp.ownerEmail,
      } : undefined,
    }));

    return NextResponse.json({
      success: true,
      data: transformedOpportunities,
      pagination: {
        page: query.page,
        limit: query.limit,
        totalCount,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrev: query.page > 1,
      },
      meta: {
        schema: 'unified',
        workspace: DEMO_WORKSPACE_ID,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching opportunities:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}

// POST /api/opportunities - Create a new opportunity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createOpportunitySchema.parse(body);
    
    // Validate that either contactId or accountId is provided
    if (!validatedData.contactId && !validatedData.accountId) {
      return NextResponse.json(
        { success: false, error: 'Either contactId or accountId is required' },
        { status: 400 }
      );
    }
    
    // Prepare opportunity data for insertion
    const opportunityData: NewOpportunity = {
      ...validatedData,
      workspaceId: DEMO_WORKSPACE_ID, // Multi-tenant isolation
      // Convert number fields to strings for decimal columns
      amount: validatedData.amount ? validatedData.amount.toString() : undefined,
      currentPremium: validatedData.currentPremium ? validatedData.currentPremium.toString() : undefined,
      aiWinProbability: validatedData.aiWinProbability ? validatedData.aiWinProbability.toString() : undefined,
      // Date fields are handled as strings in the schema
      closeDate: validatedData.closeDate || undefined,
      effectiveDate: validatedData.effectiveDate || undefined,
      expirationDate: validatedData.expirationDate || undefined,
    };
    
    const result = await db.insert(opportunities).values(opportunityData).returning();
    
    return NextResponse.json({
      success: true,
      data: result[0],
      meta: {
        schema: 'unified',
        workspace: DEMO_WORKSPACE_ID,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error creating opportunity:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined,
      },
      { status: 500 }
    );
  }
}
