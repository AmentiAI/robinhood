/**
 * Re-export from solana shim path — single source in robinhood/platform-wallet + solana shim.
 */
export {
  getPlatformWalletAddress,
  PLATFORM_FEES,
} from '@/lib/solana/platform-wallet'

export { getPlatformFeeWei } from '@/lib/robinhood/config'
