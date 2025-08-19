#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function testAnonAccess() {
  try {
    console.log('🔍 Testing anonymous vs service role access...\n');

    // Test with anon key (like the client-side code)
    console.log('1. Testing with anonymous key...');
    const anonClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: anonData, error: anonError } = await anonClient
      .from('leads')
      .select('*')
      .limit(1);

    if (anonError) {
      console.error('❌ Anonymous access error:', anonError);
    } else {
      console.log('✅ Anonymous access works! Found', anonData?.length, 'leads');
    }

    // Test with service role key
    console.log('\n2. Testing with service role key...');
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('leads')
      .select('*')
      .limit(1);

    if (serviceError) {
      console.error('❌ Service role access error:', serviceError);
    } else {
      console.log('✅ Service role access works! Found', serviceData?.length, 'leads');
    }

    // Test the join query with anon key
    console.log('\n3. Testing join query with anonymous key...');
    const { data: anonJoinData, error: anonJoinError } = await anonClient
      .from('leads')
      .select(`
        *,
        lead_status:lead_statuses!lead_status_id(value),
        insurance_type:insurance_types!insurance_type_id(name)
      `)
      .limit(1);

    if (anonJoinError) {
      console.error('❌ Anonymous join query error:', anonJoinError);
    } else {
      console.log('✅ Anonymous join query works! Found', anonJoinData?.length, 'leads');
    }

    // Test if RLS is enabled
    console.log('\n4. Checking RLS status...');
    const { data: rlsCheck, error: rlsError } = await serviceClient
      .rpc('pg_get_rls_enabled', { table_name: 'leads' });

    if (rlsError) {
      console.log('⚠️  Could not check RLS status');
    } else {
      console.log('RLS enabled on leads table:', rlsCheck);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testAnonAccess();
