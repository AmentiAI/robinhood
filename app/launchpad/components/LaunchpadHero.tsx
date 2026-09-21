'use client'

import Image from 'next/image'

interface LaunchpadHeroProps {
  onExplore: () => void
}

export function LaunchpadHero({ onExplore }: LaunchpadHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#131318] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
      <button
        type="button"
        onClick={onExplore}
        className="block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2DE2FF]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0c]"
        aria-label="Explore collections"
      >
        <Image
          src="/launchpad-hero.png"
          alt="HoodGFX Launchpad — Create, compress, and launch full NFT collections"
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
