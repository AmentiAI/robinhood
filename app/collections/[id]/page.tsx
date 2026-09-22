'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useWallet } from '@/lib/wallet/compatibility'
import { isAdmin } from '@/lib/auth/access-control'
import { DownloadProgressModal } from '@/components/download-progress-modal'
import { CollectionCollaborators } from '@/components/collection-collaborators'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CompressionModal } from '@/components/compression-modal'
import { BrandLoader } from '@/components/brand-loader'
import { ToolWorkspace } from '@/components/tool-workspace'
import { CollectionHeader } from './components/CollectionHeader'
import { CollectionStats } from './components/CollectionStats'
import { LayersSection } from './components/LayersSection'
import { GenerationSection } from './components/GenerationSection'
import { NftsGrid } from './components/OrdinalsGrid'
import { useCollectionPageLogic } from './hooks/useCollectionPageLogic'
import { useState, useEffect } from 'react'
import { GeneratedOrdinal } from './types'

interface Collection {
  id: string
  name: string
  is_active: boolean
  collection_status?: 'draft' | 'launchpad' | 'self_inscribe' | 'marketplace' | 'deleted'
  wallet_address?: string
  art_style?: string | null
  compression_quality?: number | null
  compression_dimensions?: number | null
  compression_format?: string | null
  compression_target_kb?: number | null
}

interface Layer {
  id: string
  name: string
  display_order: number
  trait_count: number
}

