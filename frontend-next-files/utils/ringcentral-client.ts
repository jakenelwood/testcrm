import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { NextRequest } from 'next/server'; // Import NextRequest for potential origin access
import {
  RINGCENTRAL_SERVER,
  API_ENDPOINTS,
  NEXT_PUBLIC_APP_URL
} from '@/lib/ringcentral/config';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR, UNKNOWN_ERROR_OCCURRED } from '@/lib/constants';
import { rateLimitProtection } from './ringcentral-rate-limiter';
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

// Add a new error class for revoked/invalid tokens
export class RingCentralTokenRevokedError extends Error {
  public originalErrorData: any;
  constructor(message: string, originalErrorData?: any) {
    super(message);
    this.name = 'RingCentralTokenRevokedError';
    this.originalErrorData = originalErrorData;
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, RingCentralTokenRevokedError.prototype);
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
  private cookieStore: ReadonlyRequestCookies | (() => Promise<ReadonlyRequestCookies>);
  private requestOrigin: string; // To build absolute URLs for internal API calls

  /**
   * Create a new RingCentral client
   * @param cookieStore Deprecated: Next.js cookie store, no longer used directly by constructor for instance storage.
   * @param request The incoming NextRequest, used to get the origin for internal API calls
   */
  constructor(cookieStore: ReadonlyRequestCookies | (() => Promise<ReadonlyRequestCookies>), request?: NextRequest) {
    this.cookieStore = cookieStore;
    // Prioritize NEXT_PUBLIC_APP_URL, then request origin, then localhost as a last resort.
    this.requestOrigin = NEXT_PUBLIC_APP_URL || request?.headers.get('origin') || 'http://localhost:3000';

    // Initialize authentication state dynamically
    // Actual token access will be handled asynchronously in _ensureTokenIsValid
    this.authenticated = false;
  }

