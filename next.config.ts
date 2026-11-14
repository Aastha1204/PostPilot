import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The renderer reads font files at request time; make sure they ship with the route.
  outputFileTracingIncludes: {
    "/api/render/[postId]": ["./node_modules/@fontsource/**/files/*-latin-*-normal.woff"],
  },
};

export default nextConfig;
