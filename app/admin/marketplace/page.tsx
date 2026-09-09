'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@/lib/wallet/compatibility'
import { useAdminCheck } from '@/lib/auth/use-admin-check'
import { RefreshCw, ExternalLink } from 'lucide-react'

interface Listing {
  id: string
  mint_address: string
  title: string
  price_sol: number
  price_lamports: number
  seller_wallet: string
  image_url: string | null
  status: string
  created_at: string
}

export default function MarketplaceAdminPage() {
  const { currentAddress } = useWallet()
  const { isAdmin: authorized, loading: adminLoading } = useAdminCheck(currentAddress || null)
  const [listings, setListings] = useState<Listing[]>([])
  const [status, setStatus] = useState('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const explorer =
    process.env.NEXT_PUBLIC_RH_NETWORK === 'mainnet'
      ? 'https://robinhoodchain.blockscout.com'
      : 'https://explorer.testnet.chain.robinhood.com'

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/marketplace/rh/listings?status=${encodeURIComponent(status)}`)
      if (!res.ok) throw new Error('Failed to load listings')
      const data = await res.json()
      setListings(data.listings || [])
    } catch (e: any) {
      setError(e.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authorized) load()
  }, [authorized, status])

  if (adminLoading) {
    return <div className="p-8 text-[#a8aab2]">Checking access...</div>
  }

  if (!authorized) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
        <p className="text-[#a8aab2]">Admin wallet required.</p>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#00C805] mb-2">
            Robinhood Chain
          </p>
          <h1 className="text-3xl font-black text-white">NFT Marketplace</h1>
          <p className="text-[#a8aab2] text-sm mt-1">
            Active escrow listings priced in ETH (legacy BTC marketplace removed)
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#15181a] border border-[#00C805]/30 text-white text-sm font-bold"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2">
        {['active', 'pending', 'sold', 'cancelled'].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
              status === s
                ? 'bg-[#00C805] text-black'
                : 'bg-[#15181a] border border-white/10 text-[#a8aab2]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-[#ff5052]/40 bg-[#ff5052]/10 p-4 text-[#ff5052] text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-[#a8aab2]">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#00C805]/25 bg-[#15181a] py-16 text-center text-[#a8aab2]">
          No {status} listings
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[#15181a] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-[#71717A]">
                <th className="px-4 py-3">NFT</th>
                <th className="px-4 py-3">Seller</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Token</th>
                <th className="px-4 py-3">Listed</th>
                <th className="px-4 py-3">Open</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b border-white/5 text-white">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {l.image_url ? (
                        <img src={l.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-[#0a0c0d] border border-white/10" />
                      )}
                      <span className="font-bold">{l.title || 'Untitled'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#a8aab2]">
                    {l.seller_wallet?.slice(0, 6)}…{l.seller_wallet?.slice(-4)}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#00C805]">
                    {Number(l.price_sol || 0).toFixed(4)} ETH
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <a
                      href={`${explorer}/address/${(l.mint_address || '').split(':')[0]}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#a8aab2] hover:text-[#00C805] inline-flex items-center gap-1"
                    >
                      {(l.mint_address || '').slice(0, 10)}… <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[#a8aab2] text-xs">
                    {l.created_at ? new Date(l.created_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/marketplace/nft/${encodeURIComponent(l.mint_address)}`}
                      className="text-[#00C805] hover:underline text-xs font-bold uppercase"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
