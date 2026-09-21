'use client'

import { PageHeader } from '@/components/page-header'
import Link from 'next/link'

export default function PassDetailsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Creator Pass"
        subtitle="Hold 1 of 168 passes · Unlock exclusive benefits"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="hg-card hg-rise rounded-2xl p-6 text-center border border-white/[0.1] bg-[#131318]">
            <h2 className="text-2xl font-bold text-[#2DE2FF] mb-1">50% OFF</h2>
            <p className="text-sm font-semibold text-white mb-1">All credits</p>
            <p className="text-xs text-zinc-500">Automatic discount on every purchase</p>
          </div>
          <div className="hg-card hg-rise hg-rise-delay-1 rounded-2xl p-6 text-center border border-white/[0.1] bg-[#131318]">
            <h2 className="text-2xl font-bold text-[#FF2BD6] mb-1">30% RevShare</h2>
            <p className="text-sm font-semibold text-white mb-1">Platform revenue</p>
            <p className="text-xs text-zinc-500">Split among 168 holders</p>
          </div>
          <div className="hg-card hg-rise hg-rise-delay-2 rounded-2xl p-6 text-center border border-white/[0.1] bg-[#131318]">
            <h2 className="text-2xl font-bold text-white mb-1">Whitelist</h2>
            <p className="text-sm font-semibold text-white mb-1">Priority access</p>
            <p className="text-xs text-zinc-500">Early access to launches</p>
          </div>
        </div>

        <div className="hg-rise hg-rise-delay-3 rounded-2xl border border-white/[0.1] bg-[#131318] p-6 mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">How it works</h3>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li>Hold at least one Creator Pass in your connected wallet</li>
            <li>Credit discounts apply automatically at checkout</li>
            <li>Revenue share is distributed to holders periodically</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/revshare"
            className="hg-btn-glow inline-flex h-10 px-5 items-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold"
          >
            View RevShare
          </Link>
          <Link
            href="/buy-credits"
            className="inline-flex h-10 px-5 items-center rounded-full border border-white/15 text-sm font-semibold text-zinc-200 hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-all"
          >
            Buy credits
          </Link>
        </div>
      </div>
    </div>
  )
}
