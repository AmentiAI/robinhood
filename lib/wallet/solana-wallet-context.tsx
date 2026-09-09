'use client'

/**
 * Back-compat shim — Solana wallet context replaced by Robinhood Chain EVM wallet.
 */
export {
  EvmWalletProvider as SolanaWalletProvider,
  useEvmWallet as useSolanaWallet,
  useEvmWallet,
  EvmWalletProvider,
} from '@/lib/wallet/evm-wallet-context'
