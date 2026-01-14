import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/vocabulary-analyzer',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
