# 🗄️ Drizzle ORM Setup Guide

## Overview

Drizzle ORM has been successfully installed and configured to work alongside your existing Supabase setup. This provides you with:

- ✅ Type-safe database queries
- ✅ Better IntelliSense and autocompletion
- ✅ Schema introspection and migration tools
- ✅ Works alongside existing Supabase client code

## 🚀 Quick Start

### 1. Configure DATABASE_URL

You need to add your Supabase database connection string to your `.env.local` file:

```bash
# Get this from Supabase Dashboard > Settings > Database > Connection string
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

**To find your connection string:**
1. Go to your Supabase project dashboard
2. Navigate to **Settings > Database**
3. Look for **"Connection string"** section
4. Copy the **"URI"** connection string
5. Replace `[YOUR-PASSWORD]` with your actual database password

### 2. Test the Setup

```bash
npm run test:drizzle
```

This will verify your connection and show you all tables in your database.

### 3. Generate Schema Files

Once your DATABASE_URL is configured, introspect your existing database:

```bash
npm run db:introspect
```

This will generate TypeScript schema files based on your existing Supabase tables.

## 📁 Project Structure

```
lib/drizzle/
├── client.ts          # Database client configuration
├── schema/            # Schema definitions
│   ├── index.ts       # Export all schemas
│   ├── users.ts       # User table schema
│   ├── leads.ts       # Leads table schema
│   └── ...            # Other table schemas
└── migrations/        # Generated migration files
```

## 🔧 Available Scripts

```bash
# Test Drizzle setup and connection
npm run test:drizzle

# Introspect existing database and generate schema
npm run db:introspect

# Generate migration files
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## 💡 Usage Examples

### Basic Query
```typescript
import { db } from '@/lib/drizzle/client';
import { users } from '@/lib/drizzle/schema';

// Select all users
const allUsers = await db.select().from(users);

// Select with conditions
const activeUsers = await db
  .select()
  .from(users)
  .where(eq(users.status, 'active'));
```

### Insert Data
```typescript
import { db } from '@/lib/drizzle/client';
import { leads } from '@/lib/drizzle/schema';

const newLead = await db
  .insert(leads)
  .values({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  })
  .returning();
```

### Joins
```typescript
import { db } from '@/lib/drizzle/client';
import { users, leads } from '@/lib/drizzle/schema';

const usersWithLeads = await db
  .select()
  .from(users)
  .leftJoin(leads, eq(users.id, leads.assignedTo));
```

## 🔄 Working with Existing Supabase Code

Drizzle works alongside your existing Supabase client code. You can:

1. **Keep using Supabase client** for auth, real-time subscriptions, and storage
2. **Use Drizzle** for type-safe database queries
3. **Gradually migrate** existing queries to Drizzle as needed

## 🛠️ Next Steps

1. **Set up DATABASE_URL** in your `.env.local`
2. **Run the test script** to verify connection
3. **Introspect your database** to generate schema files
4. **Start using Drizzle** in your API routes and server components

## 🔗 Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle with Supabase Guide](https://orm.drizzle.team/docs/get-started-postgresql#supabase)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
