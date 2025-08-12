/**
 * Authentication middleware for route protection
 * Handles authentication, authorization, and organization access control
 */

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { Permission, userHasPermission, getUserRole } from './permissions';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/reset-password',
  '/auth/callback',
  '/api/auth/callback',
  '/api/health',
];

// Routes that require specific permissions
const PROTECTED_ROUTES: Record<string, Permission[]> = {
  '/dashboard/leads': ['leads.view'],
  '/dashboard/clients': ['clients.view'],
  '/dashboard/quotes': ['quotes.view'],
  '/dashboard/reports': ['reports.view'],
  '/dashboard/users': ['users.view'],
  '/dashboard/settings': ['organization.view'],
  '/api/leads': ['leads.view'],
  '/api/clients': ['clients.view'],
  '/api/quotes': ['quotes.view'],
  '/api/users': ['users.view'],
};

// Admin-only routes
const ADMIN_ROUTES = [
  '/dashboard/admin',
  '/dashboard/organization',
  '/api/admin',
  '/api/organization',
];

/**
 * Check if route is public (doesn't require authentication)
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  });
}

/**
 * Check if route requires admin access
 */
export function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Get required permissions for a route
 */
export function getRoutePermissions(pathname: string): Permission[] {
  for (const [route, permissions] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return permissions;
    }
  }
  return [];
}

/**
 * Create authentication middleware
 */
export async function createAuthMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          // Handle cookie setting in middleware
        },
        remove(name: string, options: any) {
          // Handle cookie removal in middleware
        },
      },
    }
  );

  // Get current user
  const { data: { user }, error } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user || error) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Get user's organization from session or default
  const organizationId = request.headers.get('x-organization-id') || 
                        request.cookies.get('organization-id')?.value;

  if (!organizationId && !pathname.startsWith('/onboarding')) {
    // Redirect to organization selection if no organization is set
    return NextResponse.redirect(new URL('/onboarding/organization', request.url));
  }

  // Check admin routes
  if (isAdminRoute(pathname) && organizationId) {
    const userRole = await getUserRole(user.id, organizationId);
    if (!['admin', 'owner'].includes(userRole.toLowerCase())) {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
    }
  }

  // Check route permissions
  const requiredPermissions = getRoutePermissions(pathname);
  if (requiredPermissions.length > 0 && organizationId) {
    let hasPermission = false;
    
    for (const permission of requiredPermissions) {
      if (await userHasPermission(user.id, organizationId, permission)) {
        hasPermission = true;
        break;
      }
    }

    if (!hasPermission) {
      return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url));
    }
  }

  // Add user and organization info to headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-id', user.id);
  if (organizationId) {
    response.headers.set('x-organization-id', organizationId);
  }

  return response;
}

/**
 * Higher-order function to protect API routes
 */
export function withAuth(
  handler: (request: NextRequest, context: { user: any; organizationId?: string }) => Promise<Response>,
  options: {
    requiredPermissions?: Permission[];
    requireOrganization?: boolean;
    adminOnly?: boolean;
  } = {}
) {
  return async (request: NextRequest) => {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {}, // No-op in API routes
          remove() {}, // No-op in API routes
        },
      }
    );

    // Get current user
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get organization ID
    const organizationId = request.headers.get('x-organization-id') || 
                          request.cookies.get('organization-id')?.value;

    if (options.requireOrganization && !organizationId) {
      return NextResponse.json(
        { error: 'Organization required' },
        { status: 400 }
      );
    }

    // Check admin requirement
    if (options.adminOnly && organizationId) {
      const userRole = await getUserRole(user.id, organizationId);
      if (!['admin', 'owner'].includes(userRole.toLowerCase())) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    // Check permissions
    if (options.requiredPermissions && options.requiredPermissions.length > 0 && organizationId) {
      let hasPermission = false;
      
      for (const permission of options.requiredPermissions) {
        if (await userHasPermission(user.id, organizationId, permission)) {
          hasPermission = true;
          break;
        }
      }

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Call the handler with authenticated context
    return handler(request, { user, organizationId });
  };
}

/**
 * Extract organization ID from request
 */
export function getOrganizationIdFromRequest(request: NextRequest): string | null {
  // Try header first (set by middleware)
  const headerOrgId = request.headers.get('x-organization-id');
  if (headerOrgId) return headerOrgId;

  // Try cookie
  const cookieOrgId = request.cookies.get('organization-id')?.value;
  if (cookieOrgId) return cookieOrgId;

  // Try URL parameter for API routes
  const url = new URL(request.url);
  const paramOrgId = url.searchParams.get('organizationId');
  if (paramOrgId) return paramOrgId;

  return null;
}
