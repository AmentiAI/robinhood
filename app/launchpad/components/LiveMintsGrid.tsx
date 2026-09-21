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
    <section>
      <h2 className="text-sm font-semibold text-zinc-200 mb-4">Live mints</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
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
              className="group text-left rounded-xl overflow-hidden bg-[#121214] border border-white/[0.08] hover:border-white/16 transition-colors"
            >
              <div className="relative aspect-[16/10] bg-[#0e0e10] overflow-hidden">
                {collection.image_url ? (
                  <img
                    src={collection.image_url}
                    alt={collection.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
                    No image
                  </div>
                )}
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#2DE2FF] text-[#0b0b0d]">
                  Live
                </span>
              </div>
              <div className="p-3.5 space-y-2">
                <h3 className="text-sm font-semibold text-zinc-100 truncate">{collection.name}</h3>
                {collection.description && (
                  <p className="text-xs text-zinc-500 line-clamp-2">{collection.description}</p>
                )}
                <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full bg-[#2DE2FF]" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-[11px] text-zinc-500 tabular-nums">
                  {collection.minted_count.toLocaleString()} / {collection.total_supply.toLocaleString()} ·{' '}
                  {Number(collection.mint_price)} ETH
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
