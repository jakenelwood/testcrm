/**
 * PIPELINE API UTILITIES
 *
 * This file contains functions for interacting with the pipeline API.
 * It handles the fetching and transformation of pipeline data.
 */

import { Pipeline, PipelineStatus } from "@/types/lead";
import supabase from '@/utils/supabase/client';

/**
 * Fetches all pipelines with their statuses
 */
export async function fetchPipelines(): Promise<Pipeline[]> {
  try {
    // Fetch pipelines with their statuses
    const { data, error } = await supabase
      .from('pipelines')
      .select(`
        *,
        statuses:pipeline_statuses(*)
      `)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching pipelines:', error);
      throw error;
    }

    // Sort statuses by display_order
    const processedPipelines = data?.map(pipeline => {
      if (pipeline.statuses) {
        pipeline.statuses.sort((a, b) => a.display_order - b.display_order);
      }
      return pipeline as Pipeline;
    }) || [];

    return processedPipelines;
  } catch (err) {
    console.error('Error in fetchPipelines:', err);
    throw err;
  }
}

/**
 * Fetches a single pipeline by ID with its statuses
 */
export async function fetchPipelineById(pipelineId: number): Promise<Pipeline> {
  try {
    const { data, error } = await supabase
      .from('pipelines')
      .select(`
        *,
        statuses:pipeline_statuses(*)
      `)
      .eq('id', pipelineId)
      .single();

    if (error) {
      console.error(`Error fetching pipeline with ID ${pipelineId}:`, error);
      throw error;
    }

    // Sort statuses by display_order
    if (data.statuses) {
      data.statuses.sort((a, b) => a.display_order - b.display_order);
    }

    return data as Pipeline;
  } catch (err) {
    console.error(`Error in fetchPipelineById for ID ${pipelineId}:`, err);
    throw err;
  }
}

/**
 * Fetches the default pipeline with its statuses
 */
export async function fetchDefaultPipeline(): Promise<Pipeline> {
  try {
    const { data, error } = await supabase
      .from('pipelines')
      .select(`
        *,
        statuses:pipeline_statuses(*)
      `)
      .eq('is_default', true)
      .single();

    if (error) {
      console.error('Error fetching default pipeline:', error);
      throw error;
    }

    // Sort statuses by display_order
    if (data.statuses) {
      data.statuses.sort((a, b) => a.display_order - b.display_order);
    }

    return data as Pipeline;
  } catch (err) {
    console.error('Error in fetchDefaultPipeline:', err);
    throw err;
  }
}

/**
 * Creates a new pipeline
 */
