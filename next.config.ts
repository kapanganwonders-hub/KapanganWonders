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
};

export default nextConfig;
