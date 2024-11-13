/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Set standalone output
  output: 'standalone',
  // Add headers configuration
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