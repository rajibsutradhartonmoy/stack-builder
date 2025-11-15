/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for production
  output: 'standalone',
  // Disable strict mode to avoid double-rendering in dev
  reactStrictMode: true,
}

module.exports = nextConfig
