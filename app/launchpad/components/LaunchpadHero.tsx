'use client'

import Image from 'next/image'

interface LaunchpadHeroProps {
  onExplore: () => void
}

export function LaunchpadHero({ onExplore }: LaunchpadHeroProps) {
  return (
    <section className="relative overflow-hidden border border-white/[0.08] bg-[#050507] shadow-[0_0_60px_rgba(45,226,255,0.08)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px z-20"
        style={{
          background: 'linear-gradient(90deg, transparent, #2DE2FF, #FF2BD6, transparent)',
        }}
      />
      <button
        type="button"
        onClick={onExplore}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        aria-label="Explore collections"
      >
        <Image
          src="/launchpad-hero.png"
          alt="HoodGFX Launchpad — Discover and mint NFT collections on Robinhood Chain"
          width={1536}
          height={864}
          priority
          className="w-full h-auto object-cover object-center"
          sizes="(max-width: 1400px) 100vw, 1400px"
        />
      </button>
    </section>
  )
}
