const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

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
  // TEMPORARILY COMMENTED OUT TO DEBUG EXPORTS ERROR
  /*
  webpack: (config) => {
    // Suppress warnings about coffee-script and other dependencies
    config.ignoreWarnings = [
      { message: /require\.extensions/ },
      { message: /Critical dependency: require function/ },
      { module: /node_modules\/coffee-script/ },
      { module: /node_modules\/vm2/ }
    ];

    // Optimize webpack caching to use Buffer for large strings
    if (config.cache && config.cache.type === 'filesystem') {
      config.cache.compression = 'gzip';
      config.cache.maxMemoryGenerations = 1;
    }

    // Optimize module concatenation for better performance
    config.optimization = {
      ...config.optimization,
      concatenateModules: true,
      // Remove usedExports as it conflicts with Next.js 15+ cacheUnaffected
      // Next.js handles tree shaking automatically
      sideEffects: false,
      // Improve tree shaking
      providedExports: true,
      innerGraph: true,
      // Split chunks more efficiently
      splitChunks: {
        ...config.optimization.splitChunks,
        chunks: 'all',
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          // Split vendor chunks more granularly
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            chunks: 'all',
            priority: 40,
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 35,
          },
          lucide: {
            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
            name: 'lucide',
            chunks: 'all',
            priority: 30,
          },
          // Split large utility libraries
          tanstack: {
            test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
            name: 'tanstack',
            chunks: 'all',
            priority: 28,
          },
          radix: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix',
            chunks: 'all',
            priority: 27,
          },
          // Split date/utility libraries
          dateUtils: {
            test: /[\\/]node_modules[\\/](date-fns|dayjs|moment)[\\/]/,
            name: 'date-utils',
            chunks: 'all',
            priority: 26,
          },
          // Split validation libraries
          validation: {
            test: /[\\/]node_modules[\\/](zod|yup|joi)[\\/]/,
            name: 'validation',
            chunks: 'all',
            priority: 25,
          },
          // Split remaining large vendor libraries
          reactLibs: {
            test: /[\\/]node_modules[\\/](react-hook-form|react-router|react-query)[\\/]/,
            name: 'react-libs',
            chunks: 'all',
            priority: 15,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
            maxSize: 500000, // 500KB max per vendor chunk
          },
          // Separate database/drizzle code
          database: {
            test: /[\\/](drizzle|database|types)[\\/]/,
            name: 'database',
            chunks: 'all',
            priority: 20,
            enforce: true,
          },
          // Split form components more granularly
          leadForms: {
            test: /[\\/]components[\\/]forms[\\/](lead-info-form|auto-insurance-form)[\\/]/,
            name: 'lead-forms',
            chunks: 'all',
            priority: 22,
            enforce: true,
          },
          insuranceForms: {
            test: /[\\/]components[\\/](home-insurance-form|forms[\\/](home-form|specialty-item-form))[\\/]/,
            name: 'insurance-forms',
            chunks: 'all',
            priority: 21,
            enforce: true,
          },
          otherForms: {
            test: /[\\/]components[\\/]forms[\\/]/,
            name: 'other-forms',
            chunks: 'all',
            priority: 18,
            enforce: true,
          },
          // Separate kanban components
          kanban: {
            test: /[\\/]components[\\/]kanban[\\/]/,
            name: 'kanban',
            chunks: 'all',
            priority: 17,
            enforce: true,
          },
          // Separate UI components
          ui: {
            test: /[\\/]components[\\/]ui[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 15,
          },
        },
      },
    };

    // Add performance budgets to warn about large bundles
    config.performance = {
      ...config.performance,
      hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
      maxEntrypointSize: 300000, // 300KB
      maxAssetSize: 250000, // 250KB
    };

    return config;
  },
  */

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
    // Removed optimizePackageImports to fix ReferenceError: exports is not defined
    // This experimental feature was causing module resolution conflicts with Supabase
  },

  // External packages for server components (moved from experimental)
  serverExternalPackages: ['drizzle-orm', 'postgres'],

  // Transpile packages for better tree shaking
  transpilePackages: [
    '@supabase/ssr',
    '@radix-ui/react-dialog',
    '@radix-ui/react-dropdown-menu',
    '@tanstack/react-table'
  ],
};

module.exports = withBundleAnalyzer(nextConfig);