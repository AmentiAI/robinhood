'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useWallet } from '@/lib/wallet/compatibility'
import { useWalletClient } from 'wagmi'
import { getExplorerTxUrl } from '@/lib/explorer'

interface RhListing {
  id: string
  mint_address: string
  title?: string
  image_url?: string
  price_eth?: number
  price_sol?: number
  status: string
  created_at: string
  sold_at?: string
  collection_name?: string
  contract_address?: string
  token_id?: string
}

function parseContractToken(mintAddress: string) {
  const parts = mintAddress.split(':')
  if (parts.length >= 2 && parts[0].startsWith('0x')) {
    return { contract: parts[0], tokenId: parts.slice(1).join(':') }
  }
  return null
}

export function ProfileMarketplace() {
  const { isConnected, currentAddress } = useWallet()
  const { data: walletClient } = useWalletClient()
  const activeWalletAddress = useMemo(() => {
    if (currentAddress && isConnected) return currentAddress
    return null
  }, [currentAddress, isConnected])

  const [tab, setTab] = useState<'active' | 'sold'>('active')
  const [listings, setListings] = useState<RhListing[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  useEffect(() => {
    if (activeWalletAddress) loadListings()
    else setLoading(false)
  }, [activeWalletAddress, tab])

  const loadListings = async () => {
    if (!activeWalletAddress) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/marketplace/rh/listings?status=${tab}&seller_wallet=${encodeURIComponent(activeWalletAddress)}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setListings(data.listings || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to load marketplace listings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (listing: RhListing) => {
    if (!activeWalletAddress || !walletClient) {
      toast.error('Connect wallet')
      return
    }
    if (!confirm('Cancel this listing?')) return

    const parsed =
      parseContractToken(listing.mint_address) ||
      (listing.contract_address && listing.token_id
        ? { contract: listing.contract_address, tokenId: listing.token_id }
        : null)
    if (!parsed) {
      toast.error('Invalid listing')
      return
    }

    setCancelingId(listing.id)
    try {
      const response = await fetch('/api/marketplace/rh/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: activeWalletAddress,
          contract_address: parsed.contract,
          token_id: parsed.tokenId,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Cancel failed')

      const txHash = await walletClient.sendTransaction({
        to: data.cancel.to as `0x${string}`,
        data: data.cancel.data as `0x${string}`,
        chain: undefined,
      })

      await fetch('/api/marketplace/rh/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: activeWalletAddress,
          listing_id: listing.id,
          tx_hash: txHash,
        }),
      })

      toast.success(
        <div>
          Cancelled.{' '}
          <a href={getExplorerTxUrl(txHash)} target="_blank" rel="noreferrer" className="underline">
            View tx
          </a>
        </div>
      )
      loadListings()
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || 'Cancel failed')
    } finally {
      setCancelingId(null)
    }
  }

  if (!isConnected || !activeWalletAddress) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#15181a] p-8 text-center text-[#a8aab2]">
        Connect your wallet to manage NFT listings.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-white">My Marketplace</h2>
          <p className="text-sm text-[#a8aab2]">Robinhood Chain NFT listings</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/marketplace/list"
            className="px-4 py-2 rounded-xl bg-[#00C805] text-black text-xs font-black uppercase"
          >
            List NFT
          </Link>
          <Link
            href="/marketplace/my-listings"
            className="px-4 py-2 rounded-xl border border-[#00C805]/40 text-[#00C805] text-xs font-black uppercase"
          >
            All listings
          </Link>
        </div>
      </div>

      <div className="flex gap-2">
        {(['active', 'sold'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase ${
              tab === t ? 'bg-[#00C805] text-black' : 'bg-[#15181a] border border-white/10 text-[#a8aab2]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#a8aab2]">Loading...</div>
      ) : listings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#00C805]/25 bg-[#15181a] py-12 text-center">
          <p className="text-white font-bold mb-2">No {tab} listings</p>
          <Link href="/marketplace/list" className="text-[#00C805] text-sm font-bold uppercase">
            List an NFT →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => {
            const price = Number(l.price_eth ?? l.price_sol ?? 0)
            return (
              <div
                key={l.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-[#15181a] border border-white/10"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0a0c0d] shrink-0">
                  {l.image_url ? (
                    <img src={l.image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#00C805]/40">◆</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/marketplace/nft/${l.id}`}
                    className="font-bold text-white hover:text-[#00C805] truncate block"
                  >
                    {l.title || 'NFT'}
                  </Link>
                  <p className="text-xs text-[#71717A]">
                    {price.toFixed(4)} ETH
                    {l.collection_name ? ` · ${l.collection_name}` : ''}
                  </p>
                </div>
                {tab === 'active' && (
                  <button
                    type="button"
                    onClick={() => handleCancel(l)}
                    disabled={cancelingId === l.id}
                    className="px-3 py-2 text-xs font-bold uppercase text-[#ff5052] border border-[#ff5052]/30 rounded-lg disabled:opacity-50"
                  >
                    {cancelingId === l.id ? '...' : 'Cancel'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
