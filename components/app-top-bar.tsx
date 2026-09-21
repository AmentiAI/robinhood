'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  ChevronDown,
  Layers,
  Home,
  CreditCard,
  User,
  Sticker,
  Megaphone,
  Film,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEvmWallet } from '@/lib/wallet/evm-wallet-context'
import { useCredits } from '@/lib/credits-context'

const primaryNav = [
  { name: 'Launchpad', href: '/launchpad', match: ['/launchpad'], icon: Home },
  { name: 'Collections', href: '/collections', icon: Layers },
  { name: 'Credits', href: '/buy-credits', icon: CreditCard },
]

const toolsNav = [
  { name: 'Create collection', href: '/collections/create', icon: Plus },
  { name: 'Sticker Maker', href: '/sticker-maker', icon: Sticker },
  { name: 'Promotion', href: '/promotion', icon: Megaphone },
  { name: 'Movie Mode', href: '/movie-mode', icon: Film },
]

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function AppTopBar() {
  const pathname = usePathname()
  const { address, isConnected, connect, disconnect } = useEvmWallet()
  const { credits, loadCredits, clearCredits } = useCredits()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [ethPrice, setEthPrice] = useState<number | null>(null)
  const toolsRef = useRef<HTMLDivElement>(null)
  const walletRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isConnected && address) loadCredits(address)
    else clearCredits()
  }, [isConnected, address, loadCredits, clearCredits])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/market-data')
        if (!res.ok) return
        const json = await res.json()
        if (!cancelled && json.data?.price_usd) {
          setEthPrice(Number(json.data.price_usd))
        }
      } catch {
        /* ignore */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (toolsRef.current && !toolsRef.current.contains(t)) setToolsOpen(false)
      if (walletRef.current && !walletRef.current.contains(t)) setWalletOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setToolsOpen(false)
    setWalletOpen(false)
  }, [pathname])

  const isActive = useCallback(
    (item: (typeof primaryNav)[0]) => {
      if (item.match) {
        return item.match.some(
          (m) => pathname === m || pathname?.startsWith(m + '/')
        )
      }
      return pathname === item.href || pathname?.startsWith(item.href + '/')
    },
    [pathname]
  )

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const ok = await connect()
      if (!ok) toast.error('Connection cancelled')
    } catch {
      toast.error('Failed to connect')
    } finally {
      setConnecting(false)
    }
  }

  const creditLabel =
    credits === null
      ? '—'
      : typeof credits === 'number'
        ? credits.toLocaleString()
        : String(credits)

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-[100]">
        <div className="mx-auto max-w-[1600px] px-3 sm:px-5 pt-3 sm:pt-4">
          <div className="relative h-[4.75rem] sm:h-[5.5rem] rounded-[1.35rem] border border-white/[0.12] bg-[#121216]/95 backdrop-blur-xl shadow-[0_10px_48px_rgba(0,0,0,0.5),0_0_48px_rgba(45,226,255,0.07)] flex items-center gap-3 sm:gap-5 px-3.5 sm:px-5">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-[1.35rem]"
              style={{
                background:
                  'linear-gradient(90deg, transparent, #2DE2FF, #A855F7, #FF2BD6, transparent)',
                backgroundSize: '200% 100%',
                animation: 'hg-shimmer 8s linear infinite',
              }}
            />

            {/* Brand */}
            <Link
              href="/launchpad"
              className="group flex items-center gap-3 sm:gap-3.5 shrink-0 pl-0.5 pr-3 sm:pr-5 border-r border-white/[0.1] mr-1"
            >
              <Image
                src="/hoodgfx-logo.png"
                alt="HoodGFX"
                width={56}
                height={56}
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                priority
              />
              <span className="hidden sm:block text-[1.35rem] font-semibold tracking-[-0.03em] text-white leading-none">
                Hood<span className="text-[#FF2BD6]">GFX</span>
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1.5 flex-1 min-w-0">
              {primaryNav.map((item) => {
                const active = isActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative px-5 py-3 rounded-xl text-[15px] font-medium tracking-[-0.01em] transition-colors duration-300 ease-out ${
                      active
                        ? 'text-[#0a0a0c] bg-[#2DE2FF]'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}

              <div className="relative z-[120]" ref={toolsRef}>
                <button
                  type="button"
                  onClick={() => {
                    setToolsOpen((v) => !v)
                    setWalletOpen(false)
                  }}
                  className={`inline-flex items-center gap-1.5 px-5 py-3 rounded-xl text-[15px] font-medium tracking-[-0.01em] transition-colors duration-300 ease-out ${
                    toolsOpen || toolsNav.some((t) => pathname?.startsWith(t.href))
                      ? 'text-white bg-white/[0.08]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  Tools
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      toolsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {toolsOpen && (
                  <div className="hg-nav-dropdown absolute top-[calc(100%+12px)] left-0 w-72 rounded-2xl border border-white/[0.1] bg-[#16161c]/98 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] p-2 z-[130]">
                    <div
                      aria-hidden
                      className="absolute -top-1.5 left-7 h-3 w-3 rotate-45 border-l border-t border-white/[0.1] bg-[#16161c]"
                    />
                    {toolsNav.map((item, i) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setToolsOpen(false)}
                          className="hg-nav-dropdown-item flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-[15px] font-medium tracking-[-0.01em] text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors duration-200"
                          style={{ animationDelay: `${i * 40}ms` }}
                        >
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08]">
                            <Icon className="h-4 w-4 text-[#2DE2FF]" />
                          </span>
                          {item.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </nav>

            <div className="flex-1 lg:hidden" />

            {/* Right cluster */}
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
              {ethPrice !== null && (
                <div className="hidden md:flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-[11px] font-semibold tracking-[0.08em] text-[#2DE2FF]">
                    ETH
                  </span>
                  <span className="text-[15px] font-medium text-zinc-200 tabular-nums tracking-tight">
                    ${ethPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}

              {isConnected && address ? (
                <div className="relative z-[120]" ref={walletRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setWalletOpen((v) => !v)
                      setToolsOpen(false)
                    }}
                    className="inline-flex items-center gap-2.5 h-12 sm:h-[3.25rem] pl-1.5 pr-3.5 rounded-full bg-[#1a1a20] border border-white/[0.12] hover:border-[#2DE2FF]/35 transition-colors duration-300"
                  >
                    <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2DE2FF] via-[#A855F7] to-[#FF2BD6] flex items-center justify-center text-xs font-bold text-black">
                      {address.slice(2, 4).toUpperCase()}
                    </span>
                    <span className="hidden sm:inline text-[14px] font-medium text-zinc-200 font-mono tracking-tight">
                      {shortAddr(address)}
                    </span>
                    <span className="hidden sm:inline text-[13px] font-semibold text-[#2DE2FF] tabular-nums border-l border-white/10 pl-2.5">
                      {creditLabel}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-zinc-500 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        walletOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {walletOpen && (
                    <div className="hg-nav-dropdown absolute top-[calc(100%+12px)] right-0 w-72 rounded-2xl border border-white/[0.1] bg-[#16161c]/98 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] p-2 z-[130]">
                      <div
                        aria-hidden
                        className="absolute -top-1.5 right-9 h-3 w-3 rotate-45 border-l border-t border-white/[0.1] bg-[#16161c]"
                      />
                      <div className="px-3.5 py-3 mb-1 border-b border-white/[0.06]">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                          Connected
                        </p>
                        <p className="font-mono text-[15px] text-white mt-1 tracking-tight">
                          {shortAddr(address)}
                        </p>
                        <p className="text-sm text-[#2DE2FF] font-semibold mt-1">
                          {creditLabel} credits
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setWalletOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-[15px] font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors duration-200"
                      >
                        <User className="h-4 w-4 text-[#2DE2FF]" /> Profile
                      </Link>
                      <Link
                        href="/buy-credits"
                        onClick={() => setWalletOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-[15px] font-medium text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors duration-200"
                      >
                        <CreditCard className="h-4 w-4 text-[#FF2BD6]" /> Buy credits
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setWalletOpen(false)
                          void disconnect()
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-3.5 rounded-xl text-[15px] font-medium text-zinc-500 hover:text-white hover:bg-white/[0.06] transition-colors duration-200"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={connecting}
                  className="hg-btn-glow h-12 sm:h-[3.25rem] px-6 rounded-full bg-gradient-to-r from-[#2DE2FF] via-[#A855F7] to-[#FF2BD6] text-[#0b0b0d] text-[15px] font-semibold tracking-[-0.01em] disabled:opacity-60"
                  style={{
                    backgroundSize: '200% 100%',
                    animation: connecting ? undefined : 'hg-shimmer 5s linear infinite',
                  }}
                >
                  {connecting ? 'Connecting…' : 'Connect'}
                </button>
              )}

              <button
                type="button"
                className="lg:hidden w-12 h-12 rounded-xl border border-white/10 flex items-center justify-center text-zinc-300 hover:bg-white/[0.06] transition-colors duration-200"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[110] lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm hg-nav-overlay"
            onClick={() => setMobileOpen(false)}
          />
          <div className="hg-nav-dropdown absolute top-3 right-3 left-3 rounded-2xl border border-white/[0.12] bg-[#121216] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <span className="text-base font-semibold tracking-tight text-white">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-11 h-11 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {primaryNav.map((item) => {
                const Icon = item.icon
                const active = isActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl text-[15px] font-medium tracking-[-0.01em] transition-colors ${
                      active
                        ? 'bg-[#2DE2FF] text-[#0a0a0c]'
                        : 'text-zinc-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                )
              })}
              <div className="pt-2 mt-2 border-t border-white/[0.06]">
                <p className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
                  Tools
                </p>
                {toolsNav.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-4 rounded-xl text-[15px] font-medium text-zinc-300 hover:bg-white/[0.06] transition-colors"
                    >
                      <Icon className="h-4 w-4 text-[#2DE2FF]" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
