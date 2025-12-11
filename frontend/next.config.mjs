// frontend/next.config.mjs

/** @type {import('next').NextConfig} */

// Internal URL for the backend as seen from inside the Codespace container.
// This is NOT exposed to the browser; it is used only by Next.js rewrites.
const BACKEND_INTERNAL_URL =
  process.env.BACKEND_INTERNAL_URL ?? "http://127.0.0.1:3001";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${BACKEND_INTERNAL_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
