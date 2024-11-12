import type { NextConfig } from 'next'
import type { Configuration as WebpackConfig } from 'webpack'

const nextConfig: NextConfig = {
  async headers() {
    return [];
  },
  images: {
    domains: ['myesgapp.ddns.net'],
  },
  webpack: (config: WebpackConfig) => {
    config.watchOptions = {
      poll: 1000,
      aggregateTimeout: 300,
    }
    return config
  },
  experimental: {
    serverMinification: false
  }
}

export default nextConfig