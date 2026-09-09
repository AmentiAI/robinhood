/**
 * Block explorer helpers for Robinhood Chain
 */
import {
  explorerTxUrl,
  explorerAddressUrl,
  explorerTokenUrl,
  getRobinhoodChain,
} from '@/lib/robinhood/config'

export function getExplorerTxUrl(txHash: string): string {
  return explorerTxUrl(txHash)
}

export function getExplorerAddressUrl(address: string): string {
  return explorerAddressUrl(address)
}

export function getExplorerTokenUrl(contract: string, tokenId: string | number): string {
  return explorerTokenUrl(contract, tokenId)
}

/** @deprecated Use getExplorerTxUrl */
export function getSolscanUrl(txOrAddress: string, type: 'tx' | 'account' | 'token' = 'tx'): string {
  if (type === 'account' || type === 'token') return explorerAddressUrl(txOrAddress)
  return explorerTxUrl(txOrAddress)
}

export function getExplorerName(): string {
  return getRobinhoodChain().blockExplorers.default.name
}

/** No-op kept for callers that used Solscan network preload */
export function preloadSolscanNetwork(): void {
  // Robinhood explorer URLs are static from env — nothing to preload
}
