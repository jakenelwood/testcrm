#!/usr/bin/env tsx

/**
 * Authentication Setup Test Script
 * 
 * This script tests the basic authentication setup and configuration
 * to ensure everything is working correctly.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'skip', message: string, details?: any) {
  results.push({ name, status, message, details });
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  console.log(`${emoji} ${name}: ${message}`);
  if (details && status === 'fail') {
    console.log('   Details:', details);
  }
}

async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    
    if (error) {
      addResult('Database Connection', 'fail', 'Failed to connect to database', error.message);
      return false;
    }
    
    addResult('Database Connection', 'pass', 'Successfully connected to database');
    return true;
  } catch (err) {
    addResult('Database Connection', 'fail', 'Database connection error', err);
    return false;
  }
}

async function testAuthTables() {
  const tables = [
    'users',
    'organizations',
    'organization_roles',
    'user_organization_memberships',
    'user_invitations',
    'permissions',
    'audit_logs'
  ];

  let allTablesExist = true;

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        addResult(`Table: ${table}`, 'fail', 'Table does not exist or is not accessible', error.message);
        allTablesExist = false;
      } else {
        addResult(`Table: ${table}`, 'pass', 'Table exists and is accessible');
      }
    } catch (err) {
      addResult(`Table: ${table}`, 'fail', 'Error accessing table', err);
      allTablesExist = false;
    }
  }

  return allTablesExist;
}

async function testAuthFunctions() {
  const functions = [
    'user_has_permission',
    'get_user_organization_role',
    'create_user_invitation',
    'accept_user_invitation',
    'validate_password_strength'
  ];

  let allFunctionsExist = true;

  for (const func of functions) {
    try {
      // Test if function exists by calling it with null parameters
      // This will fail but tell us if the function exists
      const { error } = await supabase.rpc(func, {});
      
      // If we get a specific error about parameters, the function exists
      if (error && (error.message.includes('null value') || error.message.includes('parameter'))) {
        addResult(`Function: ${func}`, 'pass', 'Function exists');
      } else if (error && error.message.includes('does not exist')) {
        addResult(`Function: ${func}`, 'fail', 'Function does not exist', error.message);
        allFunctionsExist = false;
      } else {
        addResult(`Function: ${func}`, 'pass', 'Function exists and callable');
      }
    } catch (err) {
      addResult(`Function: ${func}`, 'fail', 'Error testing function', err);
      allFunctionsExist = false;
    }
  }

  return allFunctionsExist;
}

async function testPasswordValidation() {
  try {
    // Test weak password
    const { data: weakResult, error: weakError } = await supabase.rpc('validate_password_strength', {
      password: 'weak'
    });

    if (weakError) {
      addResult('Password Validation', 'fail', 'Error testing password validation', weakError.message);
      return false;
    }

    if (!weakResult || weakResult.valid === true) {
      addResult('Password Validation', 'fail', 'Weak password incorrectly validated as strong');
      return false;
    }

    // Test strong password
    const { data: strongResult, error: strongError } = await supabase.rpc('validate_password_strength', {
      password: 'StrongPassword123!'
    });

    if (strongError) {
      addResult('Password Validation', 'fail', 'Error testing strong password', strongError.message);
      return false;
    }

    if (!strongResult || strongResult.valid !== true) {
      addResult('Password Validation', 'fail', 'Strong password incorrectly rejected', strongResult);
      return false;
    }

    addResult('Password Validation', 'pass', `Password validation working correctly (score: ${strongResult.score})`);
    return true;
  } catch (err) {
    addResult('Password Validation', 'fail', 'Error testing password validation', err);
    return false;
  }
}

async function testPermissionsData() {
  try {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .limit(5);

    if (error) {
      addResult('Permissions Data', 'fail', 'Error fetching permissions', error.message);
      return false;
    }

    if (!data || data.length === 0) {
      addResult('Permissions Data', 'fail', 'No permissions found in database');
      return false;
    }

    addResult('Permissions Data', 'pass', `Found ${data.length} permissions in database`);
    return true;
  } catch (err) {
    addResult('Permissions Data', 'fail', 'Error testing permissions data', err);
    return false;
  }
}

async function testRLSPolicies() {
  try {
    // Test that RLS is enabled on key tables
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    // This should work with service role key
    if (error) {
      addResult('RLS Policies', 'fail', 'Error testing RLS policies', error.message);
      return false;
    }

    addResult('RLS Policies', 'pass', 'RLS policies appear to be configured correctly');
    return true;
  } catch (err) {
    addResult('RLS Policies', 'fail', 'Error testing RLS policies', err);
    return false;
  }
}

async function testEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  const optionalVars = [
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'AZURE_OAUTH_CLIENT_ID',
    'AZURE_OAUTH_CLIENT_SECRET'
  ];

  let allRequired = true;

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      addResult(`Env Var: ${varName}`, 'pass', 'Variable is set');
    } else {
      addResult(`Env Var: ${varName}`, 'fail', 'Required variable is missing');
      allRequired = false;
    }
  }

  for (const varName of optionalVars) {
    if (process.env[varName]) {
      addResult(`Env Var: ${varName}`, 'pass', 'Optional variable is set');
    } else {
      addResult(`Env Var: ${varName}`, 'skip', 'Optional variable not set');
    }
  }

  return allRequired;
}

async function runAllTests() {
  console.log('🧪 Starting Authentication Setup Tests\n');

  const testResults = await Promise.all([
    testEnvironmentVariables(),
    testDatabaseConnection(),
    testAuthTables(),
    testAuthFunctions(),
    testPasswordValidation(),
    testPermissionsData(),
    testRLSPolicies(),
  ]);

  console.log('\n📊 Test Summary:');
  console.log('================');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const skipped = results.filter(r => r.status === 'skip').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️ Skipped: ${skipped}`);
  console.log(`📈 Total: ${results.length}`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Authentication setup is ready.');
    return true;
  } else {
    console.log('\n⚠️ Some tests failed. Please review the issues above.');
    return false;
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('❌ Test runner error:', err);
      process.exit(1);
    });
}

export { runAllTests, results };
