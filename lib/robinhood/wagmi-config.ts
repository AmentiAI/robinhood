'use client'

import { http, createConfig } from 'wagmi'
import { injected } from '@wagmi/core'
import {
  ROBINHOOD_MAINNET,
  ROBINHOOD_TESTNET,
  getRobinhoodNetwork,
  getRobinhoodRpcUrl,
} from '@/lib/robinhood/config'

/**
 * Only use `injected` from `@wagmi/core`.
 * Do NOT import from `wagmi/connectors` — that barrel pulls in Coinbase Base Account
 * (`@base-org/account` → missing `@x402/evm/upto/client`) and breaks Next.js builds.
 * Injected covers MetaMask, Robinhood Wallet, and other browser wallets via window.ethereum.
 */
export function createWagmiConfig() {
  const network = getRobinhoodNetwork()
  const chain = network === 'mainnet' ? ROBINHOOD_MAINNET : ROBINHOOD_TESTNET
  const rpcUrl = getRobinhoodRpcUrl()

  return createConfig({
    chains: [chain as any],
    connectors: [
      injected({
        shimDisconnect: true,
        unstable_shimAsyncInject: 2_000,
      }),
    ],
    transports: {
      [chain.id]: http(rpcUrl),
    },
    ssr: true,
  })
}
