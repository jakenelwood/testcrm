#!/usr/bin/env tsx

/**
 * 🔄 Modular CRM Migration Rollback
 * 
 * Safely rolls back the modular CRM migration, preserving original data.
 * Only removes new tables and structures, keeps original tables intact.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require' });

interface RollbackResult {
  step: string;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  execution_time_ms: number;
  error?: string;
}

class ModularMigrationRollback {
  private results: RollbackResult[] = [];

  async run() {
    console.log('🔄 Starting Modular CRM Migration Rollback...\n');
    
    try {
      await this.validateRollbackSafety();
      await this.performRollback();
      await this.cleanupMigrationTracking();
      await this.generateRollbackReport();
      
      const successCount = this.results.filter(r => r.status === 'SUCCESS').length;
      const totalSteps = this.results.length;
      
      console.log(`\n✅ Modular CRM migration rollback completed!`);
      console.log(`📊 Results: ${successCount}/${totalSteps} steps successful`);
      console.log(`📄 Report saved to: modular-migration-rollback-results.json`);
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    } finally {
      await sql.end();
    }
  }

  private async validateRollbackSafety() {
    console.log('🔍 Validating rollback safety...');
    
    try {
      // Check if original tables still exist
      const originalTables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('leads', 'clients', 'communications', 'quotes')
      `;
      
      console.log(`   📋 Original tables found: ${originalTables.map(t => t.table_name).join(', ')}`);
      
      if (originalTables.length < 4) {
        console.log('   ⚠️  Some original tables are missing. Rollback may not restore full functionality.');
      }
      
      // Check if new tables exist
      const newTables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('contacts', 'opportunities', 'activities', 'insurance_profiles', 'insurance_quotes', 'insurance_policies', 'insurance_claims')
      `;
      
      console.log(`   📋 New tables to remove: ${newTables.map(t => t.table_name).join(', ')}`);
      
      if (newTables.length === 0) {
        console.log('   ℹ️  No new tables found. Migration may not have been run.');
      }
      
    } catch (error) {
      console.log('   ⚠️  Rollback safety validation had issues:', error);
    }
  }

  private async performRollback() {
    console.log('🗑️  Performing rollback operations...\n');
    
    // Rollback in reverse order
    await this.rollbackDataMigration();
    await this.rollbackInsuranceExtensionTables();
    await this.rollbackCoreCRMTables();
  }

  private async rollbackDataMigration() {
    console.log('   🔄 Rolling back data migration...');
    
    const startTime = Date.now();
    
    try {
      await sql.begin(async (tx) => {
        // We don't need to restore data since we kept original tables
        // Just clean up any migration-specific data if needed
        
        console.log('      ℹ️  Data migration rollback: Original tables preserved');
      });
      
      this.results.push({
        step: 'data_migration_rollback',
        status: 'SUCCESS',
        execution_time_ms: Date.now() - startTime
      });
      
      console.log('      ✅ Data migration rollback completed');
      
    } catch (error) {
      this.results.push({
        step: 'data_migration_rollback',
        status: 'FAILED',
        execution_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.log(`      ❌ Data migration rollback failed: ${error}`);
    }
  }

  private async rollbackInsuranceExtensionTables() {
    console.log('   🔄 Rolling back insurance extension tables...');
    
    const startTime = Date.now();
    
    try {
      await sql.begin(async (tx) => {
        // Drop insurance extension tables in dependency order
        await tx`DROP TABLE IF EXISTS insurance_claims CASCADE`;
        await tx`DROP TABLE IF EXISTS insurance_policies CASCADE`;
        await tx`DROP TABLE IF EXISTS insurance_quotes CASCADE`;
        await tx`DROP TABLE IF EXISTS insurance_profiles CASCADE`;
        
        console.log('      🗑️  Dropped insurance extension tables');
      });
      
      this.results.push({
        step: 'insurance_extension_rollback',
        status: 'SUCCESS',
        execution_time_ms: Date.now() - startTime
      });
      
      console.log('      ✅ Insurance extension tables rollback completed');
      
    } catch (error) {
      this.results.push({
        step: 'insurance_extension_rollback',
        status: 'FAILED',
        execution_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.log(`      ❌ Insurance extension tables rollback failed: ${error}`);
    }
  }

  private async rollbackCoreCRMTables() {
    console.log('   🔄 Rolling back core CRM tables...');
    
    const startTime = Date.now();
    
    try {
      await sql.begin(async (tx) => {
        // Drop core CRM tables in dependency order
        await tx`DROP TABLE IF EXISTS activities CASCADE`;
        await tx`DROP TABLE IF EXISTS opportunities CASCADE`;
        await tx`DROP TABLE IF EXISTS contacts CASCADE`;
        
        // Drop the update function if it was created
        await tx`DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE`;
        
        console.log('      🗑️  Dropped core CRM tables');
      });
      
      this.results.push({
        step: 'core_crm_rollback',
        status: 'SUCCESS',
        execution_time_ms: Date.now() - startTime
      });
      
      console.log('      ✅ Core CRM tables rollback completed');
      
    } catch (error) {
      this.results.push({
        step: 'core_crm_rollback',
        status: 'FAILED',
        execution_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      console.log(`      ❌ Core CRM tables rollback failed: ${error}`);
    }
  }

  private async cleanupMigrationTracking() {
    console.log('🧹 Cleaning up migration tracking...');
    
    try {
      // Remove migration records for the modular CRM migration
      await sql`
        DELETE FROM schema_migrations 
        WHERE version IN ('001', '002', '003')
        AND description LIKE '%modular%' OR description LIKE '%CRM%'
      `;
      
      console.log('   ✅ Migration tracking cleaned up');
      
    } catch (error) {
      console.log('   ⚠️  Migration tracking cleanup had issues:', error);
    }
  }

  private async generateRollbackReport() {
    console.log('📄 Generating rollback report...');
    
    const report = {
      generated_at: new Date().toISOString(),
      rollback_type: 'modular_crm_rollback',
      summary: {
        total_steps: this.results.length,
        successful_steps: this.results.filter(r => r.status === 'SUCCESS').length,
        failed_steps: this.results.filter(r => r.status === 'FAILED').length,
        total_execution_time_ms: this.results.reduce((sum, r) => sum + r.execution_time_ms, 0),
        success_rate: ((this.results.filter(r => r.status === 'SUCCESS').length / this.results.length) * 100).toFixed(1)
      },
      rollback_steps: this.results,
      remaining_tables: await this.getRemainingTables(),
      recommendations: [
        'Verify that original tables (leads, clients, communications, quotes) are intact',
        'Check that application functionality works with original schema',
        'Review any custom code that may have been updated for modular structure',
        'Consider re-running migration with fixes if issues were identified'
      ]
    };
    
    // Save detailed JSON report
    writeFileSync('modular-migration-rollback-results.json', JSON.stringify(report, null, 2));
  }

  private async getRemainingTables(): Promise<string[]> {
    try {
      const tables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'sql_%'
        ORDER BY table_name
      `;
      
      return tables.map(t => t.table_name);
    } catch (error) {
      console.log('   ⚠️  Could not get remaining tables:', error);
      return [];
    }
  }
}

// Run the rollback
if (require.main === module) {
  const rollback = new ModularMigrationRollback();
  rollback.run().catch(console.error);
}

export { ModularMigrationRollback };
