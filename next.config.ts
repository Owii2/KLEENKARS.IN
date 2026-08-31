import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      { source: "/hub", destination: "/connect", permanent: true },
      { source: "/links", destination: "/connect", permanent: true },
      { source: "/qr", destination: "/connect", permanent: true },
    ];
  },
};

export default nextConfig;
