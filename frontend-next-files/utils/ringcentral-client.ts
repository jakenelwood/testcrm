import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import {
  RINGCENTRAL_SERVER,
  API_ENDPOINTS
} from '@/lib/ringcentral/config';

/**
 * RingCentral client wrapper for server-side API calls
 */
export class RingCentralClient {
  private accessToken: string | null = null;
  private authenticated: boolean = false;

  /**
   * Create a new RingCentral client
   * @param cookieStore Next.js cookie store
   */
  constructor(cookieStore: ReadonlyRequestCookies) {
    try {
      // Get the access token from cookies
      this.accessToken = cookieStore.get('ringcentral_access_token')?.value || null;
      this.authenticated = !!this.accessToken;
    } catch (error) {
      console.error('Error accessing cookies:', error);
      this.accessToken = null;
      this.authenticated = false;
    }
  }

  /**
   * Check if the client is authenticated
   */
  isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Make a DELETE request to the RingCentral API
   * @param endpoint API endpoint
   */
  async delete(endpoint: string): Promise<any> {
    if (!this.authenticated) {
      throw new Error('Not authenticated with RingCentral');
    }

    const response = await fetch(`${RINGCENTRAL_SERVER}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: 'Unknown error' };
      }
      throw new Error(errorData.message || 'Failed to make RingCentral API request');
    }

    // For 204 No Content responses
    if (response.status === 204) {
      return { success: true };
    }

    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      // Return a simple object for non-JSON responses
      return {
        status: response.status,
        statusText: response.statusText,
        success: true
      };
    }
  }

  /**
   * End an active call
   * @param callId The ID of the call to end
   */
  async endCall(callId: string): Promise<any> {
    // For RingOut calls, we need to use the ring-out endpoint, not active-calls
    return this.delete(API_ENDPOINTS.RING_OUT_CALL(callId));
  }

  /**
   * Make a POST request to the RingCentral API
   * @param endpoint API endpoint
   * @param data Request body
   */
  async post(endpoint: string, data: any): Promise<any> {
    if (!this.authenticated) {
      throw new Error('Not authenticated with RingCentral');
    }

    const response = await fetch(`${RINGCENTRAL_SERVER}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: 'Unknown error' };
      }
      throw new Error(errorData.message || 'Failed to make RingCentral API request');
    }

    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      // Return a simple object for non-JSON responses
      return {
        status: response.status,
        statusText: response.statusText,
        id: Date.now().toString() // Generate a fake ID for tracking
      };
    }
  }

  /**
   * For compatibility with existing code that expects a platform object
   */
  getPlatform() {
    return {
      delete: (endpoint: string) => this.delete(endpoint),
      post: (endpoint: string, data: any) => this.post(endpoint, data)
    };
  }
}
