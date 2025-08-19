import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch default pipeline - stages are stored as JSONB in the stages column
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('*')
      .eq('is_default', true)
      .single();

    if (pipelineError) {
      if (pipelineError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No default pipeline found' },
          { status: 404 }
        );
      }
      console.error('Error fetching default pipeline:', pipelineError);
      throw pipelineError;
    }

    // Transform the JSONB stages to match the expected pipeline_statuses format
    const transformedPipeline = {
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

    return NextResponse.json(transformedPipeline);
  } catch (error) {
    console.error('Error fetching default pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch default pipeline' },
      { status: 500 }
    );
  }
}
