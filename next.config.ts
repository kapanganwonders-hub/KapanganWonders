import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com", // ✅ Google profile photos
      "firebasestorage.googleapis.com", // ✅ Firebase Storage (future use)
      "res.cloudinary.com", // ✅ Cloudinary (optional future use)
      "cloud.appwrite.io", // ✅ Appwrite storage
    ],
  },
  // Disable caching in development
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Add cache control headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
