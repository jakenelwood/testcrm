/**
 * RingCentral Rate Limiter
 *
 * This utility helps prevent rate limiting issues with the RingCentral API
 * by implementing a comprehensive rate limiting protection mechanism with
 * exponential backoff and circuit breaker patterns.
 */

// Rate limiting protection
// This is a simple in-memory cache to prevent too many refresh attempts
// It will be shared across all instances of RingCentralClient
export const rateLimitProtection = {
  lastRefreshAttempt: 0,
  minTimeBetweenRefreshes: 3000, // Reduced from 5 to 3 seconds for better responsiveness
  isRateLimited: false,
  rateLimitResetTime: 0,
  rateLimitBackoff: 30000, // 30 seconds initial backoff when rate limited
  maxBackoff: 900000, // Maximum 15 minute backoff
  backoffMultiplier: 2, // Exponential backoff multiplier
  consecutiveFailures: 0, // Track consecutive failures
  circuitBreakerThreshold: 5, // Open circuit after 5 consecutive failures
  circuitBreakerTimeout: 300000, // 5 minute circuit breaker timeout

  // Check if we're currently rate limited
  canAttemptRefresh(): boolean {
    const now = Date.now();

    // Check circuit breaker state
    if (this.consecutiveFailures >= this.circuitBreakerThreshold) {
      if (now - this.lastRefreshAttempt < this.circuitBreakerTimeout) {
        console.log(`RingCentralClient: Circuit breaker open. ${this.consecutiveFailures} consecutive failures. Reset at ${new Date(this.lastRefreshAttempt + this.circuitBreakerTimeout).toISOString()}`);
        return false;
      } else {
        console.log('RingCentralClient: Circuit breaker timeout expired, allowing half-open state');
        // Allow one attempt in half-open state
      }
    }

    // If we're in a rate-limited state, check if the backoff period has passed
    if (this.isRateLimited) {
      if (now >= this.rateLimitResetTime) {
        console.log('RingCentralClient: Rate limit backoff period has passed, allowing refresh attempt');
        this.isRateLimited = false;
        this.lastRefreshAttempt = now;
        return true;
      } else {
        console.log(`RingCentralClient: Still rate limited. Backoff period ends in ${Math.ceil((this.rateLimitResetTime - now) / 1000)} seconds`);
        return false;
      }
    }

    // Not rate limited, but check if we've made a request too recently
    if (now - this.lastRefreshAttempt < this.minTimeBetweenRefreshes) {
      console.log(`RingCentralClient: Too many refresh attempts. Please wait ${Math.ceil((this.lastRefreshAttempt + this.minTimeBetweenRefreshes - now) / 1000)} seconds`);
      return false;
    }

    this.lastRefreshAttempt = now;
    return true;
  },

  // Mark that we've been rate limited
  setRateLimited(): void {
    this.isRateLimited = true;
    this.consecutiveFailures++;

    // Calculate exponential backoff with jitter
    const baseBackoff = this.rateLimitBackoff * Math.pow(this.backoffMultiplier, Math.min(this.consecutiveFailures - 1, 5));
    const jitter = Math.random() * 0.1 * baseBackoff; // Add up to 10% jitter
    const backoffTime = Math.min(baseBackoff + jitter, this.maxBackoff);

    this.rateLimitResetTime = Date.now() + backoffTime;
    console.log(`RingCentralClient: Rate limited by RingCentral. Consecutive failures: ${this.consecutiveFailures}. Backing off for ${Math.round(backoffTime / 1000)} seconds until ${new Date(this.rateLimitResetTime).toISOString()}`);

    // Increase backoff for next time (exponential backoff)
    this.rateLimitBackoff = Math.min(this.rateLimitBackoff * this.backoffMultiplier, this.maxBackoff);
  },

  // Mark a successful operation
  markSuccess(): void {
    if (this.consecutiveFailures > 0) {
      console.log(`RingCentralClient: Successful operation after ${this.consecutiveFailures} failures. Resetting failure count.`);
      this.consecutiveFailures = 0;
      // Gradually reduce backoff on success
      this.rateLimitBackoff = Math.max(30000, this.rateLimitBackoff / this.backoffMultiplier);
    }
  },

  // Reset rate limiting state
  reset(): void {
    this.isRateLimited = false;
    this.rateLimitBackoff = 30000; // Reset to initial value
    this.consecutiveFailures = 0;
    console.log('RingCentralClient: Rate limiting state reset');
  },

  // Check if a response indicates rate limiting
  isRateLimitResponse(response: Response | null, errorData: any = null): boolean {
    if (response?.status === 429) {
      return true;
    }

    if (errorData) {
      // Check for common rate limiting error codes and messages
      if (errorData.errorCode === 'CMN-301' ||
          errorData.message?.includes('rate') ||
          errorData.error_description?.includes('rate')) {
        return true;
      }
    }

    return false;
  }
};
