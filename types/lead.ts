/**
 * LEAD TYPE DEFINITIONS
 *
 * This file defines the core data types for leads in the CRM system.
 * It serves as the central type definition that's used throughout the application
 * for type safety and consistency when working with lead data.
 *
 * These types directly map to the normalized database schema and are used in:
 * - API requests/responses
 * - Form handling
 * - State management
 * - UI components (especially in the kanban board)
 */

// Using uppercase to match database constraint
// This type defines all possible statuses a lead can have in the sales pipeline
export type LeadStatus = 'New' | 'Contacted' | 'Quoted' | 'Sold' | 'Lost';

// Insurance product types offered by the agency
export type InsuranceType = 'Auto' | 'Home' | 'Specialty' | 'Commercial' | 'Liability';

// Client type (Individual or Business)
export type ClientType = 'Individual' | 'Business';

/**
 * Pipeline interface that maps to the 'pipelines' table
 * Represents a sales pipeline with its own set of statuses
 */
export interface Pipeline {
  id: number;                // Unique identifier
  name: string;              // Pipeline name
  description?: string;      // Optional description
  lead_type: 'Personal' | 'Business'; // Type of leads this pipeline handles
  is_default: boolean;       // Whether this is the default pipeline
  display_order?: number;    // Order for display in UI
  created_at: string;        // When the pipeline was created
  updated_at: string;        // When the pipeline was last updated

  // Joined fields
  statuses?: PipelineStatus[]; // Pipeline statuses (joined)
}

/**
 * PipelineStatus interface that maps to the 'pipeline_statuses' table
 * Represents a status within a specific pipeline
 */
export interface PipelineStatus {
  id: number;                // Unique identifier
  pipeline_id: number;       // Reference to pipeline
  name: string;              // Status name
  description?: string;      // Optional description
  is_final?: boolean;        // Whether this is a final status
  display_order: number;     // Order for display in UI
  color_hex?: string;        // Color for UI display
  icon_name?: string;        // Icon for UI display
  ai_action_template?: string; // Template for AI-suggested actions
  created_at: string;        // When the status was created
  updated_at: string;        // When the status was last updated
}

// Address interface
export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  type: 'Physical' | 'Mailing' | 'Business' | 'Location';
  created_at: string;
}

// Client interface
export interface Client {
  id: string;
  client_type: ClientType;
  name: string;
  email: string;
  phone_number: string;
  address_id?: string;
  mailing_address_id?: string;
  referred_by?: string;
  date_of_birth?: string;
  gender?: string;
  marital_status?: string;
  drivers_license?: string;
  license_state?: string;
  education_occupation?: string;
  business_type?: string;
  industry?: string;
  tax_id?: string;
  year_established?: string;
  annual_revenue?: number;
  number_of_employees?: number;
  created_at: string;
  updated_at: string;

  // Joined fields
  address?: Address;
  mailing_address?: Address;
}

/**
 * Core Lead interface that maps directly to the 'leads' table in the normalized schema
 * Contains all essential information about a lead in the CRM system
 */
export interface Lead {
  id: string;                    // Unique identifier (UUID)
  client_id: string;             // Reference to client
  pipeline_id: number;           // Reference to pipeline
  status_id: number;             // Reference to pipeline status
  insurance_type_id: number;     // Reference to insurance type
  assigned_to?: string;          // Who the lead is assigned to
  notes?: string;                // Optional notes about the lead
  current_carrier?: string;      // Current insurance carrier

  // Premium fields
  premium?: number;              // Overall premium
  auto_premium?: number;         // Auto premium
  home_premium?: number;         // Home premium
  specialty_premium?: number;    // Specialty premium
  commercial_premium?: number;   // Commercial premium

  // Umbrella fields
  umbrella_value?: number;       // Umbrella value
  umbrella_uninsured_underinsured?: string; // Umbrella uninsured/underinsured

  // Auto specific columns
  auto_current_insurance_carrier?: string; // Current auto insurance carrier
  auto_months_with_current_carrier?: number; // Months with current auto carrier

  // Specialty specific columns
  specialty_type?: string;       // Specialty type
  specialty_make?: string;       // Specialty make
  specialty_model?: string;      // Specialty model
  specialty_year?: number;       // Specialty year

