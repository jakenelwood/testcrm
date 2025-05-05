// RingCentral API integration

// This file needs to be converted to a server-side API route in Next.js
// to keep your RingCentral credentials secure.
// For simplicity, we're defining the configuration here, but in production
// these should be environment variables.

interface RingCentralConfig {
  clientId: string;
  server: string;
}

// Default configuration - to be replaced with your actual credentials
const config: RingCentralConfig = {
  clientId: process.env.RINGCENTRAL_CLIENT_ID || process.env.CLIENT_ID || 'YOUR_CLIENT_ID',
  server: process.env.RINGCENTRAL_SERVER || process.env.RC_API_BASE || 'https://platform.ringcentral.com',
};

/**
 * Check if the user is authenticated with RingCentral
 * @returns Promise resolving to true if authenticated, false otherwise
 */
export async function checkRingCentralAuth(): Promise<boolean> {
  try {
    const response = await fetch('/api/ringcentral/auth?action=token');
    const data = await response.json();
    return data.authenticated === true;
  } catch (error) {
    console.error('Failed to check RingCentral authentication:', error);
    return false;
  }
}

/**
 * Redirect to RingCentral for authentication
 */
export function authenticateWithRingCentral() {
  // Redirect to the authentication page
  window.location.href = '/api/ringcentral/auth?action=authorize';
}

/**
 * Log out from RingCentral
 */
export async function logoutFromRingCentral(): Promise<boolean> {
  try {
    const response = await fetch('/api/ringcentral/auth?action=logout');
    return response.ok;
  } catch (error) {
    console.error('Failed to logout from RingCentral:', error);
    return false;
  }
}

// Client-side TypeScript methods to call API endpoints
export async function makeRingCentralCall(fromNumber: string, toNumber: string): Promise<any> {
  try {
    // Check if authenticated first
    const isAuthenticated = await checkRingCentralAuth();
    if (!isAuthenticated) {
      authenticateWithRingCentral();
      throw new Error('RingCentral authentication required');
    }

    // In a real implementation, this would call a server API endpoint
    const response = await fetch('/api/ringcentral?action=call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromNumber, to: toNumber })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // If authentication is required, redirect to auth page
      if (response.status === 401 && errorData.redirect) {
        window.location.href = errorData.redirect;
        throw new Error('RingCentral authentication required');
      }
      
      throw new Error(`RingCentral call failed: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to make RingCentral call:', error);
    throw error;
  }
}

export async function sendRingCentralSMS(fromNumber: string, toNumber: string, text: string): Promise<any> {
  try {
    // Check if authenticated first
    const isAuthenticated = await checkRingCentralAuth();
    if (!isAuthenticated) {
      authenticateWithRingCentral();
      throw new Error('RingCentral authentication required');
    }

    // In a real implementation, this would call a server API endpoint
    const response = await fetch('/api/ringcentral?action=sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromNumber, to: toNumber, text })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // If authentication is required, redirect to auth page
      if (response.status === 401 && errorData.redirect) {
        window.location.href = errorData.redirect;
        throw new Error('RingCentral authentication required');
      }
      
      throw new Error(`RingCentral SMS failed: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Failed to send RingCentral SMS:', error);
    throw error;
  }
}

export default {
  config,
  checkRingCentralAuth,
  authenticateWithRingCentral,
  logoutFromRingCentral,
  makeRingCentralCall,
  sendRingCentralSMS
}; 