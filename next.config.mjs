import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  transpilePackages: ['@omnisat/lasereyes', '@omnisat/lasereyes-core', '@omnisat/lasereyes-react'],
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    // Fix for LaserEyes and other packages that have module resolution issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Fix for pino-pretty optional dependency issue with WalletConnect
    // Stub Coinbase x402 optional deps that break webpack when @wagmi/connectors is pulled in
    config.resolve.alias = {
      ...config.resolve.alias,
      'pino-pretty': false,
      '@x402/evm/upto/client': false,
      '@x402/evm/exact/client': false,
      '@x402/core/client': false,
    }
    
    return config
  },
}

export default nextConfig