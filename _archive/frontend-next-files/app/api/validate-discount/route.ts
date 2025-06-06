import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({
        valid: false,
        message: 'No discount code provided'
      }, { status: 400 });
    }

    // Create a direct Supabase client without cookies
    // This is fine for discount code validation as we don't need authentication
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpwvdfrxvvuxojejnegm.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd3ZkZnJ4dnZ1eG9qZWpuZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTcxOTIsImV4cCI6MjA2MTQ3MzE5Mn0.hyIFaAyppndjilhPXaaWf7GJoOsJfRRDp7LubigyB3Q'
    );

    // Query the database for the code - use case-insensitive comparison
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .ilike('code', code) // Use ilike for case-insensitive matching
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json({
        valid: false,
        message: 'Invalid discount code'
      }, { status: 400 });
    }

    // Check if code has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        message: 'Discount code has expired'
      }, { status: 400 });
    }

    // Check if code has reached max uses
    if (data.max_uses && data.current_uses >= data.max_uses) {
      return NextResponse.json({
        valid: false,
        message: 'Discount code has reached maximum uses'
      }, { status: 400 });
    }

    // Allow dev codes only in development environment
    if (process.env.NODE_ENV === 'production' && data.description?.includes('development only')) {
      return NextResponse.json({
        valid: false,
        message: 'This discount code is not valid in production'
      }, { status: 400 });
    }

    // Calculate discount based on type
    let discountPercent = 0;
    let discountMessage = '';

    if (data.discount_type === 'percentage') {
      discountPercent = data.discount_percent;
      discountMessage = `${data.discount_percent}% discount`;
    } else if (data.discount_type === 'fixed_amount') {
      // For fixed amount, we'll convert to percentage in the frontend
      // Just pass the amount and let the frontend handle it
      discountPercent = 100; // Temporary - frontend will calculate actual percentage
      discountMessage = `$${data.discount_amount.toFixed(2)} discount`;
    } else if (data.discount_type === 'free_trial') {
      discountPercent = 100;
      discountMessage = 'Free trial';
    }

    return NextResponse.json({
      valid: true,
      discount_percent: discountPercent,
      discount_type: data.discount_type,
      discount_amount: data.discount_amount,
      code_id: data.id,
      message: 'Discount code applied successfully',
      discount_message: discountMessage
    });
  } catch (error) {
    console.error('Error validating discount code:', error);
    return NextResponse.json({
      valid: false,
      message: 'An error occurred while validating the discount code'
    }, { status: 500 });
  }
}
