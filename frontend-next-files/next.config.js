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

  // Explicitly expose environment variables to the browser
  env: {
    RINGCENTRAL_CLIENT_ID: process.env.RINGCENTRAL_CLIENT_ID,
    RINGCENTRAL_CLIENT_SECRET: process.env.RINGCENTRAL_CLIENT_SECRET,
    RINGCENTRAL_SERVER: process.env.RINGCENTRAL_SERVER,
    RINGCENTRAL_USERNAME: process.env.RINGCENTRAL_USERNAME,
    RINGCENTRAL_EXTENSION: process.env.RINGCENTRAL_EXTENSION,
    RINGCENTRAL_PASSWORD: process.env.RINGCENTRAL_PASSWORD,
    NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER: process.env.NEXT_PUBLIC_RINGCENTRAL_FROM_NUMBER,
    REDIRECT_URI: process.env.REDIRECT_URI,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
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