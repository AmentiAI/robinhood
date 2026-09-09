'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode, useMemo } from 'react'
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSendTransaction,
  useBalance,
  useSwitchChain,
} from 'wagmi'
import { parseEther, type Hex } from 'viem'
import { getRobinhoodChain } from '@/lib/robinhood/config'

interface EvmWalletState {
  isConnected: boolean
  address: string | null
  error: string | null
  isVerified: boolean
  isVerifying: boolean
  verificationRejected: boolean
}

interface EvmWalletContextType extends EvmWalletState {
  isWalletInstalled: boolean
  connect: () => Promise<boolean>
  disconnect: () => Promise<void>
  sendTransaction: (to: string, amount: number) => Promise<string>
  getBalance: () => Promise<number>
  verifyWallet: () => Promise<boolean>
  signMessage: ((message: string) => Promise<Hex>) | null
  connecting: boolean
  chainId: number | undefined
}

const EvmWalletContext = createContext<EvmWalletContextType | undefined>(undefined)

export function EvmWalletProvider({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId, status } = useAccount()
  const { connectAsync, connectors, isPending: connecting } = useConnect()
  const { disconnectAsync } = useDisconnect()
  const { signMessageAsync } = useSignMessage()
  const { sendTransactionAsync } = useSendTransaction()
  const { switchChainAsync } = useSwitchChain()
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address as `0x${string}` | undefined,
  })

  const [state, setState] = useState<EvmWalletState>({
    isConnected: false,
    address: null,
    error: null,
    isVerified: false,
    isVerifying: false,
    verificationRejected: false,
  })

  const isVerifyingRef = useRef(false)
  const targetChain = getRobinhoodChain()

  const isWalletInstalled =
    typeof window !== 'undefined' && !!(window as any).ethereum

  useEffect(() => {
    const addr = address || null
    const connected = isConnected && !!addr
    setState((prev) => {
      if (prev.address === addr && prev.isConnected === connected) return prev
      let verified = false
      if (typeof window !== 'undefined' && addr) {
        verified = sessionStorage.getItem(`rh_wallet_verified_${addr.toLowerCase()}`) === 'true'
      }
      return {
        ...prev,
        isConnected: connected,
        address: addr,
        isVerified: verified,
        verificationRejected: false,
        error: null,
      }
    })
  }, [address, isConnected])

  const ensureCorrectChain = useCallback(async () => {
    if (chainId !== targetChain.id) {
      try {
        await switchChainAsync({ chainId: targetChain.id })
      } catch (err: any) {
        // Wallet may need user to add the chain manually
        console.warn('[EvmWallet] switchChain failed:', err?.message)
      }
    }
  }, [chainId, switchChainAsync, targetChain.id])

  const verifyWallet = useCallback(async (): Promise<boolean> => {
    if (!address) {
      setState((prev) => ({ ...prev, error: 'Wallet not connected.' }))
      return false
    }
    if (isVerifyingRef.current) return false

    isVerifyingRef.current = true
    setState((prev) => ({ ...prev, isVerifying: true, verificationRejected: false, error: null }))

    try {
      await ensureCorrectChain()
      const message = `Verify wallet: ${address}`
      await signMessageAsync({ message })

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`rh_wallet_verified_${address.toLowerCase()}`, 'true')
        sessionStorage.setItem(`wallet_type_${address.toLowerCase()}`, 'eth')
      }

      setState((prev) => ({
        ...prev,
        isVerified: true,
        isVerifying: false,
        verificationRejected: false,
      }))
      return true
    } catch (err: any) {
      const rejected =
        err?.code === 4001 ||
        err?.message?.toLowerCase?.().includes('user rejected') ||
        err?.message?.toLowerCase?.().includes('denied')
      setState((prev) => ({
        ...prev,
        isVerified: false,
        isVerifying: false,
        verificationRejected: !!rejected,
        error: rejected ? 'Verification rejected' : err?.message || 'Verification failed',
      }))
      return false
    } finally {
      isVerifyingRef.current = false
    }
  }, [address, ensureCorrectChain, signMessageAsync])

  const connect = useCallback(async (): Promise<boolean> => {
    try {
      const preferred =
        connectors.find((c) => c.id === 'metaMask') ||
        connectors.find((c) => c.id === 'injected') ||
        connectors[0]
      if (!preferred) {
        setState((prev) => ({ ...prev, error: 'No wallet connector available' }))
        return false
      }
      await connectAsync({ connector: preferred, chainId: targetChain.id })
      return true
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err?.message || 'Connect failed' }))
      return false
    }
  }, [connectAsync, connectors, targetChain.id])

  const disconnect = useCallback(async () => {
    if (address && typeof window !== 'undefined') {
      sessionStorage.removeItem(`rh_wallet_verified_${address.toLowerCase()}`)
    }
    await disconnectAsync()
    setState({
      isConnected: false,
      address: null,
      error: null,
      isVerified: false,
      isVerifying: false,
      verificationRejected: false,
    })
  }, [address, disconnectAsync])

  const sendTransaction = useCallback(
    async (to: string, amount: number): Promise<string> => {
      await ensureCorrectChain()
      const hash = await sendTransactionAsync({
        to: to as `0x${string}`,
        value: parseEther(String(amount)),
      })
      return hash
    },
    [ensureCorrectChain, sendTransactionAsync]
  )

  const getBalance = useCallback(async (): Promise<number> => {
    const result = await refetchBalance()
    if (result.data) {
      return Number(result.data.formatted)
    }
    return balanceData ? Number(balanceData.formatted) : 0
  }, [refetchBalance, balanceData])

  const signMessageFn = useMemo(() => {
    if (!isConnected) return null
    return async (message: string) => signMessageAsync({ message })
  }, [isConnected, signMessageAsync])

  const value: EvmWalletContextType = {
    ...state,
    isWalletInstalled,
    connect,
    disconnect,
    sendTransaction,
    getBalance,
    verifyWallet,
    signMessage: signMessageFn,
    connecting: connecting || status === 'connecting',
    chainId,
  }

  return <EvmWalletContext.Provider value={value}>{children}</EvmWalletContext.Provider>
}

export function useEvmWallet() {
  const ctx = useContext(EvmWalletContext)
  if (!ctx) throw new Error('useEvmWallet must be used within EvmWalletProvider')
  return ctx
}

/** @deprecated Use useEvmWallet — alias kept for gradual migration */
export const useSolanaWallet = useEvmWallet
export const SolanaWalletProvider = EvmWalletProvider
