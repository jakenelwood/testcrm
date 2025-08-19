/**
 * 🗄️ Database Connection for Unified AI-Native CRM
 * Drizzle ORM database instance with the new unified schema
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './migrations/schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL;

// Avoid throwing at import time (breaks Vercel build). Create a safe fallback
// that throws only when actually used at runtime.
let client: any = null;
let dbInstance: any = null;

if (connectionString) {
  client = postgres(connectionString, {
    max: 10, // Maximum number of connections
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout in seconds
  });
  dbInstance = drizzle(client, { schema });
} else {
  // Proxy throws lazily if someone tries to use the DB without proper env
  dbInstance = new Proxy({}, {
    get() {
      throw new Error('DATABASE_URL environment variable is required at runtime');
    }
  });
}

export const db: any = dbInstance;

// Export schema for convenience
export * from './migrations/schema';

// Export types (best-effort)
export type Database = typeof dbInstance;
