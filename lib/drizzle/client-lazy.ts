// Lazy-loaded database client to reduce initial bundle size
import { drizzle } from 'drizzle-orm/postgres-js';

// Lazy load the database connection only when needed
let dbInstance: any = null;

export async function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  // Dynamic import to reduce initial bundle
  const postgres = await import('postgres');
  const { schema } = await import('./schema');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres.default(connectionString, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  dbInstance = drizzle(sql, { schema });
  return dbInstance;
}

// Export a function that returns the database instance
export const db = {
  get: getDatabase
};

// Type-only exports to avoid bundling large types
export type { Database } from '@/types/database-lazy';
