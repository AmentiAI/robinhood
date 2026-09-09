'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useEvmWallet } from '@/lib/wallet/evm-wallet-context'
import { useWalletClient } from 'wagmi'
import { toast } from 'sonner'
import Link from 'next/link'
import { getExplorerTxUrl } from '@/lib/explorer'

interface NftListing {
  id: string
  mint_address: string
  seller_wallet: string
  price_lamports: number | string
  price_sol: number
  price_eth?: number
  title: string
  description?: string
  image_url: string
  metadata?: any
  status: string
  created_at: string
}

function parseContractToken(mintAddress: string): { contract: string; tokenId: string } | null {
  const parts = mintAddress.split(':')
  if (parts.length >= 2 && parts[0].startsWith('0x')) {
    return { contract: parts[0], tokenId: parts.slice(1).join(':') }
  }
  return null
}

export default function NftDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isConnected, address } = useEvmWallet()
  const { data: walletClient } = useWalletClient()

  const listingId = params.mintAddress as string
  const [listing, setListing] = useState<NftListing | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [canceling, setCanceling] = useState(false)

  useEffect(() => {
    loadListing()
  }, [listingId])

  const loadListing = async () => {
    setLoading(true)
    try {
      // Try active first, then any status for seller views of pending
      const response = await fetch(`/api/marketplace/rh/listings?status=active`)
      const data = await response.json()
      if (response.ok) {
        let found = (data.listings || []).find(
          (l: any) => l.id === listingId || l.mint_address === listingId
        )
        if (!found) {
          const pendingRes = await fetch(`/api/marketplace/rh/listings?status=pending`)
          const pendingData = await pendingRes.json()
          found = (pendingData.listings || []).find(
            (l: any) => l.id === listingId || l.mint_address === listingId
          )
        }
        if (found) setListing(found)
        else {
          toast.error('Listing not found')
          router.push('/marketplace')
        }
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  const priceEth = listing ? Number(listing.price_eth ?? listing.price_sol ?? 0) : 0
  const platformFee = priceEth * 0.02
  const isOwner =
    !!address && !!listing && listing.seller_wallet.toLowerCase() === address.toLowerCase()

  const handlePurchase = async () => {
    if (!listing || !address || !walletClient) {
      toast.error('Connect your wallet')
      return
    }
    if (isOwner) {
      toast.error('You cannot buy your own listing')
      return
    }
    if (listing.status !== 'active') {
      toast.error('Listing is not active')
      return
    }

    const parsed = parseContractToken(listing.mint_address)
    if (!parsed) {
      toast.error('Invalid listing token')
      return
    }

    setPurchasing(true)
    try {
      const response = await fetch('/api/marketplace/rh/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          contract_address: parsed.contract,
          token_id: parsed.tokenId,
          price_eth: priceEth,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to build purchase')

      const txHash = await walletClient.sendTransaction({
        to: data.buy.to as `0x${string}`,
        data: data.buy.data as `0x${string}`,
        value: BigInt(data.buy.value),
        chain: undefined,
      })

      await fetch('/api/marketplace/rh/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          listing_id: listing.id,
          tx_hash: txHash,
        }),
      })

      toast.success(
        <div>
          <p>NFT purchased!</p>
          <a href={getExplorerTxUrl(txHash)} target="_blank" rel="noreferrer" className="underline">
            View transaction
          </a>
        </div>,
        { duration: 8000 }
      )
      setTimeout(() => router.push('/marketplace'), 1500)
    } catch (error: any) {
      toast.error(error?.shortMessage || error?.message || 'Purchase failed')
    } finally {
      setPurchasing(false)
    }
  }

  const handleCancel = async () => {
    if (!listing || !address || !walletClient) {
      toast.error('Connect your wallet')
      return
    }
    if (!isOwner) {
      toast.error('Only the seller can cancel')
      return
    }

    const parsed = parseContractToken(listing.mint_address)
    if (!parsed) {
      toast.error('Invalid listing token')
      return
    }

    setCanceling(true)
    try {
      const response = await fetch('/api/marketplace/rh/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          contract_address: parsed.contract,
          token_id: parsed.tokenId,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to cancel')

      const txHash = await walletClient.sendTransaction({
        to: data.cancel.to as `0x${string}`,
        data: data.cancel.data as `0x${string}`,
        chain: undefined,
      })

      await fetch('/api/marketplace/rh/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          listing_id: listing.id,
          tx_hash: txHash,
        }),
      })

      toast.success('Listing cancelled')
      setTimeout(() => router.push('/marketplace'), 1500)
    } catch (error: any) {
      toast.error(error?.shortMessage || error?.message || 'Cancel failed')
    } finally {
      setCanceling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050607]">
        <div className="w-12 h-12 border-4 border-[#00C805] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!listing) return null

  const attributes = listing.metadata?.attributes || []

  return (
    <div className="min-h-screen py-12 bg-[#050607]">
      <div className="max-w-7xl mx-auto px-4">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-[#a8aab2] hover:text-[#00C805] mb-8 text-sm font-bold uppercase tracking-wider"
        >
          ← Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="rounded-2xl border border-[#00C805]/25 overflow-hidden aspect-square bg-[#15181a]">
              {listing.image_url ? (
                <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl text-[#00C805]/30">◆</div>
              )}
            </div>
            {attributes.length > 0 && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-[#15181a] p-6">
                <h3 className="text-lg font-black text-white mb-4 uppercase tracking-wider">Attributes</h3>
                <div className="grid grid-cols-2 gap-3">
                  {attributes.map((attr: any, index: number) => (
                    <div key={index} className="rounded-xl border border-white/10 p-3">
                      <p className="text-[10px] text-[#71717A] uppercase mb-1">{attr.trait_type}</p>
                      <p className="text-sm font-bold text-white">{attr.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00C805] mb-2">
                {listing.status}
              </p>
              <h1 className="text-4xl font-black text-white mb-3">{listing.title || 'NFT'}</h1>
              {listing.description && <p className="text-[#a8aab2]">{listing.description}</p>}
            </div>

            <div className="rounded-2xl border border-[#00C805]/30 bg-[#15181a] p-8">
              <p className="text-sm text-[#71717A] mb-2 uppercase tracking-wider font-bold">Current Price</p>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-5xl font-black text-[#00C805]">{priceEth.toFixed(4)}</span>
                <span className="text-2xl font-bold text-[#a8aab2]">ETH</span>
              </div>

              <div className="mb-6 pb-6 border-b border-white/10">
                <p className="text-sm text-[#71717A] mb-2">Seller</p>
                <code className="text-sm font-mono text-white">
                  {listing.seller_wallet.slice(0, 6)}...{listing.seller_wallet.slice(-4)}
                </code>
              </div>

              {!isOwner && listing.status === 'active' && (
                <div className="mb-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#a8aab2]">Price</span>
                    <span className="text-white font-bold">{priceEth.toFixed(4)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#a8aab2]">Platform fee (from sale)</span>
                    <span className="text-white font-bold">~{platformFee.toFixed(4)} ETH</span>
                  </div>
                </div>
              )}

              {!isConnected ? (
                <p className="text-center text-[#a8aab2]">Connect your wallet to purchase</p>
              ) : isOwner ? (
                listing.status === 'active' ? (
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={canceling}
                    className="w-full px-8 py-4 rounded-xl bg-[#0a0c0d] border border-[#00C805] text-white font-black uppercase tracking-wide disabled:opacity-50"
                  >
                    {canceling ? 'Canceling...' : 'Cancel Listing'}
                  </button>
                ) : (
                  <p className="text-center text-[#CCFF00] text-sm font-bold uppercase">
                    Listing {listing.status}
                  </p>
                )
              ) : listing.status === 'active' ? (
                <button
                  type="button"
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full px-8 py-4 rounded-xl bg-[#00C805] hover:bg-[#CCFF00] text-black font-black uppercase tracking-wide disabled:opacity-50"
                >
                  {purchasing ? 'Purchasing...' : `Buy for ${priceEth.toFixed(4)} ETH`}
                </button>
              ) : (
                <p className="text-center text-[#a8aab2]">Not available for purchase</p>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#15181a] p-6">
              <h3 className="text-sm font-black text-white mb-2 uppercase tracking-wider">Token</h3>
              <code className="text-xs text-[#a8aab2] break-all">{listing.mint_address}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
