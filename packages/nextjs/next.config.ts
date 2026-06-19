import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module:
          /node_modules[\\/](?:@reown[\\/]appkit|@coinbase[\\/]cdp-sdk)[\\/]node_modules[\\/]ox[\\/]_esm[\\/]tempo[\\/]internal[\\/]virtualMasterPool\.js$/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ];
    return config;
  },
};

module.exports = nextConfig;
