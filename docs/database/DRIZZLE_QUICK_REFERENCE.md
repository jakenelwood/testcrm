# 🚀 Drizzle ORM Quick Reference

## Common CRM Query Patterns

### 🔍 Basic Queries

```typescript
import { db } from '@/lib/drizzle/client';
import { users, leads, clients, communications } from '@/lib/drizzle/schema';
import { eq, desc, and, or, like, gte, lte, count } from 'drizzle-orm';

// Get all active users
const activeUsers = await db
  .select()
  .from(users)
  .where(eq(users.is_active, true));

// Get user by email
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'user@example.com'))
  .limit(1);

// Get leads assigned to a user
const userLeads = await db
  .select()
  .from(leads)
  .where(eq(leads.assigned_to, userId))
  .orderBy(desc(leads.created_at));
```

### 🔗 Joins & Relationships

```typescript
// Get leads with assigned user info
const leadsWithUsers = await db
  .select({
    lead: leads,
    assignedUser: {
      id: users.id,
      email: users.email,
      full_name: users.full_name,
    },
  })
  .from(leads)
  .leftJoin(users, eq(leads.assigned_to, users.id))
  .where(eq(leads.status, 'Active'));

// Get clients with their communication history
const clientsWithComms = await db
  .select()
  .from(clients)
  .leftJoin(communications, eq(clients.id, communications.client_id))
  .where(eq(clients.is_active, true));
```

### 📊 Aggregations & Analytics

```typescript
// Count leads by status
const leadCounts = await db
  .select({
    status: leads.status,
    count: count(),
  })
  .from(leads)
  .groupBy(leads.status);

// Get conversion metrics
const conversionStats = await db
  .select({
    totalLeads: count(),
    convertedLeads: count(leads.converted_to_client_id),
  })
  .from(leads)
  .where(gte(leads.created_at, new Date('2024-01-01')));
```

### 🔍 Search & Filtering

```typescript
// Search leads by name or email
const searchResults = await db
  .select()
  .from(leads)
  .where(
    or(
      like(leads.first_name, `%${searchTerm}%`),
      like(leads.last_name, `%${searchTerm}%`),
      like(leads.email, `%${searchTerm}%`)
    )
  );

// Filter leads by date range and status
const filteredLeads = await db
  .select()
  .from(leads)
  .where(
    and(
      gte(leads.created_at, startDate),
      lte(leads.created_at, endDate),
      eq(leads.status, 'New')
    )
  );
```

### ✏️ Insert & Update Operations

```typescript
// Create a new lead
const newLead = await db
  .insert(leads)
  .values({
    assigned_to: userId,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    lead_type: 'Personal',
    priority: 'Medium',
    status: 'New',
    source: 'Website',
  })
  .returning();

// Update lead status
await db
  .update(leads)
  .set({
    status: 'Contacted',
    last_contact_at: new Date(),
    updated_at: new Date(),
  })
  .where(eq(leads.id, leadId));

// Convert lead to client
await db.transaction(async (tx) => {
  // Create client
  const [newClient] = await tx
    .insert(clients)
    .values({
      first_name: lead.first_name,
      last_name: lead.last_name,
      email: lead.email,
      phone: lead.phone,
      // ... other client fields
    })
    .returning();

  // Update lead
  await tx
    .update(leads)
    .set({
      status: 'Converted',
      converted_to_client_id: newClient.id,
      conversion_date: new Date(),
      is_converted: true,
    })
    .where(eq(leads.id, lead.id));
});
```

### 📞 Communication Tracking

```typescript
// Log a communication
await db
  .insert(communications)
  .values({
    lead_id: leadId,
    client_id: clientId,
    user_id: userId,
    type: 'phone_call',
    direction: 'outbound',
    subject: 'Follow-up call',
    content: 'Discussed insurance options...',
    duration_seconds: 300,
    status: 'completed',
  });

// Get recent communications for a lead
const recentComms = await db
  .select()
  .from(communications)
  .where(eq(communications.lead_id, leadId))
  .orderBy(desc(communications.created_at))
  .limit(10);
```

### 🚗 Insurance-Specific Queries

```typescript
// Get leads with vehicle data
const autoLeads = await db
  .select({
    lead: leads,
    vehicleCount: count(vehicles.id),
  })
  .from(leads)
  .leftJoin(vehicles, eq(leads.id, vehicles.lead_id))
  .where(like(leads.auto_data, '%vehicle%'))
  .groupBy(leads.id);

// Get quotes by premium range
const quotesInRange = await db
  .select()
  .from(quotes)
  .where(
    and(
      gte(quotes.total_premium, 1000),
      lte(quotes.total_premium, 5000)
    )
  )
  .orderBy(desc(quotes.total_premium));
```

### 🤖 AI-Enhanced Queries

```typescript
// Get leads needing AI follow-up
const aiFollowUpLeads = await db
  .select()
  .from(leads)
  .where(
    and(
      eq(leads.ai_follow_up_priority, 'high'),
      lte(leads.next_contact_at, new Date())
    )
  )
  .orderBy(desc(leads.ai_conversion_probability));

// Get AI interaction history
const aiInteractions = await db
  .select()
  .from(ai_interactions)
  .where(eq(ai_interactions.lead_id, leadId))
  .orderBy(desc(ai_interactions.created_at));
```

### 📈 Dashboard Queries

```typescript
// Get dashboard metrics
const dashboardData = await Promise.all([
  // Total leads this month
  db
    .select({ count: count() })
    .from(leads)
    .where(gte(leads.created_at, startOfMonth)),

  // Conversion rate
  db
    .select({
      total: count(),
      converted: count(leads.converted_to_client_id),
    })
    .from(leads),

  // Recent activity
  db
    .select()
    .from(communications)
    .orderBy(desc(communications.created_at))
    .limit(5),
]);
```

## 🔧 Utility Functions

```typescript
// Type-safe lead creation helper
export async function createLead(data: NewLeads) {
  return await db
    .insert(leads)
    .values({
      ...data,
      created_at: new Date(),
      updated_at: new Date(),
    })
    .returning();
}

// Get lead with all related data
export async function getLeadWithDetails(leadId: string) {
  return await db
    .select({
      lead: leads,
      assignedUser: users,
      communications: communications,
      vehicles: vehicles,
    })
    .from(leads)
    .leftJoin(users, eq(leads.assigned_to, users.id))
    .leftJoin(communications, eq(leads.id, communications.lead_id))
    .leftJoin(vehicles, eq(leads.id, vehicles.lead_id))
    .where(eq(leads.id, leadId));
}
```

## 🎯 Performance Tips

1. **Use indexes**: Ensure database indexes match your query patterns
2. **Limit results**: Always use `.limit()` for large datasets
3. **Select specific fields**: Don't select all columns when you only need a few
4. **Use transactions**: For multi-table operations
5. **Batch operations**: Use batch inserts for multiple records

## 🔗 Type Exports

```typescript
// Import types for TypeScript
import type { 
  Users, NewUsers,
  Leads, NewLeads,
  Clients, NewClients,
  Communications, NewCommunications 
} from '@/lib/drizzle/schema';

// Use in function signatures
async function updateLead(id: string, data: Partial<NewLeads>) {
  // Implementation
}
```

---

*For complete setup instructions, see [DRIZZLE_ORM_SETUP.md](DRIZZLE_ORM_SETUP.md)*
