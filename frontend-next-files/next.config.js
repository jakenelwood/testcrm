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
  output: 'standalone',
};

module.exports = nextConfig; 