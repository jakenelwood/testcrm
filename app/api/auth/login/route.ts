import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { jwt as jwtConfig } from '@/lib/config/environment';
import type { StringValue } from 'ms';

// Input validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: validationResult.error.errors.map(err => err.message)
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    // Check if user exists in the database with password hash
    const result = await query(`
      SELECT id, email, full_name, role, organization_id, is_active, password_hash
      FROM users
      WHERE email = $1 AND is_active = true
    `, [email]);

    if (result.rows.length === 0) {
      // Use generic error message to prevent user enumeration
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create JWT token with secure configuration
    if (!jwtConfig.secret) {
      console.error('JWT_SECRET is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id
    };

    const options = {
      expiresIn: jwtConfig.expiresIn as StringValue,
      issuer: 'aicrm',
      audience: 'aicrm-users'
    };

    const token = jwt.sign(payload, jwtConfig.secret, options);

    // Log successful authentication (without sensitive data)
    console.log(`User authenticated: ${user.email} (ID: ${user.id})`);

    // Create response with user data (exclude sensitive fields)
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        organization_id: user.organization_id
      },
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    // Set secure HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/'
    });

    return response;
  } catch (error) {
    // Log error without exposing sensitive information
    console.error('Authentication error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
