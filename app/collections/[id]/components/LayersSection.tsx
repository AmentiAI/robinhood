'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useWallet } from '@/lib/wallet/compatibility'
import { generateApiAuth } from '@/lib/wallet/api-auth'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useRouter } from 'next/navigation'
import { BrandLoader } from '@/components/brand-loader'

interface Layer {
  id: string
  name: string
  display_order: number
  trait_count: number
}

interface LayersSectionProps {
  collectionId: string
  layers: Layer[]
  onLayerDeleted?: () => void
}

export function LayersSection({ collectionId, layers, onLayerDeleted }: LayersSectionProps) {
  const { currentAddress, signMessage } = useWallet()
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ layerId: string; layerName: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [generatingLazy, setGeneratingLazy] = useState(false)

  const handleDeleteClick = (layerId: string, layerName: string) => {
    setShowDeleteConfirm({ layerId, layerName })
  }

  const handleDeleteConfirm = async () => {
    if (!showDeleteConfirm || !currentAddress) return

    setDeleting(true)
    try {
      const response = await fetch(
        `/api/layers/${showDeleteConfirm.layerId}?wallet_address=${encodeURIComponent(currentAddress)}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        if (onLayerDeleted) onLayerDeleted()
        else window.location.reload()
      } else {
        const error = await response.json()
        toast.error('Error deleting layer', { description: error.error || 'Unknown error' })
      }
    } catch (error) {
      console.error('Error deleting layer:', error)
      toast.error('Failed to delete layer. Please try again.')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(null)
    }
  }

  const handleLazyMode = async () => {
    if (!currentAddress) {
      toast.error('Please connect your wallet first')
      return
    }

    setGeneratingLazy(true)
    try {
      const auth = await generateApiAuth(currentAddress, signMessage)
      if (!auth) {
        toast.error('Signature required. Please sign the request with your wallet.')
        setGeneratingLazy(false)
        return
      }

      const response = await fetch(`/api/collections/${collectionId}/lazy-layers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(auth),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`Lazy Mode: created ${data.layersCreated} layers with ${data.totalTraits} traits!`)
        router.refresh()
        if (onLayerDeleted) onLayerDeleted()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to generate layers and traits')
      }
    } catch (error) {
      console.error('Error generating lazy layers:', error)
      toast.error('Failed to generate layers and traits. Please try again.')
    } finally {
      setGeneratingLazy(false)
    }
  }

  return (
    <>
      <section className="hg-rise rounded-2xl border border-white/[0.1] bg-[#131318] p-5 sm:p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2DE2FF]/70 mb-1">
              Structure
            </p>
            <h2 className="text-xl font-bold text-white tracking-tight">Layers & traits</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Build your stack manually or use Lazy Mode to auto-generate a starter set.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            {layers.length === 0 && (
              <button
                type="button"
                onClick={handleLazyMode}
                disabled={generatingLazy || !currentAddress}
                className="hg-btn-glow inline-flex h-10 px-5 items-center gap-2 rounded-full bg-gradient-to-r from-[#2DE2FF] via-[#A855F7] to-[#FF2BD6] text-[#0a0a0c] text-sm font-bold disabled:opacity-50"
                style={{ backgroundSize: '200% 100%', animation: generatingLazy ? undefined : 'hg-shimmer 5s linear infinite' }}
              >
                {generatingLazy ? (
                  <BrandLoader variant="inline" label="Lazy Mode" />
                ) : (
                  'Lazy Mode'
                )}
              </button>
            )}
            <Link
              href={`/collections/${collectionId}/layers/create`}
              className="hg-btn-glow inline-flex h-10 px-5 items-center justify-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
            >
              Add layer
            </Link>
          </div>
        </div>

        {layers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2DE2FF]/30 bg-[#0c0c10] px-6 py-10 text-center">
            <p className="text-base font-semibold text-white mb-2">No layers yet</p>
            <p className="text-sm text-zinc-400 mb-6 max-w-md mx-auto">
              Hit <span className="text-[#2DE2FF] font-semibold">Lazy Mode</span> to auto-create 6 layers
              (Background, Skin, Eyes, Mouth, Outfit, Headwear) with 8 AI traits each — or add a layer manually.
            </p>
            <button
              type="button"
              onClick={handleLazyMode}
              disabled={generatingLazy || !currentAddress}
              className="hg-btn-glow inline-flex h-12 px-7 items-center gap-2 rounded-full bg-gradient-to-r from-[#2DE2FF] via-[#A855F7] to-[#FF2BD6] text-[#0a0a0c] text-sm font-bold disabled:opacity-50"
              style={{ backgroundSize: '200% 100%', animation: generatingLazy ? undefined : 'hg-shimmer 5s linear infinite' }}
            >
              {generatingLazy ? (
                <>
                  <BrandLoader variant="inline" label="Generating" />
                </>
              ) : (
                'Run Lazy Mode'
              )}
            </button>
            {!currentAddress && (
              <p className="text-xs text-amber-400/90 mt-3">Connect your wallet to use Lazy Mode</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.08] bg-[#0c0c10] overflow-hidden">
            <div className="divide-y divide-white/[0.06]">
              {layers.map((layer, i) => (
                <div
                  key={layer.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors hg-rise"
                  style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-[#2DE2FF] tabular-nums">
                      {layer.display_order}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{layer.name}</p>
                      <p className="text-xs text-zinc-500">{layer.trait_count} traits</p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:justify-end pl-11 sm:pl-0">
                    <Link
                      href={`/collections/${collectionId}/layers/${layer.id}`}
                      className="hg-btn-glow inline-flex h-9 px-4 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-xs font-bold"
                    >
                      Traits
                    </Link>
                    <Link
                      href={`/collections/${collectionId}/layers/${layer.id}/edit`}
                      className="inline-flex h-9 px-4 items-center rounded-full border border-white/[0.1] text-xs font-semibold text-zinc-300 hover:border-[#FF2BD6]/40 hover:text-[#FF2BD6] transition-all"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(layer.id, layer.name)}
                      className="inline-flex h-9 px-3 items-center rounded-full border border-red-500/25 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete layer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Layer"
        message={
          showDeleteConfirm
            ? `Are you sure you want to delete "${showDeleteConfirm.layerName}"? This will also delete all ${
                layers.find((l) => l.id === showDeleteConfirm.layerId)?.trait_count || 0
              } trait${
                layers.find((l) => l.id === showDeleteConfirm.layerId)?.trait_count !== 1 ? 's' : ''
              } in this layer.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700"
        loading={deleting}
      />
    </>
  )
}
