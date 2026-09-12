'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { useEvmWallet } from '@/lib/wallet/evm-wallet-context'
import { useWalletClient } from 'wagmi'
import { toast } from 'sonner'
import { getExplorerTxUrl } from '@/lib/explorer'

interface Listing {
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

export default function MyListingsPage() {
  const router = useRouter()
  const { isConnected, address } = useEvmWallet()
  const { data: walletClient } = useWalletClient()
  const [tab, setTab] = useState<'active' | 'sold' | 'cancelled'>('active')
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !address) {
      toast.error('Connect wallet to view your listings')
      router.push('/marketplace')
      return
    }
    load()
  }, [isConnected, address, tab])

  const load = async () => {
    if (!address) return
    setLoading(true)
    try {
      const res = await fetch(
        `/api/marketplace/rh/listings?status=${tab}&seller_wallet=${encodeURIComponent(address)}`
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setListings(data.listings || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load listings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (listing: Listing) => {
    if (!address || !walletClient) return
    if (!confirm('Cancel this listing? The NFT will return to your wallet.')) return

    const parsed =
      parseContractToken(listing.mint_address) ||
      (listing.contract_address && listing.token_id
        ? { contract: listing.contract_address, tokenId: listing.token_id }
        : null)
    if (!parsed) {
      toast.error('Invalid listing token')
      return
    }

    setCancelingId(listing.id)
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
          wallet_address: address,
          listing_id: listing.id,
          tx_hash: txHash,
        }),
      })

      toast.success(
        <div>
          Listing cancelled.{' '}
          <a href={getExplorerTxUrl(txHash)} target="_blank" rel="noreferrer" className="underline">
            View tx
          </a>
        </div>
      )
      load()
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || 'Cancel failed')
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#050607]">
      <PageHeader
        title="My Listings"
        subtitle="Manage your Robinhood Chain NFT listings"
        action={
          <div className="flex gap-2">
            <Link
              href="/marketplace/list"
              className="px-4 py-2 rounded-xl bg-[#00C805] text-black text-sm font-black uppercase"
            >
              List NFT
            </Link>
            <Link
              href="/marketplace"
              className="px-4 py-2 rounded-xl border border-white/10 text-sm text-[#a8aab2] hover:text-white"
            >
              Browse
            </Link>
          </div>
        }
      />

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex gap-2">
          {(['active', 'sold', 'cancelled'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                tab === t
                  ? 'bg-[#00C805] text-black'
                  : 'bg-[#15181a] border border-white/10 text-[#a8aab2]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 text-center text-[#a8aab2]">Loading...</div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#00C805]/25 bg-[#15181a] py-16 text-center">
            <p className="text-white font-bold mb-2">No {tab} listings</p>
            {tab === 'active' && (
              <Link href="/marketplace/list" className="text-[#00C805] font-bold text-sm uppercase">
                List an NFT →
              </Link>
            )}
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
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#0a0c0d] shrink-0">
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
                    <p className="text-xs text-[#71717A] mt-0.5">
                      {l.collection_name || 'Collection'} · {price.toFixed(4)} ETH
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/marketplace/nft/${l.id}`}
                      className="px-3 py-2 rounded-lg text-xs font-bold uppercase text-[#a8aab2] border border-white/10 hover:border-[#00C805]/40"
                    >
                      View
                    </Link>
                    {tab === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleCancel(l)}
                        disabled={cancelingId === l.id}
                        className="px-3 py-2 rounded-lg text-xs font-bold uppercase text-[#ff5052] border border-[#ff5052]/30 hover:bg-[#ff5052]/10 disabled:opacity-50"
                      >
                        {cancelingId === l.id ? '...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
