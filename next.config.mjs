/** @type {import('next').NextConfig} */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot
  },
  images: {
    qualities: [75, 80],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      },
      {
        protocol: "https",
        hostname: "htvqndpibljuinycccnj.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**"
      }
    ]
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false
      };
    }

    return config;
  }
};

export default nextConfig;
