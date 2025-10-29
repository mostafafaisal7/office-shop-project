import type { NextConfig } from "next";

// Load backend API URL from environment variable
const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

// Load image domains from environment variable
const imageDomains = process.env.NEXT_PUBLIC_IMAGE_DOMAINS
  ? process.env.NEXT_PUBLIC_IMAGE_DOMAINS.split(',').map(d => d.trim())
  : ['images.unsplash.com', '127.0.0.1', 'localhost'];

const nextConfig: NextConfig = {
  images: {
    domains: imageDomains,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
