/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARNING: this allows deployment even with type errors !!
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