  // Commercial specific columns
  commercial_coverage_type?: string; // Commercial coverage type
  commercial_industry?: string;  // Commercial industry

  // JSON data fields
  auto_data?: any;               // Auto insurance data (JSON)
  home_data?: any;               // Home insurance data (JSON)
  specialty_data?: any;          // Specialty insurance data (JSON)
  commercial_data?: any;         // Commercial insurance data (JSON)
  liability_data?: any;          // Liability insurance data (JSON)
  additional_insureds?: any[];   // Additional insureds (JSON array)
  additional_locations?: any[];  // Additional locations (JSON array)

  // Timestamps
  created_at: string;            // When the lead was created
  updated_at: string;            // When the lead was last updated

  // Joined fields (not in the database, but populated by joins)
  client?: Client;               // Client information (joined)
  pipeline?: Pipeline;           // Pipeline information (joined)
  status?: string;               // Status value (joined from pipeline_statuses)
  insurance_type?: string;       // Insurance type name (joined from insurance_types)

  // Legacy fields for backward compatibility during migration
  first_name?: string;           // Client's first name (for backward compatibility)
  last_name?: string;            // Client's last name (for backward compatibility)
  email?: string;                // Client's email (for backward compatibility)
  phone_number?: string;         // Client's phone number (for backward compatibility)
  status_legacy?: LeadStatus;    // Status (for backward compatibility)
  insurance_type_legacy?: InsuranceType; // Insurance type (for backward compatibility)

  // Address fields for backward compatibility
  address_street?: string;       // Physical address street (for backward compatibility)
  address_city?: string;         // Physical address city (for backward compatibility)
  address_state?: string;        // Physical address state (for backward compatibility)
  address_zip_code?: string;     // Physical address zip code (for backward compatibility)
  mailing_address_street?: string; // Mailing address street (for backward compatibility)
  mailing_address_city?: string; // Mailing address city (for backward compatibility)
  mailing_address_state?: string; // Mailing address state (for backward compatibility)
  mailing_address_zip_code?: string; // Mailing address zip code (for backward compatibility)
}

/**
 * Interface for lead notes that are associated with a lead
 * Maps to the 'lead_notes' table
 */
export interface LeadNote {
  id: string;                // Unique identifier for the note
  lead_id: string;           // Foreign key reference to the lead
  note_content: string;      // The actual note text
  created_by?: string;       // Who created the note
  created_at: string;        // When the note was created
}

/**
 * Interface for lead communications
 * Maps to the 'lead_communications' table
 */
export interface LeadCommunication {
  id: string;                // Unique identifier
  lead_id: string;           // Reference to lead
  contact_id?: string;       // Reference to contact (for B2B)
  type_id: number;           // Reference to communication type
  direction?: 'Inbound' | 'Outbound'; // Direction of communication
  content?: string;          // Content of communication
  status?: string;           // Status of communication
  created_by?: string;       // Who created the communication
  created_at: string;        // When the communication was created

  // Joined fields
  type?: string;             // Communication type name (joined)
}

/**
 * Interface for insurance quotes
 * Maps to the 'quotes' table
 */
export interface Quote {
  id: string;                // Unique identifier (UUID)
  lead_id: string;           // Reference to lead
  insurance_type: 'Auto' | 'Home' | 'Renters' | 'Specialty'; // Type of insurance
  paid_in_full_amount?: number;    // Full payment amount
  monthly_payment_amount?: number; // Monthly payment amount
  contract_term?: '6mo' | '12mo';  // Contract term
  quote_date: string;        // When quote was generated
  is_active: boolean;        // Whether this is the current active quote
  notes?: string;            // Additional quote notes
  created_by?: string;       // Who created the quote
  created_at: string;        // When the quote was created
  updated_at: string;        // When the quote was last updated
}

/**
 * Form values interface used specifically for collecting lead information
 * in forms throughout the application
 */
export interface LeadFormValues {
  client_id: string;             // Reference to client
  pipeline_id: number;           // Reference to pipeline
  status_id: number;             // Reference to pipeline status
  insurance_type_id: number;     // Reference to insurance type
  assigned_to?: string;          // Who the lead is assigned to
  notes?: string;                // Optional notes about the lead
  current_carrier?: string;      // Current insurance carrier
  premium?: string;              // Overall premium (string for form input)
}
