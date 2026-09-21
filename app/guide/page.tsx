'use client'

import { useState } from 'react'
import { useArtStyleExamples } from '@/lib/art-styles-client'
import { PageHeader } from '@/components/page-header'

export default function GuidePage() {
  const [activeSection, setActiveSection] = useState<string>('creation')
  
  // Fetch real collection examples for each art style
  const { examples: artStyleExamples } = useArtStyleExamples()

  // Cost calculation helper
  const calculateCost = (sizeKB: number, feeRate: number) => {
    const sizeBytes = sizeKB * 1024
    const chunks = Math.ceil(sizeBytes / 520)
    const witnessSize = 65 + 110 + sizeBytes + 33 + 3 + chunks * 2
    const vSize = Math.ceil(((50 + 43) * 4 + witnessSize) / 4)
    const fee = Math.ceil(vSize * feeRate)
    const total = fee + 330
    return { vSize, fee, total }
  }

  const fileSizes = [1, 5, 10, 25, 50, 75, 100, 150, 200, 300]
  const feeRates = [0.15, 0.2, 0.3, 0.5, 0.75, 1.0]

  const sections = [
    { id: 'creation', label: 'Create' },
    { id: 'tools', label: 'Tools' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'compression', label: 'Compression' },
    { id: 'cost-table', label: 'Cost table' },
    { id: 'launchpad', label: 'Launchpad' },
    { id: 'self-inscribe', label: 'Self-inscribe' },
    { id: 'metadata', label: 'Metadata' },
  ]

  const artStyles = [
    { id: 'chibi', name: 'Chibi', fallbackImage: '/art-styles/chibi.png' },
    { id: 'anime', name: 'Anime', fallbackImage: '/art-styles/anime.png' },
    { id: 'pixel', name: 'Pixel Art', fallbackImage: '/art-styles/pixel.png' },
    { id: 'cartoon', name: 'Cartoon', fallbackImage: '/art-styles/cartoon.png' },
    { id: 'realistic', name: 'Realistic', fallbackImage: '/art-styles/realistic.png' },
    { id: 'cyberpunk', name: 'Cyberpunk', fallbackImage: '/art-styles/cyberpunk.png' },
    { id: 'fantasy', name: 'Fantasy', fallbackImage: '/art-styles/fantasy.png' },
    { id: 'watercolor', name: 'Watercolor', fallbackImage: '/art-styles/watercolor.png' },
    { id: 'minimalist', name: 'Minimalist', fallbackImage: '/art-styles/minimalist.png' },
    { id: 'graffiti', name: 'Street Art', fallbackImage: '/art-styles/graffiti.png' },
    { id: '3d-cartoon', name: '3D Cartoon', fallbackImage: '/art-styles/3d-cartoon.png' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Collection guide"
        subtitle="Everything you need to know about creating, compressing, and launching collections."
      />

      {/* Navigation Tabs */}
      <div className="px-4 sm:px-6 lg:px-8 pb-2">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex gap-1 overflow-x-auto py-2 px-1.5 rounded-2xl border border-white/[0.08] bg-[#131318] scrollbar-hide">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id)
                  document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })
                }}
                className={`px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'bg-white text-[#0a0a0c]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-16">

          {/* Section 1: Collection Creation - Three Modes */}
          <section id="creation" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2DE2FF] to-[#f09840] flex items-center justify-center text-2xl">
                🎨
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Image Creation</h2>
                <p className="text-[#a8a8b8]/80">Choose your creation mode</p>
              </div>
            </div>

            {/* Three Mode Cards - Simplified */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Maker Mode */}
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border-2 border-[#FF2BD6] overflow-hidden hover:shadow-xl transition-all">
                <div className="bg-gradient-to-r from-[#FF2BD6] to-[#5a7bc4] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎯</span>
                    <h3 className="font-semibold text-white text-lg">Maker Mode</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[#a8a8b8] text-sm mb-4">You give prompts, AI generates the traits</p>
                  <div className="bg-[#FF2BD6]/5 rounded-xl p-3 text-xs text-center">
                    <span className="font-bold text-[#FF2BD6]">Guided creation with AI assistance</span>
                  </div>
                </div>
              </div>

              {/* Lazy Mode */}
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border-2 border-[#2DE2FF] overflow-hidden hover:shadow-xl transition-all">
                <div className="bg-gradient-to-r from-[#2DE2FF] to-[#f09840] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🪄</span>
                    <h3 className="font-semibold text-white text-lg">Lazy Mode</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[#a8a8b8] text-sm mb-4">AI does everything for you</p>
                  <div className="bg-[#2DE2FF]/5 rounded-xl p-3 text-xs text-center">
                    <span className="font-bold text-[#2DE2FF]">Fastest way to get started</span>
                  </div>
                </div>
              </div>

              {/* Artist Mode */}
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-[#A855F7]/40 overflow-hidden hover:shadow-xl transition-all">
                <div className="bg-gradient-to-r from-[#2DE2FF] to-[#A855F7] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎨</span>
                    <h3 className="font-semibold text-white text-lg">Artist Mode</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-[#a8a8b8] text-sm mb-4">Manual setup, upload your own images</p>
                  <div className="bg-[#A855F7]/10 rounded-xl p-3 text-xs text-center">
                    <span className="font-bold text-[#A855F7]">Full control for artists</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Art Styles Gallery */}
            <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md px-6 py-4 border-b border-white/[0.08]">
                <h3 className="font-semibold text-white">Available Art Styles</h3>
                <p className="text-sm text-[#a8a8b8]/80">Real examples from the generator</p>
              </div>
              <div className="p-6 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {artStyles.map((style) => {
                  // Use real collection image if available, otherwise fallback to static
                  const imageUrl = artStyleExamples[style.id] || style.fallbackImage
                  return (
                    <div key={style.id} className="group cursor-pointer">
                      <div className="aspect-square rounded-xl overflow-hidden bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md border-2 border-transparent group-hover:border-[#FF2BD6] transition-all shadow-sm group-hover:shadow-lg">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={style.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <div className="font-bold text-white text-sm">{style.name}</div>
                      </div>
                    </div>
                  )
                })}
                <div className="group cursor-pointer">
                  <div className="aspect-square rounded-xl overflow-hidden bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md border-2 border-dashed border-white/[0.08] flex items-center justify-center group-hover:border-[#FF2BD6] transition-all">
                    <span className="text-3xl">✏️</span>
                  </div>
                  <div className="mt-2 text-center">
                    <div className="font-bold text-white text-sm">Custom</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Future Mode */}
            <div className="mt-6 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#FF2BD6] flex items-center justify-center text-2xl flex-shrink-0">
                  🔮
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">Future Mode (Reference Image)</h3>
                  <p className="text-white/70 mt-1 text-sm">
                    Upload a reference image and AI will analyze it to auto-fill art style, colors, lighting, and settings.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-[#A855F7]/15 text-[#E879F9] rounded text-xs font-medium border border-[#A855F7]/30">Auto-detect style</span>
                    <span className="px-2 py-1 bg-pink-500/20 text-pink-300 rounded text-xs font-medium border border-pink-500/30">Extract colors</span>
                    <span className="px-2 py-1 bg-[#A855F7]/15 text-[#E879F9] rounded text-xs font-medium border border-[#A855F7]/30">Match lighting</span>
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* Section: Tools - Promotion & Sticker Maker */}
          <section id="tools" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-2xl">
                🧰
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Marketing Tools</h2>
                <p className="text-[#a8a8b8]/80">Create promotional content for your collection</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Promotion Flyer Tool */}
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border-2 border-[#2DE2FF] overflow-hidden hover:shadow-xl transition-all">
                <div className="bg-gradient-to-r from-[#2DE2FF] to-[#f09840] px-6 py-5">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">📣</span>
                    <h3 className="font-semibold text-white text-xl">Promotion Flyers</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[#a8a8b8] text-sm mb-4">
                    Pick images from your collection, describe a scene, AI generates a promotional flyer
                  </p>
                  
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-lg p-2 text-center">
                      <div className="text-lg">⬜</div>
                      <div className="text-[10px] font-bold text-[#a8a8b8]">Square</div>
                    </div>
                    <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-lg p-2 text-center">
                      <div className="text-lg">📱</div>
                      <div className="text-[10px] font-bold text-[#a8a8b8]">Portrait</div>
                    </div>
                    <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-lg p-2 text-center">
                      <div className="text-lg">🖼️</div>
                      <div className="text-[10px] font-bold text-[#a8a8b8]">Landscape</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#2DE2FF]/5 rounded-xl">
                    <span className="text-sm font-medium text-[#a8a8b8]">Cost</span>
                    <span className="font-semibold text-[#2DE2FF]">1 credit</span>
                  </div>
                </div>
              </div>

              {/* Sticker Maker Tool */}
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border-2 border-[#FF2BD6] overflow-hidden hover:shadow-xl transition-all">
                <div className="bg-gradient-to-r from-[#FF2BD6] to-[#5a7bc4] px-6 py-5">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🎨</span>
                    <h3 className="font-semibold text-white text-xl">Sticker Maker</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[#a8a8b8] text-sm mb-4">
                    Describe any sticker idea, AI generates a transparent PNG sticker
                  </p>
                  
                  <div className="bg-[#FF2BD6]/5 rounded-xl p-3 mb-4">
                    <div className="text-xs font-bold text-[#FF2BD6] mb-1">Examples:</div>
                    <div className="text-xs text-white/70">
                      "Happy Bitcoin mascot" • "Cat astronaut" • "Pixel treasure chest"
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#FF2BD6]/5 rounded-xl">
                    <span className="text-sm font-medium text-[#a8a8b8]">Cost</span>
                    <span className="font-semibold text-[#FF2BD6]">1 credit</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Marketplace */}
          <section id="marketplace" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-2xl">
                🏪
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Collection Marketplace</h2>
                <p className="text-[#a8a8b8]/80">Buy and sell complete collections</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Selling Collections */}
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border-2 border-green-500 overflow-hidden hover:shadow-xl transition-all">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">💰</span>
                    <h3 className="font-semibold text-white text-xl">Sell Your Collection</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[#a8a8b8] text-sm mb-4">
                    List your entire collection for sale. Includes all generated images and promotional materials.
                  </p>
                  
                  <div className="space-y-3 mb-4">
                    {[
                      { step: '1', text: 'Lock your collection' },
                      { step: '2', text: 'Set your price (BTC or Credits)' },
                      { step: '3', text: 'Add promotional images' },
                      { step: '4', text: 'Accept terms and list' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#2DE2FF]/20 text-[#2DE2FF] border border-white/[0.08] flex items-center justify-center text-xs font-semibold">
                          {item.step}
                        </div>
                        <span className="text-sm text-[#a8a8b8]">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md bg-[#0f172a]/80 rounded-xl p-3 border border-white/[0.08]">
                    <div className="text-xs font-bold text-[#a8a8b8] mb-1">Payment Options:</div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-[#FF2BD6]/20 text-[#FF2BD6] rounded text-xs font-bold border border-[#FF2BD6]/30">₿ Bitcoin</span>
                      <span className="px-2 py-1 bg-[#2DE2FF]/20 text-[#2DE2FF] rounded text-xs font-bold border border-white/[0.08]">💳 Credits</span>
                      <span className="px-2 py-1 bg-[#A855F7]/15 text-[#E879F9] rounded text-xs font-bold border border-[#A855F7]/30">Both</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buying Collections */}
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border-2 border-[#FF2BD6] overflow-hidden hover:shadow-xl transition-all">
                <div className="bg-gradient-to-r from-[#FF2BD6] to-[#5a7bc4] px-6 py-5">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">🛒</span>
                    <h3 className="font-semibold text-white text-xl">Buy a Collection</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-[#a8a8b8] text-sm mb-4">
                    Purchase ready-made collections with all images and promotional materials included.
                  </p>
                  
                  <div className="bg-[#FF2BD6]/5 rounded-xl p-4 mb-4">
                    <div className="text-xs font-bold text-[#FF2BD6] mb-2">What You Get:</div>
                    <ul className="text-xs text-[#a8a8b8] space-y-1">
                      <li>✓ Full ownership of all generated images</li>
                      <li>✓ Ability to generate more images</li>
                      <li>✓ Rights to inscribe or launch</li>
                      <li>✓ Included promotional materials</li>
                      <li>✓ Complete collection control</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md bg-[#0f172a]/80 rounded-lg p-3 text-center border border-[#FF2BD6]/30">
                      <div className="text-lg">₿</div>
                      <div className="text-xs font-bold text-[#FF2BD6]">Pay with BTC</div>
                      <div className="text-[10px] text-[#a8a8b8]/80">Direct to seller</div>
                    </div>
                    <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md bg-[#0f172a]/80 rounded-lg p-3 text-center border border-white/[0.08]">
                      <div className="text-lg">💳</div>
                      <div className="text-xs font-bold text-[#2DE2FF]">Pay with Credits</div>
                      <div className="text-[10px] text-[#a8a8b8]/80">Instant transfer</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketplace Info Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-xl border border-white/[0.08] p-5">
                <div className="text-2xl mb-2">🔒</div>
                <h4 className="font-semibold text-white mb-1">Collection Locking</h4>
                <p className="text-xs text-white/70">
                  Collections must be locked before listing. This prevents modifications while for sale.
                </p>
              </div>
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-xl border border-white/[0.08] p-5">
                <div className="text-2xl mb-2">🤝</div>
                <h4 className="font-semibold text-white mb-1">Secure Transfer</h4>
                <p className="text-xs text-white/70">
                  Ownership transfers automatically when payment confirms. All collaborators are removed.
                </p>
              </div>
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-xl border border-white/[0.08] p-5">
                <div className="text-2xl mb-2">📣</div>
                <h4 className="font-semibold text-white mb-1">Promos Included</h4>
                <p className="text-xs text-white/70">
                  Promotional flyers created for the collection transfer to the new owner with the sale.
                </p>
              </div>
            </div>

            {/* BTC Payment Flow */}
            <div className="mt-8 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-[#FF2BD6]/30 p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">₿</span> Bitcoin Payment Flow
              </h3>
              <div className="grid md:grid-cols-4 gap-4">
                {[
                  { step: '1', title: 'Initiate', desc: 'Click buy, select BTC payment' },
                  { step: '2', title: 'Send BTC', desc: 'Send exact amount to seller address' },
                  { step: '3', title: 'Verify', desc: 'Enter your transaction ID' },
                  { step: '4', title: 'Confirm', desc: 'Wait for blockchain confirmation' },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-10 h-10 rounded-full bg-[#FF2BD6] text-white flex items-center justify-center font-semibold mx-auto mb-2">
                      {item.step}
                    </div>
                    <div className="font-bold text-white text-sm">{item.title}</div>
                    <div className="text-xs text-white/70 mt-1">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Compression */}
          <section id="compression" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF2BD6] to-[#5a7bc4] flex items-center justify-center text-2xl">
                🗜️
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Image Compression</h2>
                <p className="text-[#a8a8b8]/80">Optimize for affordable inscriptions</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] p-6 hover:border-green-400/50 hover:shadow-xl transition-all">
                <div className="text-4xl mb-3">💎</div>
                <div className="text-2xl font-semibold text-white">Under 10KB</div>
                <div className="text-sm text-[#a8a8b8]/80 mt-1">Best value inscriptions</div>
                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-full bg-gradient-to-r from-green-400 to-green-600" />
                </div>
              </div>
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] p-6 hover:border-[#2DE2FF]/50 hover:shadow-xl transition-all">
                <div className="text-4xl mb-3">⚖️</div>
                <div className="text-2xl font-semibold text-white">10-50KB</div>
                <div className="text-sm text-[#a8a8b8]/80 mt-1">Balanced quality/cost</div>
                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-3/4 bg-gradient-to-r from-yellow-400 to-[#2DE2FF]" />
                </div>
              </div>
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] p-6 hover:border-red-400/50 hover:shadow-xl transition-all">
                <div className="text-4xl mb-3">🔥</div>
                <div className="text-2xl font-semibold text-white">50KB+</div>
                <div className="text-sm text-[#a8a8b8]/80 mt-1">Premium inscriptions</div>
                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full w-1/2 bg-gradient-to-r from-red-400 to-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="bg-gradient-to-r from-[#FF2BD6]/10 to-[#FF2BD6]/5 px-6 py-4 border-b border-white/[0.08]">
                <h3 className="font-semibold text-white">Recommended Settings</h3>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.08]">
                    <span className="text-white/70 font-medium">Format</span>
                    <span className="font-semibold text-[#2DE2FF]">WebP</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.08]">
                    <span className="text-white/70 font-medium">Resolution</span>
                    <span className="font-semibold text-[#2DE2FF]">666 × 666px</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.08]">
                    <span className="text-white/70 font-medium">Quality</span>
                    <span className="font-semibold text-[#2DE2FF]">70-80%</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.08]">
                    <span className="text-white/70 font-medium">Target Size</span>
                    <span className="font-semibold text-[#2DE2FF]">Under 50KB</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.08]">
                    <span className="text-white/70 font-medium">Maximum</span>
                    <span className="font-semibold text-[#FF2BD6]">350KB</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/[0.08]">
                    <span className="text-white/70 font-medium">Color Space</span>
                    <span className="font-semibold text-[#2DE2FF]">sRGB</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Cost Table */}
          <section id="cost-table" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2DE2FF] to-[#f09840] flex items-center justify-center text-2xl">
                💰
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Inscription Cost Table</h2>
                <p className="text-[#a8a8b8]/80">Total cost = reveal fee + 330 sat dust output</p>
              </div>
            </div>

            <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md text-white">
                      <th className="px-4 py-4 text-left font-semibold">Size</th>
                      {feeRates.map(rate => (
                        <th key={rate} className="px-4 py-4 text-center font-semibold">
                          <div>{rate}</div>
                          <div className="text-xs font-medium text-[#a8a8b8]/80">sat/vB</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {fileSizes.map((size, idx) => (
                      <tr key={size} className={`${idx % 2 === 0 ? 'bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md' : 'bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md'} hover:bg-[#FF2BD6]/5 transition-colors`}>
                        <td className="px-4 py-3 font-semibold text-white border-r border-white/[0.08]">
                          {size} KB
                        </td>
                        {feeRates.map(rate => {
                          const { total } = calculateCost(size, rate)
                          return (
                            <td key={rate} className="px-4 py-3 text-center">
                              <div className="font-semibold text-[#2DE2FF]">{total.toLocaleString()}</div>
                              <div className="text-xs text-[#a8a8b8]/80">{(total / 100000000).toFixed(8)}</div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md border-t border-white/[0.08] text-sm text-[#a8a8b8]/80">
                * Commit transaction adds ~150-300 sats depending on wallet type and input count
              </div>
            </div>
          </section>

          {/* Section 4: Launchpad */}
          <section id="launchpad" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-2xl">
                🚀
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Launchpad Minting</h2>
                <p className="text-[#a8a8b8]/80">Let collectors pay for inscriptions</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] p-6">
                  <h3 className="font-semibold text-white mb-4">How It Works</h3>
                  <div className="space-y-4">
                    {[
                      { step: 1, text: 'Upload your collection images' },
                      { step: 2, text: 'Set up mint phases (whitelist, public)' },
                      { step: 3, text: 'Configure pricing per phase' },
                      { step: 4, text: 'Lock and launch your collection' },
                      { step: 5, text: 'Collectors mint and inscribe on-demand' },
                    ].map(({ step, text }) => (
                      <div key={step} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#FF2BD6] text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                          {step}
                        </div>
                        <div className="text-[#a8a8b8] pt-1">{text}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#131318] rounded-2xl border border-white/[0.08] rounded-2xl p-6">
                  <h3 className="font-semibold text-white mb-3">✓ Benefits</h3>
                  <ul className="space-y-2 text-[#a8a8b8] text-sm">
                    <li>• No upfront inscription costs</li>
                    <li>• Collectors pay network fees</li>
                    <li>• Multiple mint phases supported</li>
                    <li>• Whitelist functionality</li>
                    <li>• Automatic revenue collection</li>
                  </ul>
                </div>
              </div>

              {/* Live Preview - Collection Card */}
              <div>
                <div className="text-sm text-[#a8a8b8]/80 mb-3 font-medium">Preview: Collection Card</div>
                <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl overflow-hidden border border-white/[0.08] shadow-xl max-w-sm">
                  <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/[0.08]">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold text-white bg-green-600">
                      🔴 LIVE
                    </span>
                    <button className="px-3 py-2 rounded-xl border border-white/[0.08] text-white">
                      🔕
                    </button>
                  </div>
                  <div className="relative aspect-[16/10] bg-gradient-to-br from-[#FF2BD6]/20 to-[#2DE2FF]/20 flex items-center justify-center">
                    <span className="text-6xl">🎨</span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-white text-xl font-semibold drop-shadow">Example Collection</div>
                      <div className="mt-1 text-white/85 text-sm font-semibold">
                        Phase: <span className="text-white">Public Mint</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-white/70">Price</div>
                      <div className="text-base font-semibold text-[#2DE2FF]">5,000 sats</div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-[#a8a8b8]/80">150 / 500</span>
                        <span className="text-[#2DE2FF] font-semibold">30%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full w-[30%] bg-gradient-to-r from-[#2DE2FF] to-[#f09840]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Self-Inscribe */}
          <section id="self-inscribe" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2DE2FF] to-[#A855F7] flex items-center justify-center text-2xl">
                ⚡
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Self-Inscribing</h2>
                <p className="text-[#a8a8b8]/80">Full control - inscribe directly to your wallet</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] overflow-hidden">
                <div className="bg-gradient-to-r from-[#A855F7]/10 to-[#A855F7]/5 px-6 py-4 border-b border-white/[0.08]">
                  <h3 className="font-semibold text-white">The Inscription Process</h3>
                </div>
                <div className="p-6 space-y-6">
                  {[
                    { icon: '📦', title: 'Select Batches', desc: 'Choose up to 10 ordinals per batch' },
                    { icon: '✍️', title: 'Sign Commit TX', desc: 'Creates taproot addresses with content' },
                    { icon: '📡', title: 'Broadcast Reveals', desc: 'Each ordinal revealed individually' },
                    { icon: '✅', title: 'Export Metadata', desc: 'Download JSON with inscription IDs' },
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center text-2xl flex-shrink-0">
                        {step.icon}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{step.title}</div>
                        <div className="text-sm text-[#a8a8b8]/80">{step.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Preview - Batch Row */}
              <div>
                <div className="text-sm text-[#a8a8b8]/80 mb-3 font-medium">Preview: Batch Selection</div>
                <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] overflow-hidden shadow-xl">
                  {[
                    { batch: 1, status: 'complete', count: '10/10', cost: 52340 },
                    { batch: 2, status: 'pending', count: '5/10', cost: 51280 },
                    { batch: 3, status: 'ready', count: '0/10', cost: 53100 },
                  ].map((row) => (
                    <div
                      key={row.batch}
                      className={`px-4 py-3 border-b border-white/[0.08] flex items-center gap-4 ${
                        row.status === 'complete' ? 'bg-[#2DE2FF]/10 border-l-4 border-l-[#2DE2FF]' :
                        row.status === 'pending' ? 'bg-[#FF2BD6]/10 border-l-4 border-l-[#FF2BD6]' : ''
                      }`}
                    >
                      {row.status === 'complete' ? (
                        <div className="w-6 h-6 rounded bg-[#2DE2FF] text-white flex items-center justify-center text-sm">✓</div>
                      ) : (
                        <input type="checkbox" className="w-5 h-5 rounded border-white/[0.08]" defaultChecked={row.status === 'pending'} />
                      )}
                      <div className="font-semibold text-white">Batch {row.batch}</div>
                      <div className="flex-1" />
                      <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        row.status === 'complete' ? 'bg-[#2DE2FF]/20 text-[#2DE2FF] border border-white/[0.08]' :
                        row.status === 'pending' ? 'bg-[#FF2BD6]/20 text-[#FF2BD6] border border-[#FF2BD6]/30' :
                        'bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md text-white/70'
                      }`}>
                        {row.status === 'complete' ? `✓ ${row.count}` : row.status === 'pending' ? `⏳ ${row.count}` : 'Ready'}
                      </div>
                      <div className="font-semibold text-[#2DE2FF]">{row.cost.toLocaleString()} sats</div>
                    </div>
                  ))}
                  <div className="px-4 py-4 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md flex items-center justify-between">
                    <div className="text-sm text-[#a8a8b8]/80">3 batches selected</div>
                    <button className="px-4 py-2 bg-[#FF2BD6] text-white rounded-xl font-semibold text-sm hover:bg-[#d91fb8] transition-colors">
                      Inscribe Selected
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-[#131318] rounded-2xl border border-white/[0.08] rounded-xl p-4">
                    <div className="text-sm text-[#2DE2FF] font-medium">Advantages</div>
                    <div className="mt-2 text-sm text-[#a8a8b8] space-y-1">
                      <div>✓ Own all inscriptions</div>
                      <div>✓ Control fee rates</div>
                      <div>✓ Batch processing</div>
                    </div>
                  </div>
                  <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md border border-[#FF2BD6]/30 rounded-xl p-4">
                    <div className="text-sm text-[#FF2BD6] font-medium">Considerations</div>
                    <div className="mt-2 text-sm text-[#a8a8b8] space-y-1">
                      <div>• Upfront costs</div>
                      <div>• Wallet required</div>
                      <div>• Manual management</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Metadata */}
          <section id="metadata" className="scroll-mt-32">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-2xl">
                📋
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-white">Metadata Export</h2>
                <p className="text-[#a8a8b8]/80">Get your collection data for marketplaces</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl overflow-hidden border border-white/[0.08]">
                <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between">
                  <div className="text-sm text-white/70">metadata.json</div>
                  <button className="px-3 py-1 bg-[#131318] rounded-2xl border border-white/[0.08] text-white/70 hover:text-white hover:border-white/16/50 rounded-lg text-sm transition-colors">
                    Copy
                  </button>
                </div>
                <pre className="p-6 text-sm text-[#2DE2FF] overflow-x-auto font-mono">
{`[
  {
    "name": "My Collection #1",
    "ordinal_number": 1,
    "inscription_id": "abc123...i0",
    "commit_tx": "def456...",
    "reveal_tx": "ghi789...",
    "attributes": [
      {
        "trait_type": "Background",
        "value": "Blue"
      }
    ]
  }
]`}
                </pre>
              </div>

              <div className="space-y-6">
                <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] p-6">
                  <h3 className="font-semibold text-white mb-4">Export Options</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-xl border border-white/[0.08]">
                      <div className="w-10 h-10 rounded-xl bg-[#A855F7]/15 border border-[#A855F7]/30 flex items-center justify-center text-xl">📋</div>
                      <div className="flex-1">
                        <div className="font-bold text-white">Copy JSON</div>
                        <div className="text-sm text-[#a8a8b8]/80">Copy to clipboard</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-xl border border-white/[0.08]">
                      <div className="w-10 h-10 rounded-xl bg-[#2DE2FF]/20 border border-white/[0.08] flex items-center justify-center text-xl">💾</div>
                      <div className="flex-1">
                        <div className="font-bold text-white">Download File</div>
                        <div className="text-sm text-[#a8a8b8]/80">{`{collection}-metadata.json`}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-2xl border border-white/[0.08] p-6">
                  <h3 className="font-semibold text-white mb-4">Included Fields</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {['name', 'ordinal_number', 'inscription_id', 'commit_tx', 'reveal_tx', 'attributes', 'image_url', 'content_type'].map((field) => (
                      <div key={field} className="flex items-center gap-2 text-white/70">
                        <span className="w-2 h-2 rounded-full bg-[#FF2BD6]" />
                        <code className="text-white">{field}</code>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

         

        </div>
      </div>
    </div>
  )
}
