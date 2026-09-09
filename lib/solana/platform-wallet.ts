/**
 * Platform wallet helpers — Robinhood Chain live path
 * (keeps Solana-era function names for import compatibility)
 */

import { getPlatformFeeWei, getPlatformWallet } from '@/lib/robinhood/config'
import { getEthBalance } from '@/lib/robinhood/client'

export function getPlatformWalletAddress(): string | null {
  try {
    return getPlatformWallet()
  } catch {
    return process.env.RH_PLATFORM_WALLET || process.env.SOLANA_PLATFORM_WALLET || null
  }
}

export function getPlatformFeeSol(): number {
  return Number(process.env.NEXT_PUBLIC_RH_PLATFORM_FEE_ETH || process.env.NEXT_PUBLIC_SOLANA_PLATFORM_FEE_SOL || '0.001')
}

export function getPlatformFeeDestination(): string | null {
  return getPlatformWalletAddress()
}

export function calculatePlatformMintFee(_quantity = 1): number {
  return getPlatformFeeSol() * _quantity
}

export async function getPlatformWalletBalance(): Promise<number> {
  const addr = getPlatformWalletAddress()
  if (!addr || !addr.startsWith('0x')) return 0
  try {
    return await getEthBalance(addr as `0x${string}`)
  } catch {
    return 0
  }
}

export async function verifyPlatformWallet(): Promise<{
  configured: boolean
  address: string | null
  balance: number
  error?: string
}> {
  const address = getPlatformWalletAddress()
  if (!address) {
    return { configured: false, address: null, balance: 0, error: 'RH_PLATFORM_WALLET not set' }
  }
  try {
    const balance = await getPlatformWalletBalance()
    return { configured: true, address, balance }
  } catch (e: any) {
    return { configured: true, address, balance: 0, error: e?.message || 'balance check failed' }
  }
}

export function getPlatformFeeLamports(): number {
  // Compatibility: return fee in "atomic" units (wei truncated to number-safe range for legacy callers)
  const eth = getPlatformFeeSol()
  return Math.floor(eth * 1e9) // was lamports; now nano-ETH style for display math
}

export const PLATFORM_FEES = {
  get MINT_FEE_WEI() {
    return getPlatformFeeWei()
  },
  get MINT_FEE_ETH() {
    return getPlatformFeeSol()
  },
  get MINT_FEE_SOL() {
    return getPlatformFeeSol()
  },
  get MINT_FEE_LAMPORTS() {
    return getPlatformFeeLamports()
  },
}
