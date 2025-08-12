import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to check if user is an admin
async function isAdmin(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  // Check if user has admin role
  // This is a simplified check - you might want to implement a more robust role system
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return false;
  }

  return profile.role === 'admin';
}

// GET - Fetch all discount codes
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const admin = await isAdmin(supabase);
    if (!admin) {
      return NextResponse.json({
        error: 'Unauthorized access'
      }, { status: 403 });
    }

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const sortBy = url.searchParams.get('sortBy') || 'created_at';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';
    const filterActive = url.searchParams.get('filterActive');
    const searchTerm = url.searchParams.get('search');
    const campaignId = url.searchParams.get('campaignId');

    // Build query
    let query = supabase
      .from('discount_codes')
      .select('*, code_redemptions(count)')
      .order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply filters
    if (filterActive === 'true') {
      query = query.eq('is_active', true);
    } else if (filterActive === 'false') {
      query = query.eq('is_active', false);
    }

    if (searchTerm) {
      query = query.ilike('code', `%${searchTerm}%`);
    }

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching discount codes:', error);
      return NextResponse.json({
        error: 'Failed to fetch discount codes'
      }, { status: 500 });
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('discount_codes')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting discount codes:', countError);
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        pageSize,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / pageSize)
      }
    });
  } catch (error) {
    console.error('Error in discount codes API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// POST - Create a new discount code
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const admin = await isAdmin(supabase);
    if (!admin) {
      return NextResponse.json({
        error: 'Unauthorized access'
      }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.code || !body.discount_type) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Check if code already exists
    const { data: existingCode, error: checkError } = await supabase
      .from('discount_codes')
      .select('id')
      .eq('code', body.code)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing code:', checkError);
      return NextResponse.json({
        error: 'Failed to check if code exists'
      }, { status: 500 });
    }

    if (existingCode) {
      return NextResponse.json({
        error: 'Discount code already exists'
      }, { status: 400 });
    }

    // Insert new discount code
    const { data, error } = await supabase
      .from('discount_codes')
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error('Error creating discount code:', error);
      return NextResponse.json({
        error: 'Failed to create discount code'
      }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: 'Discount code created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error in create discount code API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
