import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    domains: [
      "lh3.googleusercontent.com",
      "firebasestorage.googleapis.com",
      "res.cloudinary.com",
      "cloud.appwrite.io",
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  headers: async () => {
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/_next/static/:path*",
          headers: [
            { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          ],
        },
      ];
    }
    return [];
  },
  eslint: {
    ignoreDuringBuilds: true, // ✅ completely disables ESLint during build
  },
};

export default nextConfig;
