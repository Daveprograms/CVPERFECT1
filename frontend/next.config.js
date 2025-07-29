/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: 'http://127.0.0.1:8000',
    NEXT_PUBLIC_BACKEND_URL: 'http://127.0.0.1:8000',
    NEXT_PUBLIC_API_URL: 'http://127.0.0.1:8000'
  },
  
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Compression
  compress: true,
  
  // Bundle analyzer (optional)
  // bundleAnalyzer: process.env.ANALYZE === 'true',
  
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "undici": false,
        "net": false,
        "tls": false,
        "fs": false,
        "dns": false,
        "stream": false,
        "http": false,
        "https": false,
        "zlib": false,
        "path": false,
        "os": false,
      };
    }

    // Exclude undici from being processed
    config.module.rules.push({
      test: /node_modules\/undici/,
      use: 'null-loader'
    });

    // Add alias for undici
    config.resolve.alias = {
      ...config.resolve.alias,
      'undici': false
    };

    // Performance optimizations
    if (!dev) {
      // Enable tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    return config;
  },
  
  // Server Actions are now enabled by default in Next.js 14
}

module.exports = nextConfig 