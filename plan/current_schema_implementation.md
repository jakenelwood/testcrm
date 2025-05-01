# Current Schema Implementation

This document outlines the current implementation of the CRM database schema in Supabase and how it aligns with our planning documents.

## Schema Overview

The CRM database follows a hybrid storage model with relational columns for core fields and JSONB fields for variable-length data. The schema is designed to support both B2B and B2C clients, with a normalized structure that includes lookup tables for common values.

### Key Tables

1. **Lookup Tables**
   - `lead_statuses`: Defines possible lead statuses with display properties and AI action templates
   - `insurance_types`: Defines insurance product types with form schemas and AI prompt templates
   - `communication_types`: Defines communication methods with follow-up requirements
   - `campaigns`: Stores marketing campaign information with target audience and metrics

2. **Core Entity Tables**
   - `clients`: Stores client information with support for both individuals and businesses
   - `leads`: Stores lead information with references to clients and insurance types
   - `contacts`: Stores contact information for business clients
   - `addresses`: Stores address information with geocoding support

3. **Relationship Tables**
   - `lead_notes`: Stores notes related to leads
   - `lead_communications`: Stores communication history with leads
   - `lead_marketing_settings`: Stores marketing preferences for leads
   - `opportunities`: Stores sales opportunities related to leads

4. **AI-Related Tables**
   - `ai_interactions`: Stores AI conversation history and prompt-response data
   - `support_tickets`: Stores customer service issues and resolutions

## Alignment with Planning Documents

### Hybrid Storage Model

The implementation follows the hybrid storage model outlined in `crm_data_modeling_strategy.md`. Core fields are stored as relational columns, while variable-length data is stored in JSONB fields:

- `auto_data`, `home_data`, `specialty_data`, `commercial_data`, `liability_data` for insurance-specific data
- `additional_insureds`, `additional_locations` for related entities
- `metadata` for flexible, user-defined fields

### B2B and B2C Support

As outlined in `CRM_Schema_Design_Rationale.md`, the schema supports both individual and business clients:

- The `clients` table includes a `client_type` field to distinguish between individuals and businesses
- Individual-specific fields: `date_of_birth`, `gender`, `marital_status`, etc.
- Business-specific fields: `business_type`, `industry`, `tax_id`, etc.
- The `contacts` table allows multiple contacts for business clients

### Normalized Structure

The schema follows the normalization principles outlined in the planning documents:

- Lookup tables for statuses, insurance types, and communication types
- Separate tables for addresses, contacts, and notes
- Relationship tables for many-to-many relationships

### AI Integration

The schema includes AI-specific fields and tables as planned:

- AI annotation fields: `ai_summary`, `ai_next_action`, `ai_quote_recommendation`, etc.
- The `ai_interactions` table for storing prompt-response data
- AI templates in lookup tables: `ai_action_template`, `ai_prompt_template`, etc.

### Schema Evolution

Following the guidance in `schema_evolution_guidance.md`, the schema includes:

- Version tracking for JSON data fields: `auto_data_schema_version`, `home_data_schema_version`, etc.
- Flexible metadata fields for future extensions
- Backward compatibility through the hybrid model

## Recent Updates

1. **TypeScript Type Definitions**
   - Updated `database.types.ts` to reflect the current database schema
   - Added type definitions for all tables, including lookup tables and AI-related tables

2. **Missing Tables Implementation**
   - Added `ai_interactions` table for storing AI conversation history
   - Added `support_tickets` table for tracking customer service issues

3. **Row Level Security**
   - Implemented RLS policies for the new tables to ensure data security
   - Created policies based on user roles and ownership

## Frontend Code Adaptation

When working with the frontend code, keep in mind the following changes from the original schema:

1. **Client-Lead Relationship**
   - Leads now reference clients through `client_id` instead of having direct name fields
   - Use joins or nested queries to get client information for leads

2. **Lookup Tables**
   - Status values come from the `lead_statuses` table instead of being hardcoded
   - Insurance types come from the `insurance_types` table

3. **JSON Data Access**
   - Use proper typing for JSON fields with the updated TypeScript definitions
   - Be aware of schema versions when accessing JSON data

## Next Steps

1. **Update Frontend Components**
   - Adapt forms to work with the normalized schema
   - Update UI components to display data from related tables

2. **Implement AI Features**
   - Use the `ai_interactions` table for conversation history
   - Implement AI-driven insights using the annotation fields

3. **Enhance Customer Support**
   - Implement ticket management using the `support_tickets` table
   - Integrate with AI for automated triage and resolution suggestions
