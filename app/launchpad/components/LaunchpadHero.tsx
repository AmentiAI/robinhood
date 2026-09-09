'use client'

import Image from 'next/image'

interface LaunchpadHeroProps {
  onExplore: () => void
}

export function LaunchpadHero({ onExplore }: LaunchpadHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#00C805]/40 bg-black shadow-[0_0_60px_rgba(0,200,5,0.15)]">
      <button
        type="button"
        onClick={onExplore}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00C805] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        aria-label="Explore collections"
      >
        <Image
          src="/launchpad-hero.png"
          alt="OrdMaker Launchpad — Discover and mint NFT collections on Robinhood Chain. Low fees, secure, sustainable."
          width={1536}
          height={640}
          priority
          className="w-full h-auto object-cover object-center"
          sizes="(max-width: 1400px) 100vw, 1400px"
        />
      </button>
    </section>
  )
}
