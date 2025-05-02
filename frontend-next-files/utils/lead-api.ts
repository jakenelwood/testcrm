/**
 * LEAD API UTILITIES
 *
 * This file contains functions for interacting with the leads API.
 * It handles the fetching and transformation of lead data from the new normalized schema.
 */

import { Lead, LeadStatus, InsuranceType } from "@/types/lead";
import supabase from '@/utils/supabase/client';
import { analyzeQuery } from './query-analyzer';

/**
 * Fetches leads with joined client, status, and insurance type information
 * and transforms them to be compatible with the UI components
 */
export async function fetchLeadsWithRelations(): Promise<Lead[]> {
  try {
    return await analyzeQuery('fetchLeadsWithRelations', async () => {
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
          status: typeof lead.status === 'object' && lead.status?.value ? lead.status.value : 'New',
          insurance_type: typeof lead.insurance_type === 'object' && lead.insurance_type?.name ? lead.insurance_type.name : 'Auto',

          // Add legacy fields from client data for backward compatibility
          first_name: typeof lead.client === 'object' && lead.client?.name ? lead.client.name.split(' ')[0] : '',
          last_name: typeof lead.client === 'object' && lead.client?.name ? lead.client.name.split(' ').slice(1).join(' ') : '',
          email: typeof lead.client === 'object' ? lead.client?.email || '' : '',
          phone_number: typeof lead.client === 'object' ? lead.client?.phone_number || '' : '',

          // Ensure we have status_legacy and insurance_type_legacy for compatibility
          status_legacy: typeof lead.status === 'object' && lead.status?.value ? lead.status.value as LeadStatus : 'New',
          insurance_type_legacy: typeof lead.insurance_type === 'object' && lead.insurance_type?.name ? lead.insurance_type.name as InsuranceType : 'Auto'
        };

        return processedLead;
      }) || [];

      return processedLeads;
    });
  } catch (err) {
    console.error('Error in fetchLeadsWithRelations:', err);
    throw err;
  }
}

/**
 * Fetches leads for a specific pipeline with server-side filtering
 * This optimized version filters by pipeline_id at the database level
 */
export async function fetchLeadsByPipeline(pipelineId: number, includeNullPipeline: boolean = false): Promise<Lead[]> {
  try {
    return await analyzeQuery(`fetchLeadsByPipeline(${pipelineId}, ${includeNullPipeline})`, async () => {
      // Start building the query
      let query = supabase
        .from('leads')
        .select(`
          *,
          client:client_id(*),
          status:lead_statuses!inner(value),
          insurance_type:insurance_types!inner(name)
        `);
      
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
        throw error;
      }
      
      // Process the leads to ensure they have the expected structure for legacy components
      const processedLeads = data?.map(lead => {
        // Create a processed lead with the new schema structure
        const processedLead: Lead = {
          ...lead,
          // Map joined fields to their expected properties
          status: typeof lead.status === 'object' && lead.status?.value ? lead.status.value : 'New',
          insurance_type: typeof lead.insurance_type === 'object' && lead.insurance_type?.name ? lead.insurance_type.name : 'Auto',

          // Add legacy fields from client data for backward compatibility
          first_name: typeof lead.client === 'object' && lead.client?.name ? lead.client.name.split(' ')[0] : '',
          last_name: typeof lead.client === 'object' && lead.client?.name ? lead.client.name.split(' ').slice(1).join(' ') : '',
          email: typeof lead.client === 'object' ? lead.client?.email || '' : '',
          phone_number: typeof lead.client === 'object' ? lead.client?.phone_number || '' : '',

          // Ensure we have status_legacy and insurance_type_legacy for compatibility
          status_legacy: typeof lead.status === 'object' && lead.status?.value ? lead.status.value as LeadStatus : 'New',
          insurance_type_legacy: typeof lead.insurance_type === 'object' && lead.insurance_type?.name ? lead.insurance_type.name as InsuranceType : 'Auto'
        };

        return processedLead;
      }) || [];

      return processedLeads;
    });
  } catch (err) {
    console.error('Error in fetchLeadsByPipeline:', err);
    throw err;
  }
}

/**
 * Updates a lead's status in the database
 */
export async function updateLeadStatus(leadId: string, statusId: number): Promise<void> {
  try {
    return await analyzeQuery(`updateLeadStatus(${leadId}, ${statusId})`, async () => {
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
    });
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
    return await analyzeQuery('createLead', async () => {
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
        status: typeof leadData.status === 'object' && leadData.status?.value ? leadData.status.value : 'New',
        insurance_type: typeof leadData.insurance_type === 'object' && leadData.insurance_type?.name ? leadData.insurance_type.name : 'Auto',

        // Add legacy fields from client data for backward compatibility
        first_name: typeof leadData.client === 'object' && leadData.client?.name ? leadData.client.name.split(' ')[0] : '',
        last_name: typeof leadData.client === 'object' && leadData.client?.name ? leadData.client.name.split(' ').slice(1).join(' ') : '',
        email: typeof leadData.client === 'object' ? leadData.client?.email || '' : '',
        phone_number: typeof leadData.client === 'object' ? leadData.client?.phone_number || '' : '',

        // Ensure we have status_legacy and insurance_type_legacy for compatibility
        status_legacy: typeof leadData.status === 'object' && leadData.status?.value ? leadData.status.value as LeadStatus : 'New',
        insurance_type_legacy: typeof leadData.insurance_type === 'object' && leadData.insurance_type?.name ? leadData.insurance_type.name as InsuranceType : 'Auto'
      };

      return processedLead;
    });
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
