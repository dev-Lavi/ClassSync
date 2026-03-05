/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Standalone output for Docker ────────────────────────────
  // Produces a self-contained .next/standalone directory with
  // a minimal node_modules footprint (~80% smaller Docker images)
  output: "standalone",

  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },

  images: {
    remotePatterns: [],
  },

  // ── Disable source maps in production builds ─────────────────
  // Saves ~30% on image size; stack traces still work via Node.js
  productionBrowserSourceMaps: false,

  // ── Suppress noisy build warnings ────────────────────────────
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