  private async _ensureTokenIsValid(): Promise<void> {
    try {
      console.log('RingCentralClient: Ensuring token is valid...');

      // Handle both direct cookieStore and async cookieStore function
      const resolvedCookieStore = typeof this.cookieStore === 'function' 
        ? await this.cookieStore()
        : this.cookieStore;

      // Always read fresh values from the cookieStore for the current state
      const accessTokenCookie = resolvedCookieStore.get('ringcentral_access_token');
      const refreshTokenCookie = resolvedCookieStore.get('ringcentral_refresh_token');
      const expiryTimeCookie = resolvedCookieStore.get('ringcentral_access_token_expiry_time');

      const oldAccessToken = this.accessToken;
      this.accessToken = accessTokenCookie?.value || null;
      this.refreshToken = refreshTokenCookie?.value || null;
      this.accessTokenExpiryTime = expiryTimeCookie?.value ? parseInt(expiryTimeCookie.value, 10) : null;

      // Log token state for debugging
      const now = Date.now();
      const isExpired = this.accessTokenExpiryTime ? this.accessTokenExpiryTime <= now : true;
      const isNearExpiry = this.accessTokenExpiryTime ? (this.accessTokenExpiryTime - now) < 300000 : true; // 5 minutes
      const timeRemaining = this.accessTokenExpiryTime ? Math.round((this.accessTokenExpiryTime - now) / 1000 / 60) : 0;

      console.log('RingCentralClient: Token state:', {
        hasAccessToken: !!this.accessToken,
        accessTokenLength: this.accessToken?.length,
        hasRefreshToken: !!this.refreshToken,
        expiryTime: this.accessTokenExpiryTime ? new Date(this.accessTokenExpiryTime).toISOString() : null,
        isExpired,
        isNearExpiry,
        nowTime: new Date(now).toISOString(),
        tokenChanged: oldAccessToken !== this.accessToken,
        timeRemaining: `${timeRemaining} minutes`
      });

      // If token is expired or near expiry, attempt refresh
      if (isExpired || isNearExpiry) {
        console.log('RingCentralClient: Access token nearing expiry. Attempting refresh...');
        
        // Check if we can attempt a refresh based on rate limiting
        if (!rateLimitProtection.canAttemptRefresh()) {
          console.log('RingCentralClient: Rate limiting protection active, cannot refresh token now');
          throw new Error('Not authenticated with RingCentral (rate limiting protection active)');
        }

        try {
          // Use resolvedCookieStore to construct the Cookie header for the internal fetch call
          const allCookies = resolvedCookieStore.getAll();
          const cookieHeader = allCookies
            .map(c => `${c.name}=${c.value}`)
            .join('; ');

          const refreshUrl = `${this.requestOrigin}/api/ringcentral/auth?action=refresh`;
          console.log('RingCentralClient: Calling internal refresh URL:', refreshUrl);

          const response = await fetch(refreshUrl, {
            method: 'GET',
            headers: {
              'Cookie': cookieHeader
            }
          });

          if (!response.ok) {
            const errorData = await response.json();
            
            // Handle rate limiting
            if (response.status === 429 || (errorData.errorCode === 'CMN-301')) {
              this._handleRateLimit();
              throw new Error('Not authenticated with RingCentral (rate limited by RingCentral)');
            }

            // Handle token revocation
            if (errorData.reauthorize) {
              throw new RingCentralTokenRevokedError(
                'RingCentral refresh token is invalid or expired. Please re-authenticate.',
                errorData.originalError
              );
            }

            throw new Error(errorData.error || 'Failed to refresh token');
          }

          const data = await response.json();
          if (data.accessToken) {
            this.accessToken = data.accessToken;
            this.accessTokenExpiryTime = data.expiresAt;
            this.authenticated = true;
            
            // Update refresh token if provided
            const newRefreshTokenCookie = resolvedCookieStore.get('ringcentral_refresh_token');
            this.refreshToken = newRefreshTokenCookie?.value || this.refreshToken;
            console.log('RingCentralClient: Token refreshed successfully via internal API call.');
          } else {
            throw new Error('Invalid response from token refresh endpoint');
          }
        } catch (refreshError: any) {
          console.error('RingCentralClient: Exception during token refresh process:', 
            refreshError.message, refreshError.stack);
          this.authenticated = false;
          throw new Error(RINGCENTRAL_NOT_AUTHENTICATED_ERROR + 
            ` (exception during refresh: ${refreshError.message})`);
        }
      } else {
        this.authenticated = !!this.accessToken;
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
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle rate limiting
      if (response.status === 429 || (errorData.errorCode === 'CMN-301')) {
        this._handleRateLimit();
        throw new Error('Rate limited by RingCentral. Please try again later.');
      }

      // Handle token revocation
      if (errorData.error === 'invalid_grant' || (errorData.errors && errorData.errors.some((e: any) => e.errorCode === 'OAU-211'))) {
        throw new RingCentralTokenRevokedError('RingCentral token is revoked or invalid. Please re-authenticate.', errorData);
      }

      throw new Error(errorData.error_description || errorData.message || 'Failed to make RingCentral API request');
    }

    return response.json();
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
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      // Handle rate limiting
      if (response.status === 429 || (errorData.errorCode === 'CMN-301')) {
        this._handleRateLimit();
        throw new Error('Rate limited by RingCentral. Please try again later.');
      }
      // Handle token revocation
      if (errorData.error === 'invalid_grant' || (errorData.errors && errorData.errors.some((e: any) => e.errorCode === 'OAU-211'))) {
        throw new RingCentralTokenRevokedError('RingCentral token is revoked or invalid. Please re-authenticate.', errorData);
      }
      throw new Error(errorData.error_description || errorData.message || 'Failed to make RingCentral API request');
    }

    // Handle empty or 204 No Content responses gracefully
    if (response.status === 204) {
      return { success: true };
    }
    const text = await response.text();
    if (!text) {
      return { success: true };
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      // If parsing fails but response is ok, return success
      if (response.ok) {
        return { success: true };
      }
      throw e;
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
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      // Handle rate limiting
      if (response.status === 429 || (errorData.errorCode === 'CMN-301')) {
        this._handleRateLimit();
        throw new Error('Rate limited by RingCentral. Please try again later.');
      }

      // Handle token revocation
      if (errorData.error === 'invalid_grant' || (errorData.errors && errorData.errors.some((e: any) => e.errorCode === 'OAU-211'))) {
        throw new RingCentralTokenRevokedError('RingCentral token is revoked or invalid. Please re-authenticate.', errorData);
      }

      throw new Error(errorData.error_description || errorData.message || 'Failed to make RingCentral API request');
    }

    return response.json();
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

  private _isRateLimited(): boolean {
    return rateLimitProtection.isRateLimited;
  }

  private _handleRateLimit(): void {
    rateLimitProtection.setRateLimited();
  }
}
