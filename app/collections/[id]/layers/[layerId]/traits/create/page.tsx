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

export default function CreateTraitPage() {
  const params = useParams()
  const router = useRouter()
  const [layer, setLayer] = useState<Layer | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [traitPrompt, setTraitPrompt] = useState('')
  const [rarityWeight, setRarityWeight] = useState(40)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [traitSourceTab, setTraitSourceTab] = useState<'prompt' | 'reference'>('prompt')
  const [referenceImage, setReferenceImage] = useState<File | null>(null)
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

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
      }
    } catch (error) {
      console.error('Error loading layer:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeReferenceImage = async () => {
    if (!referenceImage) {
      toast.error('Please upload a reference image first')
      return
    }
    setAnalyzing(true)
    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('Failed to read image'))
        reader.readAsDataURL(referenceImage)
      })

      const res = await fetch('/api/ai/trait-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl,
          layerName: layer?.name,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to analyze image')

      const r = data?.result || {}
      if (typeof r.name === 'string' && r.name.trim()) setName(r.name)
      if (typeof r.description === 'string' && r.description.trim()) setDescription(r.description)

      toast.success('Reference image analyzed! Review the auto-filled name and description.')
    } catch (e) {
      console.error('Trait analysis failed:', e)
      toast.error('Trait analysis failed', { description: e instanceof Error ? e.message : 'Unknown error' })
    } finally {
      setAnalyzing(false)
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
      const response = await fetch(`/api/layers/${params.layerId}/traits`, {
        method: 'POST',
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
        toast.error('Error creating trait', { description: error.error })
      }
    } catch (error) {
      console.error('Error creating trait:', error)
      toast.error('Failed to create trait')
    } finally {
      setSaving(false)
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
          <Link href={`/collections/${params.id}`} className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold mt-4">
            Back to collection
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Create trait"
        subtitle={`Add a trait to "${layer.name}"`}
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
        <ToolPanel title="Trait details">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="inline-flex gap-1 p-1 rounded-full bg-[#0c0c10] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => setTraitSourceTab('prompt')}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  traitSourceTab === 'prompt' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                }`}
              >
                Prompt-based
              </button>
              <button
                type="button"
                onClick={() => setTraitSourceTab('reference')}
                className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  traitSourceTab === 'reference' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
                }`}
              >
                Reference image
              </button>
            </div>

            {traitSourceTab === 'prompt' ? (
              <ToolTip>
                Enter a name and description manually. The description is used when generating similar images.
              </ToolTip>
            ) : (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-white">Auto-fill from reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-start">
                  <div className="rounded-xl border border-white/[0.1] bg-[#0c0c10] overflow-hidden">
                    {referenceImagePreview ? (
                      <img src={referenceImagePreview} alt="Reference preview" className="w-full h-[160px] object-cover" />
                    ) : (
                      <div className="w-full h-[160px] flex items-center justify-center text-zinc-600 text-sm">
                        Upload an image
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        id="referenceImageUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null
                          setReferenceImage(f)
                          if (f) {
                            const url = URL.createObjectURL(f)
                            setReferenceImagePreview(url)
                          } else {
                            setReferenceImagePreview(null)
                          }
                          e.currentTarget.value = ''
                        }}
                      />
                      <label
                        htmlFor="referenceImageUpload"
                        className="hg-btn-glow inline-flex h-9 px-4 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold cursor-pointer"
                      >
                        Upload reference
                      </label>
                      <button
                        type="button"
                        onClick={analyzeReferenceImage}
                        disabled={!referenceImage || analyzing}
                        className="inline-flex h-9 px-4 items-center rounded-full border border-[#FF2BD6]/35 text-[#FF2BD6] text-sm font-semibold hover:bg-[#FF2BD6]/10 disabled:opacity-50 transition-colors"
                      >
                        {analyzing ? <BrandLoader variant="inline" label="Analyzing" /> : 'Analyze & auto-fill'}
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Upload a single image that represents this trait.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl bg-[#0c0c10] border border-white/[0.1] px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none"
                  placeholder="Enter trait description"
                  rows={3}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Generation prompt (optional)</label>
                <textarea
                  value={traitPrompt}
                  onChange={(e) => setTraitPrompt(e.target.value)}
                  className="w-full rounded-xl bg-[#0c0c10] border border-white/[0.1] px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none"
                  placeholder="Exact prompt text for this trait. Leave blank to use the description."
                  rows={3}
                />
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
                    <option value="40">Common (40)</option>
                    <option value="25">Rare (25)</option>
                    <option value="15">Epic (15)</option>
                    <option value="2">Legendary (2)</option>
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
                {saving ? <BrandLoader variant="inline" label="Creating" /> : 'Create trait'}
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
