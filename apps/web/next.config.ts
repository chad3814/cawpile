import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the shared monorepo package so Next.js processes its TypeScript source directly
  transpilePackages: ['@cawpile/shared'],
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
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'cawpile-avatars.s3.*.amazonaws.com',
      }
    ]
  }
};

export default nextConfig;
