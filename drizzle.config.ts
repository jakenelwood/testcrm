import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/drizzle/migrations/schema.ts',
  out: './lib/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
  // Supabase specific configuration
  schemaFilter: ['public'],
  tablesFilter: ['!storage.*', '!auth.*', '!realtime.*', '!supabase_functions.*'],
});
