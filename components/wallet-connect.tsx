'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useEvmWallet } from '@/lib/wallet/evm-wallet-context'
import { useProfile } from '@/lib/profile/useProfile'
import { useCredits } from '@/lib/credits-context'

export function WalletConnect() {
  const [mounted, setMounted] = useState(false)
  const {
    isConnected,
    address,
    isVerified,
    isVerifying,
    verificationRejected,
    verifyWallet,
    connect,
    disconnect,
  } = useEvmWallet()
  const { profile, loading: profileLoading, refreshProfile } = useProfile()
  const [pendingInvitations, setPendingInvitations] = useState(0)

  const activeAddress = address
  const activeIsConnected = isConnected

  const { credits, loading: loadingCredits, loadCredits, clearCredits } = useCredits()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (activeIsConnected && activeAddress) {
      loadCredits(activeAddress)
    } else {
      clearCredits()
    }
  }, [activeIsConnected, activeAddress, loadCredits, clearCredits])

  // Load pending invitations
  useEffect(() => {
    if (!activeAddress) {
      setPendingInvitations(0)
      return
    }

    const loadPendingInvitations = async () => {
      try {
        const response = await fetch(`/api/collaborations/invitations?wallet_address=${encodeURIComponent(activeAddress)}`)
        if (response.ok) {
          const data = await response.json()
          setPendingInvitations(data.invitations?.length || 0)
        }
      } catch (error) {
        console.error('Error loading pending invitations:', error)
      }
    }

    loadPendingInvitations()

    const handleInvitationUpdate = () => loadPendingInvitations()
    window.addEventListener('invitationUpdated', handleInvitationUpdate)
    return () => window.removeEventListener('invitationUpdated', handleInvitationUpdate)
  }, [activeAddress])

  const [isOpen, setIsOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hasCheckedProfileRef = useRef<string | null>(null)
  const isMountedRef = useRef(false)

  const createAccountForWallet = useCallback(async (walletAddress: string) => {
    if (!isMountedRef.current) return

    try {
      const profileResponse = await fetch(`/api/profile?wallet_address=${encodeURIComponent(walletAddress)}`)
      if (!profileResponse.ok) return

      const data = await profileResponse.json()

      if (!data.profile) {
        const createResponse = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            wallet_address: walletAddress,
            wallet_type: 'eth',
          }),
        })

        if (createResponse.ok) {
          setTimeout(() => {
            if (isMountedRef.current) {
              refreshProfile()
              window.dispatchEvent(new CustomEvent('profileCreated', { detail: { address: walletAddress, walletType: 'eth' } }))
            }
          }, 500)
        }
      } else {
        if (data.profile.walletType !== 'eth') {
          await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              wallet_address: walletAddress,
              wallet_type: 'eth',
            }),
          })
        }
        setTimeout(() => {
          if (isMountedRef.current) refreshProfile()
        }, 500)
      }
    } catch (error) {
      console.error('Error creating account:', error)
    }
  }, [refreshProfile])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true)
    }, 100)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside, true)
    }
  }, [isOpen])

  useEffect(() => {
    isMountedRef.current = true
    return () => { isMountedRef.current = false }
  }, [])

  // Auto-create profile when wallet connects
  useEffect(() => {
    if (isConnected && activeAddress) {
      if (profileLoading) return
      if (hasCheckedProfileRef.current === activeAddress) return

      if (!profile) {
        hasCheckedProfileRef.current = activeAddress
        setTimeout(() => {
          if (isMountedRef.current && activeAddress === hasCheckedProfileRef.current) {
            createAccountForWallet(activeAddress).catch(err => {
              console.error('Error creating account:', err)
            })
          }
        }, 500)
      } else {
        hasCheckedProfileRef.current = activeAddress
      }
    } else if (!isConnected) {
      hasCheckedProfileRef.current = null
    }
  }, [isConnected, activeAddress, profile, profileLoading, createAccountForWallet])

  // Show toast when wallet connects (no auto-verify — opening a signMessage popup
  // right after connect causes race conditions that kill the popup 50% of the time)
  useEffect(() => {
    if (isConnected && activeAddress) {
      toast.success('Wallet connected!')
    }
  }, [isConnected, activeAddress])

  const handleConnect = async () => {
    setIsConnecting(true)
    setIsOpen(false)
    try {
      const ok = await connect()
      if (!ok) toast.error('Failed to connect wallet')
    } catch (error) {
      console.error('Connection error:', error)
      toast.error('Failed to connect wallet')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setIsOpen(false)
    try {
      await disconnect()
      toast.success('Wallet disconnected')
    } catch (error) {
      console.error('Disconnect error:', error)
      toast.error('Failed to disconnect wallet')
    }
  }

  const handleVerify = async () => {
    await verifyWallet()
  }

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 4)}...${addr.substring(addr.length - 4)}`
  }

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <button
        disabled
        className="w-full px-4 py-3 rounded-lg bg-[#2DE2FF]/70 text-[#0b0b0d] text-sm font-semibold transition-colors flex items-center justify-center gap-2 opacity-80"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Connect wallet
      </button>
    )
  }

  if (isConnecting) {
    return (
      <button
        disabled
        className="w-full px-4 py-3 rounded-lg bg-[#121214] text-zinc-400 text-sm font-medium opacity-60 cursor-not-allowed border border-white/10"
      >
        Connecting…
      </button>
    )
  }

  if (activeIsConnected && activeAddress) {
    const creditDisplay = loadingCredits
      ? '...'
      : credits !== null
        ? typeof credits === 'number'
          ? credits.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
          : parseFloat(String(credits)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
        : '0'

    const buttonText = (profileLoading && !profile)
      ? `Loading... | ${creditDisplay}`
      : profile?.username
        ? `@${profile.username} | ${creditDisplay}`
        : `${formatAddress(activeAddress)} | ${creditDisplay}`

    return (
      <div className="relative flex flex-col w-full" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3.5 py-3 rounded-lg bg-[#121214] hover:bg-[#161618] text-zinc-100 text-sm font-medium transition-colors flex items-center justify-between gap-2 border border-white/[0.08] hover:border-white/14"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2DE2FF] flex-shrink-0" />
            <span className="truncate text-xs">{buttonText}</span>
          </div>
          <svg
            className={`w-3 h-3 transition-transform text-zinc-500 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 rounded-lg bg-[#121214] border border-white/[0.1] shadow-xl z-[9999] overflow-hidden">
            <div className="p-3.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName || profile.username || 'Avatar'}
                    className="w-9 h-9 object-cover rounded-md border border-white/10"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-md bg-[#18181b] border border-white/10 flex items-center justify-center text-[#2DE2FF] font-semibold text-sm">
                    {profile?.username?.charAt(0).toUpperCase() || activeAddress.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-100 font-medium truncate text-sm">
                    {profile?.displayName || profile?.username || 'Wallet'}
                  </p>
                  <p className="text-zinc-500 text-xs font-mono truncate" title={activeAddress}>
                    {formatAddress(activeAddress)}
                  </p>
                  <p className="text-zinc-600 text-[11px] mt-0.5">Robinhood Chain</p>
                </div>
              </div>
            </div>

            <div className="p-2">
              {!isVerified && !isVerifying && (
                <>
                  <button
                    onClick={handleVerify}
                    className="w-full px-3 py-2 rounded-md bg-[#2DE2FF]/10 border border-[#2DE2FF]/25 hover:bg-[#2DE2FF]/15 text-[#2DE2FF] text-xs font-semibold transition-colors mb-1.5"
                  >
                    Verify wallet
                  </button>
                  {verificationRejected && (
                    <p className="text-[11px] text-zinc-500 text-center mb-2">
                      Verification cancelled. Click above to retry.
                    </p>
                  )}
                </>
              )}
              {isVerifying && (
                <div className="w-full px-3 py-2 rounded-md bg-[#18181b] border border-white/10 text-zinc-400 text-xs font-medium text-center mb-1.5 opacity-70">
                  Verifying…
                </div>
              )}
              {isVerified && (
                <div className="w-full px-3 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium text-center mb-1.5 flex items-center justify-center gap-1.5">
                  <span>✓</span>
                  Verified
                </div>
              )}
              <div className="border-t border-white/[0.06] pt-1.5 mt-1.5">
                <Link href="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-md transition-colors relative">
                  Profile
                  {pendingInvitations > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded bg-[#2DE2FF] text-[#0b0b0d] text-[10px] font-bold">
                      {pendingInvitations > 9 ? '9+' : pendingInvitations}
                    </span>
                  )}
                </Link>
                <Link href="/collections" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-md transition-colors">
                  Collections
                </Link>
                <Link href="/my-mints" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-md transition-colors">
                  Transactions
                </Link>
                <Link href="/transactions" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-md transition-colors">
                  Credit usage
                </Link>
                <Link href="/guide" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-md transition-colors">
                  Guide
                </Link>
                <Link href="/support" onClick={() => setIsOpen(false)} className="block px-3 py-2 text-xs text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] rounded-md transition-colors">
                  Support
                </Link>
              </div>

              <div className="border-t border-white/[0.06] pt-1.5 mt-1.5">
                <button
                  onClick={handleDisconnect}
                  className="w-full px-3 py-2 rounded-md bg-transparent hover:bg-white/[0.04] text-zinc-500 hover:text-zinc-200 text-xs font-medium transition-colors border border-white/[0.08]"
                >
                  Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={handleConnect}
        className="w-full px-4 py-3 rounded-lg bg-[#2DE2FF] hover:bg-[#1BB8D4] text-[#0b0b0d] text-sm font-semibold transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Connect wallet
      </button>
    </div>
  )
}
