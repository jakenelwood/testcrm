#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkForeignKeys() {
  try {
    console.log('🔍 Checking foreign key integrity...\n');

    // Get all leads
    console.log('1. Getting all leads...');
    const { data: allLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, lead_status_id, insurance_type_id, status');

    if (leadsError) {
      console.error('❌ Error fetching leads:', leadsError);
      return;
    }

    console.log('✅ Found', allLeads?.length, 'total leads');

    // Check which leads have null foreign keys
    const leadsWithNullStatus = allLeads?.filter(lead => !lead.lead_status_id) || [];
    const leadsWithNullInsurance = allLeads?.filter(lead => !lead.insurance_type_id) || [];

    console.log('- Leads with null lead_status_id:', leadsWithNullStatus.length);
    console.log('- Leads with null insurance_type_id:', leadsWithNullInsurance.length);

    if (leadsWithNullStatus.length > 0) {
      console.log('Leads with null status:', leadsWithNullStatus.map(l => l.id));
    }

    if (leadsWithNullInsurance.length > 0) {
      console.log('Leads with null insurance type:', leadsWithNullInsurance.map(l => l.id));
    }

    // Check for invalid foreign key references
    console.log('\n2. Checking for invalid foreign key references...');
    
    const { data: leadStatuses } = await supabase
      .from('lead_statuses')
      .select('id');
    
    const { data: insuranceTypes } = await supabase
      .from('insurance_types')
      .select('id');

    const validStatusIds = leadStatuses?.map(s => s.id) || [];
    const validInsuranceIds = insuranceTypes?.map(i => i.id) || [];

    const leadsWithInvalidStatus = allLeads?.filter(lead => 
      lead.lead_status_id && !validStatusIds.includes(lead.lead_status_id)
    ) || [];

    const leadsWithInvalidInsurance = allLeads?.filter(lead => 
      lead.insurance_type_id && !validInsuranceIds.includes(lead.insurance_type_id)
    ) || [];

    console.log('- Leads with invalid lead_status_id:', leadsWithInvalidStatus.length);
    console.log('- Leads with invalid insurance_type_id:', leadsWithInvalidInsurance.length);

    if (leadsWithInvalidStatus.length > 0) {
      console.log('Invalid status IDs:', leadsWithInvalidStatus.map(l => `${l.id}:${l.lead_status_id}`));
    }

    if (leadsWithInvalidInsurance.length > 0) {
      console.log('Invalid insurance IDs:', leadsWithInvalidInsurance.map(l => `${l.id}:${l.insurance_type_id}`));
    }

    // Test the join with different approaches
    console.log('\n3. Testing different join approaches...');

    // Inner join (only returns leads with valid foreign keys)
    const { data: innerJoinData, error: innerError } = await supabase
      .from('leads')
      .select(`
        *,
        lead_status:lead_statuses!inner(value),
        insurance_type:insurance_types!inner(name)
      `)
      .limit(5);

    if (innerError) {
      console.error('❌ Inner join error:', innerError);
    } else {
      console.log('✅ Inner join returned', innerJoinData?.length, 'leads');
    }

    // Left join (returns all leads, null for missing foreign keys)
    const { data: leftJoinData, error: leftError } = await supabase
      .from('leads')
      .select(`
        *,
        lead_status:lead_statuses(value),
        insurance_type:insurance_types(name)
      `)
      .limit(5);

    if (leftError) {
      console.error('❌ Left join error:', leftError);
    } else {
      console.log('✅ Left join returned', leftJoinData?.length, 'leads');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkForeignKeys();
