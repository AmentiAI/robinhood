'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Syne, Plus_Jakarta_Sans } from 'next/font/google'
import type { ReactNode } from 'react'

const display = Syne({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--f-display',
})

const body = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--f-body',
})

const CYAN = '#2DE2FF'
const MAGENTA = '#FF2BD6'

const CSS = `
  @keyframes hgIn {
    from { opacity: 0; transform: translateY(14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .hg-noise {
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
`

export function LegalPageShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div
      className={`${display.variable} ${body.variable} ${body.className} relative min-h-svh bg-[#050507] text-white overflow-x-hidden`}
    >
      <style>{CSS}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-28 -left-20 w-[55vw] h-[55vw] rounded-full blur-[120px]"
          style={{ background: 'rgba(140, 50, 220, 0.18)' }}
        />
        <div
          className="absolute top-[20%] -right-24 w-[45vw] h-[45vw] rounded-full blur-[110px]"
          style={{ background: 'rgba(45, 226, 255, 0.12)' }}
        />
        <div className="absolute inset-0 hg-noise opacity-[0.03] mix-blend-overlay" />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${CYAN}, ${MAGENTA}, transparent)`,
          }}
        />
      </div>

      <div
        className="relative z-10 mx-auto w-full max-w-3xl px-5 sm:px-8 py-8 sm:py-12"
        style={{ animation: 'hgIn 0.7s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <header className="flex items-center justify-between mb-10 sm:mb-14">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-white/10">
              <Image src="/hoodgfx-hero.png" alt="" fill className="object-cover scale-150" />
            </div>
            <div>
              <p
                className="text-[15px] font-semibold tracking-tight leading-none"
                style={{ fontFamily: 'var(--f-display)' }}
              >
                Hood<span style={{ color: MAGENTA }}>GFX</span>
              </p>
              <p className="text-[10px] text-white/35 mt-1 tracking-wide">Legal</p>
            </div>
          </Link>
          <nav className="flex items-center gap-4 text-[12px] text-white/45">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
          </nav>
        </header>

        <div className="mb-10 sm:mb-12">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.28em] mb-3"
            style={{ color: CYAN }}
          >
            HoodGFX
          </p>
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] mb-3"
            style={{ fontFamily: 'var(--f-display)' }}
          >
            {title}
          </h1>
          {subtitle ? <p className="text-sm text-white/40">{subtitle}</p> : null}
          <div
            className="mt-6 h-px w-full"
            style={{
              background: `linear-gradient(90deg, ${CYAN}55, transparent)`,
            }}
          />
        </div>

        <article className="space-y-10 text-[15px] leading-relaxed text-white/55 [&_h2]:text-lg [&_h2]:sm:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_h2]:mb-3 [&_h2]:tracking-tight [&_h2]:[font-family:var(--f-display)] [&_strong]:text-white/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_section]:space-y-3">
          {children}
        </article>

        <footer className="mt-14 pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[12px] text-white/35">
          <p>
            © {new Date().getFullYear()} HoodGFX · Robinhood Chain
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-medium transition-colors hover:text-white"
            style={{ color: CYAN }}
          >
            ← Back to HoodGFX
          </Link>
        </footer>
      </div>
    </div>
  )
}
