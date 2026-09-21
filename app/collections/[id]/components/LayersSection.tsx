'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useWallet } from '@/lib/wallet/compatibility'
import { generateApiAuth } from '@/lib/wallet/api-auth'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useRouter } from 'next/navigation'

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
        toast.success(`Successfully created ${data.layersCreated} layers with ${data.totalTraits} traits!`)
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
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 pt-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2DE2FF]/70 mb-1">
            Structure
          </p>
          <h2 className="text-xl font-bold text-white">Layers</h2>
        </div>
        <Link
          href={`/collections/${collectionId}/layers/create`}
          className="hg-btn-glow inline-flex h-9 px-4 items-center justify-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
        >
          Add layer
        </Link>
      </div>

      {layers.length > 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#131318] overflow-hidden shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
          <div className="divide-y divide-white/[0.06]">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => handleDeleteClick(layer.id, layer.name)}
                    className="h-8 w-8 shrink-0 rounded-full border border-red-500/25 text-red-400 hover:border-red-500/50 flex items-center justify-center transition-colors"
                    title="Delete layer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{layer.name}</p>
                    <p className="text-xs text-zinc-500">
                      {layer.trait_count} traits · order {layer.display_order}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 sm:justify-end pl-11 sm:pl-0">
                  <Link
                    href={`/collections/${collectionId}/layers/${layer.id}`}
                    className="hg-btn-glow inline-flex h-8 px-3.5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-xs font-bold hover:bg-[#7aefff] transition-colors"
                  >
                    Traits
                  </Link>
                  <Link
                    href={`/collections/${collectionId}/layers/${layer.id}/edit`}
                    className="inline-flex h-8 px-3.5 items-center rounded-full border border-white/[0.1] text-xs font-semibold text-zinc-300 hover:border-[#FF2BD6]/40 hover:text-[#FF2BD6] transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/[0.12] bg-[#131318]/60 px-6 py-10 text-center">
          <p className="text-sm text-zinc-400 mb-4">
            No layers yet. Add one manually or auto-generate a starter set.
          </p>
          <button
            onClick={handleLazyMode}
            disabled={generatingLazy || !currentAddress}
            className="hg-btn-glow inline-flex h-10 px-5 items-center gap-2 rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold hover:bg-[#7aefff] transition-colors disabled:opacity-50"
          >
            {generatingLazy ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              'Auto-generate layers & traits'
            )}
          </button>
          <p className="text-xs text-zinc-600 mt-3 max-w-md mx-auto">
            Creates 6 layers (Background, Skin, Eyes, Mouth, Outfit, Headwear) with 8 AI traits each
          </p>
        </div>
      )}

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
