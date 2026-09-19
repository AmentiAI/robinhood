'use client'

import { useRouter } from 'next/navigation'

interface Collection {
  id: string
  name: string
  description?: string
  image_url: string
  mint_price: number
  total_supply: number
  minted_count: number
  is_live?: boolean
}

interface LiveMintsGridProps {
  collections: Collection[]
}

export function LiveMintsGrid({ collections }: LiveMintsGridProps) {
  const router = useRouter()

  if (collections.length === 0) return null

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between mb-6 gap-4">
        <div>
          <p className="text-[#2DE2FF] text-xs font-bold uppercase tracking-[0.2em] mb-2">Live now</p>
          <h2 className="text-3xl font-black text-white tracking-tight">Active mints</h2>
        </div>
        <span className="text-sm text-[#a8aab2] font-medium">{collections.length} live</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {collections.map((collection) => {
          const progress =
            collection.total_supply > 0
              ? Math.min(100, (collection.minted_count / collection.total_supply) * 100)
              : 0

          return (
            <button
              key={collection.id}
              type="button"
              onClick={() => router.push(`/launchpad/${collection.id}`)}
              className="group text-left bg-[#15181a] border border-white/5 hover:border-[#2DE2FF]/50 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(45, 226, 255,0.15)]"
            >
              <div className="relative aspect-[4/3] bg-[#0a0c0d] overflow-hidden">
                {collection.image_url ? (
                  <img
                    src={collection.image_url}
                    alt={collection.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">◆</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c0d] via-transparent to-transparent" />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#2DE2FF] text-black text-[10px] font-black uppercase tracking-wider">
                  Live
                </div>
              </div>

              <div className="p-5 space-y-3">
                <h3 className="text-lg font-bold text-white truncate">{collection.name}</h3>
                {collection.description && (
                  <p className="text-sm text-[#a8aab2] line-clamp-2">{collection.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#71717A]">Price</p>
                    <p className="text-base font-black text-[#2DE2FF] tabular-nums">
                      {collection.mint_price} ETH
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-wider text-[#71717A]">Minted</p>
                    <p className="text-base font-bold text-white tabular-nums">
                      {collection.minted_count}/{collection.total_supply}
                    </p>
                  </div>
                </div>
                <div className="h-1 bg-[#1f2326] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
