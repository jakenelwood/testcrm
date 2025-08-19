#!/usr/bin/env tsx

/**
 * 🔍 Pipeline Mapping Test Script
 * 
 * This script tests the pipeline status mapping to debug the kanban board display issue.
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../lib/drizzle/schema';
import { sql } from 'drizzle-orm';

// Create database connection after env vars are loaded
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require',
  connection: {
    application_name: 'test-pipeline-mapping'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema });

async function testPipelineMapping() {
  console.log('🔍 Testing Pipeline Status Mapping...\n');
  
  try {
    // Get the Personal Insurance Pipeline (ID: 7)
    console.log('📊 Personal Insurance Pipeline (ID: 7):');
    
    // Get pipeline statuses for pipeline 7
    const pipelineStatuses = await db.execute(sql`
      SELECT id, name, display_order
      FROM pipeline_statuses 
      WHERE pipeline_id = 7
      ORDER BY display_order
    `);
    
    console.log('Pipeline Statuses:');
    pipelineStatuses.forEach((status: any) => {
      console.log(`  - ${status.name} (Order: ${status.display_order})`);
    });
    
    // Get leads for pipeline 7 grouped by status
    console.log('\nLeads in Pipeline 7 by Status:');
    const leadsInPipeline = await db.execute(sql`
      SELECT status, COUNT(*) as count
      FROM leads 
      WHERE pipeline_id = 7
      GROUP BY status
      ORDER BY status
    `);
    
    leadsInPipeline.forEach((statusCount: any) => {
      console.log(`  - ${statusCount.status}: ${statusCount.count} leads`);
    });
    
    // Test the mapping logic
    console.log('\n🔄 Testing Status Mapping Logic:');
    
    const statusMapping: Record<string, string> = {
      'New': 'New Lead',
      'Contacted': 'Initial Contact', 
      'Qualified': 'Needs Assessment',
      'Quoted': 'Quote Preparation',
      'Sold': 'Policy Sold',
      'Lost': 'Lost',
      'Hibernated': 'Lost'
    };
    
    // Create reverse mapping
    const reverseMapping: Record<string, string[]> = {};
    Object.entries(statusMapping).forEach(([leadStatus, pipelineStatus]) => {
      if (!reverseMapping[pipelineStatus]) {
        reverseMapping[pipelineStatus] = [];
      }
      reverseMapping[pipelineStatus].push(leadStatus);
    });
    
    console.log('Status Mapping (Lead Status -> Pipeline Status):');
    Object.entries(statusMapping).forEach(([leadStatus, pipelineStatus]) => {
      console.log(`  ${leadStatus} -> ${pipelineStatus}`);
    });
    
    console.log('\nReverse Mapping (Pipeline Status -> Lead Statuses):');
    Object.entries(reverseMapping).forEach(([pipelineStatus, leadStatuses]) => {
      console.log(`  ${pipelineStatus} <- [${leadStatuses.join(', ')}]`);
    });
    
    // Test how many leads would appear in each pipeline column
    console.log('\n📋 Expected Leads per Pipeline Column:');
    for (const [pipelineStatus, leadStatuses] of Object.entries(reverseMapping)) {
      let totalLeads = 0;
      for (const leadStatus of leadStatuses) {
        const statusData = leadsInPipeline.find((s: any) => s.status === leadStatus);
        if (statusData) {
          totalLeads += parseInt(statusData.count);
        }
      }
      console.log(`  ${pipelineStatus}: ${totalLeads} leads`);
    }
    
    // Check for unmapped statuses
    console.log('\n⚠️  Checking for Unmapped Lead Statuses:');
    const allMappedStatuses = Object.keys(statusMapping);
    const unmappedStatuses = leadsInPipeline.filter((s: any) => !allMappedStatuses.includes(s.status));
    
    if (unmappedStatuses.length === 0) {
      console.log('✅ All lead statuses are mapped');
    } else {
      console.log('❌ Unmapped statuses found:');
      unmappedStatuses.forEach((status: any) => {
        console.log(`  - ${status.status}: ${status.count} leads`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing pipeline mapping:', error);
  } finally {
    await client.end();
  }
}

// Run the test
if (require.main === module) {
  testPipelineMapping();
}
