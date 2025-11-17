import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack configuration
  turbopack: {
    root: __dirname, // Explicitly set the root directory
  },
  images: {
    domains: [
      "lh3.googleusercontent.com", // ✅ Google profile photos
      "firebasestorage.googleapis.com", // ✅ Firebase Storage (future use)
      "res.cloudinary.com", // ✅ Cloudinary (optional future use)
      "cloud.appwrite.io", // ✅ Appwrite storage
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Cache control headers - simplified for Turbopack compatibility
  headers: async () => {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/_next/static/:path*',
          headers: [
            { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
