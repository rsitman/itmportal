import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add rewrites for ERP API proxy
  async rewrites() {
    const erpUrl = process.env.ERP_API_URL || 'http://itmsql01:44612'
    return [
      {
        source: '/api/erp-proxy/:path*',
        destination: `${erpUrl}/web/:path*`,
      },
    ]
  },
};

export default nextConfig;
