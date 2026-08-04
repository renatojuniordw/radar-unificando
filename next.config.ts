import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', 'pdfjs-dist', 'pg', '@prisma/adapter-pg'],
  poweredByHeader: false,
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        pg: 'commonjs pg',
        'pg-connection-string': 'commonjs pg-connection-string',
        pgpass: 'commonjs pgpass',
        '@prisma/adapter-pg': 'commonjs @prisma/adapter-pg',
      });
    }
    return config;
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
