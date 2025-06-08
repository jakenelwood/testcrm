import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/client';
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

    const response = NextResponse.json(result.rows);
    return addSecurityHeaders(response);
  } catch (error) {
    console.error('Error fetching pipelines:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    const response = NextResponse.json(
      { error: 'Failed to fetch pipelines' },
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

    if (!validation.success) {
      const response = NextResponse.json(
        {
          error: 'Invalid pipeline data',
          details: validation.errors
        },
        { status: 400 }
      );
      return addSecurityHeaders(response);
    }

    const { name, description, lead_type, is_default, display_order } = validation.data;

    // Use parameterized query to prevent SQL injection
    const result = await query(`
      INSERT INTO pipelines (name, description, lead_type, is_default, display_order)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [name, description, lead_type, is_default, display_order]);

    const response = NextResponse.json(result.rows[0]);
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
