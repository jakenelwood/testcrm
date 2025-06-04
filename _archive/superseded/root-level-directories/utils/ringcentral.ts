/**
 * RingCentral API integration utilities
 */

/**
 * Check if the user is authenticated with RingCentral
 * @returns Promise resolving to true if authenticated, false otherwise
 */
export async function isRingCentralAuthenticated(): Promise<boolean> {
  try {
    const response = await fetch('/api/ringcentral/auth?action=check', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Include credentials to send cookies
      credentials: 'include'
    });

    if (!response.ok) {
      console.warn('RingCentral auth check failed:', response.statusText);
      return false;
    }

    const data = await response.json();
    return data.authenticated === true;
  } catch (error) {
    console.error('Failed to check RingCentral authentication:', error);
    return false;
  }
}

/**
 * Authenticate with RingCentral
 * This will redirect the user to the RingCentral authorization page
 */
export function authenticateWithRingCentral() {
  window.location.href = '/api/ringcentral/auth?action=authorize';
}

/**
 * Logout from RingCentral
 * @returns Promise resolving to true if logout was successful, false otherwise
 */
export async function logoutFromRingCentral(): Promise<boolean> {
  try {
    const response = await fetch('/api/ringcentral/auth?action=logout', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('Failed to logout from RingCentral:', error);
    return false;
  }
}

/**
 * Make a phone call using RingCentral
 * @param toNumber The phone number to call
 * @param fromNumber Optional phone number to call from (defaults to the one in .env)
 * @returns Promise resolving to the call result
 */
export async function makeCall(toNumber: string, fromNumber?: string): Promise<any> {
  try {
    // Check if the user is authenticated with RingCentral
    const isAuthenticated = await isRingCentralAuthenticated();
    if (!isAuthenticated) {
      authenticateWithRingCentral();
      throw new Error('RingCentral authentication required');
    }

    // Make the call
    const response = await fetch('/api/ringcentral?action=call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toNumber,
        from: fromNumber || process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER
      })
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

    return await response.json();
  } catch (error) {
    console.error('Failed to make RingCentral call:', error);
    throw error;
  }
}

/**
 * Send an SMS using RingCentral
 * @param toNumber The phone number to send the SMS to
 * @param text The text message to send
 * @param fromNumber Optional phone number to send from (defaults to the one in .env)
 * @returns Promise resolving to the SMS result
 */
export async function sendSMS(toNumber: string, text: string, fromNumber?: string): Promise<any> {
  try {
    // Check if the user is authenticated with RingCentral
    const isAuthenticated = await isRingCentralAuthenticated();
    if (!isAuthenticated) {
      authenticateWithRingCentral();
      throw new Error('RingCentral authentication required');
    }

    // Send the SMS
    const response = await fetch('/api/ringcentral?action=sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toNumber,
        text: text,
        from: fromNumber || process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER
      })
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

    return await response.json();
  } catch (error) {
    console.error('Failed to send RingCentral SMS:', error);
    throw error;
  }
}
