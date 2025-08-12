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

// Helper function to generate a random code
function generateRandomCode(length = 8, prefix = '') {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters
  let result = '';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return prefix ? `${prefix}${result}` : result;
}

// POST - Generate discount codes
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
    const {
      count = 1,
      prefix = '',
      codeLength = 8,
      discount_type = 'percentage',
      discount_percent = 10,
      discount_amount = null,
      max_uses = null,
      expires_at = null,
      is_active = true,
      is_one_time_use = false,
      campaign_id = null,
      min_purchase_amount = null,
      applicable_plan = null,
      description = 'Generated code'
    } = body;

    // Validate input
    if (count < 1 || count > 100) {
      return NextResponse.json({
        error: 'Count must be between 1 and 100'
      }, { status: 400 });
    }

    if (codeLength < 4 || codeLength > 20) {
      return NextResponse.json({
        error: 'Code length must be between 4 and 20'
      }, { status: 400 });
    }

    // Generate codes
    const codes: string[] = [];
    const codesToInsert: any[] = [];

    for (let i = 0; i < count; i++) {
      let code;
      let isUnique = false;
      let attempts = 0;

      // Try to generate a unique code (max 10 attempts)
      while (!isUnique && attempts < 10) {
        code = generateRandomCode(codeLength, prefix);

        // Check if code already exists in our generated list
        if (!codes.includes(code)) {
          // Check if code exists in database
          const { data, error } = await supabase
            .from('discount_codes')
            .select('id')
            .eq('code', code)
            .maybeSingle();

          if (error) {
            console.error('Error checking code uniqueness:', error);
            return NextResponse.json({
              error: 'Failed to check code uniqueness'
            }, { status: 500 });
          }

          if (!data) {
            isUnique = true;
            codes.push(code);

            codesToInsert.push({
              code,
              discount_type,
              discount_percent: discount_type === 'percentage' ? discount_percent : null,
              discount_amount: discount_type === 'fixed_amount' ? discount_amount : null,
              max_uses,
              expires_at,
              is_active,
              is_one_time_use,
              campaign_id,
              min_purchase_amount,
              applicable_plan,
              description: `${description} (${campaign_id || 'No campaign'})`
            });
          }
        }

        attempts++;
      }

      if (!isUnique) {
        return NextResponse.json({
          error: 'Failed to generate unique codes after multiple attempts'
        }, { status: 500 });
      }
    }

    // Insert codes into database
    const { data, error } = await supabase
      .from('discount_codes')
      .insert(codesToInsert)
      .select();

    if (error) {
      console.error('Error inserting generated codes:', error);
      return NextResponse.json({
        error: 'Failed to insert generated codes'
      }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: `Successfully generated ${count} discount code(s)`
    }, { status: 201 });
  } catch (error) {
    console.error('Error in generate discount codes API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
