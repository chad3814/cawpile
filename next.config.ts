import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    loader: 'default',
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      {
        protocol: 'http',
        hostname: 'books.google.com',
      },
      {
        protocol: 'https',
        hostname: 'books.google.com',
      }
    ]
  }
};

export default nextConfig;
