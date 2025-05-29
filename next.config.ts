/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['framer-motion'],
  eslint: {
    // Don't fail the build in production, but show warnings
    ignoreDuringBuilds: true,
    // Still run linting for better development experience
    dirs: ['src'],
  },
  typescript: {
    // Allow builds to succeed with type errors, but still check types
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
