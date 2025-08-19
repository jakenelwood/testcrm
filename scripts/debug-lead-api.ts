#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugLeadAPI() {
  try {
    console.log('🔍 Debugging lead API issues...\n');

    // Test the exact query from lead-api.ts
    console.log('1. Testing the exact query from lead-api.ts...');
    
    let selectQuery = `
      *,
      lead_status:lead_statuses!lead_status_id(value),
      insurance_type:insurance_types!insurance_type_id(name)
    `;

    const { data, error } = await supabase
      .from('leads')
      .select(selectQuery)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error with join query:', error);
      
      // Try without joins
      console.log('\n2. Testing without joins...');
      const { data: simpleData, error: simpleError } = await supabase
        .from('leads')
        .select('*')
        .limit(3);
        
      if (simpleError) {
        console.error('❌ Error with simple query:', simpleError);
      } else {
        console.log('✅ Simple query works, found', simpleData?.length, 'leads');
        if (simpleData && simpleData.length > 0) {
          const lead = simpleData[0];
          console.log('Sample lead:');
          console.log('- ID:', lead.id);
          console.log('- lead_status_id:', lead.lead_status_id);
          console.log('- insurance_type_id:', lead.insurance_type_id);
        }
      }
      
      // Check if the foreign key fields exist and have valid values
      console.log('\n3. Checking foreign key constraints...');
      
      // Check lead_statuses table
      const { data: leadStatuses, error: leadStatusError } = await supabase
        .from('lead_statuses')
        .select('id, value');
        
      if (leadStatusError) {
        console.error('❌ Error fetching lead_statuses:', leadStatusError);
      } else {
        console.log('✅ Lead statuses available:', leadStatuses?.map(s => `${s.id}:${s.value}`).join(', '));
      }
      
      // Check insurance_types table
      const { data: insuranceTypes, error: insuranceError } = await supabase
        .from('insurance_types')
        .select('id, name');
        
      if (insuranceError) {
        console.error('❌ Error fetching insurance_types:', insuranceError);
      } else {
        console.log('✅ Insurance types available:', insuranceTypes?.map(t => `${t.id}:${t.name}`).join(', '));
      }
      
    } else {
      console.log('✅ Join query works! Found', data?.length, 'leads');
      if (data && data.length > 0) {
        const lead = data[0];
        console.log('Sample lead with joins:');
        console.log('- ID:', lead.id);
        console.log('- Status:', lead.lead_status?.value || 'No status');
        console.log('- Insurance type:', lead.insurance_type?.name || 'No insurance type');
      }
    }

    // Test the actual lead API function
    console.log('\n4. Testing the actual lead API function...');
    try {
      const { fetchLeadsWithRelations } = await import('../utils/lead-api');
      const apiLeads = await fetchLeadsWithRelations();
      console.log('✅ Lead API returned', apiLeads?.length || 0, 'leads');
      
      if (apiLeads && apiLeads.length > 0) {
        const lead = apiLeads[0];
        console.log('Sample API lead:');
        console.log('- ID:', lead.id);
        console.log('- Name:', lead.name);
        console.log('- Status:', lead.status);
        console.log('- Insurance type:', lead.insurance_type);
      }
    } catch (apiError) {
      console.error('❌ Error with lead API:', apiError);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugLeadAPI();
