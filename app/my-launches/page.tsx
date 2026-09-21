'use client'

import { PageHeader } from '@/components/page-header'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useWallet } from '@/lib/wallet/compatibility'

type Collection = {
  id: string
  name: string
  description?: string
  wallet_address?: string
  is_owner?: boolean
  collaborator_role?: string
}

export default function MyLaunchesPage() {
  const { isConnected, currentAddress } = useWallet()
  const { activeWalletAddress, activeWalletConnected } = useMemo(() => {
    if (currentAddress && isConnected)
      return { activeWalletAddress: currentAddress, activeWalletConnected: true }
    return { activeWalletAddress: null, activeWalletConnected: false }
  }, [currentAddress, isConnected])

  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      if (!activeWalletAddress) return
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `/api/collections?wallet_address=${encodeURIComponent(activeWalletAddress)}&is_locked=true`
        )
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || 'Failed to load collections')
        setCollections(Array.isArray(data?.collections) ? data.collections : [])
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load collections')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [activeWalletAddress])

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="My launches"
        subtitle="Collections you own or collaborate on — jump into mint settings"
      />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!activeWalletConnected && (
          <div className="hg-rise max-w-md mx-auto rounded-2xl border border-white/[0.1] bg-[#131318] p-8 text-center">
            <h2 className="text-lg font-semibold text-white mb-2">Connect your wallet</h2>
            <p className="text-sm text-zinc-500">
              You need a connected wallet to see your launches.
            </p>
          </div>
        )}

        {activeWalletConnected && (
          <>
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse rounded-2xl border border-white/[0.1] bg-[#131318] p-5"
                    >
                      <div className="h-5 w-40 bg-white/10 rounded mb-3" />
                      <div className="h-4 w-full bg-white/[0.06] rounded mb-4" />
                      <div className="h-10 w-full bg-white/[0.06] rounded-full" />
                    </div>
                  ))
                : collections.map((c, idx) => (
                    <div
                      key={c.id}
                      className="hg-card hg-rise rounded-2xl border border-white/[0.1] bg-[#131318] p-5 flex flex-col"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      <h3 className="text-base font-bold text-white truncate mb-1">{c.name}</h3>
                      <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
                        {c.description || 'No description'}
                      </p>
                      <span className="mb-4 inline-flex self-start px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0c0c10] text-zinc-300 border border-white/[0.08]">
                        {c.is_owner
                          ? 'Owner'
                          : `Collaborator${c.collaborator_role ? `: ${c.collaborator_role}` : ''}`}
                      </span>
                      <div className="mt-auto flex flex-col gap-2">
                        <Link
                          href={`/collections/${c.id}/launch`}
                          className="hg-btn-glow inline-flex h-10 items-center justify-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
                        >
                          Edit mint settings
                        </Link>
                        <Link
                          href={`/${c.id}`}
                          className="inline-flex h-10 items-center justify-center rounded-full border border-white/15 text-sm font-semibold text-zinc-200 hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-all"
                        >
                          View mint page
                        </Link>
                      </div>
                    </div>
                  ))}
            </div>

            {!loading && collections.length === 0 && (
              <div className="mt-2 rounded-2xl border border-white/[0.1] bg-[#131318] p-8 text-center">
                <h2 className="text-lg font-semibold text-white mb-2">No collections found</h2>
                <p className="text-sm text-zinc-500 mb-5">
                  Create a collection, or accept a collaboration invite to see it here.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link
                    href="/collections/create"
                    className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
                  >
                    Create collection
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-flex h-10 px-5 items-center rounded-full border border-white/15 text-sm font-semibold text-zinc-200 hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-all"
                  >
                    View profile
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
