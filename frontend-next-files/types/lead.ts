/**
 * LEAD TYPE DEFINITIONS
 *
 * This file defines the core data types for leads in the CRM system.
 * It serves as the central type definition that's used throughout the application
 * for type safety and consistency when working with lead data.
 *
 * Written in TypeScript, these types ensure data integrity across the frontend
 * and provide clear interfaces for components that handle lead information.
 *
 * These types directly map to the Supabase database schema and are used in:
 * - API requests/responses
 * - Form handling
 * - State management
 * - UI components (especially in the kanban board)
 *
 * ARCHITECTURE ROLE:
 * This file is part of the data model layer of the application.
 * It defines the core business entities that are used throughout the system.
 *
 * DEPENDENCIES:
 * - No external dependencies
 *
 * USED BY:
 * - Kanban board components
 * - Lead forms
 * - API calls to Supabase
 * - State management in lead-related pages
 */

// Using uppercase to match database constraint
// This type defines all possible statuses a lead can have in the sales pipeline
export type LeadStatus = 'New' | 'Contacted' | 'Quoted' | 'Sold' | 'Lost';

// Insurance product types offered by the agency
export type InsuranceType = 'Auto' | 'Home' | 'Specialty';

/**
 * Core Lead interface that maps directly to the 'leads' table in Supabase
 * Contains all essential information about a lead in the CRM system
 */
export interface Lead {
  id: string;                    // Unique identifier (UUID from Supabase)
  first_name: string;            // Lead's first name
  last_name: string;             // Lead's last name
  email: string;                 // Contact email
  phone_number: string;          // Contact phone number
  insurance_type: InsuranceType; // Type of insurance product they're interested in
  notes?: string;                // Optional notes about the lead
  status: LeadStatus;            // Current status in the sales pipeline
  created_at: string;            // ISO timestamp of when the lead was created
  updated_at: string;            // ISO timestamp of when the lead was last updated
}

/**
 * Interface for lead notes that are associated with a lead
 * Maps to the 'lead_notes' table in Supabase
 * Used for tracking communication history and important information
 */
export interface LeadNote {
  id: string;                // Unique identifier for the note
  lead_id: string;           // Foreign key reference to the lead
  note_content: string;      // The actual note text
  created_at: string;        // When the note was created
}

/**
 * Form values interface used specifically for collecting lead information
 * in forms throughout the application
 *
 * This is a subset of the full Lead interface, containing only the fields
 * that are collected during initial lead creation
 */
export interface LeadFormValues {
  first_name: string;            // Lead's first name
  last_name: string;             // Lead's last name
  email: string;                 // Contact email
  phone_number: string;          // Contact phone number
  insurance_type: InsuranceType; // Type of insurance product they're interested in
  notes?: string;                // Optional notes about the lead
}
