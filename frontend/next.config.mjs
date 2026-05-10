/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  // Playwright / alternate host hits dev HMR without this warning
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
