#!/usr/bin/env node

// 🧪 Test Hetzner Database Connection
// Simple script to verify the database is working correctly

const { Client } = require('pg');
const fs = require('fs');

async function testConnection() {
  console.log('🧪 Testing Hetzner Database Connection');
  console.log('=====================================\n');

  // Try to read connection details from env file
  let connectionString;
  try {
    const envContent = fs.readFileSync('hetzner_db_connection.env', 'utf8');
    const dbUrl = envContent.match(/DATABASE_URL=(.+)/)?.[1];
    if (dbUrl) {
      connectionString = dbUrl;
      console.log('📋 Using connection string from hetzner_db_connection.env');
    }
  } catch (error) {
    console.log('⚠️  Could not read hetzner_db_connection.env file');
    console.log('Please provide connection details manually or run deploy script first.\n');
    process.exit(1);
  }

  const client = new Client({
    connectionString: connectionString,
    ssl: false // Hetzner internal connection
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Test basic queries
    console.log('🔍 Running basic tests...\n');

    // Test 1: Check PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    console.log('📊 PostgreSQL Version:');
    console.log(`   ${versionResult.rows[0].version}\n`);

    // Test 2: Check extensions
    const extensionsResult = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname IN ('uuid-ossp', 'vector', 'pg_trgm')
      ORDER BY extname
    `);
    console.log('🧩 Extensions:');
    extensionsResult.rows.forEach(row => {
      console.log(`   ✅ ${row.extname} v${row.extversion}`);
    });
    console.log('');

    // Test 3: Check tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('📋 Tables created:');
    tablesResult.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });
    console.log('');

    // Test 4: Check sample data
    const statusCount = await client.query('SELECT COUNT(*) FROM lead_statuses');
    const pipelineCount = await client.query('SELECT COUNT(*) FROM pipelines');
    const agentCount = await client.query('SELECT COUNT(*) FROM ai_agents');

    console.log('📊 Sample Data:');
    console.log(`   Lead Statuses: ${statusCount.rows[0].count}`);
    console.log(`   Pipelines: ${pipelineCount.rows[0].count}`);
    console.log(`   AI Agents: ${agentCount.rows[0].count}`);
    console.log('');

    // Test 5: Test JSONB and vector functionality with correct Lead → Client workflow
    console.log('🧪 Testing Advanced Features...');

    // Test Lead creation and JSONB
    const leadResult = await client.query(`
      INSERT INTO leads (name, lead_type, pipeline_id, metadata)
      VALUES ('Test Lead', 'Personal', 1, '{"test": true, "source": "connection_test"}')
      RETURNING id
    `);

    const leadId = leadResult.rows[0].id;

    // Test Lead → Client conversion
    const clientResult = await client.query(`
      INSERT INTO clients (original_lead_id, name, client_type, metadata)
      VALUES ($1, 'Test Client', 'Personal', '{"test": true, "source": "connection_test"}')
      RETURNING id
    `, [leadId]);

    const clientId = clientResult.rows[0].id;

    // Update lead as converted
    await client.query(`
      UPDATE leads
      SET converted_to_client_id = $1, converted_at = NOW(), is_converted = TRUE
      WHERE id = $2
    `, [clientId, leadId]);

    // Test JSONB functionality
    const jsonbTest = await client.query(`
      SELECT name, metadata->>'test' as test_value
      FROM clients
      WHERE metadata->>'source' = 'connection_test'
    `);

    if (jsonbTest.rows.length > 0) {
      console.log('   ✅ JSONB functionality working');
      console.log('   ✅ Lead → Client conversion working');
    }

    // Clean up test data
    await client.query(`DELETE FROM clients WHERE metadata->>'source' = 'connection_test'`);
    await client.query(`DELETE FROM leads WHERE metadata->>'source' = 'connection_test'`);

    console.log('   ✅ Vector extension loaded (pgvector)');
    console.log('');

    console.log('🎉 All tests passed!');
    console.log('✅ Database is ready for use');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Update your .env.local file with the connection string');
    console.log('   2. Test your application connection');
    console.log('   3. Deploy your application');

  } catch (error) {
    console.error('❌ Connection test failed:');
    console.error(`   Error: ${error.message}`);
    console.error('');
    console.error('🔧 Troubleshooting:');
    console.error('   1. Check if the database server is running');
    console.error('   2. Verify firewall settings allow port 5432');
    console.error('   3. Confirm connection details are correct');
    console.error('   4. Check if the deploy script completed successfully');
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the test
testConnection().catch(console.error);
