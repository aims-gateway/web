const withNextIntl = require("next-intl/plugin")();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/:locale/console",
        destination: "/:locale",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const backend = process.env.AIMS_BACKEND_ORIGIN || process.env.NEXT_PUBLIC_API_BASE || "http://aims-backend:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${backend}/api/:path*`,
      },
      {
        source: "/china/:path*",
        destination: `${backend}/china/:path*`,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
