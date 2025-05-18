import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { NextRequest } from 'next/server'; // Import NextRequest for potential origin access
import {
  RINGCENTRAL_SERVER,
  API_ENDPOINTS
} from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';
// Removed: import { cookies } from 'next/headers';

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export class RingCentralResourceNotFoundError extends Error {
  public originalErrorData: any;
  constructor(message: string, originalErrorData?: any) {
    super(message);
    this.name = 'RingCentralResourceNotFoundError';
    this.originalErrorData = originalErrorData;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, RingCentralResourceNotFoundError.prototype);
  }
}

/**
 * RingCentral client wrapper for server-side API calls
 */
export class RingCentralClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private accessTokenExpiryTime: number | null = null;
  private authenticated: boolean = false;
  private cookieStore: ReadonlyRequestCookies; // Instance variable to hold the cookie store
  private requestOrigin: string; // To build absolute URLs for internal API calls

  /**
   * Create a new RingCentral client
   * @param cookieStore Deprecated: Next.js cookie store, no longer used directly by constructor for instance storage.
   * @param request The incoming NextRequest, used to get the origin for internal API calls
   */
  constructor(cookieStore: ReadonlyRequestCookies, request?: NextRequest) {
    this.cookieStore = cookieStore; // Store the passed-in cookie store
    
    if (process.env.VERCEL_URL) {
        this.requestOrigin = `https://${process.env.VERCEL_URL}`;
    } else if (request) {
        this.requestOrigin = request.nextUrl.origin;
    } else {
        this.requestOrigin = 'http://localhost:3000'; 
        console.warn('RingCentralClient: request object not provided and VERCEL_URL not set, defaulting origin to http://localhost:3000 for internal API calls. This may not work in production.');
    }

    // Initialize authentication state dynamically
    // Actual token access will be handled asynchronously in _ensureTokenIsValid
    this.authenticated = false;
  }

  private async _ensureTokenIsValid(): Promise<void> {
    try {
      console.log('RingCentralClient: Ensuring token is valid...');
      // Always read fresh values from the cookieStore for the current state
      const accessTokenCookie = this.cookieStore.get('ringcentral_access_token');
      const refreshTokenCookie = this.cookieStore.get('ringcentral_refresh_token');
      const expiryTimeCookie = this.cookieStore.get('ringcentral_access_token_expiry_time');
      
      const oldAccessToken = this.accessToken;
      this.accessToken = accessTokenCookie?.value || null;
      this.refreshToken = refreshTokenCookie?.value || null;
      const expiryTimeStr = expiryTimeCookie?.value;
      this.accessTokenExpiryTime = expiryTimeStr ? parseInt(expiryTimeStr, 10) : null;

      const tokenChanged = oldAccessToken !== this.accessToken;
      const now = Date.now();
      const isExpired = this.accessTokenExpiryTime ? now > this.accessTokenExpiryTime : true;
      const isNearExpiry = this.accessTokenExpiryTime ? (this.accessTokenExpiryTime - now < REFRESH_THRESHOLD_MS) : true;
      
      console.log('RingCentralClient: Token state:', {
        hasAccessToken: !!this.accessToken,
        accessTokenLength: this.accessToken?.length || 0,
        hasRefreshToken: !!this.refreshToken,
        expiryTime: this.accessTokenExpiryTime ? new Date(this.accessTokenExpiryTime).toISOString() : null,
        isExpired,
        isNearExpiry,
        nowTime: new Date(now).toISOString(),
        tokenChanged,
        timeRemaining: this.accessTokenExpiryTime ? `${Math.floor((this.accessTokenExpiryTime - now) / 1000 / 60)} minutes` : 'unknown'
      });

      if (this.accessToken && this.accessTokenExpiryTime && !isNearExpiry) {
        this.authenticated = true;
        console.log('RingCentralClient: Token is valid and not near expiry.');
        return;
      }

      if (!this.refreshToken) {
        this.authenticated = false;
        console.log('RingCentralClient: No refresh token available. Cannot refresh.');
        throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR + ' (no refresh token)');
      }

      if (isExpired || isNearExpiry) {
        console.log(`RingCentralClient: Access token ${isExpired ? 'expired' : 'nearing expiry'}. Attempting refresh...`);
      } else if (tokenChanged) {
        console.log('RingCentralClient: Token changed since last check, validating...');
      }
      
      // Use the refresh token to get a new access token
      try {
        // Use this.cookieStore to construct the Cookie header for the internal fetch call
        // Collect all cookies
        const allCookies = this.cookieStore.getAll();
        const cookieHeader = allCookies
          .map(c => `${c.name}=${c.value}`)
          .join('; ');

        const refreshUrl = `${this.requestOrigin}/api/ringcentral/auth?action=refresh`;
        console.log(`RingCentralClient: Calling internal refresh URL: ${refreshUrl}`);

        const response = await fetch(refreshUrl, {
          method: 'GET',
          headers: {
            'Cookie': cookieHeader,
          },
          cache: 'no-store',
        });

        if (!response.ok) {
          let errorText = 'Unknown error';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = 'Failed to get error text from refresh response';
          }
          
          console.error(`RingCentralClient: Token refresh API call failed with status ${response.status}. Response: ${errorText}`);
          this.authenticated = false;
          throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR + ` (refresh API call failed: ${response.status})`);
        }

        let data;
        try {
          data = await response.json();
        } catch (e) {
          console.error('RingCentralClient: Failed to parse JSON from refresh response');
          throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR + ' (invalid JSON in refresh response)');
        }

        if (data.success && data.accessToken && data.expiresAt) {
          this.accessToken = data.accessToken;
          this.accessTokenExpiryTime = data.expiresAt;
          this.authenticated = true;
          // The refresh API route is responsible for updating cookies.
          // We should re-read the refresh token from the cookie store in case it was updated.
          const newRefreshTokenCookie = this.cookieStore.get('ringcentral_refresh_token');
          this.refreshToken = newRefreshTokenCookie?.value || this.refreshToken;
          console.log('RingCentralClient: Token refreshed successfully via internal API call.');
        } else {
          console.error('RingCentralClient: Token refresh failed. API response indicates failure:', 
            data.error || data.message || 'Unknown refresh error');
          this.authenticated = false;
          throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR + ' (refresh failed, invalid response data)');
        }
      } catch (refreshError: any) {
        console.error('RingCentralClient: Exception during token refresh process:', 
          refreshError.message, refreshError.stack);
        this.authenticated = false;
        throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR + 
          ` (exception during refresh: ${refreshError.message})`);
      }
    } catch (error: any) {
      console.error('RingCentralClient: Exception in _ensureTokenIsValid:', error.message, error.stack);
      this.authenticated = false;
      throw error;
    }
  }

  /**
   * Check if the client is authenticated
   * This might not reflect the absolute latest state if a refresh is pending or just occurred.
   * Prefer relying on API calls to throw if not authenticated after attempting refresh.
   */
  isAuthenticated(): boolean {
    if (this.accessToken && this.accessTokenExpiryTime && this.accessTokenExpiryTime > Date.now()) {
        return true;
    }
    return false;
  }

  /**
   * Make a GET request to the RingCentral API
   * @param endpoint API endpoint
   */
  async get(endpoint: string): Promise<any> {
    await this._ensureTokenIsValid();
    if (!this.authenticated || !this.accessToken) {
      console.error('RingCentralClient.get: Not authenticated after token check.');
      throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR);
    }

    const response = await fetch(`${RINGCENTRAL_SERVER}${endpoint}`, {
      method: 'GET',
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
        const errorText = await response.text().catch(() => 'Failed to get error text');
        errorData = { message: errorText || 'Failed to make RingCentral API GET request' };
      }
      console.error(`RingCentral GET ${endpoint} failed:`, response.status, errorData);

      if (response.status === 404) {
        throw new RingCentralResourceNotFoundError(errorData.message || `Resource not found at ${endpoint}`, errorData);
      }
      throw new Error(errorData.message || `Failed to make RingCentral API GET request to ${endpoint}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      return response.text(); 
    }
  }

  /**
   * Make a DELETE request to the RingCentral API
   * @param endpoint API endpoint
   */
  async delete(endpoint: string): Promise<any> {
    await this._ensureTokenIsValid();
    if (!this.authenticated || !this.accessToken) {
      console.error('RingCentralClient.delete: Not authenticated after token check.');
      throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR);
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
        const errorText = await response.text().catch(() => 'Unknown error making DELETE request');
        errorData = { message: errorText || UNKNOWN_ERROR_OCCURRED };
      }
      console.error(`RingCentral DELETE ${endpoint} failed:`, response.status, errorData);
      throw new Error(errorData.message || `Failed to make RingCentral API DELETE request to ${endpoint}`);
    }

    if (response.status === 204) {
      return { success: true };
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      return {
        status: response.status,
        statusText: await response.text(), // Consume text to avoid unconsumed body issues
        success: true
      };
    }
  }

  /**
   * End an active call
   * @param callId The ID of the call to end
   */
  async endCall(callId: string): Promise<any> {
    return this.delete(API_ENDPOINTS.RING_OUT_CALL(callId));
  }

  /**
   * Make a POST request to the RingCentral API
   * @param endpoint API endpoint
   * @param data Request body
   */
  async post(endpoint: string, data: any): Promise<any> {
    await this._ensureTokenIsValid();
    if (!this.authenticated || !this.accessToken) {
      console.error('RingCentralClient.post: Not authenticated after token check.');
      throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR);
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
        const errorText = await response.text().catch(() => 'Unknown error making POST request');
        errorData = { message: errorText || UNKNOWN_ERROR_OCCURRED };
      }
      console.error(`RingCentral POST ${endpoint} failed:`, response.status, errorData, data);
      throw new Error(errorData.message || `Failed to make RingCentral API POST request to ${endpoint}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      if (response.status === 204) return { success: true }; 
      return response.text(); 
    }
  }

  /**
   * For compatibility with existing code that expects a platform object
   */
  getPlatform() {
    // Ensure that methods on this returned object also benefit from _ensureTokenIsValid
    // This is implicitly handled because they call this.get, this.post, this.delete.
    return {
      get: (endpoint: string) => this.get(endpoint),
      delete: (endpoint: string) => this.delete(endpoint),
      post: (endpoint: string, data: any) => this.post(endpoint, data)
    };
  }

  /**
   * Ensures the token is valid (refreshes if necessary) and returns the current access token.
   */
  async getValidAccessToken(): Promise<string | null> {
    await this._ensureTokenIsValid();
    return this.authenticated ? this.accessToken : null;
  }
}
