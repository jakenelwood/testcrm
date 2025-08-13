# 🗄️ AI-Centric Insurance CRM Database

## 📋 Overview

This database powers an AI-first insurance CRM system designed for human-AI collaboration. The schema is optimized for AI processing, semantic search, and intelligent workflow automation while maintaining traditional CRM functionality.

**Platform**: Supabase Cloud (PostgreSQL 15+)
**Frontend**: Vercel (Next.js)
**Architecture**: AI-centric with traditional UI as supplementary layers

## 🏗️ Core Architecture Principles

### **AI-First Design**
- **JSONB fields** for flexible, AI-processable data structures
- **AI annotation fields** throughout for summaries, insights, and next actions
- **Temporal tracking** for AI timeline analysis and pattern recognition
- **Vector embeddings** ready for semantic search and similarity matching
- **Schema versioning** for JSONB evolution and AI model compatibility

### **Business Logic Flow**
```
Lead → (AI Analysis) → (Nurturing) → (Conversion) → Client
  ↓                                                    ↓
Contacts (B2B)                                   Ongoing Relationship
```

**Key Principle**: One-way conversion flow - leads become clients, never the reverse (unless they leave and return as new prospects).

## 📊 Schema Overview

### **Core Entity Tables**

#### **`leads`** - Prospect Management
- Tracks prospects through the sales funnel
- **Conversion tracking**: `converted_to_client_id`, `conversion_date`, `is_converted`
- **AI fields**: `ai_summary`, `ai_insights`, `ai_next_action`
- **Insurance data**: JSONB fields for auto, home, commercial, specialty coverage
- **Schema versioning**: `auto_data_version`, `home_data_version`, etc.

#### **`clients`** - Customer Management
- Converted leads who have made purchases
- **Relationship tracking**: Links back to original lead via `leads.converted_to_client_id`
- **AI fields**: Risk scores, lifetime value predictions, client summaries
- **Address normalization**: `address_id` and `mailing_address_id`

#### **`contacts`** - B2B Contact Management
- Individual contacts for commercial clients and prospects
- **Flexible linking**: Can connect to either leads OR clients (not both)
- **Role management**: Multiple contacts per entity with primary contact designation
- **AI insights**: Relationship strength analysis and contact summaries

### **Supporting Tables**

#### **Insurance Coverage**
- **`vehicles`** - Auto insurance assets
- **`homes`** - Property insurance assets
- **`specialty_items`** - High-value items coverage
- **`commercial_locations`** - Business property coverage

#### **Communication & Workflow**
- **`communications`** - All interaction tracking with AI analysis
- **`tasks`** - AI-driven follow-up and workflow management
- **`documents`** - File storage with AI content analysis
- **`notes`** - User and AI-generated annotations

#### **System & Analytics**
- **`addresses`** - Normalized address data
- **`users`** - System users and permissions
- **`lookup tables`** - Lead statuses, insurance types, etc.

## 🔄 Recent Schema Changes

### **✅ Resolved: Circular Foreign Key Dependency (Jan 2025)**

**Problem**: Circular dependency between `clients.converted_from_lead_id` ↔ `leads.client_id`
- Caused pg_dump warnings
- Prevented clean database restoration
- Violated business logic (one-way conversion flow)

**Solution**: Implemented clean lead-to-client conversion tracking
- **Removed**: Circular foreign key constraints
- **Added**: `leads.converted_to_client_id`, `leads.conversion_date`, `leads.is_converted`
- **Created**: Helper views for conversion analysis
- **Updated**: RLS policies to use proper relationships

**Benefits**:
- ✅ No more pg_dump circular dependency warnings
- ✅ Clean database restoration process
- ✅ Improved bulk operation performance
- ✅ Clear business logic implementation
- ✅ Better foundation for AI analysis

## 🚀 AI-Centric Features

### **Current AI Capabilities**
- **JSONB data structures** optimized for AI processing
- **AI annotation fields** for summaries, insights, and recommendations
- **Temporal tracking** for AI timeline analysis
- **Flexible metadata** for AI model evolution
- **GIN indexes** for fast JSONB queries

### **Planned AI Enhancements**
- **Vector embeddings** for semantic search across communications
- **AI scoring tables** for conversion probability tracking
- **Relationship analysis** for AI-driven insights
- **Advanced temporal analytics** for lead lifecycle optimization

## 🔧 Database Management

### **Connection Information**
- **Host**: `db.xyfpnlxwimjbgjloujxw.supabase.co`
- **Port**: `6543`
- **Database**: `postgres`
- **Platform**: Supabase Cloud

### **Common Operations**
```bash
# Connect to database
psql -h db.xyfpnlxwimjbgjloujxw.supabase.co -p 6543 -U postgres -d postgres

# Check for circular dependencies
pg_dump -U postgres -h db.xyfpnlxwimjbgjloujxw.supabase.co -p 6543 -d postgres --data-only > /dev/null

# View lead conversion summary
psql -c "SELECT * FROM lead_conversion_summary LIMIT 10;"

# Check schema version
psql -c "SELECT version();"
```

### **Migration Management**
- **Location**: `/migrations/` directory
- **Current**: Migration 001 - Circular dependency resolution completed
- **Process**: Use provided migration scripts with backup and verification

## 📁 File Organization

### **Schema Documentation**
- **`CRM_Schema_Design_Rationale.md`** - Comprehensive design decisions and rationale
- **`data_points_list_personal.md`** - Personal insurance data requirements
- **`data_points_list_commercial.md`** - Commercial insurance data requirements
- **`BACKUP_SYSTEM.md`** - Database backup and recovery procedures

### **Migration Files**
- **`/migrations/001_resolve_circular_dependency.sql`** - Circular dependency fix
- **`/migrations/002_cleanup_migration.sql`** - RLS policy updates
- **`/migrations/run_migration.sh`** - Safe migration execution script
- **`/migrations/README.md`** - Migration documentation

## 🔒 Security & Compliance

### **Row Level Security (RLS)**
- **Enabled** on all user-facing tables
- **User-based access control** through Supabase Auth
- **Proper relationship-based permissions** (no circular dependencies)
- **AI-safe policies** that don't expose sensitive data

### **Data Privacy**
- **Audit trails** with created_by/updated_by tracking
- **Temporal data** for compliance reporting
- **Secure JSONB** for flexible PII handling
- **Environment-based access control**

## 📈 Performance Optimization

### **Indexing Strategy**
- **Primary indexes** on all foreign keys and common filters
- **GIN indexes** on JSONB fields for AI queries
- **Composite indexes** for complex joins
- **Temporal indexes** for date-based queries
- **Conversion tracking indexes** for lead analysis

### **Query Optimization**
- **Helper views** for common conversion queries
- **Materialized views** for complex analytics (planned)
- **Proper normalization** with lookup tables
- **Efficient relationship queries** without circular dependencies

## 📚 References

- **[Schema Design Rationale](CRM_Schema_Design_Rationale.md)** - Detailed design decisions
- **[Migration Documentation](../migrations/README.md)** - Database migration procedures
- **[Backup System](BACKUP_SYSTEM.md)** - Backup and recovery procedures

---

**Last Updated**: January 13, 2025
**Schema Version**: Post-circular dependency resolution
**Maintained By**: AI-Centric CRM Development Team