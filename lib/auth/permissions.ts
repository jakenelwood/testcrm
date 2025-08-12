/**
 * Permission system for multi-tenant insurance CRM
 * Handles role-based access control and permission checking
 */

import { createClient } from '@/utils/supabase/server';
import { User } from '@supabase/supabase-js';

// Permission categories and definitions
export const PERMISSIONS = {
  // Lead management
  LEADS_VIEW: 'leads.view',
  LEADS_CREATE: 'leads.create',
  LEADS_EDIT: 'leads.edit',
  LEADS_DELETE: 'leads.delete',
  LEADS_ASSIGN: 'leads.assign',
  LEADS_VIEW_ALL: 'leads.view_all',

  // Client management
  CLIENTS_VIEW: 'clients.view',
  CLIENTS_CREATE: 'clients.create',
  CLIENTS_EDIT: 'clients.edit',
  CLIENTS_DELETE: 'clients.delete',
  CLIENTS_VIEW_ALL: 'clients.view_all',

  // Quote management
  QUOTES_VIEW: 'quotes.view',
  QUOTES_CREATE: 'quotes.create',
  QUOTES_EDIT: 'quotes.edit',
  QUOTES_DELETE: 'quotes.delete',
  QUOTES_APPROVE: 'quotes.approve',

  // Communication
  COMMUNICATIONS_VIEW: 'communications.view',
  COMMUNICATIONS_CREATE: 'communications.create',
  COMMUNICATIONS_EDIT: 'communications.edit',
  COMMUNICATIONS_DELETE: 'communications.delete',

  // Reporting
  REPORTS_VIEW: 'reports.view',
  REPORTS_CREATE: 'reports.create',
  REPORTS_EXPORT: 'reports.export',

  // User management
  USERS_VIEW: 'users.view',
  USERS_INVITE: 'users.invite',
  USERS_EDIT: 'users.edit',
  USERS_DEACTIVATE: 'users.deactivate',
  USERS_MANAGE_ROLES: 'users.manage_roles',

  // Organization management
  ORGANIZATION_VIEW: 'organization.view',
  ORGANIZATION_EDIT: 'organization.edit',
  ORGANIZATION_BILLING: 'organization.billing',
  ORGANIZATION_INTEGRATIONS: 'organization.integrations',

  // System administration
  SYSTEM_ADMIN: 'system.admin',
  SYSTEM_AUDIT: 'system.audit',
  SYSTEM_BACKUP: 'system.backup',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role definitions with default permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT,
    PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.LEADS_VIEW_ALL,
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_EDIT,
    PERMISSIONS.CLIENTS_VIEW_ALL,
    PERMISSIONS.QUOTES_VIEW,
    PERMISSIONS.QUOTES_CREATE,
    PERMISSIONS.QUOTES_EDIT,
    PERMISSIONS.QUOTES_APPROVE,
    PERMISSIONS.COMMUNICATIONS_VIEW,
    PERMISSIONS.COMMUNICATIONS_CREATE,
    PERMISSIONS.COMMUNICATIONS_EDIT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_INVITE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_MANAGE_ROLES,
    PERMISSIONS.ORGANIZATION_VIEW,
    PERMISSIONS.ORGANIZATION_EDIT,
    PERMISSIONS.ORGANIZATION_INTEGRATIONS,
  ],
  manager: [
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT,
    PERMISSIONS.LEADS_ASSIGN,
    PERMISSIONS.LEADS_VIEW_ALL,
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_EDIT,
    PERMISSIONS.CLIENTS_VIEW_ALL,
    PERMISSIONS.QUOTES_VIEW,
    PERMISSIONS.QUOTES_CREATE,
    PERMISSIONS.QUOTES_EDIT,
    PERMISSIONS.COMMUNICATIONS_VIEW,
    PERMISSIONS.COMMUNICATIONS_CREATE,
    PERMISSIONS.COMMUNICATIONS_EDIT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_CREATE,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.USERS_VIEW,
  ],
  agent: [
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.LEADS_CREATE,
    PERMISSIONS.LEADS_EDIT,
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.CLIENTS_CREATE,
    PERMISSIONS.CLIENTS_EDIT,
    PERMISSIONS.QUOTES_VIEW,
    PERMISSIONS.QUOTES_CREATE,
    PERMISSIONS.QUOTES_EDIT,
    PERMISSIONS.COMMUNICATIONS_VIEW,
    PERMISSIONS.COMMUNICATIONS_CREATE,
    PERMISSIONS.COMMUNICATIONS_EDIT,
    PERMISSIONS.REPORTS_VIEW,
  ],
  user: [
    PERMISSIONS.LEADS_VIEW,
    PERMISSIONS.CLIENTS_VIEW,
    PERMISSIONS.QUOTES_VIEW,
    PERMISSIONS.COMMUNICATIONS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

/**
 * Get user's organization membership and role
 */
export async function getUserOrganizationMembership(userId: string, organizationId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_organization_memberships')
    .select(`
      *,
      organization_roles (
        name,
        permissions
      )
    `)
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .single();

  if (error) {
    console.error('Error fetching user organization membership:', error);
    return null;
  }

  return data;
}

/**
 * Check if user has specific permission in organization
 */
export async function userHasPermission(
  userId: string,
  organizationId: string,
  permission: Permission
): Promise<boolean> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('user_has_permission', {
    user_id_param: userId,
    organization_id_param: organizationId,
    permission_name: permission,
  });

  if (error) {
    console.error('Error checking user permission:', error);
    return false;
  }

  return data || false;
}

/**
 * Get user's role in organization
 */
export async function getUserRole(userId: string, organizationId: string): Promise<string> {
  const supabase = await createClient();
  
  const { data, error } = await supabase.rpc('get_user_organization_role', {
    user_id_param: userId,
    organization_id_param: organizationId,
  });

  if (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }

  return data || 'user';
}

/**
 * Check if user has any of the specified permissions
 */
export async function userHasAnyPermission(
  userId: string,
  organizationId: string,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (await userHasPermission(userId, organizationId, permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if user has all of the specified permissions
 */
export async function userHasAllPermissions(
  userId: string,
  organizationId: string,
  permissions: Permission[]
): Promise<boolean> {
  for (const permission of permissions) {
    if (!(await userHasPermission(userId, organizationId, permission))) {
      return false;
    }
  }
  return true;
}

/**
 * Get all permissions for a user in an organization
 */
export async function getUserPermissions(
  userId: string,
  organizationId: string
): Promise<Permission[]> {
  const membership = await getUserOrganizationMembership(userId, organizationId);
  
  if (!membership) {
    return [];
  }

  // If user has a custom role, use its permissions
  if (membership.organization_roles?.permissions?.permissions) {
    return membership.organization_roles.permissions.permissions as Permission[];
  }

  // Fallback to default role permissions
  const role = membership.role || 'user';
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
}

/**
 * Check if user is admin or owner in organization
 */
export async function isUserAdminOrOwner(userId: string, organizationId: string): Promise<boolean> {
  const role = await getUserRole(userId, organizationId);
  return ['admin', 'owner'].includes(role.toLowerCase());
}

/**
 * Check if user can access resource (basic ownership check)
 */
export async function canUserAccessResource(
  userId: string,
  organizationId: string,
  resourceOwnerId: string,
  permission: Permission
): Promise<boolean> {
  // User can always access their own resources
  if (userId === resourceOwnerId) {
    return true;
  }

  // Check if user has the required permission
  return await userHasPermission(userId, organizationId, permission);
}
