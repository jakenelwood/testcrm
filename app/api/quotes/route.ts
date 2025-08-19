import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle/db';
import { opportunities, contacts, users } from '@/lib/drizzle/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

/**
 * GET /api/quotes
 * 
 * Fetches quotes with optional filtering
 * 
 * Query Parameters:
 * - lead_id: Filter quotes by lead ID
 * - status: Filter quotes by status (Draft, Pending, Approved, etc.)
 * - insurance_type_id: Filter quotes by insurance type
 * - limit: Maximum number of quotes to return (default: 50)
 * - offset: Number of quotes to skip for pagination (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const filters = {
      lead_id: searchParams.get('lead_id') || undefined,
      status: searchParams.get('status') || undefined,
      insurance_type_id: searchParams.get('insurance_type_id') ? parseInt(searchParams.get('insurance_type_id')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    console.log('🔍 GET /api/quotes - Filters:', filters);

    // Build the query
    let query = db
      .select({
        id: quotes.id,
        quote_number: quotes.quote_number,
        status: quotes.status,
        premium_amount: quotes.premium_amount,
        deductible: quotes.deductible,
        coverage_limits: quotes.coverage_limits,
        contract_term: quotes.contract_term,
        effective_date: quotes.effective_date,
        expiration_date: quotes.expiration_date,
        created_at: quotes.created_at,
        updated_at: quotes.updated_at,
        lead_id: quotes.lead_id,
        insurance_type_id: quotes.insurance_type_id,
        // Include related data
        lead_name: sql<string>`CONCAT(${leads.first_name}, ' ', ${leads.last_name})`,
        insurance_type_name: insurance_types.name,
        created_by_name: users.full_name,
      })
      .from(quotes)
      .leftJoin(leads, eq(quotes.lead_id, leads.id))
      .leftJoin(insurance_types, eq(quotes.insurance_type_id, insurance_types.id))
      .leftJoin(users, eq(quotes.created_by, users.id))
      .orderBy(desc(quotes.created_at))
      .limit(filters.limit)
      .offset(filters.offset);

    // Apply filters
    const conditions = [];
    
    if (filters.lead_id) {
      conditions.push(eq(quotes.lead_id, filters.lead_id));
    }
    
    if (filters.status) {
      conditions.push(eq(quotes.status, filters.status));
    }
    
    if (filters.insurance_type_id) {
      conditions.push(eq(quotes.insurance_type_id, filters.insurance_type_id));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query;

    console.log(`✅ GET /api/quotes - Found ${result.length} quotes`);

    return NextResponse.json({
      success: true,
      data: result,
      count: result.length,
      filters: filters
    });

  } catch (error) {
    console.error('❌ GET /api/quotes - Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch quotes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/quotes
 * 
 * Creates a new quote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📝 POST /api/quotes - Creating quote:', {
      lead_id: body.lead_id,
      insurance_type_id: body.insurance_type_id,
      status: body.status,
      premium_amount: body.premium_amount
    });

    // Validate required fields
    if (!body.lead_id) {
      return NextResponse.json(
        { success: false, error: 'Lead ID is required' },
        { status: 400 }
      );
    }

    if (!body.insurance_type_id) {
      return NextResponse.json(
        { success: false, error: 'Insurance type ID is required' },
        { status: 400 }
      );
    }

    if (!body.premium_amount) {
      return NextResponse.json(
        { success: false, error: 'Premium amount is required' },
        { status: 400 }
      );
    }

    // Generate quote number if not provided
    const quote_number = body.quote_number || `Q-${Date.now()}`;

    // Create the quote
    const newQuote = await db
      .insert(quotes)
      .values({
        quote_number,
        lead_id: body.lead_id,
        insurance_type_id: body.insurance_type_id,
        status: body.status || 'Draft',
        premium_amount: body.premium_amount,
        deductible: body.deductible,
        coverage_limits: body.coverage_limits || {},
        contract_term: body.contract_term,
        effective_date: body.effective_date,
        expiration_date: body.expiration_date,
        notes: body.notes,
        ai_risk_assessment: body.ai_risk_assessment || {},
        ai_pricing_factors: body.ai_pricing_factors || {},
        ai_recommendations: body.ai_recommendations || {},
        metadata: body.metadata || {},
      })
      .returning();

    console.log('✅ POST /api/quotes - Quote created:', newQuote[0].id);

    return NextResponse.json({
      success: true,
      data: newQuote[0]
    }, { status: 201 });

  } catch (error) {
    console.error('❌ POST /api/quotes - Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create quote',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
