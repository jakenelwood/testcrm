import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/utils/supabase/server';

// POST - Create a new address
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpwvdfrxvvuxojejnegm.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd3ZkZnJ4dnZ1eG9qZWpuZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTcxOTIsImV4cCI6MjA2MTQ3MzE5Mn0.hyIFaAyppndjilhPXaaWf7GJoOsJfRRDp7LubigyB3Q',
      {
        cookies: {
          get: (name: string) => {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set: (name: string, value: string, options: any) => {
            cookieStore.set({ name, value, ...options });
          },
          remove: (name: string, options: any) => {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const body = await request.json();

    // Validate required fields
    if (!body.street && !body.city && !body.state && !body.zip_code) {
      return NextResponse.json({
        error: 'At least one address field is required'
      }, { status: 400 });
    }

    // Insert new address
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        street: body.street || null,
        city: body.city || null,
        state: body.state || null,
        zip_code: body.zip_code || null,
        type: body.type || 'Physical',
        is_verified: body.is_verified || false,
        geocode_lat: body.geocode_lat || null,
        geocode_lng: body.geocode_lng || null,
        metadata: body.metadata || null,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating address:', error);
      return NextResponse.json({
        error: 'Failed to create address'
      }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: 'Address created successfully'
    });
  } catch (error) {
    console.error('Error in create address API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}

// PATCH - Update an existing address
export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vpwvdfrxvvuxojejnegm.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwd3ZkZnJ4dnZ1eG9qZWpuZWdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTcxOTIsImV4cCI6MjA2MTQ3MzE5Mn0.hyIFaAyppndjilhPXaaWf7GJoOsJfRRDp7LubigyB3Q',
      {
        cookies: {
          get: (name: string) => {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set: (name: string, value: string, options: any) => {
            cookieStore.set({ name, value, ...options });
          },
          remove: (name: string, options: any) => {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const body = await request.json();

    // Validate required fields
    if (!body.id) {
      return NextResponse.json({
        error: 'Address ID is required'
      }, { status: 400 });
    }

    // Update the address
    const { data, error } = await supabase
      .from('addresses')
      .update({
        street: body.street,
        city: body.city,
        state: body.state,
        zip_code: body.zip_code,
        type: body.type,
        is_verified: body.is_verified,
        geocode_lat: body.geocode_lat,
        geocode_lng: body.geocode_lng,
        metadata: body.metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating address:', error);
      return NextResponse.json({
        error: 'Failed to update address'
      }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('Error in update address API:', error);
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}
