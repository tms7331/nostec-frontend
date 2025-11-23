import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@nemi-fi/wallet-sdk'],
  // Add empty turbopack config to acknowledge we're aware of the webpack config
  turbopack: {},
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts'],
      '.jsx': ['.jsx', '.tsx'],
    };
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
