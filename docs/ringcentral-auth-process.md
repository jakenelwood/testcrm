# RingCentral Authorization Process

This document provides a detailed overview of the RingCentral authorization process implemented in our CRM application. It covers the OAuth 2.0 flow, token management, database schema, and common troubleshooting steps.

## Table of Contents

1. [Overview](#overview)
2. [Authorization Flow](#authorization-flow)
3. [Token Management](#token-management)
4. [Database Schema](#database-schema)
5. [Rate Limiting](#rate-limiting)
6. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
7. [API Endpoints](#api-endpoints)

## Overview

Our CRM integrates with RingCentral using OAuth 2.0 with PKCE (Proof Key for Code Exchange) for secure authorization. The integration allows users to make calls, send SMS, and access RingCentral account information directly from the CRM.

Key components:
- OAuth 2.0 with PKCE for secure authorization
- Token storage in Supabase database
- Token refresh mechanism
- Rate limiting to prevent API abuse
- Row-level security for user data protection

## Authorization Flow

The RingCentral authorization process follows these steps:

1. **Initiate Authorization**:
   - User clicks "Connect to RingCentral" in the CRM
   - System generates a PKCE code verifier and challenge
   - User is redirected to RingCentral's authorization page

2. **User Authentication**:
   - User logs in to RingCentral (if not already logged in)
   - User grants permissions to the CRM application

3. **Authorization Code Exchange**:
   - RingCentral redirects back to our application with an authorization code
   - Our server exchanges this code for access and refresh tokens
   - Tokens are stored in both cookies and the database

4. **Token Usage**:
   - Access token is used for API calls to RingCentral
   - System checks token validity before each API call
   - If token is expired, the refresh process is triggered

5. **Token Refresh**:
   - When access token expires, system uses refresh token to get a new one
   - Both tokens are updated in cookies and database
   - If refresh fails, user must re-authorize

## Token Management

### Token Types

1. **Access Token**:
   - Used for API calls to RingCentral
   - Short lifespan (typically 1 hour)
   - Stored in both cookies and database

2. **Refresh Token**:
   - Used to obtain new access tokens
   - Longer lifespan (typically 7 days)
   - Stored in both cookies and database

### Token Storage

Tokens are stored in two places:

1. **Cookies**:
   - `ringcentral_access_token`: The access token
   - `ringcentral_refresh_token`: The refresh token
   - `ringcentral_access_token_expiry_time`: Timestamp when access token expires
   - `ringcentral_refresh_token_expiry_time`: Timestamp when refresh token expires
   - `ringcentral_token_type`: Token type (usually "bearer")
   - `ringcentral_scope`: Authorized scopes

2. **Database**:
   - `ringcentral_tokens` table in Supabase
   - Each user has a unique record (enforced by constraint)
   - Contains the same token information as cookies

### Token Verification

Before making API calls, the system:
1. Checks if tokens exist in cookies
2. Verifies if the access token is still valid
3. If not valid, checks the database for valid tokens
4. If database tokens are valid, synchronizes cookies
5. If no valid tokens are found, triggers the refresh process

## Database Schema

The `ringcentral_tokens` table has the following structure:

```sql
CREATE TABLE ringcentral_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_type TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
  scope TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT ringcentral_tokens_user_id_unique UNIQUE (user_id)
);
```

Key features:
- `user_id` has a UNIQUE constraint to ensure each user has only one set of tokens
- Foreign key reference to `auth.users` with CASCADE deletion
- NOT NULL constraints on critical fields
- Timestamps for token expiration

## Rate Limiting

To prevent API abuse and avoid hitting RingCentral's rate limits, we implement:

1. **Local Rate Limiting**:
   - In-memory store tracks API requests per user
   - Maximum 10 requests per minute per user
   - 5-minute cooldown after hitting the limit

2. **RingCentral Rate Limit Handling**:
   - Detects when RingCentral returns 429 status codes
   - Adds user to local rate limiter
   - Prevents further requests until cooldown period ends

### Redis-Based Rate Limiting

For production environments with multiple server instances, the current in-memory rate limiting has limitations. Implementing Redis-based rate limiting offers several advantages:

1. **Distributed Rate Limiting**:
   - Works across multiple server instances
   - Maintains consistent rate limits regardless of which server handles the request
   - Prevents rate limit bypassing in load-balanced environments

2. **Implementation Approach**:
   ```javascript
   // Example using ioredis
   import Redis from 'ioredis';

   const redis = new Redis(process.env.REDIS_URL);
   const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
   const MAX_REQUESTS_PER_WINDOW = 10;
   const RATE_LIMIT_COOLDOWN_MS = 300000; // 5 minutes

   async function checkRateLimit(userId) {
     const now = Date.now();
     const key = `ratelimit:ringcentral:${userId || 'anonymous'}`;

     // Check if user is in cooldown
     const cooldownKey = `${key}:cooldown`;
     const cooldownUntil = await redis.get(cooldownKey);

     if (cooldownUntil && now < parseInt(cooldownUntil)) {
       return {
         isLimited: true,
         resetTime: new Date(parseInt(cooldownUntil))
       };
     }

     // Get current count and window start
     const countKey = `${key}:count`;
     const windowKey = `${key}:window`;

     let count = parseInt(await redis.get(countKey) || '0');
     const windowStart = parseInt(await redis.get(windowKey) || now.toString());

     // Reset if window has expired
     if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
       count = 0;
       await redis.set(windowKey, now);
       await redis.expire(windowKey, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));
     }

     // Increment count
     count++;
     await redis.set(countKey, count);
     await redis.expire(countKey, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000));

     // Check if limit exceeded
     if (count > MAX_REQUESTS_PER_WINDOW) {
       const cooldownTime = now + RATE_LIMIT_COOLDOWN_MS;
       await redis.set(cooldownKey, cooldownTime);
       await redis.expire(cooldownKey, Math.ceil(RATE_LIMIT_COOLDOWN_MS / 1000));

       return {
         isLimited: true,
         resetTime: new Date(cooldownTime)
       };
     }

     return { isLimited: false };
   }
   ```

3. **Additional Benefits**:
   - **Persistence**: Rate limit data survives server restarts
   - **Monitoring**: Easier to monitor and adjust rate limits in real-time
   - **Analytics**: Can track usage patterns across the entire system
   - **Scalability**: Scales with your application as traffic increases

## Common Issues and Troubleshooting

### 1. "JSON object requested, multiple (or no) rows returned" Error

**Cause**: This occurs when:
- Multiple token records exist for a single user
- No token record exists for the user

**Solution**:
- Run the migration script to add the unique constraint
- Use `maybeSingle()` instead of `single()` in database queries
- Check if records exist before updating them

### 2. Token Refresh Failures

**Cause**: Common reasons include:
- Refresh token is expired
- Refresh token is revoked
- Rate limiting from RingCentral
- Network issues

**Solution**:
- Check refresh token expiration
- Handle rate limiting with exponential backoff
- Implement proper error handling
- Prompt user to re-authorize if needed

### 3. Rate Limiting Issues

**Cause**:
- Too many API calls in a short period
- Multiple users sharing the same RingCentral account

**Solution**:
- Implement local rate limiting
- Add exponential backoff for retries
- Cache responses where appropriate
- Distribute requests over time

## API Endpoints

Our application exposes several endpoints to handle RingCentral authentication:

1. `/api/ringcentral/auth?action=authorize`: Initiates the OAuth flow
2. `/api/ringcentral/auth?action=check`: Checks if user is authenticated
3. `/api/ringcentral/auth?action=token`: Gets the current access token
4. `/api/ringcentral/auth?action=refresh`: Refreshes the access token
5. `/api/ringcentral/auth?action=logout`: Logs out from RingCentral

Each endpoint has specific error handling and response formats documented in the code.

---

For more detailed information, refer to:
- [RingCentral API Documentation](https://developers.ringcentral.com/api-reference)
- [OAuth 2.0 with PKCE](https://oauth.net/2/pkce/)
- [Supabase Documentation](https://supabase.com/docs)
