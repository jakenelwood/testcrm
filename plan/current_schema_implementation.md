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
   - `pipeline_statuses`: Defines stages in sales pipelines with display properties
   - `pipelines`: Defines sales pipelines for lead progression

2. **Core Entity Tables**
   - `clients`: Stores client information with support for both individuals and businesses
   - `leads`: Stores lead information with references to clients and insurance types
   - `contacts`: Stores contact information for business clients
   - `addresses`: Stores address information with geocoding support
   - `users`: Stores user account information
   - `user_profiles`: Stores extended user information
   - `user_roles`: Stores role assignments for users
   - `homes`: Stores home information for insurance
   - `vehicles`: Stores vehicle information for insurance
   - `specialty_items`: Stores specialty item information for insurance
   - `other_insureds`: Stores information about additional insured individuals

3. **Relationship Tables**
   - `lead_notes`: Stores notes related to leads
   - `lead_communications`: Stores communication history with leads
   - `lead_marketing_settings`: Stores marketing preferences for leads
   - `opportunities`: Stores sales opportunities related to leads
   - `code_redemptions`: Tracks redemption of discount codes

4. **AI-Related Tables**
   - `ai_interactions`: Stores AI conversation history and prompt-response data
   - `support_tickets`: Stores customer service issues and resolutions

5. **Utility Tables**
   - `invite_codes`: Stores invitation codes for new users
   - `discount_codes`: Stores discount codes for promotions
   - `developer_notes`: Stores development-related notes and decisions
   - `ringcentral_tokens`: Stores tokens for RingCentral integration
   - `schema_versions`: Tracks database migration history

## Alignment with Planning Documents

### Hybrid Storage Model

The implementation follows the hybrid storage model outlined in `schema_evolution_guidance.md`. Core fields are stored as relational columns for performance and queryability, while variable-length data is stored in JSONB fields for flexibility:

- **Insurance-Specific JSONB Fields**: `auto_data`, `home_data`, `specialty_data`, `commercial_data`, `liability_data`
- **Related Entity JSONB Fields**: `additional_insureds`, `additional_locations`
- **Flexible Metadata Fields**: `metadata` in multiple tables for user-defined fields
- **AI-Related JSONB Fields**: `ai_entities`, `ai_action_items`, `ai_recommended_campaigns`
- **Configuration JSONB Fields**: `form_schema`, `target_audience`, `content_template`, `metrics`

This approach provides several benefits:
- New UI fields can be added without schema changes
- Entity-specific data can be stored in structured JSON
- Complex nested structures can be represented naturally
- Indexes on JSONB fields enable efficient querying

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

Following the guidance in `schema_evolution_guidance.md`, the schema is designed for evolution rather than being static:

- **Schema Version Tracking**: The `schema_versions` table tracks database migrations
- **Conditional Schema Updates**: The consolidated schema script uses conditional checks for compatibility
- **JSONB for Extensibility**: JSONB fields allow adding new data without schema changes
- **Promotion Path**: Frequently queried JSONB fields can be promoted to columns as needed
- **Backward Compatibility**: The hybrid model ensures compatibility with existing code

This approach allows the schema to evolve with the application's needs while maintaining performance and compatibility. The `consolidated_schema_updated.sql` script provides a robust way to create or update the schema across different environments.

## Recent Updates

1. **Consolidated Schema Implementation**
   - Created a comprehensive `consolidated_schema_updated.sql` script
   - Included all 30+ tables from the existing database
   - Implemented conditional index creation for robustness
   - Added proper foreign key relationships between tables

2. **Enhanced Hybrid Storage Model**
   - Streamlined the leads table to focus on core fields as columns
   - Leveraged JSONB fields for flexible, variable-length data
   - Added metadata JSONB fields to multiple tables for future extensibility

3. **Additional Entity Tables**
   - Added `homes`, `vehicles`, and `specialty_items` tables for insurance assets
   - Added `user_profiles` and `user_roles` tables for enhanced user management
   - Added `pipelines` and `pipeline_statuses` for sales pipeline management

4. **Utility and Integration Tables**
   - Added `invite_codes` and `discount_codes` for marketing and onboarding
   - Added `developer_notes` for tracking development decisions
   - Added `ringcentral_tokens` for external service integration

## Frontend Code Adaptation

When working with the frontend code, keep in mind the following aspects of the schema:

1. **Hybrid Data Storage**
   - Core, frequently queried fields are stored as dedicated columns
   - Variable, dynamic data is stored in JSONB fields
   - UI fields can map to either columns or JSONB paths without requiring schema changes

2. **Client-Lead Relationship**
   - Leads reference clients through `client_id` instead of having direct name fields
   - Use joins or nested queries to get client information for leads

3. **Lookup Tables**
   - Status values come from the `lead_statuses` table instead of being hardcoded
   - Insurance types come from the `insurance_types` table
   - Pipeline stages come from the `pipeline_statuses` table

4. **JSON Data Access**
   - Use proper typing for JSON fields with TypeScript interfaces
   - Create helper functions for accessing nested JSONB data
   - Document the expected structure of each JSONB field

## Next Steps

1. **Test Data Implementation**
   - Create test data that simulates real user interactions
   - Implement data for both B2C and B2B scenarios
   - Ensure test data covers all entity types and relationships

2. **UI Field Mapping Documentation**
   - Document which UI fields map to which database columns or JSONB paths
   - Create TypeScript interfaces that match the JSONB structures
   - Implement validation for JSONB data based on expected structures

3. **Frontend Component Updates**
   - Adapt forms to work with the hybrid storage model
   - Implement components for new entity types (homes, vehicles, etc.)
   - Create visualization components for pipelines and statuses

4. **AI Integration Enhancement**
   - Use the `ai_interactions` table for conversation history
   - Implement AI-driven insights using the annotation fields
   - Create templates for AI prompts based on entity types

5. **Schema Evolution Process**
   - Implement a proper migration system using the `schema_versions` table
   - Create procedures for promoting JSONB fields to columns when needed
   - Document the process for adding new fields to the UI without schema changes
