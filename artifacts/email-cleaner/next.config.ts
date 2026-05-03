import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["*.replit.dev", "*.sisko.replit.dev", "*.repl.co"],
};

export default nextConfig;
