'use client'

import Link from 'next/link'

export function GlobalFooter() {
  const enableRevenueShare = process.env.NEXT_PUBLIC_ENABLE_REVENUE_SHARE === 'true'

  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-transparent">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10">
        <div className="rounded-2xl border border-white/[0.08] bg-[#131318]/70 px-6 sm:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <h3 className="text-base mb-2 font-bold tracking-tight text-white">
                Hood<span className="text-[#FF2BD6]">GFX</span>
              </h3>
              <p className="text-sm text-zinc-500 leading-relaxed">
                NFT creation studio on Robinhood Chain. Build, launch, and grow.
              </p>
            </div>
            <div>
              <h4 className="text-zinc-300 font-semibold mb-3 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/launchpad" className="text-zinc-500 hover:text-white transition-colors">Launchpad</Link></li>
                <li><Link href="/collections" className="text-zinc-500 hover:text-white transition-colors">Collections</Link></li>
                <li><Link href="/promotion" className="text-zinc-500 hover:text-white transition-colors">Promote</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-300 font-semibold mb-3 text-sm">Features</h4>
              <ul className="space-y-2 text-sm">
                {enableRevenueShare && (
                  <>
                    <li><Link href="/revshare" className="text-zinc-500 hover:text-white transition-colors">Revenue Share</Link></li>
                    <li><Link href="/pass-details" className="text-zinc-500 hover:text-white transition-colors">Pass Details</Link></li>
                  </>
                )}
                <li><Link href="/buy-credits" className="text-zinc-500 hover:text-white transition-colors">Buy Credits</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-zinc-300 font-semibold mb-3 text-sm">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="text-zinc-500 hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="text-zinc-500 hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-3">
            <a
              href="https://x.com/Hood_GFX_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-zinc-500 hover:text-[#2DE2FF] transition-colors"
            >
              @Hood_GFX_
            </a>
            <p className="text-xs text-zinc-600">© {new Date().getFullYear()} HoodGFX</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
