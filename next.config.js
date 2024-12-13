/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', '@radix-ui/react-select', 'lucide-react'],
  },
  output: 'standalone',
  images: {
    domains: ['localhost', '192.168.13.24'],
  },
  publicRuntimeConfig: {
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
  },
  env: {
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
  },
  webpack: (config, { dev, isServer }) => {
    // Only enable React fast refresh in development
    if (dev && !isServer) {
      config.optimization.moduleIds = 'named'
    }
    if (!isServer) {
      config.externals = [
        ...(config.externals || []),
        {
          'bufferutil': 'bufferutil',
          'utf-8-validate': 'utf-8-validate',
          // 'socket.io-client': 'socket.io-client'
        }
      ]
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
        fs: false,
        'utf-8-validate': false,
        bufferutil: false
      }
    }
    return config
  },
  // Reduce the number of pages that are pre-rendered at build time
  reactStrictMode: true,
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
        ],
      },
      {
        source: '/public/uploads/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' }
        ],
      }
    ]
  },
}

export default nextConfig;
