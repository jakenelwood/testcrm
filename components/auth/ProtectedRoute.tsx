'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Permission, userHasPermission, getUserRole } from '@/lib/auth/permissions';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  adminOnly?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  adminOnly = false,
  fallback,
  redirectTo = '/auth/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    // Get organization ID from localStorage or cookie
    const orgId = localStorage.getItem('organizationId') || 
                  document.cookie
                    .split('; ')
                    .find(row => row.startsWith('organization-id='))
                    ?.split('=')[1];
    
    setOrganizationId(orgId);
  }, []);

  useEffect(() => {
    async function checkAccess() {
      if (loading) return;

      // Redirect to login if not authenticated
      if (!user) {
        const currentPath = window.location.pathname;
        router.push(`${redirectTo}?redirectTo=${encodeURIComponent(currentPath)}`);
        return;
      }

      // Redirect to organization selection if no organization
      if (!organizationId) {
        router.push('/onboarding/organization');
        return;
      }

      try {
        // Check admin requirement
        if (adminOnly) {
          const userRole = await getUserRole(user.id, organizationId);
          if (!['admin', 'owner'].includes(userRole.toLowerCase())) {
            setHasAccess(false);
            return;
          }
        }

        // Check permissions
        if (requiredPermissions.length > 0) {
          let hasPermission = false;
          
          for (const permission of requiredPermissions) {
            if (await userHasPermission(user.id, organizationId, permission)) {
              hasPermission = true;
              break;
            }
          }

          if (!hasPermission) {
            setHasAccess(false);
            return;
          }
        }

        setHasAccess(true);
      } catch (error) {
        console.error('Error checking access:', error);
        setHasAccess(false);
      }
    }

    checkAccess();
  }, [user, loading, organizationId, adminOnly, requiredPermissions, router, redirectTo]);

  // Show loading state
  if (loading || hasAccess === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show access denied
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to access this page.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
