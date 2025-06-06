/**
 * Configuration Module
 *
 * This module provides centralized access to configuration settings and environment variables.
 * It handles different deployment scenarios (development, Hetzner IP:port, Vercel, Cloudflare)
 * and provides sensible defaults.
 */

// Detect the current deployment environment
const getDeploymentTarget = (): 'development' | 'hetzner-initial' | 'hetzner' | 'vercel' | 'cloudflare' => {
  // Check for specific environment markers
  if (process.env.VERCEL_URL) return 'vercel';
  if (process.env.CLOUDFLARE_ACCOUNT_ID) return 'cloudflare';
  if (process.env.NEXT_PUBLIC_DEPLOYMENT_TARGET === 'hetzner') return 'hetzner';
  if (process.env.NEXT_PUBLIC_DEPLOYMENT_TARGET === 'hetzner-initial') return 'hetzner-initial';

  // Default to development if no specific markers are found
  return 'development';
};

// Get API base URL based on deployment target
const getApiBaseUrl = (): string => {
  const deploymentTarget = getDeploymentTarget();

  switch (deploymentTarget) {
    case 'development':
      return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    case 'hetzner-initial':
      return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://65.21.174.252:8000';
    case 'hetzner':
      // Updated for K3s cluster with ingress
      return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://api.gardenos.local';
    case 'hetzner-k3s':
      // New deployment target for K3s cluster
      return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://api.gardenos.local';
    case 'vercel':
    case 'cloudflare':
      // For Vercel/Cloudflare, use K3s backend via ingress
      return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://api.gardenos.local';
    default:
      return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://api.gardenos.local';
  }
};

// Configuration object
export const config = {
  // API configuration
  api: {
    baseUrl: getApiBaseUrl(),
    version: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
    timeout: 30000,
  },

  // Application information
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'AICRM',
    environment: process.env.NODE_ENV || 'development',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Feature flags
  features: {
    sampleData: process.env.NEXT_PUBLIC_ENABLE_SAMPLE_DATA === 'true',
    pdfExport: process.env.NEXT_PUBLIC_ENABLE_PDF_EXPORT === 'true',
  },

  // Deployment information
  deployment: {
    target: getDeploymentTarget(),
    isVercel: getDeploymentTarget() === 'vercel',
    isCloudflare: getDeploymentTarget() === 'cloudflare',
    isHetzner: getDeploymentTarget() === 'hetzner',
    isHetznerK3s: getDeploymentTarget() === 'hetzner-k3s',
    isHetznerInitial: getDeploymentTarget() === 'hetzner-initial',
    isDevelopment: getDeploymentTarget() === 'development',
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  },
};

// Expose individual configs for easier imports
export const apiConfig = config.api;
export const appConfig = config.app;
export const featureConfig = config.features;
export const deploymentConfig = config.deployment;

// Export default config
export default config;