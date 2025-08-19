/**
 * 🏥 Health Check API - Unified Schema Validation
 * Verifies database connectivity and schema integrity
 */

import { NextResponse } from 'next/server';
import { db, contacts, workspaces } from '@/lib/drizzle/db';
import { count } from 'drizzle-orm';

export async function GET() {
  try {
    // Test database connectivity
    const startTime = Date.now();
    
    // Test basic queries on unified schema
    const [contactCount] = await db.select({ count: count() }).from(contacts);
    const [workspaceCount] = await db.select({ count: count() }).from(workspaces);
    
    const queryTime = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        queryTime: `${queryTime}ms`,
        schema: 'unified',
        version: '2.0.0'
      },
      tables: {
        contacts: contactCount.count,
        workspaces: workspaceCount.count,
      },
      features: {
        multiTenant: true,
        vectorSearch: true,
        aiReady: true,
        insuranceDomain: true,
      }
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        database: {
          connected: false,
        }
      },
      { status: 500 }
    );
  }
}
