'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Layers,
  CreditCard,
  User,
  Menu,
  X,
  Megaphone,
  Sticker,
  Film,
} from 'lucide-react'
import { WalletConnect } from './wallet-connect'
import { useWallet } from '@/lib/wallet/compatibility'

const navigation = [
  { name: 'Home', href: '/launchpad', icon: Home, match: ['/', '/launchpad'] },
  { name: 'Collections', href: '/collections', icon: Layers },
  { name: 'Buy Credits', href: '/buy-credits', icon: CreditCard },
  { name: 'Profile', href: '/profile', icon: User },
]

const tools = [
  { name: 'Sticker Maker', href: '/sticker-maker', icon: Sticker },
  { name: 'Promotion', href: '/promotion', icon: Megaphone },
  { name: 'Movie Mode', href: '/movie-mode', icon: Film },
]

export function SidebarNav() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { isConnected, currentAddress } = useWallet()
  const [ethPrice, setEthPrice] = useState<number | null>(null)
  const [priceChange, setPriceChange] = useState<number>(0)

  useEffect(() => {
    const fetchEthPrice = async () => {
      try {
        const res = await fetch('/api/market-data')
        if (res.ok) {
          const json = await res.json()
          const d = json.data
          if (d?.price_usd) {
            setEthPrice(Number(d.price_usd))
            setPriceChange(Number(d.change_24h) || 0)
            return
          }
        }
      } catch {
        /* fallback */
      }
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true'
        )
        if (res.ok) {
          const data = await res.json()
          setEthPrice(data.ethereum?.usd ?? null)
          setPriceChange(data.ethereum?.usd_24h_change ?? 0)
        }
      } catch (err) {
        console.error('Error fetching ETH price:', err)
      }
    }

    fetchEthPrice()
    const id = setInterval(fetchEthPrice, 60_000)
    return () => clearInterval(id)
  }, [])

  const isActive = useCallback(
    (item: (typeof navigation)[0]) => {
      if (item.match) {
        return item.match.some(
          (m) => pathname === m || (m !== '/' && pathname?.startsWith(m + '/'))
        )
      }
      return pathname === item.href || pathname?.startsWith(item.href + '/')
    },
    [pathname]
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-[4.75rem] left-4 z-50 p-3 bg-[#050507] border border-[#2DE2FF]/30 text-[#2DE2FF] hover:bg-[#2DE2FF]/10 transition-colors"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-16 sm:top-[4.25rem] left-0 bottom-0 w-72 z-40
          flex flex-col bg-[#050507] border-r border-white/[0.08] overflow-hidden
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 space-y-3 border-b border-white/[0.08]">
          {ethPrice !== null && (
            <div className="border border-[#2DE2FF]/20 bg-[#2DE2FF]/[0.04] px-4 py-3.5">
              <p className="text-[11px] text-white/40 mb-1 tracking-wide uppercase">ETH</p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold text-white tabular-nums">
                  ${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-sm tabular-nums ${
                    priceChange >= 0 ? 'text-[#2DE2FF]' : 'text-red-400'
                  }`}
                >
                  {priceChange >= 0 ? '+' : ''}
                  {priceChange.toFixed(2)}%
                </span>
              </div>
            </div>
          )}

          <div className="relative z-[100]">
            <WalletConnect />
          </div>

          {isConnected && currentAddress && (
            <p className="text-[11px] text-white/35 truncate px-1 font-mono">
              {currentAddress}
            </p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-7">
          <div className="space-y-1.5">
            {navigation.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3.5 px-4 py-3.5 text-[15px] transition-colors
                    ${
                      active
                        ? 'bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] text-black font-semibold'
                        : 'text-white/55 hover:text-white hover:bg-white/[0.05]'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div>
            <div className="px-4 mb-2.5">
              <span className="text-[11px] text-[#FF2BD6]/70 font-semibold uppercase tracking-[0.18em]">
                Tools
              </span>
            </div>
            <div className="space-y-1.5">
              {tools.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3.5 px-4 py-3.5 text-[15px] transition-colors
                      ${
                        active
                          ? 'bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] text-black font-semibold'
                          : 'text-white/55 hover:text-white hover:bg-white/[0.05]'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-white/[0.08]">
          <p className="text-[12px] text-white/35 px-1">
            Hood<span className="text-[#FF2BD6]">GFX</span> · Robinhood Chain
          </p>
        </div>
      </aside>
    </>
  )
}
