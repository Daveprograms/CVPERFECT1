/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do not put BACKEND_URL here: Next inlines `env` at compile time, which can stick to a
  // wrong port until dev server restart. Server routes use `@/lib/server/backendBaseUrl` instead.

  // Performance optimizations (skip optimizeCss in dev — Critters can confuse React DOM commits)
  experimental: {
    ...(process.env.NODE_ENV === 'production' ? { optimizeCss: true } : {}),
    // Do not list lucide-react here: barrel optimization reads many tiny files under
    // node_modules and often fails on OneDrive / cloud-synced paths (Windows UNKNOWN: read).
    optimizePackageImports: ['framer-motion'],
  },
  
  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Compression
  compress: true,

  // Dev: keep compiled pages in memory longer to avoid stale chunk URLs after recompiles (reduces ChunkLoadError on slow disks).
  onDemandEntries: {
    maxInactiveAge: 120 * 1000,
    pagesBufferLength: 5,
  },
  
  // Bundle analyzer (optional)
  // bundleAnalyzer: process.env.ANALYZE === 'true',
  
  webpack: (config, { isServer, dev }) => {
    // OneDrive / slow I/O: layout chunk requests can exceed default load timeout.
    if (dev && !isServer) {
      config.output = {
        ...config.output,
        chunkLoadTimeout: 300000,
      }
    }

    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions || {}),
        aggregateTimeout: 800,
        ignored: ['**/node_modules/**', '**/.git/**'],
      }
      if (process.env.WATCHPACK_POLLING === 'true') {
        config.watchOptions.poll = 1000
      }
    }

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

    // Do not set optimization.sideEffects: false globally — it breaks many packages
    // and can produce invalid vendor chunks (e.g. missing @swc.js references).

    return config;
  },
  
  // Server Actions are now enabled by default in Next.js 14
}

module.exports = nextConfig 