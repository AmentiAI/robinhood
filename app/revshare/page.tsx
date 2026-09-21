'use client'

import { PageHeader } from '@/components/page-header'
import { BrandLoader } from '@/components/brand-loader'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const TOTAL_SUPPLY = 168

export default function RevSharePage() {
  const [btcPrice, setBtcPrice] = useState<number | null>(null)
  const [priceLoading, setPriceLoading] = useState(true)

  // Fetch BTC price on mount
  useEffect(() => {
    const fetchBtcPrice = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
        const data = await res.json()
        setBtcPrice(data.bitcoin.usd)
      } catch (err) {
        console.error('Failed to fetch BTC price:', err)
        setBtcPrice(100000) // Fallback price
      } finally {
        setPriceLoading(false)
      }
    }
    fetchBtcPrice()
  }, [])
 
  // Monthly activity assumptions
  const MONTHLY_MINTS = 30000
  const MINT_FEE = 4000
  const MONTHLY_CREDITS = 10000 // USD
  const MONTHLY_MARKETPLACE_VOLUME = 20000000 // sats (0.2 BTC)
  const MONTHLY_INSCRIPTIONS = 5000
  const INSCRIPTION_FEE = 2500

  // Calculate rev shares in sats
  const mintRevShare = Math.floor(MONTHLY_MINTS * MINT_FEE * 0.30)
  const creditRevShareUsd = Math.floor((MONTHLY_CREDITS * 0.50) * 0.30) // $1,500
  const marketplaceRevShare = Math.floor(MONTHLY_MARKETPLACE_VOLUME * 0.03 * 0.30)
  const inscribingRevShare = Math.floor(MONTHLY_INSCRIPTIONS * INSCRIPTION_FEE * 0.30)
  
  // Convert USD to sats using live BTC price
  const usdToSats = (usd: number): number => {
    if (!btcPrice) return 0
    const btcAmount = usd / btcPrice
    return Math.floor(btcAmount * 100000000)
  }

  const creditRevShareSats = usdToSats(creditRevShareUsd)
  const totalRevShareSats = mintRevShare + marketplaceRevShare + inscribingRevShare + creditRevShareSats

  const formatSats = (sats: number) => {
    if (sats >= 1000000) return `${(sats / 1000000).toFixed(1)}M`
    if (sats >= 1000) return `${(sats / 1000).toFixed(0)}K`
    return sats.toLocaleString()
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="30% RevShare"
        subtitle={`Split among ${TOTAL_SUPPLY} collection holders`}
      />
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto">

          <div className="hg-rise rounded-2xl p-6 mb-6 text-center border border-white/[0.1] bg-[#131318]">
            <p className="text-white text-lg">
              <span className="text-2xl font-semibold text-[#2DE2FF]">Your share</span>
              <span className="mx-3 text-zinc-500">=</span>
              <span className="text-lg text-zinc-200">(Pieces ÷ {TOTAL_SUPPLY})</span>
              <span className="mx-3 text-zinc-500">×</span>
              <span className="text-lg text-zinc-200">30% of revenue</span>
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            <div className="bg-[#131318] rounded-2xl p-4 text-center border border-white/[0.08]">
              <div className="text-xs text-zinc-500 font-semibold mb-1">Mints</div>
              <div className="text-lg font-semibold text-[#2DE2FF]">30%</div>
              <div className="text-xs text-zinc-600">of mint fees</div>
            </div>
            <div className="bg-[#131318] rounded-2xl p-4 text-center border border-white/[0.08]">
              <div className="text-3xl mb-2">💳</div>
              <div className="text-xs text-white/70 font-semibold">Credits</div>
              <div className="text-lg font-semibold text-[#2DE2FF]">30%</div>
              <div className="text-xs text-zinc-600">of net profit*</div>
            </div>
            <div className="bg-[#131318] rounded-2xl p-4 text-center border border-white/[0.08]">
              <div className="text-3xl mb-2">🏪</div>
              <div className="text-xs text-white/70 font-semibold">Market</div>
              <div className="text-lg font-semibold text-[#2DE2FF]">30%</div>
              <div className="text-xs text-zinc-600">of 3% fee</div>
              </div>
            <div className="bg-[#131318] rounded-2xl p-4 text-center border border-white/[0.08]">
              <div className="text-3xl mb-2">📜</div>
              <div className="text-xs text-white/70 font-semibold">Inscribe</div>
              <div className="text-lg font-semibold text-[#2DE2FF]">30%</div>
              <div className="text-xs text-zinc-600">of service fee</div>
            </div>
          </div>

          {/* Monthly Example - The Main Event */}
          <div className="bg-[#131318] rounded-2xl overflow-hidden mb-8 border border-white/[0.08]">
            <div className="bg-gradient-to-r from-[#050510] to-[#0f0f1e] px-6 py-4 border-b border-white/[0.08]">
              <h2 className="text-xl font-bold bg-gradient-to-r from-[#2DE2FF] to-[#FF2BD6] bg-clip-text text-transparent text-center">
                📊 Example Monthly Earnings
                </h2>
              {btcPrice && (
                <p className="text-center text-zinc-400 text-xs mt-1">
                  BTC @ ${btcPrice.toLocaleString()}
                </p>
              )}
                        </div>
            
            {/* Activity Summary */}
            <div className="grid grid-cols-4 gap-1 p-4 bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md text-center text-xs">
              <div>
                <div className="font-bold text-white">30K</div>
                <div className="text-white/70">mints</div>
                        </div>
              <div>
                <div className="font-bold text-white">$10K</div>
                <div className="text-white/70">credits</div>
                      </div>
              <div>
                <div className="font-bold text-white">0.2 BTC</div>
                <div className="text-white/70">trades</div>
                    </div>
              <div>
                <div className="font-bold text-white">5K</div>
                <div className="text-white/70">inscriptions</div>
              </div>
            </div>

            {/* Rev Share Pool */}
            <div className="p-6 text-center border-b border-white/[0.08]">
              <div className="text-sm text-white/70 mb-1">Total Monthly Rev Share Pool</div>
              {priceLoading ? (
                <div className="text-2xl text-white/50">
                  <BrandLoader variant="inline" label="Loading" />
                </div>
              ) : (
                <>
                  <div className="text-4xl font-semibold text-[#2DE2FF]">
                    {formatSats(totalRevShareSats)} sats
              </div>
                  <div className="text-sm text-zinc-600 mt-1">
                    (~{(totalRevShareSats / 100000000).toFixed(3)} BTC)
                        </div>
                </>
              )}
                        </div>

            {/* Your Earnings Based on Holdings */}
            <div className="p-6">
              <div className="text-center text-sm text-white/70 mb-4">Your monthly earnings based on holdings</div>
              {priceLoading ? (
                <div className="text-center text-white/50">Calculating...</div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#131318] rounded-2xl p-4 text-center border border-white/[0.08]">
                    <div className="text-xs text-white/70 mb-2">1 piece</div>
                    <div className="text-2xl font-semibold text-[#FF2BD6]">
                      {formatSats(Math.floor(totalRevShareSats / TOTAL_SUPPLY))}
                        </div>
                    <div className="text-sm text-white/70">sats/month</div>
                      </div>
                  <div className="bg-[#131318] rounded-2xl p-4 text-center border border-white/[0.08]/50">
                    <div className="text-xs text-white/70 mb-2">10 pieces</div>
                    <div className="text-2xl font-semibold text-[#2DE2FF]">
                      {formatSats(Math.floor(totalRevShareSats * 10 / TOTAL_SUPPLY))}
                    </div>
                    <div className="text-sm text-white/70">sats/month</div>
                        </div>
                  <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-xl p-4 text-center border border-[#FF2BD6]/30">
                    <div className="text-xs text-white/70 mb-2">22 pieces <span className="text-[#FF2BD6]">(10%)</span></div>
                    <div className="text-2xl font-semibold text-[#FF2BD6]">
                      {formatSats(Math.floor(totalRevShareSats * 22 / TOTAL_SUPPLY))}
                        </div>
                    <div className="text-sm text-white/70">sats/month</div>
                        </div>
                      </div>
              )}
              </div>
            </div>

          {/* Breakdown - Collapsible or minimal */}
          <details className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-xl overflow-hidden mb-8 border border-white/[0.08]">
            <summary className="px-6 py-4 cursor-pointer text-white font-bold flex items-center justify-between">
              <span>📋 Detailed Breakdown by Source</span>
              <span className="text-white/50 text-sm">click to expand</span>
            </summary>
            <div className="px-6 pb-6 grid md:grid-cols-2 gap-4">
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-lg p-4 border border-white/[0.08]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🎨</span>
                  <span className="font-bold text-white">Mint Fees</span>
              </div>
                <div className="text-sm text-[#a8a8b8] space-y-1">
                        <div className="flex justify-between">
                    <span>30K mints × 4K sats:</span>
                    <span className="font-semibold">1.2 BTC</span>
                        </div>
                  <div className="flex justify-between text-[#FF2BD6]">
                    <span>Rev Share (30%):</span>
                    <span className="font-bold">{formatSats(mintRevShare)} sats</span>
                        </div>
                      </div>
                    </div>
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-lg p-4 border border-white/[0.08]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💳</span>
                  <span className="font-bold text-white">Credits</span>
                </div>
                <div className="text-sm text-[#a8a8b8] space-y-1">
                  <div className="flex justify-between">
                    <span>$10K sales → $5K net:</span>
                    <span className="font-semibold">50% costs</span>
                  </div>
                  <div className="flex justify-between text-[#2DE2FF]">
                    <span>Rev Share (30%):</span>
                    <span className="font-bold">${creditRevShareUsd.toLocaleString()} → {formatSats(creditRevShareSats)} sats</span>
                </div>
              </div>
            </div>
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-lg p-4 border border-white/[0.08]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🏪</span>
                  <span className="font-bold text-white">Marketplace</span>
              </div>
                <div className="text-sm text-[#a8a8b8] space-y-1">
                        <div className="flex justify-between">
                    <span>0.2 BTC volume × 3%:</span>
                    <span className="font-semibold">600K sats</span>
                        </div>
                  <div className="flex justify-between text-[#2DE2FF]">
                    <span>Rev Share (30%):</span>
                    <span className="font-bold">{formatSats(marketplaceRevShare)} sats</span>
                        </div>
                      </div>
                    </div>
              <div className="bg-[#131318] rounded-2xl border border-white/[0.08] backdrop-blur-md rounded-lg p-4 border border-white/[0.08]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📜</span>
                  <span className="font-bold text-white">Inscribing</span>
                </div>
                <div className="text-sm text-[#a8a8b8] space-y-1">
                  <div className="flex justify-between">
                    <span>5K × 2.5K sats:</span>
                    <span className="font-semibold">0.125 BTC</span>
                  </div>
                  <div className="flex justify-between text-[#2DE2FF]">
                    <span>Rev Share (30%):</span>
                    <span className="font-bold">{formatSats(inscribingRevShare)} sats</span>
                </div>
              </div>
            </div>
          </div>
          </details>

          {/* Fine Print */}
          <div className="text-center text-zinc-600 text-xs space-y-1">
            <p>* Credits: 30% of net profit after 50% platform costs (converted to sats at current BTC price)</p>
            <p>Payouts processed monthly • Must hold ordinal in wallet to qualify</p>
          </div>

        </div>
      </div>
    </div>
  )
}
