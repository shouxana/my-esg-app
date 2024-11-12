/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add this section
  experimental: {
    appDir: true,
  },
  // Add this to prevent static generation of API routes
  output: 'standalone',
  // Optional: Add this if you want to disable static generation completely
  // for specific paths
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' }
        ],
      },
    ]
  }
}

module.exports = nextConfig