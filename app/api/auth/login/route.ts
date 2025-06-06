import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists in the database
    const result = await query(`
      SELECT id, email, full_name, role, organization_id, is_active
      FROM users
      WHERE email = $1 AND is_active = true
    `, [email]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Development bypass - accept any password for existing users
    // In production, you'd want proper password authentication
    if (password !== 'dev123') {
      return NextResponse.json(
        { error: 'Invalid password. Use "dev123" for development.' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id
      },
      process.env.JWT_SECRET || 'dev-secret-key',
      { expiresIn: '24h' }
    );

    // Create response with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: user.role,
        organization_id: user.organization_id
      },
      token
    });

    // Set HTTP-only cookie for authentication
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
