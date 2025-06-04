# Lead Types - Table of Contents

This document provides an overview of the type definitions in `lead.ts`, which is a core part of the CRM system's type system.

## File Purpose

The `lead.ts` file defines the TypeScript interfaces and types that represent leads and related entities in the CRM system. These types ensure data consistency across the application and provide type safety when working with lead data.

## Type Definitions

| Type/Interface | Description | Language | Purpose | Connected Components |
|----------------|-------------|----------|---------|---------------------|
| `LeadStatus` | Union type of possible lead statuses | TypeScript | Defines the valid states a lead can be in within the sales pipeline | KanbanBoard, LeadCard, LeadDetailsModal |
| `InsuranceType` | Union type of insurance products | TypeScript | Defines the types of insurance products the agency offers | QuoteFormContainer, LeadDetailsModal, InsuranceTypeSelectorForm |
| `Lead` | Main lead interface | TypeScript | Represents a complete lead record with all properties | Used throughout the application for lead data handling |
| `LeadNote` | Interface for lead notes | TypeScript | Represents notes/comments attached to a lead | LeadDetailsModal, communication history |
| `LeadFormValues` | Form submission interface | TypeScript | Subset of Lead used for form submissions | AddLeadModal, client-info-form |

## Usage in the Application

These types are imported and used throughout the application:

1. In the Kanban board to display and manage leads
2. In forms for type-safe data collection
3. In API calls to ensure correct data structure
4. In state management to maintain type safety

## Database Mapping

These types directly map to the Supabase database schema:
- `Lead` → 'leads' table
- `LeadNote` → 'lead_notes' table

## Related Files

- `KanbanBoard.tsx` - Uses these types for the lead management UI
- `LeadDetailsModal.tsx` - Uses these types for displaying and editing lead details
- `client-info-form.tsx` - Uses LeadFormValues for collecting lead information
- `AddLeadModal.tsx` - Uses these types for creating new leads
