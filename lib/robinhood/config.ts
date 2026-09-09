/**
 * Robinhood Chain network config + helpers
 */

export const ROBINHOOD_MAINNET = {
  id: 4663,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
    public: { http: ['https://rpc.mainnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://robinhoodchain.blockscout.com' },
  },
} as const

export const ROBINHOOD_TESTNET = {
  id: 46630,
  name: 'Robinhood Chain Testnet',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.chain.robinhood.com'] },
    public: { http: ['https://rpc.testnet.chain.robinhood.com'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://explorer.testnet.chain.robinhood.com' },
  },
} as const

export type RobinhoodNetwork = 'mainnet' | 'testnet'

export function getRobinhoodNetwork(): RobinhoodNetwork {
  const raw = (process.env.NEXT_PUBLIC_RH_NETWORK || process.env.RH_NETWORK || 'testnet').toLowerCase()
  return raw === 'mainnet' ? 'mainnet' : 'testnet'
}

export function getRobinhoodChain() {
  return getRobinhoodNetwork() === 'mainnet' ? ROBINHOOD_MAINNET : ROBINHOOD_TESTNET
}

export function getRobinhoodRpcUrl(): string {
  const network = getRobinhoodNetwork()
  if (network === 'mainnet') {
    return process.env.RH_RPC_URL || process.env.NEXT_PUBLIC_RH_RPC_URL || ROBINHOOD_MAINNET.rpcUrls.default.http[0]
  }
  return (
    process.env.RH_TESTNET_RPC_URL ||
    process.env.NEXT_PUBLIC_RH_TESTNET_RPC_URL ||
    process.env.NEXT_PUBLIC_RH_RPC_URL ||
    ROBINHOOD_TESTNET.rpcUrls.default.http[0]
  )
}

export function getPlatformWallet(): string {
  const addr = process.env.RH_PLATFORM_WALLET
  if (!addr) throw new Error('RH_PLATFORM_WALLET is not configured')
  return addr
}

export function getPlatformFeeWei(): bigint {
  const eth = process.env.NEXT_PUBLIC_RH_PLATFORM_FEE_ETH || '0.001'
  const asFloat = Number(eth)
  if (!Number.isFinite(asFloat) || asFloat < 0) return BigInt(1_000_000_000_000_000) // 0.001
  return BigInt(Math.round(asFloat * 1e18))
}

export function getFactoryAddress(): `0x${string}` | null {
  const addr = process.env.RH_FACTORY_ADDRESS || process.env.NEXT_PUBLIC_RH_FACTORY_ADDRESS
  return addr ? (addr as `0x${string}`) : null
}

export function getMarketplaceAddress(): `0x${string}` | null {
  const addr = process.env.RH_MARKETPLACE_ADDRESS || process.env.NEXT_PUBLIC_RH_MARKETPLACE_ADDRESS
  return addr ? (addr as `0x${string}`) : null
}

export function explorerTxUrl(txHash: string): string {
  const base = getRobinhoodChain().blockExplorers.default.url
  return `${base}/tx/${txHash}`
}

export function explorerAddressUrl(address: string): string {
  const base = getRobinhoodChain().blockExplorers.default.url
  return `${base}/address/${address}`
}

export function explorerTokenUrl(contract: string, tokenId: string | number): string {
  const base = getRobinhoodChain().blockExplorers.default.url
  return `${base}/token/${contract}/instance/${tokenId}`
}
