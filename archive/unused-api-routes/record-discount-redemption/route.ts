import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { discount_code_id, order_id } = await request.json();

    if (!discount_code_id) {
      return NextResponse.json({
        success: false,
        message: 'No discount code ID provided'
      }, { status: 400 });
    }

    // Create a direct Supabase client
    // For this endpoint, we'll use a simpler approach without authentication
    // In a production app, you might want to implement proper auth checks
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpwvdfrxvvuxojejnegm.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd3ZkZnJ4dnZ1eG9qZWpuZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTcxOTIsImV4cCI6MjA2MTQ3MzE5Mn0.hyIFaAyppndjilhPXaaWf7GJoOsJfRRDp7LubigyB3Q'
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({
        success: false,
        message: 'User not authenticated'
      }, { status: 401 });
    }

    // Record the redemption
    const { error: redemptionError } = await supabase
      .from('code_redemptions')
      .insert({
        discount_code_id,
        user_id: user.id,
        order_id
      });

    if (redemptionError) {
      console.error('Error recording redemption:', redemptionError);
      return NextResponse.json({
        success: false,
        message: 'Failed to record discount code redemption'
      }, { status: 500 });
    }

    // Increment the usage count
    const { error: updateError } = await supabase
      .rpc('increment_code_usage', { code_id: discount_code_id });

    if (updateError) {
      console.error('Error updating usage count:', updateError);
      // We still consider this a success since the redemption was recorded
    }

    return NextResponse.json({
      success: true,
      message: 'Discount code redemption recorded successfully'
    });
  } catch (error) {
    console.error('Error recording discount code redemption:', error);
    return NextResponse.json({
      success: false,
      message: 'An error occurred while recording the discount code redemption'
    }, { status: 500 });
  }
}