export async function createPipeline(pipeline: Omit<Pipeline, 'id' | 'created_at' | 'updated_at'>): Promise<Pipeline> {
  try {
    const { data, error } = await supabase
      .from('pipelines')
      .insert({
        name: pipeline.name,
        description: pipeline.description || null,
        lead_type: pipeline.lead_type || 'Personal',
        is_default: pipeline.is_default || false,
        display_order: pipeline.display_order || 999,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pipeline:', error);
      throw error;
    }

    return data as Pipeline;
  } catch (err) {
    console.error('Error in createPipeline:', err);
    throw err;
  }
}

/**
 * Updates an existing pipeline
 */
export async function updatePipeline(pipelineId: number, pipeline: Partial<Pipeline>): Promise<Pipeline> {
  try {
    // If setting this pipeline as default, unset any existing default
    if (pipeline.is_default) {
      await supabase
        .from('pipelines')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('pipelines')
      .update({
        ...pipeline,
        updated_at: new Date().toISOString()
      })
      .eq('id', pipelineId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating pipeline with ID ${pipelineId}:`, error);
      throw error;
    }

    return data as Pipeline;
  } catch (err) {
    console.error(`Error in updatePipeline for ID ${pipelineId}:`, err);
    throw err;
  }
}

/**
 * Deletes a pipeline
 * Note: This will fail if there are leads using this pipeline
 */
export async function deletePipeline(pipelineId: number): Promise<void> {
  try {
    // Check if this is the default pipeline
    const { data: pipelineData } = await supabase
      .from('pipelines')
      .select('is_default')
      .eq('id', pipelineId)
      .single();

    if (pipelineData?.is_default) {
      throw new Error('Cannot delete the default pipeline');
    }

    // Check if there are leads using this pipeline
    const { count, error: countError } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('pipeline_id', pipelineId);

    if (countError) {
      console.error(`Error checking leads for pipeline ${pipelineId}:`, countError);
      throw countError;
    }

    if (count && count > 0) {
      throw new Error(`Cannot delete pipeline with ${count} leads. Reassign leads first.`);
    }

    // Delete the pipeline (cascade will delete statuses)
    const { error } = await supabase
      .from('pipelines')
      .delete()
      .eq('id', pipelineId);

    if (error) {
      console.error(`Error deleting pipeline with ID ${pipelineId}:`, error);
      throw error;
    }
  } catch (err) {
    console.error(`Error in deletePipeline for ID ${pipelineId}:`, err);
    throw err;
  }
}

/**
 * Creates a new pipeline status
 */
export async function createPipelineStatus(status: Omit<PipelineStatus, 'id' | 'created_at' | 'updated_at'>): Promise<PipelineStatus> {
  try {
    // Get the highest display_order for this pipeline
    const { data: existingStatuses, error: fetchError } = await supabase
      .from('pipeline_statuses')
      .select('display_order')
      .eq('pipeline_id', status.pipeline_id)
      .order('display_order', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error(`Error fetching existing statuses for pipeline ${status.pipeline_id}:`, fetchError);
      throw fetchError;
    }

    // Set display_order to be one more than the highest, or 1 if none exist
    const nextDisplayOrder = existingStatuses && existingStatuses.length > 0
      ? (existingStatuses[0].display_order + 1)
      : 1;

    const { data, error } = await supabase
      .from('pipeline_statuses')
      .insert({
        pipeline_id: status.pipeline_id,
        name: status.name,
        description: status.description || null,
        is_final: status.is_final || false,
        display_order: status.display_order || nextDisplayOrder,
        color_hex: status.color_hex || null,
        icon_name: status.icon_name || null,
        ai_action_template: status.ai_action_template || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pipeline status:', error);
      throw error;
    }

    return data as PipelineStatus;
  } catch (err) {
    console.error('Error in createPipelineStatus:', err);
    throw err;
  }
}

/**
 * Updates an existing pipeline status
 */
export async function updatePipelineStatus(statusId: number, status: Partial<PipelineStatus>): Promise<PipelineStatus> {
  try {
    const { data, error } = await supabase
      .from('pipeline_statuses')
      .update({
        ...status,
        updated_at: new Date().toISOString()
      })
      .eq('id', statusId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating pipeline status with ID ${statusId}:`, error);
      throw error;
    }

    return data as PipelineStatus;
  } catch (err) {
    console.error(`Error in updatePipelineStatus for ID ${statusId}:`, err);
    throw err;
  }
}

/**
 * Deletes a pipeline status
 * Note: This will fail if there are leads using this status
 */
export async function deletePipelineStatus(statusId: number): Promise<void> {
  try {
    // Check if there are leads using this status
    const { count, error: countError } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('status_id', statusId);

    if (countError) {
      console.error(`Error checking leads for status ${statusId}:`, countError);
      throw countError;
    }

    if (count && count > 0) {
      throw new Error(`Cannot delete status with ${count} leads. Move leads to another status first.`);
    }

    // Delete the status
    const { error } = await supabase
      .from('pipeline_statuses')
      .delete()
      .eq('id', statusId);

    if (error) {
      console.error(`Error deleting pipeline status with ID ${statusId}:`, error);
      throw error;
    }
  } catch (err) {
    console.error(`Error in deletePipelineStatus for ID ${statusId}:`, err);
    throw err;
  }
}

/**
 * Reorders pipeline statuses
 * @param pipelineId The ID of the pipeline
 * @param statusIds An array of status IDs in the desired order
 */
export async function reorderPipelineStatuses(pipelineId: number, statusIds: number[]): Promise<void> {
  try {
    // Update each status with its new display_order
    for (let i = 0; i < statusIds.length; i++) {
      const { error } = await supabase
        .from('pipeline_statuses')
        .update({
          display_order: i + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', statusIds[i])
        .eq('pipeline_id', pipelineId);

      if (error) {
        console.error(`Error updating display_order for status ${statusIds[i]}:`, error);
        throw error;
      }
    }
  } catch (err) {
    console.error(`Error in reorderPipelineStatuses for pipeline ${pipelineId}:`, err);
    throw err;
  }
}

/**
 * Updates a lead's pipeline and status
 */
export async function updateLeadPipelineAndStatus(leadId: string, pipelineId: number, statusId: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('leads')
      .update({
        pipeline_id: pipelineId,
        status_id: statusId,
        updated_at: new Date().toISOString(),
        status_changed_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (error) {
      console.error(`Error updating lead ${leadId} pipeline and status:`, error);
      throw error;
    }
  } catch (err) {
    console.error(`Error in updateLeadPipelineAndStatus for lead ${leadId}:`, err);
    throw err;
  }
}
