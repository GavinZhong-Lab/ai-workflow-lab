/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@saas/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  webpack: (config, { isServer }) => {
    // Exclude monorepo root node_modules from watch to avoid EMFILE
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**', '../../node_modules/**'],
    };
    return config;
  },
};

module.exports = nextConfig;
