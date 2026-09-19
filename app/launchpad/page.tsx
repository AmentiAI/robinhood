'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet/compatibility'
import { LaunchpadSearchBar } from './components/LaunchpadSearchBar'
import { LaunchpadHero } from './components/LaunchpadHero'
import { FeaturedCollectionsGrid } from './components/FeaturedCollectionsGrid'
import { Rocket, Plus, X, Image as ImageIcon, ChevronRight } from 'lucide-react'

interface LaunchpadCollection {
  id: string
  name: string
  description: string
  image_url: string
  total_supply: number
  minted_count: number
  mint_price: number
  is_live: boolean
  start_time?: string
  end_time?: string
  created_at: string
}

interface UserCollection {
  id: string
  name: string
  description?: string
  collection_status?: string
  is_locked?: boolean
  total_ordinals?: number
  banner_image_url?: string
  mobile_image_url?: string
}

export default function LaunchpadPage() {
  const [collections, setCollections] = useState<LaunchpadCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'live' | 'upcoming'>('all')
  const [showLaunchModal, setShowLaunchModal] = useState(false)
  const [userCollections, setUserCollections] = useState<UserCollection[]>([])
  const [loadingUserCollections, setLoadingUserCollections] = useState(false)
  const { isConnected, currentAddress } = useWallet()
  const router = useRouter()
  const gridRef = useRef<HTMLDivElement>(null)

  const filteredCollections = useMemo(() => {
    return collections.filter((collection) => {
      const matchesSearch =
        collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (collection.description &&
          collection.description.toLowerCase().includes(searchTerm.toLowerCase()))

      if (!matchesSearch) return false
      if (filterStatus === 'all') return true

      const now = new Date()
      const startTime = collection.start_time ? new Date(collection.start_time) : null
      const endTime = collection.end_time ? new Date(collection.end_time) : null

      if (filterStatus === 'live') {
        return (
          collection.is_live ||
          (startTime && startTime <= now && (!endTime || endTime > now))
        )
      }

      if (filterStatus === 'upcoming') {
        return startTime && startTime > now
      }

      return true
    })
  }, [collections, searchTerm, filterStatus])

  const featuredCollections = useMemo(() => {
    return filteredCollections.filter((c) => {
      const isSoldOut = c.total_supply > 0 && c.minted_count >= c.total_supply
      const now = new Date()
      const endTime = c.end_time ? new Date(c.end_time) : null
      const hasEnded = endTime && endTime < now
      return !isSoldOut && !hasEnded
    })
  }, [filteredCollections])

  useEffect(() => {
    loadCollections()
  }, [])

  const loadUserCollections = useCallback(async () => {
    if (!currentAddress) return
    setLoadingUserCollections(true)
    try {
      const res = await fetch(
        `/api/collections?wallet_address=${encodeURIComponent(currentAddress)}`
      )
      if (res.ok) {
        const data = await res.json()
        const all = [
          ...(data.owned_collections || []),
          ...(data.collaborator_collections || []),
        ]
        setUserCollections(all)
      }
    } catch (err) {
      console.error('Error loading user collections:', err)
    } finally {
      setLoadingUserCollections(false)
    }
  }, [currentAddress])

  const handleOpenLaunchModal = () => {
    if (!isConnected) return
    setShowLaunchModal(true)
    loadUserCollections()
  }

  const loadCollections = async () => {
    try {
      const response = await fetch('/api/launchpad')
      if (response.ok) {
        const data = await response.json()
        const allCollections = [...(data.active || []), ...(data.upcoming || [])].map(
          (col: any) => ({
            id: col.id,
            name: col.name,
            description: col.description,
            image_url: col.banner_image_url || col.mobile_image_url || '/placeholder.png',
            total_supply: col.total_supply || 0,
            minted_count: col.minted_count || 0,
            mint_price:
              col.phases?.[0]?.mint_price_lamports ?? col.phases?.[0]?.mint_price_sats
                ? (
                    (col.phases[0].mint_price_lamports ?? col.phases[0].mint_price_sats) /
                    1_000_000_000
                  ).toFixed(4)
                : '0',
            is_live: col.launch_status === 'active',
            start_time: col.phases?.[0]?.start_time,
            end_time: col.phases?.[col.phases.length - 1]?.end_time,
            created_at: col.created_at,
          })
        )
        setCollections(allCollections)
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 border-4 border-[#2DE2FF]/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-[#2DE2FF] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-white text-sm font-bold uppercase tracking-wide">
            Loading Launchpad...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative bg-transparent min-h-full">
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-[1400px] mx-auto">
        <LaunchpadHero onExplore={scrollToGrid} />

        <LaunchpadSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />

        <div ref={gridRef}>
          {featuredCollections.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-[#2DE2FF]/20 bg-[#15181a] relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45, 226, 255,0.12),transparent_55%)]" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-md bg-[#2DE2FF] text-black text-xs font-black uppercase tracking-wider">
                  Robinhood Chain
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                  No live mints yet
                </h2>
                <p className="text-[#a8aab2] max-w-md mx-auto mb-7 text-sm">
                  This launchpad is fresh. Deploy a collection and go live on Robinhood Chain.
                </p>
                {isConnected ? (
                  <button
                    type="button"
                    onClick={handleOpenLaunchModal}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2DE2FF] hover:bg-[#FF2BD6] text-black font-black uppercase tracking-wide transition-colors"
                  >
                    <Rocket className="h-4 w-4" />
                    Launch collection
                  </button>
                ) : (
                  <p className="text-xs text-[#71717A] uppercase tracking-wider">
                    Connect wallet to launch
                  </p>
                )}
              </div>
            </div>
          ) : (
            <FeaturedCollectionsGrid collections={featuredCollections} />
          )}
        </div>
      </div>

      {showLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowLaunchModal(false)}
          />
          <div className="relative w-full max-w-lg bg-[#15181a] border border-[#2DE2FF]/40 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0a0c0d] border border-[#2DE2FF]/40">
                  <Rocket className="h-5 w-5 text-[#2DE2FF]" />
                </div>
                <h2 className="text-xl font-bold text-white uppercase tracking-wide">
                  Launch Collection
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLaunchModal(false)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-[#808080] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <p className="text-[#808080] text-sm mb-4">
                Select a collection to set up its launchpad. You&apos;ll configure mint phases,
                pricing, and whitelists.
              </p>

              {loadingUserCollections ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-10 h-10 border-3 border-[#2DE2FF] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : userCollections.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white font-semibold mb-2">No collections found</p>
                  <p className="text-[#808080] text-sm mb-6">
                    Create a collection first, then come back to launch it.
                  </p>
                  <Link
                    href="/collections/create"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0a0c0d] border border-[#2DE2FF] hover:bg-[#2DE2FF] hover:text-black text-white font-bold transition-all uppercase tracking-wide"
                  >
                    <Plus className="h-4 w-4" />
                    Create Collection
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {userCollections.map((col) => {
                    const isAlreadyLive = col.collection_status === 'launchpad_live'
                    const isLaunchpadReady = col.collection_status === 'launchpad'
                    const statusLabel = isAlreadyLive
                      ? 'Live'
                      : isLaunchpadReady
                        ? 'Ready'
                        : col.collection_status === 'marketplace'
                          ? 'Marketplace'
                          : 'Draft'
                    const statusColor = isAlreadyLive || isLaunchpadReady
                      ? 'text-[#2DE2FF]'
                      : 'text-[#808080]'

                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          setShowLaunchModal(false)
                          router.push(`/collections/${col.id}/launch`)
                        }}
                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 hover:border-[#2DE2FF] bg-[#0a0c0d] hover:bg-[#15181a] transition-all text-left group"
                      >
                        <div className="w-14 h-14 overflow-hidden rounded-lg border border-white/10 bg-[#0a0c0d] flex-shrink-0">
                          {col.banner_image_url || col.mobile_image_url ? (
                            <img
                              src={col.banner_image_url || col.mobile_image_url}
                              alt={col.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-6 w-6 text-[#808080]/50" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold truncate">{col.name}</p>
                          <span className={`text-xs font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-[#808080] group-hover:text-[#2DE2FF] transition-colors flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
