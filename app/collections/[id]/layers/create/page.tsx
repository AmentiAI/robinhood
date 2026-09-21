'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useWallet } from '@/lib/wallet/compatibility'
import { PageHeader } from '@/components/page-header'
import { BrandLoader } from '@/components/brand-loader'
import { ToolWorkspace, ToolPanel, ToolTip } from '@/components/tool-workspace'

export default function CreateLayerPage() {
  const params = useParams()
  const router = useRouter()
  const { currentAddress, isConnected } = useWallet()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [allShownSuggestions, setAllShownSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  if (!isConnected || !currentAddress) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.1] bg-[#131318] p-8 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Wallet required</h2>
          <p className="text-zinc-500 mb-6 text-sm leading-relaxed">
            Connect your wallet to create layers.
          </p>
          <Link
            href={`/collections/${params.id}`}
            className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
          >
            Back to collection
          </Link>
        </div>
      </div>
    )
  }

  const handleGetSuggestions = async (ignoreList: string[] = []) => {
    if (!currentAddress) {
      toast.error('Please connect your wallet first')
      return
    }

    setLoadingSuggestions(true)
    setShowSuggestions(true)
    
    try {
      const response = await fetch(`/api/collections/${params.id}/layers/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: currentAddress,
          ignore_list: ignoreList,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newSuggestions = data.suggestions || []
        setSuggestions(newSuggestions)
        setAllShownSuggestions(prev => [...prev, ...newSuggestions])
      } else {
        const error = await response.json()
        toast.error('Error getting suggestions', { description: error.error })
        setShowSuggestions(false)
      }
    } catch (error) {
      console.error('Error getting suggestions:', error)
      toast.error('Failed to get suggestions')
      setShowSuggestions(false)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const handleGetMoreSuggestions = async () => {
    await handleGetSuggestions(allShownSuggestions)
  }

  const handleSelectSuggestion = (suggestion: string) => {
    setName(suggestion)
    setShowSuggestions(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Layer name is required')
      return
    }

    if (!currentAddress) {
      toast.error('Please connect your wallet first')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/collections/${params.id}/layers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          wallet_address: currentAddress,
        }),
      })

      if (response.ok) {
        router.push(`/collections/${params.id}`)
      } else {
        const error = await response.json()
        toast.error('Error creating layer', { description: error.error })
      }
    } catch (error) {
      console.error('Error creating layer:', error)
      toast.error('Failed to create layer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Create layer"
        subtitle="Add a new layer to group traits in your collection"
        action={
          <Link
            href={`/collections/${params.id}`}
            className="inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-200 hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-colors"
          >
            Back
          </Link>
        }
      />

      <ToolWorkspace>
        <ToolPanel title="Layer details" subtitle="Name this layer for your trait stack">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="block text-sm font-medium text-zinc-300">
                  Layer name *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAllShownSuggestions([])
                    handleGetSuggestions([])
                  }}
                  disabled={loadingSuggestions}
                  className="inline-flex h-8 px-3.5 items-center rounded-full border border-[#FF2BD6]/35 text-xs font-semibold text-[#FF2BD6] hover:bg-[#FF2BD6]/10 transition-colors disabled:opacity-50"
                >
                  {loadingSuggestions ? 'Getting…' : 'Suggestions'}
                </button>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-[#0c0c10] border border-white/[0.1] px-4 py-2.5 text-white placeholder:text-zinc-600 focus:border-[#2DE2FF] focus:outline-none transition-colors"
                placeholder="e.g. Background, Eyes, Headwear"
                required
              />
              <p className="text-sm text-zinc-500 mt-2">
                Layers group parts of the art — name them however you like.
              </p>
            </div>

            <ToolTip>
              Tip: use clear names like “Background” or “Outfit” so trait filters stay readable later.
            </ToolTip>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-50"
              >
                {loading ? <BrandLoader variant="inline" label="Creating" /> : 'Create layer'}
              </button>
              <Link
                href={`/collections/${params.id}`}
                className="inline-flex h-10 px-5 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-300 hover:text-white hover:border-white/20 transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </ToolPanel>
      </ToolWorkspace>

      {showSuggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="hg-card w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#131318] p-6 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Layer suggestions</h2>
              <button
                onClick={() => setShowSuggestions(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            {loadingSuggestions ? (
              <BrandLoader variant="card" label="Getting suggestions" />
            ) : suggestions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-zinc-500 mb-3">
                  Choose a suggestion to fill the layer name:
                </p>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-white/[0.08] bg-[#0c0c10] hover:border-[#2DE2FF]/40 hover:bg-[#2DE2FF]/[0.06] transition-colors"
                  >
                    <span className="font-medium text-white">{suggestion}</span>
                  </button>
                ))}
                
                <div className="pt-4 border-t border-white/[0.06] mt-4">
                  <button
                    onClick={handleGetMoreSuggestions}
                    disabled={loadingSuggestions}
                    className="hg-btn-glow w-full h-10 rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold disabled:opacity-50"
                  >
                    {loadingSuggestions ? 'Getting more…' : 'Give 5 more'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-500">No suggestions available</p>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setShowSuggestions(false)
                  setAllShownSuggestions([])
                }}
                className="inline-flex h-9 px-4 items-center rounded-full border border-white/[0.1] text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
