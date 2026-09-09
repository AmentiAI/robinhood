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
      <div className="flex items-end justify-between mb-5 gap-4">
        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">
          Featured Collections
        </h2>
        <button
          type="button"
          onClick={() => router.push('/collections')}
          className="text-xs font-bold uppercase tracking-wider text-[#00C805] hover:text-[#CCFF00] transition-colors"
        >
          View All
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
              className="group text-left rounded-2xl overflow-hidden bg-[#15181a] border border-white/10 hover:border-[#00C805]/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_32px_rgba(0,200,5,0.18)]"
            >
              <div className="relative aspect-[4/3] bg-[#0a0c0d] overflow-hidden">
                {collection.image_url ? (
                  <img
                    src={collection.image_url}
                    alt={collection.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-[#00C805]/40">
                    ◆
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      status === 'live'
                        ? 'bg-[#00C805] text-black'
                        : 'bg-[#7c3aed] text-white'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white truncate">{collection.name}</h3>
                    <p className="text-[11px] text-[#71717A] mt-0.5">
                      {collection.total_supply.toLocaleString()} items ·{' '}
                      {Number(collection.mint_price)} ETH
                    </p>
                  </div>
                  <span className="w-8 h-8 rounded-full border border-[#00C805]/40 flex items-center justify-center text-[#00C805] group-hover:bg-[#00C805] group-hover:text-black transition-colors shrink-0">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-[#a8aab2] mb-1.5 tabular-nums">
                    <span>
                      {collection.minted_count.toLocaleString()} /{' '}
                      {collection.total_supply.toLocaleString()} minted
                    </span>
                    <span className="text-[#00C805] font-bold">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#1f2326] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00C805] to-[#CCFF00]"
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
