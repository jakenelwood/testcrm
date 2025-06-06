import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pipelineId = parseInt(params.id);
    
    const result = await query(`
      SELECT 
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ps.id,
              'pipeline_id', ps.pipeline_id,
              'name', ps.name,
              'description', ps.description,
              'is_final', ps.is_final,
              'display_order', ps.display_order,
              'color_hex', ps.color_hex,
              'icon_name', ps.icon_name,
              'ai_action_template', ps.ai_action_template,
              'created_at', ps.created_at,
              'updated_at', ps.updated_at
            ) ORDER BY ps.display_order
          ) FILTER (WHERE ps.id IS NOT NULL),
          '[]'::json
        ) as statuses
      FROM pipelines p
      LEFT JOIN pipeline_statuses ps ON p.id = ps.pipeline_id
      WHERE p.id = $1
      GROUP BY p.id
    `, [pipelineId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `Pipeline with ID ${pipelineId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
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
  { params }: { params: { id: string } }
) {
  try {
    const pipelineId = parseInt(params.id);
    const pipeline = await request.json();
    
    // If setting this pipeline as default, unset any existing default
    if (pipeline.is_default) {
      await query(`UPDATE pipelines SET is_default = false WHERE is_default = true`);
    }

    const result = await query(`
      UPDATE pipelines 
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        lead_type = COALESCE($4, lead_type),
        is_default = COALESCE($5, is_default),
        display_order = COALESCE($6, display_order),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [
      pipelineId,
      pipeline.name,
      pipeline.description,
      pipeline.lead_type,
      pipeline.is_default,
      pipeline.display_order
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: `Pipeline with ID ${pipelineId} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
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
  { params }: { params: { id: string } }
) {
  try {
    const pipelineId = parseInt(params.id);
    
    // Check if this is the default pipeline
    const pipelineResult = await query(`
      SELECT is_default FROM pipelines WHERE id = $1
    `, [pipelineId]);

    if (pipelineResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Pipeline with ID ${pipelineId} not found` },
        { status: 404 }
      );
    }

    if (pipelineResult.rows[0].is_default) {
      return NextResponse.json(
        { error: 'Cannot delete the default pipeline' },
        { status: 400 }
      );
    }

    // Check if there are leads using this pipeline
    const leadsResult = await query(`
      SELECT COUNT(*) as count FROM leads WHERE pipeline_id = $1
    `, [pipelineId]);

    const leadCount = parseInt(leadsResult.rows[0].count);
    if (leadCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete pipeline with ${leadCount} leads. Reassign leads first.` },
        { status: 400 }
      );
    }

    // Delete the pipeline (cascade will delete statuses)
    await query(`DELETE FROM pipelines WHERE id = $1`, [pipelineId]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to delete pipeline' },
      { status: 500 }
    );
  }
}
