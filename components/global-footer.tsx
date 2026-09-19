'use client'

import Link from 'next/link'

export function GlobalFooter() {
  const enableRevenueShare = process.env.NEXT_PUBLIC_ENABLE_REVENUE_SHARE === 'true'

  return (
    <footer className="bg-[#050507] text-white/40 border-t border-white/[0.08] mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="text-lg mb-3 font-semibold text-white tracking-tight">
              Hood<span className="text-[#FF2BD6]">GFX</span>
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              NFT creation studio on Robinhood Chain. Build, launch, and grow your collection.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/launchpad" className="text-[#808080] hover:text-[#2DE2FF] transition-colors text-xs font-medium uppercase tracking-wide">
                  Launchpad
                </Link>
              </li>
              <li>
                <Link href="/promotion" className="text-[#808080] hover:text-[#2DE2FF] transition-colors text-xs font-medium uppercase tracking-wide">
                  Promote
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-[#808080] hover:text-[#2DE2FF] transition-colors text-xs font-medium uppercase tracking-wide">
                  Collections
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Features</h4>
            <ul className="space-y-2">
              {enableRevenueShare && (
                <>
                  <li>
                    <Link href="/revshare" className="text-[#808080] hover:text-[#2DE2FF] transition-colors text-xs font-medium uppercase tracking-wide">
                      Revenue Share
                    </Link>
                  </li>
                  <li>
                    <Link href="/pass-details" className="text-[#808080] hover:text-[#2DE2FF] transition-colors text-xs font-medium uppercase tracking-wide">
                      Pass Details
                    </Link>
                  </li>
                </>
              )}
              <li>
                <Link href="/buy-credits" className="text-[#808080] hover:text-[#2DE2FF] transition-colors text-xs font-medium uppercase tracking-wide">
                  Buy Credits
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-[#808080] hover:text-[#2DE2FF] transition-colors text-xs font-medium uppercase tracking-wide">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-[#808080] hover:text-[#2DE2FF] transition-colors text-xs font-medium uppercase tracking-wide">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/[0.08]">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-5">
              <a
                href="https://x.com/hoodgfx"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 bg-[#0a0c0d] border border-[#2DE2FF]/35 hover:border-[#FF2BD6] hover:bg-[#15181a] transition-all group"
                aria-label="Follow us on X (Twitter)"
              >
                <svg
                  className="w-4 h-4 text-[#808080] group-hover:text-[#2DE2FF] transition-colors"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <p className="text-xs text-[#808080]">
                © {new Date().getFullYear()} <span className="text-white font-medium">HoodGFX</span>
              </p>
            </div>
            <p className="text-xs text-[#808080] uppercase tracking-wider">
              Built on <span className="text-[#2DE2FF] font-bold">Robinhood Chain</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
