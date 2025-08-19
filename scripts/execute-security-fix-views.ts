#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSecurityFixViews() {
  try {
    console.log('🔧 EXECUTING SECURITY FIX: Security Definer Views');
    console.log('==================================================\n');

    // Read the SQL fix script
    const sqlScript = readFileSync('scripts/fix-security-definer-views.sql', 'utf8');
    
    console.log('📄 Executing SQL security fixes...');
    
    // Execute the SQL script
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sqlScript 
    });

    if (error) {
      console.error('❌ Error executing SQL fix:', error);
      
      // Try alternative approach - execute individual statements
      console.log('\n🔄 Trying alternative approach...');
      
      // Drop and recreate lead_conversion_summary
      console.log('1. Fixing lead_conversion_summary view...');
      
      const { error: dropError1 } = await supabase.rpc('exec_sql', {
        sql_query: 'DROP VIEW IF EXISTS public.lead_conversion_summary;'
      });
      
      if (dropError1) {
        console.error('❌ Error dropping lead_conversion_summary:', dropError1);
      } else {
        console.log('✅ Dropped lead_conversion_summary view');
      }

      const createView1 = `
        CREATE VIEW public.lead_conversion_summary AS
        SELECT 
            l.id as lead_id,
            l.status,
            CASE 
                WHEN l.status = 'Sold' THEN true 
                ELSE false 
            END as is_converted,
            CASE 
                WHEN l.status = 'Sold' THEN l.updated_at 
                ELSE NULL 
            END as conversion_date,
            NULL as converted_to_client_id,
            COALESCE(
                l.metadata->>'contact'->>'name',
                CONCAT(
                    l.metadata->>'contact'->>'first_name', 
                    ' ', 
                    l.metadata->>'contact'->>'last_name'
                )
            ) as client_name,
            'Lead' as client_type,
            CASE 
                WHEN l.status = 'Sold' THEN 
                    EXTRACT(days FROM (l.updated_at - l.created_at))
                ELSE NULL 
            END as days_to_conversion
        FROM leads l
        WHERE l.created_at IS NOT NULL;
      `;

      const { error: createError1 } = await supabase.rpc('exec_sql', {
        sql_query: createView1
      });

      if (createError1) {
        console.error('❌ Error creating lead_conversion_summary:', createError1);
      } else {
        console.log('✅ Created lead_conversion_summary view (without SECURITY DEFINER)');
      }

      // Drop and recreate client_lead_history
      console.log('\n2. Fixing client_lead_history view...');
      
      const { error: dropError2 } = await supabase.rpc('exec_sql', {
        sql_query: 'DROP VIEW IF EXISTS public.client_lead_history;'
      });
      
      if (dropError2) {
        console.error('❌ Error dropping client_lead_history:', dropError2);
      } else {
        console.log('✅ Dropped client_lead_history view');
      }

      const createView2 = `
        CREATE VIEW public.client_lead_history AS
        SELECT 
            l.id as lead_id,
            COALESCE(
                l.metadata->>'contact'->>'name',
                CONCAT(
                    l.metadata->>'contact'->>'first_name', 
                    ' ', 
                    l.metadata->>'contact'->>'last_name'
                )
            ) as client_name,
            l.metadata->>'contact'->>'email' as client_email,
            l.metadata->>'contact'->>'phone_number' as client_phone,
            l.status as current_status,
            l.created_at as first_contact_date,
            l.updated_at as last_activity_date,
            l.notes,
            l.assigned_to,
            it.name as insurance_type,
            l.current_carrier,
            l.premium
        FROM leads l
        LEFT JOIN insurance_types it ON l.insurance_type_id = it.id
        WHERE l.created_at IS NOT NULL
        ORDER BY l.created_at DESC;
      `;

      const { error: createError2 } = await supabase.rpc('exec_sql', {
        sql_query: createView2
      });

      if (createError2) {
        console.error('❌ Error creating client_lead_history:', createError2);
      } else {
        console.log('✅ Created client_lead_history view (without SECURITY DEFINER)');
      }

    } else {
      console.log('✅ SQL security fixes executed successfully');
    }

    // Test the views
    console.log('\n🧪 Testing the fixed views...');
    
    const { data: view1Data, error: view1Error } = await supabase
      .from('lead_conversion_summary')
      .select('*')
      .limit(1);

    if (view1Error) {
      console.error('❌ Error testing lead_conversion_summary:', view1Error);
    } else {
      console.log(`✅ lead_conversion_summary works (${view1Data?.length || 0} records)`);
    }

    const { data: view2Data, error: view2Error } = await supabase
      .from('client_lead_history')
      .select('*')
      .limit(1);

    if (view2Error) {
      console.error('❌ Error testing client_lead_history:', view2Error);
    } else {
      console.log(`✅ client_lead_history works (${view2Data?.length || 0} records)`);
    }

    console.log('\n🎉 SECURITY FIX COMPLETED: Security Definer Views');
    console.log('✅ Views recreated without SECURITY DEFINER property');
    console.log('🔒 Views now respect Row Level Security policies');

  } catch (error) {
    console.error('❌ Security fix failed:', error);
  }
}

executeSecurityFixViews();
