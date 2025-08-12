import { NextRequest } from 'next/server';
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import { RINGCENTRAL_NOT_AUTHENTICATED_ERROR } from '@/lib/constants';

const RINGCENTRAL_SERVER = process.env.RINGCENTRAL_SERVER_URL || 'https://platform.devtest.ringcentral.com';
const NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

export class RingCentralClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private accessTokenExpiryTime: number | null = null;
  private authenticated: boolean = false;
  private cookieStore: ReadonlyRequestCookies | (() => Promise<ReadonlyRequestCookies>);
  private requestOrigin: string;

  constructor(cookieStore: ReadonlyRequestCookies | (() => Promise<ReadonlyRequestCookies>), request?: NextRequest) {
    this.cookieStore = cookieStore;
    this.requestOrigin = NEXT_PUBLIC_APP_URL || request?.headers.get('origin') || 'http://localhost:3000';
    this.authenticated = false;
  }

  /**
   * Check if the client is authenticated
   */
  isAuthenticated(): boolean {
    return this.authenticated && !!this.accessToken;
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string | null> {
    await this._ensureTokenIsValid();
    return this.accessToken;
  }

  /**
   * Ensure the access token is valid, refreshing if necessary
   */
  private async _ensureTokenIsValid(): Promise<void> {
    const resolvedCookieStore = typeof this.cookieStore === 'function'
      ? await this.cookieStore()
      : this.cookieStore;

    // Get tokens from cookies
    const accessTokenCookie = resolvedCookieStore.get('ringcentral_access_token');
    const refreshTokenCookie = resolvedCookieStore.get('ringcentral_refresh_token');
    const expiryTimeCookie = resolvedCookieStore.get('ringcentral_token_expiry');

    if (!accessTokenCookie?.value || !refreshTokenCookie?.value) {
      this.authenticated = false;
      return;
    }

    this.accessToken = accessTokenCookie.value;
    this.refreshToken = refreshTokenCookie.value;
    this.accessTokenExpiryTime = expiryTimeCookie?.value ? parseInt(expiryTimeCookie.value) : null;

    // Check if token is expired
    const now = Date.now();
    const isExpired = this.accessTokenExpiryTime && now >= this.accessTokenExpiryTime;

    if (isExpired) {
      await this._refreshToken();
    } else {
      this.authenticated = true;
    }
  }

  /**
   * Refresh the access token
   */
  private async _refreshToken(): Promise<void> {
    try {
      const resolvedCookieStore = typeof this.cookieStore === 'function'
        ? await this.cookieStore()
        : this.cookieStore;

      const allCookies = resolvedCookieStore.getAll();
      const cookieHeader = allCookies
        .map(c => `${c.name}=${c.value}`)
        .join('; ');

      const refreshUrl = `${this.requestOrigin}/api/ringcentral/auth?action=refresh`;

      const response = await fetch(refreshUrl, {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader
        }
      });

      if (!response.ok) {
        this.authenticated = false;
        throw new Error('Failed to refresh token');
      }

      // Token should be updated in cookies by the refresh endpoint
      this.authenticated = true;
    } catch (error) {
      this.authenticated = false;
      throw error;
    }
  }

  /**
   * Make a GET request to the RingCentral API
   */
  async get(endpoint: string): Promise<any> {
    await this._ensureTokenIsValid();
    if (!this.authenticated || !this.accessToken) {
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
      if (response.status === 401) {
        throw new RingCentralTokenRevokedError('Token revoked or expired');
      }
      throw new Error(`RingCentral API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Make a POST request to the RingCentral API
   */
  async post(endpoint: string, data: any): Promise<any> {
    await this._ensureTokenIsValid();
    if (!this.authenticated || !this.accessToken) {
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
      if (response.status === 401) {
        throw new RingCentralTokenRevokedError('Token revoked or expired');
      }
      throw new Error(`RingCentral API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * End a call
   */
  async endCall(callId: string): Promise<any> {
    const endpoint = `/restapi/v1.0/account/~/telephony/sessions/${callId}`;
    return await this.post(endpoint, { status: 'Finished' });
  }
}

export class RingCentralTokenRevokedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RingCentralTokenRevokedError';
  }
}

export class RingCentralResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RingCentralResourceNotFoundError';
  }
}
