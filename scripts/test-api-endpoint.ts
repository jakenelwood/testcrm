#!/usr/bin/env tsx

/**
 * 🔍 API Endpoint Test Script
 * 
 * This script tests the actual API endpoints to see what data is being returned.
 */

import fetch from 'node-fetch';

async function testAPIEndpoints() {
  console.log('🔍 Testing API Endpoints...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Leads API
    console.log('📊 Testing /api/leads endpoint:');
    const leadsResponse = await fetch(`${baseUrl}/api/leads`);
    
    if (!leadsResponse.ok) {
      console.error(`❌ Leads API failed: ${leadsResponse.status} ${leadsResponse.statusText}`);
      const errorText = await leadsResponse.text();
      console.error('Error details:', errorText);
    } else {
      const leadsData = await leadsResponse.json();
      console.log(`✅ Leads API successful`);
      console.log(`📋 Response structure:`, {
        success: leadsData.success,
        dataLength: Array.isArray(leadsData.data) ? leadsData.data.length : 'Not an array',
        firstLead: leadsData.data?.[0] ? {
          id: leadsData.data[0].id?.substring(0, 8) + '...',
          status: leadsData.data[0].status,
          status_legacy: leadsData.data[0].status_legacy,
          lead_type: leadsData.data[0].lead_type,
          pipeline_id: leadsData.data[0].pipeline_id
        } : 'No leads found'
      });
    }
    
    // Test 2: Pipelines API
    console.log('\n🔄 Testing /api/pipelines endpoint:');
    const pipelinesResponse = await fetch(`${baseUrl}/api/pipelines`);
    
    if (!pipelinesResponse.ok) {
      console.error(`❌ Pipelines API failed: ${pipelinesResponse.status} ${pipelinesResponse.statusText}`);
      const errorText = await pipelinesResponse.text();
      console.error('Error details:', errorText);
    } else {
      const pipelinesData = await pipelinesResponse.json();
      console.log(`✅ Pipelines API successful`);
      console.log(`📋 Response structure:`, {
        success: pipelinesData.success,
        dataLength: Array.isArray(pipelinesData.data) ? pipelinesData.data.length : 'Not an array',
        pipelines: pipelinesData.data?.map((p: any) => ({
          id: p.id,
          name: p.name,
          lead_type: p.lead_type,
          statusesCount: p.statuses?.length || 0
        }))
      });
    }
    
    // Test 3: Specific pipeline leads
    console.log('\n🎯 Testing /api/leads?pipeline_id=7 endpoint:');
    const pipelineLeadsResponse = await fetch(`${baseUrl}/api/leads?pipeline_id=7`);
    
    if (!pipelineLeadsResponse.ok) {
      console.error(`❌ Pipeline leads API failed: ${pipelineLeadsResponse.status} ${pipelineLeadsResponse.statusText}`);
      const errorText = await pipelineLeadsResponse.text();
      console.error('Error details:', errorText);
    } else {
      const pipelineLeadsData = await pipelineLeadsResponse.json();
      console.log(`✅ Pipeline leads API successful`);
      console.log(`📋 Response structure:`, {
        success: pipelineLeadsData.success,
        dataLength: Array.isArray(pipelineLeadsData.data) ? pipelineLeadsData.data.length : 'Not an array',
        statusBreakdown: pipelineLeadsData.data?.reduce((acc: any, lead: any) => {
          const status = lead.status || lead.status_legacy || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {})
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
  }
}

// Run the test
if (require.main === module) {
  testAPIEndpoints();
}
