import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pipelineId = parseInt(id);

    const supabase = await createClient();

    // Fetch pipeline - stages are stored as JSONB in the stages column
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('*')
      .eq('id', pipelineId)
      .single();

    if (pipelineError) {
      if (pipelineError.code === 'PGRST116') {
        return NextResponse.json(
          { error: `Pipeline with ID ${pipelineId} not found` },
          { status: 404 }
        );
      }
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
    console.error('Error fetching pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipeline' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pipelineId = parseInt(id);
    const pipeline = await request.json();

    const supabase = await createClient();

    // If setting this pipeline as default, unset any existing default
    if (pipeline.is_default) {
      await supabase
        .from('pipelines')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    // Update the pipeline
    const { data: updatedPipeline, error: updateError } = await supabase
      .from('pipelines')
      .update({
        name: pipeline.name,
        description: pipeline.description,
        lead_type: pipeline.lead_type,
        is_default: pipeline.is_default,
        display_order: pipeline.display_order,
        updated_at: new Date().toISOString()
      })
      .eq('id', pipelineId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: `Pipeline with ID ${pipelineId} not found` },
          { status: 404 }
        );
      }
      throw updateError;
    }

    return NextResponse.json(updatedPipeline);
  } catch (error) {
    console.error('Error updating pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to update pipeline' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pipelineId = parseInt(id);

    const supabase = await createClient();

    // Check if this is the default pipeline
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('is_default')
      .eq('id', pipelineId)
      .single();

    if (pipelineError) {
      if (pipelineError.code === 'PGRST116') {
        return NextResponse.json(
          { error: `Pipeline with ID ${pipelineId} not found` },
          { status: 404 }
        );
      }
      throw pipelineError;
    }

    if (pipeline.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default pipeline' },
        { status: 400 }
      );
    }

    // Check if there are leads using this pipeline
    const { count: leadCount, error: countError } = await supabase
      .from('leads_contact_info')
      .select('*', { count: 'exact', head: true })
      .eq('pipeline_id', pipelineId);

    if (countError) {
      throw countError;
    }

    if (leadCount && leadCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete pipeline with ${leadCount} leads. Reassign leads first.` },
        { status: 400 }
      );
    }

    // Delete the pipeline (cascade will delete statuses)
    const { error: deleteError } = await supabase
      .from('pipelines')
      .delete()
      .eq('id', pipelineId);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to delete pipeline' },
      { status: 500 }
    );
  }
}
