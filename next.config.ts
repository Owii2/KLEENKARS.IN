import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "fast-csv",
      "jspdf",
      "nodemailer",
      "qrcode",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  async redirects() {
    return [
      { source: "/hub", destination: "/connect", permanent: true },
      { source: "/links", destination: "/connect", permanent: true },
      { source: "/qr", destination: "/connect", permanent: true },
    ];
  },
};

export default nextConfig;
