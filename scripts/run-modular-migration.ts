#!/usr/bin/env tsx

/**
 * 🔄 Modular CRM Migration Runner
 * 
 * Executes the complete migration from current schema to modular CRM structure.
 * Includes validation, rollback capabilities, and comprehensive reporting.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { readFileSync, writeFileSync } from 'fs';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require' });

interface MigrationStep {
  id: string;
  name: string;
  file: string;
  description: string;
  rollback_file?: string;
}

interface MigrationResult {
  step: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  execution_time_ms: number;
  error?: string;
  records_affected?: number;
}

class ModularMigrationRunner {
  private results: MigrationResult[] = [];
  private migrationSteps: MigrationStep[] = [
    {
      id: '001',
      name: 'Create Core CRM Tables',
      file: 'migrations/001_create_core_crm_tables.sql',
      description: 'Creates contacts, opportunities, activities tables',
      rollback_file: 'migrations/rollback_001.sql'
    },
    {
      id: '002', 
      name: 'Create Insurance Extension Tables',
      file: 'migrations/002_create_insurance_extension_tables.sql',
      description: 'Creates insurance_profiles, insurance_quotes, insurance_policies tables',
      rollback_file: 'migrations/rollback_002.sql'
    },
    {
      id: '003',
      name: 'Migrate Existing Data',
      file: 'migrations/003_migrate_existing_data.sql',
      description: 'Migrates data from leads/clients to new modular structure',
      rollback_file: 'migrations/rollback_003.sql'
    }
  ];

  async run() {
    console.log('🔄 Starting Modular CRM Migration...\n');
    
    try {
      await this.createMigrationTrackingTable();
      await this.validatePreMigration();
      await this.executeMigrations();
      await this.validatePostMigration();
      await this.generateReport();
      
      const successCount = this.results.filter(r => r.status === 'SUCCESS').length;
      const totalSteps = this.results.length;
      
      console.log(`\n✅ Modular CRM migration completed!`);
      console.log(`📊 Results: ${successCount}/${totalSteps} steps successful`);
      console.log(`📄 Report saved to: modular-migration-results.json`);
      
      if (successCount < totalSteps) {
        console.log(`\n⚠️  Some steps failed. Check the report for details.`);
        console.log(`🔄 Run rollback if needed: npm run migrate:rollback`);
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      console.log('🔄 Consider running rollback: npm run migrate:rollback');
      throw error;
    } finally {
      await sql.end();
    }
  }

  private async createMigrationTrackingTable() {
    console.log('📋 Setting up migration tracking...');
    
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version TEXT PRIMARY KEY,
          description TEXT,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log('   ✅ Migration tracking table ready');
    } catch (error) {
      console.log('   ⚠️  Migration tracking table already exists');
    }
  }

  private async validatePreMigration() {
    console.log('🔍 Validating pre-migration state...');
    
    try {
      // Check if new tables already exist
      const existingTables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('contacts', 'opportunities', 'activities', 'insurance_profiles')
      `;
      
      if (existingTables.length > 0) {
        console.log(`   ⚠️  Some new tables already exist: ${existingTables.map(t => t.table_name).join(', ')}`);
        console.log('   🔄 This might be a re-run. Proceeding with caution...');
      }
      
      // Check existing data counts
      const dataCounts = await this.getDataCounts();
      console.log('   📊 Current data counts:');
      Object.entries(dataCounts).forEach(([table, count]) => {
        console.log(`      ${table}: ${count} records`);
      });
      
    } catch (error) {
      console.log('   ⚠️  Pre-migration validation had issues:', error);
    }
  }

  private async executeMigrations() {
    console.log('🚀 Executing migration steps...\n');
    
    for (const step of this.migrationSteps) {
      await this.executeStep(step);
    }
  }

  private async executeStep(step: MigrationStep) {
    console.log(`   🔄 ${step.name}...`);
    
    const startTime = Date.now();
    
    try {
      // Check if already executed
      const existing = await sql`
        SELECT version FROM schema_migrations WHERE version = ${step.id}
      `;
      
      if (existing.length > 0) {
        console.log(`      ⏭️  Already executed - skipping`);
        this.results.push({
          step: step.id,
          status: 'SKIPPED',
          execution_time_ms: Date.now() - startTime
        });
        return;
      }
      
      // Read and execute migration file
      const migrationSQL = readFileSync(step.file, 'utf8');
      
      await sql.begin(async (tx) => {
        // Execute the migration
        await tx.unsafe(migrationSQL);
        
        // Record the migration
        await tx`
          INSERT INTO schema_migrations (version, description)
          VALUES (${step.id}, ${step.description})
        `;
      });
      
      const executionTime = Date.now() - startTime;
      
      console.log(`      ✅ Completed (${executionTime}ms)`);
      
      this.results.push({
        step: step.id,
        status: 'SUCCESS',
        execution_time_ms: executionTime
      });
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      console.log(`      ❌ Failed: ${error}`);
      
      this.results.push({
        step: step.id,
        status: 'FAILED',
        execution_time_ms: executionTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error; // Stop migration on failure
    }
  }

  private async validatePostMigration() {
    console.log('🔍 Validating post-migration state...');
    
    try {
      // Check new table counts
      const newDataCounts = await this.getNewDataCounts();
      console.log('   📊 New table data counts:');
      Object.entries(newDataCounts).forEach(([table, count]) => {
        console.log(`      ${table}: ${count} records`);
      });
      
      // Validate data integrity
      await this.validateDataIntegrity();
      
    } catch (error) {
      console.log('   ⚠️  Post-migration validation had issues:', error);
    }
  }

  private async getDataCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    
    try {
      const tables = ['users', 'leads', 'clients', 'communications', 'quotes'];
      
      for (const table of tables) {
        try {
          const result = await sql.unsafe(`SELECT COUNT(*) as count FROM ${table}`);
          counts[table] = parseInt(result[0].count);
        } catch (error) {
          counts[table] = 0;
        }
      }
    } catch (error) {
      console.log('   ⚠️  Could not get data counts:', error);
    }
    
    return counts;
  }

  private async getNewDataCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    
    try {
      const tables = ['contacts', 'opportunities', 'activities', 'insurance_profiles', 'insurance_quotes'];
      
      for (const table of tables) {
        try {
          const result = await sql.unsafe(`SELECT COUNT(*) as count FROM ${table}`);
          counts[table] = parseInt(result[0].count);
        } catch (error) {
          counts[table] = 0;
        }
      }
    } catch (error) {
      console.log('   ⚠️  Could not get new data counts:', error);
    }
    
    return counts;
  }

  private async validateDataIntegrity() {
    console.log('   🔍 Validating data integrity...');
    
    try {
      // Check for orphaned records
      const orphanedActivities = await sql`
        SELECT COUNT(*) as count 
        FROM activities a 
        WHERE NOT EXISTS (SELECT 1 FROM contacts c WHERE c.id = a.contact_id)
      `;
      
      const orphanedOpportunities = await sql`
        SELECT COUNT(*) as count 
        FROM opportunities o 
        WHERE NOT EXISTS (SELECT 1 FROM contacts c WHERE c.id = o.contact_id)
      `;
      
      if (parseInt(orphanedActivities[0].count) > 0) {
        console.log(`   ⚠️  Found ${orphanedActivities[0].count} orphaned activities`);
      }
      
      if (parseInt(orphanedOpportunities[0].count) > 0) {
        console.log(`   ⚠️  Found ${orphanedOpportunities[0].count} orphaned opportunities`);
      }
      
      // Check email uniqueness
      const duplicateEmails = await sql`
        SELECT email, COUNT(*) as count 
        FROM contacts 
        WHERE email IS NOT NULL 
        GROUP BY email 
        HAVING COUNT(*) > 1
      `;
      
      if (duplicateEmails.length > 0) {
        console.log(`   ⚠️  Found ${duplicateEmails.length} duplicate email addresses`);
      }
      
      console.log('   ✅ Data integrity validation completed');
      
    } catch (error) {
      console.log('   ⚠️  Data integrity validation failed:', error);
    }
  }

  private async generateReport() {
    console.log('📄 Generating migration report...');
    
    const report = {
      generated_at: new Date().toISOString(),
      migration_type: 'modular_crm_transformation',
      summary: {
        total_steps: this.results.length,
        successful_steps: this.results.filter(r => r.status === 'SUCCESS').length,
        failed_steps: this.results.filter(r => r.status === 'FAILED').length,
        skipped_steps: this.results.filter(r => r.status === 'SKIPPED').length,
        total_execution_time_ms: this.results.reduce((sum, r) => sum + r.execution_time_ms, 0),
        success_rate: ((this.results.filter(r => r.status === 'SUCCESS').length / this.results.length) * 100).toFixed(1)
      },
      steps: this.migrationSteps.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        result: this.results.find(r => r.step === step.id)
      })),
      data_counts: {
        pre_migration: await this.getDataCounts(),
        post_migration: await this.getNewDataCounts()
      }
    };
    
    // Save detailed JSON report
    writeFileSync('modular-migration-results.json', JSON.stringify(report, null, 2));
  }
}

// Run the migration
if (require.main === module) {
  const runner = new ModularMigrationRunner();
  runner.run().catch(console.error);
}

export { ModularMigrationRunner };
