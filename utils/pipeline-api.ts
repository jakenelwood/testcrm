/**
 * PIPELINE API UTILITIES
 *
 * This file contains functions for interacting with the pipeline API.
 * It handles the fetching and transformation of pipeline data.
 * Updated to work with API routes instead of direct database connection.
 */

import { Pipeline, PipelineStatus } from "@/types/lead";

/**
 * Fetches all pipelines with their statuses
 */
export async function fetchPipelines(): Promise<Pipeline[]> {
  try {
    const response = await fetch('/api/pipelines');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data as Pipeline[];
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
    const response = await fetch(`/api/pipelines/${pipelineId}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
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
    const response = await fetch('/api/pipelines/default');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
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
    const response = await fetch('/api/pipelines', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
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
    const response = await fetch(`/api/pipelines/${pipelineId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipeline),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
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
    const response = await fetch(`/api/pipelines/${pipelineId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }
  } catch (err) {
    console.error(`Error in deletePipeline for ID ${pipelineId}:`, err);
    throw err;
  }
}

/**
 * Updates a lead's pipeline and status
 */
export async function updateLeadPipelineAndStatus(leadId: string, pipelineId: number, statusId: number): Promise<void> {
  try {
    const response = await fetch(`/api/leads/${leadId}/pipeline`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pipelineId, statusId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (err) {
    console.error(`Error in updateLeadPipelineAndStatus for lead ${leadId}:`, err);
    throw err;
  }
}
