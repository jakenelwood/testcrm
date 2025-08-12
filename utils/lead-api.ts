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
    // First, check if the leads_ins_info table has the expected structure
    const { data: leadsColumns, error: columnsError } = await supabase
      .from('leads_ins_info')
      .select('*')
      .limit(1);

    if (columnsError) {
      console.error('Error checking leads table structure:', columnsError);
      return []; // Return empty array instead of throwing
    }

    // Build the select query based on available columns
    let selectQuery = '*';
    
    // Include client data using leads_contact_info_id
    selectQuery += ', client:leads_contact_info_id(id, name, email, phone_number, lead_type)';
    
    // Include status information (status_id references lead_statuses)
    selectQuery += ', status:lead_statuses(value)';
    
    // Include insurance type information (insurance_type_id references insurance_types)
    selectQuery += ', insurance_type:insurance_types(name)';
    
    // Include address information if available
    if (leadsColumns && leadsColumns.length > 0) {
      if ('address_id' in leadsColumns[0]) {
        selectQuery += ', address:address_id(id, street, city, state, zip_code, type)';
      }
      if ('mailing_address_id' in leadsColumns[0]) {
        selectQuery += ', mailing_address:mailing_address_id(id, street, city, state, zip_code, type)';
      }
    }

    // Fetch leads with appropriate joins
    const { data, error } = await supabase
      .from('leads_ins_info')
      .select(selectQuery)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads:', error);
      return []; // Return empty array instead of throwing
    }

    // Process the leads to ensure they have the expected structure for legacy components
    const processedLeads = data?.map((lead: any) => {
      const processedLead: Lead = {
        ...lead,
        // Map joined fields to their expected properties
        status: typeof lead.status === 'object' && lead.status?.value ? lead.status.value : 'New',
        insurance_type: typeof lead.insurance_type === 'object' && lead.insurance_type?.name ? lead.insurance_type.name : 'Auto',
        
        // Map address fields for backward compatibility
        address_street: lead.address?.street || null,
        address_city: lead.address?.city || null,
        address_state: lead.address?.state || null,
        address_zip_code: lead.address?.zip_code || null,
        
        mailing_address_street: lead.mailing_address?.street || null,
        mailing_address_city: lead.mailing_address?.city || null,
        mailing_address_state: lead.mailing_address?.state || null,
        mailing_address_zip_code: lead.mailing_address?.zip_code || null,

        // Ensure we have status_legacy and insurance_type_legacy for compatibility
        status_legacy: typeof lead.status === 'object' && lead.status?.value ? lead.status.value as LeadStatus : 'New',
        insurance_type_legacy: typeof lead.insurance_type === 'object' && lead.insurance_type?.name ? lead.insurance_type.name as InsuranceType : 'Auto'
      };

      return processedLead;
    }) || [];

    return processedLeads;
  } catch (err) {
    console.error('Error in fetchLeadsWithRelations:', err);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Fetches leads for a specific pipeline with server-side filtering
 * This optimized version filters by pipeline_id at the database level
 */
export async function fetchLeadsByPipeline(pipelineId: number, includeNullPipeline: boolean = false): Promise<Lead[]> {
  try {
    // Build the select query based on known schema
    let selectQuery = '*';
    // Include client data using leads_contact_info_id
    selectQuery += ', client:leads_contact_info_id(id, name, email, phone_number, lead_type)';
    // Include status information (status_id references lead_statuses)
    selectQuery += ', status:lead_statuses(value)';
    // Include insurance type information (insurance_type_id references insurance_types)
    selectQuery += ', insurance_type:insurance_types(name)';
    // Include address information
    selectQuery += ', address:addresses!address_id(id, street, city, state, zip_code, type)';
    selectQuery += ', mailing_address:addresses!mailing_address_id(id, street, city, state, zip_code, type)';

    // Start building the query
    let query = supabase
      .from('leads_ins_info')
      .select(selectQuery);

    // Apply pipeline filtering at the database level
    if (includeNullPipeline) {
      // For default pipeline, include leads with null pipeline_id OR matching pipeline_id
      query = query.or(`pipeline_id.is.null,pipeline_id.eq.${pipelineId}`);
    } else {
      // For other pipelines, only include leads with matching pipeline_id
      query = query.eq('pipeline_id', pipelineId);
    }

    // Execute the query with ordering
    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching leads by pipeline:', error);
      return []; // Return empty array instead of throwing
    }

    // Process the leads to ensure they have the expected structure for legacy components
    const processedLeads = data?.map((lead: any) => {
      const processedLead: Lead = {
        ...lead,
        // Map joined fields to their expected properties
        status: typeof lead.status === 'object' && lead.status?.value ? lead.status.value : 'New',
        insurance_type: typeof lead.insurance_type === 'object' && lead.insurance_type?.name ? lead.insurance_type.name : 'Auto',
        
        // Map address fields for backward compatibility
        address_street: lead.address?.street || null,
        address_city: lead.address?.city || null,
        address_state: lead.address?.state || null,
        address_zip_code: lead.address?.zip_code || null,
        
        mailing_address_street: lead.mailing_address?.street || null,
        mailing_address_city: lead.mailing_address?.city || null,
        mailing_address_state: lead.mailing_address?.state || null,
        mailing_address_zip_code: lead.mailing_address?.zip_code || null,

        // Ensure we have status_legacy and insurance_type_legacy for compatibility
        status_legacy: typeof lead.status === 'object' && lead.status?.value ? lead.status.value as LeadStatus : 'New',
        insurance_type_legacy: typeof lead.insurance_type === 'object' && lead.insurance_type?.name ? lead.insurance_type.name as InsuranceType : 'Auto'
      };

      return processedLead;
    }) || [];

    return processedLeads;
  } catch (err) {
    console.error('Error in fetchLeadsByPipeline:', err);
    return []; // Return empty array instead of throwing
  }
}

