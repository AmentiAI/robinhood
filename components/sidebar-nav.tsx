'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  ShoppingBag,
  Layers,
  CreditCard,
  User,
  Menu,
  X,
  Megaphone,
  Sticker,
  Film,
  Box,
} from 'lucide-react'
import { WalletConnect } from './wallet-connect'
import { useWallet } from '@/lib/wallet/compatibility'

const navigation = [
  { name: 'Home', href: '/launchpad', icon: Home, match: ['/', '/launchpad'] },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
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
        className="lg:hidden fixed top-20 left-4 z-50 p-2 rounded-lg bg-[#0a0c0d] border border-[#00C805]/40 text-white hover:bg-[#15181a] transition-colors"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 z-40
          flex flex-col bg-[#050607] border-r border-[#00C805]/15 overflow-hidden
          transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 space-y-3 border-b border-white/5">
          {ethPrice !== null && (
            <div className="rounded-xl bg-[#15181a] border border-white/10 px-3.5 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] mb-1">
                ETH / USDT
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white tabular-nums">
                  ${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    priceChange >= 0 ? 'text-[#00C805]' : 'text-[#ff5052]'
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
            <p className="text-[10px] text-[#71717A] truncate px-1 font-mono">
              {currentAddress}
            </p>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div className="space-y-1">
            {navigation.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all
                    ${
                      active
                        ? 'bg-[#00C805] text-black shadow-[0_0_24px_rgba(0,200,5,0.35)]'
                        : 'text-[#a8aab2] hover:text-white hover:bg-[#15181a]'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div>
            <div className="px-3.5 mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00C805]">
                Tools
              </span>
            </div>
            <div className="space-y-1">
              {tools.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wide transition-all
                      ${
                        active
                          ? 'bg-[#00C805] text-black'
                          : 'text-[#a8aab2] hover:text-white hover:bg-[#15181a]'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="rounded-xl border border-[#00C805]/25 bg-gradient-to-br from-[#00C805]/10 to-transparent p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-[#00C805]/15 border border-[#00C805]/40 flex items-center justify-center">
                <Box className="h-4 w-4 text-[#00C805]" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#00C805]">
                  Powered by
                </p>
                <p className="text-xs font-bold text-white">Robinhood Chain</p>
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a8aab2]">
              Fast / Low Fees / Green
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
