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

  // Determine active wallet (Bitcoin only)
  const activeWalletAddress = currentAddress && isConnected ? currentAddress : null
  const activeWalletConnected = isConnected

  useEffect(() => {
    // Check if credit purchase should be shown
    const checkSetting = async () => {
      try {
        const response = await fetch('/api/admin/site-settings?key=show_credit_purchase')
        if (response.ok) {
          const data = await response.json()
          setShowCreditPurchase(data.value !== false)
        }
      } catch (error) {
        console.error('Error checking site settings:', error)
        // Default to showing if we can't check
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
      // Instant local update — balance shows new total immediately
      addCreditsLocally(creditsAwarded)
    }
    // Also fetch from server to confirm exact amount
    if (activeWalletAddress) {
      loadCredits(activeWalletAddress, true)
    }
  }

  if (!activeWalletConnected) {
    return (
      <div className="min-h-screen bg-[#0a0c0d] flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-6">
          <div className="w-32 h-32 mx-auto mb-8 bg-[#0a0c0d] border-2 border-[#00C805] flex items-center justify-center">
            <span className="text-6xl">🔌</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-[#00C805] uppercase tracking-wide">
            Buy Credits
          </h1>
          <p className="text-xl text-[#808080] mb-10 font-medium leading-relaxed">
            Please connect your wallet to purchase credits and start creating amazing NFTs.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#0a0c0d] border-2 border-[#00C805] hover:bg-[#15181a] text-[#00C805] text-lg font-semibold uppercase tracking-wide transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span>Go to Homepage</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  if (!showCreditPurchase) {
    return (
      <div className="min-h-screen bg-[#0a0c0d] flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center px-6">
          <div className="w-32 h-32 mx-auto mb-8 bg-[#0a0c0d] border-2 border-[#00C805] flex items-center justify-center">
            <span className="text-6xl">⚠️</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-[#00C805] uppercase tracking-wide">
            Buy Credits
          </h1>
          <p className="text-xl text-[#808080] mb-10 font-medium leading-relaxed">
            Credit purchase is currently unavailable. Please check back later.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#0a0c0d] border-2 border-[#00C805] hover:bg-[#15181a] text-[#00C805] text-lg font-semibold uppercase tracking-wide transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <span>Go to Homepage</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0c0d]">
      <PageHeader
        title="Buy Credits"
        subtitle="Purchase credits to generate collections, traits, and more"
        action={
          !loadingCredits && credits !== null ? (
            <div className="flex items-center gap-3 bg-[#15181a] border-2 border-[#00C805] px-5 py-3">
              <span className="text-2xl">💰</span>
              <div>
                <div className="text-xs text-[#808080] font-medium uppercase tracking-wide">Balance</div>
                <div className="text-xl font-bold text-[#00C805]">
                  {typeof credits === 'number'
                    ? credits.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                    : parseFloat(String(credits)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          ) : undefined
        }
      />

      <div className="w-full py-12 bg-[#0a0c0d] mt-12">
        <div className="max-w-5xl mx-auto space-y-8 px-6 lg:px-12">

          {/* Credit Purchase Component */}
          <CreditPurchase onPurchaseComplete={handlePurchaseComplete} />

          {/* Info Section */}
          <div className="bg-[#15181a] border border-[#404040] p-8">
            <h2 className="text-3xl font-bold text-[#00C805] mb-6 uppercase tracking-wide">What are Credits?</h2>
            <p className="text-[#808080] mb-6 text-lg leading-relaxed">
              Credits are used to power various features on OrdMaker.fun:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-[#0a0c0d] border border-[#404040]">
                <span className="text-2xl">🎨</span>
                <div>
                  <div className="font-semibold text-white mb-1 uppercase tracking-wide">Generate Collections</div>
                  <div className="text-sm text-[#808080]">Create ordinal collections and images</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[#0a0c0d] border border-[#404040]">
                <span className="text-2xl">✨</span>
                <div>
                  <div className="font-semibold text-white mb-1 uppercase tracking-wide">Create Traits</div>
                  <div className="text-sm text-[#808080]">Design and analyze trait combinations</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[#0a0c0d] border border-[#404040]">
                <span className="text-2xl">📢</span>
                <div>
                  <div className="font-semibold text-white mb-1 uppercase tracking-wide">Promotional Materials</div>
                  <div className="text-sm text-[#808080]">Generate marketing content</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[#0a0c0d] border border-[#404040]">
                <span className="text-2xl">🛠️</span>
                <div>
                  <div className="font-semibold text-white mb-1 uppercase tracking-wide">Advanced Tools</div>
                  <div className="text-sm text-[#808080]">Access premium features</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-[#0a0c0d] border-2 border-[#00C805]">
              <span className="text-2xl">💎</span>
              <p className="text-[#808080] text-sm">
                Credits never expire and can be used at any time. Purchase credits securely using ETH on Robinhood Chain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

