import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  agentRules: false,
  async redirects() {
    return [{ source: "/matches", destination: "/", permanent: false }];
  },
};

export default nextConfig;
