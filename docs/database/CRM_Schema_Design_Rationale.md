# CRM Schema Design Rationale (B2C & B2B) - Enhanced

This document provides an overview of the data architecture strategy behind the AI-centric CRM schema designed for both B2C (individual) and B2B (business) clients. It follows modern best practices including normalization, hybrid data storage, DRY compliance, and is optimized for AI-based retrieval, summarization, interaction, and intelligent workflow automation.

> This strategy extends the baseline Supabase schema and adapts it for high-flexibility, AI-native CRM development.

---

## ✅ Goals
- Support both individual consumers and commercial clients
- Scale to any number of leads, insureds, vehicles, or contact points
- Provide clean, structured data for filtering, dashboards, and AI prompts
- Enable fast schema evolution without brittle database migrations
- Avoid data duplication (DRY principle)
- Integrate AI insights directly into the database structure
- Track temporal events for comprehensive timeline analysis
- Support intelligent workflow automation and prioritization

---

## 💾 Core Concepts

### 1. **Hybrid Storage Model**
- **Columns** for core, filterable, indexed fields (e.g., client type, lead status)
- **JSONB fields** for variable, deeply nested, or optional fields (e.g., vehicle lists, specialty items, tags, custom fields)
- **Schema versioning** for JSONB fields to track evolution and ensure compatibility

### 2. **DRY Compliance Through Table Decomposition**
- Repeated categories such as lead status, insurance type, communication type, and addresses are stored in **lookup tables or separate entities** to avoid hardcoded duplication
- Lookup tables include metadata for UI presentation (colors, icons) and AI prompting
- Address normalization with geocoding and verification support

### 3. **AI-Centric Enhancements**
- Indexed JSONB fields allow efficient full-document summarization and memory embedding
- Contact history, marketing metadata, and notes are stored relationally for AI to generate contextual timelines
- Dedicated AI annotation fields for storing insights, summaries, and recommendations
- AI templates for consistent prompting and response formatting

### 4. **Temporal Event Tracking**
- Comprehensive timestamp fields for tracking the full lifecycle of leads and opportunities
- Event-specific timestamps (status changes, contact points, etc.) for detailed timeline analysis
- Follow-up scheduling and prioritization built into the schema

---

## 🧱 Major Tables Explained

### `clients`
- Represents individuals and businesses that were once leads. As a lead passes through each stage of the sales funnel, some convert to clients once a sale is made. The sale is an inflection point where the lead becomes a client. A client never becomes a lead again unless they leave to work with a competitor and return as a new prospect.
- Uses an `address_id` and `mailing_address_id` to avoid repeating address fields
- Includes fields for both personal and business identifiers, but only one will be populated depending on `client_type`
- Contains AI annotation fields for client summaries, risk scores, and lifetime value predictions
- Tracks temporal data with timestamps for creation, updates, last contact, and next scheduled contact

### `leads`
- Tracks quoting and sales activity for prospects who have not yet converted to clients
- Follows a one-way conversion flow: Lead → (sale) → Client
- Contains `converted_to_client_id`, `conversion_date`, and `is_converted` fields to track the conversion process
- `status_id` and `insurance_type_id` use foreign keys to avoid repeated `CHECK` constraints
- Umbrella and premium-related values stored directly
- Flexible coverage-specific details stored in JSONB fields: `auto_data`, `home_data`, `specialty_data`, etc.
- Includes schema version tracking for each JSON data field
- Supports multi-party (e.g., drivers) and multi-location (e.g., commercial locations) quoting via JSON arrays
- Stores tags and user-defined custom fields in JSONB with GIN indexing
- Contains AI annotation fields for lead summaries, next actions, and follow-up priorities
- Comprehensive timestamp tracking for the full lead lifecycle

### `contacts`
- Stores individual contact people tied to either a `lead` (for prospects) or a `client` (for converted customers) in commercial business scenarios (used heavily for B2B)
- Supports multiple roles and a `is_primary_contact` flag
- Includes professional networking information and preferred contact methods
- Contains AI annotation fields for relationship strength and contact summaries
- Tracks temporal data for contact scheduling and follow-up
- Enforces business rule that a contact can be linked to either a lead OR a client, but not both simultaneously

### `ai_interactions`
- Stores inference conversations between the AI assistant and users or leads
- Includes prompt, response, model metadata, temperature, and summary fields
- Useful for audit trails, training, and summarization
- Supports filtering by `type` (e.g., chat, follow-up, insight)

### `support_tickets`
- Stores customer service issues and resolutions
- Tracks status, assigned agents, issue types, and AI-generated summaries
- Allows AI to triage, summarize, or escalate based on history

### `lead_statuses`, `insurance_types`, `communication_types`, `campaigns`
- Avoids scattering enums throughout your schema
- Centralizes control of valid options and allows future expansion without altering schema
- Includes UI metadata (colors, icons) for consistent presentation
- Contains AI templates for prompting, summarization, and action suggestions
- Supports metadata tagging for workflow automation

