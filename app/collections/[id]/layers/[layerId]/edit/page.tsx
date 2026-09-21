'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { BrandLoader } from '@/components/brand-loader'
import { ToolWorkspace, ToolPanel, ToolTip } from '@/components/tool-workspace'

interface Layer {
  id: string
  name: string
  display_order: number
  created_at: string
  updated_at: string
  collection_id: string
  collection_name: string
}

export default function EditLayerPage() {
  const params = useParams()
  const router = useRouter()
  const [layer, setLayer] = useState<Layer | null>(null)
  const [name, setName] = useState('')
  const [displayOrder, setDisplayOrder] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params.layerId) {
      loadLayer()
    }
  }, [params.layerId])

  const loadLayer = async () => {
    try {
      const response = await fetch(`/api/layers/${params.layerId}`)
      if (response.ok) {
        const data = await response.json()
        setLayer(data.layer)
        setName(data.layer.name)
        setDisplayOrder(data.layer.display_order)
      }
    } catch (error) {
      console.error('Error loading layer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Layer name is required')
      return
    }

    setSaving(true)
    
    try {
      const response = await fetch(`/api/layers/${params.layerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          display_order: displayOrder,
        }),
      })

      if (response.ok) {
        router.push(`/collections/${params.id}/layers/${params.layerId}`)
      } else {
        const error = await response.json()
        toast.error('Error updating layer', { description: error.error })
      }
    } catch (error) {
      console.error('Error updating layer:', error)
      toast.error('Failed to update layer')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this layer? This will also delete all traits in this layer.')) {
      try {
        const response = await fetch(`/api/layers/${params.layerId}`, {
          method: 'DELETE'
        })
        if (response.ok) {
          router.push(`/collections/${params.id}`)
        }
      } catch (error) {
        console.error('Error deleting layer:', error)
        toast.error('Failed to delete layer')
      }
    }
  }

  if (loading) {
    return <BrandLoader label="Loading layer" />
  }

  if (!layer) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.1] bg-[#131318] p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Layer not found</h2>
          <Link
            href={`/collections/${params.id}`}
            className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold mt-4"
          >
            Back to collection
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Edit layer"
        subtitle={`Update "${layer.name}" settings`}
        action={
          <Link
            href={`/collections/${params.id}/layers/${params.layerId}`}
            className="inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-200 hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-colors"
          >
            Back to layer
          </Link>
        }
      />

      <ToolWorkspace>
        <ToolPanel title="Layer settings" subtitle="Name and stack order">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Layer name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-[#0c0c10] border border-white/[0.1] px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none transition-colors"
                  placeholder="Enter layer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Display order
                </label>
                <input
                  type="number"
                  min="1"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl bg-[#0c0c10] border border-white/[0.1] px-4 py-2.5 text-white focus:border-[#2DE2FF] focus:outline-none transition-colors"
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Lower numbers appear first in the layer stack
                </p>
              </div>
            </div>

            <ToolTip tone="magenta">
              Deleting a layer also removes every trait inside it. This cannot be undone.
            </ToolTip>

            <div className="flex flex-wrap gap-3 pt-2 border-t border-white/[0.06]">
              <button
                type="submit"
                disabled={saving}
                className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-50"
              >
                {saving ? <BrandLoader variant="inline" label="Saving" /> : 'Save changes'}
              </button>
              <Link
                href={`/collections/${params.id}/layers/${params.layerId}`}
                className="inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex h-10 px-5 items-center rounded-full border border-red-500/25 text-sm font-semibold text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-colors ml-auto"
              >
                Delete layer
              </button>
            </div>
          </form>
        </ToolPanel>
      </ToolWorkspace>
    </div>
  )
}
