'use client'

import { PageHeader } from '@/components/page-header'
import { ToolWorkspace, ToolPanel, ToolTip } from '@/components/tool-workspace'

import { useState } from 'react'
import { Download, Sparkles, Rocket, ShoppingBag, Palette, Wand2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface GeneratedFlyer {
  flyerType: string
  title: string
  imageUrl: string
}

export default function FlyersPage() {
  const [generatedFlyers, setGeneratedFlyers] = useState<GeneratedFlyer[]>([])
  const [generating, setGenerating] = useState<string | null>(null)

  const flyers = [
    {
      id: 'founder-vision',
      title: 'Founder Vision - The HoodGFX Story',
      description: 'Our mission to revolutionize NFT creation',
      icon: Sparkles
    },
    {
      id: 'what-is-hoodgfx',
      title: 'What is HoodGFX',
      description: 'Empowering anyone to become an artist with AI',
      icon: Sparkles
    },
    {
      id: 'launchpad',
      title: 'Launchpad Features',
      description: 'Mint fresh NFT collections on Solana',
      icon: Rocket
    },
    {
      id: 'marketplace',
      title: 'Marketplace Features',
      description: 'Buy, sell & trade premium NFTs',
      icon: ShoppingBag
    },
    {
      id: 'collection-creator',
      title: 'Collection Creator',
      description: 'Build your NFT empire with AI tools',
      icon: Palette
    },
    {
      id: 'ai-tools',
      title: 'AI-Powered Tools',
      description: 'Create like a professional',
      icon: Wand2
    }
  ]

  const handleGenerateFlyer = async (flyerId: string) => {
    setGenerating(flyerId)
    toast.info('Generating flyer with AI...')

    try {
      const response = await fetch('/api/generate-flyers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flyerType: flyerId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate flyer')
      }

      // Add or update the generated flyer
      setGeneratedFlyers(prev => {
        const existing = prev.filter(f => f.flyerType !== flyerId)
        return [...existing, {
          flyerType: data.flyerType,
          title: data.title,
          imageUrl: data.imageUrl
        }]
      })

      toast.success('Flyer generated successfully!')
    } catch (error: any) {
      console.error('Error generating flyer:', error)
      toast.error(error.message || 'Failed to generate flyer')
    } finally {
      setGenerating(null)
    }
  }

  const handleDownload = async (imageUrl: string, flyerId: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `hoodgfx-${flyerId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Flyer downloaded!')
    } catch (error) {
      console.error('Error downloading flyer:', error)
      toast.error('Failed to download flyer')
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Marketing flyers"
        subtitle="AI-generated promotional materials for HoodGFX"
      />
      <ToolWorkspace className="space-y-8">
        <ToolTip tone="cyan">
          Generate a professional flyer with AI · High-quality 1024×1536 images
        </ToolTip>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 mb-4">
            Flyer templates
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {flyers.map((flyer, idx) => {
              const Icon = flyer.icon
              const generatedFlyer = generatedFlyers.find(f => f.flyerType === flyer.id)
              const isGenerating = generating === flyer.id

              return (
                <div
                  key={flyer.id}
                  className="hg-card hg-rise rounded-2xl border border-white/[0.1] bg-[#131318] p-5"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 rounded-xl bg-[#0c0c10] border border-white/[0.08]">
                      <Icon className="w-6 h-6 text-[#2DE2FF]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white mb-1">
                        {flyer.title}
                      </h3>
                      <p className="text-sm text-zinc-500">
                        {flyer.description}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerateFlyer(flyer.id)}
                    disabled={isGenerating}
                    className={`hg-btn-glow w-full px-5 py-2.5 rounded-full font-bold text-sm transition-all ${
                      isGenerating
                        ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                        : 'bg-[#2DE2FF] text-[#0a0a0c]'
                    }`}
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Generating…
                      </span>
                    ) : generatedFlyer ? (
                      'Regenerate'
                    ) : (
                      'Generate flyer'
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {generatedFlyers.length > 0 && (
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              Generated flyers
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {generatedFlyers.map((flyer) => (
                <ToolPanel
                  key={flyer.flyerType}
                  title={flyer.title}
                  action={
                    <button
                      type="button"
                      onClick={() => handleDownload(flyer.imageUrl, flyer.flyerType)}
                      className="hg-btn-glow flex items-center gap-2 px-4 py-2 rounded-full bg-[#2DE2FF] text-[#0a0a0c] font-bold text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  }
                >
                  <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#0c0c10]">
                    <img
                      src={flyer.imageUrl}
                      alt={flyer.title}
                      className="w-full h-auto"
                    />
                  </div>
                  <p className="mt-3 text-center text-xs text-zinc-500">
                    High-quality AI-generated marketing flyer · 1024×1536px
                  </p>
                </ToolPanel>
              ))}
            </div>
          </div>
        )}

        {generatedFlyers.length === 0 && (
          <ToolPanel title="Generate your first flyer" subtitle='Click "Generate flyer" on any template above'>
            <p className="text-sm text-zinc-500">
              Results will appear here once a flyer finishes generating.
            </p>
          </ToolPanel>
        )}
      </ToolWorkspace>
    </div>
  )
}
