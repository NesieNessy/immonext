import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/immonext',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
