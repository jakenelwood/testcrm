#!/usr/bin/env tsx

/**
 * 🛡️ Constraint Regression Testing Suite
 * 
 * Automated tests to prevent future constraint violations and schema drift.
 * Runs comprehensive validation tests that can be integrated into CI/CD pipeline.
 * 
 * Part of Phase 2: Constraint Remediation
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import { writeFileSync } from 'fs';
import * as schema from '../lib/drizzle/schema';

// Load environment variables
config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require' });
const db = drizzle(sql, { schema });

interface RegressionTest {
  id: string;
  category: 'CONSTRAINT_INTEGRITY' | 'TRIGGER_BEHAVIOR' | 'DATA_CONSISTENCY' | 'API_COMPLIANCE';
  test_name: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  test_function: () => Promise<{ success: boolean; message: string; details?: any }>;
}

interface RegressionResult {
  test_id: string;
  category: string;
  status: 'PASS' | 'FAIL' | 'ERROR';
  message: string;
  execution_time_ms: number;
  details?: any;
}

class ConstraintRegressionTestingSuite {
  private tests: RegressionTest[] = [];
  private results: RegressionResult[] = [];

  async run() {
    console.log('🛡️ Starting Constraint Regression Testing Suite...\n');
    
    try {
      await this.initializeTests();
      await this.executeTests();
      await this.generateReport();
      
      const passedTests = this.results.filter(r => r.status === 'PASS').length;
      const totalTests = this.results.length;
      const successRate = ((passedTests / totalTests) * 100).toFixed(1);
      
      console.log(`\n✅ Regression testing completed!`);
      console.log(`📊 Results: ${passedTests}/${totalTests} tests passed (${successRate}%)`);
      console.log(`📄 Report saved to: constraint-regression-results.json`);
      console.log(`📋 Summary saved to: constraint-regression-summary.md`);
      
      // Exit with error code if any critical tests failed
      const criticalFailures = this.results.filter(r => 
        r.status === 'FAIL' && 
        this.tests.find(t => t.id === r.test_id)?.severity === 'CRITICAL'
      );
      
      if (criticalFailures.length > 0) {
        console.log(`\n❌ ${criticalFailures.length} critical test(s) failed!`);
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ Regression testing failed:', error);
      throw error;
    } finally {
      await sql.end();
    }
  }

  private async initializeTests() {
    console.log('📋 Initializing regression tests...');
    
    // Constraint integrity tests
    this.addConstraintIntegrityTests();
    
    // Trigger behavior tests
    this.addTriggerBehaviorTests();
    
    // Data consistency tests
    this.addDataConsistencyTests();
    
    // API compliance tests
    this.addAPIComplianceTests();
    
    console.log(`   Initialized ${this.tests.length} regression tests`);
  }

  private addConstraintIntegrityTests() {
    // Test critical enum constraints
    this.tests.push({
      id: 'constraint_communications_status_integrity',
      category: 'CONSTRAINT_INTEGRITY',
      test_name: 'Communications Status Constraint Integrity',
      description: 'Verify communications status constraint allows only valid values',
      severity: 'CRITICAL',
      test_function: async () => {
        const constraint = await sql`
          SELECT pg_get_constraintdef(c.oid) as definition
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          JOIN pg_namespace n ON t.relnamespace = n.oid
          WHERE n.nspname = 'public'
          AND t.relname = 'communications'
          AND c.conname = 'communications_status_check';
        `;
        
        if (constraint.length === 0) {
          return { success: false, message: 'Communications status constraint not found' };
        }
        
        const expectedValues = ['Pending', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Replied', 'Failed', 'Bounced'];
        const constraintDef = constraint[0].definition;
        
        for (const value of expectedValues) {
          if (!constraintDef.includes(`'${value}'`)) {
            return { 
              success: false, 
              message: `Missing expected value: ${value}`,
              details: { constraint: constraintDef }
            };
          }
        }
        
        // Check for the problematic 'Completed' value
        if (constraintDef.includes("'Completed'")) {
          return {
            success: false,
            message: 'Constraint contains problematic "Completed" value',
            details: { constraint: constraintDef }
          };
        }
        
        return { success: true, message: 'Communications status constraint is valid' };
      }
    });

    // Test range constraints
    this.tests.push({
      id: 'constraint_leads_priority_range',
      category: 'CONSTRAINT_INTEGRITY',
      test_name: 'Leads Priority Range Constraint',
      description: 'Verify leads ai_follow_up_priority constraint enforces 1-10 range',
      severity: 'HIGH',
      test_function: async () => {
        const constraint = await sql`
          SELECT pg_get_constraintdef(c.oid) as definition
          FROM pg_constraint c
          JOIN pg_class t ON c.conrelid = t.oid
          JOIN pg_namespace n ON t.relnamespace = n.oid
          WHERE n.nspname = 'public'
          AND t.relname = 'leads'
          AND c.conname = 'leads_ai_follow_up_priority_check';
        `;
        
        if (constraint.length === 0) {
          return { success: false, message: 'Leads priority constraint not found' };
        }
        
        const constraintDef = constraint[0].definition;
        const hasMinCheck = constraintDef.includes('>= 1');
        const hasMaxCheck = constraintDef.includes('<= 10');
        
        if (!hasMinCheck || !hasMaxCheck) {
          return {
            success: false,
            message: 'Priority constraint does not enforce 1-10 range',
            details: { constraint: constraintDef }
          };
        }
        
        return { success: true, message: 'Leads priority constraint is valid' };
      }
    });
  }

  private addTriggerBehaviorTests() {
    // Test the fixed communication trigger
    this.tests.push({
      id: 'trigger_communication_creation_behavior',
      category: 'TRIGGER_BEHAVIOR',
      test_name: 'Communication Creation Trigger Behavior',
      description: 'Verify call log trigger creates communication with correct status',
      severity: 'CRITICAL',
      test_function: async () => {
        const triggerFunction = await sql`
          SELECT p.prosrc as function_body
          FROM pg_trigger t
          JOIN pg_class c ON t.tgrelid = c.oid
          JOIN pg_namespace n ON c.relnamespace = n.oid
          JOIN pg_proc p ON t.tgfoid = p.oid
          WHERE n.nspname = 'public'
          AND c.relname = 'call_logs'
          AND t.tgname = 'create_communication_from_call_log';
        `;
        
        if (triggerFunction.length === 0) {
          return { success: false, message: 'Communication creation trigger not found' };
        }
        
        const functionBody = triggerFunction[0].function_body;
        
        // Check that trigger uses 'Delivered' and not 'Completed'
        if (functionBody.includes("'Completed'")) {
          return {
            success: false,
            message: 'Trigger still uses problematic "Completed" status',
            details: { function_body: functionBody }
          };
        }
        
        if (!functionBody.includes("'Delivered'")) {
          return {
            success: false,
            message: 'Trigger does not use expected "Delivered" status',
            details: { function_body: functionBody }
          };
        }
        
        return { success: true, message: 'Communication creation trigger is correctly configured' };
      }
    });

    // Test audit field triggers
    this.tests.push({
      id: 'trigger_audit_fields_behavior',
      category: 'TRIGGER_BEHAVIOR',
      test_name: 'Audit Fields Trigger Behavior',
      description: 'Verify audit field triggers exist for critical tables',
      severity: 'MEDIUM',
      test_function: async () => {
        const criticalTables = ['leads', 'clients', 'communications', 'quotes'];
        const missingTriggers = [];
        
        for (const table of criticalTables) {
          const trigger = await sql`
            SELECT t.tgname
            FROM pg_trigger t
            JOIN pg_class c ON t.tgrelid = c.oid
            JOIN pg_namespace n ON c.relnamespace = n.oid
            WHERE n.nspname = 'public'
            AND c.relname = ${table}
            AND t.tgname LIKE '%audit_fields%';
          `;
          
          if (trigger.length === 0) {
            missingTriggers.push(table);
          }
        }
        
        if (missingTriggers.length > 0) {
          return {
            success: false,
            message: `Missing audit field triggers for: ${missingTriggers.join(', ')}`,
            details: { missing_triggers: missingTriggers }
          };
        }
        
        return { success: true, message: 'All critical tables have audit field triggers' };
      }
    });
  }

  private addDataConsistencyTests() {
    // Test foreign key consistency
    this.tests.push({
      id: 'data_foreign_key_consistency',
      category: 'DATA_CONSISTENCY',
      test_name: 'Foreign Key Consistency',
      description: 'Verify no orphaned records exist in critical relationships',
      severity: 'HIGH',
      test_function: async () => {
        // Check for orphaned communications
        const orphanedComms = await sql`
          SELECT COUNT(*) as count
          FROM communications c
          WHERE c.lead_id IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM leads l WHERE l.id = c.lead_id);
        `;
        
        if (parseInt(orphanedComms[0].count) > 0) {
          return {
            success: false,
            message: `Found ${orphanedComms[0].count} orphaned communication records`,
            details: { orphaned_communications: orphanedComms[0].count }
          };
        }
        
        // Check for orphaned quotes
        const orphanedQuotes = await sql`
          SELECT COUNT(*) as count
          FROM quotes q
          WHERE NOT EXISTS (SELECT 1 FROM leads l WHERE l.id = q.lead_id);
        `;
        
        if (parseInt(orphanedQuotes[0].count) > 0) {
          return {
            success: false,
            message: `Found ${orphanedQuotes[0].count} orphaned quote records`,
            details: { orphaned_quotes: orphanedQuotes[0].count }
          };
        }
        
        return { success: true, message: 'No orphaned records found' };
      }
    });

    // Test enum value consistency
    this.tests.push({
      id: 'data_enum_value_consistency',
      category: 'DATA_CONSISTENCY',
      test_name: 'Enum Value Consistency',
      description: 'Verify all enum values in data match constraint definitions',
      severity: 'CRITICAL',
      test_function: async () => {
        // Check communications status values
        const invalidCommStatuses = await sql`
          SELECT DISTINCT status
          FROM communications
          WHERE status NOT IN ('Pending', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Replied', 'Failed', 'Bounced');
        `;
        
        if (invalidCommStatuses.length > 0) {
          return {
            success: false,
            message: `Invalid communication status values found: ${invalidCommStatuses.map(r => r.status).join(', ')}`,
            details: { invalid_statuses: invalidCommStatuses }
          };
        }
        
        // Check leads status values
        const invalidLeadStatuses = await sql`
          SELECT DISTINCT status
          FROM leads
          WHERE status NOT IN ('New', 'Contacted', 'Qualified', 'Quoted', 'Sold', 'Lost', 'Hibernated');
        `;
        
        if (invalidLeadStatuses.length > 0) {
          return {
            success: false,
            message: `Invalid lead status values found: ${invalidLeadStatuses.map(r => r.status).join(', ')}`,
            details: { invalid_statuses: invalidLeadStatuses }
          };
        }
        
        return { success: true, message: 'All enum values are consistent with constraints' };
      }
    });
  }

  private addAPIComplianceTests() {
    // Test API endpoint availability
    this.tests.push({
      id: 'api_critical_endpoints_available',
      category: 'API_COMPLIANCE',
      test_name: 'Critical API Endpoints Available',
      description: 'Verify all critical API endpoints exist and are accessible',
      severity: 'HIGH',
      test_function: async () => {
        const fs = await import('fs');
        const path = await import('path');
        
        const criticalEndpoints = [
          'app/api/leads/route.ts',
          'app/api/clients/route.ts',
          'app/api/communications/route.ts',
          'app/api/quotes/route.ts',
          'app/api/pipelines/route.ts'
        ];
        
        const missingEndpoints = [];
        
        for (const endpoint of criticalEndpoints) {
          if (!fs.existsSync(endpoint)) {
            missingEndpoints.push(endpoint);
          }
        }
        
        if (missingEndpoints.length > 0) {
          return {
            success: false,
            message: `Missing critical API endpoints: ${missingEndpoints.join(', ')}`,
            details: { missing_endpoints: missingEndpoints }
          };
        }
        
        return { success: true, message: 'All critical API endpoints are available' };
      }
    });

    // Test schema export integrity
    this.tests.push({
      id: 'api_schema_export_integrity',
      category: 'API_COMPLIANCE',
      test_name: 'Schema Export Integrity',
      description: 'Verify Drizzle schema exports are complete and accessible',
      severity: 'MEDIUM',
      test_function: async () => {
        try {
          const schemaKeys = Object.keys(schema);
          const expectedTables = ['users', 'leads', 'clients', 'communications', 'quotes'];
          const missingTables = [];
          
          for (const table of expectedTables) {
            if (!schemaKeys.includes(table)) {
              missingTables.push(table);
            }
          }
          
          if (missingTables.length > 0) {
            return {
              success: false,
              message: `Missing schema exports: ${missingTables.join(', ')}`,
              details: { missing_tables: missingTables, available_exports: schemaKeys }
            };
          }
          
          return { success: true, message: 'Schema exports are complete' };
        } catch (error) {
          return {
            success: false,
            message: `Schema import error: ${error}`,
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          };
        }
      }
    });
  }

  private async executeTests() {
    console.log('🔬 Executing regression tests...');
    
    let passedTests = 0;
    let failedTests = 0;
    
    for (const test of this.tests) {
      const startTime = Date.now();
      
      try {
        console.log(`   🧪 ${test.test_name}...`);
        const result = await test.test_function();
        const executionTime = Date.now() - startTime;
        
        this.results.push({
          test_id: test.id,
          category: test.category,
          status: result.success ? 'PASS' : 'FAIL',
          message: result.message,
          execution_time_ms: executionTime,
          details: result.details
        });
        
        if (result.success) {
          passedTests++;
          console.log(`      ✅ PASS (${executionTime}ms)`);
        } else {
          failedTests++;
          console.log(`      ❌ FAIL: ${result.message} (${executionTime}ms)`);
        }
        
      } catch (error) {
        const executionTime = Date.now() - startTime;
        
        this.results.push({
          test_id: test.id,
          category: test.category,
          status: 'ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          execution_time_ms: executionTime
        });
        
        failedTests++;
        console.log(`      💥 ERROR: ${error} (${executionTime}ms)`);
      }
    }
    
    console.log(`\n📊 Test execution summary:`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    console.log(`   📈 Success rate: ${((passedTests / this.tests.length) * 100).toFixed(1)}%`);
  }

  private async generateReport() {
    console.log('📄 Generating regression test report...');
    
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_tests: this.tests.length,
        passed: this.results.filter(r => r.status === 'PASS').length,
        failed: this.results.filter(r => r.status === 'FAIL').length,
        errors: this.results.filter(r => r.status === 'ERROR').length,
        success_rate: ((this.results.filter(r => r.status === 'PASS').length / this.results.length) * 100).toFixed(1),
        critical_failures: this.results.filter(r => 
          r.status === 'FAIL' && 
          this.tests.find(t => t.id === r.test_id)?.severity === 'CRITICAL'
        ).length,
        categories: {
          constraint_integrity: this.results.filter(r => r.category === 'CONSTRAINT_INTEGRITY').length,
          trigger_behavior: this.results.filter(r => r.category === 'TRIGGER_BEHAVIOR').length,
          data_consistency: this.results.filter(r => r.category === 'DATA_CONSISTENCY').length,
          api_compliance: this.results.filter(r => r.category === 'API_COMPLIANCE').length
        }
      },
      tests: this.tests.map(t => ({
        id: t.id,
        category: t.category,
        test_name: t.test_name,
        description: t.description,
        severity: t.severity
      })),
      results: this.results
    };
    
    // Save detailed JSON report
    writeFileSync('constraint-regression-results.json', JSON.stringify(report, null, 2));
    
    // Generate markdown summary
    const summary = this.generateMarkdownSummary(report);
    writeFileSync('constraint-regression-summary.md', summary);
  }

  private generateMarkdownSummary(report: any): string {
    const failedTests = this.results.filter(r => r.status === 'FAIL');
    const criticalFailures = failedTests.filter(r => 
      this.tests.find(t => t.id === r.test_id)?.severity === 'CRITICAL'
    );
    
    return `# 🛡️ Constraint Regression Testing Suite Results

Generated: ${report.generated_at}

## 📊 Summary
- **Total Tests**: ${report.summary.total_tests}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Errors**: ${report.summary.errors}
- **Success Rate**: ${report.summary.success_rate}%
- **Critical Failures**: ${report.summary.critical_failures}

## 📋 Test Categories
- **Constraint Integrity**: ${report.summary.categories.constraint_integrity} tests
- **Trigger Behavior**: ${report.summary.categories.trigger_behavior} tests
- **Data Consistency**: ${report.summary.categories.data_consistency} tests
- **API Compliance**: ${report.summary.categories.api_compliance} tests

## 🚨 Critical Failures

${criticalFailures.map(failure => {
  const test = this.tests.find(t => t.id === failure.test_id);
  return `
### ${test?.test_name}
- **Category**: ${failure.category}
- **Message**: ${failure.message}
- **Execution Time**: ${failure.execution_time_ms}ms
- **Details**: ${JSON.stringify(failure.details, null, 2)}
`;
}).join('\n')}

## ⚠️ Failed Tests

${failedTests.filter(f => !criticalFailures.includes(f)).map(failure => {
  const test = this.tests.find(t => t.id === failure.test_id);
  return `
### ${test?.test_name}
- **Category**: ${failure.category}
- **Message**: ${failure.message}
- **Execution Time**: ${failure.execution_time_ms}ms
`;
}).join('\n')}

## 🎯 Recommendations

${report.summary.critical_failures > 0 ? 
  '1. **Address Critical Failures**: Fix all critical test failures immediately before deployment\n' : 
  '1. **No Critical Issues**: All critical regression tests are passing\n'
}
2. **CI/CD Integration**: Add this test suite to your continuous integration pipeline
3. **Regular Execution**: Run regression tests before any schema changes
4. **Monitoring**: Set up alerts for regression test failures in production
5. **Documentation**: Keep test documentation updated with schema changes

## 🔧 Usage

Run the regression test suite with:
\`\`\`bash
npm run test:regression
\`\`\`

For CI/CD integration, ensure the process exits with error code 1 if critical tests fail.
`;
  }
}

// Run the constraint regression testing suite
if (require.main === module) {
  const suite = new ConstraintRegressionTestingSuite();
  suite.run().catch(console.error);
}

export { ConstraintRegressionTestingSuite };
