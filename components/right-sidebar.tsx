'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Droplets, CreditCard, Megaphone } from 'lucide-react'

interface TrendingItem {
  id: string
  name: string
  image_url: string
  minted_count: number
  total_supply: number
}

const quickActions = [
  { name: 'Create Collection', href: '/collections/create', icon: Plus },
  { name: 'Mint NFT', href: '/launchpad', icon: Droplets },
  { name: 'Buy Credits', href: '/buy-credits', icon: CreditCard },
  { name: 'Promotion Tools', href: '/promotion', icon: Megaphone },
]

export function RightSidebar() {
  const [trending, setTrending] = useState<TrendingItem[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/launchpad')
        if (!res.ok) return
        const data = await res.json()
        const active = (data.active || []).map((col: any) => ({
          id: col.id,
          name: col.name,
          image_url: col.banner_image_url || col.mobile_image_url || '',
          minted_count: col.minted_count || 0,
          total_supply: col.total_supply || 0,
        }))
        if (!cancelled) setTrending(active.slice(0, 5))
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <aside className="hidden xl:flex fixed top-16 sm:top-[4.25rem] right-0 bottom-0 w-72 z-30 flex-col bg-[#050507] border-l border-[#2DE2FF]/15 overflow-y-auto">
      <div className="p-5 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
              Trending Now
            </h2>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2DE2FF] shadow-[0_0_8px_#2DE2FF]" />
          </div>

          {trending.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#15181a] p-4 text-center">
              <p className="text-xs text-[#a8aab2]">No live collections yet</p>
              <p className="text-[10px] text-[#71717A] mt-1 uppercase tracking-wider">
                Fresh on Robinhood Chain
              </p>
            </div>
          ) : (
            <ol className="space-y-2">
              {trending.map((item, index) => {
                const pct =
                  item.total_supply > 0
                    ? Math.round((item.minted_count / item.total_supply) * 100)
                    : 0
                return (
                  <li key={item.id}>
                    <Link
                      href={`/launchpad/${item.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-transparent hover:border-[#2DE2FF]/30 hover:bg-[#15181a] transition-all group"
                    >
                      <span className="w-5 text-xs font-black text-[#2DE2FF] tabular-nums">
                        {index + 1}
                      </span>
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#1f2326] border border-white/10 shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#2DE2FF] text-xs">
                            ◆
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate group-hover:text-[#2DE2FF] transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#71717A] tabular-nums">
                          {item.minted_count.toLocaleString()} minted
                        </p>
                      </div>
                      <span className="text-xs font-black text-[#2DE2FF] tabular-nums">
                        +{pct}%
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <section>
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.name}
                  href={action.href}
                  className="flex flex-col items-start gap-2.5 p-4 rounded-xl border border-[#2DE2FF]/35 bg-[#0a0c0d] hover:bg-[#2DE2FF]/10 hover:border-[#FF2BD6] transition-all min-h-[5.5rem]"
                >
                  <Icon className="h-5 w-5 text-[#2DE2FF]" />
                  <span className="text-[12px] font-bold text-white leading-tight">
                    {action.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      </div>
    </aside>
  )
}
