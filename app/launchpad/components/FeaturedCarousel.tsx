'use client'

import { useRouter } from 'next/navigation'

interface Collection {
  id: string
  name: string
  image_url: string
  mint_price: number
  total_supply: number
  minted_count: number
}

interface FeaturedCarouselProps {
  collections: Collection[]
  currentSlide: number
  onSlideChange: (index: number) => void
}

export function FeaturedCarousel({
  collections,
  currentSlide,
  onSlideChange,
}: FeaturedCarouselProps) {
  const router = useRouter()

  if (collections.length === 0) return null

  return (
    <div className="relative border-b border-[#00C805]/20 bg-[#0a0c0d]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,200,5,0.08),transparent_60%)]" />
      <div className="max-w-7xl mx-auto px-6 py-8 relative">
        <div className="flex gap-6">
          <div className="flex-1 relative aspect-[16/9] bg-[#15181a] border border-[#00C805]/40 overflow-hidden shadow-[0_0_60px_rgba(0,200,5,0.12)]">
            {collections.map((collection, index) => {
              const progress =
                collection.total_supply > 0
                  ? (collection.minted_count / collection.total_supply) * 100
                  : 0
              const isActive = index === currentSlide

              return (
                <div
                  key={collection.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={collection.image_url}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0d] via-[#0a0c0d]/60 to-transparent" />
                  <div className="absolute top-4 left-4 px-2.5 py-1 bg-[#00C805] text-black text-[10px] font-black uppercase tracking-wider">
                    Featured
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
                      {collection.name}
                    </h3>
                    <div className="flex items-center gap-4 mb-3">
                      <div>
                        <p className="text-xs text-[#a8aab2] uppercase">Price</p>
                        <p className="text-lg font-black text-[#00C805]">{collection.mint_price} ETH</p>
                      </div>
                      <div className="w-px h-8 bg-white/10" />
                      <div>
                        <p className="text-xs text-[#a8aab2] uppercase">Minted</p>
                        <p className="text-lg font-bold text-white">
                          {collection.minted_count}/{collection.total_supply}
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-[#1f2326] mb-4 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#00C805] to-[#CCFF00]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push(`/launchpad/${collection.id}`)}
                      className="px-6 py-2.5 bg-[#00C805] hover:bg-[#CCFF00] text-black text-sm font-black uppercase tracking-wider transition-colors shadow-[0_0_24px_rgba(0,200,5,0.35)]"
                    >
                      Mint Now
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="w-64 space-y-3 overflow-y-auto max-h-[600px]">
            {collections.map((collection, index) => {
              const progress =
                collection.total_supply > 0
                  ? (collection.minted_count / collection.total_supply) * 100
                  : 0
              return (
                <button
                  key={collection.id}
                  type="button"
                  onClick={() => onSlideChange(index)}
                  className={`w-full text-left transition-all ${
                    index === currentSlide
                      ? 'border-2 border-[#00C805] shadow-[0_0_20px_rgba(0,200,5,0.2)]'
                      : 'border border-white/10 hover:border-[#00C805]/40'
                  }`}
                >
                  <div className="aspect-video relative overflow-hidden bg-[#15181a]">
                    <img
                      src={collection.image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 bg-[#15181a]">
                    <h4 className="text-xs font-bold text-white mb-1 truncate uppercase">
                      {collection.name}
                    </h4>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#00C805]">
                        {collection.mint_price} ETH
                      </span>
                      <span className="text-xs text-[#a8aab2]">
                        {collection.minted_count}/{collection.total_supply}
                      </span>
                    </div>
                    <div className="h-0.5 bg-[#1f2326]">
                      <div
                        className="h-full bg-gradient-to-r from-[#00C805] to-[#CCFF00]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
