import { NextResponse } from 'next/server';
import { query } from '@/lib/database/client';

export async function GET() {
  try {
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
      WHERE p.is_default = true
      GROUP BY p.id
    `);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'No default pipeline found' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching default pipeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch default pipeline' },
      { status: 500 }
    );
  }
}
