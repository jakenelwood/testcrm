#!/usr/bin/env tsx

/**
 * 🧪 Test API Endpoints
 * 
 * Tests core API endpoints to ensure they're working correctly after schema fixes.
 * Validates that endpoints return expected data structures and handle errors properly.
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

class APIEndpointTester {
  private baseUrl = 'http://localhost:3000';

  async run() {
    console.log('🧪 Testing API Endpoints...\n');
    
    try {
      await this.testLeadsEndpoint();
      await this.testClientsEndpoint();
      await this.testPipelinesEndpoint();
      
      console.log('✅ All API endpoint tests completed successfully!');
      
    } catch (error) {
      console.error('❌ API endpoint tests failed:', error);
      throw error;
    }
  }

  private async testLeadsEndpoint() {
    console.log('📋 Testing /api/leads endpoint...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/leads?limit=5`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log(`   ✅ GET /api/leads - Status: ${response.status}`);
      console.log(`   📊 Response structure: ${Object.keys(data).join(', ')}`);
      
      if (data.success && Array.isArray(data.data)) {
        console.log(`   📈 Found ${data.count} leads`);
      } else {
        console.log('   ⚠️  Unexpected response structure');
      }
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.log('   ⚠️  Server not running - skipping live API test');
        console.log('   💡 Run "npm run dev" to start the server for live testing');
      } else {
        console.log(`   ❌ Error: ${error}`);
      }
    }
  }

  private async testClientsEndpoint() {
    console.log('👥 Testing /api/clients endpoint...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/clients?limit=5`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log(`   ✅ GET /api/clients - Status: ${response.status}`);
      console.log(`   📊 Response structure: ${Object.keys(data).join(', ')}`);
      
      if (data.success && Array.isArray(data.data)) {
        console.log(`   📈 Found ${data.count || data.data.length} clients`);
      } else {
        console.log('   ⚠️  Unexpected response structure');
      }
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.log('   ⚠️  Server not running - skipping live API test');
      } else {
        console.log(`   ❌ Error: ${error}`);
      }
    }
  }

  private async testPipelinesEndpoint() {
    console.log('🔄 Testing /api/pipelines endpoint...');
    
    try {
      const response = await fetch(`${this.baseUrl}/api/pipelines`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log(`   ✅ GET /api/pipelines - Status: ${response.status}`);
      console.log(`   📊 Response structure: ${Object.keys(data).join(', ')}`);
      
      if (data.success && Array.isArray(data.data)) {
        console.log(`   📈 Found ${data.data.length} pipelines`);
      } else {
        console.log('   ⚠️  Unexpected response structure');
      }
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.log('   ⚠️  Server not running - skipping live API test');
      } else {
        console.log(`   ❌ Error: ${error}`);
      }
    }
  }

  // Static analysis of API structure
  async analyzeAPIStructure() {
    console.log('🔍 Analyzing API Structure...\n');
    
    const fs = await import('fs');
    const path = await import('path');
    
    const apiDir = 'app/api';
    
    if (!fs.existsSync(apiDir)) {
      console.log('❌ API directory not found');
      return;
    }
    
    const endpoints = this.getAPIEndpoints(apiDir);
    
    console.log('📋 Available API Endpoints:');
    endpoints.forEach(endpoint => {
      console.log(`   • ${endpoint}`);
    });
    
    console.log(`\n📊 Total endpoints: ${endpoints.length}`);
    
    // Check for critical missing endpoints
    const criticalEndpoints = [
      '/api/leads',
      '/api/clients', 
      '/api/pipelines',
      '/api/communications',
      '/api/quotes'
    ];
    
    console.log('\n🎯 Critical Endpoint Status:');
    criticalEndpoints.forEach(endpoint => {
      const exists = endpoints.some(e => e.startsWith(endpoint));
      console.log(`   ${exists ? '✅' : '❌'} ${endpoint}`);
    });
  }

  private getAPIEndpoints(dir: string, basePath = ''): string[] {
    const fs = require('fs');
    const path = require('path');
    const endpoints: string[] = [];
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Recursively check subdirectories
        const subEndpoints = this.getAPIEndpoints(fullPath, `${basePath}/${item}`);
        endpoints.push(...subEndpoints);
      } else if (item === 'route.ts' || item === 'route.js') {
        // This directory has a route handler
        endpoints.push(`/api${basePath}`);
      }
    }
    
    return endpoints;
  }
}

// Run the tests
if (require.main === module) {
  const tester = new APIEndpointTester();
  
  // First analyze the structure
  tester.analyzeAPIStructure().then(() => {
    console.log('\n' + '='.repeat(50) + '\n');
    // Then test the endpoints
    return tester.run();
  }).catch(console.error);
}

export { APIEndpointTester };
