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
  },

  // Custom webpack configuration to suppress coffee-script warnings
  webpack: (config, { isServer }) => {
    // Suppress warnings about coffee-script and other dependencies
    config.ignoreWarnings = [
      { message: /require\.extensions/ },
      { message: /Critical dependency: require function/ },
      { module: /node_modules\/coffee-script/ },
      { module: /node_modules\/vm2/ }
    ];

    return config;
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