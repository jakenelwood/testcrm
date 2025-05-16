/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.hetzner.com',
      },
      {
        protocol: 'http',
        hostname: '65.21.174.252',
      },
    ],
  },
  // Ensure we don't have hydration issues with browser extensions adding attributes
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,

  compiler: {
    styledComponents: true,
    // Add this to help with hydration issues
    reactRemoveProperties: { properties: ['^data-lt-installed$', '^cz-shortcut-listen$'] },
  },

  // Disable ESLint during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript type checking during build
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },

  // Changed from 'standalone' to undefined to avoid static export issues
  // This will use the default Next.js output mode which is more compatible with dynamic routes
  output: undefined,

  // We've addressed the CSR bailout issues by wrapping components in Suspense boundaries
  experimental: {
    // Add any valid experimental options here if needed in the future
    // This helps with hydration issues
    optimizePackageImports: ['react-icons'],
  },
};

module.exports = nextConfig;
