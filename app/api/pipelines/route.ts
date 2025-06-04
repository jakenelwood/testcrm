import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/client';

export async function GET() {
  try {
    // Fetch pipelines with their statuses using a JOIN query
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
      GROUP BY p.id
      ORDER BY p.display_order ASC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pipelines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const pipeline = await request.json();
    
    const result = await query(`
      INSERT INTO pipelines (name, description, lead_type, is_default, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      pipeline.name,
      pipeline.description || null,
      pipeline.lead_type || 'Personal',
      pipeline.is_default || false,
      pipeline.display_order || 999
    ]);

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to create pipeline' },
      { status: 500 }
    );
  }
}
