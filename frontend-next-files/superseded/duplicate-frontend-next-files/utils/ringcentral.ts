// RingCentral API integration

interface RingCentralConfig {
  clientId: string;
  server: string;
}

// Default configuration - to be replaced with your actual credentials
const config: RingCentralConfig = {
  clientId: process.env.NEXT_PUBLIC_RINGCENTRAL_CLIENT_ID || '',
  server: process.env.NEXT_PUBLIC_RINGCENTRAL_SERVER || 'https://platform.ringcentral.com',
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
 * Logout from RingCentral
 */
export async function logoutFromRingCentral(): Promise<boolean> {
  try {
    const response = await fetch('/api/ringcentral/auth?action=logout');
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Failed to logout from RingCentral:', error);
    return false;
  }
}

/**
 * Make a phone call using RingCentral
 * @param fromNumber The phone number to call from
 * @param toNumber The phone number to call to
 * @returns Promise resolving to the call result
 */
export async function makeRingCentralCall(fromNumber: string, toNumber: string): Promise<any> {
  try {
    // Check if authenticated first
    const isAuthenticated = await checkRingCentralAuth();
    if (!isAuthenticated) {
      authenticateWithRingCentral();
      throw new Error('RingCentral authentication required');
    }

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

/**
 * Send an SMS using RingCentral
 * @param fromNumber The phone number to send from
 * @param toNumber The phone number to send to
 * @param text The message text
 * @returns Promise resolving to the SMS result
 */
export async function sendRingCentralSMS(fromNumber: string, toNumber: string, text: string): Promise<any> {
  try {
    // Check if authenticated first
    const isAuthenticated = await checkRingCentralAuth();
    if (!isAuthenticated) {
      authenticateWithRingCentral();
      throw new Error('RingCentral authentication required');
    }

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
