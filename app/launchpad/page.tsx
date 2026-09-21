'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useWallet } from '@/lib/wallet/compatibility'
import { LaunchpadSearchBar } from './components/LaunchpadSearchBar'
import { LaunchpadHero } from './components/LaunchpadHero'
import { FeaturedCollectionsGrid } from './components/FeaturedCollectionsGrid'
import { Rocket, Plus, X, Image as ImageIcon, ChevronRight } from 'lucide-react'
import { BrandLoader } from '@/components/brand-loader'

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
    return <BrandLoader label="Loading launchpad" />
  }

  return (
    <div className="relative bg-transparent min-h-full">
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 space-y-5 max-w-[1400px] mx-auto">
        <LaunchpadHero onExplore={scrollToGrid} />

        <LaunchpadSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />

        <div ref={gridRef}>
          {featuredCollections.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-white/[0.08] bg-[#131318] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-[#2DE2FF]/10 text-[#2DE2FF] text-[11px] font-semibold">
                Robinhood Chain
              </div>
              <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">
                No live mints yet
              </h2>
              <p className="text-zinc-500 max-w-md mx-auto mb-6 text-sm leading-relaxed">
                This launchpad is fresh. Deploy a collection and go live on Robinhood Chain.
              </p>
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleOpenLaunchModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#2DE2FF] hover:bg-[#7aefff] text-[#0a0a0c] font-bold text-sm transition-colors"
                >
                  <Rocket className="h-4 w-4" />
                  Launch collection
                </button>
              ) : (
                <p className="text-xs text-zinc-600">
                  Connect wallet to launch
                </p>
              )}
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
          <div className="relative w-full max-w-lg bg-[#121214] border border-white/[0.1] rounded-xl shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#18181b] border border-white/10">
                  <Rocket className="h-4 w-4 text-[#2DE2FF]" />
                </div>
                <h2 className="text-lg font-semibold text-zinc-100">
                  Launch collection
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowLaunchModal(false)}
                className="p-2 rounded-lg hover:bg-white/[0.04] transition-colors text-zinc-500 hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <p className="text-zinc-500 text-sm mb-4 leading-relaxed">
                Select a collection to set up its launchpad. You&apos;ll configure mint phases,
                pricing, and whitelists.
              </p>

              {loadingUserCollections ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-[#2DE2FF] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : userCollections.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-zinc-100 font-medium mb-1.5">No collections found</p>
                  <p className="text-zinc-500 text-sm mb-5">
                    Create a collection first, then come back to launch it.
                  </p>
                  <Link
                    href="/collections/create"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2DE2FF] hover:bg-[#1BB8D4] text-[#0b0b0d] font-semibold text-sm transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create collection
                  </Link>
                </div>
              ) : (
                <div className="space-y-1.5">
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
                      : 'text-zinc-500'

                    return (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => {
                          setShowLaunchModal(false)
                          router.push(`/collections/${col.id}/launch`)
                        }}
                        className="w-full flex items-center gap-3.5 p-3 rounded-lg border border-white/[0.08] hover:border-white/16 bg-[#0e0e10] hover:bg-white/[0.03] transition-colors text-left group"
                      >
                        <div className="w-12 h-12 overflow-hidden rounded-lg border border-white/[0.08] bg-[#121214] flex-shrink-0">
                          {col.banner_image_url || col.mobile_image_url ? (
                            <img
                              src={col.banner_image_url || col.mobile_image_url}
                              alt={col.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-zinc-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-100 font-medium truncate text-sm">{col.name}</p>
                          <span className={`text-xs font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 transition-colors flex-shrink-0" />
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
