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

    // Add specific handling for undici
    config.module.rules.push({
      test: /node_modules\/undici/,
      loader: 'ignore-loader'
    });

    return config;
  },
  experimental: {
    serverActions: true
  }
}

module.exports = nextConfig 