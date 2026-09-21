'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@/lib/wallet/compatibility'
import { PageHeader } from '@/components/page-header'
import { CreditPurchase } from '@/components/credit-purchase'
import { useCredits } from '@/lib/credits-context'
import Link from 'next/link'

export default function BuyCreditsPage() {
  const { isConnected, currentAddress } = useWallet()
  const { credits, loading: loadingCredits, loadCredits, addCreditsLocally } = useCredits()
  const [showCreditPurchase, setShowCreditPurchase] = useState(true)

  const activeWalletAddress = currentAddress && isConnected ? currentAddress : null
  const activeWalletConnected = isConnected

  useEffect(() => {
    const checkSetting = async () => {
      try {
        const response = await fetch('/api/admin/site-settings?key=show_credit_purchase')
        if (response.ok) {
          const data = await response.json()
          setShowCreditPurchase(data.value !== false)
        }
      } catch (error) {
        console.error('Error checking site settings:', error)
        setShowCreditPurchase(true)
      }
    }
    checkSetting()
  }, [])

  useEffect(() => {
    if (activeWalletConnected && activeWalletAddress) {
      loadCredits(activeWalletAddress)
    }
  }, [activeWalletConnected, activeWalletAddress, loadCredits])

  const handlePurchaseComplete = (creditsAwarded?: number) => {
    if (creditsAwarded && creditsAwarded > 0) {
      addCreditsLocally(creditsAwarded)
    }
    if (activeWalletAddress) {
      loadCredits(activeWalletAddress, true)
    }
  }

  const balanceLabel =
    credits === null
      ? null
      : typeof credits === 'number'
        ? credits.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
        : parseFloat(String(credits)).toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          })

  if (!activeWalletConnected) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.1] bg-[#131318] p-8 text-center hg-rise shadow-[0_0_40px_rgba(45,226,255,0.08)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#2DE2FF] mb-3">
            Credits
          </p>
          <h1 className="text-2xl font-bold text-white mb-2">Connect to buy credits</h1>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            Connect your wallet to purchase credits and start creating.
          </p>
          <Link
            href="/launchpad"
            className="hg-btn-glow inline-flex h-11 px-6 items-center rounded-full bg-gradient-to-r from-[#2DE2FF] via-[#A855F7] to-[#FF2BD6] text-[#0a0a0c] text-sm font-bold"
          >
            Go to launchpad
          </Link>
        </div>
      </div>
    )
  }

  if (!showCreditPurchase) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.1] bg-[#131318] p-8 text-center hg-rise">
          <h1 className="text-2xl font-bold text-white mb-2">Buy credits</h1>
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
            Credit purchase is currently unavailable. Please check back later.
          </p>
          <Link
            href="/launchpad"
            className="inline-flex h-11 px-6 items-center rounded-full border border-white/15 text-zinc-200 text-sm font-semibold hover:border-[#2DE2FF]/40 hover:text-[#2DE2FF] transition-all"
          >
            Go to launchpad
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c]">
      <PageHeader
        title="Buy credits"
        subtitle="Power generation, traits, stickers, and launches"
        action={
          !loadingCredits && balanceLabel !== null ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[#2DE2FF]/25 bg-gradient-to-r from-[#2DE2FF]/10 to-[#FF2BD6]/10 px-5 py-3 shadow-[0_0_24px_rgba(45,226,255,0.12)]">
              <div>
                <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-semibold">
                  Balance
                </div>
                <div className="text-xl font-bold text-[#2DE2FF] tabular-nums leading-tight">
                  {balanceLabel}
                </div>
              </div>
            </div>
          ) : undefined
        }
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <div className="hg-rise">
          <CreditPurchase onPurchaseComplete={handlePurchaseComplete} />
        </div>

        <div className="hg-card hg-rise hg-rise-delay-1 rounded-2xl border border-white/[0.1] bg-[#131318] p-6 sm:p-7">
          <h2 className="text-lg font-semibold text-white mb-2">What are credits?</h2>
          <p className="text-zinc-500 mb-5 text-sm leading-relaxed">
            Credits power everything you create on HoodGFX.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {[
              { title: 'Generate collections', body: 'Create NFT collections and images', color: '#2DE2FF' },
              { title: 'Create traits', body: 'Design and analyze trait combinations', color: '#A855F7' },
              { title: 'Promotional materials', body: 'Generate marketing content', color: '#FF2BD6' },
              { title: 'Advanced tools', body: 'Access premium studio features', color: '#2DE2FF' },
            ].map((item) => (
              <div
                key={item.title}
                className="relative overflow-hidden flex items-start gap-3 p-4 rounded-xl bg-[#0c0c10] border border-white/[0.08] hover:border-white/16 transition-colors"
              >
                <div
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
                  style={{ background: item.color }}
                />
                <div className="pl-2">
                  <div className="font-semibold text-white text-sm mb-0.5">{item.title}</div>
                  <div className="text-xs text-zinc-500">{item.body}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[#2DE2FF]/20 bg-[#2DE2FF]/[0.06] px-4 py-3.5">
            <p className="text-zinc-400 text-sm leading-relaxed">
              Credits never expire. Purchase securely with ETH on Robinhood Chain.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
