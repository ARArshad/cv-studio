import type { NextConfig } from "next";

// Normal `next dev` / `next build` behave exactly as before.
// For a static site (e.g. GitHub Pages under /cv-studio) build with:
//   STATIC_EXPORT=1 PAGES_BASE_PATH=/cv-studio npm run build
// which writes plain HTML/CSS/JS to ./out
const basePath = process.env.PAGES_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  ...(process.env.STATIC_EXPORT
    ? { output: "export" as const, trailingSlash: true, images: { unoptimized: true } }
    : {}),
};

export default nextConfig;
