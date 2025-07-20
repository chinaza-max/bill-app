/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";

const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Ensure client-side routing works in PWA
  trailingSlash: false,
  assetPrefix: process.env.NODE_ENV === "production" ? "" : "",
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWA(nextConfig);
