'use client'

import { useState, useEffect, useRef, type CSSProperties } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Space_Grotesk, DM_Sans } from 'next/font/google'
import { useEvmWallet } from '@/lib/wallet/evm-wallet-context'
import { useSiteLock } from '@/components/site-lock-provider'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Crown,
  Trophy,
  Layers,
  Settings2,
  ImageDown,
  Megaphone,
  ChevronRight,
  ClipboardList,
  CircleHelp,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--f-display',
})

const body = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--f-body',
})

const CYAN = '#2DE2FF'
const MAGENTA = '#FF2BD6'
const PURPLE = '#A855F7'
const WL_APPLIED_KEY = 'hoodgfx_wl_applied'

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function isValidEthAddress(addr: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim())
}

function readAppliedWallet(): string | null {
  try {
    const raw = localStorage.getItem(WL_APPLIED_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { wallet?: string }
    return parsed.wallet && isValidEthAddress(parsed.wallet) ? parsed.wallet : null
  } catch {
    return null
  }
}

function saveAppliedWallet(wallet: string) {
  try {
    localStorage.setItem(
      WL_APPLIED_KEY,
      JSON.stringify({ wallet: wallet.trim(), at: Date.now() })
    )
  } catch {
    /* ignore */
  }
}

const FEATURES = [
  {
    icon: Layers,
    title: 'Easy NFT Creation',
    body: 'Build full collections with layers, traits, and AI generation in one flow.',
  },
  {
    icon: Settings2,
    title: 'Advanced Tools',
    body: 'Deploy, mint, and manage drops on Robinhood Chain without leaving HoodGFX.',
  },
  {
    icon: ImageDown,
    title: 'Asset Pipeline',
    body: 'Generate art, metadata, and collection assets ready for launch.',
  },
  {
    icon: Megaphone,
    title: 'Marketing Suite',
    body: 'Promote with Sticker Maker, Video Maker, and campaign tools in-product.',
  },
]

const CSS = `
  @keyframes hgIn {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes hgFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes hgGlow {
    0%, 100% { opacity: 0.45; }
    50% { opacity: 0.8; }
  }
  @keyframes hgPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(168, 85, 247, 0.35); }
    50% { box-shadow: 0 0 40px 8px rgba(45, 226, 255, 0.18); }
  }
  .hg-noise {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .hg-logo-text {
    background: linear-gradient(100deg, #2DE2FF 0%, #E879F9 45%, #FF2BD6 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    letter-spacing: -0.04em;
    font-style: italic;
    font-weight: 700;
    text-transform: uppercase;
  }
`

export default function HomePage() {
  const router = useRouter()
  const { address, isConnected, connect, disconnect } = useEvmWallet()
  const { locked, allowed, isAdmin, status, loading, refresh } = useSiteLock()
  const [walletInput, setWalletInput] = useState('')
  const [twitter, setTwitter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [entered, setEntered] = useState(false)
  const [wlPanel, setWlPanel] = useState<'board' | 'spots' | 'how' | 'req'>('board')
  const [wlEntries, setWlEntries] = useState<
    { wallet_address: string; status: string; created_at: string }[]
  >([])
  const [wlLoading, setWlLoading] = useState(true)
  const [appliedWallet, setAppliedWallet] = useState<string | null>(null)

  const loadWhitelist = async () => {
    try {
      const res = await fetch('/api/site-whitelist?list=1')
      const data = await res.json()
      if (res.ok) setWlEntries(data.entries || [])
    } catch {
      /* ignore */
    } finally {
      setWlLoading(false)
    }
  }

  useEffect(() => {
    const t = requestAnimationFrame(() => setEntered(true))
    loadWhitelist()
    setAppliedWallet(readAppliedWallet())
    return () => cancelAnimationFrame(t)
  }, [])

  const handleEnter = () => router.push('/launchpad')

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const ok = await connect()
      if (!ok) {
        toast.error('Connection cancelled')
        return
      }
      // Wagmi address updates async — poll briefly then check admin access
      let connectedAddr: string | null = null
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 100))
        const { ethereum } = window as any
        if (ethereum?.selectedAddress) {
          connectedAddr = ethereum.selectedAddress
          break
        }
        if (address) {
          connectedAddr = address
          break
        }
      }
      await refresh(connectedAddr)
    } catch {
      toast.error('Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }

  // After connect, only admins may enter while the site is locked
  const deniedToastRef = useRef(false)
  useEffect(() => {
    if (loading || !isConnected || !address) {
      deniedToastRef.current = false
      return
    }
    // Don't interrupt whitelist application flow
    if (showJoinModal) return
    if (locked && !isAdmin && !deniedToastRef.current) {
      deniedToastRef.current = true
      toast.error('Platform access is admin-only until launch')
    }
  }, [loading, isConnected, address, locked, isAdmin, showJoinModal])

  const canEnter = !loading && allowed
  const alreadyApplied = Boolean(appliedWallet)

  const openJoinModal = () => {
    if (alreadyApplied) {
      setJoinSuccess(true)
      setShowJoinModal(true)
      return
    }
    setJoinSuccess(false)
    setShowJoinModal(true)
  }

  const SITE_URL = 'https://hoodgfx.com'
  const BRAND_X = '@Hood_GFX_'
  const SHARE_TEXT = `Join HoodGFX whitelist ${BRAND_X} ${SITE_URL.replace('https://', '')}`

  const handleShareToX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleJoin = async () => {
    if (alreadyApplied) {
      toast.error('You already submitted a whitelist application')
      setJoinSuccess(true)
      return
    }

    const wallet = walletInput.trim()
    const handle = twitter.trim()

    if (!isValidEthAddress(wallet)) {
      toast.error('Paste a valid 0x wallet address')
      return
    }
    if (!handle) {
      toast.error('Enter your X (Twitter) handle')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/site-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: wallet,
          twitter: handle.startsWith('@') ? handle : `@${handle}`,
        }),
      })
      const data = await res.json()

      if (data.already_applied || res.status === 409) {
        saveAppliedWallet(wallet)
        setAppliedWallet(wallet)
        setJoinSuccess(true)
        toast.error(data.error || 'This wallet has already applied')
        return
      }

      if (!res.ok) throw new Error(data.error || 'Failed to join')

      saveAppliedWallet(wallet)
      setAppliedWallet(wallet)
      toast.success(data.message || "You're on the whitelist")
      setJoinSuccess(true)
      await loadWhitelist()
    } catch (e: any) {
      toast.error(e.message || 'Failed to join whitelist')
    } finally {
      setSubmitting(false)
    }
  }

  const anim = (delay: string): CSSProperties =>
    entered
      ? { animation: `hgIn 0.7s cubic-bezier(0.22,1,0.36,1) ${delay} both` }
      : { opacity: 0 }

  const onList = alreadyApplied || status === 'pending' || status === 'approved'
  const displayAppliedWallet = appliedWallet || (onList && address ? address : null)

  if (canEnter) {
    return (
      <div
        className={`${display.variable} ${body.variable} ${body.className} min-h-svh bg-black text-white flex flex-col items-center justify-center gap-6 px-6`}
      >
        <Image src="/hoodgfx-logo.png" alt="HoodGFX" width={180} height={180} priority className="w-[140px] h-auto" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--f-display)' }}>
          Welcome back{isAdmin ? ' (admin)' : ''}
        </h1>
        {address ? (
          <p className="font-mono text-sm text-white/45">{shortAddr(address)}</p>
        ) : null}
        <button
          type="button"
          onClick={handleEnter}
          className="h-14 px-10 rounded-full text-black text-base font-bold tracking-wide"
          style={{ background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})` }}
        >
          Enter platform
        </button>
        {isConnected ? (
          <button
            type="button"
            onClick={() => disconnect()}
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            Disconnect
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className={`${display.variable} ${body.variable} ${body.className} relative min-h-svh bg-black text-white overflow-x-hidden`}
    >
      <style>{CSS}</style>

      <div className="relative z-10 mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Header */}
        <header
          className="flex items-center justify-between gap-3 mb-6 sm:mb-8 py-1"
          style={anim('0s')}
        >
          <a href="#" className="flex items-center gap-2 shrink-0 group min-w-0">
            <Crown className="h-5 w-5 text-[#A855F7] group-hover:text-[#2DE2FF] transition-colors shrink-0" />
            <span
              className="hg-logo-text text-xl sm:text-3xl leading-none truncate"
              style={{ fontFamily: 'var(--f-display)' }}
            >
              HoodGFX
            </span>
          </a>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://x.com/Hood_GFX_"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-10 w-10 sm:w-auto sm:h-12 sm:px-5 rounded-full border border-[#2DE2FF]/45 bg-black/40 text-sm font-bold text-white hover:border-[#2DE2FF] hover:bg-[#2DE2FF]/10 transition-all"
              aria-label="Follow HoodGFX on X"
            >
              <svg className="w-4 h-4 text-[#2DE2FF]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="hidden sm:inline">@Hood_GFX_</span>
            </a>
            <a
              href="https://discord.gg/Mj22fwakQ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 h-10 w-10 sm:w-auto sm:h-12 sm:px-5 rounded-full border border-[#A855F7]/50 bg-black/40 text-sm font-bold text-white hover:border-[#A855F7] hover:bg-[#A855F7]/10 transition-all"
              aria-label="Join HoodGFX Discord"
            >
              <svg className="w-5 h-5 text-[#A855F7]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="hidden sm:inline">Discord</span>
            </a>
            {isConnected && address ? (
              <button
                type="button"
                onClick={() => disconnect()}
                className="inline-flex items-center justify-center gap-2 h-10 sm:h-12 px-3 sm:px-5 rounded-full border border-white/20 bg-black/40 text-sm font-bold text-white/80 hover:text-white hover:border-white/40 transition-all"
              >
                <Wallet className="w-4 h-4 text-[#2DE2FF] shrink-0" />
                <span className="hidden sm:inline font-mono text-sm">{shortAddr(address)}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="inline-flex items-center justify-center gap-2 h-10 sm:h-12 px-3.5 sm:px-5 rounded-full border border-[#2DE2FF]/60 bg-gradient-to-r from-[#2DE2FF]/15 to-[#FF2BD6]/15 text-sm font-bold text-white hover:border-[#2DE2FF] transition-all disabled:opacity-60"
              >
                <Wallet className="w-4 h-4 text-[#2DE2FF] shrink-0" />
                <span className="truncate">{connecting ? '…' : 'Connect'}</span>
              </button>
            )}
          </div>
        </header>

        {/* Hero grid */}
        <main
          id="create"
          className="grid lg:grid-cols-[1.05fr_0.95fr_0.9fr] gap-8 lg:gap-6 items-center mb-8 sm:mb-14"
        >
          {/* Left copy */}
          <div className="space-y-5 sm:space-y-6 order-1" style={anim('0.05s')}>
            <p
              className="text-[13px] sm:text-sm font-semibold tracking-[0.22em] uppercase"
              style={{ color: MAGENTA }}
            >
              Create · Mint · Grow
            </p>

            <div>
              <div className="flex items-start gap-2 mb-1">
                <Crown className="h-6 w-6 sm:h-7 sm:w-7 text-[#A855F7] mt-1 shrink-0" />
                <h1
                  className="hg-logo-text text-[clamp(2.4rem,11vw,4.6rem)] leading-[0.92]"
                  style={{ fontFamily: 'var(--f-display)' }}
                >
                  HoodGFX
                </h1>
              </div>
              <p
                className="mt-3 text-sm sm:text-base font-bold tracking-[0.12em] uppercase"
                style={{ color: CYAN }}
              >
                The Ultimate NFT Creation Platform
              </p>
            </div>

            <p className="text-[15px] sm:text-base text-white/55 leading-relaxed max-w-[28rem]">
              Build high-quality NFT collections with AI generation, marketing tools, and
              Robinhood Chain minting — all in one studio.
            </p>

            <button
              type="button"
              onClick={openJoinModal}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-3 h-14 sm:h-16 px-8 sm:px-10 rounded-full text-base sm:text-lg font-bold text-white transition-transform hover:scale-[1.02]"
              style={{
                background: `linear-gradient(90deg, ${PURPLE} 0%, ${CYAN} 100%)`,
                boxShadow: '0 0 36px rgba(168, 85, 247, 0.35)',
              }}
            >
              Join the whitelist
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          {/* Center logo stage */}
          <div
            className="relative hidden sm:flex flex-col items-center justify-center order-2 py-4"
            style={anim('0.1s')}
          >
            <div
              className="relative z-10 w-full max-w-[380px]"
              style={{ animation: 'hgFloat 5s ease-in-out infinite' }}
            >
              <Image
                src="/hoodgfx-logo.png"
                alt="HoodGFX"
                width={480}
                height={480}
                priority
                className="w-full h-auto"
              />
            </div>
            {/* Pedestal rings */}
            <div className="relative mt-[-8%] w-[70%] max-w-[280px]">
              <div
                className="h-3 rounded-full blur-[1px]"
                style={{
                  background: `linear-gradient(90deg, transparent, ${CYAN}, ${MAGENTA}, transparent)`,
                  animation: 'hgPulse 3s ease-in-out infinite',
                }}
              />
              <div className="mt-1.5 h-2 rounded-full bg-white/10 blur-[0.5px]" />
              <div className="mt-1 h-1.5 rounded-full bg-white/5" />
            </div>
            <p
              className="mt-5 text-lg sm:text-xl font-bold italic tracking-wide"
              style={{
                fontFamily: 'var(--f-display)',
                color: MAGENTA,
                textShadow: `0 0 20px ${MAGENTA}66`,
              }}
            >
              YOUR VISION OUR TOOLS
            </p>
          </div>

          {/* Right whitelist panels */}
          <div
            id="whitelist"
            className="order-3 space-y-4"
            style={anim('0.14s')}
          >
            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {[
                { id: 'board' as const, label: 'Board' },
                { id: 'spots' as const, label: 'My spots' },
                { id: 'how' as const, label: 'How' },
                { id: 'req' as const, label: 'Rules' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setWlPanel(item.id)}
                  className={`shrink-0 h-9 px-4 rounded-full text-sm font-semibold ${
                    wlPanel === item.id ? 'bg-[#2DE2FF] text-[#0a0a0c]' : 'border border-white/15 text-white/70'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {/* Menu card */}
            <div
              className="hidden lg:block rounded-2xl border bg-black/50 backdrop-blur-md overflow-hidden"
              style={{
                borderColor: 'rgba(168, 85, 247, 0.45)',
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.15)',
              }}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <Crown className="h-4 w-4 text-[#A855F7]" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  Whitelist
                </span>
              </div>
              <div className="p-2 space-y-1">
                {[
                  { id: 'board' as const, label: 'Whitelist Board', icon: ClipboardList },
                  { id: 'spots' as const, label: 'My Spots', icon: Sparkles },
                  { id: 'how' as const, label: 'How it Works', icon: CircleHelp },
                  { id: 'req' as const, label: 'Requirements', icon: ShieldCheck },
                ].map((item) => {
                  const Icon = item.icon
                  const active = wlPanel === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setWlPanel(item.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm font-semibold transition-all ${
                        active
                          ? 'text-white'
                          : 'text-white/55 hover:text-white hover:bg-white/[0.04]'
                      }`}
                      style={
                        active
                          ? {
                              background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})`,
                            }
                          : undefined
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <ChevronRight className="h-4 w-4 opacity-70" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Board / action card */}
            <div
              className="rounded-2xl border bg-black/50 backdrop-blur-md overflow-hidden"
              style={{
                borderColor: 'rgba(45, 226, 255, 0.35)',
                boxShadow: '0 0 30px rgba(45, 226, 255, 0.12)',
              }}
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                <Trophy className="h-4 w-4 text-[#2DE2FF]" />
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  {wlPanel === 'board'
                    ? 'Whitelist Board'
                    : wlPanel === 'spots'
                      ? 'My Spots'
                      : wlPanel === 'how'
                        ? 'How it Works'
                        : 'Requirements'}
                </span>
              </div>

              <div className="p-4 min-h-[220px]">
                {wlPanel === 'board' && (
                  <>
                    <div className="grid grid-cols-[36px_1fr] gap-2 text-[10px] uppercase tracking-wider text-white/35 mb-2 px-1">
                      <span>#</span>
                      <span>Wallet</span>
                    </div>
                    <div className="max-h-[320px] sm:max-h-[380px] overflow-y-auto space-y-1.5 mb-4">
                      {wlLoading ? (
                        <p className="text-sm text-white/40 py-4 text-center">Loading…</p>
                      ) : wlEntries.length === 0 ? (
                        <p className="text-sm text-white/40 py-4 text-center">No wallets yet — be first.</p>
                      ) : (
                        wlEntries.map((e, i) => (
                          <div
                            key={`${e.wallet_address}-${i}`}
                            className="grid grid-cols-[36px_1fr] gap-2 items-center px-2 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                          >
                            <span className="text-xs font-bold tabular-nums" style={{ color: CYAN }}>
                              {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="font-mono text-[12px] text-white/75 truncate">
                              {shortAddr(e.wallet_address)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="text-[11px] text-white/35 text-center">
                      {wlLoading ? '…' : `${wlEntries.length} spots claimed`}
                    </p>
                  </>
                )}

                {wlPanel === 'spots' && (
                  <div className="space-y-3">
                    {displayAppliedWallet ? (
                      <div
                        className="rounded-xl border px-4 py-4 text-center"
                        style={{ borderColor: `${CYAN}40`, background: `${CYAN}12` }}
                      >
                        <p className="text-sm font-bold" style={{ color: CYAN }}>
                          You&apos;re on the list
                        </p>
                        <p className="font-mono text-[12px] text-white/50 mt-1">
                          {shortAddr(displayAppliedWallet)}
                        </p>
                        <p className="text-[11px] text-white/35 mt-2">
                          One application per person — already submitted.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-[13px] text-white/50 leading-relaxed">
                          Paste your 0x wallet and X handle to apply. One submission only.
                        </p>
                        <button
                          type="button"
                          onClick={openJoinModal}
                          className="w-full h-12 rounded-xl text-black text-sm font-bold"
                          style={{ background: `linear-gradient(90deg, ${CYAN}, ${MAGENTA})` }}
                        >
                          Join the whitelist
                        </button>
                      </>
                    )}
                  </div>
                )}

                {wlPanel === 'how' && (
                  <ul className="space-y-3 text-[13px] text-white/60 leading-relaxed">
                    <li>1. Open the join form and paste your 0x wallet.</li>
                    <li>2. Add your X handle.</li>
                    <li>3. Submit once — duplicate applications are blocked.</li>
                    <li>4. When the site unlocks, enter and start creating.</li>
                  </ul>
                )}

                {wlPanel === 'req' && (
                  <ul className="space-y-3 text-[13px] text-white/60 leading-relaxed">
                    <li>• Valid 0x wallet address on Robinhood Chain</li>
                    <li>• X (Twitter) handle</li>
                    <li>• One application per wallet / browser</li>
                    <li>• 18+ and agree to HoodGFX Terms</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Features */}
        <section id="features" className="mb-10 sm:mb-12" style={anim('0.18s')}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 sm:gap-4 border-y border-white/[0.08] py-6 sm:py-8">
            {FEATURES.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className={`px-2 sm:px-4 ${i > 0 ? 'lg:border-l border-white/[0.08]' : ''}`}
                >
                  <Icon className="h-8 w-8 mb-3" style={{ color: i % 2 === 0 ? CYAN : MAGENTA }} />
                  <h3
                    className="text-[13px] font-bold uppercase tracking-[0.12em] mb-2"
                    style={{ color: CYAN, fontFamily: 'var(--f-display)' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-[13px] text-white/45 leading-relaxed">{f.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Roadmap teaser */}
        <section id="roadmap" className="mb-8" style={anim('0.2s')}>
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A855F7] mb-1">
                Roadmap
              </p>
              <p className="text-white/70 text-sm sm:text-base">
                Whitelist → Free mint → Full studio unlock on Robinhood Chain
              </p>
            </div>
            <button
              type="button"
              onClick={openJoinModal}
              className="h-12 px-6 rounded-xl border border-[#2DE2FF]/50 text-sm font-bold text-[#2DE2FF] hover:bg-[#2DE2FF]/10 transition-colors"
            >
              Join the whitelist
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 pb-6 border-t border-white/[0.06] text-[12px]">
          <p className="tracking-[0.14em] uppercase font-semibold" style={{ color: MAGENTA }}>
            Build · Mint · Market · On HoodGFX
          </p>
          <div className="flex items-center gap-2 text-white/50">
            <Crown className="h-3.5 w-3.5 text-[#A855F7]" />
            <span className="font-semibold text-white/80">HoodGFX</span>
            <span className="text-white/35">· Turn your ideas into NFTs</span>
          </div>
        </footer>
      </div>

      {showJoinModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => {
            if (submitting) return
            setShowJoinModal(false)
            setJoinSuccess(false)
          }}
        >
          <div
            className="relative w-full max-w-[440px] max-h-[min(92vh,720px)] overflow-y-auto rounded-2xl border bg-[#08080a] p-5 sm:p-8 shadow-2xl"
            style={{
              borderColor: 'rgba(255, 255, 255, 0.12)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(45,226,255,0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute inset-x-8 top-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${CYAN}, ${PURPLE}, transparent)` }}
            />

            <div className="flex items-start justify-between gap-3 mb-6">
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]"
                >
                  <ShieldCheck className="h-5 w-5" style={{ color: CYAN }} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40 mb-1">
                    Official application
                  </p>
                  <h2
                    className="text-xl sm:text-2xl font-bold text-white tracking-tight"
                    style={{ fontFamily: 'var(--f-display)' }}
                  >
                    {joinSuccess ? 'Application received' : 'Whitelist application'}
                  </h2>
                  <p className="text-sm text-white/45 mt-1.5 leading-relaxed max-w-[18rem]">
                    {joinSuccess
                      ? 'Your wallet is registered. Share HoodGFX on X to help grow the community.'
                      : 'Paste your 0x wallet and X handle. One application only.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowJoinModal(false)
                  setJoinSuccess(false)
                }}
                disabled={submitting}
                className="text-white/35 hover:text-white text-sm font-medium shrink-0"
              >
                Close
              </button>
            </div>

            {joinSuccess ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3.5 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">Status: Pending review</p>
                    <p className="text-[13px] text-white/50 mt-0.5 font-mono truncate">
                      {displayAppliedWallet
                        ? shortAddr(displayAppliedWallet)
                        : walletInput
                          ? shortAddr(walletInput)
                          : 'Wallet registered'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center text-center gap-3 rounded-xl border border-white/[0.08] bg-black/40 p-5">
                  <Image
                    src="/hoodgfx-logo.png"
                    alt="HoodGFX"
                    width={96}
                    height={96}
                    className="w-20 h-20 object-contain"
                  />
                  <p className="text-sm text-white/75 leading-relaxed max-w-[18rem]">
                    Join HoodGFX whitelist {BRAND_X}{' '}
                    <span style={{ color: CYAN }}>hoodgfx.com</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleShareToX}
                  className="w-full h-[52px] rounded-xl text-black text-[15px] font-bold inline-flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})` }}
                >
                  Share to X
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowJoinModal(false)
                    setJoinSuccess(false)
                    setTwitter('')
                    setWalletInput('')
                  }}
                  className="w-full text-sm text-white/40 hover:text-white transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Step 1 — Wallet */}
                <section className="rounded-xl border border-white/[0.09] bg-white/[0.02] p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-black"
                      style={{ background: CYAN }}
                    >
                      1
                    </span>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
                      Wallet address
                    </p>
                  </div>
                  <label className="block text-[12px] text-white/45 mb-1.5">Paste your 0x address</label>
                  <div className="relative">
                    <Wallet
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30"
                    />
                    <input
                      type="text"
                      value={walletInput}
                      onChange={(e) => setWalletInput(e.target.value.trim())}
                      placeholder="0x…"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full h-12 rounded-xl pl-10 pr-4 bg-black border border-white/12 font-mono text-[13px] text-white placeholder:text-white/25 outline-none focus:border-[#2DE2FF]/50"
                    />
                  </div>
                  {walletInput && !isValidEthAddress(walletInput) ? (
                    <p className="text-[11px] text-amber-400/80 mt-2">Enter a valid 42-character 0x address</p>
                  ) : null}
                </section>

                {/* Step 2 — Social */}
                <section className="rounded-xl border border-white/[0.09] bg-white/[0.02] p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-black"
                      style={{
                        background: isValidEthAddress(walletInput) ? MAGENTA : 'rgba(255,255,255,0.2)',
                      }}
                    >
                      2
                    </span>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-white/55">
                      Social identity
                    </p>
                  </div>
                  <label className="block text-[12px] text-white/45 mb-1.5">X (Twitter) handle</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium">
                      @
                    </span>
                    <input
                      type="text"
                      value={twitter.replace(/^@/, '')}
                      onChange={(e) => setTwitter(e.target.value.replace(/^@/, ''))}
                      placeholder="yourhandle"
                      autoComplete="off"
                      className="w-full h-12 rounded-xl pl-8 pr-4 bg-black border border-white/12 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-[#FF2BD6]/50"
                    />
                  </div>
                </section>

                <p className="text-[11px] text-white/30 leading-relaxed px-0.5">
                  One application per wallet. By submitting, you confirm this wallet is yours and agree to HoodGFX{' '}
                  <a href="/terms" className="text-white/50 underline underline-offset-2 hover:text-white">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-white/50 underline underline-offset-2 hover:text-white">
                    Privacy Policy
                  </a>
                  .
                </p>

                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={
                    submitting || !isValidEthAddress(walletInput) || !twitter.trim()
                  }
                  className="w-full h-[52px] rounded-xl text-black text-[15px] font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity inline-flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})` }}
                >
                  {submitting ? 'Submitting application…' : 'Submit application'}
                  {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
