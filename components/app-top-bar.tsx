'use client'

import Image from 'next/image'
import Link from 'next/link'
import { User } from 'lucide-react'
import { useWallet } from '@/lib/wallet/compatibility'

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function AppTopBar() {
  const { isConnected, currentAddress } = useWallet()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 sm:h-[4.25rem] bg-[#050507]/95 backdrop-blur-md border-b border-white/[0.08]">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #2DE2FF, #FF2BD6, transparent)' }}
      />
      <div className="h-full px-4 lg:px-7 flex items-center justify-between gap-4">
        <Link href="/launchpad" className="flex items-center gap-3 min-w-0 shrink-0 group">
          <Image
            src="/hoodgfx-hero.png"
            alt="HoodGFX"
            width={44}
            height={44}
            className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
          />
          <div className="min-w-0">
            <span className="block text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-[#2DE2FF] transition-colors leading-none">
              Hood<span className="text-[#FF2BD6]">GFX</span>
            </span>
            <span className="hidden sm:block text-[10px] text-white/35 tracking-wide mt-1">
              Robinhood Chain
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <span className="hidden sm:inline text-[13px] text-white/40 font-medium">
            {isConnected && currentAddress ? shortenAddress(currentAddress) : 'Not connected'}
          </span>
          <Link
            href="/profile"
            className="w-11 h-11 border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:border-[#2DE2FF]/50 hover:bg-[#2DE2FF]/10 transition-colors"
            aria-label="Profile"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
