import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Example API route showing how to use Drizzle alongside Supabase
 * 
 * This demonstrates:
 * 1. Using Supabase for authentication
 * 2. Using Drizzle for type-safe database queries
 * 3. How both can work together seamlessly
 */

export async function GET(request: NextRequest) {
  try {
    // 1. Use Supabase for authentication (existing pattern)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Use Drizzle for type-safe database queries (new pattern)
    // Note: This will work once you've set up DATABASE_URL and generated schemas
    
    try {
      // Dynamic import to handle cases where DATABASE_URL might not be set yet
      const { db } = await import('@/lib/drizzle/client');
      
      // Example: Get user count using Drizzle
      const userCountResult = await db.execute('SELECT COUNT(*) as count FROM users');
      const userCount = userCountResult.rows[0]?.count || 0;

      // Example: Get recent leads using Drizzle (once schema is generated)
      // const { leads } = await import('@/lib/drizzle/schema');
      // const recentLeads = await db
      //   .select()
      //   .from(leads)
      //   .orderBy(desc(leads.createdAt))
      //   .limit(10);

      return NextResponse.json({
        message: 'Drizzle + Supabase working together!',
        user: {
          id: user.id,
          email: user.email,
        },
        stats: {
          userCount: userCount,
          // recentLeadsCount: recentLeads.length,
        },
        timestamp: new Date().toISOString(),
      });

    } catch (drizzleError) {
      console.error('Drizzle error:', drizzleError);
      
      // Fallback to Supabase client if Drizzle isn't set up yet
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      return NextResponse.json({
        message: 'Using Supabase fallback (Drizzle not configured yet)',
        user: {
          id: user.id,
          email: user.email,
        },
        note: 'Set up DATABASE_URL and run "npm run db:generate-schema" to enable Drizzle',
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Example: Create a new lead using Drizzle (once schema is generated)
    try {
      const { db } = await import('@/lib/drizzle/client');
      
      // This would work once you have the schema generated:
      // const { leads } = await import('@/lib/drizzle/schema');
      // const newLead = await db
      //   .insert(leads)
      //   .values({
      //     firstName: body.firstName,
      //     lastName: body.lastName,
      //     email: body.email,
      //     phone: body.phone,
      //     assignedTo: user.id,
      //     createdAt: new Date(),
      //   })
      //   .returning();

      return NextResponse.json({
        message: 'Lead would be created with Drizzle',
        data: body,
        note: 'Generate schema files to enable this functionality',
      });

    } catch (drizzleError) {
      // Fallback to Supabase client
      const { data: newLead, error: insertError } = await supabase
        .from('leads')
        .insert({
          first_name: body.firstName,
          last_name: body.lastName,
          email: body.email,
          phone: body.phone,
          assigned_to: user.id,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return NextResponse.json({
        message: 'Lead created using Supabase fallback',
        data: newLead,
      });
    }

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
