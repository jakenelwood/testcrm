#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  try {
    console.log('🔍 Checking RLS policies for leads table...\n');

    // Check if RLS is enabled on leads table
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_status', { table_name: 'leads' })
      .single();

    if (rlsError) {
      console.log('⚠️  Could not check RLS status (function might not exist)');
      console.log('Checking manually...');
      
      // Try to query the table with anon key to see if RLS is blocking
      const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
      
      const { data: anonData, error: anonError } = await anonClient
        .from('leads')
        .select('id')
        .limit(1);

      if (anonError) {
        console.log('❌ Anonymous access blocked:', anonError.message);
        console.log('This suggests RLS is enabled and blocking access');
      } else {
        console.log('✅ Anonymous access works - RLS might be disabled or has permissive policies');
      }
    }

    // Check existing policies
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'leads');

    if (policiesError) {
      console.log('⚠️  Could not query pg_policies:', policiesError.message);
    } else {
      console.log(`📋 Found ${policies?.length || 0} RLS policies for leads table`);
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`- Policy: ${policy.policyname} (${policy.cmd})`);
          console.log(`  Roles: ${policy.roles}`);
          console.log(`  Expression: ${policy.qual || 'None'}`);
        });
      }
    }

    // Test authenticated access
    console.log('\n🔐 Testing authenticated access...');
    const { data: authData, error: authError } = await supabase
      .from('leads')
      .select('id, status, metadata')
      .limit(1);

    if (authError) {
      console.log('❌ Authenticated access failed:', authError.message);
    } else {
      console.log('✅ Authenticated access works');
      console.log(`Found ${authData?.length || 0} leads`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRLSPolicies();