/**
 * Updates a lead's status in the database
 */
export async function updateLeadStatus(leadId: string, statusId: number): Promise<void> {
  try {
    // Build the update object
    const updateData: any = {
      status_id: statusId,
      updated_at: new Date().toISOString(),
      status_changed_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('leads_ins_info')
      .update(updateData)
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
export async function createLead(inputLeadData: any): Promise<Lead> {
  try {
    let clientId = null;

    // Create client record if needed
    if (inputLeadData.client) {
      const { data: clientData, error: clientError } = await supabase
        .from('leads_contact_info')
        .insert({
          name: inputLeadData.client.name,
          email: inputLeadData.client.email,
          phone_number: inputLeadData.client.phone_number,
          lead_type: inputLeadData.client.lead_type || 'Individual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (clientError) {
        console.error('Error creating client:', clientError);
        throw clientError;
      }

      clientId = clientData.id;
    }

    // Build the lead insert object
    const leadInsert: any = {
      leads_contact_info_id: clientId,
      status_id: inputLeadData.status_id || 1, // Default to first status
      insurance_type_id: inputLeadData.insurance_type_id || 1, // Default to first insurance type
      pipeline_id: inputLeadData.pipeline_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add other lead fields
    if (inputLeadData.notes) leadInsert.notes = inputLeadData.notes;
    if (inputLeadData.source) leadInsert.source = inputLeadData.source;

    // Build the select query based on known schema
    let selectQuery = '*';
    // Include client data using leads_contact_info_id
    selectQuery += ', client:leads_contact_info_id(id, name, email, phone_number, lead_type)';
    // Include status information
    selectQuery += ', status:lead_statuses(value)';
    // Include insurance type information
    selectQuery += ', insurance_type:insurance_types(name)';
    // Include address information
    selectQuery += ', address:addresses!address_id(id, street, city, state, zip_code, type)';
    selectQuery += ', mailing_address:addresses!mailing_address_id(id, street, city, state, zip_code, type)';

    // Create the lead record
    const { data: newLeadData, error: leadError } = await supabase
      .from('leads_ins_info')
      .insert(leadInsert)
      .select(selectQuery)
      .single();

    if (leadError) {
      console.error('Error creating lead:', leadError);
      throw leadError;
    }

    // Process the lead to ensure it has the expected structure for legacy components
    const leadData = newLeadData as any; // Type assertion for dynamic Supabase data
    const processedLead: Lead = {
      ...leadData,
      // Map joined fields to their expected properties
      status: typeof leadData.status === 'object' && leadData.status?.value ? leadData.status.value : 'New',
      insurance_type: typeof leadData.insurance_type === 'object' && leadData.insurance_type?.name ? leadData.insurance_type.name : 'Auto',

      // Map address fields for backward compatibility
      address_street: leadData.address?.street || null,
      address_city: leadData.address?.city || null,
      address_state: leadData.address?.state || null,
      address_zip_code: leadData.address?.zip_code || null,

      mailing_address_street: leadData.mailing_address?.street || null,
      mailing_address_city: leadData.mailing_address?.city || null,
      mailing_address_state: leadData.mailing_address?.state || null,
      mailing_address_zip_code: leadData.mailing_address?.zip_code || null,

      // Ensure we have status_legacy and insurance_type_legacy for compatibility
      status_legacy: typeof leadData.status === 'object' && leadData.status?.value ? leadData.status.value as LeadStatus : 'New',
      insurance_type_legacy: typeof leadData.insurance_type === 'object' && leadData.insurance_type?.name ? leadData.insurance_type.name : 'Auto'
    };

    return processedLead;
  } catch (err) {
    console.error('Error in createLead:', err);
    throw err;
  }
}
