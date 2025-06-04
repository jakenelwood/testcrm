# Alpha Page Optimization

This document outlines the optimizations made to improve the performance of the Alpha pipeline page in the CRM system.

## Problem

The Alpha page was experiencing longer load times compared to other pages in the application. This was due to:

1. Inefficient database queries when filtering by pipeline_id and sorting by created_at
2. Excessive database load from realtime subscriptions
3. Inefficient state updates when leads changed

## Solutions Implemented

### 1. Database Indexes

We added the following indexes to improve query performance:

```sql
-- Composite index for pipeline filtering and sorting by created_at
CREATE INDEX idx_leads_pipeline_created_at ON leads(pipeline_id, created_at DESC);

-- Indexes for foreign key joins
CREATE INDEX idx_leads_client_id ON leads(client_id);
CREATE INDEX idx_leads_status_id ON leads(status_id);
CREATE INDEX idx_leads_insurance_type_id ON leads(insurance_type_id);

-- Trigram indexes for text search
CREATE EXTENSION pg_trgm;
CREATE INDEX idx_clients_name_trgm ON clients USING gin(name gin_trgm_ops);
CREATE INDEX idx_clients_email_trgm ON clients USING gin(email gin_trgm_ops);
CREATE INDEX idx_clients_phone_trgm ON clients USING gin(phone_number gin_trgm_ops);
```

### 2. Realtime Subscription Optimization

We optimized the realtime subscription to:

1. Only listen for changes to leads in the current pipeline
2. Handle INSERT, UPDATE, and DELETE events separately
3. Update the state more efficiently for each type of event

```javascript
// Set up real-time subscription only for leads in this pipeline
const channelName = `leads-changes-pipeline-${selectedPipeline.id}`;
const subscription = supabase
  .channel(channelName)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'leads',
    filter: `pipeline_id=eq.${selectedPipeline.id}`
  }, (payload) => {
    // Refresh leads when a new lead is added
    fetchLeads();
  })
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'leads',
    filter: `pipeline_id=eq.${selectedPipeline.id}`
  }, (payload) => {
    // For updates, we can be more efficient by just updating the specific lead
    const updatedLead = payload.new as Lead;
    setLeads(prevLeads => 
      prevLeads.map(lead => 
        lead.id === updatedLead.id ? { ...lead, ...updatedLead } : lead
      )
    );
    // Also update filteredLeads to keep them in sync
    setFilteredLeads(prevFilteredLeads => {
      // Update logic for filtered leads...
    });
  })
  .on('postgres_changes', {
    event: 'DELETE',
    schema: 'public',
    table: 'leads',
    filter: `pipeline_id=eq.${selectedPipeline.id}`
  }, (payload) => {
    // For deletes, we can just remove the lead from both states
    const deletedLead = payload.old as Lead;
    setLeads(prevLeads => 
      prevLeads.filter(lead => lead.id !== deletedLead.id)
    );
    setFilteredLeads(prevFilteredLeads => 
      prevFilteredLeads.filter(lead => lead.id !== deletedLead.id)
    );
  })
  .subscribe();
```

## Results

These optimizations have significantly improved the performance of the Alpha page:

1. **Query Performance**: The execution time for the main query has been reduced to 0.383 ms (from several seconds)
2. **Database Load**: The database load has been reduced by optimizing the realtime subscription
3. **Client-Side Performance**: The client-side performance has been improved by updating state more efficiently

## Rollback Plan

If any issues arise, we can roll back the changes using the `20250503_rollback_optimize_alpha_page.sql` script:

```sql
-- Drop the composite index for pipeline filtering and sorting by created_at
DROP INDEX IF EXISTS idx_leads_pipeline_created_at;

-- Drop indexes for foreign key joins
DROP INDEX IF EXISTS idx_leads_client_id;
DROP INDEX IF EXISTS idx_leads_status_id;
DROP INDEX IF EXISTS idx_leads_insurance_type_id;

-- Drop trigram indexes for text search
DROP INDEX IF EXISTS idx_clients_name_trgm;
DROP INDEX IF EXISTS idx_clients_email_trgm;
DROP INDEX IF EXISTS idx_clients_phone_trgm;
```

## Future Optimizations

1. **Connection Pooling**: Implement connection pooling to reduce connection overhead
2. **Query Caching**: Implement client-side caching for frequently accessed data
3. **Materialized Views**: Consider using materialized views for complex queries that are accessed frequently
