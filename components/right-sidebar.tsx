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
  { name: 'Create', href: '/collections/create', icon: Plus },
  { name: 'Mint', href: '/launchpad', icon: Droplets },
  { name: 'Credits', href: '/buy-credits', icon: CreditCard },
  { name: 'Promote', href: '/promotion', icon: Megaphone },
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
    <aside className="hidden xl:flex fixed top-14 sm:top-16 right-0 bottom-0 w-64 z-30 flex-col bg-[#0e0e10] border-l border-white/[0.08] overflow-y-auto">
      <div className="p-4 space-y-6">
        <section>
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 mb-3">
            Trending
          </h2>

          {trending.length === 0 ? (
            <div className="rounded-lg border border-white/[0.08] bg-[#121214] p-3.5 text-center">
              <p className="text-xs text-zinc-400">No live collections yet</p>
              <p className="text-[11px] text-zinc-600 mt-1">
                Deploy on Robinhood Chain
              </p>
            </div>
          ) : (
            <ol className="space-y-1">
              {trending.map((item, index) => {
                const pct =
                  item.total_supply > 0
                    ? Math.round((item.minted_count / item.total_supply) * 100)
                    : 0
                return (
                  <li key={item.id}>
                    <Link
                      href={`/launchpad/${item.id}`}
                      className="flex items-center gap-2.5 p-2 rounded-lg border border-transparent hover:border-white/[0.08] hover:bg-white/[0.03] transition-colors group"
                    >
                      <span className="w-4 text-[11px] font-medium text-zinc-500 tabular-nums">
                        {index + 1}
                      </span>
                      <div className="w-8 h-8 rounded-md overflow-hidden bg-[#18181b] border border-white/[0.06] shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-[10px]">
                            —
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-zinc-500 tabular-nums">
                          {item.minted_count.toLocaleString()} minted
                        </p>
                      </div>
                      <span className="text-[11px] font-medium text-zinc-400 tabular-nums">
                        {pct}%
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        <section>
          <h2 className="text-xs font-semibold tracking-wide text-zinc-500 mb-3">
            Quick actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.name}
                  href={action.href}
                  className="flex flex-col items-start gap-2 p-3 rounded-lg border border-white/[0.08] bg-[#121214] hover:bg-white/[0.04] hover:border-white/[0.14] transition-colors min-h-[4.5rem]"
                >
                  <Icon className="h-4 w-4 text-[#2DE2FF]" />
                  <span className="text-[12px] font-medium text-zinc-200 leading-tight">
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
