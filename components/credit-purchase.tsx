'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { CREDIT_TIERS } from '@/lib/credits/constants'
import { useWallet } from '@/lib/wallet/compatibility'
import { useEvmWallet } from '@/lib/wallet/evm-wallet-context'
import { useCreditCosts } from '@/lib/credits/use-credit-costs'
import { PaymentMethod } from '@/components/payment-method-selector'
import { getExplorerTxUrl } from '@/lib/explorer'

interface CreditPurchaseProps {
  onPurchaseComplete?: (creditsAwarded?: number) => void
}

interface HolderStatus {
  isHolder: boolean
  holdingCount: number
  collection: string
  discountPercent: number
}

export function CreditPurchase({ onPurchaseComplete }: CreditPurchaseProps) {
  const { isConnected, currentAddress } = useWallet()
  const { sendTransaction } = useEvmWallet()
  const { costs: creditCosts } = useCreditCosts()
  const [selectedTier, setSelectedTier] = useState<number | null>(null)
  const [holderStatus, setHolderStatus] = useState<HolderStatus | null>(null)
  const [checkingHolder, setCheckingHolder] = useState(false)
  const purchasingRef = useRef(false)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<any>(null)
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const activeWalletAddress = isConnected && currentAddress ? currentAddress : null
  const paymentMethod: PaymentMethod = 'eth'

  useEffect(() => {
    const checkHolderStatus = async () => {
      if (!activeWalletAddress) {
        setHolderStatus(null)
        return
      }
      setCheckingHolder(true)
      try {
        const response = await fetch(
          `/api/holder-check?wallet_address=${encodeURIComponent(activeWalletAddress)}`
        )
        if (response.ok) setHolderStatus(await response.json())
      } catch {
        setHolderStatus(null)
      } finally {
        setCheckingHolder(false)
      }
    }
    checkHolderStatus()
  }, [activeWalletAddress])

  const discountedTiers = useMemo(() => {
    const discountMultiplier = holderStatus?.isHolder ? 0.5 : 1
    return CREDIT_TIERS.map((tier) => ({
      ...tier,
      discountedPrice: tier.totalPrice * discountMultiplier,
      discountedPricePerCredit: tier.pricePerCredit * discountMultiplier,
    }))
  }, [holderStatus?.isHolder])

  const cancelPendingPayment = useCallback(async (paymentId: string, walletAddress: string) => {
    try {
      await fetch('/api/credits/cancel-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentId, wallet_address: walletAddress }),
      })
    } catch {
      /* expire naturally */
    }
  }, [])

  const handlePurchase = useCallback(
    async (tierIndex: number) => {
      if (purchasingRef.current) return
      purchasingRef.current = true

      if (!isConnected || !currentAddress) {
        setError('Please connect your wallet first')
        purchasingRef.current = false
        return
      }

      setError(null)
      let paymentId: string | null = null

      try {
        const response = await fetch('/api/credits/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: currentAddress,
            tier_index: tierIndex,
            payment_type: 'eth',
            network: 'robinhood',
            holder_discount: holderStatus?.isHolder ? 50 : 0,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create payment')
        }

        const paymentData = await response.json()
        paymentId = paymentData.paymentId
        const ethAmount = paymentData.ethAmount
        if (!ethAmount || ethAmount <= 0) throw new Error('Invalid payment amount')

        const hash = await sendTransaction(paymentData.paymentAddress, ethAmount)
        setTxHash(hash)
        setSelectedTier(tierIndex)
        setCurrentPaymentId(paymentId)
        setPaymentInfo({ ...paymentData, ethAmount })
        setCheckingPayment(true)

        const verifyRes = await fetch('/api/credits/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_id: paymentId,
            wallet_address: currentAddress,
            tx_hash: hash,
            payment_type: 'eth',
          }),
        })

        const verifyData = await verifyRes.json()
        if (verifyRes.ok && verifyData.success) {
          setPaymentStatus({ success: true, credits: verifyData.creditsAwarded || paymentData.creditsAmount })
          onPurchaseComplete?.(verifyData.creditsAwarded || paymentData.creditsAmount)
          window.dispatchEvent(new CustomEvent('refreshCredits'))
        } else {
          setPaymentStatus({
            success: false,
            message: verifyData.error || 'Payment submitted; credits may take a moment to apply',
          })
        }
      } catch (err: any) {
        const msg = err?.message || ''
        const rejected =
          err?.code === 4001 || msg.toLowerCase().includes('reject') || msg.toLowerCase().includes('denied')
        if (paymentId && currentAddress) await cancelPendingPayment(paymentId, currentAddress)
        if (!rejected) setError(msg || 'Purchase failed')
      } finally {
        purchasingRef.current = false
        setCheckingPayment(false)
      }
    },
    [
      isConnected,
      currentAddress,
      holderStatus,
      sendTransaction,
      cancelPendingPayment,
      onPurchaseComplete,
    ]
  )

  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-white/[0.1] bg-[#131318] p-8 text-center text-zinc-500">
        Connect your wallet to buy credits
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {holderStatus?.isHolder && (
        <div className="hg-rise rounded-2xl border border-[#2DE2FF]/25 bg-gradient-to-r from-[#2DE2FF]/10 to-[#FF2BD6]/10 px-4 py-3">
          <p className="text-sm font-semibold text-[#2DE2FF]">
            Holder discount active ({holderStatus.discountPercent}% off)
          </p>
        </div>
      )}
      {checkingHolder && (
        <p className="text-xs text-zinc-500">Checking holder status…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {discountedTiers.map((tier, index) => {
          const isSelected = selectedTier === index
          const hasDiscount =
            holderStatus?.isHolder && tier.discountedPrice < tier.totalPrice

          return (
            <button
              key={tier.credits}
              type="button"
              onClick={() => handlePurchase(index)}
              disabled={checkingPayment}
              className={`hg-card hg-rise group relative overflow-hidden rounded-2xl border p-5 text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                isSelected
                  ? 'border-[#2DE2FF]/50 bg-[#131318] shadow-[0_0_28px_rgba(45,226,255,0.15)]'
                  : 'border-white/[0.1] bg-[#131318] hover:border-[#2DE2FF]/35'
              }`}
              style={{ animationDelay: `${index * 0.06}s` }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition-opacity"
                style={{
                  background:
                    index % 2 === 0
                      ? 'radial-gradient(circle, rgba(45,226,255,0.35), transparent 70%)'
                      : 'radial-gradient(circle, rgba(255,43,214,0.3), transparent 70%)',
                }}
              />
              <div className="relative">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-500 font-semibold mb-1">
                      Tier {index + 1}
                    </div>
                    <div className="text-xl font-bold text-white tabular-nums">
                      {tier.credits.toLocaleString()}{' '}
                      <span className="text-sm font-semibold text-zinc-400">credits</span>
                    </div>
                  </div>
                  {hasDiscount && (
                    <span className="shrink-0 rounded-full bg-[#FF2BD6]/15 border border-[#FF2BD6]/30 px-2.5 py-1 text-[10px] font-bold text-[#FF2BD6] uppercase tracking-wide">
                      −{holderStatus?.discountPercent}%
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  {hasDiscount && (
                    <div className="text-xs text-zinc-500 line-through mb-0.5">
                      ${tier.totalPrice.toFixed(2)}
                    </div>
                  )}
                  <div className="text-2xl font-bold text-[#2DE2FF] tabular-nums">
                    ${tier.discountedPrice.toFixed(2)}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    ${tier.discountedPricePerCredit.toFixed(4)} / credit · ETH on Robinhood Chain
                  </div>
                </div>

                {creditCosts && (
                  <div className="text-[11px] text-zinc-600 mb-4">
                    AI generation costs apply per credit
                  </div>
                )}

                <div className="hg-btn-glow inline-flex h-10 w-full items-center justify-center rounded-full bg-[#2DE2FF] text-[#0a0a0c] text-sm font-bold group-hover:bg-gradient-to-r group-hover:from-[#2DE2FF] group-hover:via-[#A855F7] group-hover:to-[#FF2BD6]">
                  {checkingPayment && isSelected ? 'Confirming…' : 'Buy with ETH'}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {checkingPayment && (
        <p className="text-sm text-[#2DE2FF]">Confirming payment…</p>
      )}
      {txHash && (
        <a
          href={getExplorerTxUrl(txHash)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-sm font-semibold text-[#2DE2FF] hover:text-[#7aefff] underline underline-offset-2"
        >
          View transaction
        </a>
      )}
      {paymentStatus?.success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          Credits added{paymentStatus.credits ? `: ${paymentStatus.credits}` : ''}
        </div>
      )}
      {paymentInfo && !paymentStatus?.success && (
        <p className="text-xs text-zinc-500">
          Payment {currentPaymentId} — {paymentInfo.ethAmount} ETH
        </p>
      )}
      {selectedTier !== null && null}
    </div>
  )
}
