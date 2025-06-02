/**
 * RingCentral Token Reset Utility
 * 
 * This utility provides functions to reset RingCentral authentication
 * when tokens are revoked or corrupted.
 */

import { NEXT_PUBLIC_APP_URL } from '@/lib/ringcentral/config';

/**
 * Reset all RingCentral tokens and authentication state
 * This clears cookies, database tokens, and rate limiting
 */
export async function resetRingCentralTokens(): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    console.log('Resetting RingCentral tokens...');
    
    const response = await fetch(`${NEXT_PUBLIC_APP_URL}/api/ringcentral/auth?action=reset`, {
      method: 'GET',
      credentials: 'include', // Include cookies
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      throw new Error(errorData.error || `Reset failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('RingCentral tokens reset successfully:', data);
    
    return {
      success: true,
      message: data.message || 'Tokens reset successfully'
    };

  } catch (error: any) {
    console.error('Failed to reset RingCentral tokens:', error);
    return {
      success: false,
      message: 'Failed to reset tokens',
      error: error.message
    };
  }
}

/**
 * Clean up expired tokens and reset rate limits
 */
export async function cleanupRingCentralTokens(): Promise<{ success: boolean; message: string; tokensRemoved?: number; error?: string }> {
  try {
    console.log('Cleaning up RingCentral tokens...');
    
    const response = await fetch(`${NEXT_PUBLIC_APP_URL}/api/ringcentral/auth?action=cleanup`, {
      method: 'GET',
      credentials: 'include', // Include cookies
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      throw new Error(errorData.error || `Cleanup failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('RingCentral tokens cleaned up successfully:', data);
    
    return {
      success: true,
      message: data.message || 'Tokens cleaned up successfully',
      tokensRemoved: data.tokensRemoved
    };

  } catch (error: any) {
    console.error('Failed to cleanup RingCentral tokens:', error);
    return {
      success: false,
      message: 'Failed to cleanup tokens',
      error: error.message
    };
  }
}

/**
 * Check if RingCentral authentication is working
 */
export async function checkRingCentralAuth(): Promise<{ isAuthenticated: boolean; source?: string; error?: string }> {
  try {
    console.log('Checking RingCentral authentication...');
    
    const response = await fetch(`${NEXT_PUBLIC_APP_URL}/api/ringcentral/auth?action=check`, {
      method: 'GET',
      credentials: 'include', // Include cookies
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      return {
        isAuthenticated: false,
        error: errorData.error || `Auth check failed with status ${response.status}`
      };
    }

    const data = await response.json();
    console.log('RingCentral auth check result:', data);
    
    return {
      isAuthenticated: data.isAuthenticated || false,
      source: data.source
    };

  } catch (error: any) {
    console.error('Failed to check RingCentral authentication:', error);
    return {
      isAuthenticated: false,
      error: error.message
    };
  }
}

/**
 * Force re-authentication with RingCentral
 * This will redirect the user to the RingCentral authorization page
 */
export function forceRingCentralReauth(): void {
  console.log('Forcing RingCentral re-authentication...');
  window.location.href = `${NEXT_PUBLIC_APP_URL}/api/ringcentral/auth?action=authorize`;
}

/**
 * Handle RingCentral authentication errors with automatic recovery
 */
export async function handleRingCentralAuthError(error: any): Promise<{ handled: boolean; action: string; message: string }> {
  console.log('Handling RingCentral authentication error:', error);

  // Check if it's a token revocation error
  if (error.message?.includes('Token is revoked') || 
      error.message?.includes('invalid_grant') ||
      error.reauthorize === true) {
    
    console.log('Token revocation detected, resetting tokens...');
    const resetResult = await resetRingCentralTokens();
    
    if (resetResult.success) {
      return {
        handled: true,
        action: 'reset_and_reauth',
        message: 'Tokens were revoked and have been reset. Please re-authenticate.'
      };
    } else {
      return {
        handled: false,
        action: 'manual_reauth',
        message: 'Token reset failed. Please manually re-authenticate.'
      };
    }
  }

  // Check if it's a rate limiting error
  if (error.message?.includes('rate limit') || 
      error.message?.includes('Rate limit') ||
      error.status === 429) {
    
    console.log('Rate limiting detected, cleaning up tokens...');
    const cleanupResult = await cleanupRingCentralTokens();
    
    return {
      handled: true,
      action: 'rate_limit_cleanup',
      message: `Rate limit detected. ${cleanupResult.success ? 'Cleaned up tokens.' : 'Cleanup failed.'} Please wait before trying again.`
    };
  }

  // Check if it's a general authentication error
  if (error.message?.includes('Not authenticated') ||
      error.message?.includes('authentication') ||
      error.status === 401) {
    
    console.log('General authentication error, checking current auth state...');
    const authCheck = await checkRingCentralAuth();
    
    if (!authCheck.isAuthenticated) {
      return {
        handled: true,
        action: 'reauth_required',
        message: 'Authentication required. Please re-authenticate with RingCentral.'
      };
    }
  }

  return {
    handled: false,
    action: 'unknown',
    message: 'Unknown authentication error. Please try again or contact support.'
  };
}

/**
 * Comprehensive RingCentral recovery function
 * This attempts to automatically recover from various RingCentral issues
 */
export async function recoverRingCentralAuth(): Promise<{ success: boolean; action: string; message: string }> {
  console.log('Starting RingCentral authentication recovery...');

  try {
    // Step 1: Check current authentication state
    const authCheck = await checkRingCentralAuth();
    
    if (authCheck.isAuthenticated) {
      return {
        success: true,
        action: 'already_authenticated',
        message: 'RingCentral authentication is already working.'
      };
    }

    // Step 2: Clean up any expired tokens
    console.log('Cleaning up expired tokens...');
    await cleanupRingCentralTokens();

    // Step 3: Check authentication again
    const authCheckAfterCleanup = await checkRingCentralAuth();
    
    if (authCheckAfterCleanup.isAuthenticated) {
      return {
        success: true,
        action: 'cleanup_fixed',
        message: 'Authentication recovered after token cleanup.'
      };
    }

    // Step 4: Reset all tokens
    console.log('Resetting all tokens...');
    const resetResult = await resetRingCentralTokens();
    
    if (!resetResult.success) {
      return {
        success: false,
        action: 'reset_failed',
        message: `Token reset failed: ${resetResult.error}`
      };
    }

    // Step 5: Require re-authentication
    return {
      success: true,
      action: 'reauth_required',
      message: 'Tokens have been reset. Re-authentication is required.'
    };

  } catch (error: any) {
    console.error('RingCentral recovery failed:', error);
    return {
      success: false,
      action: 'recovery_failed',
      message: `Recovery failed: ${error.message}`
    };
  }
}
