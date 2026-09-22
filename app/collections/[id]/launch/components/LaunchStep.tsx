'use client'

import React, { useState, useEffect } from 'react'
import { Collection } from '../types'
import { toast } from 'sonner'
import JSZip from 'jszip'
import { SolanaDeploymentWizard } from '@/components/SolanaDeploymentWizard'

interface MintSummary {
  total_mints: number
  completed: number
  failed: number
  pending_reveal: number
  unique_minters: number
}

interface LaunchStepProps {
  collection: Collection
  onLaunch: () => void
  onEndLiveMint: () => void | Promise<void>
  onBack: () => void
  saving: boolean
}

export function LaunchStep({
  collection,
  onLaunch,
  onEndLiveMint,
  onBack,
  saving,
}: LaunchStepProps) {
  const isLive = collection.collection_status === 'launchpad_live'
  const [mintStats, setMintStats] = useState<MintSummary | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [metadataRecordCount, setMetadataRecordCount] = useState<number>(0)
  const [solanaNetwork, setSolanaNetwork] = useState<string>('devnet')
  
  // Load Solana network on mount
  useEffect(() => {
    async function loadNetwork() {
      try {
        const response = await fetch('/api/solana/network')
        if (response.ok) {
          const data = await response.json()
          setSolanaNetwork(data.network)
        }
      } catch (error) {
        console.error('Failed to load Solana network:', error)
      }
    }
    loadNetwork()
  }, [])
  
  // Compression check state
  const [checkingSizes, setCheckingSizes] = useState(false)
  const [sizeCheckResult, setSizeCheckResult] = useState<{
    total: number
    exceeds_limit: number
    all_under_limit: boolean
    max_size_kb: number
    ordinals: Array<{
      id: string
      ordinal_number: number | null
      size_kb: number
      exceeds_limit: boolean
      has_compressed: boolean
      filename: string
      image_url: string
      original_image_url: string | null
    }>
    pagination: {
      page: number
      limit: number
      total_pages: number
      total_items: number
    }
    summary: {
      total: number
      under_limit: number
      over_limit: number
      average_size_kb: number
      max_size_kb: number
    }
  } | null>(null)
  const [sizeCheckPage, setSizeCheckPage] = useState(1)
  const [compressionQuality, setCompressionQuality] = useState<number | ''>(100)
  const [compressionDimensions, setCompressionDimensions] = useState<number | ''>(1024)
  const [compressionTargetKB, setCompressionTargetKB] = useState<number | ''>('')
  const [compressionFormat, setCompressionFormat] = useState<'jpg' | 'png' | 'webp'>('webp')
  const [recompressing, setRecompressing] = useState(false)
  const [recompressProgress, setRecompressProgress] = useState({ current: 0, total: 0 })
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewOriginalUrl, setPreviewOriginalUrl] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [comparisonSlider, setComparisonSlider] = useState(50)

  // Load mint stats when component mounts or collection changes
  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true)
      try {
        const res = await fetch(`/api/launchpad/${collection.id}/mints`)
        if (res.ok) {
          const data = await res.json()
          setMintStats(data.summary)
          
          // Count mints with inscription_id / mint_id (these will be in the metadata export)
          const mintsWithInscription = (data.mints || []).filter((mint: any) => mint.inscription_id)
          setMetadataRecordCount(mintsWithInscription.length)
        }
      } catch (err) {
        console.error('Failed to load mint stats:', err)
      } finally {
        setLoadingStats(false)
      }
    }
    loadStats()
  }, [collection.id])

  // Initialize compression settings from collection
  useEffect(() => {
    if (collection) {
      // Set compression quality - preserve actual values including 100
      if (collection.compression_quality !== null && collection.compression_quality !== undefined) {
        setCompressionQuality(collection.compression_quality)
      } else {
        setCompressionQuality('') // Show as "Not set" if not in collection
      }
      
      // Set compression dimensions - preserve actual values
      if (collection.compression_dimensions !== null && collection.compression_dimensions !== undefined) {
        setCompressionDimensions(collection.compression_dimensions)
      } else {
        setCompressionDimensions('') // Show as empty if not in collection
      }
      
      // Set target KB
      if (collection.compression_target_kb !== null && collection.compression_target_kb !== undefined) {
        setCompressionTargetKB(collection.compression_target_kb)
      } else {
        setCompressionTargetKB('')
      }
      
      // Set format
      const format = collection.compression_format
      if (format === 'jpg' || format === 'png' || format === 'webp') {
        setCompressionFormat(format)
      } else {
        setCompressionFormat('webp')
      }
    }
  }, [collection])

  // Auto-load size check when component mounts
  useEffect(() => {
    if (collection.id) {
      handleCheckSizes(1)
      setSizeCheckPage(1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection.id])

  // Reload size check when page changes
  useEffect(() => {
    if (collection.id && sizeCheckPage > 0 && sizeCheckPage !== 1) {
      handleCheckSizes(sizeCheckPage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizeCheckPage])

  // Load image dimensions when size check result changes and set preview image
  useEffect(() => {
    if (sizeCheckResult && sizeCheckResult.ordinals.length > 0) {
      // Set preview image to the first ordinal's compressed and original URLs
      const firstOrdinal = sizeCheckResult.ordinals[0]
      if (firstOrdinal.image_url) {
        setPreviewImageUrl(firstOrdinal.image_url) // Compressed URL
        setPreviewOriginalUrl(firstOrdinal.original_image_url || null) // Original URL
      }
      
      const loadDimensions = async () => {
        const dimensions: Record<string, { width: number; height: number }> = {}
        
        // Load dimensions for each ordinal by creating Image objects
        const loadPromises = sizeCheckResult.ordinals.map((ordinal) => {
          return new Promise<void>((resolve) => {
            if (!ordinal.image_url) {
              resolve()
              return
            }
            
            const img = new Image()
            img.onload = () => {
              dimensions[ordinal.id] = { width: img.naturalWidth, height: img.naturalHeight }
              resolve()
            }
            img.onerror = () => {
              resolve() // Resolve even on error to not block other images
            }
            img.src = ordinal.image_url
          })
        })
        
        await Promise.all(loadPromises)
        setImageDimensions(dimensions)
      }
      
      loadDimensions()
    }
  }, [sizeCheckResult])

  const handleExportJSON = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/launchpad/${collection.id}/mints`)
      if (!res.ok) throw new Error('Failed to fetch mints')
      
      const data = await res.json()
      
      // Transform to clean metadata format
      const filteredMints = (data.mints || []).filter((mint: any) => mint.inscription_id) // Only include completed mints with inscription IDs
      
      // Helper to capitalize first letter of each word
      const capitalizeWords = (str: string): string => {
        return str
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
      }
      
      const metadata = filteredMints.map((mint: any, index: number) => {
          // Convert traits object to attributes array
          // Traits can be in various formats:
          // 1. { "LayerName": { name: "TraitName", description: "..." } }
          // 2. { "LayerName": "TraitName" }
          // 3. { "LayerName": { name: { name: "TraitName" } } } (nested)
          const attributes: Array<{ trait_type: string; value: string }> = []
          
          // Helper to extract string value from potentially nested object
          const extractValue = (data: any): string | null => {
            if (typeof data === 'string') return data
            if (typeof data === 'number') return String(data)
            if (data === null || data === undefined) return null
            if (typeof data === 'object') {
              // Try common property names
              if (typeof data.name === 'string') return data.name
              if (typeof data.value === 'string') return data.value
              // If name is also an object, recurse
              if (data.name && typeof data.name === 'object') {
                return extractValue(data.name)
              }
              // Last resort: try to find any string property
              for (const key of Object.keys(data)) {
                if (typeof data[key] === 'string' && data[key].length > 0) {
                  return data[key]
                }
              }
            }
            return null
          }
          
          if (mint.traits && typeof mint.traits === 'object') {
            for (const [traitType, traitData] of Object.entries(mint.traits)) {
              const traitValue = extractValue(traitData)
              if (traitValue) {
                // Capitalize first letter of each word in the value
                const capitalizedValue = capitalizeWords(traitValue)
                attributes.push({
                  trait_type: traitType,
                  value: capitalizedValue
                })
              }
            }
          }
          
          // Always use sequential numbering starting from 1 (ignore ordinal_number)
          const sequentialNumber = index + 1
          
          return {
            id: mint.inscription_id,
            meta: {
              name: `${collection.name} #${sequentialNumber}`,
              attributes
            }
          }
        })
      
      const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${collection.name.replace(/\s+/g, '-').toLowerCase()}-metadata.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Metadata exported!')
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Failed to export metadata')
    } finally {
      setExporting(false)
    }
  }

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const res = await fetch(`/api/launchpad/${collection.id}/mints?format=csv`)
      if (!res.ok) throw new Error('Failed to fetch mints')
      
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${collection.name.replace(/\s+/g, '-').toLowerCase()}-mints.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('CSV exported!')
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Failed to export CSV')
    } finally {
      setExporting(false)
    }
  }

  const handleExportRawFiles = async () => {
    setExporting(true)
    try {
      // Fetch all ordinals for the collection (not just minted ones)
      // Fetch all pages since API has a max limit of 100 per page
      let allOrdinals: any[] = []
      let page = 1
      let hasMore = true
      
      while (hasMore) {
        const res = await fetch(`/api/collections/${collection.id}/ordinals?limit=100&page=${page}`)
        if (!res.ok) throw new Error('Failed to fetch NFTs')
        
        const data = await res.json()
        const ordinals = (data.ordinals || []).filter((ordinal: any) => ordinal.image_url) // Only include NFTs with images
        allOrdinals = allOrdinals.concat(ordinals)
        
        // Check if there are more pages
        const totalPages = data.pagination?.totalPages || 1
        hasMore = page < totalPages
        page++
      }
      
      if (allOrdinals.length === 0) {
        toast.error('No NFTs with images found')
        return
      }

      // Sort by ordinal_number if available, otherwise by created_at
      allOrdinals.sort((a: any, b: any) => {
        if (a.ordinal_number !== null && b.ordinal_number !== null) {
          return a.ordinal_number - b.ordinal_number
        }
        if (a.ordinal_number !== null) return -1
        if (b.ordinal_number !== null) return 1
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      })

      toast.info(`Downloading ${allOrdinals.length} raw images...`, { duration: 2000 })
      
      const zip = new JSZip()
      const imagesFolder = zip.folder('raw-images')
      
      // Download all images
      for (let i = 0; i < allOrdinals.length; i++) {
        const ordinal = allOrdinals[i]
        try {
          // Use ordinal_number if available, otherwise use sequential index
          const fileNumber = ordinal.ordinal_number !== null ? ordinal.ordinal_number : (i + 1)
          const imageResponse = await fetch(ordinal.image_url)
          if (!imageResponse.ok) {
            console.warn(`Failed to fetch image for NFT ${fileNumber}`)
            continue
          }
          const imageBlob = await imageResponse.blob()
          
          // Determine file extension from content type or URL
          let extension = 'png'
          const contentType = imageResponse.headers.get('content-type')
          if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
            extension = 'jpg'
          } else if (contentType?.includes('webp')) {
            extension = 'webp'
          } else if (ordinal.image_url.includes('.jpg') || ordinal.image_url.includes('.jpeg')) {
            extension = 'jpg'
          } else if (ordinal.image_url.includes('.webp')) {
            extension = 'webp'
          }
          
          imagesFolder?.file(`${fileNumber}.${extension}`, imageBlob)
          
          // Update progress every 10 images
          if ((i + 1) % 10 === 0 || i === allOrdinals.length - 1) {
            toast.info(`Downloaded ${i + 1} of ${allOrdinals.length} images...`, { duration: 1000 })
          }
        } catch (error) {
          console.error(`Failed to download image for NFT ${i + 1}:`, error)
          // Continue with other images
        }
      }
      
      toast.info('Creating ZIP file...', { duration: 1000 })
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${collection.name.replace(/\s+/g, '-').toLowerCase()}-raw-images.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Raw images exported! (${allOrdinals.length} files)`)
    } catch (err) {
      console.error('Export failed:', err)
      toast.error('Failed to export raw files')
    } finally {
      setExporting(false)
    }
  }

  const handleCheckSizes = async (page: number = 1) => {
    setCheckingSizes(true)
    try {
      const res = await fetch(`/api/collections/${collection.id}/ordinals/check-sizes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, limit: 50 }),
      })
      if (res.ok) {
        const data = await res.json()
        setSizeCheckResult(data)
        if (!data.all_under_limit) {
          toast.warning(`${data.exceeds_limit} NFT(s) exceed 200KB limit`)
        }
      } else {
        const error = await res.json()
        toast.error(`Failed to check sizes: ${error.error}`)
      }
    } catch (err) {
      console.error('Failed to check sizes:', err)
      toast.error('Failed to check file sizes')
    } finally {
      setCheckingSizes(false)
    }
  }

  const handleRecompress = async () => {
    if (!compressionQuality && !compressionDimensions && !compressionTargetKB) {
      toast.error('Please set at least one compression setting')
      return
    }

    setRecompressing(true)
    setRecompressProgress({ current: 0, total: 0 })
    
    try {
      const res = await fetch(`/api/collections/${collection.id}/ordinals/recompress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compression_quality: compressionQuality !== '' ? compressionQuality : null,
          compression_dimensions: compressionDimensions !== '' ? compressionDimensions : null,
          compression_target_kb: compressionTargetKB !== '' ? compressionTargetKB : null,
          compression_format: compressionFormat,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setRecompressProgress({ current: data.compressed, total: data.total })
        toast.success(`Recompressed ${data.compressed} of ${data.total} ordinal(s)`)
        
        // Refresh size check after a short delay
        setTimeout(() => {
          handleCheckSizes()
        }, 2000)
      } else {
        const error = await res.json()
        toast.error(`Failed to recompress: ${error.error}`)
      }
    } catch (err) {
      console.error('Failed to recompress:', err)
      toast.error('Failed to recompress NFTs')
    } finally {
      setRecompressing(false)
      setTimeout(() => {
        setRecompressProgress({ current: 0, total: 0 })
      }, 2000)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2DE2FF]/70 mb-1">
          Step 5
        </p>
        <h2 className="text-xl font-bold text-white">Launch</h2>
      </div>
      
      {/* Mint Statistics */}
      <div className="rounded-2xl border border-white/[0.1] bg-[#131318] p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          📊 Mint Statistics
        </h3>
        
        {loadingStats ? (
          <div className="flex items-center gap-2 text-zinc-500">
            <div className="w-5 h-5 border-2 border-[#2DE2FF] border-t-transparent rounded-full animate-spin" />
            Loading stats...
          </div>
        ) : mintStats ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-xl p-4 border border-white/[0.08] bg-[#0c0c10]">
              <div className="text-3xl font-black text-[#2DE2FF]">{mintStats.total_mints}</div>
              <div className="text-sm text-white/70">Total Mints</div>
            </div>
            <div className="rounded-xl p-4 border border-white/[0.08] bg-[#0c0c10]">
              <div className="text-3xl font-black text-[#2DE2FF]">{mintStats.completed}</div>
              <div className="text-sm text-white/70">Completed</div>
            </div>
            <div className="rounded-xl p-4 border border-white/[0.08] bg-[#0c0c10]">
              <div className="text-3xl font-black text-[#2DE2FF]">{mintStats.pending_reveal}</div>
              <div className="text-sm text-white/70">Pending Reveal</div>
            </div>
            <div className="rounded-xl p-4 border border-white/[0.08] bg-[#0c0c10]">
              <div className="text-3xl font-black text-[#FF2BD6]">{mintStats.failed}</div>
              <div className="text-sm text-white/70">Failed</div>
            </div>
            <div className="rounded-xl p-4 border border-white/[0.08] bg-[#0c0c10]">
              <div className="text-3xl font-black text-[#2DE2FF]">{mintStats.unique_minters}</div>
              <div className="text-sm text-white/70">Unique Minters</div>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500">No mint data available</p>
        )}

        {/* Export Buttons */}
        {mintStats && mintStats.total_mints > 0 && (
          <div className="mt-5 pt-5 border-t border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/70">Export mint data and metadata:</p>
              {metadataRecordCount > 0 && (
                <p className="text-sm font-semibold text-[#2DE2FF]">
                  Metadata will contain <span className="text-lg">{metadataRecordCount.toLocaleString()}</span> record{metadataRecordCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleExportJSON}
                disabled={exporting}
                className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold transition-colors disabled:opacity-50 gap-2"
              >
                {exporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>📄</span>
                )}
                Export JSON
              </button>
              <button
                onClick={handleExportCSV}
                disabled={exporting}
                className="inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:text-white transition-colors disabled:opacity-50 gap-2"
              >
                {exporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>📊</span>
                )}
                Export CSV
              </button>
              <button
                onClick={handleExportRawFiles}
                disabled={exporting}
                className="inline-flex h-10 px-5 items-center rounded-full bg-[#FF2BD6] text-[#0a0a0c] text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-50 gap-2"
              >
                {exporting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>📦</span>
                )}
                Export Raw Files
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Compression Check Section */}
      <div className="rounded-2xl border border-white/[0.1] bg-[#131318] p-6">
        <h3 className="font-bold text-white mb-5 flex items-center gap-2">
          📦 Compression check
        </h3>

        {/* Compression Settings - At the top */}
        <div className="rounded-xl border border-white/[0.08] bg-[#0c0c10] p-5 mb-5">
          <h4 className="font-semibold text-white mb-4">Compression Settings</h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Compression Format
              </label>
              <select
                value={compressionFormat}
                onChange={(e) => setCompressionFormat(e.target.value as 'jpg' | 'png' | 'webp')}
                className="w-full px-4 py-3 border border-white/[0.1] rounded-xl bg-[#131318] text-white focus:border-[#2DE2FF] focus:outline-none focus:ring-2 focus:ring-[#2DE2FF]/20"
              >
                <option value="webp">WebP (Recommended - Best compression)</option>
                <option value="jpg">JPEG (Good compression, widely supported)</option>
                <option value="png">PNG (Lossless, larger file size)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Compression Quality: {compressionQuality !== '' && compressionQuality !== null ? `${compressionQuality}%` : 'Not set'}
              </label>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={compressionQuality !== '' && compressionQuality !== null ? compressionQuality : 100}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    // Only convert to empty if user sets to 100 AND it wasn't originally set in collection
                    const wasOriginallySet = collection?.compression_quality !== null && collection?.compression_quality !== undefined
                    if (val === 100 && !wasOriginallySet) {
                      setCompressionQuality('')
                    } else {
                      setCompressionQuality(val)
                    }
                  }}
                  className="flex-1"
                />
                <button
                  onClick={() => setCompressionQuality(75)}
                  className="px-3 py-1 text-xs rounded-full bg-[#2DE2FF]/10 text-[#2DE2FF] hover:bg-[#2DE2FF]/20 border border-[#2DE2FF]/20 font-semibold transition-colors"
                  title="Suggested: 75-90% quality"
                >
                  75%
                </button>
                <button
                  onClick={() => setCompressionQuality(90)}
                  className="px-3 py-1 text-xs rounded-full bg-[#2DE2FF]/10 text-[#2DE2FF] hover:bg-[#2DE2FF]/20 border border-[#2DE2FF]/20 font-semibold transition-colors"
                  title="Suggested: 75-90% quality"
                >
                  90%
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Image Dimensions (Width × Height)
              </label>
              <div className="flex gap-2 items-center mb-2">
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
                  className="w-24 px-3 py-2 border border-white/[0.1] rounded-xl bg-[#131318] text-white focus:border-[#2DE2FF] focus:outline-none placeholder:text-zinc-600"
                  placeholder="Width"
                />
                <span className="text-white">×</span>
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
                  className="w-24 px-3 py-2 border border-white/[0.1] rounded-xl bg-[#131318] text-white focus:border-[#2DE2FF] focus:outline-none placeholder:text-zinc-600"
                  placeholder="Height"
                />
                <span className="text-white text-sm">px</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCompressionDimensions(500)}
                  className="px-3 py-1 text-xs rounded-full bg-[#2DE2FF]/10 text-[#2DE2FF] hover:bg-[#2DE2FF]/20 border border-[#2DE2FF]/20 font-semibold transition-colors"
                  title="Suggested: 500-650 dimensions"
                >
                  500×500
                </button>
                <button
                  onClick={() => setCompressionDimensions(650)}
                  className="px-3 py-1 text-xs rounded-full bg-[#2DE2FF]/10 text-[#2DE2FF] hover:bg-[#2DE2FF]/20 border border-[#2DE2FF]/20 font-semibold transition-colors"
                  title="Suggested: 500-650 dimensions"
                >
                  650×650
                </button>
              </div>
            </div>

            {/* Estimated File Size */}
            {compressionDimensions !== '' && compressionDimensions !== null && typeof compressionDimensions === 'number' && (
              <div className="rounded-xl border border-[#2DE2FF]/25 bg-[#2DE2FF]/[0.06] p-4">
                {(() => {
                  const pixels = compressionDimensions * compressionDimensions
                  const quality = compressionQuality !== '' && compressionQuality !== null ? compressionQuality : 100
                  
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
                  
                  // Increase baseline by 10% to account for underestimation, then another 15%
                  const adjustedBase = baseEstimatedKB * 1.1 * 1.15
                  
                  // Lower bound: adjusted base (typical images)
                  // Upper bound: adjusted base * 1.5 (bright/colorful images compress less efficiently)
                  const lowerKB = Math.max(10, Math.round(adjustedBase))
                  const upperKB = Math.max(10, Math.round(adjustedBase * 1.5))
                  
                  const formatName = compressionFormat === 'jpg' ? 'JPEG' : compressionFormat.toUpperCase()
                  
                  return (
                    <div>
                      <p className="text-sm font-medium text-[#2DE2FF]">
                        Estimated file size: <span className="font-bold">{lowerKB}–{upperKB} KB</span> ({formatName})
                      </p>
                      <p className="text-xs text-[#2DE2FF] mt-1">
                        Range accounts for typical images (lower) to bright/colorful images (upper)
                      </p>
                      {compressionFormat === 'png' && (
                        <p className="text-xs text-[#2DE2FF] mt-1">
                          PNG is lossless but produces larger files than compressed formats.
                        </p>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            <button
              onClick={handleRecompress}
              disabled={recompressing || (!compressionQuality && !compressionDimensions && !compressionTargetKB)}
              className="hg-btn-glow w-full inline-flex h-11 px-6 items-center justify-center rounded-full bg-[#FF2BD6] text-[#0a0a0c] text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              {recompressing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recompressing...
                </>
              ) : (
                <>🔄 Recompress All NFTs</>
              )}
            </button>

            {recompressing && recompressProgress.total > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm text-white/70 mb-2">
                  <span>Progress</span>
                  <span>{recompressProgress.current} / {recompressProgress.total}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-[#FF2BD6] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(recompressProgress.current / recompressProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* File Size Summary - Auto-loaded */}
        {checkingSizes ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-zinc-500">
              <div className="w-5 h-5 border-2 border-[#2DE2FF] border-t-transparent rounded-full animate-spin" />
              Checking file sizes...
            </div>
          </div>
        ) : sizeCheckResult ? (
          <div className="space-y-4">
            {/* Preview Image with Comparison Slider */}
            {previewImageUrl && (
              <div className="rounded-xl border border-white/[0.08] bg-[#0c0c10] p-4">
                <p className="text-sm font-semibold text-white mb-3">
                  Image comparison: {previewOriginalUrl ? 'Original vs compressed' : 'Compressed preview'}
                </p>
                {previewOriginalUrl ? (
                  <div className="relative border border-white/[0.1] rounded-xl overflow-hidden bg-[#131318] mx-auto" style={{ aspectRatio: '1', maxWidth: '225px', maxHeight: '225px' }}>
                    {/* Compressed Image (Background) */}
                    <img
                      src={previewImageUrl}
                      alt="Compressed"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                    
                    {/* Original Image (Clipped) */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        clipPath: `inset(0 ${100 - comparisonSlider}% 0 0)`
                      }}
                    >
                      <img
                        src={previewOriginalUrl}
                        alt="Original"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute top-2 right-2 bg-[#2DE2FF]/90 text-white text-xs px-2 py-1 rounded font-semibold">
                        Original
                      </div>
                    </div>
                    
                    {/* Slider Handle */}
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-[#2DE2FF] cursor-ew-resize z-10 shadow-lg"
                      style={{ left: `${comparisonSlider}%`, transform: 'translateX(-50%)' }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        const container = e.currentTarget.parentElement
                        if (!container) return
                        const handleMove = (moveEvent: MouseEvent) => {
                          const rect = container.getBoundingClientRect()
                          const newX = moveEvent.clientX - rect.left
                          const percentage = Math.max(0, Math.min(100, (newX / rect.width) * 100))
                          setComparisonSlider(percentage)
                        }
                        const handleUp = () => {
                          document.removeEventListener('mousemove', handleMove)
                          document.removeEventListener('mouseup', handleUp)
                        }
                        document.addEventListener('mousemove', handleMove)
                        document.addEventListener('mouseup', handleUp)
                      }}
                    >
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#2DE2FF] rounded-full border-2 border-[#0a0a0c] shadow-lg flex items-center justify-center">
                        <div className="flex gap-0.5">
                          <div className="w-0.5 h-2 bg-[#131318]"></div>
                          <div className="w-0.5 h-2 bg-[#131318]"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Labels */}
                    <div className="absolute bottom-2 left-2 bg-[#2DE2FF]/90 text-[#0a0a0c] text-xs px-2 py-1 rounded-full font-semibold">
                      Compressed
                    </div>
                  </div>
                ) : (
                  <div 
                    className="cursor-pointer border border-white/[0.1] rounded-xl overflow-hidden bg-[#131318] hover:border-[#2DE2FF]/40 transition-colors"
                    onClick={() => setShowImageModal(true)}
                  >
                    <img
                      src={previewImageUrl}
                      alt="Compressed preview"
                      className="w-full h-auto max-h-64 object-contain"
                      style={{ maxWidth: '100%' }}
                    />
                  </div>
                )}
                <p className="text-xs text-zinc-500 mt-2 text-center">
                  {previewOriginalUrl ? 'Drag slider to compare • Click to view full size' : 'Click to view full size'}
                </p>
              </div>
            )}
            {!sizeCheckResult.all_under_limit && (
              <div className="rounded-xl border border-[#FF2BD6]/30 bg-[#FF2BD6]/[0.06] p-4">
                <p className="font-bold text-[#FF2BD6] flex items-center gap-2">
                  ⚠️ Warning: {sizeCheckResult.exceeds_limit} file(s) exceed 200KB limit
                </p>
                <p className="text-sm text-white/70 mt-1">
                  These files need to be recompressed before launching. Use the compression settings above to adjust and recompress.
                </p>
              </div>
            )}

            <div className={`p-4 rounded-xl bg-[#0c0c10] border ${sizeCheckResult.all_under_limit ? 'border-[#2DE2FF]/30' : 'border-[#FF2BD6]/30'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-bold ${sizeCheckResult.all_under_limit ? 'text-[#2DE2FF]' : 'text-[#2DE2FF]'}`}>
                    {sizeCheckResult.all_under_limit ? '✅ All files under 200KB' : `⚠️ ${sizeCheckResult.exceeds_limit} file(s) exceed 200KB`}
                  </p>
                  <p className="text-sm text-white/70 mt-1">
                    {sizeCheckResult.summary.under_limit} under limit • {sizeCheckResult.summary.over_limit} over limit • 
                    Average: {sizeCheckResult.summary.average_size_kb.toFixed(1)} KB • 
                    Max: {sizeCheckResult.summary.max_size_kb.toFixed(1)} KB
                  </p>
                </div>
              </div>
            </div>

            {/* Size Summary Table with Pagination */}
            <div className="rounded-xl border border-white/[0.08] bg-[#0c0c10] p-4">
              <p className="text-sm font-semibold text-white mb-3">File size summary</p>
              <div className="max-h-60 overflow-y-auto mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.08]">
                      <th className="text-left py-2 px-2 text-white/70 font-semibold">Filename</th>
                      <th className="text-center py-2 px-2 text-white/70 font-semibold">Dimensions</th>
                      <th className="text-right py-2 px-2 text-white/70 font-semibold">Size (KB)</th>
                      <th className="text-center py-2 px-2 text-white/70 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sizeCheckResult.ordinals.map((ordinal) => {
                      const dims = imageDimensions[ordinal.id]
                      const ratio = dims ? (dims.width / dims.height).toFixed(2) : null
                      return (
                        <tr key={ordinal.id} className={`border-b border-white/[0.06] ${ordinal.exceeds_limit ? 'bg-[#FF2BD6]/[0.06]' : ''}`}>
                          <td className="py-2 px-2 text-white/70 font-mono text-xs">
                            {ordinal.filename || 'N/A'}
                          </td>
                          <td className="py-2 px-2 text-center text-white/70 text-sm">
                            {dims ? (
                              <span>
                                {dims.width}×{dims.height}
                                {ratio && <span className="text-white/50 ml-1">({ratio})</span>}
                              </span>
                            ) : (
                              <span className="text-white/50">Loading...</span>
                            )}
                          </td>
                          <td className={`py-2 px-2 text-right font-medium ${ordinal.exceeds_limit ? 'text-[#FF2BD6]' : 'text-white'}`}>
                            {ordinal.size_kb.toFixed(1)} KB
                          </td>
                          <td className="py-2 px-2 text-center">
                            {ordinal.exceeds_limit ? (
                              <span className="text-[#FF2BD6] font-semibold">⚠️ Over Limit</span>
                            ) : (
                              <span className="text-[#2DE2FF]">✓ OK</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {sizeCheckResult.pagination && sizeCheckResult.pagination.total_pages > 1 && (
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <p className="text-sm text-white/70">
                    Page {sizeCheckResult.pagination.page} of {sizeCheckResult.pagination.total_pages} 
                    ({sizeCheckResult.pagination.total_items} total)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSizeCheckPage(Math.max(1, sizeCheckPage - 1))}
                      disabled={sizeCheckPage === 1 || checkingSizes}
                      className="inline-flex h-9 px-4 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setSizeCheckPage(Math.min(sizeCheckResult.pagination.total_pages, sizeCheckPage + 1))}
                      disabled={sizeCheckPage >= sizeCheckResult.pagination.total_pages || checkingSizes}
                      className="inline-flex h-9 px-4 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Robinhood Chain Deployment - Show if not deployed yet */}
      {!collection.contract_address && !collection.candy_machine_address && (
        <div className="mb-6">
          <div className="rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-6 mb-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="text-4xl">🚀</div>
              <div>
                <h3 className="font-bold text-[#2DE2FF] text-xl mb-2">Deploy to Robinhood Chain first</h3>
                <p className="text-zinc-400 text-sm mb-3">
                  Before launching, deploy your collection as an ERC-721 via the platform factory.
                  Gas is paid in ETH on Robinhood Chain.
                </p>
                <div className="rounded-xl border border-white/[0.08] bg-[#131318] p-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-white/50">1.</span>
                    <span className="text-white/70">Connect an EVM wallet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/50">2.</span>
                    <span className="text-white/70">Deploy collection contract via factory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/50">3.</span>
                    <span className="text-white/70">Go live on the launchpad</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <SolanaDeploymentWizard
            collectionId={collection.id}
            onComplete={() => {
              toast.success('Collection deployed to Robinhood Chain!')
              window.location.reload()
            }}
          />
        </div>
      )}

      {/* Deployment Success - Show if deployed */}
      {(collection.contract_address || collection.candy_machine_address) && (
        <div className="rounded-2xl border border-[#2DE2FF]/30 bg-[#2DE2FF]/[0.06] p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">✅</div>
            <div>
              <h3 className="font-bold text-[#2DE2FF] text-xl mb-2">Deployed to Robinhood Chain</h3>
              <p className="text-zinc-400 text-sm mb-3">
                Your collection is deployed and ready to mint on Robinhood Chain.
              </p>
              <div className="rounded-xl border border-white/[0.08] bg-[#0c0c10] p-3 font-mono text-sm break-all">
                <span className="text-white/50">Contract:</span>{' '}
                <span className="text-[#2DE2FF]">{collection.contract_address || collection.candy_machine_address}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Launch Status */}
      {isLive ? (
        <div className="rounded-2xl border border-[#FF2BD6]/30 bg-[#FF2BD6]/[0.06] p-6">
          <h3 className="font-bold text-[#FF2BD6] mb-2">Collection is live</h3>
          <p className="text-zinc-400 text-sm mb-5">
            Your collection is currently live on the launchpad and visible to collectors. 
            Click below to end the live mint and remove it from the public launchpad.
          </p>
          <button
            onClick={onEndLiveMint}
            disabled={saving}
            className="inline-flex h-11 px-6 items-center rounded-full bg-[#FF2BD6] text-[#0a0a0c] text-sm font-bold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Ending...' : 'End live mint'}
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-6">
          <h3 className="font-bold text-white mb-2">Ready to launch</h3>
          <p className="text-zinc-400 text-sm mb-5">
            Once you launch, your collection will be live on the launchpad and collectors can start minting.
            {!collection.candy_machine_address && (
              <span className="block mt-2 text-[#FF2BD6] text-xs">
                You must deploy to Robinhood Chain first (see above)
              </span>
            )}
          </p>
          <button
            onClick={onLaunch}
            disabled={saving || collection.launch_status === 'live' || !collection.candy_machine_address}
            className="hg-btn-glow inline-flex h-11 px-6 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!collection.candy_machine_address 
              ? 'Deploy to Robinhood Chain First ↑' 
              : collection.launch_status === 'live' 
              ? 'Already Live' 
              : 'Launch Collection'}
          </button>
        </div>
      )}

      <div className="flex justify-between pt-6 border-t border-white/[0.06]">
        <button
          onClick={onBack}
          className="inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Image Modal with Comparison */}
      {showImageModal && previewImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-full max-h-full">
            {previewOriginalUrl ? (
              <div className="relative bg-[#0c0c10] rounded-2xl overflow-hidden border border-white/[0.1]" style={{ maxWidth: '450px', maxHeight: '450px', aspectRatio: '1' }}>
                {/* Compressed Image (Background) */}
                <img
                  src={previewImageUrl}
                  alt="Compressed"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                
                {/* Original Image (Clipped) */}
                <div 
                  className="absolute inset-0"
                  style={{
                    clipPath: `inset(0 ${100 - comparisonSlider}% 0 0)`
                  }}
                >
                  <img
                    src={previewOriginalUrl}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 right-4 bg-[#2DE2FF]/90 text-white text-sm px-3 py-1.5 rounded font-semibold">
                    Original
                  </div>
                </div>
                
                {/* Slider Handle */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-[#2DE2FF] cursor-ew-resize z-10 shadow-lg"
                  style={{ left: `${comparisonSlider}%`, transform: 'translateX(-50%)' }}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const container = e.currentTarget.parentElement
                    if (!container) return
                    const handleMove = (moveEvent: MouseEvent) => {
                      const rect = container.getBoundingClientRect()
                      const newX = moveEvent.clientX - rect.left
                      const percentage = Math.max(0, Math.min(100, (newX / rect.width) * 100))
                      setComparisonSlider(percentage)
                    }
                    const handleUp = () => {
                      document.removeEventListener('mousemove', handleMove)
                      document.removeEventListener('mouseup', handleUp)
                    }
                    document.addEventListener('mousemove', handleMove)
                    document.addEventListener('mouseup', handleUp)
                  }}
                >
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-[#2DE2FF] rounded-full border-2 border-[#0a0a0c] shadow-lg flex items-center justify-center">
                    <div className="flex gap-1">
                      <div className="w-0.5 h-3 bg-[#131318]"></div>
                      <div className="w-0.5 h-3 bg-[#131318]"></div>
                    </div>
                  </div>
                </div>
                
                {/* Labels */}
                <div className="absolute bottom-4 left-4 bg-[#2DE2FF]/90 text-[#0a0a0c] text-sm px-3 py-1.5 rounded-full font-semibold">
                  Compressed
                </div>
              </div>
            ) : (
              <img
                src={previewImageUrl}
                alt="Full size compressed image"
                className="max-w-[450px] max-h-[450px] w-auto h-auto object-contain"
                style={{ 
                  maxWidth: '450px',
                  maxHeight: '450px',
                  width: 'auto',
                  height: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
