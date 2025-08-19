// Lazy-loaded database types for better performance
// Only import what you need to reduce bundle size

export type { Json } from './database-core';

// Lazy load specific table types only when needed
export const loadLeadTypes = () => import('./database.types').then(m => ({
  Lead: m.Database['public']['Tables']['leads']['Row'],
  LeadInsert: m.Database['public']['Tables']['leads']['Insert'],
  LeadUpdate: m.Database['public']['Tables']['leads']['Update']
}));

export const loadClientTypes = () => import('./database.types').then(m => ({
  Client: m.Database['public']['Tables']['clients']['Row'],
  ClientInsert: m.Database['public']['Tables']['clients']['Insert'],
  ClientUpdate: m.Database['public']['Tables']['clients']['Update']
}));

export const loadCommunicationTypes = () => import('./database.types').then(m => ({
  Communication: m.Database['public']['Tables']['communications']['Row'],
  CommunicationInsert: m.Database['public']['Tables']['communications']['Insert'],
  CommunicationUpdate: m.Database['public']['Tables']['communications']['Update']
}));

// Common types that are frequently used - keep these direct imports
export type Database = import('./database.types').Database;
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Create a type cache to avoid repeated imports
const typeCache = new Map();

export const getCachedTypes = async <T>(key: string, loader: () => Promise<T>): Promise<T> => {
  if (typeCache.has(key)) {
    return typeCache.get(key);
  }
  const types = await loader();
  typeCache.set(key, types);
  return types;
};

// Efficient type loaders with caching
export const getLeadTypes = () => getCachedTypes('leads', loadLeadTypes);
export const getClientTypes = () => getCachedTypes('clients', loadClientTypes);
export const getCommunicationTypes = () => getCachedTypes('communications', loadCommunicationTypes);
