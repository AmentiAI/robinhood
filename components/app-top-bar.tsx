'use client'

import Link from 'next/link'
import { Link2, User, Wallet } from 'lucide-react'
import { useWallet } from '@/lib/wallet/compatibility'

function shortenAddress(address: string) {
  return `${address.slice(0, 5)}...${address.slice(-4)}`
}

export function AppTopBar() {
  const { isConnected, currentAddress } = useWallet()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#050607]/95 backdrop-blur-md border-b border-[#00C805]/20">
      <div className="h-full px-4 lg:px-6 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/launchpad" className="flex items-center gap-3 min-w-0 shrink-0 group">
          <div className="w-9 h-9 rounded-lg bg-[#00C805]/10 border border-[#00C805]/40 flex items-center justify-center shadow-[0_0_18px_rgba(0,200,5,0.25)]">
            <span className="text-[#00C805] text-lg font-black leading-none">◆</span>
          </div>
          <div className="leading-tight">
            <div className="text-lg font-black text-[#00C805] tracking-tight group-hover:text-[#CCFF00] transition-colors">
              OrdMaker
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/70">
              Robinhood Chain
            </div>
          </div>
        </Link>

        {/* Center tagline */}
        <div className="hidden md:flex flex-col items-center flex-1 px-4">
          <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.28em] text-white">
            <span>Build</span>
            <span className="text-[#00C805]">/</span>
            <span>Launch</span>
            <span className="text-[#00C805]">/</span>
            <span>Mint</span>
            <span className="text-[#00C805]">/</span>
            <span>Own</span>
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#71717A] mt-0.5">
            The next generation NFT launchpad
          </p>
        </div>

        {/* Status + wallet */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#15181a] border border-[#00C805]/30">
            <Link2 className="h-3.5 w-3.5 text-[#00C805]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">
              Robinhood Chain
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#00C805]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00C805] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#00C805]" />
              </span>
              Live
            </span>
          </div>

          <div className="hidden xs:flex sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#15181a] border border-white/10">
            <Wallet className="h-3.5 w-3.5 text-[#00C805]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a8aab2]">
              {isConnected && currentAddress ? shortenAddress(currentAddress) : 'Wallet'}
            </span>
          </div>

          <Link
            href="/profile"
            className="w-9 h-9 rounded-full bg-[#15181a] border border-[#00C805]/35 flex items-center justify-center text-[#00C805] hover:bg-[#00C805] hover:text-black transition-colors"
            aria-label="Profile"
          >
            <User className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}
