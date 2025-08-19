/**
 * 🚀 Unified Contacts API - Refactored for AI-Native Schema
 * Uses the new unified schema as the source of truth
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, contacts, type Contact, type NewContact } from '@/lib/drizzle/db';
import { eq, and, or, ilike, desc, asc, count } from 'drizzle-orm';
import { z } from 'zod';

// Demo workspace ID (in production, this would come from authentication)
const DEMO_WORKSPACE_ID = '550e8400-e29b-41d4-a716-446655440000';

// Validation schemas aligned with unified schema
const createContactSchema = z.object({
  // Required fields
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  
  // Contact information
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  mobilePhone: z.string().optional(),
  
  // Lifecycle management (unified model)
  lifecycleStage: z.enum(['lead', 'opportunity_contact', 'customer', 'churned']).default('lead'),
  
  // Address fields
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  
  // Personal details (for individual insurance)
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  maritalStatus: z.string().optional(),
  occupation: z.string().optional(),
  
  // Business context (for B2B)
  jobTitle: z.string().optional(),
  department: z.string().optional(),
  accountId: z.string().uuid().optional(), // Links to accounts table for B2B
  
  // Insurance specific fields
  driversLicense: z.string().optional(),
  licenseState: z.string().optional(),
  ssnLastFour: z.string().optional(),
  
  // CRM tracking
  leadSource: z.string().optional(),
  referredBy: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
  
  // Communication preferences
  preferredContactMethod: z.enum(['email', 'phone', 'sms', 'mail']).default('email'),
  communicationPreferences: z.record(z.any()).optional(),
  
  // Contact scheduling
  lastContactAt: z.string().optional(),
  nextContactAt: z.string().optional(),
  
  // AI fields (for future AI features)
  aiRiskScore: z.number().min(0).max(100).optional(),
  aiLifetimeValue: z.number().optional(),
  aiChurnProbability: z.number().min(0).max(100).optional(),
  aiInsights: z.record(z.any()).optional(),
});

const updateContactSchema = createContactSchema.partial();

// Query parameters for filtering and pagination
const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  lifecycleStage: z.enum(['lead', 'opportunity_contact', 'customer', 'churned']).optional(),
  accountId: z.string().uuid().optional(), // Filter by account for B2B
  ownerId: z.string().uuid().optional(), // Filter by owner
  sortBy: z.enum(['firstName', 'lastName', 'createdAt', 'updatedAt', 'lastContactAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// GET /api/contacts - List contacts with unified schema
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));
    
    const offset = (query.page - 1) * query.limit;
    
    // Build where conditions (always include workspace filter)
    const whereConditions = [eq(contacts.workspaceId, DEMO_WORKSPACE_ID)];
    
    // Search across multiple fields
    if (query.search) {
      whereConditions.push(
        or(
          ilike(contacts.firstName, `%${query.search}%`),
          ilike(contacts.lastName, `%${query.search}%`),
          ilike(contacts.email, `%${query.search}%`),
          ilike(contacts.phone, `%${query.search}%`),
          ilike(contacts.occupation, `%${query.search}%`),
          ilike(contacts.jobTitle, `%${query.search}%`)
        )
      );
    }
    
    // Filter by lifecycle stage
    if (query.lifecycleStage) {
      whereConditions.push(eq(contacts.lifecycleStage, query.lifecycleStage));
    }
    
    // Filter by account (B2B relationships)
    if (query.accountId) {
      whereConditions.push(eq(contacts.accountId, query.accountId));
    }
    
    // Filter by owner
    if (query.ownerId) {
      whereConditions.push(eq(contacts.ownerId, query.ownerId));
    }
    
    const whereClause = and(...whereConditions);
    
    // Build order by clause
    const orderBy = query.sortOrder === 'desc' 
      ? desc(contacts[query.sortBy])
      : asc(contacts[query.sortBy]);
    
    // Execute query with workspace isolation
    const contactsResult = await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        email: contacts.email,
        phone: contacts.phone,
        mobilePhone: contacts.mobilePhone,
        lifecycleStage: contacts.lifecycleStage,
        jobTitle: contacts.jobTitle,
        occupation: contacts.occupation,
        accountId: contacts.accountId,
        ownerId: contacts.ownerId,
        leadSource: contacts.leadSource,
        tags: contacts.tags,
        lastContactAt: contacts.lastContactAt,
        nextContactAt: contacts.nextContactAt,
        createdAt: contacts.createdAt,
        updatedAt: contacts.updatedAt,
      })
      .from(contacts)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(query.limit)
      .offset(offset);
    
    // Get total count for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(contacts)
      .where(whereClause);
    
    const totalCount = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / query.limit);
    
    return NextResponse.json({
      success: true,
      data: contactsResult,
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
    console.error('❌ Error fetching contacts:', error);
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

// POST /api/contacts - Create a new contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createContactSchema.parse(body);
    
    // Prepare contact data for insertion
    const contactData: NewContact = {
      ...validatedData,
      workspaceId: DEMO_WORKSPACE_ID, // Multi-tenant isolation
      // Convert date strings to Date objects if provided
      dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : undefined,
      lastContactAt: validatedData.lastContactAt ? new Date(validatedData.lastContactAt) : undefined,
      nextContactAt: validatedData.nextContactAt ? new Date(validatedData.nextContactAt) : undefined,
    };
    
    const result = await db.insert(contacts).values(contactData).returning();
    
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
    console.error('❌ Error creating contact:', error);
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

// PUT /api/contacts - Update multiple contacts (batch operation)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { contactIds, updates } = body;
    
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'contactIds array is required' },
        { status: 400 }
      );
    }
    
    const validatedUpdates = updateContactSchema.parse(updates);
    
    const result = await db
      .update(contacts)
      .set({
        ...validatedUpdates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(contacts.workspaceId, DEMO_WORKSPACE_ID),
          or(...contactIds.map(id => eq(contacts.id, id)))
        )
      )
      .returning();
    
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        updated: result.length,
        schema: 'unified',
        workspace: DEMO_WORKSPACE_ID,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ Error updating contacts:', error);
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
