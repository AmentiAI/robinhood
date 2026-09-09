/**
 * Client-side utility to generate authentication signatures for API requests
 * Robinhood Chain / EVM: EIP-191 personal_sign
 */

import type { Hex } from 'viem'

/**
 * Generate authentication parameters for API requests
 * Creates a signed message proving wallet ownership using an EVM wallet
 */
export async function generateApiAuth(
  walletAddress: string | null,
  signMessage:
    | ((message: string | Uint8Array) => Promise<Hex | string | Uint8Array>)
    | null
    | undefined
): Promise<{
  wallet_address: string
  signature: string
  message: string
  timestamp: number
} | null> {
  if (!walletAddress || !signMessage) {
    console.error('[generateApiAuth] Missing walletAddress or signMessage function')
    return null
  }

  try {
    const timestamp = Date.now()
    const message = `Verify wallet ownership for ${walletAddress} at ${timestamp}`

    const signatureResult = await signMessage(message)

    if (!signatureResult) {
      console.error('[generateApiAuth] No signature returned from wallet')
      return null
    }

    let signature: string
    if (typeof signatureResult === 'string') {
      signature = signatureResult
    } else if (signatureResult instanceof Uint8Array) {
      signature = `0x${Buffer.from(signatureResult).toString('hex')}`
    } else {
      console.error('[generateApiAuth] Unexpected signature format:', signatureResult)
      return null
    }

    return {
      wallet_address: walletAddress,
      signature,
      message,
      timestamp,
    }
  } catch (error: any) {
    const isUserRejection =
      error?.code === 4001 ||
      error?.message?.toLowerCase().includes('user rejected') ||
      error?.message?.toLowerCase().includes('cancel')

    if (!isUserRejection) {
      console.error('[generateApiAuth] Error generating API auth:', error)
    }
    return null
  }
}

/**
 * Add authentication to fetch request body
 */
export async function addAuthToBody(
  body: any,
  walletAddress: string | null,
  signMessage:
    | ((message: string | Uint8Array) => Promise<Hex | string | Uint8Array>)
    | null
    | undefined
): Promise<any> {
  const auth = await generateApiAuth(walletAddress, signMessage)
  if (!auth) {
    return body
  }

  return {
    ...body,
    ...auth,
  }
}
