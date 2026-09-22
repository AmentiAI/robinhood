'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { useWallet } from '@/lib/wallet/compatibility'
import { useCredits } from '@/lib/credits-context'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { BrandLoader } from '@/components/brand-loader'
import { ToolWorkspace } from '@/components/tool-workspace'
import { generateApiAuth } from '@/lib/wallet/api-auth'

interface Collection {
  id: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
  wallet_address?: string
  is_owner?: boolean
  collaborator_role?: string
  status?: 'draft' | 'launchpad' | 'launchpad_live' | 'self_inscribe' | 'marketplace' | 'deleted'
  banner_image_url?: string
  mobile_image_url?: string
  total_ordinals?: number
  thumbnail_url?: string
}
 
export default function CollectionsPage() {
  const { isConnected, currentAddress, signMessage } = useWallet()
  const { credits, loading: loadingCredits } = useCredits()
  
  const { activeWalletAddress, activeWalletConnected } = useMemo(() => {
    if (currentAddress && isConnected) {
      return { activeWalletAddress: currentAddress, activeWalletConnected: true }
    }
    return { activeWalletAddress: null, activeWalletConnected: false }
  }, [currentAddress, isConnected])
  
  const [collections, setCollections] = useState<Collection[]>([])
  const [ownedCollections, setOwnedCollections] = useState<Collection[]>([])
  const [collabCollections, setCollabCollections] = useState<Collection[]>([])
  const [activeTab, setActiveTab] = useState<'collections' | 'collabs'>('collections')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'launchpad' | 'self_inscribe' | 'marketplace'>('all')
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; collectionId: string | null; collectionName: string }>({
    isOpen: false,
    collectionId: null,
    collectionName: '',
  })
  const [deleting, setDeleting] = useState(false)
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({})

  useEffect(() => {
    if (activeWalletConnected && activeWalletAddress) {
      loadCollections()
    } else {
      setCollections([])
      setOwnedCollections([])
      setCollabCollections([])
      setLoading(false)
    }
  }, [activeWalletConnected, activeWalletAddress])

  const loadCollections = async () => {
    if (!currentAddress) {
      setCollections([])
      setOwnedCollections([])
      setCollabCollections([])
      setLoading(false)
      return
    }

    const walletRequested = currentAddress
    setLoading(true)
    try {
      const response = await fetch(`/api/collections?wallet_address=${encodeURIComponent(walletRequested)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })

      // Only apply response if wallet is still connected and same as requested (owned + collaborator only)
      if (activeWalletAddress === walletRequested && response.ok) {
        const data = await response.json()
        const ownedList = data.owned_collections || []
        const collabList = data.collaborator_collections || []
        const allCollectionsList = data.collections || []
        setOwnedCollections(ownedList)
        setCollabCollections(collabList)
        setCollections(allCollectionsList)

        // Load thumbnails for all collections
        loadThumbnails([...ownedList, ...collabList])
      } else if (activeWalletAddress !== walletRequested) {
        setCollections([])
        setOwnedCollections([])
        setCollabCollections([])
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadThumbnails = async (collections: Collection[]) => {
    const thumbnailData: Record<string, string> = {}

    // Fetch latest ordinal for each collection
    await Promise.all(
      collections.map(async (collection) => {
        try {
          const response = await fetch(`/api/collections/${collection.id}/ordinals?limit=1`)
          if (response.ok) {
            const data = await response.json()
            const ordinals = data.ordinals || []
            if (ordinals.length > 0 && ordinals[0].image_url) {
              thumbnailData[collection.id] = ordinals[0].image_url
            }
          }
        } catch (error) {
          console.error(`Error loading thumbnail for collection ${collection.id}:`, error)
        }
      })
    )

    setThumbnails(thumbnailData)
  }

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, collectionId: id, collectionName: name })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.collectionId) return
    if (!currentAddress) {
      toast.error('Please connect your wallet to delete this collection')
      return
    }
    if (!signMessage) {
      toast.error('Wallet signing not available', {
        description: 'Please disconnect and reconnect your wallet, then try again.',
      })
      return
    }

    try {
      const auth = await generateApiAuth(currentAddress, signMessage)
      if (!auth) {
        toast.error('Failed to sign request', {
          description: 'Please ensure your wallet is unlocked and connected, then try again.',
        })
        return
      }

      setDeleting(true)
      const response = await fetch(`/api/collections/${deleteConfirm.collectionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auth),
      })
      if (response.ok) {
        toast.success('Collection deleted')
        await loadCollections()
        setDeleteConfirm({ isOpen: false, collectionId: null, collectionName: '' })
      } else {
        const error = await response.json()
        toast.error('Error deleting collection', { description: error.error || 'Unknown error' })
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      toast.error('Failed to delete collection. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, collectionId: null, collectionName: '' })
  }

  // Filter collections
  const filteredCollections = useMemo(() => {
    let filtered = (activeTab === 'collections' ? ownedCollections : collabCollections)
      .filter(c => c.status !== 'deleted')
    
    // Status filter
    if (activeTab === 'collections' && statusFilter !== 'all') {
      if (statusFilter === 'launchpad') {
        filtered = filtered.filter(c => c.status === 'launchpad' || c.status === 'launchpad_live')
      } else {
        filtered = filtered.filter(c => c.status === statusFilter)
      }
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.description?.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [activeTab, ownedCollections, collabCollections, statusFilter, searchQuery])

  if (loading || loadingCredits) {
    return <BrandLoader label="Loading collections" />
  }

  if (isConnected && currentAddress && (credits === null || credits === 0)) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.08] bg-[#131318] p-8 text-center shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-[#0c0c10] border border-white/[0.08] flex items-center justify-center">
            <svg className="w-7 h-7 text-[#2DE2FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No credits available</h2>
          <p className="text-zinc-500 mb-6 text-sm leading-relaxed">
            You need credits to manage collections.
          </p>
          <Link
            href="/buy-credits"
            className="inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] font-bold text-sm hover:bg-[#7aefff] transition-colors"
          >
            Buy credits
          </Link>
        </div>
      </div>
    )
  }

  const statusLabel = (status?: string) => {
    if (status === 'draft') return 'Draft'
    if (status === 'launchpad' || status === 'launchpad_live') return 'Launchpad'
    if (status === 'self_inscribe') return 'Inscribe'
    if (status === 'marketplace') return 'Archived'
    if (status === 'deleted') return 'Deleted'
    return 'Collection'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Collections"
        subtitle="Build, manage, and launch your NFT projects"
        action={
          <Link
            href="/collections/create"
            className="inline-flex h-10 px-5 items-center rounded-full bg-gradient-to-r from-[#2DE2FF] via-[#A855F7] to-[#FF2BD6] text-[#0a0a0c] text-sm font-bold hg-btn-glow"
            style={{ backgroundSize: '200% 100%', animation: 'hg-shimmer 5s linear infinite' }}
          >
            Create collection
          </Link>
        }
      />

      <ToolWorkspace>
        <div className="rounded-2xl border border-white/[0.1] bg-[#131318] p-4 sm:p-5 mb-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search collections…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0c0c10] border border-white/[0.06] focus:border-[#2DE2FF]/40 text-white placeholder:text-zinc-600 outline-none text-sm"
              />
            </div>
            <div className="flex gap-1 p-1 rounded-full bg-[#0c0c10] border border-white/[0.08]">
              <button
                onClick={() => setActiveTab('collections')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  activeTab === 'collections'
                    ? 'bg-white text-black'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                Mine ({ownedCollections.filter(c => c.status !== 'deleted').length})
              </button>
              <button
                onClick={() => setActiveTab('collabs')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  activeTab === 'collabs'
                    ? 'bg-white text-black'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                Collabs ({collabCollections.filter(c => c.status !== 'deleted').length})
              </button>
            </div>
          </div>

          {activeTab === 'collections' && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {[
                { value: 'all', label: 'All' },
                { value: 'draft', label: 'Draft' },
                { value: 'launchpad', label: 'Launchpad' },
                { value: 'self_inscribe', label: 'Inscribe' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    statusFilter === filter.value
                      ? 'bg-white text-black'
                      : 'bg-[#0c0c10] border border-white/[0.08] text-zinc-500 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {filteredCollections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#131318]/60 px-6 py-16 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2DE2FF]/70 mb-3">
              Empty studio
            </p>
            <h2 className="text-xl font-semibold text-white mb-2">No collections yet</h2>
            <p className="text-zinc-500 mb-6 text-sm max-w-sm mx-auto">
              {searchQuery
                ? 'Try a different search'
                : 'Create your first collection to start generating NFTs'}
            </p>
            {!searchQuery && (
              <Link
                href="/collections/create"
                className="inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] font-bold text-sm hover:bg-[#7aefff] transition-colors"
              >
                Create collection
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCollections.map((collection, index) => {
              const thumb =
                thumbnails[collection.id] ||
                collection.banner_image_url ||
                collection.mobile_image_url
              const delayClass =
                index % 5 === 0
                  ? 'hg-rise'
                  : index % 5 === 1
                    ? 'hg-rise hg-rise-delay-1'
                    : index % 5 === 2
                      ? 'hg-rise hg-rise-delay-2'
                      : index % 5 === 3
                        ? 'hg-rise hg-rise-delay-3'
                        : 'hg-rise hg-rise-delay-4'
              return (
                <div
                  key={collection.id}
                  className={`hg-card group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#131318]/90 ${delayClass}`}
                >
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-[#2DE2FF] via-[#A855F7] to-[#FF2BD6]" />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'radial-gradient(circle, rgba(45,226,255,0.25), transparent 70%)',
                    }}
                  />
                  <div className="flex flex-col sm:flex-row gap-0 sm:gap-5 pl-4 sm:pl-5">
                    <div className="relative w-full sm:w-40 md:w-48 aspect-[16/10] sm:aspect-square sm:shrink-0 bg-[#0c0c10] overflow-hidden sm:rounded-xl sm:my-4 sm:ml-1">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={collection.name}
                          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2DE2FF]/10 via-transparent to-[#FF2BD6]/10">
                          <div className="h-10 w-10 rounded-xl border border-[#2DE2FF]/30 bg-[#131318] flex items-center justify-center shadow-[0_0_20px_rgba(45,226,255,0.2)]">
                            <span className="text-[#2DE2FF] text-sm font-bold">
                              {collection.name.slice(0, 1).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:py-4 sm:pr-5 sm:pl-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="text-base sm:text-lg font-semibold text-white truncate group-hover:text-[#2DE2FF] transition-colors duration-300">
                            {collection.name}
                          </h3>
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                              collection.status === 'draft'
                                ? 'bg-white/[0.06] text-zinc-400'
                                : collection.status === 'deleted'
                                  ? 'bg-red-500/15 text-red-400'
                                  : 'bg-gradient-to-r from-[#2DE2FF]/20 to-[#FF2BD6]/20 text-[#2DE2FF] border border-[#2DE2FF]/25'
                            }`}
                          >
                            {statusLabel(collection.status)}
                          </span>
                        </div>
                        {collection.description ? (
                          <p className="text-sm text-zinc-500 line-clamp-1 mb-1.5">
                            {collection.description}
                          </p>
                        ) : null}
                        <p className="text-xs text-zinc-600">
                          {collection.total_ordinals !== undefined
                            ? `${collection.total_ordinals} ${
                                collection.total_ordinals === 1 ? 'item' : 'items'
                              }`
                            : 'No items yet'}
                          {collection.collaborator_role
                            ? ` · ${collection.collaborator_role}`
                            : ''}
                        </p>
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
                        <Link
                          href={`/collections/${collection.id}`}
                          className="hg-btn-glow inline-flex h-9 px-4 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
                        >
                          Open
                        </Link>
                        {collection.status !== 'deleted' && (
                          <>
                            <Link
                              href={`/collections/${collection.id}/launch`}
                              className="inline-flex h-9 px-4 items-center rounded-full border border-[#FF2BD6]/35 text-sm font-semibold text-[#FF2BD6] hover:bg-[#FF2BD6]/10 hover:border-[#FF2BD6]/55 transition-all duration-200"
                            >
                              Launch
                            </Link>
                            <Link
                              href={`/collections/${collection.id}/edit`}
                              className="inline-flex h-9 px-4 items-center rounded-full border border-white/[0.08] text-sm font-medium text-zinc-400 hover:text-white hover:border-[#2DE2FF]/35 transition-all duration-200"
                            >
                              Edit
                            </Link>
                            <Link
                              href={`/collections/${collection.id}/export`}
                              className="inline-flex h-9 px-4 items-center rounded-full border border-[#2DE2FF]/35 text-sm font-semibold text-[#2DE2FF] hover:bg-[#2DE2FF]/10 transition-all duration-200"
                            >
                              Export
                            </Link>
                            <button
                              onClick={() => handleDeleteClick(collection.id, collection.name)}
                              className="inline-flex h-9 px-4 items-center rounded-full border border-red-500/25 text-sm font-medium text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all duration-200"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ToolWorkspace>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Collection"
        message={`Are you sure you want to delete "${deleteConfirm.collectionName}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        loading={deleting}
      />
    </div>
  )
}
