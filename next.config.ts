import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.roselanesbyjeev.in",
      },
    ],
  },
};

export default nextConfig;