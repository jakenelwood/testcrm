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
      // First, check if the leads_ins_info table has the expected structure
      const { data: leadsColumns, error: columnsError } = await supabase
        .from('leads_ins_info')
        .select('*')
        .limit(1);

      if (columnsError) {
        console.error('Error checking leads table structure:', columnsError);
        return []; // Return empty array instead of throwing
      }

      // Determine which joins to include based on the available columns
      const hasClientId = leadsColumns && leadsColumns.length > 0 &&
        ('client_id' in leadsColumns[0] || 'leads_contact_info_id' in leadsColumns[0]);
      const hasStatusId = leadsColumns && leadsColumns.length > 0 && 'status_id' in leadsColumns[0];
      const hasInsuranceTypeId = leadsColumns && leadsColumns.length > 0 && 'insurance_type_id' in leadsColumns[0];

      // Build the select query based on available columns
      let selectQuery = '*';
      // Always include client data since we've added the client_id/leads_contact_info_id column
      if ('leads_contact_info_id' in leadsColumns[0]) {
        selectQuery += ', client:leads_contact_info_id(id, name, email, phone_number, lead_type)';
      } else {
        selectQuery += ', client:client_id(id, name, email, phone_number, client_type)';
      }
      if (hasStatusId) {
        selectQuery += ', status:lead_statuses(value)';
      }
      if (hasInsuranceTypeId) {
        selectQuery += ', insurance_type:insurance_types(name)';
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
      const processedLeads = data?.map(lead => {
        // Create a processed lead with the new schema structure
        const processedLead: Lead = {
          ...lead,
          // Map joined fields to their expected properties
          status: typeof lead.status === 'object' && lead.status?.value ? lead.status.value : 'New',
          insurance_type: typeof lead.insurance_type === 'object' && lead.insurance_type?.name ? lead.insurance_type.name : 'Auto',

          // Add client contact information fields
          // For personal lines (Alpha pipeline), use the client name split into first/last
          // For business lines (Bravo pipeline), use the business name as first_name
          first_name: typeof lead.client === 'object' && lead.client?.name ?
            ((lead.client.client_type === 'Business' || lead.client.lead_type === 'Business') ? lead.client.name : lead.client.name.split(' ')[0]) :
            (lead.first_name || ''),
          last_name: typeof lead.client === 'object' && lead.client?.name ?
            ((lead.client.client_type === 'Business' || lead.client.lead_type === 'Business') ? '' : lead.client.name.split(' ').slice(1).join(' ')) :
            (lead.last_name || ''),
          email: typeof lead.client === 'object' ? lead.client?.email || '' : lead.email || '',
          phone_number: typeof lead.client === 'object' ? lead.client?.phone_number || '' : lead.phone_number || '',

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
    return []; // Return empty array instead of throwing
  }
}

/**
 * Fetches leads for a specific pipeline with server-side filtering
 * This optimized version filters by pipeline_id at the database level
 */
export async function fetchLeadsByPipeline(pipelineId: number, includeNullPipeline: boolean = false): Promise<Lead[]> {
  try {
    return await analyzeQuery(`fetchLeadsByPipeline(${pipelineId}, ${includeNullPipeline})`, async () => {
      // First, check if the leads_ins_info table has the expected structure
      const { data: leadsColumns, error: columnsError } = await supabase
        .from('leads_ins_info')
        .select('*')
        .limit(1);

      if (columnsError) {
        console.error('Error checking leads table structure:', columnsError);
        return []; // Return empty array instead of throwing
      }

      // Check if pipeline_id column exists
      const hasPipelineId = leadsColumns && leadsColumns.length > 0 && 'pipeline_id' in leadsColumns[0];
      if (!hasPipelineId) {
        console.error('Pipeline_id column not found in leads table');
        return []; // Return empty array if pipeline_id doesn't exist
      }

      // Determine which joins to include based on the available columns
      const hasClientId = leadsColumns && leadsColumns.length > 0 &&
        ('client_id' in leadsColumns[0] || 'leads_contact_info_id' in leadsColumns[0]);
      const hasStatusId = leadsColumns && leadsColumns.length > 0 && 'status_id' in leadsColumns[0];
      const hasInsuranceTypeId = leadsColumns && leadsColumns.length > 0 && 'insurance_type_id' in leadsColumns[0];

      // Build the select query based on available columns
      let selectQuery = '*';
      // Always include client data since we've added the client_id/leads_contact_info_id column
      if ('leads_contact_info_id' in leadsColumns[0]) {
        selectQuery += ', client:leads_contact_info_id(id, name, email, phone_number, lead_type)';
      } else {
        selectQuery += ', client:client_id(id, name, email, phone_number, client_type)';
      }
      if (hasStatusId) {
        selectQuery += ', status:lead_statuses(value)';
      }
      if (hasInsuranceTypeId) {
        selectQuery += ', insurance_type:insurance_types(name)';
      }

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
      const processedLeads = data?.map(lead => {
        // Create a processed lead with the new schema structure
        const processedLead: Lead = {
          ...lead,
          // Map joined fields to their expected properties
          status: typeof lead.status === 'object' && lead.status?.value ? lead.status.value : 'New',
          insurance_type: typeof lead.insurance_type === 'object' && lead.insurance_type?.name ? lead.insurance_type.name : 'Auto',

          // Add client contact information fields
          // For personal lines (Alpha pipeline), use the client name split into first/last
          // For business lines (Bravo pipeline), use the business name as first_name
          first_name: typeof lead.client === 'object' && lead.client?.name ?
            ((lead.client.client_type === 'Business' || lead.client.lead_type === 'Business') ? lead.client.name : lead.client.name.split(' ')[0]) :
            (lead.first_name || ''),
          last_name: typeof lead.client === 'object' && lead.client?.name ?
            ((lead.client.client_type === 'Business' || lead.client.lead_type === 'Business') ? '' : lead.client.name.split(' ').slice(1).join(' ')) :
            (lead.last_name || ''),
          email: typeof lead.client === 'object' ? lead.client?.email || '' : lead.email || '',
          phone_number: typeof lead.client === 'object' ? lead.client?.phone_number || '' : lead.phone_number || '',

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
    return []; // Return empty array instead of throwing
  }
}

/**
 * Updates a lead's status in the database
 */
export async function updateLeadStatus(leadId: string, statusId: number): Promise<void> {
  try {
    return await analyzeQuery(`updateLeadStatus(${leadId}, ${statusId})`, async () => {
      // First, check if the leads_ins_info table has the expected structure
      const { data: leadsColumns, error: columnsError } = await supabase
        .from('leads_ins_info')
        .select('*')
        .limit(1);

      if (columnsError) {
        console.error('Error checking leads table structure:', columnsError);
        throw new Error('Could not check leads table structure');
      }

      // Check if status_id column exists
      const hasStatusId = leadsColumns && leadsColumns.length > 0 && 'status_id' in leadsColumns[0];
      const hasStatusChangedAt = leadsColumns && leadsColumns.length > 0 && 'status_changed_at' in leadsColumns[0];

      if (!hasStatusId) {
        console.error('Status_id column not found in leads table');
        throw new Error('Status_id column not found in leads table');
      }

      // Build the update object based on available columns
      const updateData: any = {
        status_id: statusId,
        updated_at: new Date().toISOString()
      };

      if (hasStatusChangedAt) {
        updateData.status_changed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('leads_ins_info')
        .update(updateData)
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
      // First, check if the leads_ins_info table has the expected structure
      const { data: leadsColumns, error: columnsError } = await supabase
        .from('leads_ins_info')
        .select('*')
        .limit(1);

      if (columnsError) {
        console.error('Error checking leads table structure:', columnsError);
        throw new Error('Could not check leads table structure');
      }

      // Determine which columns to include based on the available columns
      const hasClientId = leadsColumns && leadsColumns.length > 0 &&
        ('client_id' in leadsColumns[0] || 'leads_contact_info_id' in leadsColumns[0]);
      const hasStatusId = leadsColumns && leadsColumns.length > 0 && 'status_id' in leadsColumns[0];
      const hasInsuranceTypeId = leadsColumns && leadsColumns.length > 0 && 'insurance_type_id' in leadsColumns[0];
      const hasPipelineId = leadsColumns && leadsColumns.length > 0 && 'pipeline_id' in leadsColumns[0];

      let clientId = null;

      // Create a client record if the leads table has a client_id or leads_contact_info_id column
      if (hasClientId) {
        // Check if lead_type column exists
        const { data: clientColumns, error: clientColumnsError } = await supabase
          .from('leads_contact_info')
          .select('*')
          .limit(1);

        const hasLeadType = clientColumns && clientColumns.length > 0 && 'lead_type' in clientColumns[0];

        const { data: clientData, error: clientError } = await supabase
          .from('leads_contact_info')
          .insert({
            [hasLeadType ? 'lead_type' : 'client_type']: leadData.client_type || 'Individual',
            name: leadData.client_type === 'Business' ? leadData.name : `${leadData.first_name} ${leadData.last_name}`.trim(),
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

        clientId = clientData.id;
      }

      // Build the lead insert object based on available columns
      const leadInsert: any = {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Always set client_id or leads_contact_info_id since we've added the column
      if (clientId) {
        if ('leads_contact_info_id' in leadsColumns[0]) {
          leadInsert.leads_contact_info_id = clientId;
        } else {
          leadInsert.client_id = clientId;
        }
      }

      if (hasStatusId) {
        leadInsert.status_id = 1; // New status
      }

      if (hasInsuranceTypeId) {
        leadInsert.insurance_type_id = getInsuranceTypeId(leadData.insurance_type);
      }

      if (hasPipelineId) {
        // Assign business clients to the Bravo pipeline (id: 2), individuals to Alpha (id: 1)
        if (hasClientId && clientId) {
          const { data: clientData, error: clientFetchError } = await supabase
            .from('leads_contact_info')
            .select('client_type, lead_type')
            .eq('id', clientId)
            .single();

          if (!clientFetchError && clientData) {
            const clientType = clientData.lead_type || clientData.client_type;
            leadInsert.pipeline_id = clientType === 'Business' ? 2 : 1;
          } else {
            leadInsert.pipeline_id = 1; // Default to Alpha pipeline if error
          }
        } else {
          leadInsert.pipeline_id = 1; // Default to Alpha pipeline if no client_id
        }
      }

      // Add direct contact information if client_id is not used
      if (!hasClientId) {
        leadInsert.first_name = leadData.first_name;
        leadInsert.last_name = leadData.last_name;
        leadInsert.email = leadData.email || null;
        leadInsert.phone_number = leadData.phone_number || null;
      }

      // Add common fields
      leadInsert.assigned_to = leadData.assigned_to || 'Brian Berg';
      leadInsert.notes = leadData.notes || null;
      leadInsert.current_carrier = leadData.current_carrier || null;
      leadInsert.premium = leadData.premium ? parseFloat(leadData.premium) : null;

      // Build the select query based on available columns
      let selectQuery = '*';
      // Always include client data since we've added the client_id/leads_contact_info_id column
      if ('leads_contact_info_id' in leadsColumns[0]) {
        selectQuery += ', client:leads_contact_info_id(id, name, email, phone_number, lead_type)';
      } else {
        selectQuery += ', client:client_id(id, name, email, phone_number, client_type)';
      }
      if (hasStatusId) {
        selectQuery += ', status:lead_statuses(value)';
      }
      if (hasInsuranceTypeId) {
        selectQuery += ', insurance_type:insurance_types(name)';
      }

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
      const processedLead: Lead = {
        ...newLeadData,
        // Map joined fields to their expected properties
        status: typeof newLeadData.status === 'object' && newLeadData.status?.value ? newLeadData.status.value : 'New',
        insurance_type: typeof newLeadData.insurance_type === 'object' && newLeadData.insurance_type?.name ? newLeadData.insurance_type.name : 'Auto',

        // Add client contact information fields
        // For personal lines (Alpha pipeline), use the client name split into first/last
        // For business lines (Bravo pipeline), use the business name as first_name
        first_name: typeof newLeadData.client === 'object' && newLeadData.client?.name ?
          ((newLeadData.client.client_type === 'Business' || newLeadData.client.lead_type === 'Business') ?
            newLeadData.client.name : newLeadData.client.name.split(' ')[0]) :
          (newLeadData.first_name || ''),
        last_name: typeof newLeadData.client === 'object' && newLeadData.client?.name ?
          ((newLeadData.client.client_type === 'Business' || newLeadData.client.lead_type === 'Business') ?
            '' : newLeadData.client.name.split(' ').slice(1).join(' ')) :
          (newLeadData.last_name || ''),
        email: typeof newLeadData.client === 'object' ? newLeadData.client?.email || '' : newLeadData.email || '',
        phone_number: typeof newLeadData.client === 'object' ? newLeadData.client?.phone_number || '' : newLeadData.phone_number || '',

        // Ensure we have status_legacy and insurance_type_legacy for compatibility
        status_legacy: typeof newLeadData.status === 'object' && newLeadData.status?.value ? newLeadData.status.value as LeadStatus : 'New',
        insurance_type_legacy: typeof newLeadData.insurance_type === 'object' && newLeadData.insurance_type?.name ? newLeadData.insurance_type.name as InsuranceType : 'Auto'
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
