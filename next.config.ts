import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['api.hub.solo-web.studio'],
    remotePatterns: [
      {
        hostname: 'res.cloudinary.com',
        protocol: 'https',
      },
      {
        hostname: 'randomuser.me',
        protocol: 'https',
      },
      {
        protocol: 'https',
        hostname: 'api.hub.solo-web.studio',
        pathname: '/assets/**',
      },
    ],
  },
}

export default nextConfig
