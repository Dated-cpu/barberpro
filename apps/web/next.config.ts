import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.amazonaws.com' },
    ],
  },
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default nextConfig;
