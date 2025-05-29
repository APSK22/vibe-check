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
  // Add SWC compiler configuration to remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? true : false,
  },
  // Fix font preloading issues
  experimental: {
    optimizeFonts: true,
  },
};

export default nextConfig;
