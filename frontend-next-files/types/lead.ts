// Using uppercase to match database constraint
export type LeadStatus = 'New' | 'Contacted' | 'Quoted' | 'Sold' | 'Lost';

export type InsuranceType = 'Auto' | 'Home' | 'Specialty';

export interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  insurance_type: InsuranceType;
  notes?: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  note_content: string;
  created_at: string;
}

export interface LeadFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  insurance_type: InsuranceType;
  notes?: string;
}
