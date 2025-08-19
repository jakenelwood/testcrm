#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testLeadsTableFix() {
  try {
    console.log('🔍 Testing leads table access and structure...\n');

    // Test 1: Check if leads table exists and is accessible
    console.log('1. Testing leads table access...');
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .limit(3);

    if (leadsError) {
      console.error('❌ Error accessing leads table:', leadsError);
      return;
    }

    console.log('✅ Successfully accessed leads table');
    console.log(`📊 Found ${leadsData?.length || 0} leads`);

    if (leadsData && leadsData.length > 0) {
      console.log('\n📋 Sample lead structure:');
      const sampleLead = leadsData[0];
      console.log('- ID:', sampleLead.id);
      console.log('- Status:', sampleLead.status);
      console.log('- Pipeline Status ID:', sampleLead.pipeline_status_id);
      console.log('- Insurance Type ID:', sampleLead.insurance_type_id);
      console.log('- Metadata:', sampleLead.metadata ? 'Present' : 'Not present');
      console.log('- Contact info in metadata:', sampleLead.metadata?.contact ? 'Present' : 'Not present');
    }

    // Test 2: Check pipeline_statuses table
    console.log('\n2. Testing pipeline_statuses table...');
    const { data: statusData, error: statusError } = await supabase
      .from('pipeline_statuses')
      .select('*')
      .limit(5);

    if (statusError) {
      console.error('❌ Error accessing pipeline_statuses:', statusError);
    } else {
      console.log('✅ Successfully accessed pipeline_statuses table');
      console.log(`📊 Found ${statusData?.length || 0} statuses`);
      if (statusData && statusData.length > 0) {
        console.log('Sample statuses:', statusData.map(s => s.name).join(', '));
      }
    }

    // Test 3: Check insurance_types table
    console.log('\n3. Testing insurance_types table...');
    const { data: insuranceData, error: insuranceError } = await supabase
      .from('insurance_types')
      .select('*')
      .limit(5);

    if (insuranceError) {
      console.error('❌ Error accessing insurance_types:', insuranceError);
    } else {
      console.log('✅ Successfully accessed insurance_types table');
      console.log(`📊 Found ${insuranceData?.length || 0} insurance types`);
      if (insuranceData && insuranceData.length > 0) {
        console.log('Sample types:', insuranceData.map(i => i.name).join(', '));
      }
    }

    // Test 4: Test a join query like the modal would use
    console.log('\n4. Testing join query...');
    const { data: joinData, error: joinError } = await supabase
      .from('leads')
      .select(`
        *,
        pipeline_status:pipeline_statuses!pipeline_status_id(name),
        insurance_type:insurance_types!insurance_type_id(name)
      `)
      .limit(1);

    if (joinError) {
      console.error('❌ Error with join query:', joinError);
    } else {
      console.log('✅ Successfully executed join query');
      if (joinData && joinData.length > 0) {
        const lead = joinData[0];
        console.log('- Lead ID:', lead.id);
        console.log('- Pipeline Status:', lead.pipeline_status?.name || 'None');
        console.log('- Insurance Type:', lead.insurance_type?.name || 'None');
      }
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testLeadsTableFix();
