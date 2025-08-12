import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// Helper function to check if user is an admin
async function isAdmin(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return false;
  }

  // Check if user has admin role
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

// GET - Fetch a single discount code
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const admin = await isAdmin(supabase);
    if (!admin) {
      return NextResponse.json({
        error: 'Unauthorized access'
      }, { status: 403 });
    }

    const { id } = params;

    // Fetch the discount code
    const { data, error } = await supabase
      .from('discount_codes')
      .select(`
        *,
        code_redemptions(
          id,
          user_id,
          order_id,
          redeemed_at,
          profiles:auth.users(email, display_name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching discount code:', error);
      return NextResponse.json({
        error: 'Failed to fetch discount code'
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        error: 'Discount code not found'
      }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in get discount code API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// PATCH - Update a discount code
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const admin = await isAdmin(supabase);
    if (!admin) {
      return NextResponse.json({
        error: 'Unauthorized access'
      }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if code exists
    const { data: existingCode, error: checkError } = await supabase
      .from('discount_codes')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing code:', checkError);
      return NextResponse.json({
        error: 'Failed to check if code exists'
      }, { status: 500 });
    }

    if (!existingCode) {
      return NextResponse.json({
        error: 'Discount code not found'
      }, { status: 404 });
    }

    // Update the discount code
    const { data, error } = await supabase
      .from('discount_codes')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating discount code:', error);
      return NextResponse.json({
        error: 'Failed to update discount code'
      }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: 'Discount code updated successfully'
    });
  } catch (error) {
    console.error('Error in update discount code API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// DELETE - Delete a discount code
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const admin = await isAdmin(supabase);
    if (!admin) {
      return NextResponse.json({
        error: 'Unauthorized access'
      }, { status: 403 });
    }

    const { id } = params;

    // Check if code exists
    const { data: existingCode, error: checkError } = await supabase
      .from('discount_codes')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing code:', checkError);
      return NextResponse.json({
        error: 'Failed to check if code exists'
      }, { status: 500 });
    }

    if (!existingCode) {
      return NextResponse.json({
        error: 'Discount code not found'
      }, { status: 404 });
    }

    // Delete the discount code
    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting discount code:', error);
      return NextResponse.json({
        error: 'Failed to delete discount code'
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Discount code deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete discount code API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
