'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { 
  Permission, 
  getUserPermissions, 
  getUserRole, 
  userHasPermission,
  isUserAdminOrOwner 
} from '@/lib/auth/permissions';

interface UsePermissionsReturn {
  permissions: Permission[];
  role: string;
  isAdmin: boolean;
  isOwner: boolean;
  loading: boolean;
  error: string | null;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  refetch: () => Promise<void>;
}

export function usePermissions(organizationId?: string): UsePermissionsReturn {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [role, setRole] = useState<string>('user');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get organization ID from props, localStorage, or cookie
  const getOrganizationId = useCallback(() => {
    if (organizationId) return organizationId;
    
    if (typeof window !== 'undefined') {
      return localStorage.getItem('organizationId') || 
             document.cookie
               .split('; ')
               .find(row => row.startsWith('organization-id='))
               ?.split('=')[1] || null;
    }
    
    return null;
  }, [organizationId]);

  const fetchPermissions = useCallback(async () => {
    if (!user) {
      setPermissions([]);
      setRole('user');
      setIsAdmin(false);
      setIsOwner(false);
      setLoading(false);
      return;
    }

    const orgId = getOrganizationId();
    if (!orgId) {
      setPermissions([]);
      setRole('user');
      setIsAdmin(false);
      setIsOwner(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user permissions and role in parallel
      const [userPermissions, userRole, adminStatus] = await Promise.all([
        getUserPermissions(user.id, orgId),
        getUserRole(user.id, orgId),
        isUserAdminOrOwner(user.id, orgId),
      ]);

      setPermissions(userPermissions);
      setRole(userRole);
      setIsAdmin(adminStatus);
      setIsOwner(userRole.toLowerCase() === 'owner');
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch permissions');
      setPermissions([]);
      setRole('user');
      setIsAdmin(false);
      setIsOwner(false);
    } finally {
      setLoading(false);
    }
  }, [user, getOrganizationId]);

  // Fetch permissions when user or organization changes
  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  // Permission checking functions
  const hasPermission = useCallback((permission: Permission): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const hasAnyPermission = useCallback((perms: Permission[]): boolean => {
    return perms.some(permission => permissions.includes(permission));
  }, [permissions]);

  const hasAllPermissions = useCallback((perms: Permission[]): boolean => {
    return perms.every(permission => permissions.includes(permission));
  }, [permissions]);

  return {
    permissions,
    role,
    isAdmin,
    isOwner,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
  };
}

/**
 * Hook for checking a specific permission
 */
export function usePermission(permission: Permission, organizationId?: string): {
  hasPermission: boolean;
  loading: boolean;
  error: string | null;
} {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkPermission() {
      if (!user) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      const orgId = organizationId || 
                   (typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null);
      
      if (!orgId) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await userHasPermission(user.id, orgId, permission);
        setHasPermission(result);
      } catch (err) {
        console.error('Error checking permission:', err);
        setError(err instanceof Error ? err.message : 'Failed to check permission');
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    }

    checkPermission();
  }, [user, permission, organizationId]);

  return { hasPermission, loading, error };
}

/**
 * Hook for checking if user is admin
 */
export function useIsAdmin(organizationId?: string): {
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
} {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const orgId = organizationId || 
                   (typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null);
      
      if (!orgId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await isUserAdminOrOwner(user.id, orgId);
        setIsAdmin(result);
      } catch (err) {
        console.error('Error checking admin status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check admin status');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [user, organizationId]);

  return { isAdmin, loading, error };
}

/**
 * Hook for getting user's role
 */
export function useUserRole(organizationId?: string): {
  role: string;
  loading: boolean;
  error: string | null;
} {
  const { user } = useAuth();
  const [role, setRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setRole('user');
        setLoading(false);
        return;
      }

      const orgId = organizationId || 
                   (typeof window !== 'undefined' ? localStorage.getItem('organizationId') : null);
      
      if (!orgId) {
        setRole('user');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userRole = await getUserRole(user.id, orgId);
        setRole(userRole);
      } catch (err) {
        console.error('Error fetching role:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch role');
        setRole('user');
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user, organizationId]);

  return { role, loading, error };
}
