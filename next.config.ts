import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: false,
  allowedDevOrigins: [
    "192.168.1.3",
    "192.168.1.3:3001",
    "127.0.0.1",
    "127.0.0.1:3001",
    "localhost",
    "localhost:3001",
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
