/**
 * RingCentral API Utilities
 * 
 * Centralized functions for interacting with the RingCentral API.
 * This follows the DRY principle by defining common API operations in one place.
 */

import { cookies } from 'next/headers';
import { RINGCENTRAL_SERVER, API_ENDPOINTS } from './config';

/**
 * Get the RingCentral access token from cookies
 */
export async function getAccessToken() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('ringcentral_access_token')?.value;
  const tokenExpiry = cookieStore.get('ringcentral_token_expiry')?.value;
  
  return {
    token: accessToken,
    expiry: tokenExpiry ? new Date(parseInt(tokenExpiry)) : null,
    isValid: !!accessToken && tokenExpiry && new Date(parseInt(tokenExpiry)) > new Date()
  };
}

/**
 * Make a call to the RingCentral API
 */
export async function callRingCentralApi(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
) {
  const { token, isValid } = await getAccessToken();
  
  if (!isValid) {
    throw new Error('Not authenticated with RingCentral');
  }
  
  const url = `${RINGCENTRAL_SERVER}${endpoint}`;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: body ? JSON.stringify(body) : undefined
  });
  
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      const errorText = await response.text();
      throw new Error(`API error (${response.status}): ${errorText}`);
    }
    
    throw new Error(`API error (${response.status}): ${JSON.stringify(errorData)}`);
  }
  
  return await response.json();
}

/**
 * Make a RingOut call
 */
export async function makeCall(toNumber: string, fromNumber: string, callerIdNumber?: string) {
  const payload = {
    from: { phoneNumber: fromNumber },
    to: { phoneNumber: toNumber },
    callerId: callerIdNumber ? { phoneNumber: callerIdNumber } : undefined,
    playPrompt: false
  };
  
  return await callRingCentralApi(API_ENDPOINTS.RING_OUT, 'POST', payload);
}

/**
 * Get call status
 */
export async function getCallStatus(callId: string) {
  return await callRingCentralApi(`${API_ENDPOINTS.RING_OUT.replace(/\/$/, '')}/${callId}`);
}

/**
 * Get account information
 */
export async function getAccountInfo() {
  return await callRingCentralApi(API_ENDPOINTS.ACCOUNT_INFO);
}

/**
 * Get extension information
 */
export async function getExtensionInfo() {
  return await callRingCentralApi(API_ENDPOINTS.EXTENSION_INFO);
}

/**
 * Get phone numbers
 */
export async function getPhoneNumbers() {
  return await callRingCentralApi(API_ENDPOINTS.PHONE_NUMBERS);
}

/**
 * Send SMS
 */
export async function sendSMS(toNumber: string, fromNumber: string, text: string) {
  const payload = {
    from: { phoneNumber: fromNumber },
    to: [{ phoneNumber: toNumber }],
    text
  };
  
  return await callRingCentralApi(API_ENDPOINTS.SMS, 'POST', payload);
}
