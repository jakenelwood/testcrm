import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

// Validation schema for updating lead pipeline and status
const updateLeadPipelineSchema = z.object({
  pipelineId: z.number().int().positive('Pipeline ID must be a positive integer'),
  statusId: z.number().int().positive('Status ID must be a positive integer'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const body = await request.json();

    // Validate request body
    const validation = updateLeadPipelineSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { pipelineId, statusId } = validation.data;

    const supabase = await createClient();

    // Verify the lead exists
    const { data: existingLead, error: leadError } = await supabase
      .from('leads')
      .select('id')
      .eq('id', leadId)
      .single();

    if (leadError) {
      if (leadError.code === 'PGRST116') {
        return NextResponse.json(
          { error: `Lead with ID ${leadId} not found` },
          { status: 404 }
        );
      }
      throw leadError;
    }

    // Verify the pipeline exists
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('id')
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

    // Verify the status exists and belongs to the pipeline
    const { data: status, error: statusError } = await supabase
      .from('pipeline_statuses')
      .select('id, pipeline_id')
      .eq('id', statusId)
      .single();

    if (statusError) {
      if (statusError.code === 'PGRST116') {
        return NextResponse.json(
          { error: `Status with ID ${statusId} not found` },
          { status: 404 }
        );
      }
      throw statusError;
    }

    // Verify the status belongs to the specified pipeline
    if (status.pipeline_id !== pipelineId) {
      return NextResponse.json(
        { error: `Status ${statusId} does not belong to pipeline ${pipelineId}` },
        { status: 400 }
      );
    }

    // Update the lead's pipeline and status
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        pipeline_id: pipelineId,
        pipeline_status_id: statusId,
        updated_at: new Date().toISOString(),
        status_changed_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating lead pipeline and status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update lead pipeline and status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Lead pipeline and status updated successfully',
      lead: updatedLead
    });

  } catch (error) {
    console.error('Error in PUT /api/leads/[id]/pipeline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
