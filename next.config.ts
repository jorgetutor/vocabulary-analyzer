import { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  // Only set basePath for production (GitHub Pages)
  basePath: isProd ? '/vocabulary-analyzer' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
