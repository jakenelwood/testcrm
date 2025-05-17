import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { NextRequest } from 'next/server'; // Import NextRequest for potential origin access
import {
  RINGCENTRAL_SERVER,
  API_ENDPOINTS
} from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * RingCentral client wrapper for server-side API calls
 */
export class RingCentralClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private accessTokenExpiryTime: number | null = null;
  private authenticated: boolean = false;
  private cookieStore: ReadonlyRequestCookies;
  private requestOrigin: string; // To build absolute URLs for internal API calls

  /**
   * Create a new RingCentral client
   * @param cookieStore Next.js cookie store
   * @param request The incoming NextRequest, used to get the origin for internal API calls
   */
  constructor(cookieStore: ReadonlyRequestCookies, request?: NextRequest) {
    this.cookieStore = cookieStore;
    // Determine origin: VERCEL_URL for production/preview, or localhost for development
    // Fallback to a sensible default if request is not provided, though it's preferred.
    if (process.env.VERCEL_URL) {
        this.requestOrigin = `https://${process.env.VERCEL_URL}`;
    } else if (request) {
        this.requestOrigin = request.nextUrl.origin;
    } else {
        // Fallback for environments where request might not be available or VERCEL_URL is not set
        // This might be common in cron jobs or server-side scripts not directly tied to a request.
        // Ensure this fallback is appropriate for your deployment or make `request` mandatory.
        this.requestOrigin = 'http://localhost:3000'; 
        console.warn('RingCentralClient: request object not provided and VERCEL_URL not set, defaulting origin to http://localhost:3000 for internal API calls. This may not work in production.')
    }

    try {
      this.accessToken = this.cookieStore.get('ringcentral_access_token')?.value || null;
      this.refreshToken = this.cookieStore.get('ringcentral_refresh_token')?.value || null;
      const expiryTimeStr = this.cookieStore.get('ringcentral_access_token_expiry_time')?.value;
      this.accessTokenExpiryTime = expiryTimeStr ? parseInt(expiryTimeStr, 10) : null;

      if (this.accessToken && this.accessTokenExpiryTime && this.accessTokenExpiryTime > Date.now()) {
        this.authenticated = true;
      } else {
        this.authenticated = false;
        if (this.accessToken) { // Token exists but is expired
            console.log('RingCentralClient: Access token found but expired on construction.');
        }
      }
    } catch (error) {
      console.error('RingCentralClient: Error accessing cookies during construction:', error);
      this.accessToken = null;
      this.refreshToken = null;
      this.accessTokenExpiryTime = null;
      this.authenticated = false;
    }
  }

  private async _ensureTokenIsValid(): Promise<void> {
    if (this.authenticated && this.accessTokenExpiryTime && (this.accessTokenExpiryTime - Date.now() > REFRESH_THRESHOLD_MS)) {
      // Token is valid and not nearing expiry
      return;
    }

    // Token is either not present, expired, or nearing expiry. Attempt refresh if refresh token is available.
    if (!this.refreshToken) {
      this.authenticated = false;
      this.accessToken = null;
      console.log('RingCentralClient: No refresh token available. Cannot refresh.');
      // No error thrown here, subsequent calls will fail if auth is required.
      // Or, uncomment to throw immediately:
      // throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR + ' (no refresh token)');
      return;
    }

    console.log('RingCentralClient: Access token expired or nearing expiry. Attempting refresh...');
    try {
      // Construct Cookie header for the internal fetch call
      const cookieHeader = Array.from(this.cookieStore.getAll())
        .map(c => `${c.name}=${c.value}`)
        .join('; ');

      const refreshUrl = `${this.requestOrigin}/api/ringcentral/auth?action=refresh`;
      console.log(`RingCentralClient: Calling internal refresh URL: ${refreshUrl}`);

      const response = await fetch(refreshUrl, {
        method: 'GET', // Matches the current implementation in auth/route.ts
        headers: {
          'Cookie': cookieHeader,
        },
        cache: 'no-store', // Ensure no caching for this sensitive request
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to get error text from refresh response');
        console.error(`RingCentralClient: Token refresh API call failed with status ${response.status}. Response: ${errorText}`);
        this.authenticated = false;
        this.accessToken = null; 
        // Consider clearing this.refreshToken if the refresh attempt invalidates it (e.g. 400/401 from refresh endpoint)
        // For now, retain it for potential future manual re-auth.
        throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR + ' (refresh API call failed)');
      }

      const data = await response.json();

      if (data.success && data.refreshed && data.access_token && data.expires_in) {
        this.accessToken = data.access_token;
        this.accessTokenExpiryTime = Date.now() + data.expires_in * 1000;
        this.authenticated = true;
        // The auth/route.ts already updated the cookies. RingCentralClient now has the latest token internally.
        // If the refresh response included a new refresh_token, we could update this.refreshToken too.
        if (data.refresh_token) {
            this.refreshToken = data.refresh_token; 
            // Note: The cookie for refresh_token would have been set by the API endpoint.
            // This internal update is for the client's current session consistency.
        }
        console.log('RingCentralClient: Token refreshed successfully via internal API call.');
      } else {
        console.error('RingCentralClient: Token refresh failed. API response indicates failure:', data.error || 'Unknown refresh error');
        this.authenticated = false;
        this.accessToken = null;
        throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR + ' (refresh failed, invalid response data)');
      }
    } catch (error: any) {
      console.error('RingCentralClient: Exception during token refresh process:', error.message, error.stack);
      this.authenticated = false;
      this.accessToken = null;
      // Re-throw or throw a specific error
      if (error.message.includes(RINGCENTRAL_NOT_AUTHENTICATED_ERROR)) {
        throw error; // Propagate the specific error
      }
      throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR + ` (exception during refresh: ${error.message})`);
    }
  }

  /**
   * Check if the client is authenticated
   * This might not reflect the absolute latest state if a refresh is pending or just occurred.
   * Prefer relying on API calls to throw if not authenticated after attempting refresh.
   */
  isAuthenticated(): boolean {
    // For a more accurate synchronous check, re-evaluate based on current token and expiry
    if (this.accessToken && this.accessTokenExpiryTime && this.accessTokenExpiryTime > Date.now()) {
        return true;
    }
    return false; // Less reliable; _ensureTokenIsValid is the key before API calls.
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
        statusText: response.text(), // Consume text to avoid unconsumed body issues
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
      return {
        status: response.status,
        statusText: await response.text(), // Consume text to avoid unconsumed body issues
        success: true // Assuming non-JSON POST response is still a success if status is ok
      };
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
    return this.accessToken; // this.accessToken would be updated by _ensureTokenIsValid
  }
}
