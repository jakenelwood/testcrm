import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * PIPELINES API
 *
 * Fetches all pipelines from the database with their stages transformed
 * to match the expected pipeline_statuses format.
 */
// Security headers helper
function addSecurityHeaders(response: NextResponse) {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  return response;
}

// Transform pipeline stages to match expected format
function transformPipelineStages(pipeline: any) {
  return {
    ...pipeline,
    pipeline_statuses: (pipeline.stages || [])
      .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
      .map((stage: any, index: number) => ({
        id: index + 1, // Generate sequential IDs for compatibility
        pipeline_id: pipeline.id,
        name: stage.name,
        description: stage.description || null,
        is_final: stage.is_final || false,
        display_order: stage.order || index + 1,
        color_hex: stage.color || '#3B82F6',
        icon_name: stage.icon_name || null,
        ai_action_template: stage.ai_action_template || null,
        created_at: pipeline.created_at,
        updated_at: pipeline.updated_at
      }))
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Fetch all pipelines from the database
    const { data: pipelines, error: pipelinesError } = await supabase
      .from('pipelines')
      .select('*')
      .order('created_at', { ascending: true });

    if (pipelinesError) {
      console.error('Error fetching pipelines:', pipelinesError);
      throw pipelinesError;
    }

    // Transform each pipeline to include pipeline_statuses format
    const transformedPipelines = (pipelines || []).map(transformPipelineStages);

    const response = NextResponse.json(transformedPipelines);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching pipelines:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });

    const response = NextResponse.json(
      {
        error: 'Failed to fetch pipelines',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Create new pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .insert([body])
      .select()
      .single();

    if (pipelineError) {
      console.error('Error creating pipeline:', pipelineError);
      throw pipelineError;
    }

    const transformedPipeline = transformPipelineStages(pipeline);
    const response = NextResponse.json(transformedPipeline, { status: 201 });
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error creating pipeline:', error);
    const response = NextResponse.json(
      {
        error: 'Failed to create pipeline',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}
