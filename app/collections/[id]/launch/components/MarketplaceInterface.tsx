'use client'

import Link from 'next/link'
import { Collection } from '../types'

interface MarketplaceInterfaceProps {
  collection: Collection
  collectionId: string
  currentAddress: string | null
  onLoadData: () => Promise<void>
}

export default function MarketplaceInterface({
  collection,
}: MarketplaceInterfaceProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#2DE2FF]/25 bg-[#15181a] p-8">
        <h2 className="text-2xl font-black text-white mb-2">NFT Marketplace</h2>
        <p className="text-[#a8aab2] mb-6">
          Individual NFTs from <span className="text-white font-bold">{collection.name}</span> trade
          on the Robinhood Chain marketplace in ETH after minting.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/marketplace"
            className="px-5 py-3 rounded-xl bg-[#2DE2FF] text-black font-black uppercase text-sm"
          >
            Open Marketplace
          </Link>
          <Link
            href="/marketplace/list"
            className="px-5 py-3 rounded-xl border border-[#2DE2FF]/40 text-[#2DE2FF] font-black uppercase text-sm"
          >
            List an NFT
          </Link>
        </div>
      </div>
    </div>
  )
}
