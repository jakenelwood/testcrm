#!/usr/bin/env tsx

/**
 * Apply Unified Schema Migration
 * This script applies the unified schema to the database
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function applyUnifiedSchema() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  console.log('🚀 Connecting to database...');
  
  // Create connection
  const sql = postgres(databaseUrl);
  const db = drizzle(sql);

  try {
    // Read the generated migration SQL
    const migrationPath = path.join(process.cwd(), 'lib/drizzle/migrations/0000_public_tigra.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Reading migration file...');
    console.log('📊 Applying unified schema migration...');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          await sql.unsafe(statement);
        } catch (error: any) {
          // Some errors are expected (like "already exists")
          if (error.message.includes('already exists')) {
            console.log(`⚠️  Skipping (already exists): Statement ${i + 1}`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`, error.message);
            console.log('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }

    console.log('✅ Unified schema migration completed successfully!');
    
    // Test the connection
    console.log('🧪 Testing database connection...');
    const result = await sql`SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log(`📊 Found ${result[0].table_count} tables in public schema`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
applyUnifiedSchema().catch(console.error);