export default function CollectionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { currentAddress, isConnected } = useWallet()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'generated' | 'compression'>('generated')
  const [compressionQuality, setCompressionQuality] = useState(100)
  const [compressionDimensions, setCompressionDimensions] = useState<number | ''>(1024)
  const [compressionFormat, setCompressionFormat] = useState<'jpg' | 'png' | 'webp'>('webp')
  const [compressionTargetKB, setCompressionTargetKB] = useState<number | null>(null)
  const [originalCompressionSettings, setOriginalCompressionSettings] = useState<{
    quality: number
    dimensions: number
    format: string
  } | null>(null)
  const [savingCompression, setSavingCompression] = useState(false)
  const [wipingCompressions, setWipingCompressions] = useState(false)
  const {
    collection, layers, ordinals, loading, currentPage, setCurrentPage, totalPages, totalOrdinals,
    queuedJobs, processingJobs, traitFilters, layerTraits, userRole, collectionOwner, collaboratorCount,
    generating, generateQuantity, setGenerateQuantity, useClassicMode, setUseClassicMode,
    imageSliders, setImageSliders, expandedTraits, setExpandedTraits, showPromptId, setShowPromptId,
    flippingOrdinal, showDeleteConfirm, setShowDeleteConfirm, deleting, showCollaboratorsModal,
    setShowCollaboratorsModal, showCompressionModal, setShowCompressionModal, compressionModalOrdinal,
    setCompressionModalOrdinal, compressionModalSlider, setCompressionModalSlider, downloadProgress,
    showDeleteOrdinalConfirm, setShowDeleteOrdinalConfirm, showWipeCompressionsConfirm,
    setShowWipeCompressionsConfirm, showFilterConfirm, setShowFilterConfirm, showCreditsConfirm,
    setShowCreditsConfirm, credits, loadingCredits, pendingGeneration,
    setPendingGeneration, showOrphanedTraits, setShowOrphanedTraits, handleGenerate, handleDelete, handleDeleteConfirm, handleDeleteCancel,
    handleDeleteOrdinal, executeDeleteOrdinal, handleFlipOrdinal, handleDownloadOrdinal,
    handleWipeCompressions, executeWipeCompressions, executeGeneration, clearFilters,
    handleCreditsConfirmAccept, handleCreditsConfirmCancel,
    handleFilterChange, loadAllData
  } = useCollectionPageLogic(params.id, currentAddress)

  // Security check: user role determines access (set by useCollectionPageLogic after API auth check)
  const isUserAdmin = isAdmin(currentAddress || null)
  const hasAccess = userRole === 'owner' || userRole === 'editor' || userRole === 'viewer' || isUserAdmin

  // Handle hydration - only show client-specific content after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Initialize compression settings from collection
  useEffect(() => {
    if (collection) {
      const collectionWithCompression = collection as Collection
      setCompressionQuality(collectionWithCompression.compression_quality ?? 100)
      setCompressionDimensions(collectionWithCompression.compression_dimensions ?? 1024)
      setCompressionFormat((collectionWithCompression.compression_format as 'jpg' | 'png' | 'webp') || 'webp')
      setCompressionTargetKB(collectionWithCompression.compression_target_kb ?? null)
      setOriginalCompressionSettings({
        quality: collectionWithCompression.compression_quality ?? 100,
        dimensions: collectionWithCompression.compression_dimensions ?? 1024,
        format: collectionWithCompression.compression_format || 'webp'
      })
    }
  }, [collection])

  // Check if compression settings have changed
  const compressionSettingsChanged = originalCompressionSettings && (
    compressionQuality !== originalCompressionSettings.quality ||
    (compressionDimensions !== '' && compressionDimensions !== null && compressionDimensions !== originalCompressionSettings.dimensions) ||
    compressionFormat !== originalCompressionSettings.format
  )
  
  // Check if dimensions are blank (for disabling save button)
  const dimensionsBlank = compressionDimensions === '' || compressionDimensions === null || compressionDimensions === undefined

  const handleSaveCompressionSettings = async () => {
    if (!params.id || !currentAddress || dimensionsBlank) return
    
    setSavingCompression(true)
    try {
      const response = await fetch(`/api/collections/${params.id}/compression-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: currentAddress,
          compression_quality: compressionQuality,
          compression_dimensions: (typeof compressionDimensions === 'string' && compressionDimensions === '') || compressionDimensions === null || compressionDimensions === undefined ? null : (typeof compressionDimensions === 'number' ? compressionDimensions : parseInt(String(compressionDimensions))),
          compression_format: compressionFormat,
          compression_target_kb: compressionTargetKB,
        }),
      })
      
      if (response.ok) {
        const data = await response.json()
        setOriginalCompressionSettings({
          quality: compressionQuality,
          dimensions: (typeof compressionDimensions === 'string' && compressionDimensions === '') || compressionDimensions === null || compressionDimensions === undefined ? 1024 : (typeof compressionDimensions === 'number' ? compressionDimensions : parseInt(String(compressionDimensions))),
          format: compressionFormat
        })
        toast.success('Compression settings saved successfully!')
        loadAllData() // Reload to get updated collection data
      } else {
        const error = await response.json()
        toast.error('Error saving compression settings', { description: error.error || 'Unknown error' })
      }
    } catch (error) {
      console.error('Error saving compression settings:', error)
      toast.error('Failed to save compression settings')
    } finally {
      setSavingCompression(false)
    }
  }

  // Show loading state during SSR and initial hydration
  if (!mounted || loading) {
    return <BrandLoader label="Loading collection" />
  }

  // Not connected - show connect prompt (only after hydration)
  if (!isConnected || !currentAddress) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.08] bg-[#131318] p-8 text-center shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2DE2FF]/70 mb-3">
            Access
          </p>
          <h2 className="text-xl font-semibold text-white mb-2">Connect your wallet</h2>
          <p className="text-zinc-500 mb-6 text-sm leading-relaxed">
            Connect a wallet to open collection management.
          </p>
          <Link
            href="/collections"
            className="inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] font-bold text-sm hover:bg-[#7aefff] transition-colors"
          >
            Back to collections
          </Link>
        </div>
      </div>
    )
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto text-center py-8">
            <div className="text-white">Collection not found or access denied</div>
            <Link href="/collections" className="text-[#2DE2FF] hover:text-[#2DE2FF] mt-4 inline-block">
              ← Back to Collections
            </Link>
        </div>
      </div>
    )
  }

  // Check if user has access (from API response via userRole)
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/25 bg-[#131318] p-8 text-center shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
          <h2 className="text-xl font-semibold text-white mb-2">Access denied</h2>
          <p className="text-zinc-500 mb-6 text-sm leading-relaxed">
            Only the owner or authorized collaborators can view this collection.
          </p>
          <Link
            href="/collections"
            className="inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] font-bold text-sm hover:bg-[#7aefff] transition-colors"
          >
            Back to collections
          </Link>
        </div>
      </div>
    )
  }

  const isBlocked = (collection.collection_status === 'launchpad' || collection.collection_status === 'marketplace') && !isUserAdmin && !hasAccess
  
  if (isBlocked) {
    const statusText = collection.collection_status === 'launchpad' ? 'launchpad' : 'marketplace'
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.08] bg-[#131318] p-8 text-center shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
          <h2 className="text-xl font-semibold text-white mb-2">Editing locked</h2>
          <p className="text-zinc-500 mb-6 text-sm leading-relaxed">
            This collection is on <span className="text-white font-medium">{statusText}</span> and can&apos;t be edited right now.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/collections"
              className="inline-flex h-10 px-5 items-center justify-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-200 hover:border-white/20 transition-colors"
            >
              Collections
            </Link>
            {collection.collection_status === 'launchpad' && (
              <Link
                href={`/launchpad/${collection.id}`}
                className="inline-flex h-10 px-5 items-center justify-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold hover:bg-[#7aefff] transition-colors"
              >
                View launchpad
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
  <div className="min-h-screen w-full bg-[#0a0a0c]">
      <ToolWorkspace>
          <CollectionHeader
            collection={collection}
            collaboratorCount={collaboratorCount}
            userRole={userRole}
            onShowCollaborators={() => setShowCollaboratorsModal(true)}
            onDelete={() => setShowDeleteConfirm(true)}
          />
          <CollectionStats layers={layers} totalOrdinals={totalOrdinals} isActive={collection.is_active} />
        {showCollaboratorsModal && collection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#131318] border border-white/[0.08] rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
                <h2 className="text-lg font-semibold text-white">Manage Collaborators</h2>
                  <button onClick={() => { setShowCollaboratorsModal(false); loadAllData() }} className="text-white/70 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                  <CollectionCollaborators collectionId={collection.id} collectionOwner={collectionOwner || collection.wallet_address || ''} currentUserRole={userRole} />
              </div>
            </div>
          </div>
        )}
          <div className="space-y-6">
          <LayersSection collectionId={collection.id} layers={layers} onLayerDeleted={loadAllData} />
            <GenerationSection
              collection={collection}
              layers={layers}
              queuedJobs={queuedJobs}
              processingJobs={processingJobs}
              traitFilters={traitFilters}
              layerTraits={layerTraits}
              generateQuantity={generateQuantity}
              setGenerateQuantity={setGenerateQuantity}
              useClassicMode={useClassicMode}
              setUseClassicMode={setUseClassicMode}
              generating={generating}
              currentAddress={currentAddress}
              onGenerate={handleGenerate}
              onClearFilters={clearFilters}
              onFilterChange={handleFilterChange}
            />

          <div className="min-w-0">
            <div className="inline-flex gap-1 p-1 rounded-full bg-[#0c0c10] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setActiveTab('generated')}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === 'generated'
                    ? 'bg-white text-black'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                Images
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('compression')}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeTab === 'compression'
                    ? 'bg-white text-black'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                Compression
              </button>
            </div>

          {activeTab === 'generated' && (
            <div className="mt-4 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2DE2FF]/70 mb-1">
                    Gallery
                  </p>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Generated images
                    {totalOrdinals > 0 ? (
                      <span className="text-zinc-500 font-medium text-base ml-2">({totalOrdinals})</span>
                    ) : null}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOrphanedTraits(!showOrphanedTraits)}
                  className={`inline-flex h-10 px-4 items-center rounded-full text-sm font-semibold transition-all ${
                    showOrphanedTraits
                      ? 'hg-btn-glow bg-[#2DE2FF] text-[#0a0a0c]'
                      : 'border border-white/[0.1] text-zinc-400 hover:text-white hover:border-white/25'
                  }`}
                >
                  {showOrphanedTraits ? 'Showing orphaned traits' : 'Show orphaned traits'}
                </button>
              </div>

              <div className="rounded-2xl border border-white/[0.1] bg-[#131318] p-4 sm:p-5 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
                <NftsGrid
                  nfts={ordinals}
                  totalNfts={totalOrdinals}
                  currentPage={currentPage}
                  imageSliders={imageSliders}
                  setImageSliders={setImageSliders}
                  expandedTraits={expandedTraits}
                  setExpandedTraits={setExpandedTraits}
                  showPromptId={showPromptId}
                  setShowPromptId={setShowPromptId}
                  flippingNft={flippingOrdinal}
                  onDownload={handleDownloadOrdinal}
                  onDelete={handleDeleteOrdinal}
                  onFlip={handleFlipOrdinal}
                  onShowCompression={(nft) => {
                    setCompressionModalOrdinal(nft)
                    setCompressionModalSlider(50)
                    setShowCompressionModal(true)
                  }}
                  collectionArtStyle={(collection as Collection)?.art_style}
                />
                {ordinals.length === 0 && (
                  <div className="text-center py-12 text-zinc-500 text-sm">
                    No images yet — use Generate above to create your first NFTs.
                  </div>
                )}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="hg-btn-glow h-10 px-5 rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-zinc-400 text-sm tabular-nums">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="hg-btn-glow h-10 px-5 rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'compression' && (
            <div className="mt-4 rounded-2xl border border-white/[0.1] bg-[#131318] p-5 sm:p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
              {/* Compression Settings Section */}
              <div className="mb-6 border-b border-white/[0.08] pb-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2DE2FF]/70 mb-1">
                  Output
                </p>
                <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Compression settings</h3>
                
                {/* Compression Settings Changed Warning */}
                {compressionSettingsChanged && (
                  <div className="mb-4 rounded-xl border border-[#2DE2FF]/40 bg-[#2DE2FF]/[0.06] p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[#2DE2FF] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#2DE2FF]">
                          Compression settings have changed
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                          Existing compressed images won&apos;t be affected. Wipe compressions to re-compress with the new settings.
                        </p>
                        <button
                          type="button"
                          onClick={handleWipeCompressions}
                          disabled={wipingCompressions}
                          className="hg-btn-glow mt-3 inline-flex h-9 px-4 items-center gap-2 rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-xs font-bold disabled:opacity-50"
                        >
                          {wipingCompressions ? 'Wiping…' : 'Wipe compressions'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      File format
                    </label>
                    <select
                      value={compressionFormat}
                      onChange={(e) => setCompressionFormat(e.target.value as 'jpg' | 'png' | 'webp')}
                      className="w-full rounded-xl border border-white/[0.1] bg-[#0c0c10] px-3 py-2.5 text-white focus:border-[#2DE2FF] focus:outline-none"
                    >
                      <option value="webp" className="bg-[#0a0a0c]">WebP (Recommended)</option>
                      <option value="jpg" className="bg-[#0a0a0c]">JPEG</option>
                      <option value="png" className="bg-[#0a0a0c]">PNG (Lossless)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Quality: {compressionQuality}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={compressionQuality}
                      onChange={(e) => setCompressionQuality(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-zinc-400 mb-2">
                      Dimensions (square, max 1024)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="1"
                        max="1024"
                        value={compressionDimensions}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '') {
                            setCompressionDimensions('')
                          } else {
                            const numVal = parseInt(val)
                            if (!isNaN(numVal)) {
                              const clamped = Math.max(1, Math.min(1024, numVal))
                              setCompressionDimensions(clamped)
                            }
                          }
                        }}
                        className="w-28 rounded-xl border border-white/[0.1] bg-[#0c0c10] px-3 py-2.5 text-white focus:border-[#2DE2FF] focus:outline-none"
                        placeholder="Size"
                      />
                      <span className="text-zinc-500 text-sm">× {compressionDimensions || '—'} px</span>
                    </div>
                  </div>

                  {(() => {
                    if (compressionDimensions === '' || compressionDimensions === null) {
                      return null
                    }
                    const pixels = compressionDimensions * compressionDimensions
                    const quality = compressionQuality
                    
                    let baseEstimatedKB = 0
                    
                    if (compressionFormat === 'webp') {
                      const baseBitsPerPixel = 1.4
                      const qualityFactor = 0.4 + (quality / 100) * 0.6
                      const bitsPerPixel = baseBitsPerPixel * qualityFactor
                      baseEstimatedKB = (pixels * bitsPerPixel) / 8 / 1024
                    } else if (compressionFormat === 'jpg') {
                      const baseBitsPerPixel = 1.75
                      const qualityFactor = 0.4 + (quality / 100) * 0.6
                      const bitsPerPixel = baseBitsPerPixel * qualityFactor
                      baseEstimatedKB = (pixels * bitsPerPixel) / 8 / 1024
                    } else if (compressionFormat === 'png') {
                      const bitsPerPixel = 4.5
                      baseEstimatedKB = (pixels * bitsPerPixel) / 8 / 1024
                    }
                    
                    const adjustedBase = baseEstimatedKB * 1.1 * 1.15
                    const lowerKB = Math.max(10, Math.round(adjustedBase))
                    const upperKB = Math.max(10, Math.round(adjustedBase * 1.5))
                    const formatName = compressionFormat === 'jpg' ? 'JPEG' : compressionFormat.toUpperCase()
                    
                    return (
                      <div className="rounded-xl border border-white/[0.08] bg-[#0c0c10] p-3.5">
                        <p className="text-sm font-medium text-[#2DE2FF]">
                          Estimated size:{' '}
                          <span className="font-bold text-white">
                            {lowerKB}-{upperKB} KB
                          </span>{' '}
                          ({formatName})
                        </p>
                      </div>
                    )
                  })()}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleSaveCompressionSettings}
                    disabled={savingCompression || dimensionsBlank}
                    className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingCompression ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <button
                  onClick={handleWipeCompressions}
                  className="inline-flex h-9 px-4 items-center rounded-full border border-red-500/30 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors"
                >
                  Wipe compressions
                </button>
              </div>
              <CompressionTable ordinals={ordinals} totalOrdinals={totalOrdinals} currentPage={currentPage} />
            </div>
          )}
          </div>
          </div>
      </ToolWorkspace>
      </div>
      <CompressionModal isOpen={showCompressionModal} ordinal={compressionModalOrdinal} sliderValue={compressionModalSlider} onClose={() => setShowCompressionModal(false)} onSliderChange={setCompressionModalSlider} />
      <DownloadProgressModal isOpen={downloadProgress.isOpen} current={downloadProgress.current} total={downloadProgress.total} status={downloadProgress.status} message={downloadProgress.message} failedCount={downloadProgress.failedCount} />
      <ConfirmDialog isOpen={showDeleteConfirm} onClose={handleDeleteCancel} onConfirm={handleDeleteConfirm} title="Delete Collection" message={`Are you sure you want to delete "${collection?.name || 'this collection'}"?`} confirmText="Delete" cancelText="Cancel" confirmButtonClass="bg-red-600 hover:bg-red-700" loading={deleting} />
      {showDeleteOrdinalConfirm && <ConfirmDialog isOpen={!!showDeleteOrdinalConfirm} onClose={() => setShowDeleteOrdinalConfirm(null)} onConfirm={() => executeDeleteOrdinal(showDeleteOrdinalConfirm)} title="Delete NFT" message="Are you sure you want to delete this NFT?" confirmText="Delete" cancelText="Cancel" confirmButtonClass="bg-red-600 hover:bg-red-700" />}
      <ConfirmDialog isOpen={showWipeCompressionsConfirm} onClose={() => setShowWipeCompressionsConfirm(false)} onConfirm={executeWipeCompressions} title="Delete All Compressed Images" message="Are you sure you want to delete all compressed images?" confirmText="Delete All" cancelText="Cancel" confirmButtonClass="bg-red-600 hover:bg-red-700" />
      {pendingGeneration && <ConfirmDialog isOpen={showFilterConfirm} onClose={() => { setShowFilterConfirm(false); setPendingGeneration(false) }} onConfirm={() => { setShowFilterConfirm(false); setShowCreditsConfirm(true) }} title="Filtered generation" message={`You are about to generate NFTs with trait filters applied. These traits will be used in ALL ${generateQuantity} generated NFT${generateQuantity > 1 ? 's' : ''}.`} confirmText="Proceed" cancelText="Cancel" confirmButtonClass="bg-[#FF2BD6] hover:bg-[#FF2BD6]" />}
      
      {/* Credits Confirmation Modal */}
      {showCreditsConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={handleCreditsConfirmCancel}>
          <div className="bg-[#131318] border border-white/[0.08] rounded-xl rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-white/[0.08]/50" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] p-6">
              <h2 className="text-2xl font-bold text-black">Confirm Generation</h2>
              <p className="text-black/70 mt-1">Review your credits before generating</p>
            </div>
            
            <div className="p-6">
              {loadingCredits ? (
                <BrandLoader variant="card" label="Loading credits" />
              ) : (
                <div className="space-y-4">
                  <div className="bg-[#131318] border border-white/[0.08] rounded-xl border border-white/[0.08] rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 font-medium">Current Credits:</span>
                      <span className="text-2xl font-bold text-white">{credits ?? 0}</span>
                    </div>
                    
                    <div className="border-t border-white/[0.08] pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-zinc-500">Generating {generateQuantity} NFT{generateQuantity > 1 ? 's' : ''}:</span>
                        <span className="text-lg font-semibold text-[#2DE2FF]">-{generateQuantity}</span>
                      </div>
                      <div className="text-xs text-zinc-500/80">
                        (1 credit per generation)
                      </div>
                    </div>
                    
                    <div className="border-t border-white/[0.08] pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white font-semibold">Total After:</span>
                        <span className={`text-2xl font-bold ${(credits ?? 0) - generateQuantity >= 0 ? 'text-[#2DE2FF]' : 'text-[#EF4444]'}`}>
                          {(credits ?? 0) - generateQuantity}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {(credits ?? 0) - generateQuantity < 0 && (
                    <div className="bg-[#131318] border border-white/[0.08] rounded-xl border border-[#EF4444]/50 rounded-lg p-3">
                      <p className="text-sm text-[#EF4444]">
                        ⚠️ Insufficient credits! You need {generateQuantity - (credits ?? 0)} more credit{generateQuantity - (credits ?? 0) > 1 ? 's' : ''} to generate {generateQuantity} NFT{generateQuantity > 1 ? 's' : ''}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="bg-[#131318] border border-white/[0.08] rounded-xl border-t border-white/[0.08] px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={handleCreditsConfirmCancel}
                className="px-6 py-2 bg-[#131318] border border-white/[0.08] rounded-xl border border-white/[0.08] hover:border-white/16/50 text-zinc-500 hover:text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditsConfirmAccept}
                disabled={loadingCredits || (credits ?? 0) - generateQuantity < 0}
                className="px-6 py-2 bg-[#2DE2FF] hover:bg-[#2DE2FF]/80 text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed  "
              >
                Accept & Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  ) 
}

// Compression Table Component
function CompressionTable({ ordinals, totalOrdinals, currentPage }: { ordinals: GeneratedOrdinal[]; totalOrdinals: number; currentPage: number }) {
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})

  useEffect(() => {
    // Load image dimensions for ordinals with compressed images
    const loadDimensions = async () => {
      const dimensions: Record<string, { width: number; height: number }> = {}
      
      for (const ordinal of ordinals) {
        if (ordinal.compressed_image_url) {
          try {
            const img = new Image()
            await new Promise((resolve, reject) => {
              img.onload = () => {
                dimensions[ordinal.id] = { width: img.naturalWidth, height: img.naturalHeight }
                resolve(null)
              }
              img.onerror = reject
              img.src = ordinal.compressed_image_url || ''
            })
          } catch (error) {
            console.error(`Failed to load dimensions for ordinal ${ordinal.id}:`, error)
          }
        }
      }
      
      setImageDimensions(dimensions)
    }

    loadDimensions()
  }, [ordinals])

  // Filter ordinals that have compression data - same logic as OrdinalCard
  const compressedOrdinals = ordinals.filter(o => {
    const hasCompressed = o.compressed_image_url && 
      o.compressed_image_url !== null && 
      o.compressed_image_url.trim() !== '' &&
      o.compressed_image_url !== o.image_url
    return hasCompressed || o.compressed_size_kb != null
  })

  if (compressedOrdinals.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500">
        No compressed ordinals found. Compress some ordinals first to see them here.
      </div>
    )
  }

  return (
    <div className="border border-white/[0.08] rounded-lg overflow-hidden bg-[#131318] border border-white/[0.08] rounded-xl">
      <table className="w-full">
        <thead className="bg-[#131318] border border-white/[0.08] rounded-xl border-b border-white/[0.08]">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white">Ordinal #</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white">Width</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white">Height</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-white">Size (KB)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2DE2FF]/20">
          {compressedOrdinals.map((ordinal, index) => {
            const dimensions = imageDimensions[ordinal.id]
            // Use same display number calculation as OrdinalsGrid
            const displayNumber = ordinal.ordinal_number !== null && ordinal.ordinal_number !== undefined
              ? ordinal.ordinal_number
              : totalOrdinals - (currentPage - 1) * 15 - index
            
            // Use same null check pattern as OrdinalCard
            const compressedSizeKb = ordinal.compressed_size_kb != null 
              ? `${Number(ordinal.compressed_size_kb).toFixed(1)} KB`
              : '—'
            
            return (
              <tr key={ordinal.id} className="hover:bg-[#2DE2FF]/10 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-white">
                  #{displayNumber}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500">
                  {dimensions ? `${dimensions.width}px` : 'Loading...'}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500">
                  {dimensions ? `${dimensions.height}px` : 'Loading...'}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-500">
                  {compressedSizeKb}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
                         