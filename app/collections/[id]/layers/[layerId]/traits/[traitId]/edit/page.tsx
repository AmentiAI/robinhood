'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { PageHeader } from '@/components/page-header'
import { BrandLoader } from '@/components/brand-loader'
import { ToolWorkspace, ToolPanel } from '@/components/tool-workspace'

interface Trait {
  id: string
  name: string
  description?: string
  trait_prompt?: string
  rarity_weight: number
  layer_id: string
  layer_name: string
  collection_id: string
  collection_name: string
  created_at: string
  updated_at: string
}

export default function EditTraitPage() {
  const params = useParams()
  const router = useRouter()
  const [trait, setTrait] = useState<Trait | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [traitPrompt, setTraitPrompt] = useState('')
  const [rarityWeight, setRarityWeight] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (params.traitId) {
      loadTrait()
    }
  }, [params.traitId])

  const loadTrait = async () => {
    try {
      const response = await fetch(`/api/traits/${params.traitId}`)
      if (response.ok) {
        const data = await response.json()
        setTrait(data.trait)
        setName(data.trait.name)
        setDescription(data.trait.description || '')
        setTraitPrompt(data.trait.trait_prompt || '')
        setRarityWeight(data.trait.rarity_weight)
      }
    } catch (error) {
      console.error('Error loading trait:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Trait name is required')
      return
    }

    setSaving(true)
    
    try {
      const response = await fetch(`/api/traits/${params.traitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          trait_prompt: traitPrompt.trim() || null,
          rarity_weight: rarityWeight,
        }),
      })

      if (response.ok) {
        router.push(`/collections/${params.id}/layers/${params.layerId}`)
      } else {
        const error = await response.json()
        toast.error('Error updating trait', { description: error.error })
      }
    } catch (error) {
      console.error('Error updating trait:', error)
      toast.error('Failed to update trait')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <BrandLoader label="Loading trait" />
  }

  if (!trait) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.1] bg-[#131318] p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Trait not found</h2>
          <Link href={`/collections/${params.id}/layers/${params.layerId}`} className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold mt-4">
            Back to layer
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Edit trait"
        subtitle={`Editing "${trait.name}" in "${trait.layer_name}"`}
        action={
          <Link
            href={`/collections/${params.id}/layers/${params.layerId}`}
            className="inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-200 hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-colors"
          >
            Back
          </Link>
        }
      />

      <ToolWorkspace className="!max-w-3xl">
        <ToolPanel title="Trait settings">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Trait name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-[#0c0c10] border border-white/[0.1] px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none"
                  placeholder="Enter trait name"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl bg-[#0c0c10] border border-white/[0.1] px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none"
                  placeholder="Enter trait description"
                  rows={4}
                  required
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Visual description used in AI image generation.
                </p>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Generation prompt</label>
                <textarea
                  value={traitPrompt}
                  onChange={(e) => setTraitPrompt(e.target.value)}
                  className="w-full rounded-xl bg-[#0c0c10] border border-white/[0.1] px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none"
                  placeholder="Exact prompt text sent to the image model for this trait"
                  rows={4}
                />
                <p className="text-xs text-zinc-500 mt-1.5">
                  Optional. Overrides the description in the generation prompt when set.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Rarity weight</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={rarityWeight}
                    onChange={(e) => setRarityWeight(parseInt(e.target.value) || 1)}
                    className="flex-1 rounded-xl bg-[#0c0c10] border border-white/[0.1] px-4 py-2.5 text-white focus:border-[#2DE2FF] focus:outline-none"
                  />
                  <select
                    value={rarityWeight}
                    onChange={(e) => setRarityWeight(parseInt(e.target.value))}
                    className="w-40 rounded-xl bg-[#0c0c10] border border-white/[0.1] px-3 py-2.5 text-white focus:border-[#2DE2FF] focus:outline-none"
                  >
                    <option value="40" className="bg-[#0a0a0c]">Common (40)</option>
                    <option value="25" className="bg-[#0a0a0c]">Rare (25)</option>
                    <option value="15" className="bg-[#0a0a0c]">Epic (15)</option>
                    <option value="2" className="bg-[#0a0a0c]">Legendary (2)</option>
                  </select>
                </div>
                <p className="text-xs text-zinc-500 mt-1.5">
                  Higher weight = more common. Lower weight = rarer.
                </p>
              </div>
            </div>

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
            </div>
          </form>
        </ToolPanel>
      </ToolWorkspace>
    </div>
  )
}
