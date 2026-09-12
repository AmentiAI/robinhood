'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Syne, Plus_Jakarta_Sans } from 'next/font/google'
import { useEvmWallet } from '@/lib/wallet/evm-wallet-context'
import { useSiteLock } from '@/components/site-lock-provider'
import { useRouter } from 'next/navigation'

const display = Syne({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-splash-display',
})

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-splash-body',
})

const ACCENT = '#2DE2FF'
const ACCENT_HOT = '#FF2BD6'

const FEATURES = [
  {
    n: '01',
    title: 'Create',
    body: 'Produce complete, high-quality collections — art, traits, and metadata — at a fraction of traditional cost and time.',
  },
  {
    n: '02',
    title: 'Market',
    body: 'Sticker Maker and Video Maker generate campaign-ready assets so your drop leaves the studio ready to promote.',
  },
  {
    n: '03',
    title: 'Launch',
    body: 'Deploy and mint on Robinhood Chain from the same workspace. One platform from concept to live collection.',
  },
]

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function HomePage() {
  const router = useRouter()
  const { isConnected, address, connect, disconnect } = useEvmWallet()
  const { locked, status, loading, refresh } = useSiteLock()
  const [email, setEmail] = useState('')
  const [twitter, setTwitter] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [entered, setEntered] = useState(false)
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

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const ok = await connect()
      if (!ok) toast.error('Connection cancelled')
    } catch {
      toast.error('Failed to connect wallet')
    } finally {
      setConnecting(false)
    }
  }

  const handleJoin = async () => {
    if (!address) {
      toast.error('Connect your wallet first')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/site-whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: address,
          email: email.trim() || undefined,
          twitter: twitter.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to join')
      toast.success(data.message || "You're on the whitelist")
      await refresh()
      await loadWhitelist()
    } catch (e: any) {
      toast.error(e.message || 'Failed to join whitelist')
    } finally {
      setSubmitting(false)
    }
  }

  if (!loading && !locked) {
    return (
      <div className={`${display.variable} ${body.variable} relative min-h-screen bg-black overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center opacity-50">
          <Image
            src="/hoodgfx-hero.png"
            alt="HoodGFX"
            width={900}
            height={900}
            priority
            className="w-[min(90vw,560px)] h-auto"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-black" />
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center gap-8">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.35em]"
            style={{ fontFamily: 'var(--font-splash-body)', color: ACCENT }}
          >
            HoodGFX
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'var(--font-splash-display)' }}
          >
            Platform open
          </h1>
          <button
            type="button"
            onClick={handleEnter}
            className="px-10 py-4 text-black text-sm font-semibold tracking-wide transition-opacity hover:opacity-90"
            style={{ fontFamily: 'var(--font-splash-body)', background: ACCENT }}
          >
            Enter Launchpad
          </button>
        </div>
      </div>
    )
  }

  const onList = status === 'pending' || status === 'approved'
  const fade = (delay: string) =>
    ({
      opacity: entered ? 1 : 0,
      transform: entered ? 'translateY(0)' : 'translateY(18px)',
      transition: `opacity 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}`,
    }) as CSSProperties

  return (
    <div
      className={`${display.variable} ${body.variable} relative min-h-screen bg-black text-white overflow-x-hidden`}
      style={{ fontFamily: 'var(--font-splash-body)' }}
    >
      {/* HoodGFX mark as atmospheric background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-[8%]">
          <Image
            src="/hoodgfx-hero.png"
            alt=""
            width={1100}
            height={1100}
            priority
            className="w-[min(120vw,820px)] h-auto opacity-40 lg:opacity-55 select-none"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/88 to-black/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
        <div
          className="absolute top-[10%] right-[5%] w-[50vw] h-[50vw] rounded-full blur-[110px]"
          style={{
            background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)`,
            animation: 'splashGlow 10s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute bottom-[5%] left-[10%] w-[40vw] h-[40vw] rounded-full blur-[120px]"
          style={{
            background: `radial-gradient(circle, ${ACCENT_HOT} 0%, transparent 70%)`,
            animation: 'splashGlow 12s ease-in-out infinite alternate-reverse',
            opacity: 0.35,
          }}
        />
      </div>

      <style>{`
        @keyframes splashGlow {
          0% { opacity: 0.12; transform: translate(0, 0) scale(1); }
          100% { opacity: 0.22; transform: translate(-3%, 5%) scale(1.06); }
        }
      `}</style>

      <div className="relative z-10 min-h-screen flex flex-col">
        <header
          className="flex items-center justify-between px-6 sm:px-10 lg:px-14 pt-8 pb-4"
          style={fade('0.05s')}
        >
          <div className="flex items-center gap-3">
            <Image
              src="/hoodgfx-hero.png"
              alt="HoodGFX"
              width={72}
              height={72}
              priority
              className="h-12 w-12 sm:h-14 sm:w-14 object-contain"
            />
            <span
              className="text-xl sm:text-2xl font-bold tracking-tight text-white"
              style={{ fontFamily: 'var(--font-splash-display)' }}
            >
              Hood<span style={{ color: ACCENT_HOT }}>GFX</span>
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium tracking-[0.2em] uppercase text-white/45">
            <span className="hidden sm:inline">Robinhood Chain</span>
            <span className="w-1 h-1 rounded-full" style={{ background: ACCENT }} />
            <span style={{ color: ACCENT }}>Private access</span>
          </div>
        </header>

        <main className="flex-1 flex flex-col lg:flex-row lg:items-center gap-12 lg:gap-16 px-6 sm:px-10 lg:px-14 py-10 lg:py-6 max-w-[1400px] w-full mx-auto">
          <div className="flex-1 max-w-2xl space-y-10 lg:space-y-12">
            <div className="space-y-6" style={fade('0.15s')}>
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.32em]"
                style={{ color: ACCENT }}
              >
                One place. Full stack.
              </p>
              <h1
                className="text-[2.75rem] sm:text-6xl lg:text-[4.25rem] font-bold tracking-[-0.035em] leading-[0.98] text-white"
                style={{ fontFamily: 'var(--font-splash-display)' }}
              >
                Stop stacking tools.
                <br />
                <span className="text-white/90">Start shipping </span>
                <span style={{ color: ACCENT }}>drops.</span>
              </h1>
              <p className="text-base sm:text-lg text-white/55 max-w-xl leading-relaxed font-normal">
                HoodGFX is the professional studio for high-quality NFT collections on Robinhood Chain.
                Create, market with Sticker Maker &amp; Video Maker, and launch — without a fragmented toolchain.
              </p>
            </div>

            <div
              className="grid sm:grid-cols-3 gap-8 pt-2 border-t border-white/10"
              style={fade('0.3s')}
            >
              {FEATURES.map((f) => (
                <div key={f.title} className="space-y-3 pt-6">
                  <div className="flex items-baseline gap-3">
                    <span
                      className="text-[11px] font-medium tracking-[0.2em]"
                      style={{ color: `${ACCENT}B3` }}
                    >
                      {f.n}
                    </span>
                    <h2
                      className="text-lg font-semibold tracking-tight text-white"
                      style={{ fontFamily: 'var(--font-splash-display)' }}
                    >
                      {f.title}
                    </h2>
                  </div>
                  <p className="text-sm text-white/45 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-white/35 leading-relaxed max-w-lg" style={fade('0.4s')}>
              Free mint coming soon for whitelist. All revenue will go to the platform.
            </p>
          </div>

          <aside className="w-full lg:w-[400px] xl:w-[420px] shrink-0" style={fade('0.35s')} id="whitelist">
            <div className="relative border border-white/10 bg-black/70 backdrop-blur-xl p-7 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, ${ACCENT}, ${ACCENT_HOT}, transparent)`,
                }}
              />

              <div className="space-y-1 mb-7">
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.28em]"
                  style={{ color: ACCENT }}
                >
                  Whitelist
                </p>
                <h2
                  className="text-2xl font-semibold tracking-tight text-white"
                  style={{ fontFamily: 'var(--font-splash-display)' }}
                >
                  Get a whitelist spot
                </h2>
                <p className="text-sm text-white/45 pt-1 leading-relaxed">
                  Free mint coming soon. All revenue will go to the platform.
                </p>
              </div>

              <div className="space-y-5">
                {!isConnected || !address ? (
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={connecting}
                    className="w-full h-12 text-black text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ background: ACCENT }}
                  >
                    {connecting ? 'Connecting…' : 'Connect wallet'}
                  </button>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3 border border-white/10 bg-black/50 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
                          Connected
                        </p>
                        <p className="font-mono text-sm truncate mt-0.5" style={{ color: ACCENT }}>
                          {shortAddr(address)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => disconnect()}
                        className="text-[11px] font-medium uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors shrink-0"
                      >
                        Disconnect
                      </button>
                    </div>

                    {status === 'rejected' ? (
                      <div className="border border-[#ff5052]/25 bg-[#ff5052]/5 px-4 py-4 text-center">
                        <p className="text-sm font-semibold text-[#ff5052]">Not approved</p>
                        <p className="text-xs text-white/45 mt-1.5">This wallet was not approved.</p>
                      </div>
                    ) : onList ? (
                      <div
                        className="border px-4 py-5 text-center space-y-1"
                        style={{ borderColor: `${ACCENT}40`, background: `${ACCENT}0D` }}
                      >
                        <p
                          className="text-base font-semibold text-white"
                          style={{ fontFamily: 'var(--font-splash-display)' }}
                        >
                          You&apos;re on the list
                        </p>
                        <p className="text-xs text-white/45 leading-relaxed">
                          Free mint coming soon. All revenue will go to the platform.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-[10px] font-medium uppercase tracking-[0.18em] text-white/40 mb-2">
                              Email <span className="text-white/25">optional</span>
                            </label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="you@company.com"
                              className="w-full h-11 px-4 bg-black/50 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#2DE2FF]/50"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium uppercase tracking-[0.18em] text-white/40 mb-2">
                              X / Twitter <span className="text-white/25">optional</span>
                            </label>
                            <input
                              type="text"
                              value={twitter}
                              onChange={(e) => setTwitter(e.target.value)}
                              placeholder="@handle"
                              className="w-full h-11 px-4 bg-black/50 border border-white/10 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-[#2DE2FF]/50"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleJoin}
                          disabled={submitting || loading}
                          className="w-full h-12 text-black text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 disabled:opacity-60"
                          style={{ background: ACCENT }}
                        >
                          {submitting ? 'Submitting…' : 'Request whitelist spot'}
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </aside>
        </main>

        {/* Public whitelist roster */}
        <section className="px-6 sm:px-10 lg:px-14 pb-10 max-w-[1400px] w-full mx-auto" style={fade('0.45s')}>
          <div className="border border-white/10 bg-black/60 backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 border-b border-white/10">
              <div>
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.28em]"
                  style={{ color: ACCENT }}
                >
                  Whitelisted wallets
                </p>
                <p className="text-sm text-white/40 mt-1">
                  {wlLoading ? 'Loading…' : `${wlEntries.length} on the list`}
                </p>
              </div>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {wlLoading ? (
                <p className="px-6 py-8 text-sm text-white/35">Loading wallets…</p>
              ) : wlEntries.length === 0 ? (
                <p className="px-6 py-8 text-sm text-white/35">No wallets yet — be the first.</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {wlEntries.map((e, i) => (
                    <li
                      key={`${e.wallet_address}-${i}`}
                      className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3.5 hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[11px] font-mono text-white/25 w-7 shrink-0">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="font-mono text-sm text-white/80 truncate">
                          <span className="sm:hidden">{shortAddr(e.wallet_address)}</span>
                          <span className="hidden sm:inline">{e.wallet_address}</span>
                        </span>
                      </div>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-[0.16em] shrink-0"
                        style={{ color: e.status === 'approved' ? ACCENT : ACCENT_HOT }}
                      >
                        {e.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <footer
          className="px-6 sm:px-10 lg:px-14 py-6 flex items-center justify-between text-[11px] tracking-wide text-white/25"
          style={fade('0.5s')}
        >
          <span>© {new Date().getFullYear()} HoodGFX</span>
          <span className="uppercase tracking-[0.2em]">Built for creators</span>
        </footer>
      </div>
    </div>
  )
}
