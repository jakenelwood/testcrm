# 🗄️ Drizzle ORM Integration

## 📋 Overview

Drizzle ORM has been successfully integrated with our Supabase Cloud database to provide type-safe database queries while maintaining our existing infrastructure. This setup allows for gradual migration from direct Supabase client calls to type-safe Drizzle queries.

**Status**: ✅ **Production Ready**  
**Database**: Supabase Cloud (PostgreSQL 15+)  
**Schema Files**: 36 auto-generated TypeScript files  
**Integration**: Works alongside existing Supabase client code  

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Drizzle ORM    │    │  Supabase Cloud │
│                 │    │                  │    │   PostgreSQL    │
│  - Components   │◄──►│  - Type Safety   │◄──►│                 │
│  - API Routes   │    │  - Schema Files  │    │  - 38 Tables    │
│  - Server Comp. │    │  - Query Builder │    │  - Extensions   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │
         │              ┌─────────▼─────────┐
         │              │  Supabase Client  │
         └─────────────►│                   │
                        │  - Auth           │
                        │  - Real-time      │
                        │  - Storage        │
                        └───────────────────┘
```

## 🚀 Quick Start

### 1. Environment Setup
Ensure your `.env.local` contains:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Direct Database Connection (for Drizzle)
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 2. Test Connection
```bash
npm run test:drizzle
```

### 3. Basic Usage
```typescript
import { db } from '@/lib/drizzle/client';
import { users, leads, clients } from '@/lib/drizzle/schema';
import { eq, desc, and } from 'drizzle-orm';

// Type-safe queries with full IntelliSense
const activeUsers = await db
  .select()
  .from(users)
  .where(eq(users.is_active, true));

const recentLeads = await db
  .select()
  .from(leads)
  .where(and(
    eq(leads.status, 'New'),
    eq(leads.assigned_to, userId)
  ))
  .orderBy(desc(leads.created_at))
  .limit(10);
```

## 📁 Project Structure

```
lib/drizzle/
├── client.ts              # Database client configuration
├── schema/                # Auto-generated schema files
│   ├── index.ts           # Exports all schemas
│   ├── users.ts           # User table schema
│   ├── leads.ts           # Leads table schema
│   ├── clients.ts         # Clients table schema
│   ├── communications.ts  # Communications schema
│   ├── vehicles.ts        # Vehicle data schema
│   └── ... (32 more)      # All other table schemas
└── migrations/            # Future migration files

scripts/
├── test-drizzle-setup.ts     # Connection testing
└── generate-drizzle-schema.ts # Schema generation

docs/
└── DRIZZLE_SETUP.md          # Detailed setup guide
```

## 🔧 Available Commands

| Command | Description |
|---------|-------------|
| `npm run test:drizzle` | Test connection and list all tables |
| `npm run db:generate-schema` | Regenerate schema files from database |
| `npm run db:studio` | Open Drizzle Studio (visual database browser) |
| `npm run db:push` | Push schema changes to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:introspect` | Introspect existing database structure |

## 📊 Generated Schema Files

Our database contains **38 tables** with full TypeScript definitions:

### Core CRM Tables
- `users.ts` - User management and authentication
- `leads.ts` - Lead tracking and conversion pipeline
- `clients.ts` - Converted client management
- `addresses.ts` - Address information
- `communications.ts` - All communication logs

### Insurance-Specific Tables
- `vehicles.ts` - Vehicle information and coverage
- `homes.ts` - Property insurance data
- `specialty_items.ts` - Specialty insurance items
- `quotes.ts` - Insurance quotes and pricing

### AI & Analytics Tables
- `ai_agents.ts` - AI agent configurations
- `ai_interactions.ts` - AI conversation logs
- `agent_memory.ts` - AI memory and context
- `campaigns.ts` - Marketing campaign data
- `ab_tests.ts` - A/B testing results

### System Tables
- `audit_logs.ts` - System audit trail
- `user_sessions.ts` - Session management
- `permissions.ts` - Role-based access control
- `schema_versions.ts` - Database versioning

### Communication Tables
- `call_logs.ts` - Phone call records
- `sms_logs.ts` - SMS communication logs
- `ringcentral_tokens.ts` - RingCentral integration

## 💡 Usage Patterns

### 1. Hybrid Approach (Recommended)
```typescript
// Use Supabase for auth
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// Use Drizzle for type-safe queries
const userLeads = await db
  .select()
  .from(leads)
  .where(eq(leads.assigned_to, user.id));
```

### 2. Complex Joins
```typescript
// Get leads with user and client information
const leadsWithDetails = await db
  .select({
    lead: leads,
    assignedUser: users,
    client: clients,
  })
  .from(leads)
  .leftJoin(users, eq(leads.assigned_to, users.id))
  .leftJoin(clients, eq(leads.converted_to_client_id, clients.id))
  .where(eq(leads.status, 'Active'));
```

### 3. Transactions
```typescript
import { db } from '@/lib/drizzle/client';

await db.transaction(async (tx) => {
  // Convert lead to client
  const [newClient] = await tx
    .insert(clients)
    .values({
      // ... client data
    })
    .returning();

  // Update lead status
  await tx
    .update(leads)
    .set({
      status: 'Converted',
      converted_to_client_id: newClient.id,
      conversion_date: new Date(),
      is_converted: true,
    })
    .where(eq(leads.id, leadId));
});
```

## 🔄 Migration Strategy

### Phase 1: Coexistence (Current)
- ✅ Drizzle installed and configured
- ✅ Schema files generated
- ✅ Both systems working together
- 🔄 Gradual adoption in new features

### Phase 2: Gradual Migration
- 🔄 Migrate API routes to Drizzle
- 🔄 Update complex queries for better type safety
- 🔄 Maintain Supabase for auth/real-time/storage

### Phase 3: Optimization
- 🔄 Performance optimization
- 🔄 Advanced query patterns
- 🔄 Custom migration workflows

## 🛠️ Maintenance

### Schema Updates
When database schema changes:
```bash
# Regenerate schema files
npm run db:generate-schema

# Test the changes
npm run test:drizzle
```

### Adding New Tables
1. Create table in Supabase Dashboard
2. Run `npm run db:generate-schema`
3. New TypeScript schema file will be auto-generated
4. Import and use immediately with full type safety

## 🔗 Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Drizzle with Supabase Guide](https://orm.drizzle.team/docs/get-started-postgresql#supabase)
- [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
- [Project Setup Guide](../DRIZZLE_SETUP.md)

## 📈 Benefits Achieved

✅ **Type Safety**: Full TypeScript support with IntelliSense  
✅ **Developer Experience**: Auto-completion and error checking  
✅ **Performance**: Optimized queries and connection pooling  
✅ **Maintainability**: Clear schema definitions and relationships  
✅ **Gradual Adoption**: Works alongside existing Supabase code  
✅ **Future-Proof**: Easy schema evolution and migration support  

---

*Last Updated: August 14, 2025*  
*Schema Version: Auto-generated from 38 tables*
