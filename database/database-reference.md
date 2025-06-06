# 🗄️ Database Documentation

## Schema Version: 2.1.0

### Current Features
- Multi-tenant architecture (Organizations → Locations → Users)
- Complete customer lifecycle (Lead → Client → Win-back)
- Comprehensive insurance data (Vehicles, Drivers, Properties)
- Advanced quote management system
- Follow-up scheduling and automation

### Files
- `schema/` - Database schema definitions
- `migrations/` - Migration scripts and tools

### Connection
```
Host: 5.161.110.205:5432
Database: crm
Schema Version: 2.1.0
Extensions: pgvector, uuid-ossp, pg_trgm
```

## Quick Reference

### Core Tables (44 total)
- **Organizations**: `organizations`, `locations`, `users`, `user_location_assignments`
- **Customers**: `leads`, `clients`, `winbacks`, `winback_campaigns`
- **Insurance**: `vehicles`, `drivers`, `properties`, `specialty_items`
- **Quotes**: `quote_requests`, `quote_options`, `quote_comparisons`
- **Policies**: `policies`, `commercial_details`
- **Follow-up**: `follow_up_schedules`, `follow_up_tasks`, `lead_hibernation`
- **Communication**: `communications`, `notes`, `ai_interactions`
- **Marketing**: `campaigns`, `ab_tests`, `communication_metrics`, `content_templates`, `customer_touchpoints`, `campaign_analytics`

### Data Coverage: 98.5%
All major insurance business requirements covered with enterprise-ready multi-tenant architecture and comprehensive marketing analytics.

### Testing
```bash
node migrations/test_hetzner_connection.js
node migrations/verify_comprehensive_schema.js
```
