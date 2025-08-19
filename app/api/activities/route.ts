import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle/db';
import { interactions, contacts, opportunities } from '@/lib/drizzle/schema';
import { eq, and, or, ilike, desc, asc, count, gte, lte, ne } from 'drizzle-orm';
import { z } from 'zod';

// Validation schemas
const createActivitySchema = z.object({
  contactId: z.string().uuid('Contact ID is required'),
  opportunityId: z.string().uuid().optional(),
  type: z.enum(['call', 'email', 'sms', 'meeting', 'note', 'voicemail', 'social', 'letter']),
  direction: z.enum(['inbound', 'outbound']).optional(),
  subject: z.string().optional(),
  content: z.string().optional(),
  duration: z.number().positive().optional(), // in seconds
  callQualityScore: z.number().min(1).max(5).optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).default('completed'),
  scheduledAt: z.string().optional(),
  completedAt: z.string().optional(),
  aiSummary: z.string().optional(),
  aiSentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  aiInsights: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateActivitySchema = createActivitySchema.partial().omit({ contactId: true });

const querySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
  search: z.string().optional(),
  contactId: z.string().uuid().optional(),
  opportunityId: z.string().uuid().optional(),
  type: z.enum(['call', 'email', 'sms', 'meeting', 'note', 'voicemail', 'social', 'letter']).optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  status: z.enum(['pending', 'completed', 'failed', 'cancelled']).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
  sortBy: z.enum(['createdAt', 'completedAt', 'scheduledAt', 'type']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeRelations: z.string().transform(Boolean).default('false'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  overdue: z.string().transform(Boolean).optional(),
});

// GET /api/activities - List activities with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));
    
    const offset = (query.page - 1) * query.limit;
    
    // Build where conditions
    const whereConditions = [];
    
    if (query.search) {
      whereConditions.push(
        or(
          ilike(activities.subject, `%${query.search}%`),
          ilike(activities.content, `%${query.search}%`)
        )
      );
    }
    
    if (query.contactId) {
      whereConditions.push(eq(activities.contactId, query.contactId));
    }
    
    if (query.opportunityId) {
      whereConditions.push(eq(activities.opportunityId, query.opportunityId));
    }
    
    if (query.type) {
      whereConditions.push(eq(activities.type, query.type));
    }
    
    if (query.direction) {
      whereConditions.push(eq(activities.direction, query.direction));
    }
    
    if (query.status) {
      whereConditions.push(eq(activities.status, query.status));
    }
    
    if (query.sentiment) {
      whereConditions.push(eq(activities.aiSentiment, query.sentiment));
    }
    
    if (query.dateFrom) {
      whereConditions.push(gte(activities.createdAt, new Date(query.dateFrom)));
    }
    
    if (query.dateTo) {
      whereConditions.push(lte(activities.createdAt, new Date(query.dateTo)));
    }
    
    // Handle overdue filter (for pending activities)
    if (query.overdue) {
      whereConditions.push(
        and(
          eq(activities.status, 'pending'),
          lte(activities.scheduledAt, new Date())
        )
      );
    }
    
    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
    
    // Build order by
    const orderBy = query.sortOrder === 'desc' 
      ? desc(activities[query.sortBy])
      : asc(activities[query.sortBy]);
    
    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(activities)
      .where(whereClause);
    
    const total = totalResult.count;
    
    // Get activities
    let activitiesQuery;
    
    if (query.includeRelations) {
      activitiesQuery = db.query.activities.findMany({
        where: whereClause,
        orderBy: [orderBy],
        limit: query.limit,
        offset: offset,
        with: {
          contact: {
            columns: { id: true, name: true, email: true, status: true }
          },
          opportunity: {
            columns: { id: true, name: true, status: true, value: true }
          },
          creator: {
            columns: { id: true, fullName: true, email: true }
          }
        }
      });
    } else {
      activitiesQuery = db
        .select()
        .from(activities)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(query.limit)
        .offset(offset);
    }
    
    const activitiesData = await activitiesQuery;
    
    // Get activity type summary
    const typeSummary = await db
      .select({
        type: activities.type,
        count: count(),
      })
      .from(activities)
      .where(whereClause)
      .groupBy(activities.type);
    
    // Get sentiment summary
    const sentimentSummary = await db
      .select({
        sentiment: activities.aiSentiment,
        count: count(),
      })
      .from(activities)
      .where(
        and(
          whereClause,
          ne(activities.aiSentiment, null)
        )
      )
      .groupBy(activities.aiSentiment);
    
    return NextResponse.json({
      success: true,
      data: activitiesData,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      summary: {
        byType: typeSummary,
        bySentiment: sentimentSummary,
        totalDuration: activitiesData
          .filter(a => a.duration)
          .reduce((sum, a) => sum + (a.duration || 0), 0),
      },
    });
    
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch activities' 
      },
      { status: 500 }
    );
  }
}

// POST /api/activities - Create a new activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createActivitySchema.parse(body);
    
    // Verify contact exists
    const contact = await db.query.contacts.findFirst({
      where: eq(contacts.id, validatedData.contactId),
      columns: { id: true, name: true }
    });
    
    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    // Verify opportunity exists if provided
    if (validatedData.opportunityId) {
      const opportunity = await db.query.opportunities.findFirst({
        where: eq(opportunities.id, validatedData.opportunityId),
        columns: { id: true, name: true }
      });
      
      if (!opportunity) {
        return NextResponse.json(
          { success: false, error: 'Opportunity not found' },
          { status: 404 }
        );
      }
    }
    
    // Prepare activity data
    const activityData: NewActivity = {
      ...validatedData,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
      completedAt: validatedData.completedAt ? new Date(validatedData.completedAt) : 
                   validatedData.status === 'completed' ? new Date() : undefined,
      createdBy: 'system', // TODO: Get from auth context
    };
    
    const [newActivity] = await db
      .insert(activities)
      .values(activityData)
      .returning();
    
    // Update contact's last contact time if activity is completed
    if (newActivity.status === 'completed') {
      await db
        .update(contacts)
        .set({ 
          lastContactAt: newActivity.completedAt || newActivity.createdAt,
          updatedAt: new Date(),
        })
        .where(eq(contacts.id, validatedData.contactId));
    }
    
    // Get the created activity with relations
    const activityWithRelations = await db.query.activities.findFirst({
      where: eq(activities.id, newActivity.id),
      with: {
        contact: {
          columns: { id: true, name: true, email: true }
        },
        opportunity: {
          columns: { id: true, name: true }
        },
        creator: {
          columns: { id: true, fullName: true }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      data: activityWithRelations,
      message: 'Activity created successfully',
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating activity:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation error',
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create activity' 
      },
      { status: 500 }
    );
  }
}
