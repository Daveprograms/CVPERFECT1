/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
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

    return config;
  },
  experimental: {
    serverActions: true
  }
}

module.exports = nextConfig 