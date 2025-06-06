/**
 * CLIENT TYPE DEFINITIONS
 *
 * This file defines the core data types for clients in the CRM system.
 * It serves as the central type definition for client data that's used throughout the application.
 *
 * These types directly map to the normalized database schema and are used in:
 * - API requests/responses
 * - Form handling
 * - State management
 * - UI components
 */

// Client type (Individual or Business)
export type ClientType = 'Individual' | 'Business';

// Address type
export interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zip_code: string;
  type: 'Physical' | 'Mailing' | 'Business' | 'Location';
  created_at: string;
}

/**
 * Core Client interface that maps directly to the 'clients' table
 * Contains all essential information about a client in the CRM system
 */
export interface Client {
  id: string;                    // Unique identifier (UUID)
  client_type: ClientType;       // Individual or Business
  name: string;                  // Full name for individuals, business name for businesses
  email: string;                 // Contact email
  phone_number: string;          // Contact phone number
  address_id?: string;           // Reference to physical address
  mailing_address_id?: string;   // Reference to mailing address
  referred_by?: string;          // How the client was referred
  
  // Individual-specific fields (null for businesses)
  date_of_birth?: string;        // Date of birth
  gender?: string;               // Gender
  marital_status?: string;       // Marital status
  drivers_license?: string;      // Driver's license number
  license_state?: string;        // State that issued the driver's license
  education_occupation?: string; // Education/occupation
  
  // Business-specific fields (null for individuals)
  business_type?: string;        // Type of business
  industry?: string;             // Industry
  tax_id?: string;               // Tax ID
  year_established?: string;     // Year established
  annual_revenue?: number;       // Annual revenue
  number_of_employees?: number;  // Number of employees
  
  // Timestamps
  created_at: string;            // When the client was created
  updated_at: string;            // When the client was last updated
  
  // Joined fields (not in the database, but populated by joins)
  address?: Address;             // Physical address (joined)
  mailing_address?: Address;     // Mailing address (joined)
}

/**
 * Contact interface for business contacts
 * Maps to the 'contacts' table
 */
export interface Contact {
  id: string;                    // Unique identifier
  client_id: string;             // Reference to client
  first_name: string;            // First name
  last_name: string;             // Last name
  title?: string;                // Job title
  email?: string;                // Email
  phone_number?: string;         // Phone number
  is_primary_contact: boolean;   // Whether this is the primary contact
  notes?: string;                // Notes
  created_at: string;            // When the contact was created
  updated_at: string;            // When the contact was last updated
}

/**
 * Form values interface used specifically for collecting client information
 * in forms throughout the application
 */
export interface ClientFormValues {
  client_type: ClientType;       // Individual or Business
  name: string;                  // Full name for individuals, business name for businesses
  email: string;                 // Contact email
  phone_number: string;          // Contact phone number
  street: string;                // Street address
  city: string;                  // City
  state: string;                 // State
  zip_code: string;              // ZIP code
  referred_by?: string;          // How the client was referred
  
  // Individual-specific fields
  date_of_birth?: string;        // Date of birth
  gender?: string;               // Gender
  marital_status?: string;       // Marital status
  drivers_license?: string;      // Driver's license number
  license_state?: string;        // State that issued the driver's license
  education_occupation?: string; // Education/occupation
  
  // Business-specific fields
  business_type?: string;        // Type of business
  industry?: string;             // Industry
  tax_id?: string;               // Tax ID
  year_established?: string;     // Year established
  annual_revenue?: string;       // Annual revenue (string for form input)
  number_of_employees?: string;  // Number of employees (string for form input)
  
  // Primary contact for business
  contact_first_name?: string;   // First name of primary contact
  contact_last_name?: string;    // Last name of primary contact
  contact_title?: string;        // Title of primary contact
  contact_email?: string;        // Email of primary contact
  contact_phone?: string;        // Phone of primary contact
}
