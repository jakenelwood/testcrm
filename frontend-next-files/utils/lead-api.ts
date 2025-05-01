/**
 * LEAD API UTILITIES
 * 
 * This file contains functions for interacting with the leads API.
 * It handles the fetching and transformation of lead data from the new normalized schema.
 */

import { Lead, LeadStatus, InsuranceType } from "@/types/lead";
import supabase from '@/utils/supabase/client';

/**
 * Fetches leads with joined client, status, and insurance type information
 * and transforms them to be compatible with the UI components
 */
export async function fetchLeadsWithRelations(): Promise<Lead[]> {
  try {
    // Fetch leads with joined client, status, and insurance type information
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        client:client_id(*),
        status:lead_statuses!inner(value),
        insurance_type:insurance_types!inner(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }

    // Process the leads to ensure they have the expected structure for legacy components
    const processedLeads = data?.map(lead => {
      // Create a processed lead with the new schema structure
      const processedLead: Lead = {
        ...lead,
        // Map joined fields to their expected properties
        status: lead.status?.value || 'New',
        insurance_type: lead.insurance_type?.name || 'Auto',
        
        // Add legacy fields from client data for backward compatibility
        first_name: lead.client?.name?.split(' ')[0] || '',
        last_name: lead.client?.name?.split(' ').slice(1).join(' ') || '',
        email: lead.client?.email || '',
        phone_number: lead.client?.phone_number || '',
        
        // Ensure we have status_legacy and insurance_type_legacy for compatibility
        status_legacy: lead.status?.value as LeadStatus || 'New',
        insurance_type_legacy: lead.insurance_type?.name as InsuranceType || 'Auto'
      };
      
      return processedLead;
    }) || [];

    return processedLeads;
  } catch (err) {
    console.error('Error in fetchLeadsWithRelations:', err);
    throw err;
  }
}

/**
 * Updates a lead's status in the database
 */
export async function updateLeadStatus(leadId: string, statusId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ 
        status_id: statusId, 
        updated_at: new Date().toISOString(),
        status_changed_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead status:', error);
      throw error;
    }
  } catch (err) {
    console.error('Error in updateLeadStatus:', err);
    throw err;
  }
}

/**
 * Creates a new lead in the database
 * This function handles creating both a client record and a lead record
 */
export async function createLead(leadData: any): Promise<Lead> {
  try {
    // First, create a client record
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        client_type: 'Individual',
        name: `${leadData.first_name} ${leadData.last_name}`.trim(),
        email: leadData.email || null,
        phone_number: leadData.phone_number || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      throw clientError;
    }

    // Then, create a lead record linked to the client
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({
        client_id: clientData.id,
        status_id: 1, // New status
        insurance_type_id: getInsuranceTypeId(leadData.insurance_type),
        assigned_to: leadData.assigned_to || 'Brian Berg',
        notes: leadData.notes || null,
        current_carrier: leadData.current_carrier || null,
        premium: leadData.premium ? parseFloat(leadData.premium) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        client:client_id(*),
        status:lead_statuses!inner(value),
        insurance_type:insurance_types!inner(name)
      `)
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      throw leadError;
    }

    // Process the lead to ensure it has the expected structure for legacy components
    const processedLead: Lead = {
      ...leadData,
      // Map joined fields to their expected properties
      status: leadData.status?.value || 'New',
      insurance_type: leadData.insurance_type?.name || 'Auto',
      
      // Add legacy fields from client data for backward compatibility
      first_name: leadData.client?.name?.split(' ')[0] || '',
      last_name: leadData.client?.name?.split(' ').slice(1).join(' ') || '',
      email: leadData.client?.email || '',
      phone_number: leadData.client?.phone_number || '',
      
      // Ensure we have status_legacy and insurance_type_legacy for compatibility
      status_legacy: leadData.status?.value as LeadStatus || 'New',
      insurance_type_legacy: leadData.insurance_type?.name as InsuranceType || 'Auto'
    };

    return processedLead;
  } catch (err) {
    console.error('Error in createLead:', err);
    throw err;
  }
}

/**
 * Helper function to get insurance type ID from name
 */
function getInsuranceTypeId(insuranceType: string): number {
  const insuranceTypeMap: Record<string, number> = {
    'Auto': 1,
    'Home': 2,
    'Specialty': 3,
    'Commercial': 4,
    'Liability': 5
  };
  
  return insuranceTypeMap[insuranceType] || 1; // Default to Auto if not found
}
