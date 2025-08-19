import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle/client';
import { interactions, contacts, users } from '@/lib/drizzle/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';

/**
 * GET /api/communications
 * 
 * Fetches communications with optional filtering
 * 
 * Query Parameters:
 * - lead_id: Filter communications by lead ID
 * - client_id: Filter communications by client ID
 * - type: Filter communications by type (call, email, sms, etc.)
 * - status: Filter communications by status
 * - limit: Maximum number of communications to return (default: 50)
 * - offset: Number of communications to skip for pagination (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const filters = {
      lead_id: searchParams.get('lead_id') || undefined,
      client_id: searchParams.get('client_id') || undefined,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    console.log('🔍 GET /api/communications - Filters:', filters);

    // Build the query
    let query = db
      .select({
        id: communications.id,
        type: communications.type,
        direction: communications.direction,
        status: communications.status,
        subject: communications.subject,
        content: communications.content,
        duration: communications.duration,
        ai_summary: communications.ai_summary,
        ai_sentiment: communications.ai_sentiment,
        created_at: communications.created_at,
        completed_at: communications.completed_at,
        lead_id: communications.lead_id,
        client_id: communications.client_id,
        // Include related data
        lead_name: sql<string>`CONCAT(${leads.first_name}, ' ', ${leads.last_name})`,
        client_name: clients.name,
        created_by_name: users.full_name,
      })
      .from(communications)
      .leftJoin(leads, eq(communications.lead_id, leads.id))
      .leftJoin(clients, eq(communications.client_id, clients.id))
      .leftJoin(users, eq(communications.created_by, users.id))
      .orderBy(desc(communications.created_at))
      .limit(filters.limit)
      .offset(filters.offset);

    // Apply filters
    const conditions = [];
    
    if (filters.lead_id) {
      conditions.push(eq(communications.lead_id, filters.lead_id));
    }
    
    if (filters.client_id) {
      conditions.push(eq(communications.client_id, filters.client_id));
    }
    
    if (filters.type) {
      conditions.push(eq(communications.type, filters.type));
    }
    
    if (filters.status) {
      conditions.push(eq(communications.status, filters.status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query;

    console.log(`✅ GET /api/communications - Found ${result.length} communications`);

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
      filters: filters
    });

  } catch (error) {
    console.error('❌ GET /api/communications - Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch communications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/communications
 * 
 * Creates a new communication record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📝 POST /api/communications - Creating communication:', {
      type: body.type,
      direction: body.direction,
      status: body.status,
      lead_id: body.lead_id,
      client_id: body.client_id
    });

    // Validate required fields
    if (!body.type) {
      return NextResponse.json(
        { success: false, error: 'Type is required' },
        { status: 400 }
      );
    }

    if (!body.direction) {
      return NextResponse.json(
        { success: false, error: 'Direction is required' },
        { status: 400 }
      );
    }

    if (!body.lead_id && !body.client_id) {
      return NextResponse.json(
        { success: false, error: 'Either lead_id or client_id is required' },
        { status: 400 }
      );
    }

    // Create the communication
    const newCommunication = await db
      .insert(communications)
      .values({
        type: body.type,
        direction: body.direction,
        status: body.status || 'Pending',
        subject: body.subject,
        content: body.content,
        duration: body.duration,
        lead_id: body.lead_id,
        client_id: body.client_id,
        campaign_id: body.campaign_id,
        content_template_id: body.content_template_id,
        ai_summary: body.ai_summary,
        ai_sentiment: body.ai_sentiment,
        metadata: body.metadata || {},
        scheduled_at: body.scheduled_at,
        completed_at: body.completed_at,
      })
      .returning();

    console.log('✅ POST /api/communications - Communication created:', newCommunication[0].id);

    return NextResponse.json({
      success: true,
      data: newCommunication[0]
    }, { status: 201 });

  } catch (error) {
    console.error('❌ POST /api/communications - Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create communication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
