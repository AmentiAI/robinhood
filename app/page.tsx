'use client'

import { useState, useEffect, type CSSProperties } from 'react'
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

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
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
  const { address } = useEvmWallet()
  const { allowed, isAdmin, status, loading, refresh } = useSiteLock()
  const [formWallet, setFormWallet] = useState('')
  const [twitter, setTwitter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [entered, setEntered] = useState(false)
  const [wlPanel, setWlPanel] = useState<'board' | 'spots' | 'how' | 'req'>('board')
  const [wlEntries, setWlEntries] = useState<
    { wallet_address: string; status: string; created_at: string }[]
  >([])
  const [wlLoading, setWlLoading] = useState(true)

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
    return () => cancelAnimationFrame(t)
  }, [])

  const handleEnter = () => router.push('/launchpad')

  const openJoinModal = () => {
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
    const wallet = formWallet.trim()
    const handle = twitter.trim()

    if (!wallet.startsWith('0x') || wallet.length < 42) {
      toast.error('Paste a valid 0x wallet address')
      return
    }
    if (!handle) {
      toast.error('Enter your X handle')
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
      if (!res.ok) throw new Error(data.error || 'Failed to join')
      toast.success(data.message || "You're on the whitelist")
      setJoinSuccess(true)
      await refresh()
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

  const onList = status === 'pending' || status === 'approved'

  if (!loading && allowed) {
    return (
      <div
        className={`${display.variable} ${body.variable} ${body.className} min-h-svh bg-black text-white flex flex-col items-center justify-center gap-6 px-6`}
      >
        <Image src="/hoodgfx-hero.png" alt="HoodGFX" width={180} height={180} priority className="w-[140px] h-auto" />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ fontFamily: 'var(--f-display)' }}>
          Welcome back{isAdmin ? ' (admin)' : ''}
        </h1>
        <button
          type="button"
          onClick={handleEnter}
          className="h-14 px-10 rounded-full text-black text-base font-bold tracking-wide"
          style={{ background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})` }}
        >
          Enter platform
        </button>
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
          className="flex items-center justify-between gap-4 mb-6 sm:mb-8 py-2"
          style={anim('0s')}
        >
          <a href="#" className="flex items-center gap-2 shrink-0 group">
            <Crown className="h-5 w-5 text-[#A855F7] group-hover:text-[#2DE2FF] transition-colors" />
            <span
              className="hg-logo-text text-2xl sm:text-3xl leading-none"
              style={{ fontFamily: 'var(--f-display)' }}
            >
              HoodGFX
            </span>
          </a>

          <div className="flex flex-col items-end gap-1.5 sm:gap-2">
            <a
              href="https://x.com/Hood_GFX_"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-xl border border-[#2DE2FF]/45 bg-black/40 text-sm font-bold text-white hover:border-[#2DE2FF] hover:bg-[#2DE2FF]/10 transition-all"
              aria-label="Follow HoodGFX on X"
            >
              <svg className="w-4 h-4 text-[#2DE2FF]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="hidden xs:inline sm:inline">@Hood_GFX_</span>
            </a>
            <p className="text-[11px] sm:text-[12px] text-white/45 text-right max-w-[14rem] sm:max-w-none leading-snug">
              Discord launching after whitelist is full
            </p>
          </div>
        </header>

        {/* Hero grid */}
        <main
          id="create"
          className="grid lg:grid-cols-[1.05fr_0.95fr_0.9fr] gap-8 lg:gap-6 items-center mb-10 sm:mb-14"
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
                  className="hg-logo-text text-[3.2rem] sm:text-[4.2rem] lg:text-[4.6rem] leading-[0.92]"
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
              className="inline-flex items-center gap-3 h-14 sm:h-16 px-8 sm:px-10 rounded-full text-base sm:text-lg font-bold text-white transition-transform hover:scale-[1.02]"
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
            className="relative flex flex-col items-center justify-center order-2 py-4"
            style={anim('0.1s')}
          >
            <div
              className="relative z-10 w-full max-w-[340px] sm:max-w-[380px]"
              style={{ animation: 'hgFloat 5s ease-in-out infinite' }}
            >
              <Image
                src="/hoodgfx-hero.png"
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
            {/* Menu card */}
            <div
              className="rounded-2xl border bg-black/50 backdrop-blur-md overflow-hidden"
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
                    <div className="max-h-[160px] overflow-y-auto space-y-1.5 mb-4">
                      {wlLoading ? (
                        <p className="text-sm text-white/40 py-4 text-center">Loading…</p>
                      ) : wlEntries.length === 0 ? (
                        <p className="text-sm text-white/40 py-4 text-center">No wallets yet — be first.</p>
                      ) : (
                        wlEntries.slice(0, 10).map((e, i) => (
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
                    {onList && address ? (
                      <div
                        className="rounded-xl border px-4 py-4 text-center"
                        style={{ borderColor: `${CYAN}40`, background: `${CYAN}12` }}
                      >
                        <p className="text-sm font-bold" style={{ color: CYAN }}>
                          You&apos;re on the list
                        </p>
                        <p className="font-mono text-[12px] text-white/50 mt-1">{shortAddr(address)}</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-[13px] text-white/50 leading-relaxed">
                          Paste your wallet address and X handle to request a spot.
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
                    <li>3. Submit and wait for approval — free mint coming soon.</li>
                    <li>4. When the site unlocks, enter and start creating.</li>
                  </ul>
                )}

                {wlPanel === 'req' && (
                  <ul className="space-y-3 text-[13px] text-white/60 leading-relaxed">
                    <li>• Valid 0x wallet address on Robinhood Chain</li>
                    <li>• X (Twitter) handle</li>
                    <li>• 18+ and agree to HoodGFX Terms</li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Features */}
        <section id="features" className="mb-10 sm:mb-12" style={anim('0.18s')}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 border-y border-white/[0.08] py-8">
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75"
          onClick={() => {
            if (submitting) return
            setShowJoinModal(false)
            setJoinSuccess(false)
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border bg-[#0a0a0c] p-6 sm:p-7 shadow-2xl"
            style={{
              borderColor: 'rgba(45, 226, 255, 0.35)',
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute inset-x-0 top-0 h-px rounded-t-2xl"
              style={{ background: `linear-gradient(90deg, transparent, ${CYAN}, ${MAGENTA}, transparent)` }}
            />
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#A855F7] mb-1">
                  HoodGFX
                </p>
                <h2
                  className="text-xl sm:text-2xl font-bold text-white"
                  style={{ fontFamily: 'var(--f-display)' }}
                >
                  {joinSuccess ? "You're on the list" : 'Join the whitelist'}
                </h2>
                <p className="text-sm text-white/45 mt-1.5">
                  {joinSuccess
                    ? 'Share HoodGFX with your network on X.'
                    : 'Paste your wallet address and X handle.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowJoinModal(false)
                  setJoinSuccess(false)
                }}
                disabled={submitting}
                className="text-white/40 hover:text-white text-sm font-medium"
              >
                Close
              </button>
            </div>

            {joinSuccess ? (
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center gap-3 rounded-xl border border-white/10 bg-black/50 p-5">
                  <Image
                    src="/hoodgfx-hero.png"
                    alt="HoodGFX"
                    width={120}
                    height={120}
                    className="w-24 h-24 object-contain"
                  />
                  <p className="text-sm text-white/80 leading-relaxed max-w-[18rem]">
                    Join HoodGFX whitelist {BRAND_X}{' '}
                    <span style={{ color: CYAN }}>hoodgfx.com</span>
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 text-[12px] text-white/45">
                    <span className="font-mono" style={{ color: CYAN }}>
                      hoodgfx.com
                    </span>
                    <span>·</span>
                    <span style={{ color: MAGENTA }}>{BRAND_X}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleShareToX}
                  className="w-full h-14 rounded-xl text-black text-[15px] font-bold inline-flex items-center justify-center gap-2"
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
                    setFormWallet('')
                    setTwitter('')
                  }}
                  className="w-full text-sm text-white/40 hover:text-white transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-[12px] text-white/50 mb-1.5">Wallet address</label>
                  <input
                    type="text"
                    value={formWallet}
                    onChange={(e) => setFormWallet(e.target.value)}
                    placeholder="0x…"
                    autoComplete="off"
                    className="w-full h-12 rounded-xl px-4 bg-black border border-white/15 text-[14px] text-white font-mono placeholder:text-white/25 outline-none focus:border-[#2DE2FF]/55"
                  />
                </div>
                <div>
                  <label className="block text-[12px] text-white/50 mb-1.5">X handle</label>
                  <input
                    type="text"
                    value={twitter}
                    onChange={(e) => setTwitter(e.target.value)}
                    placeholder="@yourhandle"
                    autoComplete="off"
                    className="w-full h-12 rounded-xl px-4 bg-black border border-white/15 text-[14px] text-white placeholder:text-white/25 outline-none focus:border-[#FF2BD6]/55"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={submitting}
                  className="w-full h-14 rounded-xl text-black text-[15px] font-bold disabled:opacity-50 transition-opacity"
                  style={{ background: `linear-gradient(90deg, ${PURPLE}, ${CYAN})` }}
                >
                  {submitting ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
