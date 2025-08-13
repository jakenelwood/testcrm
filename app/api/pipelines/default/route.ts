import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch default pipeline with its statuses using Supabase
    const { data: pipeline, error: pipelineError } = await supabase
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
      .eq('is_default', true)
      .single();

    if (pipelineError) {
      if (pipelineError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No default pipeline found' },
          { status: 404 }
        );
      }
      throw pipelineError;
    }

    // Transform the data to match the expected format
    const transformedPipeline = {
      ...pipeline,
      statuses: pipeline.pipeline_statuses?.sort((a, b) => a.display_order - b.display_order) || []
    };

    return NextResponse.json(transformedPipeline);
  } catch (error) {
    console.error('Error fetching default pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch default pipeline' },
      { status: 500 }
    );
  }
}
