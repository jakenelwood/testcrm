import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Get database connection string
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Configure postgres client for Supabase
export const client = postgres(connectionString, {
  prepare: false,
  ssl: 'require',
  connection: {
    application_name: 'drizzle-crm'
  },
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create the Drizzle database instance
export const db = drizzle(client, { schema });

// Type for the database instance
export type Database = typeof db;
