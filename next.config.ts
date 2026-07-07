import path from "node:path";

import type { NextConfig } from "next";

// Pin the workspace root to this project. Without this, an unrelated lockfile in
// a parent directory can make Next infer the wrong root and nest the standalone
// output under a subpath, breaking `node .next/standalone/server.js`.
const projectRoot = path.resolve(import.meta.dirname);

const nextConfig: NextConfig = {
  // Emit a minimal standalone server bundle for the Docker image.
  output: "standalone",
  outputFileTracingRoot: projectRoot,
  turbopack: { root: projectRoot },
  // Allow the dev server to be viewed over the LAN (Next 16 blocks cross-origin
  // dev requests otherwise, which breaks the client when hitting it by IP).
  allowedDevOrigins: ["192.168.4.55"],
};

export default nextConfig;
