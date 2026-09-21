'use client'

import Image from 'next/image'
import { GeneratedOrdinal } from '../types'
import { toast } from 'sonner'

interface NftCardProps {
  nft: GeneratedOrdinal
  displayNumber: number
  imageSliders: Record<string, number>
  setImageSliders: React.Dispatch<React.SetStateAction<Record<string, number>>>
  expandedTraits: Record<string, boolean>
  setExpandedTraits: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  showPromptId: string | null
  setShowPromptId: (id: string | null) => void
  flippingNft: string | null
  onDownload: (nft: GeneratedOrdinal) => void
  onDelete: (id: string) => void
  onFlip: (id: string) => void
  onShowCompression: (nft: GeneratedOrdinal) => void
  collectionArtStyle?: string | null
}

export function NftCard({
  nft,
  displayNumber,
  imageSliders,
  setImageSliders,
  expandedTraits,
  setExpandedTraits,
  showPromptId,
  setShowPromptId,
  flippingNft,
  onDownload,
  onDelete,
  onFlip,
  onShowCompression,
  collectionArtStyle,
}: NftCardProps) {
  const hasCompressed =
    nft.compressed_image_url &&
    nft.compressed_image_url !== null &&
    nft.compressed_image_url.trim() !== '' &&
    nft.compressed_image_url !== nft.image_url
  const compressedImageUrl = hasCompressed ? nft.compressed_image_url! : nft.image_url
  const artStyle = nft.art_style || collectionArtStyle
  const slider = imageSliders[nft.id] ?? 50

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#131318] hg-card shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
      {artStyle ? (
        <div className="px-3 py-2 border-b border-white/[0.06] bg-gradient-to-r from-[#2DE2FF]/10 via-transparent to-[#FF2BD6]/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2DE2FF] mb-0.5">
            Art style
          </p>
          <p className="text-xs text-zinc-200 truncate" title={artStyle}>
            {artStyle}
          </p>
        </div>
      ) : null}

      <div className="relative aspect-square bg-[#0a0a0c] overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute inset-0">
            <Image src={compressedImageUrl} alt={`Compressed #${displayNumber}`} fill className="object-cover" />
            <div
              className={`absolute top-2 left-2 text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                hasCompressed
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-[#FF2BD6]/90 text-white'
              }`}
            >
              {hasCompressed ? 'Compressed' : 'Original only'}
            </div>
          </div>
          <div
            className="absolute inset-0"
            style={{ clipPath: `inset(0 ${100 - slider}% 0 0)` }}
          >
            <Image src={nft.image_url} alt={`Original #${displayNumber}`} fill className="object-cover" />
            <div className="absolute top-2 right-2 bg-[#2DE2FF]/90 text-[#0a0a0c] text-[9px] px-2 py-0.5 rounded-full font-bold">
              Original
            </div>
          </div>
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white cursor-ew-resize z-10"
            style={{ left: `${slider}%`, transform: 'translateX(-50%)' }}
            onMouseDown={(e) => {
              e.preventDefault()
              const container = e.currentTarget.parentElement
              if (!container) return
              const handleMove = (moveEvent: MouseEvent) => {
                const rect = container.getBoundingClientRect()
                const newX = moveEvent.clientX - rect.left
                const percentage = Math.max(0, Math.min(100, (newX / rect.width) * 100))
                setImageSliders((prev) => ({ ...prev, [nft.id]: percentage }))
              }
              const handleUp = () => {
                document.removeEventListener('mousemove', handleMove)
                document.removeEventListener('mouseup', handleUp)
              }
              document.addEventListener('mousemove', handleMove)
              document.addEventListener('mouseup', handleUp)
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#2DE2FF] border-2 border-[#0a0a0c] flex items-center justify-center">
              <div className="flex gap-0.5">
                <div className="w-0.5 h-2 bg-[#0a0a0c]" />
                <div className="w-0.5 h-2 bg-[#0a0a0c]" />
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-2.5 py-1.5 bg-black/70 text-[9px] sm:text-[10px] font-semibold text-zinc-300">
          <span>
            <span className="text-[#2DE2FF]">Orig </span>
            {nft.original_size_kb != null ? `${Number(nft.original_size_kb).toFixed(1)} KB` : '—'}
          </span>
          <span>
            <span className="text-emerald-400">Comp </span>
            {nft.compressed_size_kb != null ? `${Number(nft.compressed_size_kb).toFixed(1)} KB` : '—'}
          </span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex justify-between items-center gap-2">
          <h3 className="font-semibold text-sm text-white truncate">#{displayNumber}</h3>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onDownload(nft)}
              className="h-7 w-7 rounded-full border border-white/[0.1] text-zinc-400 hover:text-[#2DE2FF] hover:border-[#2DE2FF]/40 text-xs transition-colors"
              title="Download"
            >
              ↓
            </button>
            <button
              onClick={() => onDelete(nft.id)}
              className="h-7 w-7 rounded-full border border-red-500/25 text-red-400 hover:border-red-500/50 text-[10px] font-semibold transition-colors"
              title="Delete"
            >
              Del
            </button>
          </div>
        </div>

        <button
          onClick={() => onShowCompression(nft)}
          className="hg-btn-glow w-full h-8 rounded-full bg-gradient-to-r from-[#2DE2FF] to-[#7aefff] text-[#0a0a0c] text-xs font-bold"
        >
          {hasCompressed ? 'Compare compression' : 'View image'}
        </button>
        <button
          onClick={() => onFlip(nft.id)}
          disabled={flippingNft === nft.id}
          className="w-full h-8 rounded-full border border-[#FF2BD6]/35 text-[#FF2BD6] text-xs font-semibold hover:bg-[#FF2BD6]/10 hover:border-[#FF2BD6]/55 transition-all duration-200 disabled:opacity-50"
        >
          {flippingNft === nft.id ? 'Flipping…' : 'Flip horizontal'}
        </button>
        <button
          onClick={() => setShowPromptId(showPromptId === nft.id ? null : nft.id)}
          className="w-full h-8 rounded-full border border-white/[0.08] text-zinc-400 text-xs font-medium hover:text-white hover:border-white/16 transition-colors"
        >
          {showPromptId === nft.id ? 'Hide prompt' : 'View prompt'}
        </button>

        {showPromptId === nft.id && (
          <div className="p-2.5 rounded-xl bg-[#0c0c10] border border-white/[0.08] max-h-48 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[11px] font-semibold text-zinc-300">AI prompt</h4>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(nft.prompt || '')
                  toast.success('Copied!')
                }}
                className="text-[10px] font-semibold text-[#2DE2FF] hover:text-[#7aefff]"
              >
                Copy
              </button>
            </div>
            <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap font-mono leading-relaxed">
              {nft.prompt || 'No prompt available'}
            </pre>
          </div>
        )}

        {nft.traits && Object.keys(nft.traits).length > 0 && (
          <div className="rounded-xl border border-white/[0.08] overflow-hidden">
            <button
              onClick={() =>
                setExpandedTraits((prev) => ({ ...prev, [nft.id]: !prev[nft.id] }))
              }
              className="w-full flex items-center justify-between px-2.5 py-2 bg-[#0c0c10] hover:bg-white/[0.03] transition-colors text-left"
            >
              <span className="text-[11px] font-semibold text-zinc-300">Traits</span>
              <svg
                className={`w-3.5 h-3.5 text-zinc-500 transition-transform ${
                  expandedTraits[nft.id] ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {expandedTraits[nft.id] && (
              <div className="px-2.5 py-2 space-y-1 bg-[#131318]">
                {Object.entries(nft.traits).map(([layerName, trait]) => (
                  <div key={layerName} className="text-[10px]">
                    <span className="text-zinc-400 font-medium">{layerName}: </span>
                    <span className="text-zinc-200">{trait?.name || String(trait)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-zinc-600">
          {new Date(nft.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
