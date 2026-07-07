import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be viewed over the LAN (Next 16 blocks cross-origin
  // dev requests otherwise, which breaks the client when hitting it by IP).
  allowedDevOrigins: ["192.168.4.55"],
};

export default nextConfig;
