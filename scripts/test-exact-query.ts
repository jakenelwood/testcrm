#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExactQuery() {
  try {
    console.log('🔍 Testing the exact query from lead-api.ts...\n');

    // Test the exact query structure from lead-api.ts
    let selectQuery = `
      *,
      lead_status:lead_statuses!lead_status_id(value),
      insurance_type:insurance_types!insurance_type_id(name)
    `;

    console.log('Query:', selectQuery);

    const { data, error } = await supabase
      .from('leads')
      .select(selectQuery)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error with exact query:', error);
      
      // Try without the explicit foreign key reference
      console.log('\n2. Trying without explicit foreign key reference...');
      let simpleQuery = `
        *,
        lead_status:lead_statuses(value),
        insurance_type:insurance_types(name)
      `;

      const { data: simpleData, error: simpleError } = await supabase
        .from('leads')
        .select(simpleQuery)
        .order('created_at', { ascending: false });

      if (simpleError) {
        console.error('❌ Error with simple query:', simpleError);
      } else {
        console.log('✅ Simple query works! Found', simpleData?.length, 'leads');
      }

    } else {
      console.log('✅ Exact query works! Found', data?.length, 'leads');
      
      if (data && data.length > 0) {
        const lead = data[0];
        console.log('Sample lead:');
        console.log('- ID:', lead.id);
        console.log('- Status object:', lead.lead_status);
        console.log('- Insurance object:', lead.insurance_type);
        console.log('- Raw status field:', lead.status);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testExactQuery();
