// Bundle optimization utilities
// Helps reduce the large concatenated modules shown in bundle analyzer

// Lazy load heavy utilities only when needed
export const loadHeavyUtils = {
  // Date formatting utilities
  dateUtils: () => import('@/utils/date-format'),
  
  // Form transformers (large utility functions)
  formTransformers: () => import('@/lib/form-transformers'),
  
  // Status utilities
  statusUtils: () => import('@/utils/status-styles'),
  
  // RingCentral utilities (large API client)
  ringcentral: () => import('@/utils/ringcentral'),
  
  // Database schema (very large)
  dbSchema: () => import('@/lib/drizzle/schema'),
  
  // Large type definitions
  dbTypes: () => import('@/types/database.types'),
};

// Create lightweight wrappers for commonly used functions
export const formatDate = async (date: string | Date) => {
  const { formatDateMMDDYYYY } = await loadHeavyUtils.dateUtils();
  return formatDateMMDDYYYY(date);
};

export const formatDateTime = async (date: string | Date) => {
  const { formatDateTimeMMDDYYYY } = await loadHeavyUtils.dateUtils();
  return formatDateTimeMMDDYYYY(date);
};

export const getStatusStyles = async (status: string) => {
  const { getStatusStyles } = await loadHeavyUtils.statusUtils();
  return getStatusStyles(status);
};

// Memoization for frequently accessed data
const memoCache = new Map();

export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (memoCache.has(key)) {
      return memoCache.get(key);
    }
    const result = fn(...args);
    memoCache.set(key, result);
    return result;
  }) as T;
};

// Clear memoization cache when needed
export const clearMemoCache = () => {
  memoCache.clear();
};
