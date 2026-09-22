'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { BrandLoader } from '@/components/brand-loader'
import { useWallet } from '@/lib/wallet/compatibility'

type Format = 'jpg' | 'png' | 'webp'

interface SizeOrdinal {
  id: string
  ordinal_number: number | null
  size_kb: number
  exceeds_limit: boolean
  has_compressed: boolean
  filename: string
  image_url: string
  original_image_url: string | null
}

interface SizeCheckResult {
  total: number
  exceeds_limit: number
  all_under_limit: boolean
  ordinals: SizeOrdinal[]
  pagination: {
    page: number
    limit: number
    total_pages: number
    total_items: number
  }
  summary: {
    under_limit: number
    over_limit: number
    average_size_kb: number
    max_size_kb: number
  }
}

export default function ExportOpenSeaPage() {
  const params = useParams()
  const collectionId = String(params.id || '')
  const { currentAddress } = useWallet()

  const [collectionName, setCollectionName] = useState('Collection')
  const [loading, setLoading] = useState(true)
  const [checkingSizes, setCheckingSizes] = useState(false)
  const [sizeCheckResult, setSizeCheckResult] = useState<SizeCheckResult | null>(null)
  const [sizeCheckPage, setSizeCheckPage] = useState(1)
  const [compressionQuality, setCompressionQuality] = useState<number | ''>(100)
  const [compressionDimensions, setCompressionDimensions] = useState<number | ''>(1024)
  const [compressionTargetKB, setCompressionTargetKB] = useState<number | ''>('')
  const [compressionFormat, setCompressionFormat] = useState<Format>('webp')
  const [qualityWasSet, setQualityWasSet] = useState(true)
  const [recompressing, setRecompressing] = useState(false)
  const [recompressProgress, setRecompressProgress] = useState({ current: 0, total: 0 })
  const [imageDimensions, setImageDimensions] = useState<Record<string, { width: number; height: number }>>({})
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleCheckSizes = useCallback(async (page: number = 1) => {
    setCheckingSizes(true)
    try {
      const res = await fetch(`/api/collections/${collectionId}/ordinals/check-sizes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, limit: 50 }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to check sizes')
      }
      const data = await res.json()
      setSizeCheckResult(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to check file sizes')
    } finally {
      setCheckingSizes(false)
    }
  }, [collectionId])

  useEffect(() => {
    if (!collectionId || !currentAddress) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/collections/${collectionId}?wallet_address=${encodeURIComponent(currentAddress)}`
        )
        if (!res.ok) throw new Error('Collection not found')
        const data = await res.json()
        const collection = data.collection
        if (cancelled || !collection) return
        setCollectionName(collection.name || 'Collection')
        if (collection.compression_quality !== null && collection.compression_quality !== undefined) {
          setCompressionQuality(Number(collection.compression_quality))
          setQualityWasSet(true)
        } else {
          setCompressionQuality('')
          setQualityWasSet(false)
        }
        if (collection.compression_dimensions !== null && collection.compression_dimensions !== undefined) {
          setCompressionDimensions(Number(collection.compression_dimensions))
        } else {
          setCompressionDimensions('')
        }
        if (collection.compression_target_kb !== null && collection.compression_target_kb !== undefined) {
          setCompressionTargetKB(Number(collection.compression_target_kb))
        }
        const format = collection.compression_format
        if (format === 'jpg' || format === 'png' || format === 'webp') {
          setCompressionFormat(format)
        }
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : 'Failed to load collection')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [collectionId, currentAddress])

  useEffect(() => {
    if (collectionId) handleCheckSizes(1)
  }, [collectionId, handleCheckSizes])

  useEffect(() => {
    if (collectionId && sizeCheckPage > 1) handleCheckSizes(sizeCheckPage)
  }, [collectionId, sizeCheckPage, handleCheckSizes])

  useEffect(() => {
    if (!sizeCheckResult?.ordinals?.length) return
    const first = sizeCheckResult.ordinals[0]
    setPreviewImageUrl(first.image_url || null)
    const dimensions: Record<string, { width: number; height: number }> = {}
    let pending = sizeCheckResult.ordinals.length
    if (pending === 0) return
    sizeCheckResult.ordinals.forEach((ordinal) => {
      if (!ordinal.image_url) {
        pending -= 1
        return
      }
      const img = new Image()
      const done = () => {
        pending -= 1
        if (pending <= 0) setImageDimensions({ ...dimensions })
      }
      img.onload = () => {
        dimensions[ordinal.id] = { width: img.naturalWidth, height: img.naturalHeight }
        done()
      }
      img.onerror = done
      img.src = ordinal.image_url
    })
  }, [sizeCheckResult])

  const handleRecompress = async () => {
    if (!compressionQuality && !compressionDimensions && !compressionTargetKB) {
      toast.error('Set at least one compression setting')
      return
    }
    setRecompressing(true)
    setRecompressProgress({ current: 0, total: 0 })
    try {
      const res = await fetch(`/api/collections/${collectionId}/ordinals/recompress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compression_quality: compressionQuality !== '' ? compressionQuality : null,
          compression_dimensions: compressionDimensions !== '' ? compressionDimensions : null,
          compression_target_kb: compressionTargetKB !== '' ? compressionTargetKB : null,
          compression_format: compressionFormat,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to recompress')
      setRecompressProgress({ current: data.compressed || 0, total: data.total || 0 })
      toast.success(`Recompressed ${data.compressed || 0} of ${data.total || 0} images`)
      setTimeout(() => handleCheckSizes(sizeCheckPage), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to recompress')
    } finally {
      setRecompressing(false)
    }
  }

  const handleDownload = async () => {
    if (!currentAddress || exporting) return
    setExporting(true)
    toast.info('Building the OpenSea zip with these compression settings…')
    try {
      const res = await fetch(
        `/api/collections/${collectionId}/export-opensea?wallet_address=${encodeURIComponent(currentAddress)}`
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Export failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${collectionName.replace(/\s+/g, '-').toLowerCase()}-opensea.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('OpenSea export downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) return <BrandLoader label="Loading export" />

  if (!currentAddress) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <p className="text-zinc-400">Connect your wallet to review and export this collection.</p>
      </div>
    )
  }

  const estimated = (() => {
    if (compressionDimensions === '' || typeof compressionDimensions !== 'number') return null
    const pixels = compressionDimensions * compressionDimensions
    const quality = compressionQuality !== '' && compressionQuality !== null ? compressionQuality : 100
    let baseEstimatedKB = 0
    if (compressionFormat === 'webp') {
      baseEstimatedKB = (pixels * 1.4 * (0.4 + (quality / 100) * 0.6)) / 8 / 1024
    } else if (compressionFormat === 'jpg') {
      baseEstimatedKB = (pixels * 1.75 * (0.4 + (quality / 100) * 0.6)) / 8 / 1024
    } else {
      baseEstimatedKB = (pixels * 4.5) / 8 / 1024
    }
    const adjustedBase = baseEstimatedKB * 1.1 * 1.15
    return {
      lowerKB: Math.max(10, Math.round(adjustedBase)),
      upperKB: Math.max(10, Math.round(adjustedBase * 1.5)),
      formatName: compressionFormat === 'jpg' ? 'JPEG' : compressionFormat.toUpperCase(),
    }
  })()

  return (
    <div className="min-h-screen bg-[#0a0a0c] px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <Link
          href="/collections"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-[#2DE2FF] transition-colors"
        >
          ← Collections
        </Link>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2DE2FF]/70 mb-1">
            OpenSea export
          </p>
          <h1 className="text-2xl font-bold text-white">{collectionName}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Review compression, then download images and metadata.
          </p>
        </div>

        <div className="rounded-2xl border border-white/[0.1] bg-[#131318] p-5">
          <h2 className="font-semibold text-white mb-4">Compression Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Compression Format</label>
              <select
                value={compressionFormat}
                onChange={(e) => setCompressionFormat(e.target.value as Format)}
                className="w-full px-4 py-3 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white focus:border-[#2DE2FF] focus:outline-none"
              >
                <option value="webp">WebP (Recommended - Best compression)</option>
                <option value="jpg">JPEG (Good compression, widely supported)</option>
                <option value="png">PNG (Lossless, larger file size)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Compression Quality: {compressionQuality !== '' ? `${compressionQuality}%` : 'Not set'}
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={compressionQuality !== '' ? compressionQuality : 100}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (val === 100 && !qualityWasSet) setCompressionQuality('')
                    else setCompressionQuality(val)
                  }}
                  className="flex-1 accent-[#2DE2FF]"
                />
                <button type="button" onClick={() => setCompressionQuality(75)} className="px-3 py-1 text-xs rounded-full bg-[#2DE2FF]/10 text-[#2DE2FF] border border-[#2DE2FF]/20 font-semibold">75%</button>
                <button type="button" onClick={() => setCompressionQuality(90)} className="px-3 py-1 text-xs rounded-full bg-[#2DE2FF]/10 text-[#2DE2FF] border border-[#2DE2FF]/20 font-semibold">90%</button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Image Dimensions (Width × Height)</label>
              <div className="flex gap-2 items-center mb-2">
                <input
                  type="number"
                  min="1"
                  max="1024"
                  value={compressionDimensions}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '') setCompressionDimensions('')
                    else {
                      const numVal = parseInt(val)
                      if (!isNaN(numVal)) setCompressionDimensions(Math.max(1, Math.min(1024, numVal)))
                    }
                  }}
                  className="w-24 px-3 py-2 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white focus:border-[#2DE2FF] focus:outline-none"
                />
                <span className="text-white">×</span>
                <input
                  type="number"
                  min="1"
                  max="1024"
                  value={compressionDimensions}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === '') setCompressionDimensions('')
                    else {
                      const numVal = parseInt(val)
                      if (!isNaN(numVal)) setCompressionDimensions(Math.max(1, Math.min(1024, numVal)))
                    }
                  }}
                  className="w-24 px-3 py-2 border border-white/[0.1] rounded-xl bg-[#0c0c10] text-white focus:border-[#2DE2FF] focus:outline-none"
                />
                <span className="text-white text-sm">px</span>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCompressionDimensions(500)} className="px-3 py-1 text-xs rounded-full bg-[#2DE2FF]/10 text-[#2DE2FF] border border-[#2DE2FF]/20 font-semibold">500×500</button>
                <button type="button" onClick={() => setCompressionDimensions(650)} className="px-3 py-1 text-xs rounded-full bg-[#2DE2FF]/10 text-[#2DE2FF] border border-[#2DE2FF]/20 font-semibold">650×650</button>
              </div>
            </div>

            {estimated && (
              <div className="rounded-xl border border-[#2DE2FF]/25 bg-[#2DE2FF]/[0.06] p-4">
                <p className="text-sm font-medium text-[#2DE2FF]">
                  Estimated file size: <span className="font-bold">{estimated.lowerKB}–{estimated.upperKB} KB</span> ({estimated.formatName})
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleRecompress}
              disabled={recompressing || (!compressionQuality && !compressionDimensions && !compressionTargetKB)}
              className="w-full inline-flex h-11 items-center justify-center rounded-full bg-[#FF2BD6] text-[#0a0a0c] text-sm font-bold disabled:opacity-50"
            >
              {recompressing ? 'Recompressing…' : 'Recompress All NFTs'}
            </button>
            {recompressing && recompressProgress.total > 0 && (
              <p className="text-sm text-white/70 text-center">
                {recompressProgress.current} / {recompressProgress.total}
              </p>
            )}
          </div>
        </div>

        {checkingSizes && !sizeCheckResult ? (
          <div className="flex items-center justify-center py-8 text-zinc-500 gap-2">
            <div className="w-5 h-5 border-2 border-[#2DE2FF] border-t-transparent rounded-full animate-spin" />
            Checking file sizes…
          </div>
        ) : sizeCheckResult ? (
          <div className="space-y-4">
            {previewImageUrl && (
              <div className="rounded-xl border border-white/[0.08] bg-[#131318] p-4">
                <p className="text-sm font-semibold text-white mb-3">Image comparison: Compressed preview</p>
                <button type="button" onClick={() => setShowImageModal(true)} className="block w-full">
                  <img src={previewImageUrl} alt="Compressed preview" className="mx-auto max-h-64 object-contain rounded-xl" />
                </button>
                <p className="text-xs text-zinc-500 mt-2 text-center">Click to view full size</p>
              </div>
            )}

            {!sizeCheckResult.all_under_limit && (
              <div className="rounded-xl border border-[#FF2BD6]/30 bg-[#FF2BD6]/[0.06] p-4">
                <p className="font-bold text-[#FF2BD6]">
                  Warning: {sizeCheckResult.exceeds_limit} file(s) exceed 200KB limit
                </p>
                <p className="text-sm text-white/70 mt-1">
                  These files need to be recompressed before launching. Use the compression settings above to adjust and recompress.
                </p>
              </div>
            )}

            <div className={`p-4 rounded-xl bg-[#131318] border ${sizeCheckResult.all_under_limit ? 'border-[#2DE2FF]/30' : 'border-[#FF2BD6]/30'}`}>
              <p className="font-bold text-[#2DE2FF]">
                {sizeCheckResult.all_under_limit
                  ? 'All files under 200KB'
                  : `${sizeCheckResult.exceeds_limit} file(s) exceed 200KB`}
              </p>
              <p className="text-sm text-white/70 mt-1">
                {sizeCheckResult.summary.under_limit} under limit · {sizeCheckResult.summary.over_limit} over limit · Average: {Number(sizeCheckResult.summary.average_size_kb).toFixed(1)} KB · Max: {Number(sizeCheckResult.summary.max_size_kb).toFixed(1)} KB
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#131318] p-4">
              <p className="text-sm font-semibold text-white mb-3">File size summary</p>
              <div className="max-h-72 overflow-y-auto">
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
                        <tr key={ordinal.id} className="border-b border-white/[0.06]">
                          <td className="py-2 px-2 text-white/70 font-mono text-xs">{ordinal.filename || 'N/A'}</td>
                          <td className="py-2 px-2 text-center text-white/70 text-sm">
                            {dims ? `${dims.width}×${dims.height}${ratio ? ` (${ratio})` : ''}` : '…'}
                          </td>
                          <td className={`py-2 px-2 text-right font-medium ${ordinal.exceeds_limit ? 'text-[#FF2BD6]' : 'text-white'}`}>
                            {Number(ordinal.size_kb).toFixed(1)} KB
                          </td>
                          <td className="py-2 px-2 text-center">
                            {ordinal.exceeds_limit ? (
                              <span className="text-[#FF2BD6] font-semibold">Over Limit</span>
                            ) : (
                              <span className="text-[#2DE2FF]">OK</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {sizeCheckResult.pagination?.total_pages > 1 && (
                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 mt-3">
                  <p className="text-sm text-white/70">
                    Page {sizeCheckResult.pagination.page} of {sizeCheckResult.pagination.total_pages}
                  </p>
                  <div className="flex gap-2">
                    <button type="button" disabled={sizeCheckPage === 1} onClick={() => setSizeCheckPage((p) => Math.max(1, p - 1))} className="h-9 px-4 rounded-full border border-white/[0.1] text-sm text-zinc-300 disabled:opacity-50">Previous</button>
                    <button type="button" disabled={sizeCheckPage >= sizeCheckResult.pagination.total_pages} onClick={() => setSizeCheckPage((p) => p + 1)} className="h-9 px-4 rounded-full border border-white/[0.1] text-sm text-zinc-300 disabled:opacity-50">Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleDownload}
          disabled={exporting}
          className="w-full inline-flex h-12 items-center justify-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-50"
        >
          {exporting ? 'Building zip…' : 'Download OpenSea zip'}
        </button>
      </div>

      {showImageModal && previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowImageModal(false)}>
          <img src={previewImageUrl} alt="Full size" className="max-h-[90vh] max-w-full object-contain" />
        </div>
      )}
    </div>
  )
}
