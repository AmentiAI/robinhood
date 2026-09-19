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
      <div className="text-center py-8 text-white/60">Connect your wallet to buy credits</div>
    )
  }

  return (
    <div className="space-y-6">
      {holderStatus?.isHolder && (
        <p className="text-sm text-[#2DE2FF]">Holder discount active ({holderStatus.discountPercent}%)</p>
      )}
      {checkingHolder && <p className="text-xs text-white/40">Checking holder status...</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {discountedTiers.map((tier, index) => (
          <button
            key={tier.credits}
            type="button"
            onClick={() => handlePurchase(index)}
            className="border border-[#2DE2FF]/40 p-4 text-left hover:border-[#2DE2FF] transition-colors bg-[#111]"
          >
            <div className="text-white font-bold text-lg">{tier.credits} credits</div>
            <div className="text-[#2DE2FF] mt-1">${tier.discountedPrice.toFixed(2)}</div>
            <div className="text-xs text-white/50 mt-1">Pay with ETH on Robinhood Chain</div>
            {creditCosts && (
              <div className="text-xs text-white/40 mt-2">
                AI generation costs apply per credit
              </div>
            )}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {checkingPayment && <p className="text-[#2DE2FF] text-sm">Confirming payment...</p>}
      {txHash && (
        <a
          href={getExplorerTxUrl(txHash)}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-[#2DE2FF] underline"
        >
          View transaction
        </a>
      )}
      {paymentStatus?.success && (
        <p className="text-green-400 text-sm">
          Credits added{paymentStatus.credits ? `: ${paymentStatus.credits}` : ''}
        </p>
      )}
      {paymentInfo && !paymentStatus?.success && (
        <p className="text-white/50 text-xs">
          Payment {currentPaymentId} — {paymentInfo.ethAmount} ETH
        </p>
      )}
      {selectedTier !== null && null}
    </div>
  )
}
