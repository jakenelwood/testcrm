#!/usr/bin/env tsx

/**
 * 🔍 API Data Testing Script
 * 
 * This script tests the API endpoints to see what data is being returned
 * and helps debug the disconnect between database and presentation layer.
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { leads, pipelines, pipeline_statuses } from '../lib/drizzle/schema';
import * as schema from '../lib/drizzle/schema';
import { sql } from 'drizzle-orm';

// Create database connection after env vars are loaded
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { 
  prepare: false,
  ssl: 'require',
  connection: {
    application_name: 'test-api-data'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});
const db = drizzle(client, { schema });

async function testDatabaseData() {
  console.log('🔍 Testing Database Data...\n');
  
  try {
    // Test 1: Check leads count and sample data
    console.log('📊 Testing Leads Data:');
    const leadsCount = await db.execute(sql`SELECT COUNT(*) as count FROM leads`);
    console.log(`✅ Total leads: ${leadsCount[0]?.count || 0}`);
    
    // Get sample leads with key fields
    const sampleLeads = await db.execute(sql`
      SELECT 
        id, 
        lead_type, 
        status, 
        pipeline_id, 
        insurance_type_id,
        ai_summary,
        created_at
      FROM leads 
      LIMIT 5
    `);
    
    console.log('📋 Sample leads:');
    sampleLeads.forEach((lead: any, index: number) => {
      console.log(`  ${index + 1}. ID: ${lead.id?.substring(0, 8)}...`);
      console.log(`     Type: ${lead.lead_type}, Status: ${lead.status}`);
      console.log(`     Pipeline: ${lead.pipeline_id}, Insurance: ${lead.insurance_type_id}`);
      console.log(`     Summary: ${lead.ai_summary?.substring(0, 50)}...`);
      console.log(`     Created: ${lead.created_at}`);
      console.log('');
    });
    
    // Test 2: Check pipelines
    console.log('🔄 Testing Pipelines Data:');
    const pipelinesData = await db.execute(sql`
      SELECT id, name, lead_type, is_default, is_active 
      FROM pipelines 
      ORDER BY id
    `);
    
    console.log('📋 Available pipelines:');
    pipelinesData.forEach((pipeline: any) => {
      console.log(`  - ID: ${pipeline.id}, Name: ${pipeline.name}`);
      console.log(`    Type: ${pipeline.lead_type}, Default: ${pipeline.is_default}, Active: ${pipeline.is_active}`);
    });
    
    // Test 3: Check pipeline statuses
    console.log('\n📊 Testing Pipeline Statuses:');
    const statusesData = await db.execute(sql`
      SELECT ps.id, ps.pipeline_id, ps.name, ps.display_order, p.name as pipeline_name
      FROM pipeline_statuses ps
      JOIN pipelines p ON ps.pipeline_id = p.id
      ORDER BY ps.pipeline_id, ps.display_order
    `);
    
    console.log('📋 Pipeline statuses:');
    let currentPipeline = '';
    statusesData.forEach((status: any) => {
      if (status.pipeline_name !== currentPipeline) {
        currentPipeline = status.pipeline_name;
        console.log(`\n  Pipeline: ${currentPipeline} (ID: ${status.pipeline_id})`);
      }
      console.log(`    - ${status.name} (Order: ${status.display_order})`);
    });
    
    // Test 4: Check leads by pipeline
    console.log('\n🎯 Testing Leads by Pipeline:');
    for (const pipeline of pipelinesData) {
      const leadsInPipeline = await db.execute(sql`
        SELECT COUNT(*) as count, status
        FROM leads 
        WHERE pipeline_id = ${pipeline.id}
        GROUP BY status
        ORDER BY status
      `);
      
      console.log(`\n  Pipeline: ${pipeline.name} (ID: ${pipeline.id})`);
      if (leadsInPipeline.length === 0) {
        console.log('    ❌ No leads found');
      } else {
        leadsInPipeline.forEach((statusCount: any) => {
          console.log(`    - ${statusCount.status}: ${statusCount.count} leads`);
        });
      }
    }
    
    // Test 5: Check for leads with null pipeline_id
    console.log('\n🔍 Testing Leads with NULL pipeline_id:');
    const nullPipelineLeads = await db.execute(sql`
      SELECT COUNT(*) as count, status
      FROM leads 
      WHERE pipeline_id IS NULL
      GROUP BY status
      ORDER BY status
    `);
    
    if (nullPipelineLeads.length === 0) {
      console.log('✅ No leads with NULL pipeline_id');
    } else {
      console.log('📋 Leads without pipeline assignment:');
      nullPipelineLeads.forEach((statusCount: any) => {
        console.log(`  - ${statusCount.status}: ${statusCount.count} leads`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing database data:', error);
  } finally {
    await client.end();
  }
}

// Run the test
if (require.main === module) {
  testDatabaseData();
}
