/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      'verbfy.com',
      'api.verbfy.com',
      'cdn.verbfy.com',
      'images.unsplash.com',
      'plus.unsplash.com',
      'picsum.photos',
      'i.pravatar.cc'
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // PWA support (optional)
  // pwa: {
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  // },
};

let exported = nextConfig;
try {
  const { withSentryConfig } = require('@sentry/nextjs');
  exported = withSentryConfig(nextConfig, {
    silent: true,
    // Hide source maps in production to avoid code exposure in devtools
    widenClientFileUpload: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    // The following option mirrors hiding sourcemaps guidance
    // Actual sourcemap type is configured by Sentry plugin automatically
    hideSourceMaps: true,
  });
} catch (_) {}

module.exports = exported;