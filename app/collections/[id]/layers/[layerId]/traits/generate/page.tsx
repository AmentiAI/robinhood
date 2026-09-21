'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useWallet } from '@/lib/wallet/compatibility'
import { useCreditCosts, calculateTraitCredits, formatCreditCost } from '@/lib/credits/use-credit-costs'
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

export default function GenerateTraitPage() {
  const params = useParams()
  const router = useRouter()
  const { isConnected, currentAddress } = useWallet()
  const { costs: creditCosts } = useCreditCosts()
  const [layer, setLayer] = useState<Layer | null>(null)
  const [theme, setTheme] = useState('')
  const [quantity, setQuantity] = useState(5)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedTraits, setGeneratedTraits] = useState<any[]>([])
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
      alert('Please upload a reference image first')
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
      if (typeof r.description === 'string' && r.description.trim()) {
        setTheme(r.description)
      }

      alert('Reference image analyzed! The description has been used as the generation theme. Adjust if needed.')
    } catch (e) {
      console.error('Trait analysis failed:', e)
      alert(e instanceof Error ? e.message : 'Trait analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !currentAddress) {
      alert('Please connect your wallet to generate traits')
      return
    }
    
    if (!currentAddress || currentAddress.trim() === '') {
      alert('Wallet address is not available. Please reconnect your wallet.')
      return
    }
    
    if (!theme.trim()) {
      alert('Please enter a theme')
      return
    }

    setGenerating(true)
    
    try {
      const creditsNeeded = calculateTraitCredits(quantity, creditCosts.trait_generation)
      
      const response = await fetch('/api/traits/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          layer_id: params.layerId,
          theme: theme.trim(),
          quantity: quantity,
          wallet_address: currentAddress.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const traitsPerCredit = Math.round(1 / creditCosts.trait_generation)
        const creditsDisplay = creditsNeeded % 1 === 0 ? creditsNeeded.toFixed(0) : creditsNeeded.toFixed(2)
        setGeneratedTraits(data.traits)
        window.dispatchEvent(new CustomEvent('refreshCredits'))
        alert(`Successfully generated ${data.count} trait${data.count > 1 ? 's' : ''}! ${creditsDisplay} credit${creditsNeeded !== 1 ? 's' : ''} deducted (1 credit = ${traitsPerCredit} traits).`)
        setTimeout(() => {
          router.push(`/collections/${params.id}/layers/${params.layerId}`)
        }, 1500)
      } else {
        const error = await response.json()
        alert(`Error generating traits: ${error.error}`)
      }
    } catch (error) {
      console.error('Error generating traits:', error)
      alert('Failed to generate traits')
    } finally {
      setGenerating(false)
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
        title="Generate AI traits"
        subtitle={`Create multiple traits for "${layer.name}"`}
        action={
          <Link
            href={`/collections/${params.id}/layers/${params.layerId}`}
            className="inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-200 hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-colors"
          >
            Back
          </Link>
        }
      />

      <ToolWorkspace>
        {generatedTraits.length === 0 ? (
          <ToolPanel title="Generation settings" subtitle="Theme and quantity">
            <form onSubmit={handleGenerate} className="space-y-5">
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
                  Enter a theme and AI will generate multiple trait variations.
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
                              setReferenceImagePreview(URL.createObjectURL(f))
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
                          className="inline-flex h-9 px-4 items-center rounded-full border border-[#FF2BD6]/35 text-[#FF2BD6] text-sm font-semibold hover:bg-[#FF2BD6]/10 disabled:opacity-50"
                        >
                          {analyzing ? <BrandLoader variant="inline" label="Analyzing" /> : 'Analyze & auto-fill'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Theme *</label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full rounded-xl bg-[#0c0c10] border border-white/[0.1] px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none"
                    placeholder="e.g., halloween, cyberpunk, medieval"
                    required
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">
                    AI will generate {quantity} {layer.name} traits based on this theme
                  </p>
                  <p className="text-xs text-[#A855F7] mt-1 font-semibold">
                    Cost: {calculateTraitCredits(quantity, creditCosts.trait_generation)} credit{calculateTraitCredits(quantity, creditCosts.trait_generation) > 1 ? 's' : ''} ({formatCreditCost(creditCosts.trait_generation, 'trait')})
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full rounded-xl bg-[#0c0c10] border border-white/[0.1] px-4 py-2.5 text-white focus:border-[#2DE2FF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-white/[0.06]">
                <button
                  type="submit"
                  disabled={generating}
                  className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-50"
                >
                  {generating ? <BrandLoader variant="inline" label={`Generating ${quantity}`} /> : `Generate ${quantity} traits`}
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
        ) : (
          <ToolPanel title={`Generated ${generatedTraits.length} traits`}>
            <div className="space-y-4">
              {generatedTraits.map((trait, index) => (
                <div key={index} className="rounded-xl border border-white/[0.08] bg-[#0c0c10] p-4">
                  <div className="font-semibold text-white">{trait.name}</div>
                  <div className="text-zinc-500 text-sm mt-1">{trait.description}</div>
                </div>
              ))}
              <p className="text-zinc-500 text-sm">Redirecting back to layer page…</p>
            </div>
          </ToolPanel>
        )}
      </ToolWorkspace>
    </div>
  )
}
