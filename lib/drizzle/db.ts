/**
 * 🗄️ Database Connection for Unified AI-Native CRM
 * Drizzle ORM database instance with the new unified schema
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './migrations/schema';

// Database connection configuration
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create PostgreSQL connection
const client = postgres(connectionString, {
  max: 10, // Maximum number of connections
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Connection timeout in seconds
});

// Create Drizzle database instance with unified schema
export const db = drizzle(client, { schema });

// Export schema for convenience
export * from './migrations/schema';

// Export types
export type Database = typeof db;
