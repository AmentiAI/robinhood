'use client'

import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'

interface Collection {
  id: string
  name: string
  description?: string
  image_url: string
  mint_price: number
  total_supply: number
  minted_count: number
  is_live?: boolean
  start_time?: string
}

interface FeaturedCollectionsGridProps {
  collections: Collection[]
}

function statusOf(c: Collection): 'live' | 'upcoming' {
  if (c.is_live) return 'live'
  if (c.start_time && new Date(c.start_time) > new Date()) return 'upcoming'
  return c.is_live === false ? 'upcoming' : 'live'
}

export function FeaturedCollectionsGrid({ collections }: FeaturedCollectionsGridProps) {
  const router = useRouter()

  if (collections.length === 0) return null

  return (
    <section>
      <div className="flex items-end justify-between mb-4 gap-4">
        <h2 className="text-base font-semibold text-white">Featured collections</h2>
        <button
          type="button"
          onClick={() => router.push('/collections')}
          className="text-xs font-semibold text-[#2DE2FF] hover:text-[#7aefff] transition-colors"
        >
          View all
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
        {collections.slice(0, 8).map((collection) => {
          const status = statusOf(collection)
          const progress =
            collection.total_supply > 0
              ? Math.min(100, (collection.minted_count / collection.total_supply) * 100)
              : 0

          return (
            <button
              key={collection.id}
              type="button"
              onClick={() => router.push(`/launchpad/${collection.id}`)}
              className="hg-card hg-rise group text-left rounded-2xl overflow-hidden bg-[#131318] border border-white/[0.1] hover:border-white/18 transition-all shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
            >
              <div className="relative aspect-[4/3] bg-[#0c0c10] overflow-hidden">
                {collection.image_url ? (
                  <img
                    src={collection.image_url}
                    alt={collection.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
                    No image
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#131318] to-transparent" />
                <div className="absolute top-3 left-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                      status === 'live'
                        ? 'bg-[#2DE2FF] text-[#0a0a0c]'
                        : 'bg-[#1c1c24] text-zinc-200 border border-white/10'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3 -mt-2 relative">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold text-white truncate">{collection.name}</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      {collection.total_supply.toLocaleString()} items · {Number(collection.mint_price)} ETH
                    </p>
                  </div>
                  <span className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:bg-[#2DE2FF] group-hover:text-black group-hover:border-transparent transition-colors shrink-0">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-zinc-500 mb-1.5 tabular-nums">
                    <span>
                      {collection.minted_count.toLocaleString()} / {collection.total_supply.toLocaleString()}
                    </span>
                    <span className="text-zinc-300 font-semibold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
