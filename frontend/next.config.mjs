// frontend/next.config.mjs
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Fix Codespaces / monorepo multiple lockfiles warning
    root: __dirname,
  },
};

export default nextConfig;
