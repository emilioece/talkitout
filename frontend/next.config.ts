import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Public environment variables that can be used in the browser
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/(landing)',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
