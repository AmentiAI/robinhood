'use client'

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
    <div className="min-h-screen bg-[#0a0c0d] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-wide">
            Marketing <span className="text-[#2DE2FF]">Flyers</span>
          </h1>
          <p className="text-xl text-[#808080] font-semibold mb-6">
            AI-Generated promotional materials for HoodGFX
          </p>
          <div className="inline-block px-6 py-3 bg-[#15181a] border-2 border-[#2DE2FF]/40">
            <p className="text-sm text-white/80">
              Click &quot;Generate&quot; to create a professional flyer using AI • High-quality 1024x1536px images
            </p>
          </div>
        </div>

        {/* Flyer Generation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {flyers.map((flyer) => {
            const Icon = flyer.icon
            const generatedFlyer = generatedFlyers.find(f => f.flyerType === flyer.id)
            const isGenerating = generating === flyer.id

            return (
              <div
                key={flyer.id}
                className="bg-[#15181a] border-2 border-[#404040] hover:border-[#2DE2FF] transition-all p-6"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-[#0a0c0d] border border-[#2DE2FF]/40">
                    <Icon className="w-8 h-8 text-[#2DE2FF]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-1">
                      {flyer.title}
                    </h3>
                    <p className="text-sm text-[#808080]">
                      {flyer.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleGenerateFlyer(flyer.id)}
                  disabled={isGenerating}
                  className={`w-full px-6 py-3 font-bold uppercase tracking-wide transition-all ${
                    isGenerating
                      ? 'bg-[#404040] text-white/50 cursor-not-allowed'
                      : 'bg-gradient-to-r from-[#2DE2FF] to-[#FFD700] text-black hover:opacity-90'
                  }`}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </span>
                  ) : generatedFlyer ? (
                    'Regenerate'
                  ) : (
                    'Generate Flyer'
                  )}
                </button>
              </div>
            )
          })}
        </div>

        {/* Generated Flyers Display */}
        {generatedFlyers.length > 0 && (
          <div className="space-y-8">
            <div className="border-t-2 border-[#404040] pt-8">
              <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-wide">
                Generated <span className="text-[#2DE2FF]">Flyers</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {generatedFlyers.map((flyer) => (
                <div
                  key={flyer.flyerType}
                  className="bg-[#15181a] border-2 border-[#2DE2FF]/40 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                      {flyer.title}
                    </h3>
                    <button
                      onClick={() => handleDownload(flyer.imageUrl, flyer.flyerType)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#2DE2FF] to-[#FFD700] text-black font-bold text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>

                  <div className="border-2 border-[#404040] overflow-hidden">
                    <img
                      src={flyer.imageUrl}
                      alt={flyer.title}
                      className="w-full h-auto"
                    />
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-[#808080]">
                      High-quality AI-generated marketing flyer • 1024x1536px
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {generatedFlyers.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6">✨</div>
            <h2 className="text-2xl font-bold text-white mb-4 uppercase">
              Generate Your First Flyer
            </h2>
            <p className="text-xl text-[#808080] font-semibold">
              Click &quot;Generate Flyer&quot; on any card above to create AI-powered marketing materials
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
