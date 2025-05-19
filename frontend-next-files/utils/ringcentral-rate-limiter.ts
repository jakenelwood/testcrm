/**
 * RingCentral Rate Limiter
 * 
 * This utility helps prevent rate limiting issues with the RingCentral API
 * by implementing a simple rate limiting protection mechanism.
 */

// Rate limiting protection
// This is a simple in-memory cache to prevent too many refresh attempts
// It will be shared across all instances of RingCentralClient
export const rateLimitProtection = {
  lastRefreshAttempt: 0,
  minTimeBetweenRefreshes: 5000, // 5 seconds minimum between refresh attempts
  isRateLimited: false,
  rateLimitResetTime: 0,
  rateLimitBackoff: 30000, // 30 seconds initial backoff when rate limited
  
  // Check if we're currently rate limited
  canAttemptRefresh(): boolean {
    const now = Date.now();
    
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
    this.rateLimitResetTime = Date.now() + this.rateLimitBackoff;
    console.log(`RingCentralClient: Rate limited by RingCentral. Backing off for ${this.rateLimitBackoff / 1000} seconds until ${new Date(this.rateLimitResetTime).toISOString()}`);
    
    // Increase backoff for next time (exponential backoff)
    this.rateLimitBackoff = Math.min(this.rateLimitBackoff * 2, 5 * 60 * 1000); // Max 5 minutes
  },
  
  // Reset rate limiting state
  reset(): void {
    this.isRateLimited = false;
    this.rateLimitBackoff = 30000; // Reset to initial value
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
