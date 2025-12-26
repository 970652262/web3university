import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "blue-academic-dinosaur-142.mypinata.cloud",
      },
    ],
  },
  // 禁用 Turbopack，使用 Webpack 以兼容 WalletConnect
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
