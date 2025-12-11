// frontend/lib/config.ts
// Frontend calls backend directly via a public URL.
// Backend has CORS enabled, so it can accept requests from the frontend origin.

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
