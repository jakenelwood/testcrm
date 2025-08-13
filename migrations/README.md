# Database Migrations

This directory contains database migration scripts for the AI-centric CRM system.

## Migration 001: Resolve Circular Foreign Key Dependency

### Problem
The original schema had a circular foreign key constraint between `clients` and `leads` tables:
- `clients.converted_from_lead_id` → `leads.id`
- `leads.client_id` → `clients.id`

This caused:
- pg_dump warnings about circular dependencies
- Inability to restore data cleanly
- Performance issues with bulk operations
- Violation of the intended business logic (Lead → Client conversion flow)

### Solution
This migration implements a clean one-way conversion flow:
1. **Removes circular foreign key constraints**
2. **Adds conversion tracking fields to leads table**:
   - `converted_to_client_id` - References the client created from this lead
   - `conversion_date` - When the conversion happened
   - `is_converted` - Boolean flag for quick filtering
3. **Preserves all existing relationship data**
4. **Creates helpful views for common queries**
5. **Updates contacts table constraints for clarity**

### Business Logic After Migration
- **Leads** are prospects who haven't converted yet
- **Clients** are converted leads (customers)
- **Conversion** is a one-way process: Lead → Client
- **Contacts** can be linked to either leads OR clients (for B2B scenarios)

## Running the Migration

### Prerequisites
- PostgreSQL client tools installed (`psql`, `pg_dump`, `pg_isready`)
- Database connection credentials configured
- Backup storage space available

### Safe Execution Steps

1. **Test the migration (recommended)**:
   ```bash
   cd migrations
   ./run_migration.sh --dry-run
   ```

2. **Execute the migration**:
   ```bash
   cd migrations
   ./run_migration.sh
   ```

3. **Verify results**:
   The script automatically verifies:
   - Circular constraints are removed
   - New fields are added correctly
   - Data integrity is maintained

### What the Migration Does

1. **Data Integrity Check**: Verifies no orphaned references exist
2. **Backup Creation**: Creates a schema backup before changes
3. **Field Addition**: Adds new conversion tracking fields
4. **Data Migration**: Preserves existing relationships in new structure
5. **Constraint Removal**: Drops circular foreign key constraints
6. **New Constraints**: Adds proper one-way foreign key constraint
7. **Index Creation**: Adds performance indexes for new fields
8. **View Creation**: Creates helpful views for common queries
9. **Verification**: Confirms migration success
10. **Cleanup**: Removes temporary data

### Post-Migration Benefits

✅ **Resolved Issues**:
- No more pg_dump circular dependency warnings
- Clean database restoration process
- Improved bulk operation performance
- Clear business logic implementation

✅ **New Capabilities**:
- Efficient lead conversion tracking
- Better AI analysis of conversion patterns
- Cleaner relationship queries
- Improved data integrity

✅ **Maintained Features**:
- All existing data preserved
- AI annotation fields intact
- Temporal tracking continues
- JSONB flexibility maintained

### Rollback Plan

If issues arise, you can restore from the backup:
```bash
# Restore schema from backup
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < backup_before_migration_YYYYMMDD_HHMMSS.sql
```

### Application Code Updates Required

After migration, update application code to:
1. Use `leads.converted_to_client_id` instead of `clients.converted_from_lead_id`
2. Use `leads.is_converted` for filtering converted leads
3. Query the new views for conversion analysis
4. Update lead conversion logic to set new fields

### Example Queries After Migration

```sql
-- Find all converted leads
SELECT * FROM leads WHERE is_converted = true;

-- Get conversion summary
SELECT * FROM lead_conversion_summary;

-- Find client's original lead
SELECT * FROM client_lead_history WHERE client_id = 'some-uuid';

-- Active leads (not converted)
SELECT * FROM leads WHERE is_converted = false;
```