/**
 * Organization management utilities for multi-tenant insurance CRM
 * Handles organization creation, user invitations, and membership management
 */

import { createClient } from '@/utils/supabase/server';
import { createClient as createClientClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export interface Organization {
  id: string;
  name: string;
  organization_type: 'Individual' | 'Agency' | 'Enterprise';
  legal_name?: string;
  tax_id?: string;
  business_type?: string;
  industry?: string;
  primary_email?: string;
  primary_phone?: string;
  website_url?: string;
  subscription_tier: string;
  status: 'Active' | 'Suspended' | 'Cancelled';
  timezone: string;
  date_format: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface UserInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  invited_by: string;
  invited_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitation_token: string;
}

/**
 * Create a new organization
 */
export async function createOrganization(data: {
  name: string;
  organization_type: 'Individual' | 'Agency' | 'Enterprise';
  legal_name?: string;
  tax_id?: string;
  business_type?: string;
  industry?: string;
  primary_email?: string;
  primary_phone?: string;
  website_url?: string;
  timezone?: string;
  date_format?: string;
  currency?: string;
}): Promise<{ organization: Organization | null; error: string | null }> {
  try {
    const supabase = await createClient();
    
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        ...data,
        subscription_tier: 'Basic',
        status: 'Active',
        timezone: data.timezone || 'America/Chicago',
        date_format: data.date_format || 'MM/DD/YYYY',
        currency: data.currency || 'USD',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating organization:', error);
      return { organization: null, error: error.message };
    }

    return { organization, error: null };
  } catch (err) {
    console.error('Unexpected error creating organization:', err);
    return { 
      organization: null, 
      error: err instanceof Error ? err.message : 'Failed to create organization' 
    };
  }
}

/**
 * Add user as organization owner
 */
export async function addOrganizationOwner(
  organizationId: string, 
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    
    // Get the owner role for this organization
    const { data: ownerRole, error: roleError } = await supabase
      .from('organization_roles')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('name', 'Owner')
      .single();

    if (roleError || !ownerRole) {
      return { success: false, error: 'Owner role not found' };
    }

    // Add user as organization member with owner role
    const { error: membershipError } = await supabase
      .from('user_organization_memberships')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        role_id: ownerRole.id,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      });

    if (membershipError) {
      console.error('Error adding organization owner:', membershipError);
      return { success: false, error: membershipError.message };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error('Unexpected error adding organization owner:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to add organization owner' 
    };
  }
}

/**
 * Invite user to organization
 */
export async function inviteUserToOrganization(data: {
  organizationId: string;
  email: string;
  role: string;
  invitedBy: string;
  customMessage?: string;
}): Promise<{ invitation: UserInvitation | null; error: string | null }> {
  try {
    const supabase = await createClient();
    
    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('user_organization_memberships')
      .select('id')
      .eq('organization_id', data.organizationId)
      .eq('user_id', data.email) // This would need to be resolved to user ID
      .single();

    if (existingMember) {
      return { invitation: null, error: 'User is already a member of this organization' };
    }

    // Generate invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invitation record
    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .insert({
        organization_id: data.organizationId,
        email: data.email,
        role: data.role,
        invited_by: data.invitedBy,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        custom_message: data.customMessage,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return { invitation: null, error: error.message };
    }

    // Send invitation email (this would integrate with your email service)
    await sendInvitationEmail({
      email: data.email,
      organizationId: data.organizationId,
      invitationToken,
      role: data.role,
      customMessage: data.customMessage,
    });

    return { invitation, error: null };
  } catch (err) {
    console.error('Unexpected error inviting user:', err);
    return { 
      invitation: null, 
      error: err instanceof Error ? err.message : 'Failed to invite user' 
    };
  }
}

/**
 * Accept organization invitation
 */
export async function acceptInvitation(
  invitationToken: string,
  userId: string
): Promise<{ success: boolean; organizationId?: string; error: string | null }> {
  try {
    const supabase = await createClient();
    
    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .select(`
        *,
        organizations (name)
      `)
      .eq('invitation_token', invitationToken)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      return { success: false, error: 'Invalid or expired invitation' };
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return { success: false, error: 'Invitation has expired' };
    }

    // Get the role for this organization
    const { data: role, error: roleError } = await supabase
      .from('organization_roles')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('name', invitation.role)
      .single();

    // Add user to organization
    const { error: membershipError } = await supabase
      .from('user_organization_memberships')
      .insert({
        user_id: userId,
        organization_id: invitation.organization_id,
        role_id: role?.id,
        role: invitation.role,
        status: 'active',
        invited_by: invitation.invited_by,
        invited_at: invitation.invited_at,
        joined_at: new Date().toISOString(),
      });

    if (membershipError) {
      console.error('Error adding user to organization:', membershipError);
      return { success: false, error: membershipError.message };
    }

    // Mark invitation as accepted
    await supabase
      .from('user_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        accepted_by: userId,
      })
      .eq('id', invitation.id);

    return { 
      success: true, 
      organizationId: invitation.organization_id, 
      error: null 
    };
  } catch (err) {
    console.error('Unexpected error accepting invitation:', err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Failed to accept invitation' 
    };
  }
}

/**
 * Get user's organizations
 */
export async function getUserOrganizations(userId: string): Promise<{
  organizations: (Organization & { role: string; membership_status: string })[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_organization_memberships')
      .select(`
        role,
        status,
        organizations (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching user organizations:', error);
      return { organizations: [], error: error.message };
    }

    const organizations = data.map(membership => ({
      ...membership.organizations,
      role: membership.role,
      membership_status: membership.status,
    }));

    return { organizations, error: null };
  } catch (err) {
    console.error('Unexpected error fetching organizations:', err);
    return { 
      organizations: [], 
      error: err instanceof Error ? err.message : 'Failed to fetch organizations' 
    };
  }
}

/**
 * Send invitation email (placeholder - integrate with your email service)
 */
async function sendInvitationEmail(data: {
  email: string;
  organizationId: string;
  invitationToken: string;
  role: string;
  customMessage?: string;
}): Promise<void> {
  // This would integrate with your email service (SendGrid, Postmark, etc.)
  // For now, we'll use Supabase Auth's invite functionality
  
  try {
    const supabase = await createClient();
    
    // Get organization details
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', data.organizationId)
      .single();

    // Create invitation URL
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invitation?token=${data.invitationToken}`;

    // For now, log the invitation details (in production, send actual email)
    console.log('Invitation email would be sent:', {
      to: data.email,
      organization: organization?.name,
      role: data.role,
      invitationUrl,
      customMessage: data.customMessage,
    });

    if (error) {
      console.error('Error sending invitation email:', error);
    }
  } catch (err) {
    console.error('Error sending invitation email:', err);
  }
}
