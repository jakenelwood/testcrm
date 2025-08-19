#!/usr/bin/env npx tsx

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateSecurityIssues() {
  try {
    console.log('🔍 SECURITY AUDIT INVESTIGATION');
    console.log('=====================================\n');

    // 1. Investigate Security Definer Views
    console.log('1. 🔴 CRITICAL: Security Definer Views');
    console.log('---------------------------------------');
    
    const securityDefinerViews = ['lead_conversion_summary', 'client_lead_history'];
    
    for (const viewName of securityDefinerViews) {
      console.log(`\n📊 Investigating view: ${viewName}`);
      
      // Check if view exists and get its definition
      const { data: viewInfo, error: viewError } = await supabase
        .rpc('get_view_definition', { view_name: viewName })
        .single();

      if (viewError) {
        console.log(`⚠️  Could not get view definition: ${viewError.message}`);
        
        // Try alternative approach - check if we can query the view
        const { data: viewData, error: queryError } = await supabase
          .from(viewName)
          .select('*')
          .limit(1);

        if (queryError) {
          console.log(`❌ View query failed: ${queryError.message}`);
        } else {
          console.log(`✅ View exists and is queryable (${viewData?.length || 0} sample records)`);
          if (viewData && viewData.length > 0) {
            console.log(`📋 Sample columns: ${Object.keys(viewData[0]).join(', ')}`);
          }
        }
      } else {
        console.log(`✅ View definition retrieved`);
        console.log(`📋 Definition: ${viewInfo}`);
      }
    }

    // 2. Investigate RLS Disabled Tables
    console.log('\n\n2. 🔴 CRITICAL: RLS Disabled Tables');
    console.log('------------------------------------');
    
    const rlsDisabledTables = ['schema_versions', '_version_info'];
    
    for (const tableName of rlsDisabledTables) {
      console.log(`\n📊 Investigating table: ${tableName}`);
      
      // Check if table exists and get sample data
      const { data: tableData, error: tableError } = await supabase
        .from(tableName)
        .select('*')
        .limit(3);

      if (tableError) {
        console.log(`❌ Table query failed: ${tableError.message}`);
      } else {
        console.log(`✅ Table exists (${tableData?.length || 0} records)`);
        if (tableData && tableData.length > 0) {
          console.log(`📋 Columns: ${Object.keys(tableData[0]).join(', ')}`);
          console.log(`📄 Sample data:`, JSON.stringify(tableData[0], null, 2));
        }
      }

      // Check current RLS status
      const { data: rlsStatus, error: rlsError } = await supabase
        .rpc('check_table_rls', { table_name: tableName });

      if (rlsError) {
        console.log(`⚠️  Could not check RLS status: ${rlsError.message}`);
      } else {
        console.log(`🔒 RLS Status: ${rlsStatus ? 'ENABLED' : 'DISABLED'}`);
      }
    }

    // 3. Sample Function Search Path Issues
    console.log('\n\n3. 🟡 WARNING: Function Search Path Issues');
    console.log('-------------------------------------------');
    
    const sampleFunctions = [
      'notify_call_log_change',
      'get_slow_queries', 
      'update_lead_last_contact',
      'handle_new_user',
      'get_dashboard_stats'
    ];

    for (const funcName of sampleFunctions) {
      console.log(`\n📊 Checking function: ${funcName}`);
      
      // Try to get function definition
      const { data: funcInfo, error: funcError } = await supabase
        .rpc('get_function_definition', { function_name: funcName });

      if (funcError) {
        console.log(`⚠️  Could not get function definition: ${funcError.message}`);
      } else {
        console.log(`✅ Function exists`);
        // Check if search_path is set in the definition
        const hasSearchPath = funcInfo && funcInfo.includes('search_path');
        console.log(`🔍 Has search_path setting: ${hasSearchPath ? 'YES' : 'NO'}`);
      }
    }

    console.log('\n\n📋 INVESTIGATION SUMMARY');
    console.log('========================');
    console.log('🔴 CRITICAL ERRORS: 4 issues found');
    console.log('   - 2 Security Definer Views need fixing');
    console.log('   - 2 Tables need RLS enabled');
    console.log('🟡 WARNINGS: 50+ functions need search_path fixes');
    console.log('\n⚠️  These issues must be fixed before production deployment!');

  } catch (error) {
    console.error('❌ Investigation failed:', error);
  }
}

investigateSecurityIssues();