### `lead_communications`, `lead_notes`, `lead_marketing_settings`, `opportunities`
- All support full lead lifecycle tracking
- Enhanced with AI annotation fields for sentiment analysis, entity extraction, and action items
- Include comprehensive temporal tracking for scheduling and follow-up
- Support metadata and tagging for flexible categorization
- Useful for AI summarization, task suggestions, follow-up triggers, and workflow automation

---

## 🔄 Lead-to-Client Conversion Flow

### **Business Logic**
The schema implements a clear, one-way conversion process:
1. **Lead Creation**: New prospects enter as leads with comprehensive tracking
2. **Lead Nurturing**: AI-powered insights guide the sales process through various stages
3. **Conversion Event**: When a sale is made, the lead is marked as converted (`is_converted = true`)
4. **Client Creation**: A new client record is created, linked back to the original lead via `converted_to_client_id`
5. **Ongoing Relationship**: The client relationship continues with separate tracking for renewals, cross-selling, and expansion

### **Resolved Circular Dependency**
Previous versions of this schema had a circular foreign key constraint between `clients.converted_from_lead_id` and `leads.client_id`. This has been resolved by:
- Removing the circular references
- Adding conversion tracking fields to the `leads` table (`converted_to_client_id`, `conversion_date`, `is_converted`)
- Implementing a clean one-way relationship: Lead → Client
- Creating helpful views (`lead_conversion_summary`, `client_lead_history`) for common queries

### **Handling Complex Scenarios**
- **Existing Client Needs New Product**: Create a new lead record without linking to existing client initially. Upon conversion, it becomes a separate client record or can be merged through application logic.
- **Referrals**: New leads can include referral information in metadata, but maintain clean lead → client flow
- **Renewals**: Handled as new opportunities or through separate renewal tracking systems

---

## 🔍 Indexing Strategy
- Indexed on common filters: client name, email, lead status, insurance type
- JSONB GIN indexes for fast lookups inside unstructured coverage data
- Composite indexes on `contacts` and `communications` for fast joins
- Indexes on AI annotation fields for AI-driven filtering and sorting
- Temporal indexes for efficient date-based queries and scheduling
- Tag indexes for flexible categorization and filtering
- **New conversion tracking indexes**:
  - `idx_leads_converted_to_client_id` for lead-to-client relationship queries
  - `idx_leads_is_converted` for filtering converted vs. active leads
  - `idx_leads_conversion_date` for conversion timeline analysis

---

## 🧠 AI Integration Use Cases
- Memory-aware summarization from `lead_notes`, `communications`, and `JSONB` coverage details
- Dynamic prompting using `status`, `insurance_type`, and `opportunity` stage
- Follow-up and next-action generation based on lead history and metadata
- Inferred contact likelihood from vehicle data, contact activity, or coverage limits
- Sentiment analysis and entity extraction from communication content
- Risk assessment and opportunity scoring for prioritization
- Automated workflow suggestions based on lead status and history
- Personalized communication templates based on client preferences
- Conversation history auditing and RAG-powered insight generation using `ai_interactions`
- AI-assisted resolution generation and tagging in `support_tickets`

---

## 🔄 Future-Proofing
- Easily add new statuses, insurance types, or specialty product lines via lookup inserts
- Schema versioning for JSONB fields ensures backward compatibility
- AI annotation fields built into the schema for immediate AI integration
- Comprehensive temporal tracking supports time-series analysis and forecasting
- Metadata fields allow for flexible extension without schema changes
- Tag arrays enable dynamic categorization without fixed taxonomies
- Expand `addresses` and `contacts` tables to support larger businesses with multiple sites and departments
- Monitor JSON field usage and promote high-frequency fields to columns as needed

---

## 📝 Recent Updates

### **January 13, 2025 - Circular Dependency Resolution**
- **Resolved**: Circular foreign key constraint between `clients` and `leads` tables
- **Implemented**: Clean lead-to-client conversion tracking with new fields
- **Added**: Helper views for conversion analysis (`lead_conversion_summary`, `client_lead_history`)
- **Updated**: RLS policies to use proper relationship structure
- **Result**: No more pg_dump warnings, improved performance, cleaner business logic

### **Migration Status**
- ✅ **Migration 001**: Circular dependency resolution - **COMPLETED**
- 🔄 **Next Phase**: Vector embeddings and AI scoring enhancements

---

This enhanced schema is designed to act as the backbone for a modern, AI-powered CRM platform where performance, clarity, AI utility, and intelligent workflow automation are all first-class priorities. By incorporating AI annotations, temporal tracking, schema versioning, custom field flexibility, and conversational inference history directly into the database structure, it provides a solid foundation for both current needs and future evolution.

---

**Last Updated**: January 13, 2025
**Schema Version**: Post-circular dependency resolution
**Maintained By**: AI-Centric CRM Development Team