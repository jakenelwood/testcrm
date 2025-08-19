#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStatusMapping() {
  try {
    console.log('🔍 Checking status mapping and foreign key constraints...\n');

    // Check pipeline_statuses table
    console.log('1. Checking pipeline_statuses table...');
    const { data: pipelineStatuses, error: pipelineError } = await supabase
      .from('pipeline_statuses')
      .select('*')
      .order('id');

    if (pipelineError) {
      console.error('❌ Error fetching pipeline_statuses:', pipelineError);
      return;
    }

    console.log('✅ Pipeline statuses found:');
    pipelineStatuses?.forEach(status => {
      console.log(`  - ID: ${status.id}, Name: ${status.name}`);
    });

    // Check lead_statuses table (if it exists)
    console.log('\n2. Checking lead_statuses table...');
    const { data: leadStatuses, error: leadStatusError } = await supabase
      .from('lead_statuses')
      .select('*')
      .order('id');

    if (leadStatusError) {
      console.log('⚠️  lead_statuses table not accessible or doesn\'t exist');
    } else {
      console.log('✅ Lead statuses found:');
      leadStatuses?.forEach(status => {
        console.log(`  - ID: ${status.id}, Value: ${status.value}`);
      });
    }

    // Check insurance_types table
    console.log('\n3. Checking insurance_types table...');
    const { data: insuranceTypes, error: insuranceError } = await supabase
      .from('insurance_types')
      .select('*')
      .order('id');

    if (insuranceError) {
      console.error('❌ Error fetching insurance_types:', insuranceError);
    } else {
      console.log('✅ Insurance types found:');
      insuranceTypes?.forEach(type => {
        console.log(`  - ID: ${type.id}, Name: ${type.name}`);
      });
    }

    // Check current leads and their status IDs
    console.log('\n4. Checking current leads and their status references...');
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, status, pipeline_status_id, insurance_type_id')
      .limit(5);

    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError);
    } else {
      console.log('✅ Sample leads:');
      leads?.forEach(lead => {
        console.log(`  - Lead ID: ${lead.id}`);
        console.log(`    Status: ${lead.status}`);
        console.log(`    Pipeline Status ID: ${lead.pipeline_status_id}`);
        console.log(`    Insurance Type ID: ${lead.insurance_type_id}`);
      });
    }

    // Check what the modal is trying to map
    console.log('\n5. Checking status name to ID mapping...');
    const statusNames = ['New', 'Contacted', 'Quoted', 'Sold', 'Lost'];
    
    for (const statusName of statusNames) {
      // Check in pipeline_statuses
      const pipelineMatch = pipelineStatuses?.find(s => 
        s.name?.toLowerCase() === statusName.toLowerCase()
      );
      
      // Check in lead_statuses if available
      const leadMatch = leadStatuses?.find(s => 
        s.value?.toLowerCase() === statusName.toLowerCase()
      );

      console.log(`  - "${statusName}":`);
      console.log(`    Pipeline Status ID: ${pipelineMatch?.id || 'Not found'}`);
      console.log(`    Lead Status ID: ${leadMatch?.id || 'Not found'}`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkStatusMapping();
