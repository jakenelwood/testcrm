#!/usr/bin/env tsx

/**
 * 🔍 Database Schema Discovery Tool
 * 
 * Comprehensive tool to extract and analyze database reality vs application expectations.
 * Identifies constraint mismatches, trigger conflicts, and schema drift issues.
 * 
 * Part of Phase 1: Database Schema Audit
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { writeFileSync } from 'fs';
import * as schema from '../lib/drizzle/schema';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require' });
const db = drizzle(sql, { schema });

interface ConstraintInfo {
  schema_name: string;
  table_name: string;
  constraint_name: string;
  constraint_type: string;
  constraint_definition: string;
}

interface TriggerInfo {
  schema_name: string;
  table_name: string;
  trigger_name: string;
  tgtype: number;
  trigger_function: string;
}

interface EnumInfo {
  enum_name: string;
  enum_values: string[];
}

interface TableInfo {
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string;
  constraint_type?: string;
}

class SchemaDiscoveryTool {
  private constraints: ConstraintInfo[] = [];
  private triggers: TriggerInfo[] = [];
  private enums: EnumInfo[] = [];
  private tables: TableInfo[] = [];
  private conflicts: any[] = [];

  async run() {
    console.log('🔍 Starting Database Schema Discovery...\n');
    
    try {
      await this.extractConstraints();
      await this.extractTriggers();
      await this.extractEnums();
      await this.extractTableInfo();
      await this.analyzeConflicts();
      await this.generateReport();
      
      console.log('✅ Schema discovery completed successfully!');
      console.log('📄 Report generated: schema-discovery-report.json');
      console.log('📋 Conflicts summary: schema-conflicts-summary.md');
      
    } catch (error) {
      console.error('❌ Schema discovery failed:', error);
      throw error;
    } finally {
      await sql.end();
    }
  }

  private async extractConstraints() {
    console.log('📋 Extracting database constraints...');
    
    const result = await sql`
      SELECT 
        n.nspname as schema_name,
        t.relname as table_name,
        c.conname as constraint_name,
        c.contype as constraint_type,
        pg_get_constraintdef(c.oid) as constraint_definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = 'public'
      ORDER BY t.relname, c.contype;
    `;
    
    this.constraints = result as ConstraintInfo[];
    console.log(`   Found ${this.constraints.length} constraints`);
  }

  private async extractTriggers() {
    console.log('⚡ Extracting database triggers...');
    
    const result = await sql`
      SELECT 
        n.nspname as schema_name,
        c.relname as table_name,
        t.tgname as trigger_name,
        t.tgtype,
        p.prosrc as trigger_function
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      LEFT JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE n.nspname = 'public' AND NOT t.tgisinternal
      ORDER BY c.relname, t.tgname;
    `;
    
    this.triggers = result as TriggerInfo[];
    console.log(`   Found ${this.triggers.length} triggers`);
  }

  private async extractEnums() {
    console.log('📝 Extracting enum types...');
    
    const result = await sql`
      SELECT 
        t.typname as enum_name,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname;
    `;
    
    this.enums = result as EnumInfo[];
    console.log(`   Found ${this.enums.length} enum types`);
  }

  private async extractTableInfo() {
    console.log('🗂️  Extracting table structure...');
    
    const result = await sql`
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        c.column_default
      FROM information_schema.tables t
      JOIN information_schema.columns c ON t.table_name = c.table_name
      WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position;
    `;
    
    this.tables = result as TableInfo[];
    console.log(`   Found ${this.tables.length} columns across tables`);
  }

  private async analyzeConflicts() {
    console.log('🔍 Analyzing constraint-trigger conflicts...');
    
    // Find the critical "Completed" status conflict
    const communicationsStatusConstraint = this.constraints.find(c => 
      c.table_name === 'communications' && c.constraint_name === 'communications_status_check'
    );
    
    const callLogTrigger = this.triggers.find(t => 
      t.table_name === 'call_logs' && t.trigger_name === 'create_communication_from_call_log'
    );
    
    if (communicationsStatusConstraint && callLogTrigger) {
      // Extract allowed values from constraint
      const allowedValues = this.extractEnumFromConstraint(communicationsStatusConstraint.constraint_definition);
      
      // Check if trigger uses 'Completed' which is not in allowed values
      if (callLogTrigger.trigger_function.includes("'Completed'") && !allowedValues.includes('Completed')) {
        this.conflicts.push({
          type: 'CRITICAL_TRIGGER_CONSTRAINT_CONFLICT',
          severity: 'HIGH',
          table: 'communications',
          trigger: callLogTrigger.trigger_name,
          constraint: communicationsStatusConstraint.constraint_name,
          issue: "Trigger sets status to 'Completed' but constraint only allows: " + allowedValues.join(', '),
          impact: 'Data insertion failures when call logs create communication records',
          recommendation: "Either add 'Completed' to constraint or change trigger to use 'Delivered'"
        });
      }
    }
    
    console.log(`   Found ${this.conflicts.length} critical conflicts`);
  }

  private extractEnumFromConstraint(constraintDef: string): string[] {
    // Extract enum values from CHECK constraint like: CHECK ((status = ANY (ARRAY['Pending'::text, 'Sent'::text, ...])))
    const match = constraintDef.match(/ARRAY\[(.*?)\]/);
    if (match) {
      return match[1]
        .split(',')
        .map(v => v.trim().replace(/['"]::text/g, '').replace(/['"]/g, ''))
        .filter(v => v.length > 0);
    }
    return [];
  }

  private async generateReport() {
    console.log('📄 Generating comprehensive report...');
    
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_constraints: this.constraints.length,
        total_triggers: this.triggers.length,
        total_enums: this.enums.length,
        total_conflicts: this.conflicts.length,
        critical_conflicts: this.conflicts.filter(c => c.severity === 'HIGH').length
      },
      constraints: this.constraints,
      triggers: this.triggers,
      enums: this.enums,
      conflicts: this.conflicts
    };
    
    // Save detailed JSON report
    writeFileSync('schema-discovery-report.json', JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const markdownSummary = this.generateMarkdownSummary();
    writeFileSync('schema-conflicts-summary.md', markdownSummary);
  }

  private generateMarkdownSummary(): string {
    return `# 🔍 Database Schema Discovery Report

Generated: ${new Date().toISOString()}

## 📊 Summary
- **Total Constraints**: ${this.constraints.length}
- **Total Triggers**: ${this.triggers.length}
- **Total Enums**: ${this.enums.length}
- **Total Conflicts**: ${this.conflicts.length}
- **Critical Conflicts**: ${this.conflicts.filter(c => c.severity === 'HIGH').length}

## 🚨 Critical Conflicts

${this.conflicts.map(conflict => `
### ${conflict.type}
- **Severity**: ${conflict.severity}
- **Table**: ${conflict.table}
- **Issue**: ${conflict.issue}
- **Impact**: ${conflict.impact}
- **Recommendation**: ${conflict.recommendation}
`).join('\n')}

## 📋 Constraint Summary by Table

${this.getConstraintsByTable()}

## ⚡ Trigger Summary by Table

${this.getTriggersByTable()}

## 🎯 Next Steps

1. **Fix Critical Conflicts**: Address all HIGH severity conflicts immediately
2. **Update Drizzle Schema**: Align schema definitions with database reality
3. **Test Data Operations**: Validate all CRUD operations work correctly
4. **Update Documentation**: Document all constraints and business rules
`;
  }

  private getConstraintsByTable(): string {
    const tableGroups = this.constraints.reduce((acc, constraint) => {
      if (!acc[constraint.table_name]) acc[constraint.table_name] = [];
      acc[constraint.table_name].push(constraint);
      return acc;
    }, {} as Record<string, ConstraintInfo[]>);

    return Object.entries(tableGroups)
      .map(([table, constraints]) => `
### ${table}
${constraints.map(c => `- **${c.constraint_name}** (${c.constraint_type}): ${c.constraint_definition}`).join('\n')}
`).join('\n');
  }

  private getTriggersByTable(): string {
    const tableGroups = this.triggers.reduce((acc, trigger) => {
      if (!acc[trigger.table_name]) acc[trigger.table_name] = [];
      acc[trigger.table_name].push(trigger);
      return acc;
    }, {} as Record<string, TriggerInfo[]>);

    return Object.entries(tableGroups)
      .map(([table, triggers]) => `
### ${table}
${triggers.map(t => `- **${t.trigger_name}**: ${t.trigger_function.substring(0, 100)}...`).join('\n')}
`).join('\n');
  }
}

// Run the tool
if (require.main === module) {
  const tool = new SchemaDiscoveryTool();
  tool.run().catch(console.error);
}

export { SchemaDiscoveryTool };
