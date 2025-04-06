/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    // Public environment variables that can be used in the browser
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  },
  // Remove the redirect configuration since we're handling it client-side
};

export default nextConfig; 