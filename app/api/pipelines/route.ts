import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { validateRequestBody, addSecurityHeaders } from '@/lib/middleware/validation';

// Pipeline validation schema
const pipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required').max(100, 'Pipeline name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  lead_type: z.enum(['Personal', 'Business']).default('Personal'),
  is_default: z.boolean().default(false),
  display_order: z.number().int().min(0).max(9999).default(999),
});

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch pipelines with their statuses
    const { data: pipelines, error: pipelinesError } = await supabase
      .from('pipelines')
      .select(`
        *,
        pipeline_statuses (
          id,
          pipeline_id,
          name,
          description,
          is_final,
          display_order,
          color_hex,
          icon_name,
          ai_action_template,
          created_at,
          updated_at
        )
      `)
      .order('display_order', { ascending: true });

    if (pipelinesError) {
      throw pipelinesError;
    }

    // Transform the data to match the expected format
    const transformedPipelines = pipelines?.map(pipeline => ({
      ...pipeline,
      statuses: pipeline.pipeline_statuses?.sort((a, b) => a.display_order - b.display_order) || []
    })) || [];

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
    // Validate and sanitize request body
    const body = await request.json();
    const validation = validateRequestBody(pipelineSchema, body);

    // If validation returns a NextResponse, it means validation failed
    if (validation instanceof NextResponse) {
      return addSecurityHeaders(validation);
    }

    const { name, description, lead_type, is_default, display_order } = validation;

    const supabase = await createClient();

    // Insert new pipeline using Supabase
    const { data: pipeline, error: insertError } = await supabase
      .from('pipelines')
      .insert({
        name,
        description,
        lead_type,
        is_default,
        display_order
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    const response = NextResponse.json(pipeline);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error creating pipeline:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    const response = NextResponse.json(
      { error: 'Failed to create pipeline' },
      { status: 500 }
    );
    return addSecurityHeaders(response);
  }
}
