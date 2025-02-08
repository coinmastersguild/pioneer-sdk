/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    typedRoutes: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false 
    };
    
    // Add custom resolver for @ alias
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, './src')
    };
    
    return config;
  },
  // Add transpilePackages if needed
  transpilePackages: ['@coinmasters/pioneer-react', 'keepkey-support-widget-export']
};

module.exports = nextConfig; 