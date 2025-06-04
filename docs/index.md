# 📚 Documentation Index

## Essential Documentation

### **Getting Started**
- **[setup-guide.md](setup-guide.md)** - Complete setup instructions
- **[next_steps.md](next_steps.md)** - Development roadmap

### **Database**
- **[database/database-guide.md](database/database-guide.md)** - Database overview and connection
- **[database/comprehensive_schema_summary.md](database/comprehensive_schema_summary.md)** - Complete schema overview
- **[../database/database-reference.md](../database/database-reference.md)** - Technical database reference

### **Integrations**
- **[integrations/RINGCENTRAL_SETUP.md](integrations/RINGCENTRAL_SETUP.md)** - RingCentral telephony setup

### **Features**
- **[features/followup_management_guide.md](features/followup_management_guide.md)** - Follow-up system guide

### **Branding**
- **[branding/brand_personality.md](branding/brand_personality.md)** - Brand guidelines and personality

### **Deployment**
- **[deployment/](deployment/)** - Production deployment guides

## Quick Reference

### **Start Development**
```bash
npm install
cp .env.local.template .env.local
# Edit .env.local with your values
npm run dev
```

### **Database Connection**
```
Host: 5.161.110.205:5432
Database: crm
Schema Version: 2.1.0
```

### **Key Features**
- ✅ Multi-tenant architecture
- ✅ Complete customer lifecycle (Lead → Client → Win-back)
- ✅ Comprehensive insurance data coverage (95%+)
- ✅ RingCentral telephony integration
- ✅ Automated follow-up system

## Architecture Overview

```
Organizations → Locations → Users
     ↓
Leads → Clients → Win-backs
     ↓
Vehicles, Drivers, Properties
     ↓
Quotes → Policies
```

## Archived Documentation

Historical and detailed implementation documents are available in `_archive/` for reference but are not needed for daily development.

---

**The documentation is organized by purpose - start with setup-guide.md for development setup.**
