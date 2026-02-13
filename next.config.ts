import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Add rewrites for ERP API proxy
  async rewrites() {
    return [
      {
        source: '/api/erp-proxy/:path*',
        destination: 'http://itmsql01:44612/web/:path*',
      },
    ]
  },
};

export default nextConfig;
