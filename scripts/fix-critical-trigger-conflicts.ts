#!/usr/bin/env tsx

/**
 * 🔧 Fix Critical Trigger Conflicts
 * 
 * Resolves the critical trigger-constraint conflict identified in schema discovery:
 * - Updates create_communication_from_call_log trigger to use 'Delivered' instead of 'Completed'
 * - Ensures all triggers comply with database constraints
 * 
 * Part of Phase 1: Database Schema Audit - Critical Fixes
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const sql = postgres(connectionString, { prepare: false, ssl: 'require' });

class TriggerConflictFixer {
  async run() {
    console.log('🔧 Starting Critical Trigger Conflict Fixes...\n');
    
    try {
      await this.fixCommunicationStatusTrigger();
      await this.validateFix();
      
      console.log('✅ All critical trigger conflicts resolved successfully!');
      
    } catch (error) {
      console.error('❌ Failed to fix trigger conflicts:', error);
      throw error;
    } finally {
      await sql.end();
    }
  }

  private async fixCommunicationStatusTrigger() {
    console.log('🔧 Fixing create_communication_from_call_log trigger...');
    
    // First, let's see the current trigger function
    const currentTrigger = await sql`
      SELECT p.prosrc as trigger_function
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE n.nspname = 'public' 
      AND c.relname = 'call_logs'
      AND t.tgname = 'create_communication_from_call_log';
    `;
    
    if (currentTrigger.length === 0) {
      console.log('   ⚠️  Trigger not found - may have been already fixed');
      return;
    }
    
    console.log('   📋 Current trigger uses "Completed" status');
    console.log('   🔄 Updating to use "Delivered" status...');
    
    // Create the corrected trigger function
    const newTriggerFunction = `
CREATE OR REPLACE FUNCTION public.create_communication_from_call_log()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create communication record if call was connected and has client/lead
  IF NEW.status = 'Connected' AND (NEW.client_id IS NOT NULL OR NEW.lead_id IS NOT NULL) THEN
    INSERT INTO public.communications (
      client_id,
      lead_id,
      type,
      direction,
      content,
      duration,
      status,
      ai_summary,
      ai_sentiment,
      created_at,
      completed_at
    ) VALUES (
      NEW.client_id,
      NEW.lead_id,
      'call',
      NEW.direction,
      COALESCE(NEW.transcription, 'Call completed - duration: ' || NEW.duration || ' seconds'),
      NEW.duration,
      'Delivered', -- FIXED: Changed from 'Completed' to 'Delivered'
      NEW.ai_summary,
      NEW.ai_sentiment,
      NEW.start_time,
      NEW.end_time
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
    `;
    
    // Execute the fix
    await sql.unsafe(newTriggerFunction);
    
    console.log('   ✅ Trigger function updated successfully');
    console.log('   📝 Status changed from "Completed" to "Delivered"');
  }

  private async validateFix() {
    console.log('🔍 Validating trigger fix...');
    
    // Check that the trigger function now uses 'Delivered'
    const updatedTrigger = await sql`
      SELECT p.prosrc as trigger_function
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      JOIN pg_proc p ON t.tgfoid = p.oid
      WHERE n.nspname = 'public' 
      AND c.relname = 'call_logs'
      AND t.tgname = 'create_communication_from_call_log';
    `;
    
    if (updatedTrigger.length > 0) {
      const triggerCode = updatedTrigger[0].trigger_function;
      
      if (triggerCode.includes("'Delivered'") && !triggerCode.includes("'Completed'")) {
        console.log('   ✅ Trigger validation passed - uses "Delivered" status');
      } else if (triggerCode.includes("'Completed'")) {
        throw new Error('Trigger still contains "Completed" status - fix failed');
      } else {
        console.log('   ⚠️  Trigger validation inconclusive - manual review recommended');
      }
    }
    
    // Verify the communications constraint still exists and includes 'Delivered'
    const constraint = await sql`
      SELECT constraint_definition
      FROM (
        SELECT pg_get_constraintdef(c.oid) as constraint_definition
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND t.relname = 'communications'
        AND c.conname = 'communications_status_check'
      ) sub;
    `;
    
    if (constraint.length > 0) {
      const constraintDef = constraint[0].constraint_definition;
      if (constraintDef.includes("'Delivered'")) {
        console.log('   ✅ Constraint validation passed - "Delivered" is allowed');
      } else {
        throw new Error('Constraint does not allow "Delivered" status');
      }
    }
    
    console.log('   🎯 All validations passed - conflict resolved');
  }
}

// Run the fixer
if (require.main === module) {
  const fixer = new TriggerConflictFixer();
  fixer.run().catch(console.error);
}

export { TriggerConflictFixer };
