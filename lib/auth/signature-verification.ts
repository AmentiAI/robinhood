/**
 * Server-side signature verification for EVM (EIP-191) wallet authentication
 */

import { verifyMessage, type Hex, type Address } from 'viem'

const signatureCache = new Map<string, number>()
const SIGNATURE_CACHE_TTL = 5 * 60 * 1000
const SIGNATURE_EXPIRY = 5 * 60 * 1000

interface SignatureVerificationResult {
  isValid: boolean
  walletAddress: string | null
  error?: string
}

async function verifyEvmSignature(
  message: string,
  signature: string,
  address: string
): Promise<boolean> {
  try {
    const messagePattern = /^Verify wallet ownership for (.+) at (\d+)$/
    const match = message.match(messagePattern)

    if (!match) {
      console.error('[verifyEvmSignature] Invalid message format:', message)
      return false
    }

    const messageAddress = match[1]
    const timestamp = parseInt(match[2])

    if (messageAddress.toLowerCase() !== address.toLowerCase()) {
      console.error('Address mismatch in message')
      return false
    }

    const now = Date.now()
    if (Math.abs(now - timestamp) > SIGNATURE_EXPIRY) {
      console.error('Message timestamp expired')
      return false
    }

    const valid = await verifyMessage({
      address: address as Address,
      message,
      signature: signature as Hex,
    })

    return valid
  } catch (error) {
    console.error('Error verifying EVM signature:', error)
    return false
  }
}

function isSignatureReplay(signature: string): boolean {
  const cached = signatureCache.get(signature)
  if (!cached) return false

  const now = Date.now()
  if (now - cached > SIGNATURE_CACHE_TTL) {
    signatureCache.delete(signature)
    return false
  }

  return true
}

function markSignatureUsed(signature: string): void {
  signatureCache.set(signature, Date.now())

  if (signatureCache.size > 1000) {
    const now = Date.now()
    for (const [sig, timestamp] of signatureCache.entries()) {
      if (now - timestamp > SIGNATURE_CACHE_TTL) {
        signatureCache.delete(sig)
      }
    }
  }
}

export async function verifyWalletSignature(
  walletAddress: string | null | undefined,
  signature: string | null | undefined,
  message: string | null | undefined,
  timestamp: number | null | undefined
): Promise<SignatureVerificationResult> {
  if (!walletAddress || !signature || !message || !timestamp) {
    return { isValid: false, walletAddress: null, error: 'Missing required authentication parameters' }
  }

  if (isSignatureReplay(signature)) {
    return { isValid: false, walletAddress: null, error: 'Signature already used (replay attack detected)' }
  }

  const now = Date.now()
  if (Math.abs(now - timestamp) > SIGNATURE_EXPIRY) {
    return { isValid: false, walletAddress: null, error: 'Signature expired' }
  }

  const isValid = await verifyEvmSignature(message, signature, walletAddress)

  if (!isValid) {
    return { isValid: false, walletAddress: null, error: 'Invalid signature' }
  }

  markSignatureUsed(signature)

  return { isValid: true, walletAddress: walletAddress.trim() }
}

export function extractAuthFromRequest(body: any, searchParams?: URLSearchParams): {
  walletAddress: string | null
  signature: string | null
  message: string | null
  timestamp: number | null
} {
  const walletAddress = body?.wallet_address || searchParams?.get('wallet_address') || null
  const signature = body?.signature || searchParams?.get('signature') || null
  const message = body?.message || searchParams?.get('message') || null
  const timestamp = body?.timestamp ? parseInt(String(body.timestamp)) :
    searchParams?.get('timestamp') ? parseInt(String(searchParams.get('timestamp'))) : null

  return {
    walletAddress: walletAddress ? String(walletAddress).trim() : null,
    signature: signature ? String(signature).trim() : null,
    message: message ? String(message).trim() : null,
    timestamp
  }
}

export async function requireWalletAuth(
  request: Request,
  requireSignature: boolean = true
): Promise<SignatureVerificationResult> {
  try {
    let body: any = {}
    let searchParams: URLSearchParams | undefined
    let method = 'GET'

    if (request instanceof Request) {
      method = request.method

      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        try {
          const clonedRequest = request.clone()
          body = await clonedRequest.json()
        } catch {
          // Body might not be JSON
        }
      }

      const url = new URL(request.url)
      searchParams = url.searchParams
    }

    const { walletAddress, signature, message, timestamp } = extractAuthFromRequest(body, searchParams)

    if (!walletAddress) {
      return { isValid: false, walletAddress: null, error: 'Wallet address required' }
    }

    const isWriteOperation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const mustVerifySignature = requireSignature || isWriteOperation

    if (mustVerifySignature && !signature) {
      return { isValid: false, walletAddress: null, error: 'Signature required for this operation.' }
    }

    if (signature) {
      return await verifyWalletSignature(walletAddress, signature, message, timestamp)
    }

    if (!isWriteOperation && !requireSignature) {
      return { isValid: true, walletAddress: walletAddress.trim() }
    }

    return { isValid: false, walletAddress: null, error: 'Signature required' }
  } catch (error) {
    console.error('Error in requireWalletAuth:', error)
    return { isValid: false, walletAddress: null, error: 'Authentication error' }
  }
}
