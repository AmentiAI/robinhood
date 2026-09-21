'use client'

interface LaunchModeSelectorProps {
  onSelectMode: (mode: 'launchpad' | 'owner-mint') => void
}

export default function LaunchModeSelector({ onSelectMode }: LaunchModeSelectorProps) {
  return (
    <div className="hg-card rounded-2xl border border-white/[0.1] bg-[#131318] p-6 sm:p-8 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]">
      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#2DE2FF] mb-2">
        Launch
      </p>
      <h2 className="text-2xl font-bold text-white mb-2">Choose your launch method</h2>
      <p className="text-zinc-500 mb-8 text-sm">How would you like to launch your collection?</p>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => onSelectMode('launchpad')}
          className="group hg-card rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-6 text-left hover:border-[#2DE2FF]/50 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl border border-[#2DE2FF]/30 bg-[#2DE2FF]/10 flex items-center justify-center shrink-0">
              <span className="text-[#2DE2FF] text-sm font-bold">LP</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-[#2DE2FF] transition-colors">
                Launchpad
              </h3>
              <p className="text-zinc-500 text-sm mb-3">
                Let collectors mint NFTs. Set up phases, pricing, and whitelists.
              </p>
              <ul className="text-sm text-zinc-400 space-y-1">
                <li>Public or whitelisted minting</li>
                <li>Multiple mint phases</li>
                <li>Custom pricing per phase</li>
                <li>Automated minting</li>
              </ul>
            </div>
          </div>
        </button>

        <button
          onClick={() => onSelectMode('owner-mint')}
          className="group hg-card rounded-2xl border border-white/[0.1] bg-[#0c0c10] p-6 text-left hover:border-[#FF2BD6]/50 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl border border-[#FF2BD6]/30 bg-[#FF2BD6]/10 flex items-center justify-center shrink-0">
              <span className="text-[#FF2BD6] text-sm font-bold">OM</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white mb-1.5 group-hover:text-[#FF2BD6] transition-colors">
                Owner mint
              </h3>
              <p className="text-zinc-500 text-sm mb-3">
                Mint specific NFTs from your collection outside the launchpad.
              </p>
              <ul className="text-sm text-zinc-400 space-y-1">
                <li>Mint to specific wallets</li>
                <li>Reserve pieces for team / giveaways</li>
                <li>Pre-mint before launch</li>
                <li>Manual control</li>
              </ul>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
