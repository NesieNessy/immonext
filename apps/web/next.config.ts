import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: (process.env.BUILD_OUTPUT as 'standalone' | 'export' | undefined) ?? undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;