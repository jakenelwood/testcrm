// 🗄️ Database Client - Simple but Comprehensive
// Handles connection to our Hetzner PostgreSQL database with full schema support

import { Pool, PoolClient } from 'pg';

// Database connection configuration
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Global connection pool
let pool: Pool | null = null;

/**
 * Get or create the database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  
  return pool;
}

/**
 * Execute a query with automatic connection management
 */
export async function query<T = any>(
  text: string, 
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool();
  
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries in development
    if (process.env.LOG_DATABASE_QUERIES === 'true' || duration > 1000) {
      console.log('Query executed:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: result.rowCount
      });
    }
    
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// =============================================================================
// ORGANIZATION CONTEXT HELPERS
// =============================================================================

/**
 * Get organization context for multi-tenant queries
 */
export function getOrgContext(organizationId: string) {
  return {
    organizationId,
    // Helper to add organization filter to WHERE clauses
    addOrgFilter: (baseWhere: string = '') => {
      const orgFilter = 'organization_id = $org';
      if (!baseWhere.trim()) return `WHERE ${orgFilter}`;
      if (baseWhere.toLowerCase().includes('where')) {
        return `${baseWhere} AND ${orgFilter}`;
      }
      return `${baseWhere} WHERE ${orgFilter}`;
    }
  };
}

// =============================================================================
// COMMON QUERY PATTERNS
// =============================================================================

/**
 * Simple SELECT with organization filtering
 */
export async function selectWithOrg<T = any>(
  table: string,
  organizationId: string,
  where?: string,
  params?: any[]
): Promise<T[]> {
  const orgContext = getOrgContext(organizationId);
  const whereClause = orgContext.addOrgFilter(where);
  
  const allParams = params ? [...params, organizationId] : [organizationId];
  const paramPlaceholders = allParams.map((_, i) => `$${i + 1}`);
  
  // Replace $org with actual parameter placeholder
  const finalWhere = whereClause.replace('$org', paramPlaceholders[paramPlaceholders.length - 1]);
  
  const sql = `SELECT * FROM ${table} ${finalWhere}`;
  const result = await query<T>(sql, allParams);
  return result.rows;
}

/**
 * INSERT with automatic organization assignment
 */
export async function insertWithOrg<T = any>(
  table: string,
  data: Record<string, any>,
  organizationId: string
): Promise<T> {
  const dataWithOrg = { ...data, organization_id: organizationId };
  
  const columns = Object.keys(dataWithOrg);
  const values = Object.values(dataWithOrg);
  const placeholders = values.map((_, i) => `$${i + 1}`);
  
  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders.join(', ')})
    RETURNING *
  `;
  
  const result = await query<T>(sql, values);
  return result.rows[0];
}

/**
 * UPDATE with organization filtering
 */
export async function updateWithOrg<T = any>(
  table: string,
  id: string,
  data: Record<string, any>,
  organizationId: string
): Promise<T | null> {
  const columns = Object.keys(data);
  const values = Object.values(data);
  
  const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');
  const sql = `
    UPDATE ${table} 
    SET ${setClause}, updated_at = NOW()
    WHERE id = $${values.length + 1} AND organization_id = $${values.length + 2}
    RETURNING *
  `;
  
  const result = await query<T>(sql, [...values, id, organizationId]);
  return result.rows[0] || null;
}

/**
 * DELETE with organization filtering
 */
export async function deleteWithOrg(
  table: string,
  id: string,
  organizationId: string
): Promise<boolean> {
  const sql = `
    DELETE FROM ${table} 
    WHERE id = $1 AND organization_id = $2
  `;
  
  const result = await query(sql, [id, organizationId]);
  return (result.rowCount || 0) > 0;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Test database connection and schema
 */
export async function healthCheck(): Promise<{
  connected: boolean;
  schemaVersion: string;
  tableCount: number;
  error?: string;
}> {
  try {
    // Test basic connection
    const versionResult = await query('SELECT version()');
    
    // Check schema version
    const schemaResult = await query(`
      SELECT version, applied_at 
      FROM schema_versions 
      ORDER BY applied_at DESC 
      LIMIT 1
    `);
    
    // Count tables
    const tableResult = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    return {
      connected: true,
      schemaVersion: schemaResult.rows[0]?.version || 'Unknown',
      tableCount: parseInt(tableResult.rows[0]?.count || '0'),
    };
  } catch (error) {
    return {
      connected: false,
      schemaVersion: 'Unknown',
      tableCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize database connection and verify schema
 */
export async function initializeDatabase(): Promise<void> {
  try {
    const health = await healthCheck();
    
    if (!health.connected) {
      throw new Error(`Database connection failed: ${health.error}`);
    }
    
    console.log('✅ Database connected successfully');
    console.log(`📊 Schema version: ${health.schemaVersion}`);
    console.log(`📋 Tables: ${health.tableCount}`);
    
    // Verify critical tables exist
    const criticalTables = [
      'organizations', 'locations', 'users', 
      'leads', 'clients', 'winbacks',
      'vehicles', 'drivers', 'properties',
      'quote_requests', 'quote_options', 'policies'
    ];
    
    for (const table of criticalTables) {
      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);
      
      if (!result.rows[0].exists) {
        throw new Error(`Critical table missing: ${table}`);
      }
    }
    
    console.log('✅ All critical tables verified');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Export the pool for advanced usage
export { pool };
