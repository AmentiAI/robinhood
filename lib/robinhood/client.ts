import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
  type Address,
  parseEther,
  formatEther,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { getRobinhoodChain, getRobinhoodRpcUrl, getPlatformFeeWei } from './config'

export function getPublicClient() {
  const chain = getRobinhoodChain()
  return createPublicClient({
    chain: {
      ...chain,
      id: chain.id,
    },
    transport: http(getRobinhoodRpcUrl()),
  })
}

export function getPlatformAccount() {
  const key = process.env.RH_PLATFORM_PRIVATE_KEY
  if (!key) throw new Error('RH_PLATFORM_PRIVATE_KEY is not configured')
  const normalized = key.startsWith('0x') ? (key as Hex) : (`0x${key}` as Hex)
  return privateKeyToAccount(normalized)
}

export function getMintSignerAccount() {
  const key = process.env.RH_MINT_SIGNER_PRIVATE_KEY || process.env.RH_PLATFORM_PRIVATE_KEY
  if (!key) throw new Error('RH_MINT_SIGNER_PRIVATE_KEY is not configured')
  const normalized = key.startsWith('0x') ? (key as Hex) : (`0x${key}` as Hex)
  return privateKeyToAccount(normalized)
}

export function getPlatformWalletClient() {
  const account = getPlatformAccount()
  const chain = getRobinhoodChain()
  return createWalletClient({
    account,
    chain: { ...chain, id: chain.id },
    transport: http(getRobinhoodRpcUrl()),
  })
}

export async function getEthBalance(address: Address): Promise<number> {
  const client = getPublicClient()
  const wei = await client.getBalance({ address })
  return Number(formatEther(wei))
}

export function ethToWei(eth: number | string): bigint {
  return parseEther(String(eth))
}

export function weiToEth(wei: bigint): string {
  return formatEther(wei)
}

export { getPlatformFeeWei }
