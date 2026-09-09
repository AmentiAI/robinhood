'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Phantom Solana selector removed — Robinhood Chain uses injected EVM wallets. */
export function PhantomWalletSelector({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
  onSelectSolana?: () => void
}) {
  const router = useRouter()
  useEffect(() => {
    if (isOpen) {
      onClose()
      router.refresh()
    }
  }, [isOpen, onClose, router])
  return null
}
