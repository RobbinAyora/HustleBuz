/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: "standalone", // Makes deployment more stable
  poweredByHeader: false,
  experimental: {
    turbo: {
      resolveExtensions: [".ts", ".tsx", ".js", ".jsx"], // ensures chunk resolution works
    },
  },
  trailingSlash: false,
};

module.exports = nextConfig;


